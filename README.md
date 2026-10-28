# PersonaStudies

Interface web com temas visuais de **Persona 5** e **Persona 3 Reload**, desenvolvida como projeto acadêmico para a disciplina de **PW2** (Programação Web 2).

O projeto realiza requisições HTTP para a API do OpenWeatherMap, recebe dados em formato JSON, processa-os via **PHP** e apresenta dinamicamente ao usuário.

---

## Objetivo do Projeto

Atender aos requisitos obrigatórios:

- [x] Página inicial com título do sistema
- [x] Formulário com campo de pesquisa
- [x] Botão de consulta
- [x] Área para apresentação dos resultados
- [x] **PHP** realiza requisição HTTP para a API do OpenWeatherMap
- [x] Recebe dados no formato **JSON**
- [x] Interpreta o JSON com `json_decode()`
- [x] Apresenta os dados dinamicamente ao usuário

---

## Tecnologias Utilizadas

| Tecnologia | Finalidade |
|------------|------------|
| HTML5 / CSS3 | Estrutura e visual da interface |
| JavaScript (Vanilla JS) | Lógica interativa, fetch, temas, parallax, canvas |
| PHP | Requisição HTTP para a API do OpenWeatherMap (cURL / file_get_contents) |
| API OpenWeatherMap | Fonte dos dados (clima atual, previsão, autocomplete) |
| JSON | Formato de troca de dados entre PHP e JavaScript |

---

## Estrutura de Pastas

```
PersonaStudies/
├── index.html                  → Página principal (interface)
├── main.css                    → Estilos base + tema P5
├── README.md                   → Este arquivo
│
├── css/
│   ├── p5_calendar.css         → Estilos do calendário P5 (sprites)
│   └── persona3.css            → Estilos do tema P3 Reload
│
├── js/
│   ├── widgets.js              → Lógica principal (relógio, clima, abas, timer, player)
│   ├── p5calendar.js           → Calendário P5 por sprites
│   ├── persona3.js             → Relógio, data e fase da lua P3
│   ├── sound-canvas.js         → Visualizador de áudio (canvas)
│   └── transitions.js          → Transição animada entre temas
│
├── php/                        → PHP consulta a API do OpenWeatherMap
│   ├── weather.php             → Clima atual (OpenWeatherMap)
│   ├── forecast.php            → Previsão semanal (OpenWeatherMap)
│   └── geo.php                 → Autocomplete de cidades (OpenWeatherMap)
│
├── json/
│   └── openweathermap.json     → Exemplo de JSON retornado pela API
│
└── assets/
    ├── audio/                  → Músicas locais (player)
    ├── images/
    │   ├── characters/         → Joker (P5) e Makoto (P3)
    │   ├── logos/              → Logos dos temas
    │   ├── p5/                 → Sprites do calendário P5
    │   └── wallpapers/         → Wallpapers por tema
    └── transition/             → Vídeos de transição entre temas
```

---

## Como Funciona (Fluxo de Dados)

```
┌─────────────────┐      GET       ┌──────────────────┐      GET       ┌──────────────────┐
│  JavaScript     │ ─────────────→ │  PHP             │ ─────────────→ │  OpenWeatherMap  │
│  (widgets.js)   │                │  (php/*.php)     │                │  (OpenWeatherMap)│
│                 │ ←───────────── │                  │ ←───────────── │                  │
│  Exibe na tela  │   JSON         │  json_decode()   │   JSON         │  Retorna dados  │
└─────────────────┘                └──────────────────┘                └──────────────────┘
```

### Passo a passo:

1. **Usuário** digita uma cidade no campo de busca
2. **JavaScript** (`js/widgets.js`) chama `php/weather.php?city=...`
3. **PHP** faz requisição HTTP (cURL) para a API do OpenWeatherMap
4. **API** retorna os dados em JSON
5. **PHP** interpreta o JSON com `json_decode()` e devolve com `json_encode()`
6. **JavaScript** recebe o JSON e exibe os dados dinamicamente na interface

---

## Como Executar no XAMPP

### Passo 1 — Instalar o XAMPP
Baixe e instale o XAMPP em: https://www.apachefriends.org/

### Passo 2 — Colocar a pasta no htdocs
Copie a pasta `PersonaStudies` para dentro do diretório `htdocs` do XAMPP:

```
C:\xampp\htdocs\PersonaStudies\
```

### Passo 3 — Ligar o Apache
Abra o painel do XAMPP e clique em **Start** no módulo **Apache**.

### Passo 4 — Acessar no navegador
```
http://localhost/PersonaStudies/index.html
```

### Passo 5 — Desativar bloqueador de anúncios
O **AdBlock / uBlock Origin** pode bloquear o autocomplete (`ERR_BLOCKED_BY_CLIENT`). Desative-o para testar.

---

## Testando o PHP

Acesse diretamente no navegador para verificar se o PHP está funcionando:

| URL | O que retorna |
|-----|---------------|
| `http://localhost/PersonaStudies/php/weather.php?city=Sao Paulo` | JSON com clima atual |
| `http://localhost/PersonaStudies/php/forecast.php?city=Rio de Janeiro` | JSON com previsão semanal |
| `http://localhost/PersonaStudies/php/geo.php?q=Sao` | JSON com sugestões de cidades |

Se retornar JSON, o PHP está consultando a API do OpenWeatherMap corretamente.

---

## Requisitos Atendidos

| Requisito | Status | Onde está implementado |
|-----------|--------|------------------------|
| Página inicial com título | OK | `index.html` — tag `<title>` e cabeçalhos visuais |
| Formulário com campo de pesquisa | OK | `index.html` — `#weather-search-form` + `#city-input` |
| Botão de consulta | OK | `index.html` — botão "Buscar" no formulário |
| Área para resultados | OK | `index.html` — `#temp-val`, `#humidity-val`, `#condition-val`, `#weekly-forecast-list` |
| PHP consulta a API do OpenWeatherMap | OK | `php/weather.php`, `php/forecast.php`, `php/geo.php` |
| Recebe JSON | OK | PHP recebe resposta da API |
| Interpreta JSON | OK | `json_decode()` nos arquivos PHP |
| Apresenta dinamicamente | OK | JavaScript exibe os dados na interface |

---

## Observações

- **Tema P5**: vermelho/preto, calendário por sprites, Joker
- **Tema P3**: azul, relógio com lua, Makoto
- **Transição**: vídeo animada entre os temas (canvas + chroma-key)
- **Parallax**: wallpaper em 5 camadas com movimento 3D sutil
- **Player**: músicas locais com controles de play/pause/volume
- **Timer**: Pomodoro com display e controles

---

## Autor

Desenvolvido para a disciplina **PW2 — Programação Web 2**.
