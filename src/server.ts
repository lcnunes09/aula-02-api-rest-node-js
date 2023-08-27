import fastify from 'fastify'
import { knex } from './database'
import { env } from './env' 

import crypto from 'node:crypto'

const app = fastify()

app.get('/hello', async () => {
    const transaction = await knex('transactions').insert({
        id: crypto.randomUUID(),
        title: 'Título',
        amount: 1000,
    }).returning('*')

    return transaction
})

app.listen({
    port: env.PORT,
}).then(() => {
    console.log('HTTP Server Running')
})