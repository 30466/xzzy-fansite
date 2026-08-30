<template>
  <section class="recommend-view">
    <header class="recommend-header">
      <h1>💗 安利 · 徐郑子滢</h1>
      <el-radio-group v-model="platform" size="large" aria-label="选择安利平台">
        <el-radio-button label="bilibili">📺 B站</el-radio-button>
        <el-radio-button label="weibo">🔴 微博</el-radio-button>
      </el-radio-group>
    </header>
    <Bilibili v-if="platform === 'bilibili'" />
    <Weibo v-else />
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import Bilibili from './Bilibili.vue'
import Weibo from './Weibo.vue'

const platform = ref('bilibili')
watch(platform, value => {
  document.title = `徐郑子滢 ✽ ${value === 'bilibili' ? 'B站' : '微博'}安利`
}, { immediate: true })
</script>

<style scoped>
.recommend-view { max-width: 1300px; margin: 0 auto; }
.recommend-header { text-align: center; margin-bottom: 14px; }
.recommend-header h1 { margin: 0 0 14px; color: #ff002b; font-size: 1.8rem; }
@media (max-width: 768px) { .recommend-header h1 { font-size: 1.5rem; } }
</style>
