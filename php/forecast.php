<?php
// ============================================================
// forecast.php - PHP consulta a API pública do OpenWeatherMap
// ============================================================
// Arquivo PHP responsável por:
// 1. Receber o nome da cidade via GET
// 2. Fazer a requisição HTTP (cURL ou file_get_contents) para a API pública
// 3. Decodificar o JSON retornado com json_decode()
// 4. Enviar o JSON processado de volta para o JavaScript com json_encode()
//
// Fluxo: JS (widgets.js) -> este PHP -> API OpenWeatherMap -> JSON -> JS
// ============================================================

// ============================================================
// BLOCO 1: Cabeçalhos HTTP
// ============================================================
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

// ============================================================
// BLOCO 2: Validação do parâmetro cidade via GET
// ============================================================
if (!isset($_GET['city']) || trim($_GET['city']) === '') {
    http_response_code(400);
    echo json_encode(["error" => "Cidade não informada"]);
    exit;
}

$city = trim($_GET['city']);
$apiKey = "51f001c6723ac948e0ca9ef5e745afa3";

// URL da API de previsão de 5 dias (dados a cada 3 horas)
$url = "https://api.openweathermap.org/data/2.5/forecast?q=" . urlencode($city) . "&appid=" . $apiKey . "&units=metric&lang=pt_br";

// ============================================================
// BLOCO 3: Requisição HTTP para a API pública (cURL)
// ============================================================
$resposta = false;

if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $resposta = curl_exec($ch);
    curl_close($ch);
}

// ============================================================
// BLOCO 4: Fallback com file_get_contents
// ============================================================
if ($resposta === false && function_exists('file_get_contents') && ini_get('allow_url_fopen')) {
    $resposta = @file_get_contents($url);
}

// ============================================================
// BLOCO 5: Tratamento de erro de conexão
// ============================================================
if ($resposta === false) {
    http_response_code(500);
    echo json_encode(["error" => "Erro ao consultar a API pública"]);
    exit;
}

// ============================================================
// BLOCO 6: Decodificação do JSON recebido
// ============================================================
$dados = json_decode($resposta, true);

if ($dados === null) {
    http_response_code(500);
    echo json_encode(["error" => "Resposta inválida da API"]);
    exit;
}

// ============================================================
// BLOCO 7: Retorno do JSON para o JavaScript
// ============================================================
echo json_encode($dados, JSON_UNESCAPED_UNICODE);
