<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// === 辅助函数：解析 .env 文件 ===
function loadEnv($path) {
    if (!file_exists($path)) return [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $env[trim($name)] = trim($value);
        }
    }
    return $env;
}

// 清洗歌名：去末尾括号数字和纯数字
function cleanSongName($name) {
    $s = preg_replace('/\.txt$/i', '', $name);
    $s = preg_replace('/(（\d+）|\(\d+\)|\[\d+\])$/', '', $s); // 去括号
    $s = preg_replace('/\d+$/', '', $s); // 去末尾数字
    return trim($s);
}

// 从文件名解析日期（6点规则）
function parseDateFromFilename($filename) {
    if (!preg_match('/(\d{4}-\d{2}-\d{2})~(\d{2})\.(\d{2})\.(\d{2})/', $filename, $m)) {
        return ['date' => null, 'broadcastTime' => null];
    }
    $broadcastTime = "{$m[1]} {$m[2]}:{$m[3]}:{$m[4]}";
    $date = new DateTime("{$m[1]}T{$m[2]}:{$m[3]}:{$m[4]}");
    if (intval($m[2]) < 6) {
        $date->modify('-1 day');
    }
    return [
        'date' => $date->format('Y-m-d'),
        'broadcastTime' => $broadcastTime
    ];
}

