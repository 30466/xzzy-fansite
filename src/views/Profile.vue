<template>
  <div class="profile-page">
    <div class="content-wrapper" v-loading="loading">
      <!-- 错误提示 -->
      <div v-if="error" class="error-state">
        <el-alert type="error" :title="error" show-icon />
      </div>

      <template v-else-if="member">
        <!-- 1. 头部信息卡片 -->
        <el-card class="glass-card header-card">
          <div class="header-content">
            <img
              :src="getFullUrl(member.avatar_url)"
              class="avatar-large"
              @click="previewImage(getFullUrl(member.avatar_url))"
            />
            <div class="info-col">
              <h1 class="name-large">{{ member.name }}</h1>
              <div class="tags-row">
                <el-tag>{{ member.group_name }}</el-tag>
                <el-tag type="info">{{ member.team }}</el-tag>
                <el-tag type="success">{{ member.generation }}</el-tag>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 2. Catch Phrase -->
        <el-card class="glass-card" v-if="member.catch_phrase">
          <template #header>
            <span class="section-title">Catch Phrase</span>
          </template>
          <div class="catch-phrase-box">
            {{ member.catch_phrase }}
          </div>
        </el-card>

        <!-- 3. 详细资料 -->
        <el-card class="glass-card">
          <template #header>
            <span class="section-title">详细资料</span>
          </template>
          <div class="detail-grid">
            <div class="d-item">
              <span class="label">昵称</span>
              <span class="val">{{ member.nickname || '-' }}</span>
            </div>
            <div class="d-item">
              <span class="label">身高</span>
              <span class="val">{{ member.height ? member.height + 'cm' : '-' }}</span>
            </div>
            <div class="d-item">
              <span class="label">生日</span>
              <span class="val">{{ member.birthday || '-' }}</span>
            </div>
            <div class="d-item">
              <span class="label">出生地</span>
              <span class="val">{{ member.birth_place || '-' }}</span>
            </div>
            <div class="d-item">
              <span class="label">入团时间</span>
              <span class="val">{{ member.join_date || '-' }}</span>
            </div>
            <div class="d-item">
              <span class="label">出生日期</span>
              <span class="val">{{ member.birth_date_full || '-' }}</span>
            </div>
            <div class="d-item full-width">
              <span class="label">爱好</span>
              <span class="val">{{ member.hobbies || '-' }}</span>
            </div>
          </div>
        </el-card>

        <!-- 4. 经历 -->
        <el-card class="glass-card" v-if="member.experience">
          <template #header>
            <span class="section-title">经历</span>
          </template>
          <div class="rich-text-content" v-html="member.experience"></div>
        </el-card>

        <!-- 5. 总选排名 -->
        <el-card class="glass-card">
          <template #header>
            <span class="section-title">总选排名</span>
          </template>
          <el-table
            v-if="electionRanks.length > 0"
            :data="electionRanks"
            stripe
            style="width: 100%"
          >
            <el-table-column prop="election_year" label="年份" />
            <el-table-column prop="election_no" label="第几届" />
            <el-table-column prop="rank_no" label="排名" />
          </el-table>
          <div v-else class="rank-empty">
            未进圈/未参选
          </div>
        </el-card>

        <!-- 6. 照片 -->
        <el-card class="glass-card" v-if="hasPhotos">
          <template #header>
            <span class="section-title">照片</span>
          </template>

          <!-- 全身照 -->
          <div class="photo-group" v-if="member.full_body_url">
            <div class="sub-title">全身照</div>
            <div class="photo-list">
              <img
                v-for="(url, idx) in splitUrls(member.full_body_url)"
                :key="'full-'+idx"
                :src="getFullUrl(url)"
                class="photo-item-large"
                @click="previewImage(getFullUrl(url))"
              />
            </div>
          </div>

          <!-- 历史队服照 -->
          <div class="photo-group" v-if="member.history_uniform_url">
            <div class="sub-title">历史队服照</div>
            <div class="photo-list">
              <img
                v-for="(url, idx) in splitUrls(member.history_uniform_url)"
                :key="'uniform-'+idx"
                :src="getFullUrl(url)"
                class="photo-item"
                @click="previewImage(getFullUrl(url))"
              />
            </div>
          </div>

          <!-- 历史公式照 -->
          <div class="photo-group" v-if="member.history_formula_url">
            <div class="sub-title">历史公式照</div>
            <div class="photo-list">
              <img
                v-for="(url, idx) in splitUrls(member.history_formula_url)"
                :key="'formula-'+idx"
                :src="getFullUrl(url)"
                class="photo-item"
                @click="previewImage(getFullUrl(url))"
              />
            </div>
          </div>
        </el-card>

        <!-- 7. Footer -->
        <div class="footer-block">
          <div class="footer-text">
            <span>以上数据全部由</span>
            <a href="https://space.bilibili.com/60064858" target="_blank" class="author-link">路空空k</a>
            <span>成员档案app/网站提供</span>
          </div>
          <div class="footer-actions">
            <el-button type="primary" @click="openLink('https://snh48wiki.top/')">
              成员档案网站
            </el-button>
            <el-button type="primary" @click="openLink('https://tools.abm48.com/')">
              成员档案APP下载
            </el-button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const MEMBER_NAME = '徐郑子滢'

