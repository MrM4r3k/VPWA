import type { HttpContext } from '@adonisjs/core/http'
import ChannelMember from '#models/channel_member'
import { realtimeBus } from '#services/realtime_bus'
import User from '#models/user'

export default class TypingController {
  /**
   * Notify channel that user is typing (ephemeral).
   */
  async notify({ params, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const channelId = Number(params.channelId)
    if (!Number.isFinite(channelId)) {
      return response.status(400).json({ message: 'Invalid channel id' })
    }

    // Only accepted members can send typing
    const membership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .where('invitation_status', 'accepted')
      .first()

    if (!membership) {
      return response.status(403).json({ message: 'You are not a member of this channel' })
    }

    const actor = await User.find(user.id)
    realtimeBus.emit('typing', {
      channelId,
      userId: user.id,
      nickName: actor?.nickName ?? 'unknown',
    })

    return { ok: true }
  }
}

