<template>
  <div class="bilibili-page">
    <!-- 顶部统计 -->
    <div class="page-header">
      <h1 class="page-title">🎬 B站安利 · 徐郑子滢</h1>
      <p class="page-stats">
        共 <b>{{ allVideos.length }}</b> 个视频 · 来自 <b>{{ upList.length }}</b> 位UP主
        <span v-if="activeUp"> · 当前UP主: <b>{{ activeUp }}</b> ({{ upFilteredCount }}个视频)</span>
      </p>
    </div>

    <!-- UP主筛选区 -->
    <el-card class="up-filter-card" shadow="never">
      <div class="up-filter-area">
        <span
          class="up-chip"
          :class="{ active: activeUp === null }"
          @click="activeUp = null"
        >全部 ({{ allVideos.length }})</span>
        <span
          v-for="up in upList"
          :key="up.name"
          class="up-chip"
          :class="{ active: activeUp === up.name }"
          @click="activeUp = activeUp === up.name ? null : up.name"
        >{{ up.name }} ({{ up.videoCount }})</span>
      </div>
    </el-card>

    <!-- 搜索 + 排序栏 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <!-- 搜索 -->
        <div class="search-area">
          <el-input
            v-model="searchText"
            placeholder="搜索视频标题、简介、分P标题..."
            size="large"
            clearable
            :prefix-icon="Search"
            class="search-input"
          />
          <el-radio-group v-model="searchMode" size="default" class="search-mode">
            <el-radio-button label="exact">
              <el-icon><Connection /></el-icon> 精确
            </el-radio-button>
            <el-radio-button label="fuzzy">
              <el-icon><Menu /></el-icon> 模糊
            </el-radio-button>
          </el-radio-group>
        </div>

        <!-- 排序 -->
        <div class="sort-area">
          <span class="sort-label">排序:</span>
          <el-select v-model="sortField" size="default" style="width: 130px">
            <el-option label="发布时间" value="created" />
            <el-option label="播放量" value="view" />
            <el-option label="点赞" value="like" />
            <el-option label="投币" value="coin" />
            <el-option label="收藏" value="favorite" />
            <el-option label="分享" value="share" />
            <el-option label="评论" value="reply" />
            <el-option label="弹幕" value="danmaku" />
          </el-select>
          <el-button
            :icon="sortAsc ? SortUp : SortDown"
            size="default"
            @click="sortAsc = !sortAsc"
            class="sort-order-btn"
          >
            {{ sortAsc ? '升序' : '降序' }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 快速检索标签 -->
    <el-card class="quick-tags-card" shadow="never">
      <div class="quick-tags-area">
        <span class="quick-tags-label">🔥 快速检索:</span>
        <el-tag
          v-for="tag in quickTags"
          :key="tag"
          :type="searchText === tag ? '' : 'info'"
          :effect="searchText === tag ? 'dark' : 'plain'"
          size="default"
          class="quick-tag"
          @click="searchText = searchText === tag ? '' : tag"
        >
          {{ tag }}
        </el-tag>
      </div>
    </el-card>

    <!-- 搜索摘要 -->
    <div v-if="searchText && !loading" class="search-summary">
      搜索 "<b>{{ searchText }}</b>" 找到 <b>{{ filteredVideos.length }}</b> 个结果
      <span v-if="searchMode === 'fuzzy'" class="mode-badge">模糊匹配</span>
      <span v-else class="mode-badge">精确匹配</span>
    </div>

    <!-- 视频列表 -->
    <div v-if="pagedVideos.length > 0" class="video-grid">
      <div
        v-for="video in pagedVideos"
        :key="video.bvid"
        class="video-card"
        @click="openVideo(video)"
      >
        <!-- 封面区 -->
        <div class="cover-wrapper">
          <img
            :src="fixCoverUrl(video.cover)"
            :alt="video.title"
            class="cover-img"
            loading="lazy"
            referrerpolicy="no-referrer"
            crossorigin="anonymous"
            @error="onCoverError($event)"
          />
          <span class="duration-tag">{{ formatDuration(video.duration) }}</span>
          <div class="cover-overlay">
            <el-icon :size="36"><VideoPlay /></el-icon>
          </div>
        </div>

        <!-- 信息区 -->
        <div class="card-info">
          <h3 class="video-title" :title="video.title">
            <span v-html="highlightMatches(video.title)"></span>
          </h3>

          <div class="video-meta">
            <span class="up-name">{{ video.upName }}</span>
            <span class="video-stat">
              <el-icon><VideoCamera /></el-icon>
              {{ formatNumber(video.stat.view || 0) }}
            </span>
          </div>

          <!-- 分P信息 -->
          <div v-if="video.pages.length > 1" class="pages-info">
            <el-icon><Tickets /></el-icon>
            <span class="pages-count">{{ video.pages.length }}P</span>
            <span
              v-for="(page, idx) in video.pages"
              :key="page.cid"
              class="page-part"
              :class="{ 'page-match': isPartMatched(page.part) }"
            >
              {{ page.part || `P${idx + 1}` }}<span v-if="idx < video.pages.length - 1">, </span>
            </span>
          </div>

          <!-- 简介匹配提示 -->
          <div v-if="searchText && isDescMatched(video) && !isTitleMatched(video)" class="match-hint">
            🎯 简介匹配
          </div>
          <div v-if="searchText && isPartOnlyMatch(video) && !isTitleMatched(video)" class="match-hint">
            🎯 分P标题匹配: <span v-html="highlightMatches(getMatchedPart(video))"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination-area">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredVideos.length"
        layout="prev, pager, next, total"
        background
        @current-change="scrollToTop"
      />
    </div>

    <!-- 空状态 -->
    <el-empty v-else-if="!loading" description="没有找到匹配的视频 🍃" />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="6" animated />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Search, Connection, Menu, SortUp, SortDown,
  VideoPlay, VideoCamera, Tickets
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// ── 数据 ──
const allVideos = ref([])
const upList = ref([])
const loading = ref(true)

// ── 搜索 & 筛选状态 ──
const searchText = ref('')
const searchMode = ref('exact') // 'exact' | 'fuzzy'
const activeUp = ref(null)      // null = 全部
const sortField = ref('created')
const sortAsc = ref(false)      // 默认降序

// ── 快速检索标签 ──
const quickTags = [
  'focus', '直拍','舞台','直播', '唱歌','minilive',
  'cut', '合集',  
]

// ── 分页 ──
const currentPage = ref(1)
const pageSize = 24
const totalPages = computed(() => Math.ceil(filteredVideos.value.length / pageSize))

const pagedVideos = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredVideos.value.slice(start, start + pageSize)
})

