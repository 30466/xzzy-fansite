<template>
  <div class="home-page">
    
    <!-- 顶部说明卡片 -->
    <el-card class="notice-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">💡 检索说明</span>
          <div class="header-actions">
            <!-- 1. 新增的上传按钮 -->
            <router-link to="/upload" class="upload-link">
              <el-button type="warning" plain size="large">
                <!-- 这里的 Upload 图标会自动导入，不用管 script -->
                <el-icon class="el-icon--left"><Upload /></el-icon>
                上传切片本
              </el-button>
            </router-link>

            <!-- 批量下载按钮 -->
            <el-button 
              type="primary" 
              size="large" 
              class="batch-download-btn"
              :loading="downloading"
              @click="handleBatchDownload"
            >
              <el-icon class="el-icon--left"><Download /></el-icon>
              当前列表切片本 ({{ fileCount }}本 / {{ filteredList.length }}首)
            </el-button>
          </div>
        </div>
      </template>
      <div class="notice-content">
        <p>1. 本站日期以<b>第二天凌晨 06:00</b>为界，归档为前一天。本站只有从<b>2025-11-01</b>及其之后的记录</p>
        <p>2. 点击<b>"听歌"</b>会自动搜索并播放，底部播放器可查看歌曲详情</p>
        <p>3. 本网站仅支持<b>歌名</b>和<b>日期</b>搜索。如要<b>精确搜索</b>如<b>歌手</b>,<b>语种</b>等，请到小偶像音乐网站搜索</p>
      </div>
    </el-card>

    <!-- 模式切换：增加了 日历视图 -->
    <div class="mode-switch">
      <el-radio-group v-model="viewMode" size="large" fill="#409EFF">
        <el-radio-button label="songs">
          <el-icon><Microphone /></el-icon> 切片列表
        </el-radio-button>
        <el-radio-button label="dates">
          <el-icon><CopyDocument /></el-icon> 日期卡片
        </el-radio-button>
        <el-radio-button label="calendar">
          <el-icon><Calendar /></el-icon> 日历视图
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 模式 A: 切片列表 -->
    <div v-show="viewMode === 'songs'">
      <div class="search-section">
        <el-input
          v-model="searchText"
          placeholder="输入歌名 或 日期 (例如: 20251123)..."
          size="large"
          prefix-icon="Search"
          clearable
        />
      </div>

      <div class="song-list" v-loading="loading">
        <div v-if="filteredList.length === 0 && !loading" class="empty-tip">
          没有找到相关记录 🍃
        </div>

        <el-card v-for="item in filteredList" :key="item.id" class="song-card" shadow="hover">
          <div class="card-body">
            <div class="info">
              <h3 class="song-title">{{ item.cleanName }}</h3>
              <div class="meta">
                <el-tag size="small" effect="plain">{{ item.date }}</el-tag>
                <span class="time-range">⏰ {{ item.startTime }} - {{ item.endTime }}</span>
              </div>
            </div>
            <div class="actions">
              <el-button type="primary" round @click="copyAndJump(item)">
                <el-icon><Headset /></el-icon> 听歌
              </el-button>
              <el-button plain round @click="openTxtModal(item)">
                <el-icon><Document /></el-icon> 切片本
              </el-button>
              <el-button type="danger" round @click="openClipDialog(item)">
                <el-icon><Scissor /></el-icon> 一键剪切
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 模式 B: 日期卡片归档 -->
    <div v-show="viewMode === 'dates'" v-loading="loading">
      <div class="date-grid">
        <div v-for="(group, date) in dateGroups" :key="date" class="date-card" @click="selectDate(date)">
          <div class="date-header">{{ date }}</div>
          <div class="date-count">🎵 共 {{ group.length }} 首</div>
          <div class="date-preview">
            <span v-for="song in group.slice(0, 3)" :key="song.id">{{ song.cleanName }}</span>
            <span v-if="group.length > 3">...</span>
          </div>
        </div>
      </div>
    </div>

