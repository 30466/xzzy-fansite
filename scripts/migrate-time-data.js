import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  formatBeijingDateTime,
  getArchiveDate,
  unixMsFromBeijingDateTime
} from '../src/utils/time.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(root, 'public', 'data')
const songsFile = path.join(dataDir, 'songs.json')
const videoClipsFile = path.join(dataDir, 'videoclips.json')

function readJson(file, emptyValue) {
  if (!fs.existsSync(file)) return emptyValue
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function requireUnixMs(value, label, fallbackBeijingTime) {
  const converted = Number.isFinite(Number(value)) && Number(value) > 0
    ? Number(value)
    : unixMsFromBeijingDateTime(fallbackBeijingTime)
  if (!Number.isSafeInteger(converted) || converted <= 0) {
    throw new Error(`${label}: 无法得到有效 replayCtime`)
  }
  return converted
}

function migrateSong(row, index) {
  const match = String(row.filename ?? '').match(/(\d{4}-\d{2}-\d{2})~(\d{2})\.(\d{2})\.(\d{2})/)
  const filenameTime = match ? `${match[1]} ${match[2]}:${match[3]}:${match[4]}` : null
  const filenameCtime = unixMsFromBeijingDateTime(filenameTime)
  const replayCtime = requireUnixMs(row.replayCtime, `songs.json 第 ${index + 1} 条`, filenameTime)
  if (replayCtime !== filenameCtime) throw new Error(`songs.json 第 ${index + 1} 条: replayCtime 与文件名不一致`)
  return {
    id: row.id,
    rawName: row.rawName,
    cleanName: row.cleanName,
    startTime: row.startTime,
    endTime: row.endTime,
    date: getArchiveDate(replayCtime),
    broadcastTime: formatBeijingDateTime(replayCtime),
    replayCtime,
    filename: row.filename,
    fullContent: row.fullContent
  }
}

function migrateVideoClip(row, index) {
  const replayCtime = requireUnixMs(row.replayCtime, `videoclips.json 第 ${index + 1} 条`, row.broadcastTime)
  if (!row.liveId) throw new Error(`videoclips.json 第 ${index + 1} 条: 缺少 liveId`)
  return {
    id: row.id,
    name: row.name,
    startTime: row.startTime,
    endTime: row.endTime,
    broadcastTime: formatBeijingDateTime(replayCtime),
    replayTitle: row.replayTitle,
    liveId: String(row.liveId),
    replayCtime,
    replayDate: getArchiveDate(replayCtime),
    createdAt: row.createdAt
  }
}

fs.mkdirSync(dataDir, { recursive: true })

const songs = readJson(songsFile, [])
if (!Array.isArray(songs)) throw new Error('songs.json 顶层必须是数组')
const migratedSongs = songs.map(migrateSong)

const videoData = readJson(videoClipsFile, {
  generatedAt: new Date().toISOString(),
  totalClips: 0,
  clips: []
})
if (!videoData || !Array.isArray(videoData.clips)) {
  throw new Error('videoclips.json 必须包含 clips 数组')
}
const migratedClips = videoData.clips.map(migrateVideoClip)
const migratedVideoData = {
  generatedAt: videoData.generatedAt || new Date().toISOString(),
  totalClips: migratedClips.length,
  clips: migratedClips
}

fs.writeFileSync(songsFile, `${JSON.stringify(migratedSongs, null, 2)}\n`)
fs.writeFileSync(videoClipsFile, `${JSON.stringify(migratedVideoData, null, 2)}\n`)

console.log(`数据转换完成：songs.json ${migratedSongs.length} 条，videoclips.json ${migratedClips.length} 条`)
