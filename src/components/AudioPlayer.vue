<template>
  <transition name="slide-up">
    <div v-if="showPlayer" class="audio-player" @click="openDetail">
      <div class="progress-bar" :style="{ width: progressPercent + '%' }" />
      <div class="player-content">
        <img
          v-if="currentSong?.coverUrl"
          :src="currentSong.coverUrl"
          class="cover-thumb"
        />
        <div v-else class="cover-placeholder">🎵</div>
        <div class="song-info">
          <span class="song-title">{{ currentSong?.title || '未知歌曲' }}</span>
          <span class="song-artist">{{ currentSong?.artist || '' }}</span>
        </div>
        <div class="controls">
          <el-button link @click.stop="prev">
            <el-icon size="20"><CaretLeft /></el-icon>
          </el-button>
          <el-button link @click.stop="toggle">
            <el-icon size="24">
              <VideoPause v-if="isPlaying" />
              <VideoPlay v-else />
            </el-icon>
          </el-button>
          <el-button link @click.stop="next">
            <el-icon size="20"><CaretRight /></el-icon>
          </el-button>
          <el-button link @click.stop="cycleMode" class="mode-btn">
            <span class="mode-label">{{ modeLabel }}</span>
          </el-button>
        </div>
      </div>
    </div>
  </transition>

  <SongDetailPanel
    v-if="showDetail"
    @close="showDetail = false"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { CaretLeft, CaretRight, VideoPlay, VideoPause } from '@element-plus/icons-vue'
import audioPlayer from '@/composables/useAudioPlayer'
import SongDetailPanel from '@/components/SongDetailPanel.vue'

const showDetail = ref(false)

const showPlayer = computed(() => audioPlayer.showPlayer.value)
const currentSong = computed(() => audioPlayer.currentSong.value)
const isPlaying = computed(() => audioPlayer.isPlaying.value)
const currentTime = computed(() => audioPlayer.currentTime.value)
const duration = computed(() => audioPlayer.duration.value)

const progressPercent = computed(() => {
  if (!duration.value || duration.value <= 0) return 0
  return (currentTime.value / duration.value) * 100
})

const modeLabel = computed(() => {
  switch (audioPlayer.playMode.value) {
    case 'single': return '单曲循环'
    case 'random': return '随机播放'
    default: return '列表循环'
  }
})

function toggle() { audioPlayer.togglePlay() }
function prev() { audioPlayer.playPrev() }
function next() { audioPlayer.playNext() }
function cycleMode() { audioPlayer.changePlayMode() }

function openDetail() {
  if (!showDetail.value) showDetail.value = true
}
</script>

<style scoped>
.audio-player {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  min-width: 340px;
  max-width: 420px;
}
.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  background: #409eff;
  transition: width 0.3s linear;
  border-radius: 0;
}
.player-content {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  gap: 10px;
}
.cover-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}
.cover-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.song-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.song-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.song-artist {
  font-size: 11px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.controls {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.mode-btn {
  margin-left: 2px;
}
.mode-label {
  font-size: 12px;
  color: #606266;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