<!-- 模式 C: 日历视图 (修改版) -->
    <div v-show="viewMode === 'calendar'" v-loading="loading" class="calendar-wrapper">
      <el-calendar v-model="calendarDate" ref="calendarRef">
        <!-- 自定义头部：年份选择 + 月份选择 -->
        <template #header>
          <div class="calendar-custom-header">
            <!-- 年份选择器 -->
            <el-select v-model="selectedYear" placeholder="年份" style="width: 120px" @change="updateCalendar">
              <el-option
                v-for="year in yearList"
                :key="year"
                :label="year + '年'"
                :value="year"
              />
            </el-select>

            <!-- 月份选择器 -->
            <el-select v-model="selectedMonth" placeholder="月份" style="width: 100px; margin-left: 10px;" @change="updateCalendar">
              <el-option
                v-for="month in monthList"
                :key="month"
                :label="month + '月'"
                :value="month"
              />
            </el-select>
            
            <div class="month-nav">
              <el-button size="small" @click="prevMonth">◀ 上个月</el-button>
              <el-button size="small" @click="goOldest">最早</el-button>
              <el-button size="small" @click="goLatest">最新</el-button>
              <el-button size="small" @click="nextMonth">下个月 ▶</el-button>
            </div>
          </div>
        </template>

        <template #date-cell="{ data }">
          <!-- 自定义单元格内容 (保持之前的逻辑不变) -->
          <div
            class="custom-cell"
            :class="{ 'is-singing-day': hasSong(data.day), 'other-month': !isCurrentMonth(data.day) }"
            @click.stop="handleCalendarClick(data.day)"
          >
            <div class="cell-date">
              {{ data.day.split('-').slice(2).join('') }} 
            </div>
            
            <div v-if="hasSong(data.day)" class="cell-content">
              <span>🎵 唱了 {{ getSongCount(data.day) }} 首</span>
            </div>
          </div>
        </template>
      </el-calendar>
    </div>

    <!-- TXT 弹窗 -->
    <el-dialog v-model="dialogVisible" class="content-dialog" width="90vw" top="5vh">
      <template #header>
        <span class="dialog-title">{{ currentFile.filename }}</span>
      </template>
      <pre class="txt-content">{{ currentFile.content }}</pre>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="downloadSingleTxt">下载该切片本</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 一键剪切弹窗 -->
    <el-dialog v-model="clipDialogVisible" class="clip-dialog" width="90vw" top="5vh">
      <template #header>
        <span class="dialog-title">一键剪切</span>
      </template>
      <div class="clip-info" v-if="clipTarget">
        <p><b>歌曲：</b>{{ clipTarget.cleanName }}</p>
        <p><b>时间：</b>{{ clipTarget.startTime }} - {{ clipTarget.endTime }}</p>
        <p><b>直播时间：</b>{{ clipTarget.broadcastTime }}</p>
      </div>
      <el-divider />
      <div class="clip-settings">
        <div class="setting-item">
          <span class="label">类别：</span>
          <el-radio-group v-model="clipOutputCategory">
            <el-radio label="video" border>🎬 视频</el-radio>
            <el-radio label="audio" border>🎵 音频</el-radio>
          </el-radio-group>
        </div>
        <div class="setting-item" style="margin-top: 15px">
          <span class="label">格式：</span>
          <el-select v-model="clipTargetFormat" style="width: 140px" size="large">
            <el-option v-if="clipOutputCategory === 'video'" label="TS (默认)" value="ts" />
            <el-option v-if="clipOutputCategory === 'video'" label="MP4" value="mp4" />
            <el-option v-if="clipOutputCategory === 'video'" label="MKV" value="mkv" />
            <el-option v-if="clipOutputCategory === 'video'" label="AVI" value="avi" />
            <el-option v-if="clipOutputCategory === 'video'" label="MOV" value="mov" />
            <el-option v-if="clipOutputCategory === 'video'" label="WEBM" value="webm" />
            <el-option v-if="clipOutputCategory === 'video'" label="GIF" value="gif" />
            <el-option v-if="clipOutputCategory === 'audio'" label="M4A (默认)" value="m4a" />
            <el-option v-if="clipOutputCategory === 'audio'" label="MP3" value="mp3" />
            <el-option v-if="clipOutputCategory === 'audio'" label="FLAC" value="flac" />
            <el-option v-if="clipOutputCategory === 'audio'" label="WAV" value="wav" />
            <el-option v-if="clipOutputCategory === 'audio'" label="AAC" value="aac" />
            <el-option v-if="clipOutputCategory === 'audio'" label="OPUS" value="opus" />
            <el-option v-if="clipOutputCategory === 'audio'" label="OGG" value="ogg" />
          </el-select>
        </div>
        <div class="setting-item" style="margin-top: 15px">
          <span class="label">并发：</span>
          <el-input-number v-model="clipConcurrency" :min="5" :max="30" :step="5" size="large" style="width: 120px" />
          <span class="tip" style="font-size: 12px; color: #909399; margin-left: 8px">同时下载分片数</span>
        </div>
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
            @click="handleClipSong"
          >
            <el-icon><Scissor /></el-icon>
            {{ isClipping ? `剪切中...` : '开始剪切' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>

  <SongSearchResults
    :visible="searchVisible"
    :query="searchQuery"
    @close="searchVisible = false"
  />
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import JSZip from 'jszip'; 
import { ElMessage } from 'element-plus';
import { Scissor } from '@element-plus/icons-vue';
import * as p48 from '@/api/pocket48';
import { FFmpegManager } from '@/composables/useFFmpeg';
import audioPlayer from '@/composables/useAudioPlayer';
import SongSearchResults from '@/components/SongSearchResults.vue';
	const searchVisible = ref(false);
	const searchQuery = ref('');

const MUSIC_SITE_URL = "https://abm48.com/#/pages/index/index"; 
// 默认模式：切片列表
const viewMode = ref('songs'); 

const allSongs = ref([]);
const searchText = ref('');
const loading = ref(true);
const downloading = ref(false);
const dialogVisible = ref(false);
const currentFile = ref({ filename: '', content: '' });

// --- 一键剪切 ---
const clipDialogVisible = ref(false);
const clipTarget = ref(null);
const clipOutputCategory = ref('video');
const clipTargetFormat = ref('ts');
const isClipping = ref(false);
const clipLogs = ref([]);
const clipLogRef = ref(null);
const clipConcurrency = ref(15);
const clipAbortController = ref(null);

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
  nextTick(() => {
    if (clipLogRef.value) clipLogRef.value.scrollTop = clipLogRef.value.scrollHeight;
  });
});

