<template>
  <div class="danmaku-toggle">
    <el-switch
      v-model="model"
      :disabled="disabled"
      size="large"
      active-text="嵌入弹幕"
      inactive-text="嵌入弹幕"
    />
    <span class="toggle-desc">将录播弹幕滚动烧录到视频画面中（会增加处理时间）</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})
</script>

<style scoped>
.danmaku-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}
.toggle-desc {
  font-size: 12px;
  color: #909399;
}
</style>
