<template>
  <div class="weibo-page">
    <div class="page-header">
      <p class="page-stats">
        共 <b>{{ allPosts.length }}</b> 条微博 · 来自 <b>{{ accountList.length }}</b> 位用户
        <span v-if="activeAccount"> · 当前用户：<b>{{ activeAccount }}</b>（{{ accountFilteredCount }}条微博）</span>
      </p>
      <p class="page-stats">所有发布时间均为北京时间</p>
    </div>

    <el-card class="account-filter-card" shadow="never">
      <div class="account-filter-area featured-account-row">
        <span class="account-chip" :class="{ active: activeAccount === null }" @click="activeAccount = null">全部（{{ allPosts.length }}）</span>
        <span v-for="account in featuredAccounts" :key="account.name" class="account-chip"
          :class="{ active: activeAccount === account.name }" @click="toggleAccount(account.name)">
          {{ account.name }}（{{ account.postCount }}）
        </span>
      </div>
      <div class="account-filter-area regular-account-row">
        <span v-for="account in regularAccounts" :key="account.name" class="account-chip"
          :class="{ active: activeAccount === account.name }" @click="toggleAccount(account.name)">
          {{ account.name }}（{{ account.postCount }}）
        </span>
      </div>
    </el-card>

    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="search-area">
          <el-input v-model="searchText" placeholder="搜索微博正文、用户..." size="large" clearable
            :prefix-icon="Search" class="search-input" />
          <el-radio-group v-model="searchMode" size="default" class="search-mode">
            <el-radio-button label="exact"><el-icon><Connection /></el-icon> 精确</el-radio-button>
            <el-radio-button label="fuzzy"><el-icon><Menu /></el-icon> 模糊</el-radio-button>
          </el-radio-group>
        </div>
        <div class="sort-area">
          <span class="sort-label">排序：</span>
          <el-select v-model="sortField" size="default" style="width:130px">
            <el-option label="发布时间" value="created" />
            <el-option label="点赞" value="like" />
            <el-option label="转发" value="repost" />
            <el-option label="评论" value="reply" />
          </el-select>
          <el-button :icon="sortAsc ? SortUp : SortDown" @click="sortAsc = !sortAsc" class="sort-order-btn">
            {{ sortAsc ? '升序' : '降序' }}
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card class="quick-tags-card" shadow="never">
      <div class="quick-tags-area">
        <span class="quick-tags-label">🔥 快速检索：</span>
        <el-tag v-for="tag in quickTags" :key="tag" :type="searchText === tag ? '' : 'info'"
          :effect="searchText === tag ? 'dark' : 'plain'" class="quick-tag"
          @click="searchText = searchText === tag ? '' : tag">{{ tag }}</el-tag>
      </div>
    </el-card>

    <div v-if="searchText && !loading" class="search-summary">
      搜索“<b>{{ searchText }}</b>”找到 <b>{{ filteredPosts.length }}</b> 个结果
      <span class="mode-badge">{{ searchMode === 'fuzzy' ? '模糊匹配' : '精确匹配' }}</span>
    </div>

    <div v-if="pagedPosts.length" class="weibo-list">
      <article v-for="post in pagedPosts" :key="post.id" class="weibo-card" @click="openPost(post)">
        <div class="weibo-head">
          <div>
            <strong class="account-name">{{ post.screenName }}</strong>
            <div class="post-time">{{ formatDate(post.createdAt) }}<span v-if="post.regionName"> · {{ post.regionName }}</span></div>
          </div>
          <el-tag v-if="post.isPinned" type="danger" size="small">置顶</el-tag>
        </div>
        <div v-if="post.audioTitle" class="post-audio-title">🎧 {{ post.audioTitle }}</div>
        <div class="post-text" v-html="highlightMatches(post.text || '分享微博')"></div>
        <div v-if="post.retweetedStatus" class="retweet-box">
          <div v-if="post.retweetedStatus.audioTitle" class="retweet-audio-title">🎧 {{ post.retweetedStatus.audioTitle }}</div>
          <b v-if="post.retweetedStatus.screenName">@{{ post.retweetedStatus.screenName }}：</b>
          <span v-html="highlightMatches(post.retweetedStatus.text || '')"></span>
        </div>
        <div class="post-details">
          <span v-if="post.mediaCount">{{ mediaLabel(post) }}</span>
          <span v-if="post.source">来自 {{ post.source }}</span>
        </div>
        <div class="post-stats">
          <span>转发 {{ formatNumber(post.repostsCount || 0) }}</span>
          <span>评论 {{ formatNumber(post.commentsCount || 0) }}</span>
          <span>赞 {{ formatNumber(post.attitudesCount || 0) }}</span>
        </div>
      </article>
    </div>

    <div v-if="totalPages > 1" class="pagination-area">
      <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="filteredPosts.length"
        layout="prev, pager, next, total" background @current-change="scrollToTop" />
    </div>
    <el-empty v-else-if="!loading && !pagedPosts.length" description="没有找到匹配的微博 🍃" />
    <div v-if="loading" class="loading-state"><el-skeleton :rows="8" animated /></div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Connection, Menu, Search, SortDown, SortUp } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatBeijingDateTime, getAbsoluteTime } from '@/utils/time'

