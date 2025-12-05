import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ChannelMember extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  // Referencia na kanal
  @column({ columnName: 'channel_id' })
  declare channelId: number

  // Referencia na pouzivatela
  @column({ columnName: 'user_id' })
  declare userId: number

  // Rola v kanali (owner / member)
  @column()
  declare role: string

  // Stav pozvanky (accepted/pending/declined)
  @column({ columnName: 'invitation_status' })
  declare invitationStatus: string

  // Pocet neprecitanych sprav pre tohto clena
  @column({ columnName: 'unread_count' })
  declare unreadCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}


