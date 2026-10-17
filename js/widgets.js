// ======================================
// WIDGETS.JS - Lógica compartilhada do Persona HUD (todos os temas)
// --------------------------------------
// Arquivo responsável por:
// - Relógio digital (HH:MM:SS do topo)
// - Seletor de temas (Persona 3/5) + tema salvo no localStorage
// - Parallax 3D nas camadas do wallpaper (intensidade por camada)
// - Abas do card central (Geral / Semanal)
// - Timer / Cronômetro (Pomodoro)
// - Clima e previsão (OpenWeatherMap: atual + forecast + autocomplete)
// - Music Player local (play/pause/faixas/volume, em assets/audio)
// O visual de cada tema mora no CSS: main.css (base), css/p5_calendar.css,
// css/persona3.css. Datas por sprite: js/p5calendar.js (P5) e js/persona3.js (P3).
// ======================================

// =====================================================
// 1. VARIÁVEIS GLOBAIS E CONFIGURAÇÕES INICIAIS
// =====================================================

/**
 * Chave da API OpenWeatherMap
 * Obtida em: https://openweathermap.org/api
 * 
 */
const OWM_API_KEY = "51f001c6723ac948e0ca9ef5e745afa3";

/**
 * Cidade padrão carregada ao iniciar a página
 * Exibe o clima desta cidade na primeira renderização
 */
const DEFAULT_CITY = "São Paulo";

/**
 * Duração padrão do timer em milissegundos
 * Padrão: 25 minutos (Pomodoro)
 */
const DEFAULT_TIMER_DURATION_MS = 25 * 60 * 1000; // 25 * 60 * 1000 = 1.500.000ms

// =====================================================
// 2. RELÓGIO DIGITAL
// =====================================================

/**
 * Elemento HTML responsável por exibir o relógio digital
 * Localizado em: #digital-clock (index.html - linha ~77)
 */
const digitalClockEl = document.getElementById("digital-clock");

/**
 * Função responsável por atualizar o relógio digital
 * Formata a data atual para HH:MM:SS
 * Atualiza o elemento #digital-clock a cada segundo
 */
function updateDigitalClock() {
    // Verifica se o elemento existe na página
    if (!digitalClockEl) {
        console.warn("[RELÓGIO] Elemento #digital-clock não encontrado");
        return;
    }

    // Cria um novo objeto Date com a data/hora atual
    const now = new Date();

    // Obtém as horas, minutos e segundos
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    // Formata com dois dígitos (ex.: 09:05:03)
    hours = hours.toString().padStart(2, "0");
    minutes = minutes.toString().padStart(2, "0");
    seconds = seconds.toString().padStart(2, "0");

    // Atualiza o conteúdo do elemento HTML
    digitalClockEl.textContent = hours + ":" + minutes + ":" + seconds;
}

// Inicializa o relógio digital
// Atualiza imediatamente ao carregar e a cada 1000ms
updateDigitalClock();
setInterval(updateDigitalClock, 1000);

// =====================================================
// 3. SELETOR DE TEMAS (PERSONA 3 / 5)
// Temas disponíveis: p3 (Reload, azul) e p5 (Royal, vermelho/preto)
// O tema P4 foi removido do projeto.
// =====================================================

/**
 * Elemento body do documento
 * Usado para alternar classes de tema (theme-p3, theme-p5)
 */
const bodyEl = document.body;

/**
 * Função responsável por trocar o tema visual da interface
 * @param {string} themeName - Nome do tema: "p3" ou "p5"
 *
 * Comportamento:
 * - Remove todas as classes de tema existentes no body
 * - Adiciona a classe correspondente ao tema escolhido (theme-p3 ou theme-p5)
 * - Armazena a escolha no localStorage para manter o tema ao recarregar a página
 * OBS: a transição animada entre temas mora em js/transitions.js,
 * que intercepta esta função e troca a classe no meio do vídeo.
 */
