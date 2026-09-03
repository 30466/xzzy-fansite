<?php
require_once __DIR__ . '/../time.php';
function expectSame($expected, $actual, string $label): void { if ($expected !== $actual) { fwrite(STDERR, "FAIL {$label}\n"); exit(1); } }
$afternoon = strtotime('2026-08-28T05:56:00Z') * 1000;
expectSame('2026-08-28 13:56:00', beijingDateTimeFromUnixMs($afternoon)?->format('Y-m-d H:i:s'), 'timestamp display');
expectSame('2026-08-28', archiveDateFromUnixMs($afternoon), 'afternoon archive');
expectSame('2026-08-27', archiveDateFromBeijingDateTime('2026-08-28 05:59:59'), 'before boundary');
expectSame('2026-08-28', archiveDateFromBeijingDateTime('2026-08-28 06:00:00'), 'at boundary');
expectSame('2025-12-31', archiveDateFromBeijingDateTime('2026-01-01 05:59:59'), 'year boundary');
expectSame(null, archiveDateFromBeijingDateTime('2026-02-30 05:00:00'), 'invalid date');
expectSame(null, archiveDateFromUnixMs('invalid'), 'invalid timestamp');
echo "PHP time tests passed\n";
