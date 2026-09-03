import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatBeijingDateTime, getArchiveDate } from '../src/utils/time.js'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const songRows = data => { if (!Array.isArray(data)) throw new Error('songs.json 顶层必须是数组'); return data }
const videoRows = data => { if (!data || !Array.isArray(data.clips) || data.totalClips !== data.clips.length) throw new Error('videoclips.json 结构或总数无效'); return data.clips }
const sources = [
  { file: 'songs.json', rows: songRows, dateField: 'date' },
  { file: 'videoclips.json', rows: videoRows, dateField: 'replayDate', requiresLiveId: true }
]
let checked = 0, failed = 0
for (const source of sources) {
  const filePath = path.join(root, 'public', 'data', source.file)
  if (!fs.existsSync(filePath)) { failed += 1; console.error(`FAIL ${source.file}: 文件不存在`); continue }
  const rows = source.rows(JSON.parse(fs.readFileSync(filePath, 'utf8')))
  for (const row of rows) {
    checked += 1
    const replayCtime = Number(row.replayCtime)
    const expected = getArchiveDate(replayCtime)
    const expectedTime = formatBeijingDateTime(replayCtime)
    if (typeof row.replayCtime !== 'number' || !Number.isSafeInteger(replayCtime) || replayCtime <= 0 || (source.requiresLiveId && !row.liveId) || !expected || row[source.dateField] !== expected || row.broadcastTime !== expectedTime) { failed += 1; console.error(`FAIL ${source.file} ${row.id || row.filename || checked}: replayCtime=${row.replayCtime}, expected ${expectedTime}/${expected}`) }
  }
  console.log(`OK ${source.file}: 已检查 ${rows.length} 条`)
}
if (failed > 0) process.exitCode = 1
else console.log(`日期审计通过，共检查 ${checked} 条`)