function switchTheme(themeName) {
    // Verifica se o elemento body existe
    if (!bodyEl) {
        console.warn("[TEMA] Elemento body não encontrado");
        return;
    }

    // Remove todas as classes relacionadas a temas
    bodyEl.classList.remove("theme-p3", "theme-p5");

    // Adiciona a classe do tema selecionado
    bodyEl.classList.add(`theme-${themeName}`);

    // Salva a escolha do tema no localStorage
    // Permite manter o tema após recarregar a página
    try {
        localStorage.setItem("persona-theme", themeName);
        console.log(`[TEMA] Tema alterado para: ${themeName.toUpperCase()}`);
    } catch (error) {
        // Caso localStorage não esteja disponível (modo privado, etc)
        console.warn("[TEMA] Não foi possível salvar o tema no localStorage:", error);
    }
}

/**
 * Função responsável por carregar o tema salvo anteriormente
 * Executada automaticamente ao carregar a página
 * Prioriza o tema salvo no localStorage, caso não exista mantém o tema padrão
 */
function loadSavedTheme() {
    // Verifica se o elemento body existe
    if (!bodyEl) {
        console.warn("[TEMA] Elemento body não encontrado");
        return;
    }

    try {
        // Busca o tema salvo no localStorage
        const savedTheme = localStorage.getItem("persona-theme");

        // Verifica se existe um tema salvo e se é válido (p3 ou p5)
        // Quem tinha "p4" salvo cai no tema padrão (theme-p5 do HTML)
        if (savedTheme === "p3" || savedTheme === "p5") {
            // Aplica o tema salvo
            bodyEl.classList.remove("theme-p3", "theme-p5");
            bodyEl.classList.add(`theme-${savedTheme}`);
            console.log(`[TEMA] Tema carregado do localStorage: ${savedTheme.toUpperCase()}`);
        } else {
            // Caso não exista tema salvo, mantém o tema padrão (atual)
            console.log("[TEMA] Nenhum tema salvo encontrado. Mantendo tema padrão.");
        }
    } catch (error) {
        // Caso localStorage não esteja disponível
        console.warn("[TEMA] Não foi possível carregar o tema do localStorage:", error);
    }
}

// Carrega o tema salvo ao inicializar a página
loadSavedTheme();

// Expõe a função switchTheme globalmente
// Necessário pois os botões no HTML chamam: onclick="switchTheme('p5')"
window.switchTheme = switchTheme;

// =====================================================
// 4. PARALLAX 3D NAS CAMADAS DO WALLPAPER
// =====================================================

/**
 * Elemento desktop que contém todas as camadas
 * Localizado em: .desktop (index.html - linha ~15)
 */
const desktopEl = document.querySelector(".desktop");

/**
 * Lista com todas as camadas de wallpaper
 * Ordem definida no HTML:
 * - layer_base_bg (z-index: 0)
 * - layer_animated_scenery (z-index: 1)
 * - layer_canva_sounds (z-index: 2)
 * - layer_static_scenery (z-index: 3)
 * - layer_characters (z-index: 4)
 */
const parallaxLayers = document.querySelectorAll(".wallpaper_layers_containers section");

/**
 * Intensidade do efeito parallax para cada camada
 * Valores negativos/positivos definem a direção do movimento
 * Valores maiores = movimento mais intenso (mais afastado)
 * Valores menores = movimento mais sutil (mais próximo)
 */
const parallaxIntensity = {
    layer_base_bg: 3,          // Camada mais profunda (fundo) - movimento suave
    layer_animated_scenery: 3,  // Cenário animado (baixo p/ não expor bordas no pan)
    layer_canva_sounds: 8,     // Canvas de sons/partículas
    layer_static_scenery: -4,   // Cenário estático (quase fixo p/ não mostrar o fundo)
    layer_characters: -10      // Personagem acompanha de leve (sem mostrar as bordas)
};

/**
 * Função responsável por aplicar o efeito parallax 3D
 * Baseado na posição do mouse em relação ao centro da tela
 * @param {MouseEvent} event - Evento de movimento do mouse
 */
