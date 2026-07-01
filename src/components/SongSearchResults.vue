<template>
  <transition name="el-fade-in">
    <div v-if="visible" class="song-search-overlay" @click.self="close">
      <div class="song-search-results">
        <div class="results-header">
          <span class="results-title">🔍 搜索结果</span>
          <el-button link @click="close">
            <el-icon size="20"><Close /></el-icon>
          </el-button>
        </div>

        <div v-if="loading" class="loading-state">
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="error" class="error-state">
          <el-empty :description="error" />
        </div>

        <div v-else-if="songs.length === 0" class="empty-state">
          <el-empty description="未找到匹配的歌曲">
            <a :href="musicSearchUrl" target="_blank" class="music-link">
              在音乐站搜索 "{{ query }}" →
            </a>
          </el-empty>
        </div>

        <div v-else class="results-list">
          <div
            v-for="song in songs"
            :key="song.id"
            class="result-item"
            @click="playSong(song)"
          >
            <div class="result-info">
              <span class="result-title">{{ song.title }}</span>
              <span class="result-meta">
                {{ song.cover_artists || song.original_artists || '-' }}
                <span v-if="song.cover_date">· {{ song.cover_date }}</span>
              </span>
            </div>
            <el-icon class="play-icon"><VideoPlay /></el-icon>
          </div>

          <div class="more-link">
            <a :href="musicSearchUrl" target="_blank" class="music-link">
              在音乐站查看更多 →
            </a>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Close, VideoPlay } from '@element-plus/icons-vue'
import audioPlayer from '@/composables/useAudioPlayer'

const props = defineProps({
  visible: { type: Boolean, default: false },
  query: { type: String, default: '' }
})

const emit = defineEmits(['close'])

const MUSIC_SITE = 'https://abm48.com'
const loading = ref(false)
const error = ref('')
const songs = ref([])

const musicSearchUrl = computed(() => {
  return `${MUSIC_SITE}/#/pages/index/index?search=${encodeURIComponent(props.query)}`
})

watch(() => props.visible, async (v) => {
  if (v && props.query) {
    loading.value = true
    error.value = ''
    songs.value = []
    try {
      const resp = await fetch(`/api/songs/filter?type=keyword&value=${encodeURIComponent(props.query)}`)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      songs.value = data.songs || []
    } catch (e) {
      error.value = '搜索失败，请重试'
      console.error(e)
    } finally {
      loading.value = false
    }
  }
})

function close() {
  emit('close')
}

function playSong(song) {
  const audioUrl = `/api/audio-stream/${song.id}`
  audioPlayer.addToPlaylist([{
    id: song.id,
    title: song.title,
    artist: song.cover_artists || song.original_artists || '',
    coverUrl: song.cover_art_url ? (song.cover_art_url.startsWith('http') ? song.cover_art_url : MUSIC_SITE + song.cover_art_url) : '',
    audioUrl
  }])
  close()
}
</script>

<style scoped>
.song-search-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 998;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.song-search-results {
  background: #fff;
  width: 100%;
  max-width: 500px;
  max-height: 60vh;
  border-radius: 16px 16px 0 0;
  overflow-y: auto;
  padding: 20px;
}
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.results-title {
  font-size: 17px;
  font-weight: bold;
}
.result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.result-item:hover {
  background: #f0f7ff;
}
.result-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.result-meta {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.play-icon {
  color: #409eff;
  flex-shrink: 0;
}
.more-link {
  text-align: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}
.music-link {
  color: #409eff;
  text-decoration: none;
  font-size: 13px;
}
.music-link:hover {
  text-decoration: underline;
}
.loading-state, .error-state, .empty-state {
  padding: 20px 0;
}
</style>
