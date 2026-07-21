/**
 * 弹幕嵌入 composable：用 drawtext 滤镜将弹幕烧录到视频中
 *
 * 使用 textfile 属性（而非 text）彻底避免冒号/特殊字符的转义问题。
 * 字体只需下载一次，缓存在内存中。
 */
import { parseLRC } from '@/utils/danmaku'

// ── 中文字体 CDN（国内镜像优先）──
const FONT_URLS = [
  // Noto Sans CJK SC — 标准无衬线字体，类似微软雅黑 / 苹方
  'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf',
  'https://fastly.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf',
  // ZCOOL 备用
  'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf'
]

const DANMAKU_COLOR = 'white'

// ── 字体缓存 ──
let _fontBuffer = null
let _fontLoading = false
let _fontError = null

async function downloadFont(onLog) {
  if (_fontBuffer) return _fontBuffer
  if (_fontLoading) {
    while (_fontLoading) await new Promise(r => setTimeout(r, 100))
    if (_fontBuffer) return _fontBuffer
    throw _fontError || new Error('字体下载失败')
  }
  _fontLoading = true
  for (const url of FONT_URLS) {
    try {
      if (onLog) onLog(`  🔤 下载字体 (${url.split('/').pop()})...`)
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 15000)
      let resp
      try {
        resp = await fetch(url, { signal: ctrl.signal })
      } finally {
        clearTimeout(timer)
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      _fontBuffer = await resp.arrayBuffer()
      if (onLog) onLog(`  ✅ 字体就绪 (${(_fontBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)`)
      _fontLoading = false
      return _fontBuffer
    } catch (e) {
      if (onLog) onLog(`  ⚠️ ${url.split('/').pop()}: ${e.message}`)
    }
  }
  _fontError = new Error('所有字体源下载失败')
  _fontLoading = false
  throw _fontError
}

async function ensureFont(ffmpeg, onLog) {
  const fontBuf = await downloadFont(onLog)
  try {
    await ffmpeg.readFile('font.ttf')
    return
  } catch {}
  try {
    // slice(0) 拷贝一份——writeFile 会转移 ArrayBuffer，不能直接用缓存的
    const fontCopy = fontBuf.slice(0)
    await ffmpeg.writeFile('font.ttf', new Uint8Array(fontCopy))
  } catch (e) {
    throw new Error(`字体写入 VFS 失败: ${e?.message || String(e)}`)
  }
}

// ── drawtext 弹幕生成 ──

/** 移除 emoji 及其他字体不支持的符号 */
function stripEmoji(s) {
  // 去掉常见 emoji 范围的字符（BMP 符号 + SMP emoji）
  return (s || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu, '')
}

function buildDrawtextChain(danmakuList, clipStartSec, clipEndSec, options = {}) {
  const { videoWidth = 1280, videoHeight = 720, fontSize = 30,
          scrollSpeed = 250, maxCount = 50 } = options

  const maxTextWidthEst = 500
  const maxScrollTime = (videoWidth + maxTextWidthEst + 40) / scrollSpeed

  const relevant = danmakuList.filter(dm =>
    dm.time >= clipStartSec - maxScrollTime && dm.time <= clipEndSec
  )
  if (relevant.length === 0) return null

  const selected = relevant.slice(0, maxCount)
  const rowHeight = fontSize + 10
  const rows = Math.max(1, Math.floor((videoHeight - 20) / rowHeight))
  const laneBusyUntil = new Array(rows).fill(0)
  const parts = []
  const textFiles = []

  for (let i = 0; i < selected.length; i++) {
    const dm = selected[i]
    const rawText = stripEmoji(dm.user ? `${dm.user} : ${dm.text}` : dm.text)
    const textWidth = Math.round(rawText.length * fontSize * 0.5)
    const scrollDist = videoWidth + textWidth + 40
    const duration = scrollDist / scrollSpeed
    const virtualStart = dm.time - clipStartSec
    const visStart = Math.max(0, virtualStart)

    let row = -1
    for (let r = 0; r < rows; r++) {
      if (laneBusyUntil[r] <= visStart) { row = r; break }
    }
    if (row === -1) row = laneBusyUntil.indexOf(Math.min(...laneBusyUntil))

    const y = row * rowHeight + fontSize + 10
    const actualStart = Math.max(visStart, laneBusyUntil[row])
    const actualEnd = actualStart + duration
    laneBusyUntil[row] = actualEnd + 0.1

    const fn = `dm_${i}.txt`
    textFiles.push({ filename: fn, content: rawText })

    const xExpr = `w-(t-${actualStart})*${scrollSpeed}`

    parts.push(
      `drawtext=fontfile=font.ttf:textfile=${fn}` +
      `:fontsize=${fontSize}:fontcolor=${DANMAKU_COLOR}` +
      `:x=${xExpr}:y=${y}` +
      `:borderw=1:bordercolor=black@0.6` +
      `:enable=between(t\\,${actualStart}\\,${actualEnd})`
    )
  }

  if (parts.length === 0) return null
  return { chain: parts.join(','), textFiles }
}

export function useDanmakuEmbed() {
  async function prepareDanmaku(ffmpeg, lrcText, videoMeta = {}, onLog, clipRange) {
    const danmakuList = parseLRC(lrcText)
    if (danmakuList.length === 0) {
      throw new Error('弹幕数据为空或解析失败，无法嵌入')
    }

    await ensureFont(ffmpeg, onLog)

    const clipStart = clipRange?.startSec ?? 0
    const clipEnd = clipRange?.endSec ?? Infinity

    let result
    try {
      result = buildDrawtextChain(danmakuList, clipStart, clipEnd, {
        videoWidth: videoMeta.width || 1280,
        videoHeight: videoMeta.height || 720
      })
    } catch (e) {
      throw new Error(`生成弹幕滤镜链失败: ${e?.message || String(e)}`)
    }

    if (!result) {
      return { filterArgs: [], videoCodecArgs: [], audioCodecArgs: [],
               cleanup: async () => {}, count: 0, empty: true }
    }

    // 将弹幕文本文件写入 VFS
    for (const tf of result.textFiles) {
      await ffmpeg.writeFile(tf.filename, tf.content)
    }

    const filterArgs = ['-vf', result.chain]
    const videoCodecArgs = ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '18']
    const audioCodecArgs = ['-c:a', 'aac']

    const cleanup = async () => {
      for (const tf of result.textFiles) {
        try { await ffmpeg.deleteFile(tf.filename) } catch {}
      }
    }

    return { filterArgs, videoCodecArgs, audioCodecArgs, cleanup,
             count: result.textFiles.length }
  }

  return { prepareDanmaku }
}
