<?php


ini_set('memory_limit','1G');

$csv = file_get_contents('rikaichan.csv');
$csv = explode("\n", $csv);

$csv = array_map(function ($line) {
    if ($line === '') return null;

    $array = str_getcsv($line);

    if (!isset($array[2])) {
        $a = 1;
    }
    return ['kanji' => $array[0], 'kana'=> $array[1], 'entry' => $array[2]];
}, $csv);

$json = [
    'name' => 'Japanese-To-English',
    'entries' => $csv
];

file_put_contents('./rikaichan.json', json_encode($json, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));
exit();
