import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sessionMiddleware, type AppEnv } from './auth/middleware'
import { authRouter } from './routes/auth'
import { timelinesRouter } from './routes/timelines'

const app = new Hono<AppEnv>()

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
)

app.use('*', sessionMiddleware)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: err.message || 'Internal server error' }, 500)
})

app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/auth', authRouter)
app.route('/timelines', timelinesRouter)

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, () => {
  console.log(`API running at http://localhost:${port}`)
})