function applyParallax(event) {
    // Verifica se o elemento desktop existe
    if (!desktopEl) {
        return;
    }

    // Obtém as dimensões da área desktop
    const rect = desktopEl.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calcula a posição do mouse relativa ao centro
    // Valores entre -1 e 1 (normalizados)
    const mouseX = (event.clientX - centerX) / centerX;
    const mouseY = (event.clientY - centerY) / centerY;

    // Aplica o efeito para cada camada
    parallaxLayers.forEach((layer) => {
        // Obtém o nome da classe da camada
        const classList = layer.className;

        // Identifica qual camada é com base na classe
        let intensity = 0;

        if (classList.includes("layer_base_bg")) {
            intensity = parallaxIntensity.layer_base_bg;
        } else if (classList.includes("layer_animated_scenery")) {
            intensity = parallaxIntensity.layer_animated_scenery;
        } else if (classList.includes("layer_canva_sounds")) {
            intensity = parallaxIntensity.layer_canva_sounds;
        } else if (classList.includes("layer_static_scenery")) {
            intensity = parallaxIntensity.layer_static_scenery;
        } else if (classList.includes("layer_characters")) {
            intensity = parallaxIntensity.layer_characters;
        }

        // Calcula o deslocamento em pixels
        // Multiplica pelo fator de intensidade
        const translateX = mouseX * intensity;
        const translateY = mouseY * intensity;

        // Aplica a transformação 3D para melhor performance
        // translate3d ativa aceleração por hardware
        layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    });
}

/**
 * Função responsável por resetar as camadas à posição original
 * Chamado quando o mouse sai da área desktop
 */
function resetParallax() {
    // Reseta a transformação de todas as camadas
    parallaxLayers.forEach((layer) => {
        layer.style.transform = "translate3d(0, 0, 0)";
    });
}

// Adiciona os event listeners para o efeito parallax
if (desktopEl) {
    // Aplica parallax ao mover o mouse
    desktopEl.addEventListener("mousemove", applyParallax);
    
    // Reseta ao sair da área desktop
    desktopEl.addEventListener("mouseleave", resetParallax);
    
    console.log("[PARALLAX] Efeito parallax 3D ativado");
} else {
    console.warn("[PARALLAX] Elemento .desktop não encontrado");
}

// =====================================================
// 5. ABAS (GERAL / SEMANAL / MENSAL)
// =====================================================

/**
 * Botões de abas localizados no card de informações
 * Localizados em: .tab-btn (index.html - linhas ~127-129)
 */
const tabButtons = document.querySelectorAll(".tab-btn");

/**
 * Painéis de conteúdo das abas
 * Localizados em: .tab-pane (index.html - linhas ~134, 140, 144)
 */
const tabPanes = document.querySelectorAll(".tab-pane");

/**
 * Função responsável por alternar entre as abas
 * @param {string} tabName - Nome da aba: "general" ou "weekly"
 */
function switchTab(tabName) {
    // 1. Atualiza o estado dos botões (.tab-btn)
    tabButtons.forEach((button) => {
        // Remove a classe 'active' de todos os botões
        button.classList.remove("active");
        
        // Adiciona a classe 'active' apenas ao botão clicado
        if (button.dataset.tab === tabName) {
            button.classList.add("active");
        }
    });

    // 2. Atualiza o estado dos painéis (.tab-pane)
    tabPanes.forEach((pane) => {
        // Esconde todos os painéis adicionando a classe 'hidden'
        pane.classList.add("hidden");
        
        // Remove a classe 'hidden' apenas do painel correspondente
        const paneId = "tab-" + tabName;
        if (pane.id === paneId) {
            pane.classList.remove("hidden");
        }
    });

    console.log(`[ABAS] Aba alterada para: ${tabName}`);
}

// Adiciona event listeners para cada botão de aba
tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        // Obtém o nome da aba através do atributo data-tab
        const tabName = button.dataset.tab;
        
        // Chama a função para alternar a aba
        if (tabName) {
            switchTab(tabName);
        }
    });
});

console.log("[ABAS] Sistema de abas inicializado");

// =====================================================
// 6. TIMER / CRONÔMETRO
// =====================================================

/**
 * Estado do timer
 */
