<?php
/* Sheet -> validated public JSON file -> JSON response. Requires PHP 7.4+ and HTTPS streams. */
require_once __DIR__ . '/simulator-ranking-lib.php';
$cli = PHP_SAPI === 'cli';
if (!$cli) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', ['GET', 'HEAD'], true)) {
        header('Allow: GET, HEAD'); http_response_code(405); echo '{"error":"method_not_allowed"}'; exit;
    }
}
$file = __DIR__ . '/simulator-ranking.json';
$lock = @fopen(sys_get_temp_dir() . '/tbt-ranking-1xU1jsvE.lock', 'c');
try {
    if (!$lock || !flock($lock, LOCK_EX)) throw new RuntimeException('Cache lock unavailable');
    clearstatcache(true, $file);
    $cached = is_file($file) ? file_get_contents($file) : null;
    if (!$cli && is_string($cached) && time() >= filemtime($file) && time() - filemtime($file) < 25) {
        json_decode($cached, true, 512, JSON_THROW_ON_ERROR);
        echo $cached;
    } else {
        $url = 'https://docs.google.com/spreadsheets/d/1xU1jsvE-eoHNVBP5skd7vYcG-69_YBTqnCfSSMsMxcU/export?format=csv&gid=20261027&range=A1%3AD501';
        $data = tbt_ranking_from_csv(tbt_status_read_sheet($url), time());
        echo tbt_status_save_json($file, $data);
    }
} catch (Throwable $error) {
    // Never advance the verification timestamp or publish raw source/error text on failure.
    $old = isset($cached) && is_string($cached) ? json_decode($cached, true) : null;
    if (is_array($old) && isset($old['schemaVersion'], $old['groups'], $old['updatedAt'])) {
        $old['sourceAvailable'] = false;
        echo json_encode($old, JSON_UNESCAPED_UNICODE);
    } else {
        if (!$cli) http_response_code(503);
        echo '{"error":"ranking_unavailable"}';
    }
    if ($cli) { fwrite(STDERR, "Ranking JSON sync failed. Check sheet access, values, and content directory permissions.\n"); exit(1); }
} finally { if ($lock) { flock($lock, LOCK_UN); fclose($lock); } }
