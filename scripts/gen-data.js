// scripts/gen-data.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取路径上下文
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置路径
const SOURCE_DIR = path.join(__dirname, 'txt_source');
const OUTPUT_FILE = path.join(__dirname, '../public/data/songs.json');

function cleanSongName(name) {
  // 逻辑：
  // 1. 先去掉末尾的 ".txt" (以防万一)
  // 2. 去掉末尾的 括号数字 (如 (1), （1）)
  // 3. 去掉末尾的 纯数字 (如 1, 2)
  // 4. 去掉首尾空格
  let s = name.replace(/\.txt$/i, '');
  s = s.replace(/(\（\d+\）|\(\d+\)|\[\d+\])$/, ''); // 去括号
  s = s.replace(/\d+$/, ''); // 去末尾数字 (比如 "我爱他1" -> "我爱他")
  return s.trim();
}

// 文件名中的日期时间已经是北京时间文字，归档日期就是自然日。
// 输入文件名示例: "2025-11-23~00.06.21.txt" 或包含此前缀的长文件名
function parseDateFromFilename(filename) {
  try {
    // 提取时间部分: 2025-11-23~00.06.21
    const match = filename.match(/(\d{4}-\d{2}-\d{2})~(\d{2})\.(\d{2})\.(\d{2})/);
    if (!match) return { date: null, broadcastTime: null };

    const [_, dateStr, hourStr, minuteStr, secondStr] = match;
    const [year, month, day] = dateStr.split('-').map(Number);
    const probe = new Date(Date.UTC(year, month - 1, day));
    const validDate = probe.getUTCFullYear() === year && probe.getUTCMonth() + 1 === month && probe.getUTCDate() === day;
    const validTime = Number(hourStr) < 24 && Number(minuteStr) < 60 && Number(secondStr) < 60;
    if (!validDate || !validTime) return { date: null, broadcastTime: null };
    const broadcastTime = `${dateStr} ${hourStr}:${minuteStr}:${secondStr}`;
    return { date: dateStr, broadcastTime };
  } catch (e) {
    console.error(`解析日期失败: ${filename}`, e);
    return { date: null, broadcastTime: null };
  }
}

// 主逻辑
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
    if (!broadcastDate || !broadcastTime) throw new Error(`文件名中的北京时间无效: ${file}`);

    // 解析 TXT 内容 (根据你的格式: 名称: xxx\n开始: xxx\n结束: xxx)
   const regex = /名称:\s*([^\r\n]+)\r?\n开始:\s*([^\r\n]+)\r?\n结束:\s*([^\r\n]+)/g;
    let match;
    
    // 将整个文件内容作为纯文本保存，供详情页展示
    // 为了防止 JSON 过大，也可以只存文件名，前端按需加载 txt。
    // 但鉴于你文件不大，直接存进 JSON 搜索体验最好。
    
    while ((match = regex.exec(content)) !== null) {
      const rawName = match[1].trim();
      allSongs.push({
        id: `${file}-${match.index}`, // 唯一ID
        rawName: rawName,
        cleanName: cleanSongName(rawName),
        startTime: match[2].trim(),
        endTime: match[3].trim(),
        date: broadcastDate, // 北京时间自然日
        broadcastTime: broadcastTime, // 直播开播时间 (如 "2025-11-23 00:06:21")
        filename: file,
        fullContent: content // 保存完整文本供阅读
      });
    }
  }

  // 按日期倒序排列
  allSongs.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  // 写入 public 目录
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allSongs, null, 2));
  console.log(`✅ 成功生成数据! 共 ${allSongs.length} 首歌。`);
  console.log(`📄 数据已保存到: ${OUTPUT_FILE}`);
}

generateData();
