import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import User from '#models/user'
import db from '@adonisjs/lucid/services/db'

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

    return { message: 'Invitation rejected' }
  }

  /**
   * Odchod z kanala (odstrani clenstvo). Ownerovi to nedovolime.
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
      // Owner moze odist len ak je v kanali sam; ak je sam, kanal rovno zmazeme
      const memberCount = await ChannelMember.query().where('channel_id', channelId).count('* as total')
      const total = Number(memberCount[0].$extras.total || 0)
      if (total > 1) {
        return response.status(400).json({ message: 'Owner cannot leave while other members are still in the channel' })
      }
      // Je tam sam -> vymazeme cely kanal (cascade zrusi aj clenstva)
      await channel.delete()
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
   * Kick member from channel (only owner). Command: /kick <nick>
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

    if (channel.ownerId !== user.id) {
      return response.status(403).json({ message: 'Only owner can kick members' })
    }

    const targetUser = await User.query().where('nick_name', nick).first()
    if (!targetUser) {
      return response.status(404).json({ message: 'User with this nickname not found' })
    }

    if (targetUser.id === user.id) {
      return response.status(400).json({ message: 'Owner cannot kick themselves' })
    }

    const membership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', targetUser.id)
      .first()

    if (!membership) {
      return response.status(400).json({ message: 'User is not a member of this channel' })
    }

    await membership.delete()

    return { message: 'Member removed' }
  }
}


