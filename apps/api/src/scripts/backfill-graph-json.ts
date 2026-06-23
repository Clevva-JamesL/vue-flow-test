import { backfillAllTimelinesFromGraphJson } from '../services/timelineGraph'

const migrated = await backfillAllTimelinesFromGraphJson()
console.log(`Backfilled ${migrated} timeline(s) from graph_json`)