const member = ref(null)
const electionRanks = ref([])
const loading = ref(true)
const error = ref('')

const hasPhotos = computed(() => {
  if (!member.value) return false
  return member.value.full_body_url || member.value.history_uniform_url || member.value.history_formula_url
})

const getFullUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `https://abm48.com${url}`
}

const splitUrls = (str) => {
  if (!str) return []
  return str.split(/[;,]/).filter((u) => u.trim())
}

async function getMemberId() {
  const res = await fetch('/api/public/snh48/mapping')
  if (!res.ok) throw new Error(`mapping 请求失败: ${res.status}`)
  const mapping = await res.json()
  const id = mapping[MEMBER_NAME]
  if (!id) throw new Error(`未找到成员 "${MEMBER_NAME}"`)
  return id
}

const fetchMemberDetail = async (memberId) => {
  const res = await fetch(`/api/public/snh48/members/${memberId}`)
  if (!res.ok) throw new Error(`请求失败: ${res.status}`)
  const data = await res.json()
  if (data && !data.error) {
    member.value = data
  } else {
    error.value = data?.error || '获取成员详情失败'
  }
}

const fetchElectionRanks = async (memberId) => {
  try {
    const res = await fetch(`/api/public/snh48/members/${memberId}/election-ranks`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        electionRanks.value = [...data].sort((a, b) => {
          const y = Number(a.election_year) - Number(b.election_year)
          if (y !== 0) return y
          return Number(a.election_no) - Number(b.election_no)
        })
      }
    }
  } catch (err) {
    console.error('获取总选排名失败:', err)
    electionRanks.value = []
  }
}

const previewImage = (url) => {
  window.open(url, '_blank')
}

const openLink = (url) => {
  window.open(url, '_blank')
}

onMounted(async () => {
  document.title = '徐郑子滢 ✽ 简介'
  loading.value = true
  error.value = ''
  try {
    const id = await getMemberId()
    await Promise.all([fetchMemberDetail(id), fetchElectionRanks(id)])
  } catch (err) {
    console.error('获取成员资料失败:', err)
    error.value = '无法加载成员资料'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.profile-page {
  padding-bottom: 50px;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.error-state {
  background: rgba(255, 255, 255, 0.9);
  padding: 40px;
  border-radius: 12px;
}

/* 玻璃卡片风格 */
.glass-card {
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 12px !important;
  margin-bottom: 20px;
}

.header-card {
  margin-top: 10px;
}

/* 头部样式 */
.header-content {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  object-fit: cover;
}

.info-col {
  flex: 1;
}

.name-large {
  font-size: 28px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 10px 0;
}

.tags-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 区块标题 */
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #ff6b81;
}

/* 详细资料 */
.detail-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.d-item {
  width: 45%;
  display: flex;
  flex-direction: column;
}

.d-item.full-width {
  width: 100%;
}

.d-item .label {
  font-size: 12px;
  color: #8e8e93;
  margin-bottom: 4px;
}

.d-item .val {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* Catch Phrase */
.catch-phrase-box {
  font-weight: 700;
  color: #000;
  line-height: 1.8;
  font-size: 15px;
}

/* 富文本内容 */
.rich-text-content {
  font-size: 14px;
  color: #444;
  line-height: 1.8;
}

.rich-text-content :deep(p) {
  margin-bottom: 12px;
}

.rich-text-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 12px 0;
}

.rich-text-content :deep(strong),
.rich-text-content :deep(b) {
  color: #1a1a1a;
  font-weight: 700;
}

/* 排名表格 */
.rank-empty {
  padding: 20px 0;
  text-align: center;
  color: #666;
}

/* 照片 */
.photo-group {
  margin-bottom: 24px;
}

.photo-group:last-child {
  margin-bottom: 0;
}

.sub-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  font-weight: 600;
}

.photo-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 10px;
  min-height: 50px;
  -webkit-overflow-scrolling: touch;
}

.photo-list::-webkit-scrollbar {
  display: block;
  height: 8px;
}

.photo-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.photo-list::-webkit-scrollbar-thumb {
  background: #ff6b81;
  border-radius: 4px;
}

.photo-item {
  width: 130px;
  height: 180px;
  border-radius: 12px;
  object-fit: cover;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.photo-item:hover {
  transform: scale(1.05);
}

.photo-item-large {
  width: 180px;
  height: 270px;
  border-radius: 12px;
  object-fit: cover;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.photo-item-large:hover {
  transform: scale(1.05);
}

/* Footer */
.footer-block {
  padding: 40px 20px;
  text-align: center;
}

.footer-text {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.author-link {
  color: #ff6b81;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 700;
  margin: 0 4px;
}

.author-link:hover {
  color: #ff4757;
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 响应式 */
@media (max-width: 600px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .avatar-large {
    width: 80px;
    height: 80px;
  }

  .name-large {
    font-size: 22px;
  }

  .d-item {
    width: 100%;
  }

  .photo-item {
    width: 110px;
    height: 160px;
  }

  .photo-item-large {
    width: 160px;
    height: 240px;
  }

  .footer-actions {
    flex-direction: column;
    align-items: center;
  }

  .footer-actions .el-button {
    width: 80%;
    max-width: 250px;
  }
}
</style>
