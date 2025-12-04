import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

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
      })),
    }
  }
}


