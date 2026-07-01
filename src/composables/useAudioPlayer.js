import { ref, computed } from 'vue'

const audio = new Audio()

const playlist = ref([])
const currentIndex = ref(-1)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const playMode = ref('loop')
const isSeeking = ref(false)
const showPlayer = computed(() => playlist.value.length > 0)

const currentSong = computed(() => {
  if (currentIndex.value >= 0 && currentIndex.value < playlist.value.length) {
    return playlist.value[currentIndex.value]
  }
  return null
})

let seekTimeout = null

function playIndex(index) {
  if (index < 0 || index >= playlist.value.length) return
  currentIndex.value = index
  const song = playlist.value[index]
  if (song?.audioUrl) {
    audio.src = song.audioUrl
    audio.play().catch(() => {})
  }
}

function playNext() {
  if (playlist.value.length === 0) return
  let next
  switch (playMode.value) {
    case 'single':
      next = currentIndex.value
      break
    case 'random':
      next = Math.floor(Math.random() * playlist.value.length)
      break
    case 'loop':
    default:
      next = (currentIndex.value + 1) % playlist.value.length
      break
  }
  playIndex(next)
}

audio.addEventListener('timeupdate', () => {
  if (!isSeeking.value) {
    currentTime.value = audio.currentTime
  }
})

audio.addEventListener('loadedmetadata', () => {
  duration.value = audio.duration
})

audio.addEventListener('play', () => {
  isPlaying.value = true
})

audio.addEventListener('pause', () => {
  isPlaying.value = false
})

audio.addEventListener('ended', () => {
  isPlaying.value = false
  playNext()
})

audio.addEventListener('error', () => {
  isPlaying.value = false
  if (playMode.value === 'loop' || playMode.value === 'random') {
    setTimeout(() => playNext(), 500)
  }
})

export function useAudioPlayer() {
  function addToPlaylist(songs, startIndex = 0) {
    if (songs.length === 0) return
    playlist.value = [...playlist.value, ...songs]
    if (currentIndex.value < 0) {
      playIndex(startIndex)
    }
  }

  function setPlaylistAndPlay(songs, songId) {
    playlist.value = [...songs]
    const idx = playlist.value.findIndex(s => s.id === songId)
    playIndex(idx >= 0 ? idx : 0)
  }

  function togglePlay() {
    if (!currentSong.value) return
    if (isPlaying.value) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
  }

  function playPrev() {
    if (playlist.value.length === 0) return
    const prev = (currentIndex.value - 1 + playlist.value.length) % playlist.value.length
    playIndex(prev)
  }

  function seek(time) {
    isSeeking.value = true
    audio.currentTime = time
    currentTime.value = time
    clearTimeout(seekTimeout)
    seekTimeout = setTimeout(() => {
      isSeeking.value = false
    }, 500)
  }

  function changePlayMode() {
    const modes = ['loop', 'single', 'random']
    const idx = modes.indexOf(playMode.value)
    playMode.value = modes[(idx + 1) % modes.length]
  }

  function removeFromPlaylist(index) {
    if (index < 0 || index >= playlist.value.length) return
    playlist.value.splice(index, 1)
    if (currentIndex.value === index) {
      if (playlist.value.length === 0) {
        currentIndex.value = -1
        audio.pause()
        audio.src = ''
      } else {
        playIndex(Math.min(index, playlist.value.length - 1))
      }
    } else if (currentIndex.value > index) {
      currentIndex.value--
    }
  }

  function clearPlaylist() {
    playlist.value = []
    currentIndex.value = -1
    audio.pause()
    audio.src = ''
    isPlaying.value = false
  }

  function closePlayer() {
    clearPlaylist()
  }

  return {
    playlist,
    currentIndex,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    playMode,
    showPlayer,
    addToPlaylist,
    setPlaylistAndPlay,
    playIndex,
    togglePlay,
    playNext,
    playPrev,
    seek,
    changePlayMode,
    removeFromPlaylist,
    clearPlaylist,
    closePlayer,
    isSeeking
  }
}

const instance = useAudioPlayer()
export default instance