// 从所有 txt 文件生成 songs.json
function regenerateSongsJson($sourceDir, $outputFile) {
    if (!is_dir($sourceDir)) return 0;

    $files = glob($sourceDir . '/*.txt');
    $allSongs = [];

    foreach ($files as $filePath) {
        $filename = basename($filePath);
        $content = file_get_contents($filePath);
        $dateInfo = parseDateFromFilename($filename);

        preg_match_all('/名称:\s*([^\r\n]+)\r?\n开始:\s*([^\r\n]+)\r?\n结束:\s*([^\r\n]+)/', $content, $matches, PREG_SET_ORDER);

        foreach ($matches as $m) {
            $rawName = trim($m[1]);
            $allSongs[] = [
                'id' => $filename . '-' . uniqid(),
                'rawName' => $rawName,
                'cleanName' => cleanSongName($rawName),
                'startTime' => trim($m[2]),
                'endTime' => trim($m[3]),
                'date' => $dateInfo['date'],
                'broadcastTime' => $dateInfo['broadcastTime'],
                'filename' => $filename,
                'fullContent' => $content
            ];
        }
    }

    // 按日期倒序
    usort($allSongs, function($a, $b) {
        return strcmp($b['date'], $a['date']);
    });

    $outputDir = dirname($outputFile);
    if (!is_dir($outputDir)) {
        mkdir($outputDir, 0755, true);
    }

    file_put_contents($outputFile, json_encode($allSongs, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    return count($allSongs);
}

// === 配置 ===
$env = loadEnv(__DIR__ . '/.env');
$ACCESS_PASSWORD = isset($env['UPLOAD_PASSWORD']) ? $env['UPLOAD_PASSWORD'] : '';
$TARGET_DIR = __DIR__ . '/scripts/txt_source/';

// 自动适配本地 dev (public/data/) 和生产 (data/) 路径
$DATA_DIR = is_dir(__DIR__ . '/public/data') ? __DIR__ . '/public/data' : __DIR__ . '/data';
$SONGS_FILE = $DATA_DIR . '/songs.json';
$VIDEOCLIP_FILE = $DATA_DIR . '/videoclips.json';

// ═══════════════════════════
// 路由：视频切片表单提交
// ═══════════════════════════
if (isset($_POST['type']) && $_POST['type'] === 'videoclip') {
    $response = ['success' => false, 'type' => 'videoclip', 'logs' => []];

    if (empty($ACCESS_PASSWORD)) {
        $response['logs'][] = '❌ 服务器端未配置密码 (.env)，请联系管理员。';
        echo json_encode($response); exit;
    }
    if (!isset($_POST['password']) || $_POST['password'] !== $ACCESS_PASSWORD) {
        $response['logs'][] = '❌ 密码错误！无法提交。';
        echo json_encode($response); exit;
    }

    $name = isset($_POST['name']) ? trim($_POST['name']) : '';
    $startTime = isset($_POST['startTime']) ? trim($_POST['startTime']) : '';
    $endTime = isset($_POST['endTime']) ? trim($_POST['endTime']) : '';
    $broadcastTime = isset($_POST['broadcastTime']) ? trim($_POST['broadcastTime']) : '';
    $replayTitle = isset($_POST['replayTitle']) ? trim($_POST['replayTitle']) : '';
    $liveId = isset($_POST['liveId']) ? trim($_POST['liveId']) : '';
    $replayDate = isset($_POST['replayDate']) ? trim($_POST['replayDate']) : '';

    if (empty($name)) { $response['logs'][] = '❌ 切片名称不能为空'; echo json_encode($response); exit; }
    if (empty($startTime) || empty($endTime)) { $response['logs'][] = '❌ 开始时间和结束时间不能为空'; echo json_encode($response); exit; }
    if (empty($liveId)) { $response['logs'][] = '❌ 请选择录播'; echo json_encode($response); exit; }

    $dataDir = dirname($VIDEOCLIP_FILE);
    if (!is_dir($dataDir)) mkdir($dataDir, 0755, true);

    $allClips = [];
    if (file_exists($VIDEOCLIP_FILE)) {
        $existing = json_decode(file_get_contents($VIDEOCLIP_FILE), true);
        if ($existing && isset($existing['clips'])) $allClips = $existing['clips'];
    }

    $newClip = [
        'id' => 'clip_' . date('Ymd_His') . '_' . substr(md5(uniqid()), 0, 6),
        'name' => $name,
        'startTime' => $startTime,
        'endTime' => $endTime,
        'broadcastTime' => $broadcastTime,
        'replayTitle' => $replayTitle,
        'liveId' => $liveId,
        'replayDate' => $replayDate,
        'createdAt' => date('c')
    ];
    array_unshift($allClips, $newClip);

    $output = ['generatedAt' => date('c'), 'totalClips' => count($allClips), 'clips' => $allClips];
    file_put_contents($VIDEOCLIP_FILE, json_encode($output, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

    $response['logs'][] = "✅ 视频切片「{$name}」保存成功！（当前共 " . count($allClips) . " 条）";
    $response['success'] = true;
    echo json_encode($response); exit;
}

// ═══════════════════════════
// 路由：唱歌切片本上传
// ═══════════════════════════

$response = ['success' => false, 'logs' => []];

if (empty($ACCESS_PASSWORD)) {
    $response['logs'][] = '❌ 服务器端未配置密码 (.env)，请联系管理员。';
    echo json_encode($response); exit;
}
if (!isset($_POST['password']) || $_POST['password'] !== $ACCESS_PASSWORD) {
    $response['logs'][] = '❌ 密码错误！无法进行上传操作。';
    echo json_encode($response); exit;
}
if (!isset($_FILES['files'])) {
    $response['logs'][] = '❌ 未接收到文件。';
    echo json_encode($response); exit;
}

$uploadedFiles = $_FILES['files'];
$fileCount = count($uploadedFiles['name']);
$successCount = 0;

for ($i = 0; $i < $fileCount; $i++) {
    $fileName = $uploadedFiles['name'][$i];
    $tmpName = $uploadedFiles['tmp_name'][$i];
    $fileError = $uploadedFiles['error'][$i];

    if ($fileError !== UPLOAD_ERR_OK) {
        $response['logs'][] = "❌ [{$fileName}] 上传传输失败 (Error Code: $fileError)";
        continue;
    }
    if (!preg_match('/^\d{4}-\d{2}-\d{2}~\d{2}\.\d{2}\.\d{2}.*\.txt$/i', $fileName)) {
        $response['logs'][] = "⚠️ [{$fileName}] 失败: 文件名格式不正确 (必须是日期~时间格式)";
        continue;
    }

    $content = file_get_contents($tmpName);
    if (mb_strpos($content, '名称:') === false || mb_strpos($content, '开始:') === false || mb_strpos($content, '结束:') === false) {
        $response['logs'][] = "⚠️ [{$fileName}] 失败: 内容格式错误 (缺少 '名称:', '开始:' 或 '结束:')";
        continue;
    }

    if (move_uploaded_file($tmpName, $TARGET_DIR . $fileName)) {
        $response['logs'][] = "✅ [{$fileName}] 上传并校验成功！";
        $successCount++;
    } else {
        $response['logs'][] = "❌ [{$fileName}] 保存失败 (权限不足？)";
    }
}

if ($successCount > 0) {
    $response['logs'][] = '🔄 正在重新生成歌曲数据...';
    $count = regenerateSongsJson($TARGET_DIR, $SONGS_FILE);
    $response['logs'][] = "🎉 数据更新成功！共 {$count} 首歌。";
    $response['success'] = true;
} else {
    $response['logs'][] = '❌ 没有有效文件被处理。';
}

echo json_encode($response);