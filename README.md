# 徐郑子滢 唱歌切片收藏馆

<p align="center">
  <a href="https://xzzy.abm48.com/">
    <img src="https://img.shields.io/badge/Live-点击访问网站-ff6b81?style=for-the-badge&logo=safari" alt="Website">
  </a>
  <a href="https://gitee.com/albert-chen04/video-editing-toolkit">
    <img src="https://img.shields.io/badge/Tools-桌面版剪辑软件-409EFF?style=for-the-badge&logo=python" alt="Tools">
  </a>
</p>

这是一个为 **徐郑子滢** 建立的个人应援档案站。

项目核心是基于**直播唱歌切片文本记录**，自动生成一个可检索、可追溯、可下载的歌曲归档库。同时包含口袋48录播回放、弹幕查看、在线剪切、迷你音乐播放器等功能。

## 界面预览

| 日期归档墙 | 切片检索与列表 | 日历归档墙 | 成员简介 | 上传后台 |
| :---: | :---: | :---: | :---: | :---: |
| <img src="screenshots/screenshot1.png" width="300" alt="日期归档" /> | <img src="screenshots/screenshot2.png" width="300" alt="切片列表" /> | <img src="screenshots/screenshot3.png" width="300" alt="切片列表" /> | <img src="screenshots/screenshot4.png" width="300" alt="成员简介" /> | <img src="screenshots/screenshot5.png" width="300" alt="上传后台" /> |

## 核心功能

### 1. 唱歌切片检索

首页核心功能，基于直播唱歌切片 txt 记录自动生成的歌曲归档。

