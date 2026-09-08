<template>
  <div class="about-page">
    <el-card class="about-card">
      <h2>关于本站 🎶</h2>
      <p>这里是 GNZ48 徐郑子滢的个人应援存档站。域名为abm48.com均为本人所有。</p>
      <p>主要用于记录直播中的唱歌切片时间点，方便大家剪辑唱歌视频/音频,以及考古和安利。</p>
      <p>可找我做同款或者定制应援站。</p>
      <el-divider />
      
      <h3>💗 关于安利</h3>
      <p>安利页面收录了与徐郑子滢相关的 B站视频、微博和抖音内容，可以在页面顶部切换平台，并按账号、关键词、发布时间和互动数据进行检索与排序。</p>

      <h4><i class="fab fa-bilibili platform-heading-icon bilibili-icon"></i>B站安利</h4>
      <p>B站部分选取固定的UP主（粉丝或产出账号），定期爬取他们的视频列表，并展示标题或简介中含有「徐郑子滢」的视频。</p>
      <p>之所以不直接使用全站搜索结果，是因为其中可能混入：</p>
      <ul>
        <li><b>CP相关内容</b> — 可能涉及其他成员，与本应援站的定位不符</li>
        <li><b>负面或招黑内容</b> — 标题党、引战视频等，不利于维护偶像形象</li>
        <li><b>无关内容</b> — 同名或相似关键词的误匹配</li>
      </ul>
      <p>通过固定UP主与关键词筛选，可以减少无关或不可控内容。页面保留视频标题、简介、封面、分P及播放互动数据，支持精确或模糊检索。</p>

      <h4><i class="fab fa-weibo platform-heading-icon weibo-icon"></i>微博安利</h4>
      <p>微博部分同样来自固定账号，包括徐郑子滢本人以及粉丝产出和资料账号。「GNZ48-徐郑子滢」与「爱吃抹茶味的贝果酱」为免筛选账号，微博全部保留（包括转发）；其他账号仅保留正文含有「徐郑子滢超话」的原创微博，并排除转发帖。</p>
      <p>页面保留微博正文、转发内容、发布时间、来源、地区、媒体数量以及点赞、评论和转发数据，并提供适合微博内容的返图、直拍、搬运和其他平台动态等快速检索词。</p>

      <h4><i class="fab fa-tiktok platform-heading-icon douyin-icon"></i>抖音安利</h4>
      <p>抖音部分收录「贝贝爱吃贝果🥯」、「贝贝bei～」和「GNZ48」的作品。前两个账号全量保留，GNZ48 账号仅保留标题、描述或标签中含有「徐郑子滢」的作品。</p>
      <p>页面展示作品标题、描述、标签、媒体类型、时长、完整发布时间以及点赞、收藏、评论和分享数据，支持账号筛选、精确或模糊检索及升降序排列。</p>

      <p>B站UP主、微博和抖音账号列表会不定时爬取更新。如果你知道有优质产出账号尚未收录，欢迎联系我补充。</p>

      <h3>🔗 项目源代码与数据来源</h3>
      <p class="project-links">
        <a href="https://github.com/30466/xzzy-fansite" target="_blank" rel="noopener noreferrer">本站源代码</a>
        <a href="https://github.com/30466/bili-core" target="_blank" rel="noopener noreferrer">B站爬虫项目 bili-core</a>
        <a href="https://github.com/30466/weibo-core" target="_blank" rel="noopener noreferrer">微博爬虫项目 weibo-core</a>
        <a href="https://github.com/30466/douyin-downloader" target="_blank" rel="noopener noreferrer">抖音爬虫项目 douyin-downloader</a>
      </p>

      <el-divider />
      
      <h3>✂️ 关于剪辑</h3>
      <p>平时我直接使用自己写好的五个skills（包括下载查询口袋 48 录播；批量剪切，包含切片本，支持该网站的一键剪切功能，而且更快，因为浏览器都有限制；批量上传歌曲的小偶像音乐网站；批量上传切片本到该网站；弹幕唱歌检测，使用脚本和纯大语言模型交叉检验；这些skills都在置顶导航条的“工具“网站可查询），切片本正是本网站前端数据根基。</p>
      <p>做这个网站就是想记录一下，然后给其他老师提供切片本。可以下载自推的唱歌切片或者以后可能还有视频切片。只要一个老师上传，其他老师就无需重复工作。</p>
      <div class="contact-section">
        <h3 class="contact-subtitle">如果你想与我交流，可以通过以下方式联系我</h3>
        <div class="contact-buttons">
          <a href="mailto:chenbojun04@gmail.com" class="contact-btn">✉️ 发送邮件</a>
          <button class="contact-btn" type="button" @click="showQrCode('wechat')"><i class="fab fa-weixin"></i> 添加微信</button>
          <button class="contact-btn" type="button" @click="showQrCode('qq')"><i class="fab fa-qq"></i> 添加QQ</button>
          <a href="https://me.abm48.com/" target="_blank" rel="noopener noreferrer" class="contact-btn">🏠 我的个人主页</a>
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
.project-links { display: flex; flex-wrap: wrap; gap: 8px 18px; }
.platform-heading-icon { width: 20px; margin-right: 7px; text-align: center; }
.bilibili-icon { color: #00a1d6; }
.weibo-icon { color: #e6162d; }
.douyin-icon { color: #161823; }

:deep(.qr-dialog .el-dialog__header) {
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
  width: 140px;
  height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: 4px;
  background: #204fa1;
  color: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
}

.contact-btn:hover {
  color: #fff;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

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