watch(clipOutputCategory, (cat) => {
  clipTargetFormat.value = cat === 'video' ? 'ts' : 'm4a';
});

// --- 日历控制变量 ---
const calendarDate = ref(new Date()); // 当前日历显示的日期对象
const currentYearNum = new Date().getFullYear();

// 从切片数据中找最早的年月
const earliestYear = computed(() => {
  if (allSongs.value.length === 0) return 2025;
  const dates = allSongs.value.map(s => s.date).filter(Boolean);
  if (dates.length === 0) return 2025;
  const first = dates.sort()[0];
  return parseInt(first.split('-')[0]) || 2025;
});
const earliestMonth = computed(() => {
  if (allSongs.value.length === 0) return 11;
  const dates = allSongs.value.filter(s => s.date?.startsWith(String(earliestYear.value))).map(s => s.date);
  if (dates.length === 0) return 11;
  const first = dates.sort()[0];
  return parseInt(first.split('-')[1]) || 11;
});

// 从切片数据中找最新的年月
const latestYear = computed(() => {
  if (allSongs.value.length === 0) return currentYearNum;
  const dates = allSongs.value.map(s => s.date).filter(Boolean);
  if (dates.length === 0) return currentYearNum;
  return Math.max(...dates.map(d => parseInt(d.split('-')[0])));
});
const latestMonth = computed(() => {
  if (allSongs.value.length === 0) return new Date().getMonth() + 1;
  const dates = allSongs.value.filter(s => s.date?.startsWith(String(latestYear.value))).map(s => s.date);
  if (dates.length === 0) return new Date().getMonth() + 1;
  return Math.max(...dates.map(d => parseInt(d.split('-')[1])));
});