- **多视图浏览**: 提供 **日期归档墙**（日历视图）和 **瀑布流列表** 两种模式，按日期快速回溯所有唱歌切片。
- **实时搜索**: 纯前端实现，输入歌名或日期（如 `2025-12-08`）即可毫秒级过滤。
- **双站联动**: 一键复制 `歌名+日期` 组合关键词，自动跳转至 [abm48.com](https://abm48.com) 听歌。
- **批量下载**: 支持将搜索结果对应的源 `.txt` 切片文件打包为 ZIP 下载。

### 2. 口袋48 录播回放

完整的直播回放观看体验，从口袋48 API 获取录播数据。

- **录播日历**: 按日期归档所有录播，以次日 06:00 为界分组（口袋48 惯例）。支持年份/月份快速跳转，翻页加载全部历史录播。
- **视频播放器**: 基于 ArtPlayer + hls.js，支持 HLS 流媒体播放、倍速、画中画、截图、全屏等。TS 分片直连 CDN，播放流畅不卡顿。
- **弹幕叠加**: 自动加载并解析口袋48 弹幕文件（LRC 格式），以半透明滚动弹幕叠加在视频上，可随时开关。
- **弹幕跟随面板**: 右侧实时弹幕时间轴列表，高亮当前播放位置的弹幕，自动滚动跟随，点击弹幕可跳转到对应时间点。
- **录播信息面板**: 展示直播ID、类型、开播时间、时长、标题、主播信息、观看数据、连麦状态等完整元数据，支持下载封面图和弹幕文件。
- **移动端适配**: 手机端自动切换为竖排布局（播放器上方 + 面板下方），精简控制按钮。

### 3. 在线剪切

浏览器端 FFmpeg (WebAssembly) 剪切，无需下载完整录播即可裁剪片段。

- **一键剪切**: 首页歌曲卡片上直接剪切单首歌曲。系统根据广播时间反向查找对应录播 → 下载 TS 分片 → FFmpeg 剪切 → 浏览器下载。
- **批量剪切**: 录播回放页右侧面板，支持导入 TXT 切片本（`名称:`/`开始:`/`结束:` 格式），依次批量处理多个片段，每个片段剪完自动下载。
- **双路竞速下载**: 每个 TS 分片同时从 CDN 直连和代理两路发起请求（`Promise.any` 取最快），失败自动阶梯重试（最多 5 次，超时递增 5s→10s）。
- **并发可调**: 支持调节同时下载的分片数（5~30），滑动窗口 Worker Pool 最大化利用带宽。
- **智能剪切策略**: 优先 `-c copy` 无损流拷贝，失败自动回退重编码。FFmpeg 实例健康检测，异常自动重建。

### 4. 迷你音乐播放器

全局底部播放条，由 `AudioPlayer.vue` + `useAudioPlayer.js` 单例管理。

- **歌单管理**: 从 abm48.com 搜索结果添加歌曲到播放列表，支持添加/移除/清空。
- **三种播放模式**: 顺序播放（列表循环）、单曲循环、随机播放。
- **全局状态同步**: 搜索结果页和底部播放条共享同一个 Audio 实例，任一处操作（播放/暂停/切歌）全局同步。
- **错误自动跳过**: 歌曲加载失败时自动跳至下一首。

### 5. 成员简介

通过后端代理调用 abm48.com 公开 API，展示徐郑子滢的基本信息、社交账号、总选排名等。

### 6. 上传后台

PHP 后端提供切片 txt 文件上传功能，上传后服务端脚本自动解析更新网站数据。

---

## 技术栈

- **核心框架**: Vue 3 (Composition API) + Vite
- **UI 组件库**: Element Plus
- **视频播放**: ArtPlayer + hls.js
- **弹幕**: artplayer-plugin-danmuku (LRC 格式解析)
- **浏览器端剪切**: @ffmpeg/ffmpeg (WebAssembly)
- **后端**: PHP (提供 profile、upload 等 API)
- **数据脚本**: Node.js (服务端自动化解析生成 `data.json`)
- **工具库**: JSZip (文件打包)

---

## 本地开发

1. **克隆项目**
   ```bash
   git clone [项目地址]
   cd xzzy-fansite
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **准备数据**
   - 将切片记录 `.txt` 文件放入 `scripts/txt_source/` 目录。
   - 运行脚本生成数据：
   ```bash
   npm run gen
   ```

4. **启动前端服务**
   ```bash
   npm run dev
   ```

Vite 开发服务器会自动代理以下路径到对应后端，无需额外配置：

| 前端路径 | 代理目标 | 用途 |
|---|---|---|
| `/pocketapi/*` | `pocketapi.48.cn` | 口袋48 直播/录播 API |
| `/cdn/*` | `idol-vod.48.cn` | 视频 CDN（TS 分片下载） |
| `/source48/*` | `source.48.cn` | 封面图片、弹幕 LRC 文件 |
| `/api/*` | `abm48.com` | 音乐搜索、音频流 |

---

## 架构详解

### 一、剪切功能：一键剪切 vs 批量剪切

**两者的核心原理完全一样**，区别只在于触发入口和使用场景。

#### 共同的数据流

```
用户点击剪切
  │
  ▼
获取 M3U8 播放列表 URL
  │  （一键剪切需要先通过时间戳找到对应录播 → getLiveList 翻页查找 → getLiveOne 获取 playStreamPath）
  │  （批量剪切直接从已加载的录播详情中取 m3u8Url）
  │
  ▼
fetchM3U8(proxyCDN(m3u8Url))  ← 通过 /cdn 代理获取 M3U8 文本
  │
  ▼
parseM3U8(text)  ← 解析出每个 TS 分片的 URL 和时长
  │
  ▼
计算目标分片范围  ← 根据剪切起止时间，加上 10 秒前后缓冲，找出需要下载的分片
  │
  ▼
Worker Pool 并发下载 TS 分片
  │
  ├─ 前 2 次重试：仅直连 CDN
  ├─ 后 3 次重试：CDN 代理 + 直连双路竞速 (Promise.any)
  └─ 超时递增：5s → 5s → 5s → 8s → 10s
  │
  ▼
内存中拼接所有分片 → 写入 FFmpeg 虚拟文件系统 (concat.ts)
  │
  ▼
FFmpeg 剪切
  ├─ 先尝试 -c copy（无损流拷贝，速度快）
  └─ 失败则回退重编码（-c:v libx264 -c:a aac）
  │
  ▼
从 FFmpeg 虚拟文件系统读取输出 → Blob → 浏览器下载
```

#### 下载分片的双路竞速详解

TS 分片存放在 `idol-vod.48.cn` CDN 上。下载时有两条路径：

1. **直连**：浏览器直接请求 `https://idol-vod.48.cn/.../segment.ts`。CDN 对 TS 文件设置了 `Access-Control-Allow-Origin: *`，所以跨域请求可以成功。但不稳定，某些网络环境下可能被拦截。

2. **CDN 代理**：请求 `/cdn/.../segment.ts` → Vite/nginx 代理 → `idol-vod.48.cn`。代理层可以添加 `Origin: https://h5.48.cn` 和 `Referer: https://h5.48.cn/` 头，绕过 CDN 的 Referer 校验。

`Promise.any` 同时发起两路请求，谁先返回就用谁的结果。失败的一路自动丢弃。

#### 与播放器的区别

- **播放器**：hls.js 直接将所有 TS URL 改写为直连 CDN 地址，不经过代理。因为 hls.js 内部有自己的重试机制，且直连延迟最低。
- **剪切下载器**：使用双路竞速+阶梯重试，因为下载是一次性的、不能失败，需要最大程度保证成功率。

#### 一键剪切（Home.vue 歌曲卡片）

入口在首页歌曲卡片上。用户看到的是歌曲名+时间段，系统需要**反向查找**对应的录播：

```
歌曲卡片（包含广播时间字符串，如 "2025-12-08 20:30"）
  │
  ▼
getMapping() → 拿到成员 ID
getRoomMap() → 拿到口袋48房间 ID
  │
  ▼
getLiveList(roomId, page) 循环翻页
  │  （比对每条录播的 ctime 与广播时间）
  │
  ▼
找到匹配的录播 → getLiveOne(liveId) → playStreamPath (M3U8 URL)
  │
  ▼
进入剪切流程（同上面的共同数据流）
```

#### 批量剪切（P48ClipPanel.vue）

入口在录播回放页右侧面板。录播已经选定，M3U8 URL 已知：

```
已加载的录播详情 (replayDetail.m3u8Url)
  │
  ▼
用户导入 TXT 切片本（格式：名称:xxx / 开始:MM:SS / 结束:MM:SS）
  │
  ▼
依次处理每个片段（共享一个 FFmpeg 实例）
  │
  ▼
每个片段：下载分片 → 拼接 → 剪切 → 下载 → 清理
```

---

### 二、口袋48 API 请求链路

所有口袋48 相关请求都通过 Vite/nginx 代理转发，前端不直接请求口袋48 服务器。

```
浏览器
  │
  ▼
/pocketapi/getLiveList  (POST)
/pocketapi/getLiveOne   (POST)
  │
  ▼
Vite 代理 (开发) / Nginx 代理 (生产)
  │  重写路径：/pocketapi/* → /live/api/v1/live/*
  │  添加头：Origin: https://h5.48.cn
  │          Referer: https://h5.48.cn/
  │          User-Agent: 口袋48 iOS 客户端标识
  │
  ▼
https://pocketapi.48.cn/live/api/v1/live/getLiveList
https://pocketapi.48.cn/live/api/v1/live/getLiveOne
```

**getLiveList** — 获取录播列表（分页）

- 请求体：`{ userId: 房间ID, next: 分页游标, debug: true, record: true }`
- 返回：`{ content: { liveList: [...], next: "下一页游标" } }`
- 每条录播包含：`liveId`, `ctime`(开播时间戳), `liveType`(1=直播/2=电台/5=游戏), `duration`, `title`, `playStreamPath` 等摘要信息

**getLiveOne** — 获取单条录播完整详情

- 请求体：`{ liveId: 录播ID }`
- 返回比 getLiveList 多出：`msgFilePath`(弹幕 LRC), `coverPath`(封面), `userInfo`(主播等级/昵称等), `playNum`, `onlineNum`, `inMicrophoneConnection` 等详细字段

**关键设计**：getLiveList 返回的数据不完整（没有弹幕地址等），必须再调用 getLiveOne 才能获取完整信息。Replay.vue 中的 `onSelectReplay` 始终调用 getLiveOne，并将两次请求的数据合并。

---

### 三、两个日历逻辑

项目中有两个日历组件，底层都使用 Element Plus 的 `el-calendar`，但数据来源和用途完全不同。

#### 日历一：首页切片日历（Home.vue）

- **数据来源**：`/data.json`（由服务端脚本从 txt 切片记录生成）
- **分组规则**：按切片记录中的日期字段分组，key 为 `YYYY-MM-DD`
- **显示逻辑**：有切片的日期数字高亮显示，点击某天将该日期填入搜索框并切换到列表模式
- **用途**：按日期浏览唱歌切片记录

#### 日历二：录播回放日历（ReplayCalendar.vue）

- **数据来源**：口袋48 API（`getLiveList` 翻页获取）
- **分组规则**：以**次日 06:00 为界**。例如凌晨 2:00 的录播会归档到前一天。这是口袋48 的惯例——"一天"以早上 6 点为分界线。
- **日期格式**：使用 `ctime - 6小时` 后的 ISO 日期，确保跨凌晨的录播归入正确日期
- **加载策略**：
  - `quickLoad()` — 页面加载时自动获取第一页数据，快速展示
  - `loadAll()` — 用户点击"加载所有录播记录"时翻页获取全部历史数据
  - 使用 `Set` 去重，避免翻页时的重复数据
- **年份/月份选择器**：动态生成可选范围（最早有录播的月份 到 当前月份）
- **用途**：按日期查找录播回放

---

### 四、录播回放播放器（ReplayPlayer.vue）

基于 ArtPlayer + hls.js 的视频播放器。

#### M3U8 播放链路

```
获取 playStreamPath (原始 CDN URL：https://idol-vod.48.cn/.../xxx.m3u8)
  │
  ▼
fetch 获取 M3U8 文本（通过代理，因为 M3U8 文件本身可能返回 478 状态码拒绝直连）
  │
  ▼
正则重写 M3U8 内容：将每个 .ts 分片的相对路径替换为绝对 CDN URL
  │  例：segment_001.ts → https://idol-vod.48.cn/path/segment_001.ts
  │  原因：TS 文件有 Access-Control-Allow-Origin:* 头，可以直连
  │
  ▼
创建 Blob URL（包含改写后的 M3U8 内容）
  │
  ▼
hls.js 加载 Blob URL → 直连 CDN 下载每个 TS 分片 → 播放
```

#### 为什么要重写 M3U8

原始的 M3U8 文件中的 TS 路径可能是相对路径。hls.js 默认会基于 M3U8 的 URL 拼接完整路径。但 M3U8 是通过代理获取的，如果 hls.js 基于代理 URL 拼接，TS 请求也会走代理——增加延迟且可能触发 HTTP/2 协议错误。将 TS URL 改写为 CDN 直连地址后，hls.js 直接请求 CDN，延迟最低。

#### hls.js 配置

- `maxBufferLength: 60` / `maxMaxBufferLength: 120` — 缓冲区大小（秒），平衡内存和流畅度
- `enableWorker: true` — 在 Web Worker 中解析 TS，不阻塞主线程
- 错误恢复：网络错误自动重试 `startLoad()`，媒体错误尝试 `recoverMediaError()`

#### 弹幕系统

```
danmakuUrl (API 返回的 msgFilePath 经过 /source48 代理)
  │
  ▼
fetch → 获取 LRC 格式文本
  │
  ▼
parseLRC() 解析 [MM:SS.ms]用户名\t弹幕内容 格式
  │
  ▼
artplayer-plugin-danmuku 渲染为视频叠加层
  │  速度: 144px/s
  │  字体: 桌面 24px / 移动端 16px
  │  不透明度: 1
```

弹幕的发送 UI（输入框、发送按钮）已通过 CSS 隐藏，只保留弹幕显示和开关切换。

#### 移动端适配

屏幕宽度 ≤ 768px 时：
- 移除大部分控制按钮（音量、设置、画中画、截图、倍速、画面比例、翻转等），只保留播放/暂停、全屏、进度条、时间
- 减小弹幕字号
- 禁用 `autoMini`（小窗模式）

---

### 五、右侧面板（Replay.vue 分页布局）

选定录播后，播放器右侧有 400px 宽的面板（移动端变为下方全宽），包含三个 Tab：

#### Tab 1：录播信息（ReplayInfo.vue）

展示从 getLiveOne 获取的完整元数据：
- 基础信息：直播ID、类型（直播/电台/游戏/AI）、开播时间、时长
- 标题与公告
- 主播信息：昵称、等级、角色
- 直播间数据：在线人数、播放数、画面分辨率
- 状态标记：是否连麦、是否PK连麦
- 时长显示优先级：播放器实测时长 > API返回的精确时长 > API返回的duration > '--'
- 操作按钮：下载封面图、下载弹幕文件

#### Tab 2：批量剪切（P48ClipPanel.vue）

详见上文"剪切功能"章节。支持导入 TXT 切片本、调整并发数（5-30）、依次剪切并自动下载。每个片段剪切完成后生成 `_clip_record_` 记录文件。

#### Tab 3：弹幕跟随（DanmakuTimeline.vue，非移动端）

实时弹幕时间轴列表：

- **数据同步**：每 250ms 从播放器获取当前弹幕数据和播放时间
- **活跃项高亮**：通过 `requestAnimationFrame` 循环，找到最后一条 `time ≤ currentTime` 的弹幕并高亮
- **自动滚动**：跟随播放进度自动滚动列表，但用户手动滚动后 4 秒内不自动滚动（避免冲突）
- **点击跳转**：点击任意弹幕 → 播放器跳转到对应时间并开始播放

---

### 六、迷你音乐播放器

全局底部播放器，由 `AudioPlayer.vue` + `useAudioPlayer.js` 组成。

#### 架构

`useAudioPlayer.js` 采用**单例模式**——模块级共享一个 `Audio` 元素和播放状态。`AudioPlayer.vue`（底部播放条）和 `SongSearchResults.vue`（搜索结果）导入同一个实例，因此：

- 在搜索结果中点歌 → 底部播放器自动播放
- 底部播放器的暂停/切歌 → 搜索结果列表同步更新状态

#### 播放列表管理

- `addToPlaylist(songs, startIndex)` — 追加歌曲到播放列表
- `setPlaylistAndPlay(songs, songId)` — 替换整个播放列表并跳到指定歌曲
- `removeFromPlaylist(index)` / `clearPlaylist()` — 移除歌曲

#### 播放模式

- **顺序播放**：播放完当前歌曲自动播放列表中下一首，到末尾循环
- **单曲循环**：重复播放当前歌曲
- **随机播放**：随机选择下一首

#### 音频来源

歌曲数据通过 `/api/songs/filter?type=keyword&value=...`（代理到 abm48.com）搜索获取，音频流地址为 `/api/audio-stream/${song.id}`。

#### 错误处理

播放出错时，在顺序或随机模式下自动跳过当前歌曲，500ms 后播放下一首。

#### UI

- 固定在页面底部，毛玻璃效果
- 左侧：封面缩略图或音符占位符
- 中间：歌曲名 + 艺术家
- 右侧：上一首 / 播放暂停 / 下一首 + 播放模式切换
- 顶部细条为播放进度指示
- 点击弹出歌曲详情面板（SongDetailPanel.vue）

---

### 七、成员简介（Profile.vue）

成员简介页直接通过 `/api` 代理调用 abm48.com 公开 API，无需额外后端。

#### 请求链路

```
浏览器
  │
  ▼
① GET /api/public/snh48/mapping
  → Vite/nginx 代理 → https://abm48.com/api/public/snh48/mapping
  → 拿到成员名称到数字 ID 的映射，例如 { "徐郑子滢": 12345 }
  │
  ▼
② 并行请求：
  GET /api/public/snh48/members/{id}
  GET /api/public/snh48/members/{id}/election-ranks
  │
  ▼
JSON 直接返回给浏览器渲染
```

#### 展示内容

- **头部卡片**：头像（可点击全屏查看）、姓名、所属团体、队伍、期数标签
- **Catch Phrase**：成员的个性签名
- **详细资料**：昵称、身高、生日、出生地、加入日期、爱好
- **经历**：富文本 HTML，包含图片和格式化文字
- **总选排名**：按年份和届数排序的表格（无数据时显示"未进圈/未参选"）
- **照片展示**：全身照、历史制服照、历史公式照三组，每组支持多图点击预览
- **底部外链**：跳转到 snh48wiki.top 和 tools.abm48.com

---

## 关于剪辑

本站提供两种剪切方式，**底层原理完全相同**——都是下载 TS 分片 → 拼接 → FFmpeg WASM 剪切 → 下载。

**「一键剪切」**：在首页歌曲卡片上直接剪切单首歌曲片段

- 从歌曲广播时间反向查找对应录播 → 获取 M3U8 → 下载分片 → 剪切
- 适合单独剪切某一首歌

**「批量剪切」**：在录播回放页面导入切片本，批量处理多片段

- 入口：导航栏 **口袋48 → 录播回放** → 选择录播 → 右侧 Tab "批量剪切"
- 支持导入 TXT 切片本（`名称:`/`开始:`/`结束:` 格式）
- 每个片段依次下载分片 → 剪切 → 立即下载
- 共享一个 FFmpeg 实例，处理完一个自动清理再进行下一个

## 相关项目

- **[Tools Site](https://tools.abm48.com/)**: 个人工具站，包含更多实用的在线工具和 skill。

## 致谢

感谢徐郑子滢每天带来的动听歌声。
