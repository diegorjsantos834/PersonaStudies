<?php
// geo.php - autocomplete de cidades (Geo API do OpenWeather).
// O JS manda o que a pessoa digitou (q) e a gente devolve até 5 sugestões.

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

// aqui não é erro, é só busca vazia: devolve lista vazia e pronto
if (!isset($_GET['q']) || trim($_GET['q']) === '') {
    echo json_encode([]);
    exit;
}

$q = trim($_GET['q']);
$apiKey = "51f001c6723ac948e0ca9ef5e745afa3";

// limit=5 segura o tamanho da lista de sugestões
$url = "https://api.openweathermap.org/geo/1.0/direct?q=" . urlencode($q) . "&limit=5&appid=" . $apiKey;

$resposta = false;

if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    $resposta = curl_exec($ch);
    curl_close($ch);
}

// fallback caso o cURL esteja desligado
if ($resposta === false && function_exists('file_get_contents') && ini_get('allow_url_fopen')) {
    $resposta = @file_get_contents($url);
}

// em qualquer erro devolve lista vazia pra não quebrar o autocomplete
if ($resposta === false) {
    echo json_encode([]);
    exit;
}

$dados = json_decode($resposta, true);

if ($dados === null) {
    echo json_encode([]);
    exit;
}

echo json_encode($dados, JSON_UNESCAPED_UNICODE);