// 生成年份列表 (从最早数据年份到当前年份)
const yearList = computed(() => {
  const years = [];
  for (let y = earliestYear.value; y <= currentYearNum; y++) {
    years.push(y);
  }
  return years;
});

// 当前选中年份下可选的月份（从最早有数据月到最新有数据月）
const monthList = computed(() => {
  let start = 1;
  let end = 12;
  if (selectedYear.value === earliestYear.value) {
    start = earliestMonth.value;
  }
  if (selectedYear.value === latestYear.value) {
    end = latestMonth.value;
  }
  const months = [];
  for (let m = start; m <= end; m++) {
    months.push(m);
  }
  return months;
});

// 绑定的选择器变量（默认今天）
const selectedYear = ref(currentYearNum);
const selectedMonth = ref(new Date().getMonth() + 1);

// 当下拉框变化时，更新日历
const updateCalendar = () => {
  // 如果当前月不在可选列表中，自动跳到第一个可用月
  if (monthList.value.length > 0 && !monthList.value.includes(selectedMonth.value)) {
    selectedMonth.value = monthList.value[0];
  }
  calendarDate.value = new Date(selectedYear.value, selectedMonth.value - 1, 1);
};

// 上个月
const prevMonth = () => {
  const eYear = earliestYear.value;
  const eMonth = earliestMonth.value;
  if (selectedYear.value === eYear && selectedMonth.value <= eMonth) {
    ElMessage.warning('已是最久远的切片本记录月');
    return;
  }
  if (selectedMonth.value === 1) {
    selectedMonth.value = 12;
    selectedYear.value--;
  } else {
    selectedMonth.value--;
  }
  updateCalendar();
};

// 下个月
const nextMonth = () => {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  if (selectedYear.value === latestYear.value && selectedMonth.value >= latestMonth.value) {
    ElMessage.warning('暂无更新的切片本');
    return;
  }
  if (selectedMonth.value === 12) {
    selectedMonth.value = 1;
    selectedYear.value++;
  } else {
    selectedMonth.value++;
  }
  updateCalendar();
};

const goLatest = () => {
  if (selectedYear.value === latestYear.value && selectedMonth.value === latestMonth.value) {
    ElMessage.warning('已是最新的切片本记录月');
    return;
  }
  resetToLatest();
};

const goOldest = () => {
  if (selectedYear.value === earliestYear.value && selectedMonth.value === earliestMonth.value) {
    ElMessage.warning('已是最久远的切片本记录月');
    return;
  }
  selectedYear.value = earliestYear.value;
  selectedMonth.value = earliestMonth.value;
  updateCalendar();
};

const resetToLatest = () => {
  selectedYear.value = latestYear.value;
  selectedMonth.value = latestMonth.value;
  updateCalendar();
};

onMounted(async () => {
  document.title = '徐郑子滢 ✽ 直播唱歌记录';
  try {
    const res = await fetch(`/data.json?t=${new Date().getTime()}`);
    if (res.ok) {
      allSongs.value = await res.json();
    }
  } catch (e) { console.error(e); } 
  finally {
    loading.value = false;
    resetToLatest();
  }
});

const filteredList = computed(() => {
  if (!searchText.value) return allSongs.value;
  const query = searchText.value.toLowerCase().trim();
  const queryNoDash = query.replace(/-/g, '');
  return allSongs.value.filter(song => {
    const dateNoDash = song.date.replace(/-/g, '');
    return song.cleanName.toLowerCase().includes(query) ||
           song.rawName.toLowerCase().includes(query) ||
           song.date.includes(query) ||
           dateNoDash.includes(queryNoDash);
  });
});

const fileCount = computed(() => {
  const files = new Set(filteredList.value.map(item => item.filename));
  return files.size;
});

