import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import ChannelKick from '#models/channel_kick'
import ChannelBan from '#models/channel_ban'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'
import { realtimeBus } from '#services/realtime_bus'

export default class ChannelsController {
  /**
   * List channels where the authenticated user is a member.
   */
  async index({ auth }: HttpContext) {
    const user = await auth.getUserOrFail()

    // Najprv nacitaj clenstva prihlaseneho pouzivatela
    const memberships = await ChannelMember.query()
      .where('user_id', user.id)

    // Preload member ids for each channel (simple implementation for now)
    const channelIds = memberships.map((m) => m.channelId)
    const allMembers = await ChannelMember.query().whereIn('channel_id', channelIds)

    // Zoskup clenov podla channel_id, aby sme vedeli doplnit memberIds
    const membersByChannel = allMembers.reduce<Record<number, number[]>>((acc, row) => {
      if (!acc[row.channelId]) acc[row.channelId] = []
      acc[row.channelId].push(row.userId)
      return acc
    }, {})

    // Load channel records for all memberships
    // Nacitaj samotne kanaly podla zoznamu channelIds
    const channels = await Channel.query().whereIn('id', channelIds)
    const channelById = new Map<number, Channel>()
    channels.forEach((c) => channelById.set(c.id, c))

    const data = memberships
      .map((m) => {
        const c = channelById.get(m.channelId)
        if (!c) return null

        return {
          id: String(c.id),
          channelName: c.name,
          isPrivate: c.isPrivate,
          ownerId: String(c.ownerId),
          memberIds: (membersByChannel[c.id] || []).map((id) => String(id)),
          unread: m.unreadCount,
          isInvited: m.invitationStatus === 'pending',
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)

    return { channels: data }
  }

  /**
   * List public channels (optionally filtered by search).
   */
  async publicList({ request }: HttpContext) {
    const search = (request.qs().search as string | undefined)?.trim().toLowerCase() || ''

    let query = Channel.query().where('is_private', false)

    if (search) {
      query = query.whereILike('name', `%${search}%`)
    }

    const channels = await query

    const data = channels.map((c) => ({
      id: String(c.id),
      channelName: c.name,
      isPrivate: c.isPrivate,
      ownerId: String(c.ownerId),
      memberIds: [] as string[],
      unread: 0,
      isInvited: false,
    }))

    return { channels: data }
  }

  /**
   * Create a new channel (group) and add members.
   */
  async store({ request, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()

    const payload = request.only(['name', 'isPrivate', 'memberIds'])

    const name = String(payload.name ?? '').trim()
    const isPrivate = Boolean(payload.isPrivate)
    const memberIdsInput = Array.isArray(payload.memberIds) ? payload.memberIds : []

    if (!name) {
      return response.status(422).json({ message: 'Channel name is required' })
    }

    // Check if channel name already exists
    const existingChannel = await Channel.query().where('name', name).first()
    if (existingChannel) {
      return response.status(400).json({ message: 'Channel with this name already exists' })
    }

    // Create channel
    const channel = await Channel.create({
      name,
      isPrivate,
      ownerId: user.id,
    })

    // Ensure creator is in members and role owner
    const memberIdSet = new Set<number>()
    memberIdSet.add(user.id)

    for (const rawId of memberIdsInput) {
      const idNum = Number(rawId)
      if (Number.isFinite(idNum) && idNum > 0) {
        memberIdSet.add(idNum)
      }
    }

    const membersToCreate: Partial<ChannelMember>[] = []

    for (const memberId of memberIdSet) {
      membersToCreate.push({
        channelId: channel.id,
        userId: memberId,
        role: memberId === user.id ? 'owner' : 'member',
        // Vlastnik je hned accepted, ostatni idu ako pending (pozvanka)
        invitationStatus: memberId === user.id ? 'accepted' : 'pending',
        unreadCount: 0,
      })
    }

    await ChannelMember.createMany(membersToCreate)

    // Broadcast refresh to all members
    for (const memberId of memberIdSet) {
      realtimeBus.emit('channel:refresh', { userId: memberId })
    }

    return response.status(201).json({
      channel: {
        id: String(channel.id),
        channelName: channel.name,
        isPrivate: channel.isPrivate,
        ownerId: String(channel.ownerId),
        memberIds: Array.from(memberIdSet).map((id) => String(id)),
        unread: 0,
        isInvited: false,
      },
    })
  }

  /**
   * Akceptuj pozvanku do kanala.
   */
  async acceptInvite({ params, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const channelId = Number(params.channelId)

    const membership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .first()

    if (!membership) {
      return response.status(404).json({ message: 'Invitation not found' })
    }

    if (membership.invitationStatus !== 'pending') {
      return response.status(400).json({ message: 'Invitation is not pending' })
    }

    membership.invitationStatus = 'accepted'
    await membership.save()

    // Broadcast refresh to user who accepted
    realtimeBus.emit('channel:refresh', { userId: user.id })

    return { message: 'Invitation accepted' }
  }

  /**
   * Odmietni pozvanku do kanala (odstrani clenstvo).
   */
  async rejectInvite({ params, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const channelId = Number(params.channelId)

    const membership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .first()

    if (!membership) {
      return response.status(404).json({ message: 'Invitation not found' })
    }

    if (membership.invitationStatus !== 'pending') {
      return response.status(400).json({ message: 'Invitation is not pending' })
    }

    await membership.delete()

    // Broadcast refresh to user who rejected
    realtimeBus.emit('channel:refresh', { userId: user.id })

    return { message: 'Invitation rejected' }
  }

  /**
   * Odchod z kanala (odstrani clenstvo). 
   * Ak je to owner, kanal sa zmaze (podla zadania: /cancel pre owner = zrusenie kanala).
   */
  async leave({ params, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const channelId = Number(params.channelId)

    // Zistime kanal a clenstvo
    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.status(404).json({ message: 'Channel not found' })
    }

    if (channel.ownerId === user.id) {
      // Owner moze odist kedykolvek - kanal sa zmaze (cascade zrusi aj clenstva)
      // Get all members before deletion
      const allMembers = await ChannelMember.query()
        .where('channel_id', channelId)
        .select('user_id')
      const memberIds = allMembers.map(m => m.userId)
      
      await channel.delete()
      
      // Broadcast refresh to all former members
      for (const memberId of memberIds) {
        realtimeBus.emit('channel:refresh', { userId: memberId })
      }
      
      return { message: 'Channel deleted because the owner left' }
    }

    const membership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .first()

    if (!membership) {
      return response.status(404).json({ message: 'Membership not found' })
    }

    await membership.delete()

    // Broadcast refresh to user who left
    realtimeBus.emit('channel:refresh', { userId: user.id })

    return { message: 'Left channel' }
  }

  /**
   * Promote member to owner (current owner only). Command: /promote <nick>
   */
  async promote({ params, auth, request, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const channelId = Number(params.channelId)
    const rawNick =
      request.input('nick') ?? request.input('nickname') ?? request.input('nickName') ?? ''
    const nick = String(rawNick).trim()

    if (!nick) {
      return response.status(422).json({ message: 'Nickname is required' })
    }

    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.status(404).json({ message: 'Channel not found' })
    }

    if (channel.ownerId !== user.id) {
      return response.status(403).json({ message: 'Only owner can promote another member' })
    }

    const targetUser = await User.query().where('nick_name', nick).first()
    if (!targetUser) {
      return response.status(404).json({ message: 'User with this nickname not found' })
    }

    if (targetUser.id === user.id) {
      return response.status(400).json({ message: 'You are already the owner' })
    }

    const targetMembership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', targetUser.id)
      .first()

    if (!targetMembership) {
      return response.status(400).json({ message: 'User is not a member of this channel' })
    }

    const currentOwnerMembership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .first()

    await db.transaction(async (trx) => {
      channel.useTransaction(trx)
      targetMembership.useTransaction(trx)
      currentOwnerMembership?.useTransaction(trx)

      channel.ownerId = targetUser.id
      await channel.save()

      targetMembership.role = 'owner'
      await targetMembership.save()

      if (currentOwnerMembership) {
        currentOwnerMembership.role = 'member'
        await currentOwnerMembership.save()
      }
    })

    return { message: 'Ownership transferred' }
  }

  /**
   * Kick member from channel. Command: /kick <nick>
   * - V public kanálech: jakýkoliv člen může kickovat
   * - Po 3 kickech od různých členů = trvalý ban
   * - Owner může kickovat "natrvalo" kdykoliv
   */
  async kick({ params, auth, request, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const channelId = Number(params.channelId)
    const rawNick =
      request.input('nick') ?? request.input('nickname') ?? request.input('nickName') ?? ''
    const nick = String(rawNick).trim()

    if (!nick) {
      return response.status(422).json({ message: 'Nickname is required' })
    }

    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.status(404).json({ message: 'Channel not found' })
    }

    const targetUser = await User.query().where('nick_name', nick).first()
    if (!targetUser) {
      return response.status(404).json({ message: 'User with this nickname not found' })
    }

    if (targetUser.id === user.id) {
      return response.status(400).json({ message: 'You cannot kick yourself' })
    }

    // Check if user is a member of the channel
    const userMembership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .where('invitation_status', 'accepted')
      .first()

    if (!userMembership) {
      return response.status(403).json({ message: 'You are not a member of this channel' })
    }

    const targetMembership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', targetUser.id)
      .first()

    if (!targetMembership) {
      return response.status(400).json({ message: 'User is not a member of this channel' })
    }

    const isOwner = channel.ownerId === user.id

    // Check if target is banned
    const existingBan = await ChannelBan.query()
      .where('channel_id', channelId)
      .where('user_id', targetUser.id)
      .first()

    if (existingBan && !isOwner) {
      return response.status(400).json({ message: 'User is already banned from this channel' })
    }

    // In private channels, only owner can kick
    if (channel.isPrivate && !isOwner) {
      return response.status(403).json({ message: 'Only owner can kick members in private channels' })
    }

    // If owner kicks, it's permanent ban (owner can kick anytime, even if already banned)
    if (isOwner) {
      // Track the kick
      await ChannelKick.create({
        channelId,
        kickedUserId: targetUser.id,
        kickedByUserId: user.id,
      })
      
      // Remove membership
      await targetMembership.delete()
      
      // Create permanent ban if not already banned
      if (!existingBan) {
        await ChannelBan.create({
          channelId,
          userId: targetUser.id,
        })
      }
      return { message: 'Member permanently banned' }
    }

    // In public channels, any member can kick
    // But first check if user is already banned (non-owners can't kick banned users)
    if (existingBan) {
      return response.status(400).json({ message: 'User is already banned from this channel' })
    }

    // Track the kick
    await ChannelKick.create({
      channelId,
      kickedUserId: targetUser.id,
      kickedByUserId: user.id,
    })

    // In public channels, check if 3 different members have kicked this user
    // Get unique kickers (distinct kicked_by_user_id) - including the current kick
    const uniqueKickersResult = await db
      .from('channel_kicks')
      .where('channel_id', channelId)
      .where('kicked_user_id', targetUser.id)
      .select('kicked_by_user_id')
      .distinct('kicked_by_user_id')

    const uniqueKickerCount = uniqueKickersResult.length

    if (uniqueKickerCount >= 3) {
      // Permanent ban after 3 different members kick
      await targetMembership.delete()
      await ChannelBan.create({
        channelId,
        userId: targetUser.id,
      })
      
      // Broadcast refresh to banned user
      realtimeBus.emit('channel:refresh', { userId: targetUser.id })
      
      return { message: 'Member permanently banned (3 kicks from different members)' }
    }

      // Just remove membership (temporary kick)
      await targetMembership.delete()
      
      // Broadcast refresh to kicked user
      realtimeBus.emit('channel:refresh', { userId: targetUser.id })
      
      return { message: 'Member removed' }
  }

  /**
   * Join or create channel. Command: /join channelName [private]
   */
  async join({ request, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const channelName = String(request.input('channelName') ?? '').trim()
    const isPrivate = Boolean(request.input('private') ?? request.input('isPrivate') ?? false)

    if (!channelName) {
      return response.status(422).json({ message: 'Channel name is required' })
    }

    // Check if channel exists
    let channel = await Channel.query().where('name', channelName).first()

    if (channel) {
      // Channel exists - join it
      // Check if user is banned
      const ban = await ChannelBan.query()
        .where('channel_id', channel.id)
        .where('user_id', user.id)
        .first()

      if (ban) {
        return response.status(403).json({ message: 'You are banned from this channel' })
      }

      // Check if already a member
      const existingMembership = await ChannelMember.query()
        .where('channel_id', channel.id)
        .where('user_id', user.id)
        .first()

      if (existingMembership) {
        return response.status(400).json({ message: 'You are already a member of this channel' })
      }

      // For private channels, only owner can add members
      if (channel.isPrivate) {
        return response.status(403).json({ message: 'This is a private channel. You need an invitation.' })
      }

      // Join public channel
      await ChannelMember.create({
        channelId: channel.id,
        userId: user.id,
        role: 'member',
        invitationStatus: 'accepted',
        unreadCount: 0,
      })

      // Broadcast refresh to user who joined
      console.log(`[ChannelsController] Join: Emitting channel:refresh for user ${user.id}`)
      realtimeBus.emit('channel:refresh', { userId: user.id })

      return { message: 'Joined channel', channelId: String(channel.id) }
    } else {
      // Channel doesn't exist - create it
      channel = await Channel.create({
        name: channelName,
        isPrivate,
        ownerId: user.id,
      })

      // Add creator as owner
      await ChannelMember.create({
        channelId: channel.id,
        userId: user.id,
        role: 'owner',
        invitationStatus: 'accepted',
        unreadCount: 0,
      })

      // Broadcast refresh to creator
      realtimeBus.emit('channel:refresh', { userId: user.id })

      return response.status(201).json({
        message: 'Channel created',
        channelId: String(channel.id),
      })
    }
  }

  /**
   * Invite user to channel. Command: /invite nickName
   * - Private channels: only owner can invite
   * - Public channels: any member can invite
   */
  async invite({ params, auth, request, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const channelId = Number(params.channelId)
    const rawNick =
      request.input('nick') ?? request.input('nickname') ?? request.input('nickName') ?? ''
    const nick = String(rawNick).trim()

    if (!nick) {
      return response.status(422).json({ message: 'Nickname is required' })
    }

    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.status(404).json({ message: 'Channel not found' })
    }

    // Check if user is a member
    const userMembership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .where('invitation_status', 'accepted')
      .first()

    if (!userMembership) {
      return response.status(403).json({ message: 'You are not a member of this channel' })
    }

    // For private channels, only owner can invite
    if (channel.isPrivate && channel.ownerId !== user.id) {
      return response.status(403).json({ message: 'Only owner can invite to private channels' })
    }

    const targetUser = await User.query().where('nick_name', nick).first()
    if (!targetUser) {
      return response.status(404).json({ message: 'User with this nickname not found' })
    }

    if (targetUser.id === user.id) {
      return response.status(400).json({ message: 'You cannot invite yourself' })
    }

    // Check if user is banned
    const ban = await ChannelBan.query()
      .where('channel_id', channelId)
      .where('user_id', targetUser.id)
      .first()

    if (ban) {
      // Owner can unban by inviting
      if (channel.ownerId === user.id) {
        await ban.delete()
      } else {
        return response.status(403).json({ message: 'User is banned from this channel' })
      }
    }

    // Check if already a member
    const existingMembership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', targetUser.id)
      .first()

    if (existingMembership) {
      if (existingMembership.invitationStatus === 'pending') {
        return response.status(400).json({ message: 'User already has a pending invitation' })
      }
      return response.status(400).json({ message: 'User is already a member of this channel' })
    }

    // Create invitation
    await ChannelMember.create({
      channelId,
      userId: targetUser.id,
      role: 'member',
      invitationStatus: 'pending',
      unreadCount: 0,
    })

    // Broadcast refresh to invited user
    console.log(`[ChannelsController] Invite: Emitting channel:refresh for user ${targetUser.id}`)
    realtimeBus.emit('channel:refresh', { userId: targetUser.id })

    return { message: 'Invitation sent' }
  }

  /**
   * Revoke user from private channel. Command: /revoke nickName
   * Only owner can revoke from private channels
   */
  async revoke({ params, auth, request, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const channelId = Number(params.channelId)
    const rawNick =
      request.input('nick') ?? request.input('nickname') ?? request.input('nickName') ?? ''
    const nick = String(rawNick).trim()

    if (!nick) {
      return response.status(422).json({ message: 'Nickname is required' })
    }

    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.status(404).json({ message: 'Channel not found' })
    }

    if (!channel.isPrivate) {
      return response.status(400).json({ message: 'Revoke is only available for private channels' })
    }

    if (channel.ownerId !== user.id) {
      return response.status(403).json({ message: 'Only owner can revoke members from private channels' })
    }

    const targetUser = await User.query().where('nick_name', nick).first()
    if (!targetUser) {
      return response.status(404).json({ message: 'User with this nickname not found' })
    }

    if (targetUser.id === user.id) {
      return response.status(400).json({ message: 'Owner cannot revoke themselves' })
    }

    const membership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', targetUser.id)
      .first()

    if (!membership) {
      return response.status(400).json({ message: 'User is not a member of this channel' })
    }

    await membership.delete()

    // Broadcast refresh to revoked user
    realtimeBus.emit('channel:refresh', { userId: targetUser.id })

    return { message: 'Member removed' }
  }

  /**
   * Quit channel (delete channel). Command: /quit
   * Only owner can quit (delete) channel
   */
  async quit({ params, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const channelId = Number(params.channelId)

    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.status(404).json({ message: 'Channel not found' })
    }

    if (channel.ownerId !== user.id) {
      return response.status(403).json({ message: 'Only owner can quit (delete) channel' })
    }

    // Get all members before deletion
    const allMembers = await ChannelMember.query()
      .where('channel_id', channelId)
      .select('user_id')
    const memberIds = allMembers.map(m => m.userId)

    await channel.delete()

    // Broadcast refresh to all former members
    for (const memberId of memberIds) {
      realtimeBus.emit('channel:refresh', { userId: memberId })
    }

    return { message: 'Channel deleted' }
  }
}


