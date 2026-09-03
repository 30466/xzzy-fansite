<?php

function expectUpload(bool $condition, string $label): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL {$label}" . PHP_EOL);
        exit(1);
    }
}

function removeTestDirectory(string $directory): void {
    if (!is_dir($directory)) return;
    $items = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($items as $item) {
        $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
    }
    rmdir($directory);
}

function runUploadCase(string $zone, array $post, ?array $existingData = null): array {
    $root = dirname(__DIR__);
    $directory = sys_get_temp_dir() . '/fansite-upload-' . bin2hex(random_bytes(6));
    mkdir($directory . '/public/data', 0755, true);
    copy($root . '/upload.php', $directory . '/upload.php');
    file_put_contents($directory . '/.env', "UPLOAD_PASSWORD=test-only\n");
    $initialData = $existingData ?? ['generatedAt' => '2026-09-03T00:00:00+00:00', 'totalClips' => 0, 'clips' => []];
    file_put_contents($directory . '/public/data/videoclips.json', json_encode($initialData));

    $code = '$_POST = ' . var_export($post, true) . '; include ' . var_export($directory . '/upload.php', true) . ';';
    $command = escapeshellarg(PHP_BINARY)
        . ' -d ' . escapeshellarg('date.timezone=' . $zone)
        . ' -r ' . escapeshellarg($code);
    $output = shell_exec($command);
    $response = json_decode((string) $output, true);
    $data = json_decode(file_get_contents($directory . '/public/data/videoclips.json'), true);
    removeTestDirectory($directory);
    return [$response, $data];
}

$basePost = [
    'type' => 'videoclip',
    'password' => 'test-only',
    'name' => '测试切片',
    'startTime' => '00:01',
    'endTime' => '00:02',
    'liveId' => '123',
    'replayTitle' => '测试录播',
    'broadcastTime' => '2026-08-28 13:56:00',
    'replayDate' => '2026-08-28'
];

foreach (['Asia/Shanghai', 'UTC', 'America/New_York'] as $zone) {
    [$valid, $data] = runUploadCase($zone, $basePost);
    expectUpload($valid['success'] === true, "{$zone}: 原格式上传成功");
    $clip = $data['clips'][0] ?? null;
    expectUpload($clip['broadcastTime'] === '2026-08-28 13:56:00', "{$zone}: 北京时间");
    expectUpload($clip['replayDate'] === '2026-08-28', "{$zone}: 北京时间自然日");
    expectUpload(!array_key_exists('replayCtime', $clip), "{$zone}: 不新增 replayCtime");
}

$legacyData = ['generatedAt' => '2026-09-03T00:00:00+00:00', 'totalClips' => 1, 'clips' => [[
    'id' => 'old', 'liveId' => '456', 'broadcastTime' => '2025-07-28 23:26:06', 'replayDate' => '2025-07-28'
]]];
[$legacy, $legacyResult] = runUploadCase('UTC', $basePost, $legacyData);
expectUpload($legacy['success'] === true, '原格式旧 JSON 可以继续追加');
expectUpload(count($legacyResult['clips']) === 2, '旧记录得到保留');

echo "PHP upload contract tests passed" . PHP_EOL;