let timerRemainingMs = DEFAULT_TIMER_DURATION_MS; // Tempo restante em milissegundos
let timerDurationMs = DEFAULT_TIMER_DURATION_MS;  // Duração total configurada
let timerIntervalId = null;                      // ID do setInterval (null quando parado)
let isTimerRunning = false;                      // Status: true = rodando, false = parado

/**
 * Elementos HTML do timer
 * Localizados em: index.html - linhas ~107-111
 */
const timerDisplayEl = document.getElementById("timer-display");
const btnStartTimerEl = document.getElementById("btn-start-timer");
const btnResetTimerEl = document.getElementById("btn-reset-timer");

/**
 * Função responsável por formatar milissegundos para o formato MM:SS
 * @param {number} ms - Milissegundos a serem formatados
 * @returns {string} String formatada no formato "MM:SS"
 */
function formatTimer(ms) {
    // Garante que o valor não seja negativo
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    
    // Calcula minutos e segundos
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    // Formata com dois dígitos
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");
    
    return formattedMinutes + ":" + formattedSeconds;
}

/**
 * Função responsável por renderizar o display do timer
 * Atualiza o elemento #timer-display com o tempo formatado
 */
function renderTimer() {
    if (!timerDisplayEl) {
        console.warn("[TIMER] Elemento #timer-display não encontrado");
        return;
    }
    
    timerDisplayEl.textContent = formatTimer(timerRemainingMs);
}

/**
 * Função responsável por iniciar o timer
 * Cria um intervalo que decrementa 1 segundo a cada 1000ms
 */
function startTimer() {
    // Impede múltiplos intervalos
    if (timerIntervalId !== null) {
        return;
    }
    
    // Marca como rodando
    isTimerRunning = true;
    
    // Atualiza o texto do botão
    if (btnStartTimerEl) {
        btnStartTimerEl.textContent = "PAUSE";
    }
    
    // Cria o intervalo para decrementar o timer
    timerIntervalId = setInterval(() => {
        // Decrementa 1000ms
        timerRemainingMs -= 1000;
        
        // Verifica se o timer chegou a zero
        if (timerRemainingMs <= 0) {
            timerRemainingMs = 0;
            // Renderiza o estado final
            renderTimer();
            // Para o intervalo
            clearInterval(timerIntervalId);
            timerIntervalId = null;
            isTimerRunning = false;
            // Atualiza o botão
            if (btnStartTimerEl) {
                btnStartTimerEl.textContent = "START";
            }
            // Notifica o usuário
            console.log("[TIMER] Tempo finalizado!");
            // Opcional: pode adicionar um som de alarme aqui
            return;
        }
        
        // Renderiza a cada segundo
        renderTimer();
    }, 1000);
    
    console.log("[TIMER] Timer iniciado");
}

/**
 * Função responsável por pausar o timer
 * Limpa o intervalo sem alterar o tempo restante
 */
function pauseTimer() {
    // Verifica se existe um intervalo ativo
    if (timerIntervalId !== null) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
    
    // Marca como parado
    isTimerRunning = false;
    
    // Atualiza o texto do botão
    if (btnStartTimerEl) {
        btnStartTimerEl.textContent = "START";
    }
    
    console.log("[TIMER] Timer pausado");
}

/**
 * Função responsável por resetar o timer
 * Para o timer e retorna ao tempo inicial
 */
function resetTimer() {
    // Para o timer
    pauseTimer();
    
    // Retorna ao tempo configurado
    timerRemainingMs = timerDurationMs;
    
    // Renderiza novamente
    renderTimer();
    
    console.log("[TIMER] Timer resetado");
}

// Adiciona event listeners para os botões do timer
if (btnStartTimerEl) {
    btnStartTimerEl.addEventListener("click", () => {
        if (isTimerRunning) {
            // Se está rodando, pausa
            pauseTimer();
        } else {
            // Se está parado, inicia
            startTimer();
        }
    });
    console.log("[TIMER] Botão START/PAUSE vinculado");
}

if (btnResetTimerEl) {
    btnResetTimerEl.addEventListener("click", () => {
        resetTimer();
    });
    console.log("[TIMER] Botão RESET vinculado");
}

// Renderiza o timer na inicialização
renderTimer();
console.log("[TIMER] Timer inicializado");

