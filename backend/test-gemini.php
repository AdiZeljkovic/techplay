<?php

$apiKey = 'AIzaSyDzY3neFVRKnMmUscc-sJYrcV0xYVn79ps';
$model = 'gemini-2.5-flash';
$url = "https://generativelanguage.googleapis.com/v1/models/{$model}:generateContent?key={$apiKey}";

$payload = [
    'contents' => [
        [
            'parts' => [
                ['text' => 'Test: Analyze this WoW character. Return JSON with {score: 75, advice: ["Tip 1"], missing: ["Thing 1"]}']
            ]
        ]
    ],
    'generationConfig' => [
        'temperature' => 0.7,
        'maxOutputTokens' => 800,
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response:\n";
echo $response . "\n";

if ($httpCode === 200) {
    echo "\n✅ SUCCESS! Gemini API radi!\n";
    $data = json_decode($response, true);
    if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
        echo "\nGenerated text:\n";
        echo $data['candidates'][0]['content']['parts'][0]['text'] . "\n";
    }
} else {
    echo "\n❌ GREŠKA!\n";
}
