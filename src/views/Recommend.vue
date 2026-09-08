<template>
  <section class="recommend-view">
    <header class="recommend-header">
      <el-radio-group v-model="platform" size="large" aria-label="选择安利平台">
        <el-radio-button label="bilibili"><i class="fab fa-bilibili platform-icon bilibili-icon"></i>B站</el-radio-button>
        <el-radio-button label="weibo"><i class="fab fa-weibo platform-icon weibo-icon"></i>微博</el-radio-button>
        <el-radio-button label="douyin"><i class="fab fa-tiktok platform-icon douyin-icon"></i>抖音</el-radio-button>
      </el-radio-group>
      <nav class="source-links" aria-label="安利数据来源">
        <a href="https://github.com/30466/bili-core" target="_blank" rel="noopener noreferrer">B站数据项目 bili-core</a>
        <a href="https://github.com/30466/weibo-core" target="_blank" rel="noopener noreferrer">微博数据项目 weibo-core</a>
        <a href="https://github.com/30466/douyin-downloader" target="_blank" rel="noopener noreferrer">抖音数据项目 douyin-downloader</a>
      </nav>
      <p v-if="currentUpdateTime" class="update-time">数据更新：{{ currentUpdateTime }}（北京时间）</p>
    </header>
    <Bilibili v-if="platform === 'bilibili'" />
    <Weibo v-else-if="platform === 'weibo'" />
    <Douyin v-else />
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import Bilibili from './Bilibili.vue'
import Weibo from './Weibo.vue'
import Douyin from './Douyin.vue'

const platform = ref('bilibili')
const updateTimes = ref({})
const currentUpdateTime = computed(() => updateTimes.value[platform.value] || '')
onMounted(async () => {
  const files = { bilibili: 'bilibili-merged.json', weibo: 'weibo-merged.json', douyin: 'douyin-merged.json' }
  const entries = await Promise.all(Object.entries(files).map(async ([key, file]) => {
    try {
      const response = await fetch(`/data/${file}`)
      if (!response.ok) return [key, '']
      const data = await response.json()
      return [key, formatUpdateTime(data.generatedAt || data.generated_at)]
    } catch { return [key, ''] }
  }))
  updateTimes.value = Object.fromEntries(entries)
})
function formatUpdateTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(value))
}
watch(platform, value => {
  const labels = { bilibili: 'B站', weibo: '微博', douyin: '抖音' }
  document.title = `徐郑子滢 ✽ ${labels[value]}安利`
}, { immediate: true })
</script>

<style scoped>
.recommend-view { max-width: 1300px; margin: 0 auto; }
.recommend-header { text-align: center; margin-bottom: 14px; }
.recommend-header { padding-top: 2px; }
.source-links { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px 18px; margin-top: 10px; font-size: 12px; }
.source-links a { color: #909399; text-decoration: none; }
.source-links a:hover { color: #409EFF; text-decoration: underline; }
.update-time { margin: 6px 0 0; color: #a8abb2; font-size: 12px; }
.platform-icon { margin-right: 6px; }
.bilibili-icon { color: #00a1d6; }
.weibo-icon { color: #e6162d; }
.douyin-icon { color: #161823; }
</style>