const dateGroups = computed(() => {
  const groups = {};
  allSongs.value.forEach(song => {
    if (!groups[song.date]) groups[song.date] = [];
    groups[song.date].push(song);
  });
  return groups;
});

// --- 日历相关的逻辑 ---

// 1. 判断日期是否在当前月
const isCurrentMonth = (dayStr) => {
  const parts = dayStr.split('-')
  return parseInt(parts[1]) === selectedMonth.value && parseInt(parts[0]) === selectedYear.value
}

// 2. 判断某天是否有歌
const hasSong = (dayStr) => {
  return !!dateGroups.value[dayStr];
};

// 2. 获取某天歌曲数量
const getSongCount = (dayStr) => {
  return dateGroups.value[dayStr] ? dateGroups.value[dayStr].length : 0;
};

// 3. 处理日历点击
const handleCalendarClick = (dayStr) => {
  if (hasSong(dayStr)) {
    // 如果有歌：跳转到列表并搜索该日期
    selectDate(dayStr);
  } else {
    // 如果没歌：提示用户
    ElMessage.info(`${dayStr} 小偶像没有唱歌哦 ~`);
  }
};

const selectDate = (date) => {
  searchText.value = date.replace(/-/g, '');
  viewMode.value = 'songs'; // 切回列表模式
  window.scrollTo({ top: 0, behavior: 'smooth' });
  ElMessage.success(`已定位到 ${date} 的记录`);
};

// --- 其他逻辑保持不变 ---
const copyAndJump = async (item) => {
  const dateForSearch = item.date.replace(/-/g, '');
  const keywords = `${item.cleanName} 徐郑子滢 ${dateForSearch}`;
  navigator.clipboard.writeText(keywords).catch(() => {});
  searchQuery.value = keywords;
  searchVisible.value = true;
};

const openTxtModal = (item) => {
  currentFile.value = { filename: item.filename, content: item.fullContent };
  dialogVisible.value = true;
};

