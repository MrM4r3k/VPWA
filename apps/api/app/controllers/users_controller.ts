import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { realtimeBus } from '#services/realtime_bus'

export default class UsersController {
  /**
   * Return all users (for now) for group member selection.
   * Protected by auth middleware.
   */
  async index({}: HttpContext) {
    const users = await User.all()

    return {
      users: users.map((u) => ({
        id: u.id,
        name: `${u.name} ${u.surname}`,
        nickName: u.nickName,
        email: u.email,
        status: u.status || 'online',
      })),
    }
  }

  /**
   * Update user status (online/DND/offline)
   */
  async updateStatus({ auth, request, response }: HttpContext) {
    const user = await auth.getUserOrFail()
    const status = request.input('status') as 'online' | 'DND' | 'offline'
    
    if (!['online', 'DND', 'offline'].includes(status)) {
      return response.status(400).json({ message: 'Invalid status' })
    }
    
    user.status = status
    await user.save()
    
    // Broadcast status change to all connected clients
    realtimeBus.emit('user:status:changed', {
      userId: user.id,
      status: user.status,
    })
    
    return { message: 'Status updated', status: user.status }
  }
}



