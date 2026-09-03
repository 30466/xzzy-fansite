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
    copy($root . '/time.php', $directory . '/time.php');
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
    'replayTitle' => '测试录播'
];

foreach (['Asia/Shanghai', 'UTC', 'America/New_York'] as $zone) {
    [$invalid] = runUploadCase($zone, $basePost);
    expectUpload($invalid['success'] === false, "{$zone}: 缺少 replayCtime 必须拒绝");

    [$valid, $data] = runUploadCase($zone, $basePost + ['replayCtime' => '1787896560000']);
    expectUpload($valid['success'] === true, "{$zone}: 新格式上传成功");
    $clip = $data['clips'][0] ?? null;
    expectUpload($clip['broadcastTime'] === '2026-08-28 13:56:00', "{$zone}: 北京时间");
    expectUpload($clip['replayDate'] === '2026-08-28', "{$zone}: 六点归档日期");
    expectUpload($clip['replayCtime'] === 1787896560000, "{$zone}: replayCtime 为 JSON 数值");
}

$legacyData = ['generatedAt' => '2026-09-03T00:00:00+00:00', 'totalClips' => 1, 'clips' => [[
    'liveId' => '123', 'replayCtime' => '1787896560000'
]]];
[$legacy] = runUploadCase('UTC', $basePost + ['replayCtime' => '1787896560000'], $legacyData);
expectUpload($legacy['success'] === false, '字符串 replayCtime 的旧 JSON 必须拒绝');

echo "PHP upload contract tests passed" . PHP_EOL;