const downloadSingleTxt = () => {
  const blob = new Blob([currentFile.value.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = currentFile.value.filename;
  link.click();
  URL.revokeObjectURL(url);
};

const handleBatchDownload = async () => {
  if (filteredList.value.length === 0) { ElMessage.warning('列表为空'); return; }
  downloading.value = true;
  const zip = new JSZip();
  const processedFiles = new Set();
  filteredList.value.forEach(song => {
    if (!processedFiles.has(song.filename)) {
      zip.file(song.filename, song.fullContent);
      processedFiles.add(song.filename);
    }
  });
  try {
    const content = await zip.generateAsync({ type: 'blob' });
    const dateStr = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `xzzy_Archive_${dateStr}.zip`;
    link.click();
    ElMessage.success(`成功打包下载 ${processedFiles.size} 个文件！`);
  } catch (err) { ElMessage.error('打包下载失败'); } 
  finally { downloading.value = false; }
};

// --- 一键剪切 ---
const openClipDialog = (item) => {
  clipTarget.value = item;
  clipLogs.value = [];
  clipDialogVisible.value = true;
};

const getAudioEncoder = (format) => {
  switch (format) {
    case 'mp3': return ['-c:a', 'libmp3lame'];
    case 'm4a': case 'aac': return ['-c:a', 'aac'];
    case 'flac': return ['-c:a', 'flac'];
    case 'wav': return ['-c:a', 'pcm_s16le'];
    case 'opus': return ['-c:a', 'libopus'];
    case 'ogg': return ['-c:a', 'libvorbis'];
    default: return ['-c:a', 'aac'];
  }
};

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

const handleClipSong = async () => {
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

    // --- 滑动窗口 Worker Pool，CDN + 直连 两路竞速 ---
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
          if (!resp.ok) {
            let msg = `HTTP ${resp.status}`;
            try { const body = await resp.json(); msg += `: ${body.error}`; } catch {}
            throw new Error(msg);
          }
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
        const idx = nextIdx;
        nextIdx++;
        if (idx >= neededSegs.length) break;
        const result = await fetchSeg(neededSegs[idx].url, idx, neededSegs.length);
        pathWins[result.label]++;
        buffers[idx] = result.data;
      }
    };

    const workerCount = Math.min(clipConcurrency.value, neededSegs.length);
    const workers = [];
    for (let w = 0; w < workerCount; w++) {
      workers.push(worker());
    }
    await Promise.all(workers);

    if (signal.aborted) throw new DOMException('用户取消', 'AbortError');

    addClipLog(`  📡 CDN:${pathWins.CDN} 直连:${pathWins['直连']}`);

    const totalLen = buffers.reduce((a, b) => a + b.byteLength, 0);
    if (totalLen > 1.4 * 1024 * 1024 * 1024) {
      throw new Error(`下载数据 ${(totalLen / 1024 / 1024 / 1024).toFixed(1)}GB 超过浏览器 WASM 内存上限 (1.4GB)`);
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
    const isAudio = ['mp3', 'm4a', 'flac', 'wav', 'aac', 'opus', 'ogg'].includes(format);
    const outExt = '.' + format;
    const outputName = 'output' + outExt;
    const clipOffset = startSec - firstSegStart;
    const clipDuration = endSec - startSec;
    const baseCmd = ['-ss', String(clipOffset), '-i', 'concat.ts', '-to', String(clipOffset + clipDuration)];

    addClipLog(`✂️ 剪切: ${item.cleanName} -> ${format.toUpperCase()}`);
    const copyable = ['ts', 'mp4', 'mkv', 'avi', 'mov', 'webm', 'm4a'];

    if (copyable.includes(format)) {
      try {
        const copyCmd = isAudio
          ? [...baseCmd, '-vn', '-c:a', 'copy', outputName]
          : [...baseCmd, '-c', 'copy', outputName];
        await ffmpegMgr.ffmpeg.exec(copyCmd);
        await ffmpegMgr.ffmpeg.readFile(outputName);
      } catch {
        addClipLog('  ⚠️ copy 失败，回退重编码...');
        const encArgs = isAudio ? ['-vn', ...getAudioEncoder(format)] : ['-c:v', 'libx264', '-c:a', 'aac'];
        await ffmpegMgr.ffmpeg.exec([...baseCmd, ...encArgs, outputName]);
      }
    } else {
      const encArgs = isAudio ? ['-vn', ...getAudioEncoder(format)] : ['-c:v', 'libx264', '-c:a', 'aac'];
      await ffmpegMgr.ffmpeg.exec([...baseCmd, ...encArgs, outputName]);
    }

    const data = await ffmpegMgr.ffmpeg.readFile(outputName);
    downloadBlob(data, `${item.cleanName}${outExt}`);
    await ffmpegMgr.ffmpeg.deleteFile(outputName);
    await ffmpegMgr.ffmpeg.deleteFile('concat.ts');

    if (!(await ffmpegMgr.isAlive())) {
      addClipLog('♻️ FFmpeg 实例已终止，正在重建...');
      await ffmpegMgr.restart();
    }

    addClipLog('✅ 下载完成！');
    ElMessage.success(`「${item.cleanName}」剪切完成！`);
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
.home-page { padding-bottom: 50px; }
.notice-card { margin-bottom: 20px; background: rgba(255, 255, 255, 0.95); }
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* 允许换行，防止手机端挤爆 */
  gap: 10px;       /* 上下左右的间距 */
}

/* --- 新增以下样式 --- */
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px; /* 两个按钮之间的间距 */
  flex-wrap: wrap;
}

