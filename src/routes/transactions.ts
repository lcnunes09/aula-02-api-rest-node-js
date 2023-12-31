import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
    app.get('/', {
        preHandler: [checkSessionIdExists],
    }, async (request) => {
        const { sessionId } = request.cookies
    
        const transactions = await knex('transactions')
            .where('session_id', sessionId)
            .select()
    
        return {
            transactions
        }
    })

    app.get('/:id',  {
        preHandler: [checkSessionIdExists],
    }, async (request) => {
        const getTransactionParamsSchema = z.object({
            id: z.string().uuid(),
        })

        const { id } = getTransactionParamsSchema.parse(request.params)

        const { sessionId } = request.cookies

        const transaction = await knex('transactions')
            .where({
                session_id: sessionId,
                id
            })
            .first()

        return {
            transaction
        }
    })

    app.get('/account-balance', {
        preHandler: [checkSessionIdExists],
    }, async (request) => {
        const { sessionId } = request.cookies
    
        const balance = await knex('transactions')
            .where('session_id', sessionId)
            .sum('amount', { as: 'total' })
            .first()
    
        return {
            balance
        }
    })

    app.post('/', async (request, reply) => {
        const createTransactionBodySchema = z.object({
            title: z.string(),
            amount: z.number(),
            type: z.enum(['deposit', 'withdrawal']),
        })

        const { title, amount, type } = createTransactionBodySchema.parse(request.body)

        let sessionId = request.cookies.sessionIdr

        if (!sessionId) {
            sessionId = randomUUID()

            reply.cookie('sessionId', sessionId, {
                path: '/',
                maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
            })
        }

        await knex('transactions').insert({
            id: randomUUID(),
            title,
            amount: type === 'deposit' ? amount : amount * -1,
            session_id: sessionId
        })

        return reply.status(201).send()
    })
}