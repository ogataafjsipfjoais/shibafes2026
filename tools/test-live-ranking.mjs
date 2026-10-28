import assert from 'node:assert/strict';
import {rankingFromCSV, statusFromCSV, loadPublic} from '../assets/simulator-public-api-live-20261028.js';

const header = '記録ID,公開名,飛距離（m）,公開可否\n';
const csv = header + 'a,"試験, A",12.345678901234567890123456789012,公開\n'
  + 'b,試験B,12.345678901234567890123456789013,公開\n'
  + 'c,同率B,12.345678901234567890123456789013,公開';
const entries = rankingFromCSV(csv).groups[0].entries;
assert.deepEqual(entries.map(row => [row.entryKey, row.rank]), [['b', 1], ['c', 1], ['a', 3]]);
assert.equal(entries[0].distanceM, '12.345678901234567890123456789013');
assert.equal(entries[2].nickname, '試験, A');
assert.deepEqual(rankingFromCSV(header).groups[0].entries, []);
assert.deepEqual(rankingFromCSV(header + '\n,,,\n').groups[0].entries, []);
for (const invalid of [header + 'x,非公開名,99,非公開', header + 'a,A,1,公開\na,B,2,公開',
  header + 'a,A,-1,公開', header + 'a,A,1000000.1,公開', '<html>失敗</html>', header + '#REF!']) {
  assert.throws(() => rankingFromCSV(invalid));
}
assert.equal(statusFromCSV('項目,値\n受付状況,受付中\n待ち時間の下限（分）,50\n待ち時間の上限（分）,60').waitMinutes.max, 60);

// The browser must use the approved-only live feed and never read an old snapshot on failure.
globalThis.location = {origin: 'https://example.test'};
const feed = 'https://docs.google.com/spreadsheets/d/1xU1jsvE-eoHNVBP5skd7vYcG-69_YBTqnCfSSMsMxcU/export?format=csv&gid=20261028&range=A1%3AD501';
const requests = [];
let body = csv, online = true;
globalThis.fetch = async (url, options) => {
  requests.push({url, options});
  if (url.includes('simulator-public-config.json')) return {ok: true, text: async () => JSON.stringify({schemaVersion: 1, rankingSheetUrl: feed, rankingUrl: '/old.json'})};
  return {ok: online, text: async () => body};
};
assert.equal((await loadPublic('ranking')).groups[0].entries.length, 3);
body = header;
assert.deepEqual((await loadPublic('ranking')).groups[0].entries, []);
online = false;
await assert.rejects(loadPublic('ranking'));
assert.equal(requests.length, 6);
assert.ok(requests.every(request => !request.url.includes('old.json') && request.options.cache === 'no-store'));
assert.equal(new Set(requests.map(request => request.url)).size, 6);
console.log('PASS: exact precision, tied ranks, quoted CSV, deletion, invalid/private records, live requests and no stale fallback');
