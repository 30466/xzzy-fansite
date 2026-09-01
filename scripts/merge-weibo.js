import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_SRC = '/Users/cbj/Documents/code/weibo-core/data';
const ACCOUNT_LIST = '/Users/cbj/Documents/code/weibo-core/xzzy.txt';
const DATA_OUT = path.join(__dirname, '..', 'public', 'data', 'weibo-merged.json');
const FILTER_KEYWORD = '徐郑子滢超话';
const UNFILTERED_ACCOUNTS = new Set(['GNZ48-徐郑子滢', '爱吃抹茶味的贝果酱']);

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');

  try {
    return JSON.parse(raw);
  } catch {
    // 兼容文件末尾意外附加了其他内容的情况，只提取第一个完整 JSON 对象。
    const start = raw.indexOf('{');
    if (start === -1) throw new Error('找不到 JSON 对象');

    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < raw.length; i += 1) {
      const char = raw[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') inString = true;
      else if (char === '{') depth += 1;
      else if (char === '}' && --depth === 0) return JSON.parse(raw.slice(start, i + 1));
    }
    throw new Error('JSON 对象不完整');
  }
}

function containsKeyword(post) {
  if (String(post.text ?? '').includes(FILTER_KEYWORD)) return true;
  const retweet = post.retweetedStatus;
  return Boolean(retweet && String(retweet.text ?? '').includes(FILTER_KEYWORD));
}

function isRetweet(post) {
  // weibo-core 的 JSON 使用 isRetweet；同时兼容 CSV 风格字段和旧数据。
  // 不能只检查 retweetedStatus：原帖删除后它可能为空，但顶层仍是转发帖。
  return post.isRetweet === true || post.is_retweet === true || Boolean(post.retweetedStatus);
}

const accountNames = fs.readFileSync(ACCOUNT_LIST, 'utf8')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));

fs.mkdirSync(path.dirname(DATA_OUT), { recursive: true });

const accounts = [];
const postsById = new Map();
let totalBeforeFilter = 0;
let duplicateCount = 0;
let retweetFilteredCount = 0;

for (const listedName of accountNames) {
  const accountDir = path.join(DATA_SRC, listedName);
  if (!fs.existsSync(accountDir) || !fs.statSync(accountDir).isDirectory()) {
    console.warn(`⚠️  目录不存在，跳过: ${listedName}`);
    continue;
  }

  const files = fs.readdirSync(accountDir).filter((file) => file.endsWith('.json')).sort();
  if (files.length === 0) {
    console.warn(`⚠️  ${listedName}: 无 JSON 文件，跳过`);
    continue;
  }

  for (const file of files) {
    const filePath = path.join(accountDir, file);
    let data;
    try {
      data = readJson(filePath);
    } catch (error) {
      console.warn(`⚠️  ${listedName}/${file}: 读取失败，跳过 (${error.message})`);
      continue;
    }

    const account = data.account ?? {};
    const accountName = account.screenName || listedName;
    const sourcePosts = Object.values(data.posts ?? {});
    const skipFilter = UNFILTERED_ACCOUNTS.has(accountName) || UNFILTERED_ACCOUNTS.has(listedName);
    totalBeforeFilter += sourcePosts.length;

    let matchedCount = 0;
    let accountRetweetFilteredCount = 0;
    for (const post of sourcePosts) {
      if (!skipFilter && isRetweet(post)) {
        retweetFilteredCount += 1;
        accountRetweetFilteredCount += 1;
        continue;
      }
      if (!skipFilter && !containsKeyword(post)) continue;
      matchedCount += 1;

      const id = String(post.id ?? post.mid ?? '');
      if (!id) {
        console.warn(`⚠️  ${listedName}/${file}: 发现无 ID 微博，跳过`);
        continue;
      }
      if (postsById.has(id)) duplicateCount += 1;
      // 原样保留爬虫导出的全部微博字段，不做有损字段映射。
      postsById.set(id, post);
    }

    accounts.push({
      ...account,
      listedName,
      unfiltered: skipFilter,
      sourceUpdatedAt: data.updatedAt ?? null,
      crawl: data.crawl ?? null,
      totalBeforeFilter: sourcePosts.length,
      retweetFilteredCount: accountRetweetFilteredCount,
      postCount: matchedCount,
    });
  }
}

const posts = [...postsById.values()].sort((a, b) => {
  const timeDiff = Date.parse(b.createdAt ?? 0) - Date.parse(a.createdAt ?? 0);
  return timeDiff || String(b.id ?? b.mid ?? '').localeCompare(String(a.id ?? a.mid ?? ''));
});

const output = {
  generatedAt: new Date().toISOString(),
  source: 'weibo-core/data',
  filterKeyword: FILTER_KEYWORD,
  retweetFilterAppliesToFilteredAccounts: true,
  unfilteredAccounts: [...UNFILTERED_ACCOUNTS],
  accountCount: accounts.length,
  accounts: accounts.sort((a, b) => b.postCount - a.postCount),
  totalBeforeFilter,
  retweetFilteredCount,
  totalPosts: posts.length,
  duplicateCount,
  posts,
};

fs.writeFileSync(DATA_OUT, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

console.log('✅ 微博合并完成！');
console.log(`   账号数量: ${accounts.length}`);
console.log(`   筛选前微博: ${totalBeforeFilter}`);
console.log(`   过滤转发帖: ${retweetFilteredCount}`);
console.log(`   筛选后微博: ${posts.length}`);
console.log(`   去重条数: ${duplicateCount}`);
console.log(`   输出文件: ${DATA_OUT}`);
