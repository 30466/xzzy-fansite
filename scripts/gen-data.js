// scripts/gen-data.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.join(__dirname, 'txt_source');
const OUTPUT_FILE = path.join(__dirname, '../data.json'); 

function cleanSongName(name) {
  let s = name.replace(/\.txt$/i, '');
  s = s.replace(/(\（\d+\）|\(\d+\)|\[\d+\])$/, '');
  s = s.replace(/\d+$/, '');
  return s.trim();
}

function parseDateFromFilename(filename) {
  try {
    const match = filename.match(/(\d{4}-\d{2}-\d{2})~(\d{2})\.(\d{2})\.(\d{2})/);
    if (!match) return { date: null, broadcastTime: null };

    const [_, dateStr, hourStr, minuteStr, secondStr] = match;
    const broadcastTime = `${dateStr} ${hourStr}:${minuteStr}:${secondStr}`;
    let date = new Date(`${dateStr}T${hourStr}:${minuteStr}:${secondStr}`);
    
    if (parseInt(hourStr, 10) < 6) {
      date.setDate(date.getDate() - 1);
    }

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return { date: `${y}-${m}-${d}`, broadcastTime };
  } catch (e) {
    console.error(`解析日期失败: ${filename}`, e);
    return { date: '未知日期', broadcastTime: null };
  }
}

async function generateData() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error('❌ 错误: 找不到源文件夹 scripts/txt_source');
    return;
  }

  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.txt'));
  const allSongs = [];

  console.log(`📂 扫描到 ${files.length} 个文件...`);

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { date: broadcastDate, broadcastTime } = parseDateFromFilename(file);

   const regex = /名称:\s*([^\r\n]+)\r?\n开始:\s*([^\r\n]+)\r?\n结束:\s*([^\r\n]+)/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const rawName = match[1].trim();
      allSongs.push({
        id: `${file}-${match.index}`,
        rawName: rawName,
        cleanName: cleanSongName(rawName),
        startTime: match[2].trim(),
        endTime: match[3].trim(),
        date: broadcastDate,
        broadcastTime: broadcastTime,
        filename: file,
        fullContent: content
      });
    }
  }

  allSongs.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allSongs, null, 2));
  console.log(`✅ 成功生成数据! 共 ${allSongs.length} 首歌。`);
  console.log(`📄 数据已保存到: ${OUTPUT_FILE}`);
}

generateData();
