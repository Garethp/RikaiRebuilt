<?php

ini_set('memory_limit','1G');

$dictionaries = [
    'english' => [
        'name' => 'Japanese To English Dictionary',
        'id' => 'e82ffa3b-1cd4-4749-b5bf-9a6f64e6890a',
    ],
    'names' => [
        'name' => 'Japanese Names',
        'id' => '359fe507-7235-4040-8f7b-c5af90e9897d',
    ],
    'dutch' => [
        'name' => 'Japanese To Dutch Dictionary',
        'id' => 'a544e3ba-51cc-4574-aed5-54e195557e17',
    ],
];

function convertCSV($filename, $name, $id)
{
    $csv = file_get_contents("$filename.csv");
    $csv = explode("\n", $csv);

    $csv = array_map(function ($line) {
        if ($line === '') {
            return null;
        }

        $array = str_getcsv($line);

        if (!isset($array[2])) {
            $a = 1;
        }

        return ['kanji' => $array[0], 'kana' => $array[1], 'entry' => $array[2]];
    }, $csv);

    $json = [
        'name'    => $name,
        'id'      => $id,
        'entries' => $csv,
    ];

    file_put_contents("$filename.json", json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

foreach ($dictionaries as $filename => $dictionary) {
    convertCSV($filename, $dictionary['name'], $dictionary['id']);
}

exit();
