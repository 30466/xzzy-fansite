import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getArchiveDateFromBeijingDateTime } from '../src/utils/time.js'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sources = [
  { file: 'songs.json', rows: data => Array.isArray(data) ? data : [], dateField: 'date' },
  { file: 'videoclips.json', rows: data => data.clips || [], dateField: 'replayDate' }
]
let checked = 0, failed = 0
for (const source of sources) {
  const filePath = path.join(root, 'public', 'data', source.file)
  if (!fs.existsSync(filePath)) { console.log(`SKIP ${source.file}: 文件不存在`); continue }
  const rows = source.rows(JSON.parse(fs.readFileSync(filePath, 'utf8')))
  for (const row of rows) {
    checked += 1
    const expected = getArchiveDateFromBeijingDateTime(row.broadcastTime)
    if (!expected || row[source.dateField] !== expected) { failed += 1; console.error(`FAIL ${source.file} ${row.id || row.filename || checked}: expected ${expected}`) }
  }
  console.log(`OK ${source.file}: 已检查 ${rows.length} 条`)
}
if (failed > 0) process.exitCode = 1
else console.log(`日期审计通过，共检查 ${checked} 条`)
