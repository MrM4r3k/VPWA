import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelMember from '#models/channel_member'
import ChannelBan from '#models/channel_ban'
import Message from '#models/message'
import User from '#models/user'
import { realtimeBus } from '#services/realtime_bus'

function clampLimit(raw: unknown, fallback = 20, max = 50): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(Math.floor(n), max)
}

function extractFirstMentionNick(text: string): string | null {
  // Match first @nick (letters, numbers, underscore, dash)
  const match = text.match(/@([a-zA-Z0-9_\-]+)/)
  return match ? match[1] : null
}

export default class MessagesController {
  /**
   * List messages for a channel with cursor pagination (newest first).
   * Query params: cursor (message id of last item from previous page), limit (default 20, max 50)
   */
  async index({ params, request, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const channelId = Number(params.channelId)
    if (!Number.isFinite(channelId)) {
      return response.status(400).json({ message: 'Invalid channel id' })
    }

    // Verify channel exists and user is accepted member
    const membership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .where('invitation_status', 'accepted')
      .first()

    if (!membership) {
      return response.status(403).json({ message: 'You are not a member of this channel' })
    }

    const limit = clampLimit(request.qs().limit ?? request.input('limit'))
    const cursorRaw = request.qs().cursor ?? request.input('cursor')
    const cursor = Number(cursorRaw)

    const query = Message.query()
      .where('channel_id', channelId)
      .orderBy('id', 'desc')
      .limit(limit)

    if (Number.isFinite(cursor)) {
      query.where('id', '<', cursor)
    }

    const messages = await query.preload('author').preload('mentionUser')

    const data = messages.map((m) => ({
      id: String(m.id),
      channelId: String(m.channelId),
      text: m.text,
      createdAt: m.createdAt?.toISO(),
      author: m.author
        ? {
            id: String(m.author.id),
            name: m.author.name,
            surname: m.author.surname,
            nickName: m.author.nickName,
          }
        : null,
      mentionUserId: m.mentionUserId ? String(m.mentionUserId) : null,
      isMentionForMe: m.mentionUserId === user.id,
    }))

    const nextCursor =
      messages.length === limit ? String(messages[messages.length - 1].id) : null

    return { messages: data, nextCursor }
  }

  /**
   * Send a message to a channel.
   */
  async store({ params, request, auth, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const channelId = Number(params.channelId)
    if (!Number.isFinite(channelId)) {
      return response.status(400).json({ message: 'Invalid channel id' })
    }

    const channel = await Channel.find(channelId)
    if (!channel) {
      return response.status(404).json({ message: 'Channel not found' })
    }

    // Must be accepted member
    const membership = await ChannelMember.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .where('invitation_status', 'accepted')
      .first()

    if (!membership) {
      return response.status(403).json({ message: 'You are not a member of this channel' })
    }

    // Not banned
    const ban = await ChannelBan.query()
      .where('channel_id', channelId)
      .where('user_id', user.id)
      .first()
    if (ban) {
      return response.status(403).json({ message: 'You are banned from this channel' })
    }

    const rawText = String(request.input('text') ?? '').trim()
    if (!rawText) {
      return response.status(422).json({ message: 'Message text is required' })
    }
    if (rawText.length > 4000) {
      return response.status(422).json({ message: 'Message is too long (max 4000 chars)' })
    }

    // Mention detection
    let mentionUserId: number | null = null
    const mentionedNick = extractFirstMentionNick(rawText)
    if (mentionedNick) {
      const target = await User.query().where('nick_name', mentionedNick).first()
      if (target) {
        mentionUserId = target.id
      }
    }

    const message = await Message.create({
      channelId,
      authorId: user.id,
      text: rawText,
      mentionUserId,
    })

    await message.load('author')

    // Broadcast to websocket subscribers
    realtimeBus.emit('message:new', {
      channelId,
      message: {
        id: String(message.id),
        channelId: String(message.channelId),
        text: message.text,
        createdAt: message.createdAt?.toISO(),
        author: {
          id: String(message.author.id),
          name: message.author.name,
          surname: message.author.surname,
          nickName: message.author.nickName,
        },
        mentionUserId: mentionUserId ? String(mentionUserId) : null,
      },
    })

    return response.status(201).json({
      message: {
        id: String(message.id),
        channelId: String(message.channelId),
        text: message.text,
        createdAt: message.createdAt?.toISO(),
        author: {
          id: String(message.author.id),
          name: message.author.name,
          surname: message.author.surname,
          nickName: message.author.nickName,
        },
        mentionUserId: mentionUserId ? String(mentionUserId) : null,
        isMentionForMe: mentionUserId === user.id,
      },
    })
  }
}

