import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_SRC = '/Users/cbj/Documents/code/douyin-downloader/data';
const DATA_OUT = path.join(__dirname, '..', 'public', 'data', 'douyin-merged.json');
const FILTER_KEYWORD = '徐郑子滢';
const ACCOUNT_NAMES = ['贝贝爱吃贝果🥯', '贝贝bei～', 'GNZ48'];
const UNFILTERED_ACCOUNTS = new Set(ACCOUNT_NAMES.slice(0, 2));

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function containsKeyword(work) {
  return [work.title, work.description, ...(work.tags ?? []), ...(work.mentions ?? [])]
    .some(value => String(value ?? '').includes(FILTER_KEYWORD));
}

fs.mkdirSync(path.dirname(DATA_OUT), { recursive: true });

const accounts = [];
const worksById = new Map();
let totalBeforeFilter = 0;
let duplicateCount = 0;

for (const listedName of ACCOUNT_NAMES) {
  const accountDir = path.join(DATA_SRC, listedName);
  if (!fs.existsSync(accountDir) || !fs.statSync(accountDir).isDirectory()) {
    console.warn(`⚠️  目录不存在，跳过: ${listedName}`);
    continue;
  }

  const files = fs.readdirSync(accountDir).filter(file => file.endsWith('.json')).sort();
  for (const file of files) {
    let data;
    try {
      data = readJson(path.join(accountDir, file));
    } catch (error) {
      console.warn(`⚠️  ${listedName}/${file}: 读取失败，跳过 (${error.message})`);
      continue;
    }

    const account = data.account ?? {};
    const accountName = account.nickname || listedName;
    const sourceWorks = Object.values(data.works ?? {});
    const unfiltered = UNFILTERED_ACCOUNTS.has(listedName) || UNFILTERED_ACCOUNTS.has(accountName);
    totalBeforeFilter += sourceWorks.length;
    let workCount = 0;

    for (const work of sourceWorks) {
      if (!unfiltered && !containsKeyword(work)) continue;
      const id = String(work.aweme_id ?? '');
      if (!id) continue;
      workCount += 1;
      if (worksById.has(id)) duplicateCount += 1;
      worksById.set(id, { ...work, listed_name: listedName });
    }

    accounts.push({
      ...account,
      listed_name: listedName,
      unfiltered,
      generated_at: data.generated_at ?? null,
      crawl: data.crawl ?? null,
      total_before_filter: sourceWorks.length,
      work_count: workCount,
    });
  }
}

const works = [...worksById.values()].sort((a, b) =>
  Number(b.create_time ?? 0) - Number(a.create_time ?? 0)
  || String(b.aweme_id).localeCompare(String(a.aweme_id))
);

const output = {
  generated_at: new Date().toISOString(),
  source: 'douyin-downloader/data',
  filter_keyword: FILTER_KEYWORD,
  unfiltered_accounts: [...UNFILTERED_ACCOUNTS],
  account_count: accounts.length,
  accounts,
  total_before_filter: totalBeforeFilter,
  total_works: works.length,
  duplicate_count: duplicateCount,
  works,
};

fs.writeFileSync(DATA_OUT, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log('✅ 抖音合并完成！');
console.log(`   账号数量: ${accounts.length}`);
console.log(`   筛选前作品: ${totalBeforeFilter}`);
console.log(`   筛选后作品: ${works.length}`);
console.log(`   去重条数: ${duplicateCount}`);
console.log(`   输出文件: ${DATA_OUT}`);
