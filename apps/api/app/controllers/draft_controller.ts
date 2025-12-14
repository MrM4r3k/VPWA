import type { HttpContext } from '@adonisjs/core/http'
import ChannelMember from '#models/channel_member'
import User from '#models/user'
import { realtimeBus } from '#services/realtime_bus'

export default class DraftController {
  /**
   * Receive draft text updates and broadcast them to channel subscribers.
   */
  async update({ params, request, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const channelId = Number(params.channelId)

    if (!Number.isFinite(channelId)) {
      return response.status(400).json({ message: 'Invalid channel id' })
    }

    // Only accepted members can update draft
    const membership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .where('invitation_status', 'accepted')
      .first()

    if (!membership) {
      return response.status(403).json({ message: 'You are not a member of this channel' })
    }

    const text = String(request.input('text') ?? '')

    if (text.length > 4000) {
      return response.status(422).json({ message: 'Draft is too long (max 4000 chars)' })
    }

    const actor = await User.find(user.id)

    realtimeBus.emit('draft:update', {
      channelId,
      userId: user.id,
      nickName: actor?.nickName ?? 'unknown',
      text,
    })

    return { ok: true }
  }
}
