import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { knex } from '../database'

export async function transactionsRoutes(app: FastifyInstance) {
    app.get('/', async () => {
        const transactions = await knex('transactions').select()

        return {
            transactions
        }
    })

    app.get('/:id', async (request) => {
        const getTransactionParamsSchema = z.object({
            id: z.string().uuid(),
        })

        const { id } = getTransactionParamsSchema.parse(request.params)

        const transaction = await knex('transactions').where('id', id).first()

        return {
            transaction
        }
    })

    app.get('/account-balance', async () => {
        const balance = await knex('transactions').sum('amount', { as: 'total' }).first()
    
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

        await knex('transactions')
            .insert({
                id: randomUUID(),
                title,
                amount: type === 'deposit' ? amount : amount * -1,
            })

        return reply.status(201).send()
    })
}