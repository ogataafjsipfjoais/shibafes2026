<?php
require_once __DIR__ . '/simulator-status-lib.php';
function tbt_ranking_compare($a, $b) {
    $parts = function($v) { $x=explode('.', $v); return [ltrim($x[0], '0') ?: '0', $x[1] ?? '']; };
    [$aw,$af]=$parts($a); [$bw,$bf]=$parts($b);
    return strlen($aw)<=>strlen($bw) ?: strcmp($aw,$bw) ?: strcmp(str_pad($af,30,'0'),str_pad($bf,30,'0'));
}
function tbt_ranking_from_csv($csv, $now) {
    if (!is_string($csv) || strlen($csv)>65536 || strpos(ltrim($csv), '<')===0) throw new RuntimeException('Invalid ranking response');
    $stream=fopen('php://temp','r+'); fwrite($stream,preg_replace('/^\xEF\xBB\xBF/', '', $csv)); rewind($stream);
    try {
        if(fgetcsv($stream,65537,',','"','')!==['記録ID','公開名','飛距離（m）','公開可否']) throw new RuntimeException('Invalid ranking headers');
        $entries=[]; $keys=[]; $count=0;
        while(($row=fgetcsv($stream,65537,',','"',''))!==false) {
            if(++$count>500) throw new RuntimeException('Too many records');
            if(count($row)===1 && $row[0]===null) continue;
            if(count($row)!==4) throw new RuntimeException('Invalid row');
            [$key,$name,$distance,$visible]=array_map('trim',$row);
            if($visible!== '公開') continue;
            if(!preg_match('/^[A-Za-z0-9_-]{1,80}$/D',$key) || isset($keys[$key]) || $name==='' || preg_match_all('/./us',$name)>40
                || !preg_match('/^(0|[1-9][0-9]{0,6})(\.[0-9]{1,30})?$/D',$distance) || tbt_ranking_compare($distance,'1000000')>0) throw new RuntimeException('Invalid public record');
            $keys[$key]=true; $entries[]=['entryKey'=>$key,'nickname'=>$name,'distanceM'=>$distance];
        }
        usort($entries,function($a,$b){ return tbt_ranking_compare($b['distanceM'],$a['distanceM']); });
        $entries=array_slice($entries,0,10); $previous=null; $rank=0;
        foreach($entries as $i=>&$entry) { if($previous===null || tbt_ranking_compare($entry['distanceM'],$previous)!==0) $rank=$i+1; $previous=$entry['distanceM']; $entry['rank']=$rank; }
        unset($entry);
        return ['schemaVersion'=>1,'updatedAt'=>gmdate('Y-m-d\TH:i:s\Z',$now),'groups'=>[['key'=>'all','label'=>'飛距離ランキング','entries'=>$entries]]];
    } finally { fclose($stream); }
}
