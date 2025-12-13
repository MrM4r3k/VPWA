import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class CleanupInactiveChannels extends BaseCommand {
  static commandName = 'cleanup:inactive-channels'
  static description = 'Delete channels inactive for more than 30 days'
  static options: CommandOptions = {
    startApp: true
  }

  async run() {
    const thirtyDaysAgo = DateTime.now().minus({ days: 30 })

    // Najprv zisti, ktoré kanály sa budú mazať
    const channelsToDelete = await db
      .from('channels')
      .where((query) => {
        query
          // Kanál nemá žiadnu správu A bol vytvorený pred viac ako 30 dňami
          .where((subQuery) => {
            subQuery
              .whereNull('last_message_at')
              .where('created_at', '<', thirtyDaysAgo.toSQL())
          })
          // ALEBO má poslednú správu staršiu ako 30 dní
          .orWhere('last_message_at', '<', thirtyDaysAgo.toSQL())
      })
      .select('id', 'name', 'created_at', 'last_message_at')

    if (channelsToDelete.length === 0) {
      this.logger.info('No inactive channels found')
      return
    }

    // Vypiš ich
    for (const channel of channelsToDelete) {
      this.logger.info(`Will delete channel: ${channel.name} (ID: ${channel.id})`)
    }

    // Zmaž ich
    const deletedCount = await db
      .from('channels')
      .where((query) => {
        query
          .where((subQuery) => {
            subQuery
              .whereNull('last_message_at')
              .where('created_at', '<', thirtyDaysAgo.toSQL())
          })
          .orWhere('last_message_at', '<', thirtyDaysAgo.toSQL())
      })
      .delete()

    this.logger.success(`✓ Cleaned up ${deletedCount} inactive channel(s)`)
  }
}