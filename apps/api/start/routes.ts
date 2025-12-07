/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')
const ChannelsController = () => import('#controllers/channels_controller')
const UsersController = () => import('#controllers/users_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// Public auth routes
router.group(() => {
  router.post('/register', [AuthController, 'register'])
  router.post('/login', [AuthController, 'login'])
}).prefix('/api/auth')

// Protected auth routes
router
  .group(() => {
    router.post('/logout', [AuthController, 'logout'])
    router.get('/me', [AuthController, 'me'])
  })
  .prefix('/api/auth')
  .use(middleware.auth())

// Channels (protected)
router
  .group(() => {
    router.get('/channels', [ChannelsController, 'index'])
    router.get('/channels/public', [ChannelsController, 'publicList'])
    router.post('/channels', [ChannelsController, 'store'])
    router.post('/channels/join', [ChannelsController, 'join'])
    router.post('/channels/:channelId/accept', [ChannelsController, 'acceptInvite'])
    router.post('/channels/:channelId/reject', [ChannelsController, 'rejectInvite'])
    router.post('/channels/:channelId/leave', [ChannelsController, 'leave'])
    router.post('/channels/:channelId/cancel', [ChannelsController, 'leave']) // Alias for /leave
    router.post('/channels/:channelId/quit', [ChannelsController, 'quit'])
    router.post('/channels/:channelId/promote', [ChannelsController, 'promote'])
    router.post('/channels/:channelId/kick', [ChannelsController, 'kick'])
    router.post('/channels/:channelId/invite', [ChannelsController, 'invite'])
    router.post('/channels/:channelId/revoke', [ChannelsController, 'revoke'])
  })
  .prefix('/api')
  .use(middleware.auth())

// Users (protected)
router
  .group(() => {
    router.get('/users', [UsersController, 'index'])
  })
  .prefix('/api')
  .use(middleware.auth())