// =====================================================
// 7. CLIMA E PREVISÃO DO TEMPO (OPENWEATHERMAP)
// =====================================================

/**
 * Elementos HTML relacionados ao clima - Topo
 * A data/semana do P5 é renderizada por sprites (js/p5calendar.js) e a do
 * P3 por texto (js/persona3.js); aqui ficam só temperatura e cidade.
 */
const hudTempValEl = document.getElementById("hud-temp-val");
const currentCityNameEl = document.getElementById("current-city-name");

// Elementos HTML relacionados ao clima - Aba Geral
// Localizados em: index.html - linhas ~135-137
const tempValEl = document.getElementById("temp-val");
const humidityValEl = document.getElementById("humidity-val");
const conditionValEl = document.getElementById("condition-val");

// Elementos HTML relacionados ao formulário de busca
// Localizados em: index.html - linhas ~119-122
const weatherSearchFormEl = document.getElementById("weather-search-form");
const cityInputEl = document.getElementById("city-input");

// Elementos HTML relacionados à previsão semanal
// Localizado em: index.html - aba "Semanal"
const weeklyForecastListEl = document.getElementById("weekly-forecast-list");

/**
 * Função responsável por obter o clima atual de uma cidade
 * @param {string} city - Nome da cidade a ser pesquisada
 * @returns {Promise<Object>} Dados do clima atual
 */
async function fetchCurrentWeather(city) {
    // Verifica se a chave da API foi configurada
    if (OWM_API_KEY === "COLOQUE_SUA_CHAVE_AQUI") {
        console.warn("[CLIMA] Chave da API OpenWeather não configurada");
        alert("Por favor, configure a chave da API OpenWeatherMap em js/widgets.js");
        throw new Error("API key não configurada");
    }

    // Constrói a URL do arquivo PHP que consulta a API pública
    const url = `php/weather.php?city=${encodeURIComponent(city)}`;

    // Realiza a requisição
    const response = await fetch(url);
    
    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Cidade não encontrada");
        } else if (response.status === 401) {
            throw new Error("Chave da API inválida");
        } else {
            throw new Error(`Erro ao buscar clima: ${response.status}`);
        }
    }
    
    // Retorna os dados em formato JSON
    const data = await response.json();
    return data;
}

/**
 * Função responsável por obter a previsão de 5 dias
 * @param {string} city - Nome da cidade a ser pesquisada
 * @returns {Promise<Object>} Dados da previsão
 */
async function fetchForecast(city) {
    // Verifica se a chave da API foi configurada
    if (OWM_API_KEY === "COLOQUE_SUA_CHAVE_AQUI") {
        throw new Error("API key não configurada");
    }

    // Constrói a URL do arquivo PHP que consulta a API pública (forecast)
    const url = `php/forecast.php?city=${encodeURIComponent(city)}`;

    // Realiza a requisição
    const response = await fetch(url);
    
    // Verifica se a resposta foi bem-sucedida
    if (!response.ok) {
        throw new Error(`Erro ao buscar previsão: ${response.status}`);
    }
    
    // Retorna os dados em formato JSON
    const data = await response.json();
    return data;
}

/**
 * Função responsável por preencher a aba Semanal com dados do forecast
 * @param {Object} forecastData - Dados retornados pela API forecast
 */
function populateWeeklyForecast(forecastData) {
    if (!weeklyForecastListEl) {
        return;
    }

    // Limpa o conteúdo anterior
    weeklyForecastListEl.innerHTML = "";

    // O forecast retorna previsões a cada 3 horas
    // Agrupamos por dia: pegamos a previsão das 12:00 (meio-dia) para representar o dia
    const dailyForecasts = [];
    const seenDates = new Set();
    
    forecastData.list.forEach((item) => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
        
        // Pega o primeiro registro de cada dia (ou próximo do meio-dia)
        if (!seenDates.has(dateStr) && seenDates.size < 5) {
            seenDates.add(dateStr);
            dailyForecasts.push({
                dateStr: dateStr,
                tempMin: Math.round(item.main.temp_min),
                tempMax: Math.round(item.main.temp_max),
                icon: item.weather[0].icon,
                desc: item.weather[0].description
            });
        }
    });

    // Cria os elementos HTML para cada dia
    dailyForecasts.forEach((day) => {
        const dayEl = document.createElement("div");
        dayEl.className = "forecast-day";
        dayEl.style.cssText = "display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.9rem; border-bottom: 1px solid rgba(255,255,255,0.3);";
        
        dayEl.innerHTML = `
            <span>${day.dateStr}</span>
            <span>${day.tempMin}° / ${day.tempMax}°</span>
            <span>${day.desc}</span>
        `;
        
        weeklyForecastListEl.appendChild(dayEl);
    });
}

