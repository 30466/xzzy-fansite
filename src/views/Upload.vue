<template>
  <div class="upload-page">
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">📄 唱歌切片本上传</span>
          <router-link to="/">
            <el-button link>返回首页</el-button>
          </router-link>
        </div>
      </template>

      <!-- ═══════ 唱歌切片本上传 ═══════ -->

      <div class="desc-block">
        <p>📌 <b>命名规则</b>：以录播时间命名的 <code>.txt</code> 文件，例如 <code>2026-03-10~00.39.31.txt</code></p>
        <p>📌 <b>格式要求</b>：严格按照唱歌记录切片本的格式，可在本站「口袋48录播回放」→「批量剪切」中剪切获取</p>
        <p>📌 <b>管理员密码</b>：请在<b>关于页</b>联系我</p>
      </div>

      <!-- 1. 密码验证区 -->
      <div class="section">
        <div class="label">🔒 管理员密码</div>
        <el-input 
          v-model="password" 
          type="password" 
          placeholder="请输入上传密码" 
          show-password
          size="large"
          style="max-width: 300px"
        />
      </div>

      <el-divider />

      <!-- 2. 文件选择区 -->
      <div class="section">
        <div class="label">📄 选择切片本 (支持多选)</div>
        <div class="upload-area">
          <input 
            type="file" 
            ref="fileInputRef" 
            multiple 
            accept=".txt"
            @change="handleFileChange"
            style="display: none" 
          />
          <el-button type="primary" size="large" @click="triggerFileSelect">
            <el-icon><FolderAdd /></el-icon> 选择文件
          </el-button>
          
          <span class="file-count" v-if="files.length">
            已选 {{ files.length }} 个文件
          </span>
        </div>
        
        <!-- 文件名预览列表 -->
        <div v-if="files.length" class="file-preview">
          <el-tag 
            v-for="(file, index) in files" 
            :key="index" 
            class="file-tag"
            closable
            @close="removeFile(index)"
          >
            {{ file.name }}
          </el-tag>
        </div>
      </div>

      <!-- 3. 提交按钮 -->
      <div class="actions">
        <el-button 
          type="success" 
          size="large" 
          :loading="uploading" 
          :disabled="files.length === 0 || !password"
          @click="submitUpload"
          class="submit-btn"
        >
          <el-icon><UploadFilled /></el-icon> 
          {{ uploading ? '正在上传并处理...' : '开始上传校验' }}
        </el-button>
      </div>

      <!-- 4. 日志输出区 -->
      <div class="log-container" v-if="logs.length > 0">
        <div class="log-title">运行日志：</div>
        <div class="log-box">
          <div 
            v-for="(log, idx) in logs" 
            :key="idx" 
            class="log-line"
            :class="{'error': log.includes('❌') || log.includes('⚠️'), 'success': log.includes('✅') || log.includes('🎉')}"
          >
            {{ log }}
          </div>
        </div>
      </div>

    </el-card>

    <!-- ═══════ 视频切片提交 ═══════ -->
    <el-card class="upload-card videoclip-section">
      <template #header>
        <span class="section-header-title">🎬 视频切片提交</span>
      </template>

      <el-form :model="clipForm" label-width="100px" label-position="top" size="large">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="切片名称">
              <el-input v-model="clipForm.name" placeholder="例如：为什么选择丝芭，来丝芭前面试了很多公司" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="开始时间">
              <el-input v-model="clipForm.startTime" placeholder="HH:MM:SS 或 MM:SS" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="结束时间">
              <el-input v-model="clipForm.endTime" placeholder="HH:MM:SS 或 MM:SS" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="选择录播">
          <ReplayPicker v-model="clipForm.replay" />
        </el-form-item>

        <div class="actions">
          <el-button
            type="success"
            size="large"
            :loading="clipSubmitting"
            :disabled="!clipForm.name || !clipForm.startTime || !clipForm.endTime || !clipForm.replay"
            @click="submitVideoClip"
            class="submit-btn"
          >
            <el-icon><UploadFilled /></el-icon>
            {{ clipSubmitting ? '提交中...' : '提交视频切片' }}
          </el-button>
        </div>

        <div class="log-container" v-if="clipLogs.length > 0">
          <div class="log-title">提交日志：</div>
          <div class="log-box">
            <div
              v-for="(log, idx) in clipLogs"
              :key="'clip-'+idx"
              class="log-line"
              :class="{'error': log.includes('❌') || log.includes('⚠️'), 'success': log.includes('✅') || log.includes('🎉')}"
            >
              {{ log }}
            </div>
          </div>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { FolderAdd, UploadFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import ReplayPicker from '@/components/ReplayPicker.vue';

onMounted(() => {
  document.title = '徐郑子滢 ✽ 上传';
});

// 这里的 URL 是刚才创建的 php 文件，因为在同一个域名下，用相对路径即可
// 如果是本地开发环境 (localhost)，需要写死服务器地址 '/upload.php' 并处理跨域
// 既然你是在服务器调试，直接写 '/upload.php'
const UPLOAD_URL = '/upload.php';

const password = ref('');
const files = ref([]);
const fileInputRef = ref(null);
const uploading = ref(false);
const logs = ref([]);

const triggerFileSelect = () => {
  fileInputRef.value.click();
};

const handleFileChange = (event) => {
  const selected = Array.from(event.target.files);
  // 追加文件而不是覆盖
  files.value = [...files.value, ...selected];
  // 清空 input 这里的 value，否则删了再选同一个文件不会触发 change
  event.target.value = '';
};

const removeFile = (index) => {
  files.value.splice(index, 1);
};

const submitUpload = async () => {
  if (!password.value) {
    ElMessage.warning('请输入密码');
    return;
  }
  
  uploading.value = true;
  logs.value = ['🚀 开始上传...'];

  const formData = new FormData();
  formData.append('password', password.value);
  
  files.value.forEach(file => {
    formData.append('files[]', file);
  });

  try {
    const res = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData
    });

    // 尝试解析 JSON
    const data = await res.json();
    
    if (data.logs) {
      logs.value = [...logs.value, ...data.logs];
    } else {
      logs.value.push('⚠️ 服务器返回了未知格式的数据');
    }

    if (data.success) {
      ElMessage.success('上传处理完成');
      files.value = []; // 清空选择
    } else {
      ElMessage.warning('上传过程存在问题，请查看日志');
    }

  } catch (error) {
    console.error(error);
    logs.value.push(`❌ 网络或解析错误: ${error.message}`);
    logs.value.push('💡 提示: 检查 upload.php 是否存在以及是否有执行权限。');
  } finally {
    uploading.value = false;
  }
};