// 搜索文本变化时重置页码
watch([searchText, activeUp, sortField, sortAsc, searchMode], () => {
  currentPage.value = 1
})

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ── 加载数据 ──
onMounted(async () => {
  document.title = '徐郑子滢 ✽ B站安利'
  try {
    const res = await fetch('/data/bilibili-merged.json')
    const data = await res.json()
    allVideos.value = data.videos || []
    upList.value = data.upList || []
  } catch (e) {
    console.error('加载视频数据失败:', e)
    ElMessage.error('加载视频数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
})

// ── UP主筛选后的数量 ──
const upFilteredCount = computed(() => {
  if (!activeUp.value) return allVideos.value.length
  return allVideos.value.filter(v => v.upName === activeUp.value).length
})

// ── 搜索匹配逻辑 ──
function exactMatch(text, query) {
  if (!query) return true
  return text.toLowerCase().includes(query.toLowerCase())
}

function fuzzyMatch(text, query) {
  if (!query) return true
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  let qi = 0
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++
  }
  return qi === q.length
}

const matchFn = computed(() => searchMode.value === 'exact' ? exactMatch : fuzzyMatch)

// ── 过滤 + 排序 ──
const filteredVideos = computed(() => {
  const query = searchText.value.trim()
  const up = activeUp.value
  const match = matchFn.value

  let videos = allVideos.value

  // UP主筛选
  if (up) {
    videos = videos.filter(v => v.upName === up)
  }

  // 搜索筛选
  if (query) {
    videos = videos.filter(v => {
      // 标题匹配
      if (match(v.title, query)) return true
      // 简介匹配
      if (match(v.description || '', query)) return true
      // 分P标题匹配
      if (v.pages && v.pages.some(p => match(p.part || '', query))) return true
      return false
    })
  }

  // 排序
  const sorted = [...videos]
  const field = sortField.value
  const asc = sortAsc.value

  sorted.sort((a, b) => {
    let va, vb
    if (field === 'created') {
      va = a.created || 0
      vb = b.created || 0
    } else {
      va = (a.stat && a.stat[field]) || 0
      vb = (b.stat && b.stat[field]) || 0
    }
    return asc ? va - vb : vb - va
  })

  return sorted
})

// ── 辅助函数 ──

// B站封面 http → https，并处理各种格式
function fixCoverUrl(url) {
  if (!url) return ''
  let fixed = url.trim()
  // 统一转为 https
  fixed = fixed.replace(/^https?:\/\//i, 'https://')
  // 如果 // 开头，补 https:
  if (fixed.startsWith('//')) fixed = 'https:' + fixed
  return fixed
}

// 封面加载失败用默认图
function onCoverError(e) {
  console.warn('[B站安利] 封面加载失败:', e.target.src)
  // 尝试用 http 重新加载（适用于某些 CDN 节点）
  if (e.target.src.startsWith('https://') && !e.target.dataset.retried) {
    e.target.dataset.retried = '1'
    e.target.src = e.target.src.replace(/^https:\/\//i, 'http://')
    return
  }
  e.target.src = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" fill="%23f5f5f5"><rect width="320" height="180"/><text x="160" y="90" text-anchor="middle" fill="%23999" font-size="13">封面加载失败</text><text x="160" y="110" text-anchor="middle" fill="%23bbb" font-size="11">点击跳转B站观看</text></svg>'
  )
}

function formatDuration(seconds) {
  if (!seconds) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatNumber(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

// 高亮匹配文本
function highlightMatches(text) {
  const query = searchText.value.trim()
  if (!query) return escapeHtml(text)
  const escaped = escapeHtml(text)
  const q = escapeHtml(query)
  if (searchMode.value === 'exact') {
    const re = new RegExp(`(${escapeRegex(q)})`, 'gi')
    return escaped.replace(re, '<mark class="highlight">$1</mark>')
  }
  return escaped // 模糊匹配不高亮（分散的字符无法可视化）
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 判断各项匹配
function isTitleMatched(video) {
  const query = searchText.value.trim()
  if (!query) return false
  return matchFn.value(video.title, query)
}

function isDescMatched(video) {
  const query = searchText.value.trim()
  if (!query) return false
  return matchFn.value(video.description || '', query)
}

function isPartMatched(part) {
  const query = searchText.value.trim()
  if (!query) return false
  return matchFn.value(part || '', query)
}

function isPartOnlyMatch(video) {
  const query = searchText.value.trim()
  if (!query) return false
  if (isTitleMatched(video)) return false
  return video.pages && video.pages.some(p => matchFn.value(p.part || '', query))
}

function getMatchedPart(video) {
  const query = searchText.value.trim()
  if (!query || !video.pages) return ''
  const matched = video.pages.find(p => matchFn.value(p.part || '', query))
  return matched ? (matched.part || '') : ''
}

// 跳转B站（如果匹配的是分P标题，跳转到对应分P）
function openVideo(video) {
  let url = `https://www.bilibili.com/video/${video.bvid}`
  // 如果搜索命中的是分P标题而非主标题，带上 ?p= 参数
  const query = searchText.value.trim()
  if (query && !isTitleMatched(video) && video.pages && video.pages.length > 1) {
    const matchedIdx = video.pages.findIndex(p => matchFn.value(p.part || '', query))
    if (matchedIdx >= 0) {
      url += `?p=${matchedIdx + 1}`
    }
  }
  window.open(url, '_blank')
}
</script>

<style scoped>
/* ── 页面整体 ── */
.bilibili-page {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 16px 40px;
  overflow-x: hidden;
}

.page-header {
  text-align: center;
  margin-bottom: 20px;
}
.page-title {
  font-size: 1.8rem;
  color: #ff6699;
  margin: 0 0 6px;
}
.page-stats {
  color: #909399;
  font-size: 14px;
  margin: 0;
}
.page-stats b {
  color: #303133;
}

/* ── UP主筛选 ── */
.up-filter-card {
  margin-bottom: 16px;
  border-radius: 12px;
}
.up-filter-area {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.up-chip {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  background: #f5f5f5;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  user-select: none;
}
.up-chip:hover {
  background: #e8f4ff;
  color: #409EFF;
}
.up-chip.active {
  background: #409EFF;
  color: #fff;
  font-weight: 600;
}

/* ── 工具栏 ── */
.toolbar-card {
  margin-bottom: 20px;
  border-radius: 12px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.search-area {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 300px;
}
.search-input {
  max-width: 400px;
}
.search-mode {
  flex-shrink: 0;
}
.sort-area {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.sort-label {
  color: #909399;
  font-size: 14px;
}
.sort-order-btn {
  white-space: nowrap;
}

/* ── 快速检索标签 ── */
.quick-tags-card {
  margin-bottom: 16px;
  border-radius: 12px;
}
.quick-tags-area {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.quick-tags-label {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
  margin-right: 4px;
}
.quick-tag {
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s;
}
.quick-tag:hover {
  transform: scale(1.05);
}
.search-summary {
  margin-bottom: 16px;
  font-size: 14px;
  color: #606266;
}
.search-summary b {
  color: #303133;
}
.mode-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 12px;
  background: #e8f4ff;
  color: #409EFF;
}

/* ── 视频卡片网格 ── */
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.video-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

/* 封面 */
.cover-wrapper {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 */
  background: #f0f0f0;
  overflow: hidden;
}
.cover-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}
.video-card:hover .cover-img {
  transform: scale(1.05);
}
.duration-tag {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}
.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
}
.video-card:hover .cover-overlay {
  opacity: 1;
}

/* 信息 */
.card-info {
  padding: 12px 14px 14px;
}
.video-title {
  font-size: 14px;
  font-weight: 600;
  color: #222;
  line-height: 1.5;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.video-title :deep(.highlight) {
  background: #fff3cd;
  color: #e6a23c;
  padding: 1px 2px;
  border-radius: 2px;
}
.video-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}
.up-name {
  color: #409EFF;
  font-weight: 500;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.video-stat {
  display: flex;
  align-items: center;
  gap: 3px;
}

/* 分P信息 */
.pages-info {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  flex-wrap: wrap;
  line-height: 1.6;
  max-height: 36px;
  overflow: hidden;
  margin-top: 4px;
}
.pages-count {
  color: #409EFF;
  font-weight: 600;
  white-space: nowrap;
}
.page-part {
  white-space: nowrap;
}
.page-part.page-match {
  background: #fff3cd;
  color: #e6a23c;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
}

.match-hint {
  font-size: 12px;
  color: #e6a23c;
  margin-top: 6px;
  background: #fff8e1;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.loading-state {
  min-height: 200px;
}

/* ── 分页 ── */
.pagination-area {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 16px 0;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-area {
    flex-direction: column;
    align-items: stretch;
    min-width: 0;
  }
  .search-input {
    max-width: none;
  }
  .sort-area {
    justify-content: flex-end;
  }
  .page-title {
    font-size: 1.4rem;
  }
}
</style>
