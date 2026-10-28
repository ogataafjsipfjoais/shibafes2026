<?php
/** Read only the three public reception fields. No participant data is projected. */
function tbt_status_from_csv($csv, $now) {
    if (!is_string($csv) || strlen($csv) > 65536 || strpos(ltrim($csv), '<') === 0) {
        throw new RuntimeException('Invalid sheet response');
    }
    $csv = preg_replace('/^\xEF\xBB\xBF/', '', $csv);
    $stream = fopen('php://temp', 'r+');
    fwrite($stream, $csv); rewind($stream);
    $rows = [];
    while (($row = fgetcsv($stream, 65537, ',', '"', '')) !== false) {
        if (count($rows) >= 4 || count($row) !== 2) { fclose($stream); throw new RuntimeException('Unexpected sheet range'); }
        $rows[] = array_map('trim', $row);
    }
    fclose($stream);
    $labels = ['項目', '受付状況', '待ち時間の下限（分）', '待ち時間の上限（分）'];
    if (count($rows) !== 4 || $rows[0][1] !== '値') throw new RuntimeException('Missing sheet fields');
    foreach ($labels as $i => $label) if ($rows[$i][0] !== $label) throw new RuntimeException('Changed sheet fields');
    $state = $rows[1][1];
    if ($state === '' || $state === '未設定') return null;
    $states = ['受付中' => 'open', '一時停止中' => 'paused', '受付終了' => 'closed'];
    if (!isset($states[$state])) throw new RuntimeException('Invalid reception');
    $min = $rows[2][1]; $max = $rows[3][1]; $wait = null;
    if ($min !== '' || $max !== '') {
        if (!preg_match('/^(0|[1-9][0-9]{0,3})$/D', $min) || !preg_match('/^(0|[1-9][0-9]{0,3})$/D', $max)
            || (int)$min > (int)$max || (int)$max > 1440) throw new RuntimeException('Invalid wait interval');
        $wait = ['min' => (int)$min, 'max' => (int)$max];
    }
    return ['schemaVersion' => 1, 'reception' => $states[$state], 'waitMinutes' => $wait, 'updatedAt' => gmdate('Y-m-d\TH:i:s\Z', $now)];
}
function tbt_status_read_sheet($url) {
    for ($redirect = 0; $redirect < 4; $redirect++) {
        $host = parse_url($url, PHP_URL_HOST);
        if (parse_url($url, PHP_URL_SCHEME) !== 'https' || !($host === 'docs.google.com' || substr($host, -22) === '.googleusercontent.com')) {
            throw new RuntimeException('Invalid source destination');
        }
        $context = stream_context_create(['http' => ['method' => 'GET', 'timeout' => 5, 'follow_location' => 0,
            'ignore_errors' => true, 'header' => "Accept: text/csv\r\nUser-Agent: TBT-Reception-JSON/1.0\r\n"],
            'ssl' => ['verify_peer' => true, 'verify_peer_name' => true]]);
        $handle = @fopen($url, 'rb', false, $context);
        if (!$handle) throw new RuntimeException('Sheet unavailable');
        $meta = stream_get_meta_data($handle); $headers = $meta['wrapper_data'] ?? [];
        $body = stream_get_contents($handle, 65537); fclose($handle);
        $status = 0; $location = null;
        foreach ($headers as $header) {
            if (preg_match('~^HTTP/\S+\s+(\d+)~', $header, $m)) $status = (int)$m[1];
            if (stripos($header, 'Location:') === 0) $location = trim(substr($header, 9));
        }
        if ($status >= 300 && $status < 400 && $location) { $url = $location; continue; }
        if ($status !== 200 || !is_string($body) || strlen($body) > 65536) throw new RuntimeException('Sheet unavailable');
        return $body;
    }
    throw new RuntimeException('Too many source redirects');
}
function tbt_status_save_json($file, $data) {
    $text = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . "\n";
    $temp = tempnam(dirname($file), '.tbt-status-');
    if (!$temp) throw new RuntimeException('JSON cache unavailable');
    try {
        if (file_put_contents($temp, $text) === false || !@chmod($temp, 0644) || !@rename($temp, $file)) throw new RuntimeException('JSON cache unavailable');
    } finally { if (is_file($temp)) @unlink($temp); }
    clearstatcache(true, $file);
    return $text;
}