// ── 视频切片表单 ──
const clipForm = ref({
  name: '',
  startTime: '',
  endTime: '',
  replay: null  // ReplayPicker 选中的录播对象
});
const clipSubmitting = ref(false);
const clipLogs = ref([]);

const submitVideoClip = async () => {
  const form = clipForm.value;
  if (!form.replay) {
    ElMessage.warning('请选择录播');
    return;
  }
  if (!password.value) {
    ElMessage.warning('请在上方输入管理员密码');
    return;
  }

  clipSubmitting.value = true;
  clipLogs.value = ['🚀 正在提交视频切片...'];

  // 格式化录播时间
  const fmtReplayTime = (ms) => {
    const d = new Date(Number(ms));
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };

  // 获取录播归档日期（6点规则）
  const getReplayDate = (ms) => {
    const d = new Date(Number(ms));
    d.setHours(d.getHours() - 6);
    return d.toISOString().slice(0, 10);
  };

  const formData = new FormData();
  formData.append('type', 'videoclip');
  formData.append('password', password.value);
  formData.append('name', form.name);
  formData.append('startTime', form.startTime);
  formData.append('endTime', form.endTime);
  formData.append('broadcastTime', fmtReplayTime(form.replay.ctime));
  formData.append('replayTitle', form.replay.title || '');
  formData.append('liveId', String(form.replay.liveId));
  formData.append('replayDate', getReplayDate(form.replay.ctime));

  try {
    const res = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.logs) {
      clipLogs.value = [...clipLogs.value, ...data.logs];
    }
    if (data.success) {
      ElMessage.success('视频切片提交成功！');
      // 清空表单
      clipForm.value = { name: '', startTime: '', endTime: '', replay: null };
    } else {
      ElMessage.warning('提交存在问题，请查看日志');
    }
  } catch (error) {
    clipLogs.value.push(`❌ 网络或解析错误: ${error.message}`);
  } finally {
    clipSubmitting.value = false;
  }
};
</script>

<style scoped>
.upload-page {
  max-width: 900px;
  margin: 0 auto;
  min-height: 80vh;
}

.upload-card {
  background: rgba(255, 255, 255, 0.95);
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.section {
  margin-bottom: 20px;
}

.desc-block {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
}

.desc-block p {
  margin: 0;
}

.desc-block code {
  background: #e9ecef;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 13px;
}

.label {
  font-weight: bold;
  color: #606266;
  margin-bottom: 10px;
  display: block;
}

.upload-area {
  display: flex;
  align-items: center;
  gap: 15px;
}

.file-preview {
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.actions {
  margin-top: 30px;
  text-align: center;
}

.submit-btn {
  width: 200px;
  font-weight: bold;
}

.log-container {
  margin-top: 30px;
  border-top: 1px dashed #dcdfe6;
  padding-top: 20px;
}

.log-title {
  font-weight: bold;
  margin-bottom: 10px;
}

.log-box {
  background: #1e1e1e;
  border-radius: 6px;
  padding: 15px;
  font-family: monospace;
  max-height: 300px;
  overflow-y: auto;
}

.log-line {
  color: #fff;
  margin-bottom: 4px;
  font-size: 13px;
  line-height: 1.5;
  border-bottom: 1px solid #333;
  padding-bottom: 2px;
}

.log-line.error { color: #ff6b81; }
.log-line.success { color: #67c23a; }

/* 视频切片区 */
.videoclip-section {
  margin-top: 20px;
}
.section-header {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}
.section-header-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}
</style>