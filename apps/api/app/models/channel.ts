import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'


export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column({ columnName: 'is_private' })
  declare isPrivate: boolean

  @column({ columnName: 'owner_id' })
  declare ownerId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime({ columnName: 'last_message_at' })
  declare lastMessageAt: DateTime | null
}



