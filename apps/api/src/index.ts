import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { timelinesRouter } from './routes/timelines'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  }),
)

app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/timelines', timelinesRouter)

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, () => {
  console.log(`API running at http://localhost:${port}`)
})
