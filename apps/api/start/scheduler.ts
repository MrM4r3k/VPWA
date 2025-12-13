import scheduler from 'adonisjs-scheduler/services/main'

// Spustí cleanup každý deň o 3:00 ráno
scheduler
    .command('cleanup:inactive-channels')
    .dailyAt('3:00')