<template>
  <el-config-provider :locale="zhCn">
    <div class="app-wrapper" :class="{ 'is-player-mode': isPlayerMode }" :style="{ backgroundImage: `url(${bgImage})` }">
      <nav class="nav-bar">
        <div class="nav-content">
          <span class="logo">GNZ48-徐郑子滢</span>
          <div class="links">
            <el-dropdown class="tool-dropdown" trigger="hover" :show-timeout="100">
              <span class="el-dropdown-link" @click="$router.push('/')">
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
                  <el-dropdown-item>
                    <a href="https://tools.abm48.com/clip" target="_blank" class="dropdown-item-link">
                    ✂️ 批量剪切（可导入切片本剪切）
                    </a>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <el-dropdown class="tool-dropdown" trigger="hover" :show-timeout="100">
              <span class="el-dropdown-link" @click="$router.push('/replay')">
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
                    <a href="https://msg48.org" target="_blank" class="dropdown-item-link">
                    🗂️ 口袋48历史记录搜索
                    </a>
                  </el-dropdown-item>
                  <el-dropdown-item>
                    <a href="https://github.com/duan602728596/48tools/releases" target="_blank" class="dropdown-item-link">
                    💾 48tools
                    </a>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <router-link to="/profile">简介</router-link>

            <a href="https://tools.abm48.com/" target="_blank">工具</a>

            <router-link to="/about">关于</router-link>
          </div>
        </div>
      </nav>

      <div class="main-container" :class="{ 'is-replay': $route.path === '/replay' }">
        <router-view />
      </div>

      <AudioPlayer />
    </div>
  </el-config-provider>
</template>

<script setup>
import bgImage from './assets/bg.jpg'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import AudioPlayer from './components/AudioPlayer.vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { ElConfigProvider } from 'element-plus'

const route = useRoute()
const isPlayerMode = computed(() => route.path === '/replay' && !!route.query.live)
</script>

<style>
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
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

.logo { 
  font-weight: bold; 
  font-size: 1.3rem; 
  color: #ff002b; 
  margin-right: 20px;
}

.links {
  display: flex;
  gap: 30px;
  align-items: center;
}

.links a {
  text-decoration: none;
  color: #303133;
  font-weight: 600;
  font-size: 16px;
  position: relative;
  padding-bottom: 5px;
  transition: color 0.3s;
}

.links a:hover, .links a.router-link-active { 
  color: #409EFF;
}

.links a::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: 0;
  left: 50%;
  background-color: #409EFF;
  transition: all 0.3s;
}
.links a:hover::after {
  width: 100%;
  left: 0;
}

.main-container {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
  min-height: 80vh;
}
.main-container.is-replay {
  max-width: none;
  margin: 0;
  padding: 0;
}

.el-dropdown-link {
  cursor: pointer;
  color: #303133;
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  outline: none;
}

</style>

<style>
@media (max-width: 768px) {
  .is-player-mode .nav-bar { display: none; }
  .is-player-mode .main-container { margin-top: 10px; }
}

.el-dropdown-link:hover {
  color: #409EFF;
}

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