/**
 * Função principal para buscar e exibir o clima
 * @param {string} city - Nome da cidade
 */
async function loadWeather(city) {
    try {
        console.log(`[CLIMA] Buscando clima para: ${city}`);
        
        // Busca clima atual e previsão em paralelo
        const [currentData, forecastData] = await Promise.all([
            fetchCurrentWeather(city),
            fetchForecast(city)
        ]);
        
        // Atualiza elementos do topo esquerdo
        if (hudTempValEl) {
            hudTempValEl.textContent = Math.round(currentData.main.temp) + "°C";
        }

        if (typeof window.animateWeatherSprites === 'function') {
            let c = 0;
            const icon = currentData.weather[0].icon;
            if (icon.startsWith('02') || icon.startsWith('03') || icon.startsWith('04')) c = 1;
            if (icon.startsWith('09') || icon.startsWith('10') || icon.startsWith('11')) c = 2;
            if (icon.startsWith('13')) c = 3;
            try { window.animateWeatherSprites(c); } catch(e) {}
        }
        
        // Atualiza nome da cidade (centro superior)
        if (currentCityNameEl) {
            currentCityNameEl.textContent = currentData.name.toUpperCase();
        }
        
        // Atualiza elementos da aba Geral
        if (tempValEl) {
            tempValEl.textContent = Math.round(currentData.main.temp) + "°C";
        }
        
        if (humidityValEl) {
            humidityValEl.textContent = currentData.main.humidity + "%";
        }
        
        if (conditionValEl) {
            conditionValEl.textContent = currentData.weather[0].description;
        }
        
        // Atualiza abas de previsão
        populateWeeklyForecast(forecastData);
        
        console.log(`[CLIMA] Clima atualizado com sucesso para: ${currentData.name}`);
        
    } catch (error) {
        console.error("[CLIMA] Erro ao carregar clima:", error.message);
        
        // Exibe mensagem de erro ao usuário
        if (error.message === "Cidade não encontrada") {
            alert("Cidade não encontrada. Por favor, verifique o nome e tente novamente.");
        } else if (error.message === "Chave da API inválida") {
            alert("Chave da API OpenWeatherMap inválida. Verifique em js/widgets.js");
        } else if (error.message === "API key não configurada") {
            // Já alertado acima
        } else {
            alert("Erro ao carregar clima. Verifique sua conexão com a internet.");
        }
    }
}

