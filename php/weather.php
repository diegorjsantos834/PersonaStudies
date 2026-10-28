<?php
// weather.php - puxa o clima atual no OpenWeatherMap.
// O JS manda a cidade por GET, a gente consulta a API e devolve o JSON
// direto pro front (é o mesmo JSON da API, só repassando).

header("Content-Type: application/json; charset=utf-8");

// libera o fetch de outras origens (necessário no XAMPP)
header("Access-Control-Allow-Origin: *");

// sem cidade na URL, não tem o que consultar
if (!isset($_GET['city']) || trim($_GET['city']) === '') {
    http_response_code(400);
    echo json_encode(["error" => "Cidade não informada"]);
    exit;
}

$city = trim($_GET['city']);
$apiKey = "51f001c6723ac948e0ca9ef5e745afa3";

// units=metric dá graus Celsius; lang=pt_br traduz a descrição
$url = "https://api.openweathermap.org/data/2.5/weather?q=" . urlencode($city) . "&appid=" . $apiKey . "&units=metric&lang=pt_br";

$resposta = false;

// tenta primeiro com cURL
if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    //SSL com hostname errado é comum em localhost, então não valida
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $resposta = curl_exec($ch);
    curl_close($ch);
}

// se cURL não estiver disponível, cai no file_get_contents
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

// JSON_UNESCAPED_UNICODE deixa os acentos legíveis
echo json_encode($dados, JSON_UNESCAPED_UNICODE);
