<template>
  <div class="douyin-page">
    <div class="page-header">
      <p class="page-stats">共 <b>{{ allWorks.length }}</b> 条作品 · 来自 <b>{{ accounts.length }}</b> 个账号
        <span v-if="activeAccount"> · 当前账号：<b>{{ activeAccount }}</b>（{{ accountFilteredCount }} 条）</span>
      </p>
      <p class="page-stats">所有发布时间均为北京时间</p>
    </div>

    <el-card class="account-filter-card" shadow="never">
      <div class="account-filter-area">
        <span class="account-chip" :class="{ active: activeAccount === null }" @click="activeAccount = null">全部（{{ allWorks.length }}）</span>
        <span v-for="account in accounts" :key="account.listed_name" class="account-chip"
          :class="{ active: activeAccount === account.listed_name }" @click="toggleAccount(account.listed_name)">
          {{ account.listed_name }}（{{ account.work_count }}）
        </span>
      </div>
    </el-card>

    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="search-area">
          <el-input v-model="searchText" placeholder="搜索作品标题、描述、标签或账号..." size="large" clearable
            :prefix-icon="Search" class="search-input" />
          <el-radio-group v-model="searchMode" size="default" class="search-mode">
            <el-radio-button label="exact"><el-icon><Connection /></el-icon> 精确</el-radio-button>
            <el-radio-button label="fuzzy"><el-icon><Menu /></el-icon> 模糊</el-radio-button>
          </el-radio-group>
        </div>
        <div class="sort-area">
          <span class="sort-label">排序：</span>
          <el-select v-model="sortField" size="default" style="width:130px">
            <el-option label="发布时间" value="created" /><el-option label="点赞" value="like" />
            <el-option label="收藏" value="collect" /><el-option label="评论" value="comment" /><el-option label="分享" value="share" />
          </el-select>
          <el-button :icon="sortAsc ? SortUp : SortDown" @click="sortAsc = !sortAsc" class="sort-order-btn">{{ sortAsc ? '升序' : '降序' }}</el-button>
        </div>
      </div>
    </el-card>

    <div v-if="searchText && !loading" class="search-summary">搜索“<b>{{ searchText }}</b>”找到 <b>{{ filteredWorks.length }}</b> 个结果
      <span class="mode-badge">{{ searchMode === 'fuzzy' ? '模糊匹配' : '精确匹配' }}</span>
    </div>

    <div v-if="pagedWorks.length" class="work-grid">
      <article v-for="work in pagedWorks" :key="work.aweme_id" class="work-card" @click="openWork(work)">
        <div class="work-head"><div><strong class="account-name">{{ work.listed_name || work.author?.nickname }}</strong>
          <div class="work-time">{{ formatDateTime(work) }}</div></div>
          <el-tag v-if="work.is_pinned" type="info" size="small">置顶</el-tag>
        </div>
        <h3 class="work-title" v-html="highlightMatches(work.title || '无标题作品')"></h3>
        <div v-if="work.description && work.description !== work.title" class="work-description" v-html="highlightMatches(work.description)"></div>
        <div v-if="work.tags?.length" class="tags"><span v-for="tag in work.tags" :key="tag">#{{ tag }}</span></div>
        <div class="work-details">
          <span>{{ mediaLabel(work) }}</span>
          <span v-if="work.media?.duration_ms">时长 {{ formatDuration(work.media.duration_ms) }}</span>
          <span v-if="work.co_creators?.length">共创 {{ work.co_creators.map(item => item.nickname || item).join('、') }}</span>
        </div>
        <div class="work-stats"><span>点赞 {{ formatNumber(work.statistics?.like) }}</span><span>收藏 {{ formatNumber(work.statistics?.collect) }}</span>
          <span>评论 {{ formatNumber(work.statistics?.comment) }}</span><span>分享 {{ formatNumber(work.statistics?.share) }}</span></div>
      </article>
    </div>
    <div v-if="totalPages > 1" class="pagination-area"><el-pagination v-model:current-page="currentPage" :page-size="pageSize"
      :total="filteredWorks.length" layout="prev, pager, next, total" background @current-change="scrollToTop" /></div>
    <el-empty v-else-if="!loading && !pagedWorks.length" description="没有找到匹配的抖音作品 🍃" />
    <div v-if="loading" class="loading-state"><el-skeleton :rows="8" animated /></div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Connection, Menu, Search, SortDown, SortUp } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const allWorks = ref([]), accounts = ref([]), loading = ref(true)
