<?php
// forecast.php - puxa a previsão de 5 dias no OpenWeatherMap.
// Mesma ideia do weather.php: JS manda a cidade, a gente devolve o JSON da API.

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

if (!isset($_GET['city']) || trim($_GET['city']) === '') {
    http_response_code(400);
    echo json_encode(["error" => "Cidade não informada"]);
    exit;
}

$city = trim($_GET['city']);
$apiKey = "51f001c6723ac948e0ca9ef5e745afa3";

// a forecast API devolve blocos a cada 3h por 5 dias
$url = "https://api.openweathermap.org/data/2.5/forecast?q=" . urlencode($city) . "&appid=" . $apiKey . "&units=metric&lang=pt_br";

$resposta = false;

if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $resposta = curl_exec($ch);
    curl_close($ch);
}

// fallback caso o cURL esteja desligado
if ($resposta === false && function_exists('file_get_contents') && ini_get('allow_url_fopen')) {
    $resposta = @file_get_contents($url);
}

if ($resposta === false) {
    http_response_code(500);
    echo json_encode(["error" => "Erro ao consultar a API do OpenWeather"]);
    exit;
}

$dados = json_decode($resposta, true);

if ($dados === null) {
    http_response_code(500);
    echo json_encode(["error" => "Resposta inválida da API"]);
    exit;
}

echo json_encode($dados, JSON_UNESCAPED_UNICODE);
