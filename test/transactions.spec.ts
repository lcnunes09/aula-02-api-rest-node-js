import { it, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'

describe('Transactions routes', () => {
    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(() => {
        execSync('npm run knex migrate:rollback --all')
        execSync('npm run knex migrate:latest')
    })

    it('should be able to create a new transaction', async () => {
        const response = await request(app.server)
            .post('/transactions')
            .send({
                title: 'New deposit transaction',
                amount: 5000,
                type: 'deposit',
            })
            .expect(201)
    })

    it('should be able to list all transactions', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'New deposit transaction',
                amount: 500,
                type: 'deposit'
            })
    
        const cookies = createTransactionResponse.get('Set-Cookie')
    
        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200)

        expect(listTransactionsResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: 'New deposit transaction',
                amount: 500,
            }),
        ])
    })

    it('should be able to get a specific transaction', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'New deposit transaction',
                amount: 500,
                type: 'deposit'
            })
    
        const cookies = createTransactionResponse.get('Set-Cookie')
    
        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies)
            .expect(200)
    
        const transactionId = listTransactionsResponse.body.transactions[0].id
    
        const getTransactionResponse = await request(app.server)
            .get(`/transactions/${transactionId}`)
            .set('Cookie', cookies)
            .expect(200)
    
        expect(getTransactionResponse.body.transaction).toEqual(
            expect.objectContaining({
                title: 'New deposit transaction',
                amount: 500,
            }),
        )
    })

    it('should be able to get the account balance', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'New deposit transaction',
                amount: 500,
                type: 'deposit'
            })
    
        const cookies = createTransactionResponse.get('Set-Cookie')
    
        await request(app.server)
            .post('/transactions')
            .set('Cookie', cookies)
            .send({
                title: 'New withdrawal transaction',
                amount: 200,
                type: 'withdrawal'
            })
    
        const accountBalanceResponse = await request(app.server)
            .get('/transactions/account-balance')
            .set('Cookie', cookies)
            .expect(200)
    
        expect(accountBalanceResponse.body.balance).toEqual({
            total: 300
        })
    })
})