// Adiciona event listener para o formulário de busca
if (weatherSearchFormEl) {
    weatherSearchFormEl.addEventListener("submit", (event) => {
        // Impede o envio padrão do formulário
        event.preventDefault();
        hideCitySuggestions();

        // Obtém o valor digitado
        if (cityInputEl) {
            const city = cityInputEl.value.trim();

            // Verifica se algo foi digitado
            if (city === "") {
                alert("Por favor, digite o nome de uma cidade");
                return;
            }

            // Carrega o clima para a cidade digitada
            loadWeather(city);

            // Limpa o campo de busca
            cityInputEl.value = "";
        }
    });

// Autocomplete: sugere cidades enquanto digita (Geo API OpenWeatherMap)
const citySuggestionsEl = document.getElementById("city-suggestions");
let citySuggestTimer = null;
function hideCitySuggestions() {
    if (citySuggestionsEl) {
        citySuggestionsEl.innerHTML = "";
        citySuggestionsEl.classList.add("hidden");
    }
}
if (cityInputEl && citySuggestionsEl) {
    cityInputEl.addEventListener("input", () => {
        const q = cityInputEl.value.trim();
        if (citySuggestTimer) clearTimeout(citySuggestTimer);
        if (q.length < 3) {
            hideCitySuggestions();
            return;
        }
        citySuggestTimer = setTimeout(async () => {
            try {
                const url = `php/geo.php?q=${encodeURIComponent(q)}`;
                const res = await fetch(url);
                if (!res.ok) return;
                const places = await res.json();
                citySuggestionsEl.innerHTML = "";
                if (!places || places.length === 0) {
                    hideCitySuggestions();
                    return;
                }
                places.forEach((p) => {
                    const label = [p.name, p.state, p.country].filter(Boolean).join(" - ");
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.textContent = label;
                    btn.addEventListener("click", () => {
                        cityInputEl.value = p.name;
                        hideCitySuggestions();
                        loadWeather(p.name);
                        cityInputEl.value = "";
                    });
                    citySuggestionsEl.appendChild(btn);
                });
                citySuggestionsEl.classList.remove("hidden");
            } catch (e) {
                hideCitySuggestions();
            }
        }, 350);
    });
    cityInputEl.addEventListener("blur", () => {
        // Delay para permitir o clique na sugestão
        setTimeout(hideCitySuggestions, 200);
    });
}
    
    console.log("[CLIMA] Formulário de busca vinculado");
}

// Carrega o clima padrão ao inicializar a página
// Só carrega se a chave não estiver vazia
if (OWM_API_KEY !== "COLOQUE_SUA_CHAVE_AQUI") {
    loadWeather(DEFAULT_CITY);
    console.log(`[CLIMA] Clima padrão carregado: ${DEFAULT_CITY}`);
} else {
    console.warn("[CLIMA] Clima padrão não carregado. Configure a chave da API primeiro.");
}

// =====================================================
// 8. MUSIC PLAYER (LOCAL - ARQUIVOS EM assets/audio)
// =====================================================

/**
 * Elementos HTML do music player
 * Localizados em: index.html - linhas ~154-167
 */
const audioPlayerEl = document.getElementById("persona-audio-player");
const trackTitleEl = document.getElementById("track-title");
const btnPrevTrackEl = document.getElementById("prev-track");
const btnPlayPauseTrackEl = document.getElementById("play-pause-track");
const btnNextTrackEl = document.getElementById("next-track");

/**
 * Playlist com as músicas do Persona
 * Adicione seus arquivos MP3 na pasta assets/audio/
 * Certifique-se de que os nomes dos arquivos correspondem aos src abaixo
 */
const playlist = [
    {
        title: "Persona 3 Reload - Its Going Down Now",
        src: "assets/audio/Persona_3_Reload_-_Its_Going_Down_Now_(mp3.pm).mp3"
    }
    // Adicione mais faixas aqui conforme necessário
];

/**
 * Índice atual da faixa na playlist
 */
let currentTrackIndex = 0;

/**
 * Função responsável por carregar uma faixa
 * @param {number} index - Índice da faixa na playlist
 */
function loadTrack(index) {
    // Verifica se a playlist está vazia
    if (playlist.length === 0) {
        console.warn("[MÚSICA] Playlist vazia");
        return;
    }

    // Normaliza o índice (volta ao início/fim quando necessário)
    currentTrackIndex = (index + playlist.length) % playlist.length;
    
    // Obtém a faixa atual
    const track = playlist[currentTrackIndex];
    
    // Verifica se o elemento audio existe
    if (!audioPlayerEl) {
        console.warn("[MÚSICA] Elemento #persona-audio-player não encontrado");
        return;
    }
    
    // Carrega a nova fonte de áudio
    audioPlayerEl.src = track.src;
    
    // Atualiza o título da faixa
    if (trackTitleEl) {
        trackTitleEl.textContent = track.title;
    }
    
    console.log(`[MÚSICA] Faixa carregada: ${track.title}`);
}

/**
 * Função responsável por tocar/pausar a música
 */
