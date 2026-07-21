function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function withRetry(fn, label = '请求', retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (e) {
      const isLast = i === retries - 1
      console.warn(`[${label}] 第${i + 1}次失败: ${e.message}${isLast ? '，已耗尽重试次数' : `，${retries - i - 1}秒后重试...`}`)
      if (isLast) throw e
      await sleep((i + 1) * 1000)
    }
  }
}

function deviceId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 18)
}

function pocketHeaders() {
  return {
    'Content-Type': 'application/json;charset=utf-8',
    'User-Agent': 'PocketFans201807/6.0.16 (iPhone; iOS 13.5.1; Scale/2.00)',
    'Accept-Language': 'zh-Hans-CN;q=1',
    'appInfo': JSON.stringify({
      vendor: 'apple',
      deviceId: deviceId(),
      appVersion: '7.0.4',
      appBuild: '23011601',
      osVersion: '16.3.1',
      osType: 'ios',
      deviceName: 'iPhone XR',
      os: 'ios'
    })
  }
}

export async function getMapping() {
  return withRetry(async () => {
    const res = await fetch('/api/public/snh48/mapping')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }, '成员映射')
}

export async function getRoomMap() {
  return withRetry(async () => {
    const res = await fetch('/api/public/snh48/room-map')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }, '房间映射')
}

export async function getLiveList(userId, next = '0') {
  return withRetry(async () => {
    const res = await fetch('/pocketapi/getLiveList', {
      method: 'POST',
      headers: pocketHeaders(),
      body: JSON.stringify({ userId, next, debug: true, record: true })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }, '录播列表')
}

export async function getLiveOne(liveId) {
  return withRetry(async () => {
    const res = await fetch('/pocketapi/getLiveOne', {
      method: 'POST',
      headers: pocketHeaders(),
      body: JSON.stringify({ liveId: String(liveId) })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }, '录播详情')
}

export async function fetchM3U8(url) {
  return withRetry(async () => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  }, 'M3U8')
}

export function parseM3U8(text, baseUrl) {
  const lines = text.trim().split('\n')
  const segments = []
  let duration = 0
  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const dur = parseFloat(line.replace('#EXTINF:', '').split(',')[0])
      duration += dur
    } else if (!line.startsWith('#') && line.length > 0) {
      let url
      if (line.startsWith('http')) {
        url = line
      } else if (line.startsWith('/')) {
        const idx = baseUrl.indexOf('/', baseUrl.indexOf('//') + 2)
        url = baseUrl.substring(0, idx) + line
      } else {
        url = baseUrl + line
      }
      segments.push({ url, duration })
      duration = 0
    }
  }
  return segments
}

export function buildBaseUrl(m3u8Url) {
  const lastSlash = m3u8Url.lastIndexOf('/')
  return m3u8Url.substring(0, lastSlash + 1)
}

export function timeToSeconds(t) {
  const parts = t.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return 0
}

export function proxyCDN(url) {
  const idx = url.indexOf('/', url.indexOf('//') + 2)
  return '/cdn' + url.substring(idx)
}

/** 将 source.48.cn 的 URL 转为 Vite 代理路径 */
export function proxySourceUrl(url) {
  return url.replace('https://source.48.cn', '/source48')
}