const activeAccount = ref(null), searchText = ref(''), searchMode = ref('exact'), sortField = ref('created'), sortAsc = ref(false), currentPage = ref(1)
const pageSize = 24
const accountFilteredCount = computed(() => activeAccount.value ? allWorks.value.filter(work => work.listed_name === activeAccount.value).length : allWorks.value.length)
const matchFn = computed(() => searchMode.value === 'exact' ? exactMatch : fuzzyMatch)
const filteredWorks = computed(() => {
  const query = searchText.value.trim(); let works = allWorks.value
  if (activeAccount.value) works = works.filter(work => work.listed_name === activeAccount.value)
  if (query) works = works.filter(work => matchFn.value([work.title, work.description, work.listed_name, work.author?.nickname, ...(work.tags ?? []), ...(work.mentions ?? [])].join(' '), query))
  return [...works].sort((a, b) => { const left = sortValue(a, sortField.value), right = sortValue(b, sortField.value); return sortAsc.value ? left - right : right - left })
})
const totalPages = computed(() => Math.ceil(filteredWorks.value.length / pageSize))
const pagedWorks = computed(() => filteredWorks.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))
function exactMatch(text, query) { return String(text || '').toLowerCase().includes(query.toLowerCase()) }
function fuzzyMatch(text, query) { const source = String(text || '').toLowerCase(), target = query.toLowerCase(); let index = 0; for (const char of source) if (char === target[index]) index += 1; return index === target.length }
function sortValue(work, field) { return field === 'created' ? Number(work.create_time ?? 0) : Number(work.statistics?.[field] ?? 0) }
function toggleAccount(name) { activeAccount.value = activeAccount.value === name ? null : name }
function openWork(work) { window.open(work.url, '_blank', 'noopener') }
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }
function formatDateTime(work) { return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(Number(work.create_time ?? 0) * 1000)) }
function formatNumber(value = 0) { if (value >= 10000) return `${(value / 10000).toFixed(1)}万`; if (value >= 1000) return `${(value / 1000).toFixed(1)}k`; return String(value) }
function formatDuration(ms) { const seconds = Math.round(ms / 1000), hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds % 3600 / 60), rest = seconds % 60; return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}` }
function mediaLabel(work) { return work.media_type === 'image' || work.media?.image_count ? `🖼️ ${work.media?.image_count ? `${work.media.image_count}张图片` : '图文'}` : '🎬 视频' }
function escapeHtml(value = '') { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function highlightMatches(value = '') { const escaped = escapeHtml(value), query = searchText.value.trim(); if (!query || searchMode.value === 'fuzzy') return escaped.replace(/\n/g, '<br>'); return escaped.replace(new RegExp(`(${escapeRegex(query)})`, 'gi'), '<mark class="highlight">$1</mark>').replace(/\n/g, '<br>') }
watch([searchText, searchMode, activeAccount, sortField, sortAsc], () => { currentPage.value = 1 })
onMounted(async () => { try { const response = await fetch('/data/douyin-merged.json'); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); allWorks.value = data.works ?? []; accounts.value = data.accounts ?? [] } catch (error) { console.error('加载抖音数据失败:', error); ElMessage.error('加载抖音数据失败，请先运行合并脚本') } finally { loading.value = false } })
</script>

<style scoped>
.douyin-page{max-width:1300px;margin:0 auto;padding:0 16px 40px;overflow-x:hidden}.page-header{text-align:center;margin-bottom:20px}.page-stats{color:#909399;font-size:14px;margin:0}.page-stats b{color:#303133}.account-filter-card,.toolbar-card{margin-bottom:16px;border-radius:12px}.account-filter-area{display:flex;flex-wrap:nowrap;gap:8px;overflow-x:auto;padding-bottom:2px}.account-chip{display:inline-block;padding:6px 14px;border-radius:20px;background:#f5f5f5;color:#606266;font-size:13px;cursor:pointer;transition:.2s;white-space:nowrap;user-select:none}.account-chip:hover{background:#e8f4ff;color:#409eff}.account-chip.active{background:#409eff;color:#fff;font-weight:600}.toolbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px}.search-area{display:flex;align-items:center;gap:12px;flex:1;min-width:300px}.search-input{max-width:400px}.search-mode{display:inline-flex;flex-wrap:nowrap;flex-shrink:0}.sort-area{display:flex;align-items:center;gap:10px;flex-shrink:0}.sort-label{color:#909399;font-size:14px}.sort-order-btn{white-space:nowrap}.search-summary{margin-bottom:16px;font-size:14px;color:#606266}.mode-badge{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:10px;font-size:12px;background:#fff0f4;color:#e94f87}.work-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.work-card{display:flex;flex-direction:column;min-width:0;background:#fff;border-radius:12px;padding:18px;box-shadow:0 2px 8px #0000000f;cursor:pointer;transition:.2s}.work-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px #0000001a}.work-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.account-name{color:#e94f87}.work-time{font-size:12px;color:#a8abb2;margin-top:4px}.work-title{font-size:15px;line-height:1.75;color:#303133;word-break:break-word;margin:0;font-weight:600}.work-description{font-size:14px;line-height:1.7;color:#606266;margin-top:8px;word-break:break-word}.tags{display:flex;flex-wrap:wrap;gap:4px 10px;color:#e94f87;font-size:12px;margin-top:10px}.work-details{display:flex;flex-wrap:wrap;gap:8px 18px;margin-top:12px;color:#909399;font-size:12px}.work-stats{display:flex;justify-content:flex-end;gap:24px;padding-top:12px;margin-top:auto;border-top:1px solid #f0f0f0;color:#909399;font-size:13px}.pagination-area{display:flex;justify-content:center;margin-top:28px}.loading-state{background:#fff;padding:24px;border-radius:12px}:deep(.highlight){background:#fff2a8;color:#c45600;padding:0 2px;border-radius:2px}:deep(.search-mode .el-radio-button__inner){white-space:nowrap}
@media(max-width:768px){.douyin-page{padding:0 4px 30px}.search-area{min-width:100%;flex-wrap:wrap}.search-input{max-width:none}.toolbar,.sort-area{width:100%}.work-grid{grid-template-columns:1fr}.work-card{padding:14px}.work-stats{justify-content:space-between;gap:8px}.pagination-area{overflow-x:auto;justify-content:flex-start}}
</style>
