import { Router } from 'express'

export const healthRouter = Router()

// GET /api/health : l'API répond-elle ?
healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})