.upload-link {
  text-decoration: none; /* 去掉 router-link 默认的下划线 */
}
.header-title { font-weight: bold; font-size: 18px; color: #333; }
.batch-download-btn { font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(64, 158, 255, 0.3); }
.notice-content p { margin: 5px 0; font-size: 14px; color: #555; }
.mode-switch { display: flex; justify-content: center; margin-bottom: 25px; }

/* 列表样式 */
.search-section { margin-bottom: 20px; }
.song-card { margin-bottom: 15px; background: rgba(255, 255, 255, 0.9); }
.card-body { display: flex; justify-content: space-between; align-items: center; }
@media (max-width: 600px) {
  .card-body { flex-direction: column; align-items: flex-start; }
  .actions { margin-top: 15px; width: 100%; display: flex; justify-content: space-between; }
  .card-header { flex-direction: column; align-items: flex-start; gap: 10px; }
}
.song-title { margin: 0 0 8px 0; font-size: 18px; color: #333; }
.meta { color: #666; font-size: 14px; }
.time-range { margin-left: 10px; }
.txt-content { white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 15px; max-height: 60vh; overflow-y: auto; }

/* 日期卡片归档样式 */
.date-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
.date-card { background: rgba(255, 255, 255, 0.9); padding: 15px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.date-card:hover { transform: translateY(-3px); background: #fff; border: 1px solid #409EFF; box-shadow: 0 5px 15px rgba(64, 158, 255, 0.2); }
.date-header { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 5px; }
.date-count { font-size: 13px; color: #ff6b81; font-weight: bold; margin-bottom: 10px; }
.date-preview span { background: #f0f2f5; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #888; margin-right: 5px;}

/* --- 日历视图样式 (核心修改) --- */
/* 日历自定义头部样式 */
.calendar-custom-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}
.month-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

@media (max-width: 768px) {
  .calendar-custom-header {
    flex-wrap: wrap;
    gap: 6px;
  }
  .calendar-custom-header .el-select {
    flex: 1 1 45%;
    min-width: 90px;
    margin-left: 0 !important;
  }
  .calendar-custom-header .month-nav {
    flex-basis: 100%;
    margin-left: 0;
    display: flex;
    justify-content: center;
    gap: 4px;
  }
  .calendar-custom-header .month-nav .el-button {
    flex: 1;
    font-size: 12px;
    padding: 5px 6px;
    white-space: nowrap;
  }
  .custom-cell {
    padding: 4px;
  }
  .cell-date {
    font-size: 12px;
  }
  .cell-content span {
    font-size: 10px;
  }
}

.calendar-wrapper {
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 8px;
}

/* 强制让 element-plus 的日历单元格内容撑满，方便点击 */
:deep(.el-calendar-table .el-calendar-day) {
  padding: 0;
  height: 85px; /* 设置单元格高度 */
}

.custom-cell {
  height: 100%;
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.2s;
}

.cell-date {
  font-size: 14px;
}

/* 有歌的日子：黑体加粗，背景微蓝 */
.is-singing-day {
  background-color: #ecf5ff; /* 浅蓝背景 */
  color: #409EFF;
  font-weight: bold;
  cursor: pointer;
}

.is-singing-day:hover {
  background-color: #d9ecff;
}

.custom-cell.other-month {
  color: #999;
}
.custom-cell.other-month.is-singing-day {
  color: #409EFF;
}

.cell-content {
  font-size: 12px;
  color: #ff6b81; /* 粉色显示歌曲数 */
  margin-top: 4px;
}

/* 弹窗标题居中加粗 */
:deep(.el-dialog__header) {
  text-align: center;
}
.dialog-title {
  font-weight: bold;
  font-size: 18px;
}

/* 没歌的日子 (默认样式其实就是透明，但为了保险可以写一下) */
/* Element Plus 默认非本月日期是灰色的，这里不需要额外处理 */

.clip-info {
  background: #f5f7fa;
  padding: 12px 16px;
  border-radius: 8px;
}
.clip-info p {
  margin: 4px 0;
  font-size: 14px;
}
.clip-settings .setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
}
.clip-settings .label {
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
}
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

@media (max-width: 767px) {
  .log-box {
    height: 150px;
  }
}
.log-line {
  margin-bottom: 2px;
  word-break: break-all;
}
</style>

<style>
.content-dialog,
.clip-dialog {
  border-radius: 12px;
}

@media (min-width: 768px) {
  .content-dialog,
  .clip-dialog {
    max-width: 640px;
  }
}
</style>
