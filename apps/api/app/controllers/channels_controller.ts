import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'

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
}


