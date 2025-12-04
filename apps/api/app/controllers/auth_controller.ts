import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { registerValidator } from '#validators/register_validator'
import { loginValidator } from '#validators/login_validator'

export default class AuthController {

    //Register a new user
    async register({ request, response }: HttpContext) {
        const payload = await request.validateUsing(registerValidator)

        // Check if email or nickname already exists
        const existingUser = await User.query()
            .where('email', payload.email)
            // DB column is "nick_name" (snake_case)
            .orWhere('nick_name', payload.nickname)
            .first()

        if (existingUser) {
            return response.status(400).json({
                message: 'User with this email or nickname already exists',
            })
        }

        // Create new user
        const user = await User.create({
            name: payload.name,
            surname: payload.surname,
            nickName: payload.nickname,
            email: payload.email,
            password: payload.password,
        })

        // Generate token
        const token = await User.accessTokens.create(user)

        return response.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                surname: user.surname,
                nickName: user.nickName,
                email: user.email,
            },
            token: {
                type: 'bearer',
                token: token.value!.release(),
            },
        })
    }

    //Login user
    async login({ request, response }: HttpContext) {
        const { email, password } = await request.validateUsing(loginValidator)

        try {
            const user = await User.verifyCredentials(email, password)
            const token = await User.accessTokens.create(user)

            return response.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    name: user.name,
                    surname: user.surname,
                    nickName: user.nickName,
                    email: user.email,
                },
                token: {
                    type: 'bearer',
                    token: token.value!.release(),
                },
            })
        } catch {
            return response.status(401).json({
                message: 'Invalid credentials',
            })
        }
    }

    //Logout user
    async logout({ auth, response }: HttpContext) {
        const user = auth.getUserOrFail()
        const token = auth.user!.currentAccessToken

        if (token) {
            await User.accessTokens.delete(user, token.identifier)
        }

        return response.json({
            message: 'Logout successful',
        })
    }

    //Get current authenticated user

    async me({ auth, response }: HttpContext) {
        const user = auth.getUserOrFail()

        return response.json({
            user: {
                id: user.id,
                name: user.name,
                surname: user.surname,
                nickName: user.nickName,
                email: user.email,
            },
        })
    }
}

