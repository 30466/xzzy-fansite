<!-- 录播选择器：按钮 + 弹窗日历，用于视频切片表单中选择录播 -->
<template>
  <div class="replay-picker">
    <div v-if="selected" class="selected-replay">
      <el-tag type="success" size="large" effect="plain" closable @close="clearSelection">
        📺 {{ formatTime(selected.ctime) }} · {{ selected.title || '(无标题)' }}
      </el-tag>
    </div>
    <el-button v-else type="primary" plain size="large" @click="dialogVisible = true">
      📅 选择录播
    </el-button>

    <el-dialog
      v-model="dialogVisible"
      title="选择录播"
      width="90vw"
      top="3vh"
      :close-on-click-modal="false"
      class="replay-picker-dialog"
    >
      <ReplayCalendar @select-replay="onSelect" />
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ReplayCalendar from '@/components/ReplayCalendar.vue'

const emit = defineEmits(['update:modelValue'])

const props = defineProps({
  modelValue: { type: Object, default: null }
})

const dialogVisible = ref(false)

const selected = ref(props.modelValue)

function formatTime(ctimeMs) {
  if (!ctimeMs) return ''
  const d = new Date(Number(ctimeMs))
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function onSelect(r) {
  selected.value = r
  emit('update:modelValue', r)
  dialogVisible.value = false
}

function clearSelection() {
  selected.value = null
  emit('update:modelValue', null)
}
</script>

<style scoped>
.replay-picker {
  display: inline-block;
}
.selected-replay {
  display: inline-block;
}
</style>

<style>
.replay-picker-dialog {
  border-radius: 12px;
}
.replay-picker-dialog .el-dialog__body {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
