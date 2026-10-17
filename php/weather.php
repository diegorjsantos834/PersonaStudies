<?php
// ============================================================
// weather.php - PHP consulta a API pública do OpenWeatherMap
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
// Define que o conteúdo retornado será JSON com codificação UTF-8
header("Content-Type: application/json; charset=utf-8");

// Permite que o JavaScript acesse este arquivo mesmo estando em
// origens diferentes (necessário para o fetch funcionar no XAMPP)
header("Access-Control-Allow-Origin: *");

// ============================================================
// BLOCO 2: Validação do parâmetro recebido via GET
// ============================================================
// Verifica se o parâmetro 'city' foi enviado na URL
// Se não existir ou estiver vazio, retorna erro 400 em JSON
if (!isset($_GET['city']) || trim($_GET['city']) === '') {
    http_response_code(400);
    echo json_encode(["error" => "Cidade não informada"]);
    exit;
}

// Limpa o valor recebido (remove espaços sobrando)
$city = trim($_GET['city']);

// Chave de acesso à API pública do OpenWeatherMap
$apiKey = "51f001c6723ac948e0ca9ef5e745afa3";

// Monta a URL completa da API com cidade, chave e unidades métricas
$url = "https://api.openweathermap.org/data/2.5/weather?q=" . urlencode($city) . "&appid=" . $apiKey . "&units=metric&lang=pt_br";

// ============================================================
// BLOCO 3: Requisição HTTP para a API pública (via cURL)
// ============================================================
// Inicializa uma sessão cURL para acessar a URL da API
$resposta = false;

if (function_exists('curl_init')) {
    // Cria o recurso cURL com a URL montada
    $ch = curl_init($url);

    // Retorna o resultado como string em vez de imprimir na tela
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    // Ignora verificação de certificado SSL (útil em localhost/XAMPP)
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    // Define tempo máximo de 10 segundos para a requisição
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    // Executa a requisição HTTP e armazena o resultado
    $resposta = curl_exec($ch);

    // Encerra a sessão cURL
    curl_close($ch);
}

// ============================================================
// BLOCO 4: Fallback com file_get_contents (se cURL não estiver ativo)
// ============================================================
// Se o cURL falhou e o PHP permite abrir URLs via file_get_contents
if ($resposta === false && function_exists('file_get_contents') && ini_get('allow_url_fopen')) {
    // Faz a requisição HTTP diretamente pelo PHP
    $resposta = @file_get_contents($url);
}

// ============================================================
// BLOCO 5: Tratamento de erro de conexão
// ============================================================
// Se mesmo assim não conseguiu obter resposta da API
if ($resposta === false) {
    http_response_code(500);
    echo json_encode(["error" => "Erro ao consultar a API pública"]);
    exit;
}

// ============================================================
// BLOCO 6: Decodificação do JSON recebido da API
// ============================================================
// Transforma o texto JSON em um array associativo do PHP
$dados = json_decode($resposta, true);

// Se o json_decode não conseguiu interpretar, retorna erro
if ($dados === null) {
    http_response_code(500);
    echo json_encode(["error" => "Resposta inválida da API"]);
    exit;
}

// ============================================================
// BLOCO 7: Retorno do JSON processado para o JavaScript
// ============================================================
// Envia o array de volta como texto JSON com suporte a caracteres especiais
echo json_encode($dados, JSON_UNESCAPED_UNICODE);