const FEATURED_ACCOUNT_NAMES = ['GNZ48-徐郑子滢', '爱吃抹茶味的贝果酱']
const allPosts = ref([])
const accountList = ref([])
const loading = ref(true)
const searchText = ref('')
const searchMode = ref('exact')
const activeAccount = ref(null)
const sortField = ref('created')
const sortAsc = ref(false)
const currentPage = ref(1)
const pageSize = 24
const quickTags = [
  'focus', '直拍', '舞台', '直播', '唱歌', '口袋', 'minilive',
  '公演', 'cut', '合集',
]

const normalizedAccounts = computed(() => accountList.value.map(account => ({
  ...account,
  name: account.screenName,
})))
const featuredAccounts = computed(() => FEATURED_ACCOUNT_NAMES
  .map(name => normalizedAccounts.value.find(account => account.name === name)).filter(Boolean))
const regularAccounts = computed(() => normalizedAccounts.value.filter(account => !FEATURED_ACCOUNT_NAMES.includes(account.name)))
const accountFilteredCount = computed(() => activeAccount.value
  ? allPosts.value.filter(post => post.screenName === activeAccount.value).length
  : allPosts.value.length)

function exactMatch(text, query) {
  return String(text || '').toLowerCase().includes(query.toLowerCase())
}
function fuzzyMatch(text, query) {
  const source = String(text || '').toLowerCase()
  const target = query.toLowerCase()
  let index = 0
  for (const char of source) if (char === target[index]) index += 1
  return index === target.length
}
const matchFn = computed(() => searchMode.value === 'exact' ? exactMatch : fuzzyMatch)

const filteredPosts = computed(() => {
  const query = searchText.value.trim()
  let posts = allPosts.value
  if (activeAccount.value) posts = posts.filter(post => post.screenName === activeAccount.value)
  if (query) {
    posts = posts.filter(post => matchFn.value([
      post.screenName,
      post.text,
      post.retweetedStatus?.screenName,
      post.retweetedStatus?.text,
    ].join(' '), query))
  }
  return [...posts].sort((a, b) => {
    const left = sortValue(a, sortField.value)
    const right = sortValue(b, sortField.value)
    return sortAsc.value ? left - right : right - left
  })
})
const totalPages = computed(() => Math.ceil(filteredPosts.value.length / pageSize))
const pagedPosts = computed(() => filteredPosts.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))

