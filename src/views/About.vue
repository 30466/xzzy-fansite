<template>
  <div class="about-page">
    <el-card class="about-card">
      <h2>关于本站 🎶</h2>
      <p>这里是 GNZ48 徐郑子滢的个人应援存档站。域名为abm48.com均为本人所有</p>
      <p>主要用于记录直播中的唱歌切片时间点，方便大家剪辑唱歌视频/音频,以及考古和安利</p>
      <p>可找我做同款或者定制应援站</p>  
      <el-divider />
      
      <h3>🎬 关于B站安利</h3>
      <p>B站安利页面选取了固定的UP主（粉丝/产出账号），爬取他们全部的视频列表信息，并筛选出标题中含有「徐郑子滢」的视频进行展示。</p>
      <p>之所以不直接调用B站搜索API，是因为B站搜索结果是全站范围的，可能会混入：</p>
      <ul>
        <li><b>CP相关内容</b> — 可能涉及其他成员，与本应援站的定位不符</li>
        <li><b>负面或招黑内容</b> — 标题党、引战视频等，不利于维护偶像形象</li>
        <li><b>无关内容</b> — 同名或相似关键词的误匹配</li>
      </ul>
      <p>通过固定UP主 + 标题筛选的方式，可以确保展示的都是粉丝产出的正面安利向内容，避免不可控的信息风险。</p>
      <p>UP主列表会不定时爬取持续更新，如果你知道有优质产出账号未被收录，欢迎联系我补充。</p>

      <el-divider />
      
      <h3>✂️ 关于剪辑</h3>
      <p>平时我直接使用自己写好的五个skills（包括下载查询口袋 48 录播；批量剪切，包含切片本，支持该网站的一键剪切功能，而且更快，因为浏览器都有限制；批量上传歌曲的小偶像音乐网站；批量上传切片本到该网站；弹幕唱歌检测，使用脚本和纯大语言模型交叉检验；这些skills都在置顶导航条的“工具“网站可查询），切片本正是本网站前端数据根基</p>
      <p>做这个网站就是想记录一下，然后给其他老师提供切片本。可以下载自推的唱歌切片或者以后可能还有视频切片。只要一个老师上传，其他老师就无需重复工作</p>
      <div class="contact-section">
        <h3 class="contact-subtitle">如果你想与我交流，可以通过以下方式联系我</h3>
        <div class="contact-buttons">
          <a href="mailto:your-email@example.com" class="contact-btn email-btn">
            ✉️ 发送邮件
          </a>
          <div class="contact-btn wechat-btn" @click="showQrCode('wechat')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8.667 11.511a1.276 1.276 0 0 1-1.285-1.285c0-.718.567-1.286 1.285-1.286.717 0 1.285.568 1.285 1.286 0 .717-.568 1.285-1.285 1.285zm6.666 0a1.276 1.276 0 0 1-1.285-1.285c0-.718.568-1.286 1.285-1.286.718 0 1.285.568 1.285 1.286 0 .717-.567 1.285-1.285 1.285zm-8.51 7.704l.715-.436a4 4 0 0 1 2.705-.536c.212.033.386.059.52.076.406.054.82.081 1.237.081 4.42 0 7.9-3.022 7.9-6.6S16.42 5.2 12 5.2s-7.9 3.022-7.9 6.6c0 1.366.5 2.673 1.432 3.781.048.057.12.137.214.235a4 4 0 0 1 1.101 3.102l-.025.297zm-.63 2.727a1 1 0 0 1-1.527-.93l.188-2.26a2 2 0 0 0-.55-1.551A6.993 6.993 0 0 1 4 16.868C2.806 15.447 2.1 13.695 2.1 11.8c0-4.75 4.432-8.6 9.9-8.6s9.9 3.85 9.9 8.6-4.432 8.6-9.9 8.6c-.51 0-1.01-.033-1.499-.098a23.61 23.61 0 0 1-.569-.084 2 2 0 0 0-1.353.268l-2.387 1.456z"/></svg>
            添加微信
          </div>
          <div class="contact-btn qq-btn" @click="showQrCode('qq')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.395 15.035a39.548 39.548 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a38.97 38.97 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673zM12.662 4.846c.039-1.052.659-1.878 1.385-1.846s1.281.912 1.242 1.964c-.039 1.051-.659 1.878-1.385 1.846s-1.282-.912-1.242-1.964zM9.954 3c.725-.033 1.345.794 1.384 1.846.04 1.052-.517 1.931-1.242 1.963-.726.033-1.346-.794-1.385-1.845C8.672 3.912 9.228 3.033 9.954 3zM7.421 8.294c.194-.43 2.147-.908 4.566-.908h.026c2.418 0 4.372.479 4.566.908a.14.14 0 0 1 .014.061c0 .031-.01.059-.026.083-.163.238-2.333 1.416-4.553 1.416h-.026c-2.221 0-4.39-1.178-4.553-1.416a.136.136 0 0 1-.014-.144zm10.422 8.622c-.22 3.676-2.403 5.987-5.774 6.021h-.137c-3.37-.033-5.554-2.345-5.773-6.021-.081-1.35.001-2.496.147-3.43.318.063.638.122.958.176v3.506s1.658.334 3.318.103v-3.225c.488.027.96.04 1.406.034h.025c1.678.021 3.714-.204 5.683-.594.146.934.227 2.08.147 3.43zM10.48 5.804c.313-.041.542-.409.508-.825-.033-.415-.314-.72-.629-.679-.313.04-.541.409-.508.824.034.417.315.72.629.68zM14.479 5.156c.078.037.221.042.289-.146.035-.095.025-.165-.009-.214-.023-.033-.133-.118-.371-.176-.904-.22-1.341.384-1.405.499-.04.072-.012.176.056.227.067.051.139.037.179-.006.58-.628 1.21-.208 1.261-.184z"/></svg>
            添加QQ
          </div>
          <a href="https://me.abm48.com/" target="_blank" class="contact-btn homepage-btn">
            🏠 我的个人主页
          </a>
        </div>
      </div>
    </el-card>

    <!-- 二维码弹窗 -->
    <el-dialog
      v-model="qrVisible"
      width="340px"
      center
      class="qr-dialog"
    >
      <template #header>
        <span class="dialog-title">{{ qrTitle }}</span>
      </template>
      <div class="qr-container">
        <!-- 这里的图片需要你在 assets 里放入 qq.jpg 和 wechat.jpg -->
        <img :src="currentQrImg" alt="QR Code" class="qr-image" />
        <p class="qr-desc">扫一扫上面二维码图案，加我为朋友。</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