function togglePlayPause() {
    // Verifica se o elemento audio existe
    if (!audioPlayerEl) {
        console.warn("[MÚSICA] Elemento audio não encontrado");
        return;
    }
    
    // Verifica se há um src carregado
    if (!audioPlayerEl.src) {
        // Carrega a primeira faixa caso nenhuma esteja carregada
        loadTrack(0);
        // Toca após carregar
        audioPlayerEl.play().catch((error) => {
            console.warn("[MÚSICA] Erro ao reproduzir áudio:", error);
        });
        return;
    }
    
    // Alterna entre play e pause
    if (audioPlayerEl.paused) {
        // Toca a música
        audioPlayerEl.play().catch((error) => {
            console.warn("[MÚSICA] Erro ao reproduzir áudio:", error);
        });
    } else {
        // Pausa a música
        audioPlayerEl.pause();
    }
}

/**
 * Função responsável por ir para a faixa anterior
 */
function playPrevTrack() {
    loadTrack(currentTrackIndex - 1);
    
    // Reproduz automaticamente após carregar
    if (audioPlayerEl) {
        audioPlayerEl.play().catch((error) => {
            console.warn("[MÚSICA] Erro ao reproduzir áudio:", error);
        });
    }
}

/**
 * Função responsável por ir para a próxima faixa
 */
function playNextTrack() {
    loadTrack(currentTrackIndex + 1);
    
    // Reproduz automaticamente após carregar
    if (audioPlayerEl) {
        audioPlayerEl.play().catch((error) => {
            console.warn("[MÚSICA] Erro ao reproduzir áudio:", error);
        });
    }
}

// Adiciona event listeners para os controles do player
if (btnPrevTrackEl) {
    btnPrevTrackEl.addEventListener("click", playPrevTrack);
    console.log("[MÚSICA] Botão PREV vinculado");
}

if (btnPlayPauseTrackEl) {
    btnPlayPauseTrackEl.addEventListener("click", togglePlayPause);
    console.log("[MÚSICA] Botão PLAY/PAUSE vinculado");
}

if (btnNextTrackEl) {
    btnNextTrackEl.addEventListener("click", playNextTrack);
    console.log("[MÚSICA] Botão NEXT vinculado");
}

// Adiciona event listeners para o elemento audio
if (audioPlayerEl) {
    // Quando a música começa a tocar
    audioPlayerEl.addEventListener("play", () => {
        if (btnPlayPauseTrackEl) {
            btnPlayPauseTrackEl.textContent = "⏸";
        }
        console.log("[MÚSICA] Reprodução iniciada");
    });
    
    // Quando a música é pausada
    audioPlayerEl.addEventListener("pause", () => {
        if (btnPlayPauseTrackEl) {
            btnPlayPauseTrackEl.textContent = "▶";
        }
        console.log("[MÚSICA] Reprodução pausada");
    });
    
    // Quando a faixa termina, passa para a próxima automaticamente
    audioPlayerEl.addEventListener("ended", () => {
        console.log("[MÚSICA] Faixa finalizada");
        playNextTrack();
    });
    
    // Quando ocorre um erro ao carregar o áudio
    audioPlayerEl.addEventListener("error", (event) => {
        console.error("[MÚSICA] Erro ao carregar áudio:", event);
        alert("Erro ao carregar arquivo de áudio. Verifique se o arquivo existe em assets/audio/");
    });
    
    console.log("[MÚSICA] Elemento audio configurado");
}

// Inicializa o player carregando a primeira faixa (sem reproduzir automaticamente)
if (audioPlayerEl && playlist.length > 0) {
    loadTrack(0);
    // Define o texto inicial do botão
    if (btnPlayPauseTrackEl) {
        btnPlayPauseTrackEl.textContent = "▶";
    }
    console.log("[MÚSICA] Player inicializado");
}

// Volume
const volumeSliderEl = document.getElementById("volume-slider");
if (audioPlayerEl && volumeSliderEl) {
    audioPlayerEl.volume = parseInt(volumeSliderEl.value, 10) / 100;
    volumeSliderEl.addEventListener("input", () => {
        audioPlayerEl.volume = parseInt(volumeSliderEl.value, 10) / 100;
    });
}

