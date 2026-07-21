<template>
  <!-- 1. 包裹 ElConfigProvider 并绑定中文包 -->
  <el-config-provider :locale="zhCn">
    <div class="app-wrapper" :class="{ 'is-player-mode': isPlayerMode }" :style="{ backgroundImage: `url(${bgImage})` }">
      <nav class="nav-bar">
        <!-- ... 导航栏代码保持不变 ... -->
        <div class="nav-content">
          <span class="logo">GNZ48 徐郑子滢</span>
          <div class="links">
            <!-- 唱歌 - 下拉菜单 -->
            <el-dropdown class="tool-dropdown" trigger="hover" :show-timeout="100">
              <span class="el-dropdown-link">
                唱歌
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>
                    <router-link to="/" class="dropdown-item-link">
                    🎤 直播唱歌切片记录
                    </router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <a href="https://abm48.com" target="_blank" class="dropdown-item-link">
                    🎤 小偶像音乐网站(abm48)
                    </a>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <!-- 口袋48 - 下拉菜单 -->
            <el-dropdown class="tool-dropdown" trigger="hover" :show-timeout="100">
              <span class="el-dropdown-link">
                口袋48
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>
                    <router-link to="/replay" class="dropdown-item-link">
                    📺 口袋48录播回放
                    </router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <router-link to="/videoclip" class="dropdown-item-link">
                    🎬 视频切片记录
                    </router-link>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <a href="https://msg48.org" target="_blank" class="dropdown-item-link">
                    🗂️ 口袋48历史记录搜索
                    </a>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <!-- B站安利 -->
            <router-link to="/bilibili">B站安利</router-link>

            <!-- 简介 -->
            <router-link to="/profile">简介</router-link>

            <!-- 工具 - 直接跳转 -->
            <a href="https://tools.abm48.com/" target="_blank">工具</a>

            <!-- 关于 -->
            <router-link to="/about">关于</router-link>
          </div>
        </div>
      </nav>

      <div class="main-container" :class="{ 'is-replay': $route.path === '/replay' }">
        <router-view />
      </div>

      <ElectionBusiness />
      <AudioPlayer />
    </div>
  </el-config-provider>
</template>

<script setup>
import bgImage from './assets/bg.jpg'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import ElectionBusiness from './components/ElectionBusiness.vue'
import AudioPlayer from './components/AudioPlayer.vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { ElConfigProvider } from 'element-plus'

const route = useRoute()
const isPlayerMode = computed(() => route.path === '/replay' && !!route.query.live)
</script>

<style>
/* 全局字体设置，模仿一般个人主页的清爽字体 */
body { 
  margin: 0; 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

.app-wrapper {
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-repeat: no-repeat;
}

.nav-bar {
  background: rgba(255, 255, 255, 0.95); /* 背景稍微白一点，更像门户站 */
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05); /* 阴影变淡 */
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  flex-wrap: wrap; 
}

/* Logo 改成红色 */
.logo { 
  font-weight: bold; 
  font-size: 1.3rem; 
  color: #ff002b; 
  margin-right: 20px;
}

.links {
  display: flex;
  gap: 30px; /* 间距拉大 */
  align-items: baseline;
}

/* --- 核心修改：模仿你个人网站的导航链接样式 --- */
.links a {
  text-decoration: none;
  color: #303133; /* 深灰色，显专业 */
  font-weight: 600; /* 加粗 */
  font-size: 16px;
  line-height: 1.4;
  transition: color 0.3s;
}

/* 鼠标悬停变蓝 */
.links a:hover, .links a.router-link-active { 
  color: #409EFF;
  border-bottom: 2px solid #409EFF;
}

.main-container {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
  min-height: 80vh;
  overflow-x: hidden;
}
.main-container.is-replay {
  max-width: none;
  margin: 0;
  padding: 0;
}

/* 下拉触发文字的样式 (模仿其他链接) */
.el-dropdown-link {
  cursor: pointer;
  color: #303133;
  font-weight: 600;
  font-size: 16px;
  line-height: 1.4;
  display: inline-flex;
  align-items: center;
  outline: none;
}

</style>

<style>
/* ── Mobile 响应式 ── */
@media (max-width: 768px) {
  .nav-bar {
    padding: 0.5rem 0;
  }
  .links {
    gap: 12px;
  }
  .links a,
  .el-dropdown-link {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .logo {
    font-size: 1.1rem;
  }
}

/* ── Player mode ── */
@media (max-width: 768px) {
  .is-player-mode .nav-bar { display: none; }
  .is-player-mode .election-business-wrapper { display: none; }
  .is-player-mode .main-container { margin-top: 10px; }
}

/* 鼠标悬停变蓝 */
.el-dropdown-link:hover {
  color: #409EFF;
}

/* 下拉菜单里的链接样式 */
.dropdown-item-link {
  text-decoration: none;
  color: #606266;
  display: block;
  width: 100%;
  height: 100%;
}

.dropdown-item-link:hover {
  color: #409EFF;
}
</style>