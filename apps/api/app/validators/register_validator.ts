import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
    vine.object({
        name: vine.string().minLength(2),
        surname: vine.string().minLength(2),
        nickname: vine.string().minLength(2),
        email: vine.string().email().normalizeEmail(),
        password: vine.string().minLength(6),
    })
)

