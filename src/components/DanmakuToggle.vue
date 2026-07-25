<template>
  <div class="danmaku-settings">
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

    <div v-if="model && !disabled" class="duration-slider">
      <span class="label">弹幕时长:</span>
      <el-slider 
        v-model="durationModel" 
        :min="8" 
        :max="15" 
        :step="1" 
        show-stops 
        style="width: 140px; margin-left: 10px" 
      />
      <span class="slider-tip">{{ durationModel }}s (值小速度快)</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  duration: { type: Number, default: 12 },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'update:duration'])

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const durationModel = computed({
  get: () => props.duration,
  set: (v) => emit('update:duration', v)
})
</script>

<style scoped>
.danmaku-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}
.danmaku-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toggle-desc {
  font-size: 12px;
  color: #909399;
}
.duration-slider {
  display: flex;
  align-items: center;
  padding-left: 5px;
}
.label {
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
}
.slider-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}
</style>
