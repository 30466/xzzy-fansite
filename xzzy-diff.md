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
| `public/data/songs.json` | 由 `node scripts/gen-data.js` 从 `scripts/txt_source/` 生成 |
| `public/data/videoclips.json` | 视频切片数据，wrs 专属 |
| `public/data/bilibili-merged.json` | 由 `node scripts/merge-bilibili.js` 生成 |
| `scripts/txt_source/` | 唱歌切片源数据 |
| `scripts/merge-bilibili.js` | 读取 `xzzy-up-list.txt`，过滤 `吴睿莎` |

---

## 1. 全局文字替换

```bash
# 所有源文件：谭思慧 → 徐郑子滢，CGT48 → GNZ48
sed -i 's/谭思慧/徐郑子滢/g' src/App.vue src/views/*.vue src/components/*.vue src/composables/*.js src/utils/*.js src/api/*.js src/router/index.js src/main.js index.html vite.config.js



## 2. 文件级差异

### 2.1 `src/App.vue`
- Logo 颜色: `#ff002b` → `#ff002b`

### 2.2 `src/components/ElectionBusiness.vue`
- 去掉总选业务按钮（右悬浮按钮 + 弹窗），只保留 APP 安装按钮

### 2.3 `src/views/Bilibili.vue`
- quickTags 替换为 xzzy 专属标签：
```js
const quickTags = [
  'focus', '直拍','舞台','直播', '唱歌','minilive',
  'cut', '合集',  
]
```

### 2.4 `scripts/merge-bilibili.js`
- 读取 `wrs-up-list.txt` 而非 `tsh-up-list.txt`
- 过滤标题包含 `徐郑子滢` 而非 `谭思慧`

### 2.5 `index.html`
- `<title>` 改为 `徐郑子滢 ✽ 应援存档站`

### 2.6 `vite.config.js`
- PWA name/short_name/description 改为徐郑子滢

### 2.7 `src/components/ElectionBusiness.vue`
- 去掉总选业务按钮（右悬浮按钮 + 弹窗），只保留 APP 安装按钮
