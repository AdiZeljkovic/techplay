<?php

$apiKey = 'AIzaSyDzY3neFVRKnMmUscc-sJYrcV0xYVn79ps';
$url = "https://generativelanguage.googleapis.com/v1/models?key={$apiKey}";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response:\n";

$data = json_decode($response, true);
if (isset($data['models'])) {
    echo "\nDostupni modeli:\n";
    echo str_repeat('=', 80) . "\n";

    foreach ($data['models'] as $model) {
        $name = $model['name'] ?? 'N/A';
        $displayName = $model['displayName'] ?? 'N/A';
        $description = $model['description'] ?? 'N/A';
        $supportedMethods = isset($model['supportedGenerationMethods'])
            ? implode(', ', $model['supportedGenerationMethods'])
            : 'N/A';

        echo "\nModel: $name\n";
        echo "Display Name: $displayName\n";
        echo "Description: $description\n";
        echo "Supported Methods: $supportedMethods\n";
        echo str_repeat('-', 80) . "\n";
    }
} else {
    echo $response . "\n";
}
