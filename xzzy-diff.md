# XZZY Fansite — 与 TSH 的差异记录

> 每次从 tsh-fansite 复制文件后，按此文档修复差异即可。

---

## 0. ⚠️ 不应从 tsh 复制的文件

以下文件是 xzzy 专属的，**永远不要**从 tsh 复制覆盖：

| 文件 | 原因 |
|------|------|
| `src/assets/bg.jpg` | xzzy 自己的背景图 |
| `public/icon-192.png` | 由 `scripts/generate-icons.py` 从 bg.jpg 生成 |
| `public/icon-512.png` | 同上 |
| `screenshots/` | xzzy 页面截图，更新时应从 xzzy 本地页面重新截取，不要从 tsh 复制覆盖 |
| `public/data/songs.json` | 由 `node scripts/gen-data.js` 从 `scripts/txt_source/` 生成 |
| `public/data/videoclips.json` | 视频切片数据，xzzy 专属 |
| `public/data/bilibili-merged.json` | 由 `node scripts/merge-bilibili.js` 生成 |
| `scripts/txt_source/` | 唱歌切片源数据 |
| `scripts/merge-bilibili.js` | 读取 `xzzy-up-list.txt`，过滤 `徐郑子滢` |
| `scripts/merge-weibo.js` | 读取 `weibo-core/xzzy.txt`，使用 XZZY 专属账号和筛选规则 |

---

## 1. 全局文字替换

```bash
# 所有源文件：谭思慧 → 徐郑子滢，CGT48 → GNZ48
sed -i 's/谭思慧/徐郑子滢/g' src/App.vue src/views/*.vue src/components/*.vue src/composables/*.js src/utils/*.js src/api/*.js src/router/index.js src/main.js index.html vite.config.js

```

## 2. 从 TSH 同步时必须保留的公共逻辑

- `src/views/Bilibili.vue` 已支持 `bili-core` 导出的 `collections`：视频卡片显示合集名称及集数，搜索可以匹配合集名称，顶部显示合集数量；原有分 P 展示、分 P 搜索和跳转逻辑继续保留。
- `src/views/Weibo.vue` 的搜索范围为微博正文和用户，不再显示或提示“转发原文”；转发帖已在合并数据阶段排除。
- `scripts/merge-bilibili.js` 需要保留对合集元数据的合并，输出 JSON 的 `collections` 和视频的 `collection` 字段。

## 3. 文件级差异

### 3.1 `src/App.vue`
- Logo 颜色: `#ff002b` → `#ff002b`

### 3.2 `src/components/ElectionBusiness.vue`
- 去掉总选业务按钮（右悬浮按钮 + 弹窗），只保留 APP 安装按钮

### 3.3 `src/views/Bilibili.vue`
- quickTags 替换为 xzzy 专属标签：
```js
const quickTags = [
  'focus', '直拍','舞台','直播', '唱歌','口袋','minilive',
  '公演', 'cut', '合集',
]
```

### 3.4 `src/views/Weibo.vue`
- quickTags 使用与 XZZY B 站相同的标签：`focus`、`直拍`、`舞台`、`直播`、`唱歌`、`口袋`、`minilive`、`公演`、`cut`、`合集`
- 搜索框占位文字为“搜索微博正文、用户...”，不包含“转发原文”

### 3.5 `scripts/merge-bilibili.js`
- 读取 `xzzy-up-list.txt` 而非 `tsh-up-list.txt`
- 过滤标题包含 `徐郑子滢` 而非 `谭思慧`
- 保留 `bili-core` 导出的合集数据，并为匹配到的每条视频补充 `collection`

### 3.6 `scripts/merge-weibo.js`
- 读取 `weibo-core/xzzy.txt`
- 使用筛选关键词 `徐郑子滢超话`
- `GNZ48-徐郑子滢`、`爱吃抹茶味的贝果酱` 两个账号免筛选，其余账号按关键词筛选
- 对需要筛选的账号排除转发帖，免筛选账号保留全部微博

### 3.7 `index.html`
- `<title>` 改为 `徐郑子滢 ✽ 应援存档站`

### 3.8 `vite.config.js`
- PWA name/short_name/description 改为徐郑子滢
