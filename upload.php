<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// === 辅助函数：解析 .env 文件 ===
function loadEnv($path) {
    if (!file_exists($path)) {
        return [];
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];
    foreach ($lines as $line) {
        // 跳过注释和空行
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $env[trim($name)] = trim($value);
        }
    }
    return $env;
}

// === 配置区域 ===

// 1. 加载环境变量
$env = loadEnv(__DIR__ . '/.env');

// 获取密码，如果 .env 里没配，就默认为空（导致无法上传，保证安全）
$ACCESS_PASSWORD = isset($env['UPLOAD_PASSWORD']) ? $env['UPLOAD_PASSWORD'] : '';

// 2. 路径配置
$TARGET_DIR = __DIR__ . "/scripts/txt_source/";
$SCRIPT_PATH = __DIR__ . "/scripts/gen-data.js";
// 请确认你的 node 路径
$NODE_PATH = "/www/server/nodejs/v24.11.1/bin/node"; 

// === 逻辑区域 ===

$response = [
    'success' => false,
    'logs' => []
];

// 🔒 检查 1: 服务器端是否配置了密码
if (empty($ACCESS_PASSWORD)) {
    $response['logs'][] = "❌ 服务器端未配置密码 (.env)，请联系管理员。";
    echo json_encode($response);
    exit;
}

// 🔒 检查 2: 验证用户输入的密码
// 这里就是你要求的：如果密码不对，返回具体的错误日志
if (!isset($_POST['password']) || $_POST['password'] !== $ACCESS_PASSWORD) {
    $response['logs'][] = "❌ 密码错误！无法进行上传操作。"; 
    echo json_encode($response);
    exit;
}

// 📂 检查 3: 是否有文件
if (!isset($_FILES['files'])) {
    $response['logs'][] = "❌ 未接收到文件。";
    echo json_encode($response);
    exit;
}

$uploadedFiles = $_FILES['files'];
$fileCount = count($uploadedFiles['name']);
$successCount = 0;

// 🔄 遍历处理文件
for ($i = 0; $i < $fileCount; $i++) {
    $fileName = $uploadedFiles['name'][$i];
    $tmpName = $uploadedFiles['tmp_name'][$i];
    $fileError = $uploadedFiles['error'][$i];

    if ($fileError !== UPLOAD_ERR_OK) {
        $response['logs'][] = "❌ [{$fileName}] 上传传输失败 (Error Code: $fileError)";
        continue;
    }

    // 校验 A: 文件名格式 (YYYY-MM-DD...)
    if (!preg_match('/^\d{4}-\d{2}-\d{2}~\d{2}\.\d{2}\.\d{2}.*\.txt$/i', $fileName)) {
        $response['logs'][] = "⚠️ [{$fileName}] 失败: 文件名格式不正确 (必须是日期~时间格式)";
        continue;
    }

    // 校验 B: 内容格式
    $content = file_get_contents($tmpName);
    if (mb_strpos($content, '名称:') === false || 
        mb_strpos($content, '开始:') === false || 
        mb_strpos($content, '结束:') === false) {
        $response['logs'][] = "⚠️ [{$fileName}] 失败: 内容格式错误 (缺少 '名称:', '开始:' 或 '结束:')";
        continue;
    }

    // 保存文件
    if (move_uploaded_file($tmpName, $TARGET_DIR . $fileName)) {
        $response['logs'][] = "✅ [{$fileName}] 上传并校验成功！";
        $successCount++;
    } else {
        $response['logs'][] = "❌ [{$fileName}] 保存失败 (权限不足？)";
    }
}

// 🚀 触发 Node 脚本
if ($successCount > 0) {
    $response['logs'][] = "🔄 正在触发数据更新脚本...";
    $cmd = "$NODE_PATH $SCRIPT_PATH 2>&1";
    $output = [];
    $returnVar = 0;
    exec($cmd, $output, $returnVar);

    if ($returnVar === 0) {
        $response['logs'][] = "🎉 数据更新成功！(gen-data.js 执行完毕)";
        $response['success'] = true;
    } else {
        $response['logs'][] = "⚠️ 脚本执行可能有误，请检查日志：";
        $response['logs'] = array_merge($response['logs'], $output);
    }
} else {
    $response['logs'][] = "❌ 没有有效文件被处理。";
}

echo json_encode($response);
?>