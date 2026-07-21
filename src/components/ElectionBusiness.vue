<template>
  <div class="election-business-wrapper">
    <div class="floating-corner">
      <div class="corner-btn" @click="showAppDialog = true">APP</div>
    </div>

    <el-dialog
      v-model="showAppDialog"
      title="网站PWA应用安装：手机APP/电脑桌面端"
      width="90%"
      :close-on-click-modal="true"
      class="app-dialog"
    >
      <div class="app-install-content">
        <p>网站可像软件一样可安装到手机/电脑桌面应用。</p>
        <p>用 Edge、Chrome、Safari、火狐等浏览器（国内的浏览器应该都不行，推荐使用 Edge 浏览器，安卓手机都能在自带的手机商店下载）打开该网站可安装到手机主屏幕/添加到手机/程序坞（Mac）。</p>
        <p>不知道怎么安装到手机/电脑的可以问豆包：<span class="ask-hint">xxx浏览器怎么安装pwa应用到xxx手机/电脑</span>（虽然电脑也没必要安装，电脑直接用网站最好）</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showAppDialog = ref(false)
</script>

<style scoped>
.election-business-wrapper {
  position: fixed;
  top: 80px;
  left: 0;
  right: 0;
  z-index: 101;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .election-business-wrapper {
    top: 60px;
  }
}

.floating-corner {
  position: absolute;
  top: 0;
}

.corner-btn {
  background: linear-gradient(135deg, #1a5276, #204fa1);
  color: #fff;
  padding: 6px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  box-shadow: 0 4px 15px rgba(32, 79, 161, 0.4);
  transition: all 0.3s;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.corner-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(32, 79, 161, 0.55);
}

/* APP 安装说明弹窗 */
.app-install-content {
  line-height: 1.8;
  font-size: 15px;
  color: #303133;
  padding: 10px 0;
}
.app-install-content p {
  margin: 12px 0;
}
.ask-hint {
  color: #204fa1;
  font-style: normal;
  background: #f0f4ff;
  padding: 2px 8px;
  border-radius: 4px;
}

/* 弹窗标题居中加粗 */
:deep(.el-dialog__header) {
  text-align: center;
}
:deep(.el-dialog__title) {
  font-weight: 700;
}
</style>
