<template>
  <div class="upload-page">
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">☁️ 切片本上传后台</span>
          <router-link to="/">
            <el-button link>返回首页</el-button>
          </router-link>
        </div>
      </template>

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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { FolderAdd, UploadFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

onMounted(() => {
  document.title = '徐郑子滢 ✽ 上传切片本';
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
</style>
