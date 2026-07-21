import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_SRC = '/Users/cbj/Documents/code/bili-core/data';
const UP_LIST = '/Users/cbj/Documents/code/bili-core/xzzy-up-list.txt';
const DATA_OUT = path.join(__dirname, '..', 'public', 'data', 'bilibili-merged.json');

const INCLUDE = fs.readFileSync(UP_LIST, 'utf-8')
  .split('\n')
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('#'));

const outDir = path.dirname(DATA_OUT);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const upDirs = [];
for (const name of INCLUDE) {
  const dirPath = path.join(DATA_SRC, name);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    upDirs.push({ name, path: dirPath });
  } else {
    console.warn(`⚠️  目录不存在，跳过: ${name}`);
  }
}

const allVideos = [];
const upMeta = {}; // upName -> { uid, videoCount }
let totalBeforeFilter = 0;

for (const upDir of upDirs) {
  const dirPath = upDir.path;
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.warn(`⚠️  ${upDir.name}: 无JSON文件，跳过`);
    continue;
  }

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    let raw;
    try {
      raw = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      console.warn(`⚠️  ${dir.name}/${file}: 读取失败`, e.message);
      continue;
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      // 可能有多余数据，尝试修复
      console.warn(`⚠️  ${dir.name}/${file}: JSON解析失败，尝试修复...`);
      // 如果文件包含多个JSON对象，只取第一个
      const firstBrace = raw.indexOf('{');
      if (firstBrace === -1) continue;
      let depth = 0;
      let end = -1;
      for (let i = firstBrace; i < raw.length; i++) {
        if (raw[i] === '{') depth++;
        if (raw[i] === '}') {
          depth--;
          if (depth === 0) { end = i + 1; break; }
        }
      }
      if (end === -1) continue;
      try {
        data = JSON.parse(raw.slice(firstBrace, end));
      } catch {
        console.error(`❌ ${dir.name}/${file}: 无法修复`);
        continue;
      }
    }

    const upName = data.upName || upDir.name;
    const uid = data.uid || 'unknown';
    const videos = data.videos || {};

    const entries = Object.entries(videos);
    totalBeforeFilter += entries.length;

    let filteredCount = 0;
    for (const [bvid, video] of entries) {
      const title = video.title || '';
      // 过滤：标题必须包含"徐郑子滢"
      if (!title.includes('徐郑子滢')) continue;

      filteredCount++;
      allVideos.push({
        bvid,
        aid: video.aid,
        title,
        cover: video.cover || '',
        description: video.description || '',
        duration: video.duration || 0,
        created: video.created || 0,
        tid: video.tid || 0,
        tname: video.tname || '',
        stat: video.stat || {},
        pages: (video.pages || []).map(p => ({
          cid: p.cid,
          part: p.part || '',
        })),
        upName,
        uid,
      });
    }

    if (!upMeta[upName]) {
      upMeta[upName] = { uid, videoCount: 0 };
    }
    upMeta[upName].videoCount += filteredCount;
  }
}

// 按发布时间倒序排列
allVideos.sort((a, b) => b.created - a.created);

const output = {
  generatedAt: new Date().toISOString(),
  source: 'bili-core/data',
  upList: Object.entries(upMeta)
    .sort((a, b) => b[1].videoCount - a[1].videoCount)
    .map(([name, info]) => ({ name, uid: info.uid, videoCount: info.videoCount })),
  totalBeforeFilter,
  totalVideos: allVideos.length,
  videos: allVideos,
};

fs.writeFileSync(DATA_OUT, JSON.stringify(output, null, 2), 'utf-8');

console.log(`✅ 合并完成！`);
console.log(`   UP主数量: ${Object.keys(upMeta).length}`);
console.log(`   过滤前视频: ${totalBeforeFilter}`);
console.log(`   过滤后视频: ${allVideos.length}`);
console.log(`   输出文件: ${DATA_OUT}`);