function sortValue(post, field) {
  if (field === 'created') return getAbsoluteTime(post.createdAt)
  return { like: post.attitudesCount, repost: post.repostsCount, reply: post.commentsCount }[field] || 0
}
function toggleAccount(name) { activeAccount.value = activeAccount.value === name ? null : name }
function openPost(post) { window.open(post.url, '_blank', 'noopener') }
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }) }
function formatNumber(number) {
  if (number >= 10000) return `${(number / 10000).toFixed(1)}万`
  if (number >= 1000) return `${(number / 1000).toFixed(1)}k`
  return String(number)
}
function formatDate(value) {
  return formatBeijingDateTime(value, { seconds: false }) || '-'
}
function mediaLabel(post) {
  if (post.videoCount) return `🎬 ${post.videoCount}个视频`
  if (post.pictureCount) return `🖼️ ${post.pictureCount}张图片`
  return `附件 ${post.mediaCount}`
}
function escapeHtml(value = '') {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function highlightMatches(value = '') {
  const escaped = escapeHtml(value)
  const query = searchText.value.trim()
  if (!query || searchMode.value === 'fuzzy') return escaped.replace(/\n/g, '<br>')
  return escaped.replace(new RegExp(`(${escapeRegex(query)})`, 'gi'), '<mark class="highlight">$1</mark>').replace(/\n/g, '<br>')
}

watch([searchText, searchMode, activeAccount, sortField, sortAsc], () => { currentPage.value = 1 })
onMounted(async () => {
  try {
    const response = await fetch('/data/weibo-merged.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    allPosts.value = data.posts || []
    accountList.value = data.accounts || []
  } catch (error) {
    console.error('加载微博数据失败:', error)
    ElMessage.error('加载微博数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.weibo-page{max-width:1300px;margin:0 auto;padding:0 16px 40px;overflow-x:hidden}.page-header{text-align:center;margin-bottom:20px}.page-stats{color:#909399;font-size:14px;margin:0}.page-stats b{color:#303133}.account-filter-card,.toolbar-card,.quick-tags-card{margin-bottom:16px;border-radius:12px}.account-filter-area{display:flex;flex-wrap:wrap;gap:8px}.regular-account-row{border-top:1px dashed #ebeef5;margin-top:12px;padding-top:12px}.account-chip{display:inline-block;padding:6px 14px;border-radius:20px;background:#f5f5f5;color:#606266;font-size:13px;cursor:pointer;transition:.2s;white-space:nowrap;user-select:none}.account-chip:hover{background:#e8f4ff;color:#409eff}.account-chip.featured{background:#fff0f4;color:#e94f87}.account-chip.active{background:#409eff;color:#fff;font-weight:600}.toolbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px}.search-area{display:flex;align-items:center;gap:12px;flex:1;min-width:300px}.search-input{max-width:400px}.search-mode{display:inline-flex;flex-wrap:nowrap;flex-shrink:0}.sort-area{display:flex;align-items:center;gap:10px;flex-shrink:0}.sort-label{color:#909399;font-size:14px}.quick-tags-area{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.quick-tags-label{font-size:13px;color:#909399;white-space:nowrap;margin-right:4px}.quick-tag{cursor:pointer;user-select:none;transition:transform .15s}.quick-tag:hover{transform:scale(1.05)}.search-summary{margin-bottom:16px;font-size:14px;color:#606266}.mode-badge{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:10px;font-size:12px;background:#e8f4ff;color:#409eff}.weibo-list{display:grid;gap:14px}.weibo-card{background:#fff;border-radius:12px;padding:18px;box-shadow:0 2px 8px #0000000f;cursor:pointer;transition:.2s}.weibo-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px #0000001a}.weibo-head{display:flex;justify-content:space-between;margin-bottom:12px}.account-name{color:#e94f87}.post-time{font-size:12px;color:#a8abb2;margin-top:4px}.post-audio-title{font-size:15px;line-height:1.75;color:#e67e22;font-weight:600;word-break:break-word;margin-bottom:4px}.post-text{font-size:15px;line-height:1.75;color:#303133;word-break:break-word}.retweet-box{margin-top:12px;padding:12px 14px;background:#f6f7f8;border-radius:8px;color:#606266;font-size:14px;line-height:1.65}.retweet-audio-title{color:#e67e22;font-weight:600;margin-bottom:2px}.post-details{display:flex;gap:18px;margin-top:12px;color:#909399;font-size:12px}.post-stats{display:flex;justify-content:flex-end;gap:28px;padding-top:12px;margin-top:12px;border-top:1px solid #f0f0f0;color:#909399;font-size:13px}.pagination-area{display:flex;justify-content:center;margin-top:28px}.loading-state{background:#fff;padding:24px;border-radius:12px}:deep(.highlight){background:#fff2a8;color:#c45600;padding:0 2px;border-radius:2px}:deep(.search-mode .el-radio-button__inner){white-space:nowrap}
@media(max-width:768px){.weibo-page{padding:0 4px 30px}.search-area{min-width:100%;flex-wrap:wrap}.search-input{max-width:none}.toolbar,.sort-area{width:100%}.weibo-card{padding:14px}.post-stats{justify-content:space-between;gap:8px}.pagination-area{overflow-x:auto;justify-content:flex-start}}
</style>