import wechatImg from '../assets/wechat.png';
import qqImg from '../assets/qq.png';

onMounted(() => {
  document.title = '徐郑子滢 ✽ 关于';
});

const qrVisible = ref(false);
const qrType = ref('wechat'); // 'wechat' or 'qq'

const qrTitle = computed(() => qrType.value === 'wechat' ? '微信二维码' : 'QQ二维码');
const currentQrImg = computed(() => qrType.value === 'wechat' ? wechatImg : qqImg);

const showQrCode = (type) => {
  qrType.value = type;
  qrVisible.value = true;
};
</script>

<style scoped>
.about-card {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  line-height: 1.8;
}
a { color: #409EFF; text-decoration: none; }

:deep(.el-dialog__header) {
  text-align: center;
}
.dialog-title {
  font-weight: bold;
  font-size: 18px;
}

/* 联系我 */
.contact-section {
  margin-top: 50px;
  text-align: center;
  padding: 40px 0;
}

.contact-subtitle {
  color: #666;
  margin-bottom: 30px;
}

.contact-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.contact-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 140px;
  height: 44px;
  border-radius: 8px;
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
}

.contact-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.contact-btn { background-color: #204fa1; }

/* 二维码弹窗 */
.qr-container {
  text-align: center;
  padding: 12px 0;
  color: #606266;
}

.qr-image {
  width: 280px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.qr-desc {
  margin: 10px 0 0;
  font-size: 13px;
  color: #6b7280;
}
</style>