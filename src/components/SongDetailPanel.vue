<template>
  <transition name="el-fade-in">
    <div v-if="visible" class="song-detail-overlay" @click.self="$emit('close')">
      <div class="song-detail-panel">
        <div class="panel-header">
          <span class="panel-title">歌曲详情</span>
          <el-button link @click="$emit('close')">
            <el-icon size="20"><Close /></el-icon>
          </el-button>
        </div>

        <div class="detail-content" v-if="currentSong">
          <template v-if="songDetail">
            <a
              v-if="songDetail.cover_art_url"
              :href="fullCoverUrl"
              target="_blank"
              class="cover-link"
            >
              <img :src="fullCoverUrl" class="detail-cover" />
            </a>
            <h3 class="detail-title">{{ songDetail.title }}</h3>

            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="翻唱者">{{ songDetail.cover_artists || currentSong.artist || '-' }}</el-descriptions-item>
              <el-descriptions-item label="原唱者">{{ songDetail.original_artists || '-' }}</el-descriptions-item>
              <el-descriptions-item label="语种">{{ songDetail.language_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="状态">{{ songDetail.status_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="日期">{{ songDetail.cover_date || '-' }}</el-descriptions-item>
            </el-descriptions>
          </template>

          <template v-else>
            <div class="cover-placeholder">🎵</div>
            <h3 class="detail-title">{{ currentSong.title }}</h3>
            <p class="detail-artist">{{ currentSong.artist }}</p>
          </template>

          <div class="progress-section">
            <el-slider
              :model-value="currentTime"
              :max="duration || 1"
              :show-tooltip="false"
              @input="seek"
              size="small"
            />
            <div class="time-row">
              <span>{{ formatTime(currentTime) }}</span>
              <span>{{ formatTime(duration) }}</span>
            </div>
          </div>

          <div class="control-row">
            <el-button link @click="prev"><el-icon size="22"><CaretLeft /></el-icon></el-button>
            <el-button link @click="toggle">
              <el-icon size="32">
                <VideoPause v-if="isPlaying" />
                <VideoPlay v-else />
              </el-icon>
            </el-button>
            <el-button link @click="next"><el-icon size="22"><CaretRight /></el-icon></el-button>
          </div>

          <div class="playlist-section" v-if="playlist.length > 0">
            <div class="playlist-header">
              <span class="section-title">播放队列 ({{ playlist.length }})</span>
              <el-button link @click="cycleMode" class="mode-btn-detail">{{ modeLabel }}</el-button>
            </div>
            <div
              v-for="(song, idx) in playlist"
              :key="idx"
              class="queue-item"
              :class="{ active: idx === currentIndex }"
              @click="playIndex(idx)"
            >
              <span class="queue-title">{{ song.title }}</span>
              <span class="queue-artist">{{ song.artist }}</span>
              <el-button link size="small" type="danger" @click.stop="removeSong(idx)">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>

          <div class="external-link">
            <a
              v-if="songDetail?.id"
              :href="`https://abm48.com/#/pages/index/index?songId=${songDetail.id}`"
              target="_blank"
              class="music-link"
            >
              在音乐站搜索框粘贴查看详情 →
            </a>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CaretLeft, CaretRight, VideoPlay, VideoPause, Close } from '@element-plus/icons-vue'
import audioPlayer from '@/composables/useAudioPlayer'

defineProps({ visible: { type: Boolean, default: true } })
defineEmits(['close'])

const songDetail = ref(null)
const MUSIC_SITE = 'https://abm48.com'

const currentSong = computed(() => audioPlayer.currentSong.value)
const currentIndex = computed(() => audioPlayer.currentIndex.value)
const isPlaying = computed(() => audioPlayer.isPlaying.value)
const currentTime = computed(() => audioPlayer.currentTime.value)
const duration = computed(() => audioPlayer.duration.value)
const playlist = computed(() => audioPlayer.playlist.value)

const fullCoverUrl = computed(() => {
  const url = songDetail.value?.cover_art_url
  if (!url) return ''
  return url.startsWith('http') ? url : MUSIC_SITE + url
})

const modeLabel = computed(() => {
  switch (audioPlayer.playMode.value) {
    case 'single': return '单曲循环'
    case 'random': return '随机播放'
    default: return '列表循环'
  }
})

watch(currentSong, async (song) => {
  if (song?.id) {
    try {
      const resp = await fetch(`/api/songs/${song.id}`)
      if (resp.ok) {
        songDetail.value = await resp.json()
        return
      }
    } catch {}
  }
  songDetail.value = null
}, { immediate: true })

function toggle() { audioPlayer.togglePlay() }
function prev() { audioPlayer.playPrev() }
function next() { audioPlayer.playNext() }
function seek(val) { audioPlayer.seek(val) }
function cycleMode() { audioPlayer.changePlayMode() }
function playIndex(idx) { audioPlayer.playIndex(idx) }
function removeSong(idx) { audioPlayer.removeFromPlaylist(idx) }

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>

<style scoped>
.song-detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.song-detail-panel {
  background: #fff;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  border-radius: 16px 16px 0 0;
  overflow-y: auto;
  padding: 20px;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.panel-title {
  font-size: 17px;
  font-weight: bold;
}
.cover-link {
  display: block;
  margin: 0 auto 12px;
  width: 160px;
  height: 160px;
  cursor: pointer;
}
.detail-cover {
  width: 160px;
  height: 160px;
  border-radius: 12px;
  object-fit: cover;
}
.cover-placeholder {
  width: 160px;
  height: 160px;
  border-radius: 12px;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  margin: 0 auto 12px;
}
.detail-title {
  text-align: center;
  margin: 0 0 4px;
  font-size: 18px;
}
.detail-artist {
  text-align: center;
  color: #909399;
  margin: 0 0 16px;
}
.progress-section {
  margin: 16px 0;
}
.time-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #909399;
}
.control-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.mode-btn-detail {
  font-size: 12px;
  color: #909399;
}
.playlist-section {
  margin-top: 12px;
}
.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}
.queue-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.queue-item.active {
  background: #ecf5ff;
}
.queue-item:hover {
  background: #f5f7fa;
}
.queue-title {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.queue-artist {
  font-size: 11px;
  color: #909399;
  flex-shrink: 0;
}
.external-link {
  text-align: center;
  margin-top: 16px;
}
.music-link {
  color: #409eff;
  text-decoration: none;
  font-size: 13px;
}
.music-link:hover {
  text-decoration: underline;
}
</style>
