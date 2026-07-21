<template>
  <div class="videoclip-page">
    <!-- 顶部说明卡片 -->
    <el-card class="notice-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">🎬 视频切片记录</span>
          <div class="header-actions">
            <router-link to="/upload" class="upload-link">
              <el-button type="warning" plain size="large">
                <el-icon class="el-icon--left"><Upload /></el-icon>
                上传切片本
              </el-button>
            </router-link>
          </div>
        </div>
      </template>
      <div class="notice-content">
        <p>这里记录<b>非唱歌类</b>的视频切片（如<b>重大发表</b>、<b>有趣片段</b>等），支持一键剪切视频</p>
        <p>本站日期以<b>第二天凌晨 06:00</b>为界，归档为前一天。支持<b>标题</b>和<b>日期</b>搜索</p>
        <p>如果剪切时日志出现 <b>HTTP 478</b> 失败，则是口袋48录播源文件损坏，非网络或本网站问题</p>
      </div>
    </el-card>

    <!-- 搜索 -->
    <div class="search-section">
      <el-autocomplete
        v-model="searchText"
        :fetch-suggestions="searchSuggestions"
        placeholder="搜索切片名称 或 日期..."
        size="large"
        clearable
        :trigger-on-focus="false"
        style="width: 100%"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #default="{ item }">
          <span v-if="item.type === 'date'">📅 {{ item.value }}</span>
          <span v-else>🎬 {{ item.value }}</span>
        </template>
      </el-autocomplete>
    </div>

    <!-- 切片列表 -->
    <div class="clip-list" v-loading="loading">
      <div v-if="filteredClips.length === 0 && !loading" class="empty-tip">
        暂无视频切片记录 🍃
      </div>

      <el-card v-for="item in filteredClips" :key="item.id" class="clip-card" shadow="hover">
        <div class="card-body">
          <div class="info">
            <h3 class="clip-title">{{ item.name }}</h3>
            <div class="meta">
              <el-tag size="small" effect="plain">{{ item.replayDate }}</el-tag>
              <span class="time-range">⏰ {{ item.startTime }} - {{ item.endTime }}</span>
              <span class="replay-info-text" v-if="item.broadcastTime">📺 {{ item.broadcastTime }}</span>
            </div>
          </div>
          <div class="actions">
            <el-button type="danger" round @click="openClipDialog(item)">
              <el-icon><Scissor /></el-icon> 一键剪切
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 剪切弹窗（只切视频） -->
    <el-dialog v-model="clipDialogVisible" class="clip-dialog" width="90vw" top="5vh">
      <template #header>
        <span class="dialog-title">一键剪切视频</span>
      </template>
      <div class="clip-info" v-if="clipTarget">
        <p><b>切片：</b>{{ clipTarget.name }}</p>
        <p><b>时间：</b>{{ clipTarget.startTime }} - {{ clipTarget.endTime }}</p>
        <p><b>录播时间：</b>{{ clipTarget.broadcastTime }}</p>
      </div>
      <el-divider />
      <div class="clip-settings">
        <div class="setting-item">
          <span class="label">格式：</span>
          <el-select v-model="clipTargetFormat" style="width: 140px" size="large">
            <el-option label="MP4 (默认)" value="mp4" />
            <el-option label="TS" value="ts" />
            <el-option label="MKV" value="mkv" />
            <el-option label="AVI" value="avi" />
            <el-option label="MOV" value="mov" />
            <el-option label="WEBM" value="webm" />
            <el-option label="GIF" value="gif" :disabled="embedDanmaku" />
          </el-select>
        </div>
        <div class="setting-item" style="margin-top: 15px">
          <span class="label">并发：</span>
          <el-input-number v-model="clipConcurrency" :min="5" :max="30" :step="5" size="large" style="width: 120px" />
          <span class="tip" style="font-size: 12px; color: #909399; margin-left: 8px">同时下载分片数</span>
        </div>
        <DanmakuToggle v-model="embedDanmaku" />
      </div>
      <el-divider />
      <div class="log-box" ref="clipLogRef">
        <div v-for="(log, i) in clipLogs" :key="i" class="log-line">{{ log }}</div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancelClip">取消</el-button>
          <el-button
            type="danger"
            :loading="isClipping"
            :disabled="isClipping"
            @click="handleClip"
          >
            <el-icon><Scissor /></el-icon>
            {{ isClipping ? '剪切中...' : '开始剪切' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Scissor, Upload, Search } from '@element-plus/icons-vue';
import * as p48 from '@/api/pocket48';
import { FFmpegManager } from '@/composables/useFFmpeg';
import { useDanmakuEmbed } from '@/composables/useDanmakuEmbed';
import DanmakuToggle from '@/components/DanmakuToggle.vue';
import audioPlayer from '@/composables/useAudioPlayer';

const DATA_URL = '/data/videoclips.json';

const clips = ref([]);
const loading = ref(true);
const searchText = ref('');

// 过滤
const filteredClips = computed(() => {
  if (!searchText.value) return clips.value;
  const q = searchText.value.toLowerCase().trim();
  const qNoDash = q.replace(/-/g, '');
  return clips.value.filter(c => {
    const dateNoDash = (c.replayDate || '').replace(/-/g, '');
    return (c.name || '').toLowerCase().includes(q) ||
           (c.replayTitle || '').toLowerCase().includes(q) ||
           (c.replayDate || '').includes(q) ||
           dateNoDash.includes(qNoDash);
  });
});

// 搜索自动补全
const searchSuggestions = (query, cb) => {
  if (!query || query.length < 1) { cb([]); return; }
  const q = query.toLowerCase().trim();
  const qNoDash = q.replace(/-/g, '');

  const dateSet = new Set();
  const dateResults = [];
  for (const c of clips.value) {
    if (!c.replayDate) continue;
    const d = c.replayDate;
    const dNoDash = d.replace(/-/g, '');
    if ((d.includes(q) || dNoDash.includes(qNoDash)) && !dateSet.has(d)) {
      dateSet.add(d);
      dateResults.push({ value: dNoDash, type: 'date' });
    }
  }

  const nameSet = new Set();
  const nameResults = [];
  for (const c of clips.value) {
    const n = c.name;
    if (n && n.toLowerCase().includes(q) && !nameSet.has(n)) {
      nameSet.add(n);
      nameResults.push({ value: n, type: 'clip' });
    }
  }

  cb([...dateResults, ...nameResults]);
};

onMounted(async () => {
  document.title = '徐郑子滢 ✽ 视频切片记录';
  try {
    const res = await fetch(`${DATA_URL}?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      clips.value = data.clips || [];
    }
  } catch (e) {
    console.error('加载视频切片失败:', e);
  } finally {
    loading.value = false;
  }
});

// ── 剪切相关 ──
const clipDialogVisible = ref(false);
const clipTarget = ref(null);
const clipTargetFormat = ref('mp4');
const isClipping = ref(false);
const clipLogs = ref([]);
const clipLogRef = ref(null);
const clipConcurrency = ref(10);
const clipAbortController = ref(null);
const embedDanmaku = ref(false);
const { prepareDanmaku: prepareDanmakuEmbed } = useDanmakuEmbed();

// 如果当前选了 GIF 且开启弹幕，自动切到 mp4
watch(embedDanmaku, (on) => {
  if (on && clipTargetFormat.value === 'gif') clipTargetFormat.value = 'mp4'
})

const addClipLog = (msg) => {
  clipLogs.value.push(msg);
  nextTick(() => {
    if (clipLogRef.value) {
      clipLogRef.value.scrollTop = clipLogRef.value.scrollHeight;
    }
  });
};

const handleCancelClip = () => {
  if (clipAbortController.value) {
    clipAbortController.value.abort();
  }
  clipDialogVisible.value = false;
};

const ffmpegMgr = new FFmpegManager((msg) => {
  addClipLog(msg);
});

const downloadBlob = (data, filename) => {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const findReplayByTime = async (pocketId, targetTime) => {
  let next = '0';
  while (next) {
    const data = await p48.getLiveList(Number(pocketId), next);
    if (data?.content?.liveList?.length) {
      for (const r of data.content.liveList) {
        const ctime = new Date(Number(r.ctime));
        const timeStr = `${ctime.getFullYear()}-${String(ctime.getMonth()+1).padStart(2,'0')}-${String(ctime.getDate()).padStart(2,'0')} ${String(ctime.getHours()).padStart(2,'0')}:${String(ctime.getMinutes()).padStart(2,'0')}:${String(ctime.getSeconds()).padStart(2,'0')}`;
        if (timeStr === targetTime) return r;
      }
      next = data.content.next;
    } else break;
  }
  return null;
};

const openClipDialog = (item) => {
  clipTarget.value = item;
  clipLogs.value = [];
  clipDialogVisible.value = true;
};

const handleClip = async () => {
  const item = clipTarget.value;
  if (!item) return;

  const controller = new AbortController();
  clipAbortController.value = controller;
  const signal = controller.signal;

  isClipping.value = true;
  clipLogs.value = [];

  try {
    if (!ffmpegMgr.isLoaded.value) {
      addClipLog('⏳ 正在加载 FFmpeg 核心...');
      await ffmpegMgr.load();
    }

    addClipLog('📡 获取成员信息...');
    const mapping = await p48.getMapping();
    if (!mapping['徐郑子滢']) throw new Error('未找到徐郑子滢的成员ID');
    const roomMap = await p48.getRoomMap();
    const pocketId = roomMap['徐郑子滢'];
    if (!pocketId) throw new Error('未找到徐郑子滢的口袋房间号');

    addClipLog(`🔍 查找 ${item.broadcastTime} 的录播...`);
    const replay = await findReplayByTime(pocketId, item.broadcastTime);
    if (!replay) throw new Error('未找到匹配的录播，请确认直播时间正确');
    addClipLog(`✅ 找到录播: ${replay.title || '(无标题)'}`);

    addClipLog('📥 获取直播流地址...');
    const detail = await p48.getLiveOne(replay.liveId);
    const m3u8Url = detail?.content?.playStreamPath;
    if (!m3u8Url) throw new Error('获取 M3U8 地址失败');

    const m3u8Text = await p48.fetchM3U8(m3u8Url);
    const baseUrl = p48.buildBaseUrl(m3u8Url);
    const segments = p48.parseM3U8(m3u8Text, baseUrl);
    addClipLog(`✅ 解析到 ${segments.length} 个分片`);

    const startSec = p48.timeToSeconds(item.startTime);
    const endSec = p48.timeToSeconds(item.endTime);

    // ── 弹幕嵌入：获取 LRC + 生成 drawtext 滤镜链 ──
    let danmakuCleanup = null
    let danmakuFilterArgs = []
    let danmakuVideoArgs = []
    let danmakuAudioArgs = []
    if (embedDanmaku.value) {
      const msgFilePath = detail?.content?.msgFilePath
      if (!msgFilePath) {
        addClipLog('⚠️ 该录播没有弹幕文件，跳过弹幕嵌入')
      } else {
        try {
          addClipLog('🎬 正在获取弹幕...')
          const danmakuUrl = p48.proxySourceUrl(msgFilePath)
          const resp = await fetch(danmakuUrl)
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
          const lrcText = await resp.text()
          const result = await prepareDanmakuEmbed(ffmpegMgr.ffmpeg, lrcText, {}, addClipLog, { startSec, endSec })
          if (result.empty) {
            addClipLog('⚠️ 该片段内没有弹幕，跳过嵌入')
          } else {
            danmakuFilterArgs = result.filterArgs
            danmakuVideoArgs = result.videoCodecArgs
            danmakuAudioArgs = result.audioCodecArgs
            danmakuCleanup = result.cleanup
            addClipLog(`✅ 弹幕嵌入已就绪`)
          }
        } catch (e) {
          console.error('Danmaku error:', e)
          const msg = e?.message || String(e) || '未知错误'
          addClipLog(`⚠️ 弹幕嵌入失败: ${msg}，将正常剪切`)
        }
      }
    }

    const padding = 10;
    const paddedStart = Math.max(0, startSec - padding);
    const paddedEnd = endSec + padding;

    let currentTime = 0;
    const neededSegs = [];
    let firstSegStart = 0;
    for (const seg of segments) {
      const segEnd = currentTime + seg.duration;
      if (segEnd > paddedStart && currentTime < paddedEnd) {
        if (neededSegs.length === 0) firstSegStart = currentTime;
        neededSegs.push(seg);
      }
      currentTime = segEnd;
      if (currentTime >= paddedEnd) break;
    }

    addClipLog(`📥 下载 ${neededSegs.length} 个分片 (并发 ${clipConcurrency.value})...`);

    const pathWins = { CDN: 0, '直连': 0 };
    const buffers = new Array(neededSegs.length);

    const fetchSeg = async (url, index, total) => {
      const pad = String(total).length;
      const prefix = `  [${String(index + 1).padStart(pad, ' ')}/${total}]`;
      const MAX_RETRIES = 5;
      const TIMEOUTS = [5000, 5000, 5000, 8000, 10000];

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (signal.aborted) throw new DOMException('用户取消', 'AbortError');

        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), TIMEOUTS[attempt]);
        const onAbort = () => { ctrl.abort(); clearTimeout(tid); };
        signal.addEventListener('abort', onAbort, { once: true });

        const SOURCES = attempt < 2
          ? [{ url, label: '直连' }]
          : [
              { url: p48.proxyCDN(url), label: 'CDN' },
              { url, label: '直连' }
            ];
        const t0 = performance.now();

        const doFetch = async (fetchUrl, label) => {
          const resp = await fetch(fetchUrl, { signal: ctrl.signal });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          return { label, data: await resp.arrayBuffer() };
        };

        try {
          const result = await Promise.any(SOURCES.map(s => doFetch(s.url, s.label)));
          const elapsed = (performance.now() - t0).toFixed(0);
          const retryTag = attempt > 0 ? ` (重试${attempt})` : '';
          addClipLog(`${prefix} ✅ ${result.label} ${elapsed}ms${retryTag}`);
          return result;
        } catch (e) {
          const msgs = e instanceof AggregateError
            ? e.errors.map(err => err.message).join('; ')
            : e.message;
          if (attempt < MAX_RETRIES - 1) {
            addClipLog(`${prefix} ⚠️ 失败: ${msgs}，重试 ${attempt + 1}/${MAX_RETRIES - 1}`);
          } else {
            addClipLog(`${prefix} ❌ 最终失败: ${msgs}`);
            throw new Error(msgs);
          }
        } finally {
          clearTimeout(tid);
          signal.removeEventListener('abort', onAbort);
          if (!signal.aborted) ctrl.abort();
        }
      }
    };

    let nextIdx = 0;
    const worker = async () => {
      while (true) {
        if (signal.aborted) break;
        const idx = nextIdx++;
        if (idx >= neededSegs.length) break;
        const result = await fetchSeg(neededSegs[idx].url, idx, neededSegs.length);
        pathWins[result.label]++;
        buffers[idx] = result.data;
      }
    };

    const workerCount = Math.min(clipConcurrency.value, neededSegs.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    if (signal.aborted) throw new DOMException('用户取消', 'AbortError');

    addClipLog(`  📡 CDN:${pathWins.CDN} 直连:${pathWins['直连']}`);

    const totalLen = buffers.reduce((a, b) => a + b.byteLength, 0);
    if (totalLen > 1.4 * 1024 * 1024 * 1024) {
      throw new Error(`下载数据 ${(totalLen / 1024 / 1024 / 1024).toFixed(1)}GB 超过 WASM 内存上限`);
    }

    const concatData = new Uint8Array(totalLen);
    let off = 0;
    for (const buf of buffers) {
      concatData.set(new Uint8Array(buf), off);
      off += buf.byteLength;
    }
    buffers.length = 0;

    if (signal.aborted) throw new DOMException('用户取消', 'AbortError');

    await ffmpegMgr.ffmpeg.writeFile('concat.ts', concatData);

    const format = clipTargetFormat.value;
    const outputName = 'output.' + format;
    const clipOffset = startSec - firstSegStart;
    const clipDuration = endSec - startSec;
    const baseCmd = ['-ss', String(clipOffset), '-i', 'concat.ts', '-to', String(clipOffset + clipDuration)];

    addClipLog(`✂️ 剪切: ${item.name} -> ${format.toUpperCase()}`);
    const copyableFormats = ['ts', 'mp4', 'mkv', 'avi', 'mov', 'webm'];

    if (embedDanmaku.value && danmakuFilterArgs.length > 0) {
      addClipLog('🎬 嵌入弹幕（重编码）...')
      if (format === 'gif') {
        await ffmpegMgr.ffmpeg.exec([...baseCmd, '-vf', 'fps=10,scale=480:-1,ass=danmaku.ass', outputName])
      } else {
        await ffmpegMgr.ffmpeg.exec([...baseCmd, ...danmakuFilterArgs, ...danmakuVideoArgs, ...danmakuAudioArgs, outputName])
      }
    } else if (copyableFormats.includes(format)) {
      try {
        await ffmpegMgr.ffmpeg.exec([...baseCmd, '-c', 'copy', outputName]);
        await ffmpegMgr.ffmpeg.readFile(outputName);
      } catch {
        addClipLog('  ⚠️ copy 失败，回退重编码...');
        await ffmpegMgr.ffmpeg.exec([...baseCmd, '-c:v', 'libx264', '-c:a', 'aac', outputName]);
      }
    } else {
      if (format === 'gif') {
        await ffmpegMgr.ffmpeg.exec([...baseCmd, '-vf', 'fps=10,scale=480:-1', outputName]);
      } else {
        await ffmpegMgr.ffmpeg.exec([...baseCmd, '-c:v', 'libx264', '-c:a', 'aac', outputName]);
      }
    }

    const data = await ffmpegMgr.ffmpeg.readFile(outputName);
    downloadBlob(data, `${item.name}.${format}`);
    await ffmpegMgr.ffmpeg.deleteFile(outputName);
    await ffmpegMgr.ffmpeg.deleteFile('concat.ts');
    if (danmakuCleanup) await danmakuCleanup();

    if (!(await ffmpegMgr.isAlive())) {
      addClipLog('♻️ FFmpeg 实例已终止，正在重建...');
      await ffmpegMgr.restart();
    }

    addClipLog('✅ 下载完成！');
    ElMessage.success(`「${item.name}」剪切完成！`);
  } catch (err) {
    if (err.name === 'AbortError') {
      addClipLog('⏹️ 用户取消剪切');
    } else {
      console.error(err);
      addClipLog(`❌ 错误: ${err.message}`);
      ElMessage.error('剪切失败，请查看日志');
    }
  } finally {
    isClipping.value = false;
    clipAbortController.value = null;
  }
};
</script>

<style scoped>
.videoclip-page { padding-bottom: 50px; }
.notice-card { margin-bottom: 20px; background: rgba(255, 255, 255, 0.95); }
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.header-title { font-weight: bold; font-size: 18px; color: #333; }
.header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.upload-link { text-decoration: none; }
.notice-content p { margin: 5px 0; font-size: 14px; color: #555; }

.search-section { margin-bottom: 20px; }

.clip-card { margin-bottom: 15px; background: rgba(255, 255, 255, 0.9); }
.card-body { display: flex; justify-content: space-between; align-items: center; }
@media (max-width: 600px) {
  .card-body { flex-direction: column; align-items: flex-start; }
  .actions { margin-top: 15px; width: 100%; display: flex; justify-content: flex-end; }
}
.clip-title { margin: 0 0 8px 0; font-size: 18px; color: #333; }
.meta { color: #666; font-size: 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.time-range { white-space: nowrap; }
.replay-info-text { color: #909399; font-size: 13px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty-tip { text-align: center; color: #999; padding: 40px; font-size: 16px; }

.clip-info { background: #f5f7fa; padding: 12px 16px; border-radius: 8px; }
.clip-info p { margin: 4px 0; font-size: 14px; }
.clip-settings .setting-item { display: flex; align-items: center; gap: 12px; }
.clip-settings .label { font-weight: bold; font-size: 14px; white-space: nowrap; }
.log-box {
  background: #1e1e1e;
  color: #00ff00;
  font-family: 'Consolas', monospace;
  padding: 12px;
  border-radius: 8px;
  height: 300px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.5;
}
@media (max-width: 767px) { .log-box { height: 150px; } }
.log-line { margin-bottom: 2px; word-break: break-all; }
</style>

<style>
.clip-dialog { border-radius: 12px; }
@media (min-width: 768px) { .clip-dialog { max-width: 640px; } }
</style>
