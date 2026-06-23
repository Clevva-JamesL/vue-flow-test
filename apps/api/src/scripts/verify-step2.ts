/**
 * Step 2 integration checks for normalized timeline persistence.
 */
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { mediaItems, timelineEdges, timelineNodes, timelines } from '../db/schema.js'
import {
  getTimelineGraphById,
  getTimelineNodesFiltered,
  saveTimelineGraph,
} from '../services/timelineGraph.js'

const isbn = '978-0-441-17271-9'
const timelineId = randomUUID()
const now = new Date()

db.insert(timelines)
  .values({
    id: timelineId,
    title: 'Step 2 Verification',
    viewport: null,
    graphJson: { nodes: [], edges: [], viewport: null },
    createdAt: now,
    updatedAt: now,
  })
  .run()

const initialSave = await saveTimelineGraph(timelineId, {
  title: 'Step 2 Verification',
  nodes: [
    {
      id: 'book-node',
      type: 'book',
      position: { x: 100, y: 100 },
      data: { mediaType: 'book', title: 'Dune', externalIds: { isbn } },
    },
    {
      id: 'movie-node',
      type: 'movie',
      position: { x: 300, y: 100 },
      data: { mediaType: 'movie', title: 'Dune', externalIds: { tmdbId: 438631 } },
    },
  ],
  edges: [
    {
      id: 'adaptation-edge',
      source: 'book-node',
      target: 'movie-node',
      type: 'adaptation',
      label: '2021 film',
    },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
})

const bookNodes = await getTimelineNodesFiltered(timelineId, 'book')
const reloaded = await getTimelineGraphById(timelineId)

const mediaCountAfterFirstSave = db.select().from(mediaItems).all().length

await saveTimelineGraph(timelineId, {
  title: 'Step 2 Verification',
  nodes: [
    {
      id: 'book-node',
      type: 'book',
      position: { x: 100, y: 100 },
      data: { mediaType: 'book', title: 'Dune', externalIds: { isbn } },
    },
    {
      id: 'sequel-node',
      type: 'book',
      position: { x: 100, y: 250 },
      data: { mediaType: 'book', title: 'Dune Messiah', externalIds: { isbn: '978-0-441-17272-6' } },
    },
  ],
  edges: [],
})

const mediaCountAfterSecondSave = db.select().from(mediaItems).all().length
const normalizedNodeCount = db
  .select()
  .from(timelineNodes)
  .where(eq(timelineNodes.timelineId, timelineId))
  .all().length
const normalizedEdgeCount = db
  .select()
  .from(timelineEdges)
  .where(eq(timelineEdges.timelineId, timelineId))
  .all().length
const bookNodesAfterSecondSave = await getTimelineNodesFiltered(timelineId, 'book')

const checks = [
  ['initial save returns 2 nodes', initialSave?.nodes.length === 2],
  ['initial save returns 1 edge', initialSave?.edges.length === 1],
  ['book filter returns 1 node', bookNodes?.length === 1],
  ['book filter includes media item', bookNodes?.[0]?.mediaItem?.title === 'Dune'],
  ['reload returns saved nodes', reloaded?.nodes.length === 2],
  ['reload includes mediaItemId in node data', Boolean(reloaded?.nodes[0]?.data?.mediaItemId)],
  ['normalized node rows written', normalizedNodeCount === 2],
  ['normalized edge rows cleared on second save', normalizedEdgeCount === 0],
  ['media dedup keeps separate titles', mediaCountAfterSecondSave >= mediaCountAfterFirstSave],
  ['book filter after second save returns 2', bookNodesAfterSecondSave?.length === 2],
]

let failed = 0
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`)
  if (!passed) failed += 1
}

if (failed > 0) {
  process.exitCode = 1
  console.error(`\n${failed} check(s) failed`)
} else {
  console.log(`\nAll ${checks.length} Step 2 checks passed`)
}
