<?php

const BEIJING_TIME_ZONE = 'Asia/Shanghai';
const ARCHIVE_DAY_START_HOUR = 6;

function beijingTimeZone(): DateTimeZone { static $zone = null; if ($zone === null) $zone = new DateTimeZone(BEIJING_TIME_ZONE); return $zone; }
function parseBeijingDateTime(string $value): ?DateTimeImmutable {
    $date = DateTimeImmutable::createFromFormat('!Y-m-d H:i:s', trim($value), beijingTimeZone());
    $errors = DateTimeImmutable::getLastErrors();
    if ($date === false || ($errors !== false && ($errors['warning_count'] > 0 || $errors['error_count'] > 0))) return null;
    return $date;
}
function archiveDateFromBeijingDateTime(string $value): ?string {
    $date = parseBeijingDateTime($value); if ($date === null) return null;
    if ((int) $date->format('G') < ARCHIVE_DAY_START_HOUR) $date = $date->modify('-1 day');
    return $date->format('Y-m-d');
}

function unixMsFromBeijingDateTime(string $value): ?int {
    $date = parseBeijingDateTime($value);
    return $date === null ? null : ((int) $date->format('U')) * 1000;
}
function beijingDateTimeFromUnixMs($value): ?DateTimeImmutable {
    if (!is_numeric($value) || (float) $value <= 0) return null;
    try { return (new DateTimeImmutable('@' . (int) floor(((float) $value) / 1000)))->setTimezone(beijingTimeZone()); }
    catch (Exception $error) { return null; }
}
function archiveDateFromUnixMs($value): ?string {
    $date = beijingDateTimeFromUnixMs($value); if ($date === null) return null;
    if ((int) $date->format('G') < ARCHIVE_DAY_START_HOUR) $date = $date->modify('-1 day');
    return $date->format('Y-m-d');
}
function utcNowIso(): string { return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:sP'); }
