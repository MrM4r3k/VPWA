import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Channel from '#models/channel'
import User from '#models/user'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'channel_id' })
  declare channelId: number

  @column({ columnName: 'author_id' })
  declare authorId: number

  // Raw text of the message
  @column()
  declare text: string

  // If the message directly mentions one user (first @nick)
  @column({ columnName: 'mention_user_id' })
  declare mentionUserId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Channel)
  declare channel: any

  @belongsTo(() => User, { foreignKey: 'authorId' })
  declare author: any

  @belongsTo(() => User, { foreignKey: 'mentionUserId' })
  declare mentionUser: any
}

