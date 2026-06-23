import { randomUUID } from 'node:crypto'
import { saveTimelineGraph, getTimelineGraphById } from '../services/timelineGraph.js'
import { db } from '../db/index.js'
import { timelines } from '../db/schema.js'

const id = randomUUID()
const now = new Date()

db.insert(timelines)
  .values({
    id,
    title: 'Script Test',
    viewport: null,
    graphJson: { nodes: [], edges: [], viewport: null },
    createdAt: now,
    updatedAt: now,
  })
  .run()

const result = await saveTimelineGraph(id, {
  nodes: [
    {
      id: 'n1',
      type: 'book',
      position: { x: 10, y: 20 },
      data: { mediaType: 'book', title: 'Script Book' },
    },
  ],
  edges: [],
})

console.log('save result nodes', result?.nodes.length ?? 0)

const loaded = await getTimelineGraphById(id)
console.log('loaded nodes', loaded?.nodes.length ?? 0)

if (!result || result.nodes.length !== 1 || !loaded || loaded.nodes.length !== 1) {
  process.exitCode = 1
}
