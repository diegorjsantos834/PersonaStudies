// widgets.js
// Parte compartilhada do HUD, que roda em qualquer tema (P3 e P5).
// Tem o relógio do topo, o seletor de tema, o parallax do wallpaper,
// as abas do card central, o timer, o clima (via PHP/OpenWeather) e o player.
// O visual de cada tema tá no CSS (main.css, p5_calendar.css, persona3.css);
// a data por sprite fica em p5calendar.js (P5) e persona3.js (P3).

// =====================================================
// 1. CONFIG INICIAL
// =====================================================

// Chave da API do OpenWeather (https://openweathermap.org/api)
const OWM_API_KEY = "51f001c6723ac948e0ca9ef5e745afa3";

// Cidade que aparece assim que abre a página
const DEFAULT_CITY = "São Paulo";

// Timer padrão de 25 min (Pomodoro), em ms
const DEFAULT_TIMER_DURATION_MS = 25 * 60 * 1000;

// =====================================================
// 2. RELÓGIO DIGITAL (HH:MM:SS)
// =====================================================

const digitalClockEl = document.getElementById("digital-clock");

function updateDigitalClock() {
    if (!digitalClockEl) {
        console.warn("[RELÓGIO] Elemento #digital-clock não encontrado");
        return;
    }

    const now = new Date();

    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    // força dois dígitos (09:05:03)
    hours = hours.toString().padStart(2, "0");
    minutes = minutes.toString().padStart(2, "0");
    seconds = seconds.toString().padStart(2, "0");

    digitalClockEl.textContent = hours + ":" + minutes + ":" + seconds;
}

updateDigitalClock();
setInterval(updateDigitalClock, 1000);

// =====================================================
// 3. SELETOR DE TEMAS (P3 / P5)
// Temos p3 (Reload, azul) e p5 (Royal, vermelho/preto).
// O P4 saiu do projeto.
// =====================================================

const bodyEl = document.body;

// Troca o tema da interface. Só tem p3 e p5.
// A transição animada (js/transitions.js) embrulha essa função e troca a
// classe no meio do vídeo, então não mexe na lógica daqui.
function switchTheme(themeName) {
    if (!bodyEl) {
        console.warn("[TEMA] Elemento body não encontrado");
        return;
    }

    bodyEl.classList.remove("theme-p3", "theme-p5");
    bodyEl.classList.add(`theme-${themeName}`);

    // guarda a escolha pra manter depois que recarrega a página
    try {
        localStorage.setItem("persona-theme", themeName);
        console.log(`[TEMA] Tema alterado para: ${themeName.toUpperCase()}`);
    } catch (error) {
        // localStorage bloqueado (aba anônima, etc)
        console.warn("[TEMA] Não foi possível salvar o tema no localStorage:", error);
    }
}

// Pega o tema salvo ao abrir a página. Se não tiver nenhum, fica no padrão.
function loadSavedTheme() {
    if (!bodyEl) {
        console.warn("[TEMA] Elemento body não encontrado");
        return;
    }

    try {
        const savedTheme = localStorage.getItem("persona-theme");

        // quem tinha "p4" salvo cai no tema padrão do HTML
        if (savedTheme === "p3" || savedTheme === "p5") {
            bodyEl.classList.remove("theme-p3", "theme-p5");
            bodyEl.classList.add(`theme-${savedTheme}`);
            console.log(`[TEMA] Tema carregado do localStorage: ${savedTheme.toUpperCase()}`);
        } else {
            console.log("[TEMA] Nenhum tema salvo encontrado. Mantendo tema padrão.");
        }
    } catch (error) {
        console.warn("[TEMA] Não foi possível carregar o tema do localStorage:", error);
    }
}

loadSavedTheme();

// precisa ser global porque os botões do HTML chamam onclick="switchTheme('p5')"
window.switchTheme = switchTheme;

// =====================================================
// 4. PARALLAX 3D NO WALLPAPER
// =====================================================

const desktopEl = document.querySelector(".desktop");

// todas as camadas de fundo, na ordem definida no HTML
// (base_bg -> animated_scenery -> canva_sounds -> static_scenery -> characters)
const parallaxLayers = document.querySelectorAll(".wallpaper_layers_containers section");

// Quanto cada camada anda conforme o mouse. Negativo/positivo define o lado,
// número maior = mexe mais (fica mais "longe").
const parallaxIntensity = {
    layer_base_bg: 3,          // fundo, movimento suave
    layer_animated_scenery: 3, // cenário animado (baixo p/ não expor borda)
    layer_canva_sounds: 8,     // canvas de som
    layer_static_scenery: -4,  // quase parado p/ não mostrar o fundo
    layer_characters: -10      // personagem só acompanha de leve
};

// move as camadas conforme a posição do mouse, relativa ao centro da tela
function applyParallax(event) {
    if (!desktopEl) {
        return;
    }

    const rect = desktopEl.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // -1 a 1, pra funcionar igual em qualquer tamanho de tela
    const mouseX = (event.clientX - centerX) / centerX;
    const mouseY = (event.clientY - centerY) / centerY;

    parallaxLayers.forEach((layer) => {
        const classList = layer.className;

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

        const translateX = mouseX * intensity;
        const translateY = mouseY * intensity;

        // translate3d deixa o navegador acelerar por hardware
        layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    });
}

// volta tudo pro lugar quando o mouse sai da área
function resetParallax() {
    parallaxLayers.forEach((layer) => {
        layer.style.transform = "translate3d(0, 0, 0)";
    });
}

if (desktopEl) {
    desktopEl.addEventListener("mousemove", applyParallax);
    desktopEl.addEventListener("mouseleave", resetParallax);
    console.log("[PARALLAX] Efeito parallax 3D ativado");
} else {
    console.warn("[PARALLAX] Elemento .desktop não encontrado");
}

// =====================================================
// 5. ABAS (GERAL / SEMANAL)
// =====================================================

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanes = document.querySelectorAll(".tab-pane");

// mostra a aba clicada e esconde as outras
function switchTab(tabName) {
    tabButtons.forEach((button) => {
        button.classList.remove("active");

        if (button.dataset.tab === tabName) {
            button.classList.add("active");
        }
    });

    tabPanes.forEach((pane) => {
        pane.classList.add("hidden");

        if (pane.id === "tab-" + tabName) {
            pane.classList.remove("hidden");
        }
    });

    console.log(`[ABAS] Aba alterada para: ${tabName}`);
}

tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const tabName = button.dataset.tab;

        if (tabName) {
            switchTab(tabName);
        }
    });
});

console.log("[ABAS] Sistema de abas inicializado");

// =====================================================
// 6. TIMER / POMODORO
// =====================================================

// estado do timer
let timerRemainingMs = DEFAULT_TIMER_DURATION_MS; // quanto falta
let timerDurationMs = DEFAULT_TIMER_DURATION_MS;  // total configurado
let timerIntervalId = null;                       // id do setInterval (null = parado)
let isTimerRunning = false;                       // true = rodando

const timerDisplayEl = document.getElementById("timer-display");
const btnStartTimerEl = document.getElementById("btn-start-timer");
const btnResetTimerEl = document.getElementById("btn-reset-timer");

// vira "150000" em "25:00"
function formatTimer(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");

    return formattedMinutes + ":" + formattedSeconds;
}

function renderTimer() {
    if (!timerDisplayEl) {
        console.warn("[TIMER] Elemento #timer-display não encontrado");
        return;
    }

    timerDisplayEl.textContent = formatTimer(timerRemainingMs);
}

// começa a contar. Não deixa criar dois intervalos ao mesmo tempo.
function startTimer() {
    if (timerIntervalId !== null) {
        return;
    }

    isTimerRunning = true;

    if (btnStartTimerEl) {
        btnStartTimerEl.textContent = "PAUSE";
    }

    timerIntervalId = setInterval(() => {
        timerRemainingMs -= 1000;

        // chegou no fim: para tudo e volta o botão
        if (timerRemainingMs <= 0) {
            timerRemainingMs = 0;
            renderTimer();
            clearInterval(timerIntervalId);
            timerIntervalId = null;
            isTimerRunning = false;
            if (btnStartTimerEl) {
                btnStartTimerEl.textContent = "START";
            }
            console.log("[TIMER] Tempo finalizado!");
            // dá pra plugar um alarme aqui
            return;
        }

        renderTimer();
    }, 1000);

    console.log("[TIMER] Timer iniciado");
}

// pausa sem zerar o tempo
function pauseTimer() {
    if (timerIntervalId !== null) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }

    isTimerRunning = false;

    if (btnStartTimerEl) {
        btnStartTimerEl.textContent = "START";
    }

    console.log("[TIMER] Timer pausado");
}

// para e volta pro tempo inicial
function resetTimer() {
    pauseTimer();

    timerRemainingMs = timerDurationMs;

    renderTimer();

    console.log("[TIMER] Timer resetado");
}

if (btnStartTimerEl) {
    btnStartTimerEl.addEventListener("click", () => {
        if (isTimerRunning) {
            pauseTimer();
        } else {
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

renderTimer();
console.log("[TIMER] Timer inicializado");

// =====================================================
// 7. CLIMA E PREVISÃO (OPENWEATHERMAP)
// =====================================================

// topo: temperatura e cidade. A data do P5 é por sprite e a do P3 é texto,
// então cada uma fica no seu arquivo (p5calendar.js / persona3.js).
const hudTempValEl = document.getElementById("hud-temp-val");
const currentCityNameEl = document.getElementById("current-city-name");

// aba Geral
const tempValEl = document.getElementById("temp-val");
const humidityValEl = document.getElementById("humidity-val");
const conditionValEl = document.getElementById("condition-val");

// busca de cidade
const weatherSearchFormEl = document.getElementById("weather-search-form");
const cityInputEl = document.getElementById("city-input");

// aba Semanal
const weeklyForecastListEl = document.getElementById("weekly-forecast-list");

// clima atual de uma cidade (passa pelo nosso PHP, que fala com a API)
async function fetchCurrentWeather(city) {
    if (OWM_API_KEY === "COLOQUE_SUA_CHAVE_AQUI") {
        console.warn("[CLIMA] Chave da API OpenWeather não configurada");
        alert("Por favor, configure a chave da API OpenWeatherMap em js/widgets.js");
        throw new Error("API key não configurada");
    }

    const url = `php/weather.php?city=${encodeURIComponent(city)}`;

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Cidade não encontrada");
        } else if (response.status === 401) {
            throw new Error("Chave da API inválida");
        } else {
            throw new Error(`Erro ao buscar clima: ${response.status}`);
        }
    }

    const data = await response.json();
    return data;
}

// previsão de 5 dias
async function fetchForecast(city) {
    if (OWM_API_KEY === "COLOQUE_SUA_CHAVE_AQUI") {
        throw new Error("API key não configurada");
    }

    const url = `php/forecast.php?city=${encodeURIComponent(city)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Erro ao buscar previsão: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

// monta a lista da aba Semanal a partir do forecast
function populateWeeklyForecast(forecastData) {
    if (!weeklyForecastListEl) {
        return;
    }

    weeklyForecastListEl.innerHTML = "";

    // o forecast vem a cada 3h; a gente pega um registro por dia e cria 5 dias
    const dailyForecasts = [];
    const seenDates = new Set();

    forecastData.list.forEach((item) => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });

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

// busca clima + previsão e joga tudo na tela
async function loadWeather(city) {
    try {
        console.log(`[CLIMA] Buscando clima para: ${city}`);

        // as duas chamadas em paralelo
        const [currentData, forecastData] = await Promise.all([
            fetchCurrentWeather(city),
            fetchForecast(city)
        ]);

        // topo
        if (hudTempValEl) {
            hudTempValEl.textContent = Math.round(currentData.main.temp) + "°C";
        }

        // animação do ícone de clima do calendário P5 (0=sol, 1=nuvem, 2=chuva, 3=neve)
        if (typeof window.animateWeatherSprites === 'function') {
            let c = 0;
            const icon = currentData.weather[0].icon;
            if (icon.startsWith('02') || icon.startsWith('03') || icon.startsWith('04')) c = 1;
            if (icon.startsWith('09') || icon.startsWith('10') || icon.startsWith('11')) c = 2;
            if (icon.startsWith('13')) c = 3;
            try { window.animateWeatherSprites(c); } catch(e) {}
        }

        if (currentCityNameEl) {
            currentCityNameEl.textContent = currentData.name.toUpperCase();
        }

        // aba Geral
        if (tempValEl) {
            tempValEl.textContent = Math.round(currentData.main.temp) + "°C";
        }

        if (humidityValEl) {
            humidityValEl.textContent = currentData.main.humidity + "%";
        }

        if (conditionValEl) {
            conditionValEl.textContent = currentData.weather[0].description;
        }

        populateWeeklyForecast(forecastData);

        console.log(`[CLIMA] Clima atualizado com sucesso para: ${currentData.name}`);

    } catch (error) {
        console.error("[CLIMA] Erro ao carregar clima:", error.message);

        if (error.message === "Cidade não encontrada") {
            alert("Cidade não encontrada. Por favor, verifique o nome e tente novamente.");
        } else if (error.message === "Chave da API inválida") {
            alert("Chave da API OpenWeatherMap inválida. Verifique em js/widgets.js");
        } else if (error.message === "API key não configurada") {
            // já foi alertado lá em cima
        } else {
            alert("Erro ao carregar clima. Verifique sua conexão com a internet.");
        }
    }
}

// envio do formulário de busca
if (weatherSearchFormEl) {
    weatherSearchFormEl.addEventListener("submit", (event) => {
        event.preventDefault();
        hideCitySuggestions();

        if (cityInputEl) {
            const city = cityInputEl.value.trim();

            if (city === "") {
                alert("Por favor, digite o nome de uma cidade");
                return;
            }

            loadWeather(city);

            cityInputEl.value = "";
        }
    });

// autocomplete: sugere cidades enquanto digita (Geo API do OpenWeather)
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
        // espera a pessoa parar de digitar antes de consultar
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
        // pequena espera pra dar tempo de clicar na sugestão
        setTimeout(hideCitySuggestions, 200);
    });
}

    console.log("[CLIMA] Formulário de busca vinculado");
}

// clima da cidade padrão ao abrir a página
if (OWM_API_KEY !== "COLOQUE_SUA_CHAVE_AQUI") {
    loadWeather(DEFAULT_CITY);
    console.log(`[CLIMA] Clima padrão carregado: ${DEFAULT_CITY}`);
} else {
    console.warn("[CLIMA] Clima padrão não carregado. Configure a chave da API primeiro.");
}

// =====================================================
// 8. PLAYER DE MÚSICA (ARQUIVOS LOCAIS EM assets/audio)
// =====================================================

const audioPlayerEl = document.getElementById("persona-audio-player");
const trackTitleEl = document.getElementById("track-title");
const btnPrevTrackEl = document.getElementById("prev-track");
const btnPlayPauseTrackEl = document.getElementById("play-pause-track");
const btnNextTrackEl = document.getElementById("next-track");

// Pra colocar música nova: joga o MP3 em assets/audio e adiciona o caminho aqui.
// O título na tela sai do próprio nome do arquivo, então não precisa cadastrar à mão.
const playlist = [
    "assets/audio/Persona_3_Reload_-_Its_Going_Down_Now_(mp3.pm).mp3"
];

// transforma o nome do arquivo no nome da música que aparece na tela:
// "Persona_3_Reload_-_Its_Going_Down_Now_(mp3.pm).mp3" -> "Persona 3 Reload Its Going Down Now"
function trackTitleFromSrc(src) {
    return src
        .split("/")
        .pop()                     // fica só o nome do arquivo
        .replace(/\.[^.]+$/, "")   // tira a extensão (.mp3)
        .replace(/\([^)]*\)/g, "") // tira o que estiver entre ( ), tipo (mp3.pm)
        .replace(/[_-]+/g, " ")    // _ e - viram espaço
        .replace(/\s+/g, " ")      // junta espaços duplicados
        .trim();
}

// índice da faixa tocando agora
let currentTrackIndex = 0;

// carrega a faixa no <audio> e atualiza o título
function loadTrack(index) {
    if (playlist.length === 0) {
        console.warn("[MÚSICA] Playlist vazia");
        return;
    }

    // dá a volta na playlist quando passa do fim ou do início
    currentTrackIndex = (index + playlist.length) % playlist.length;

    const src = playlist[currentTrackIndex];

    if (!audioPlayerEl) {
        console.warn("[MÚSICA] Elemento #persona-audio-player não encontrado");
        return;
    }

    audioPlayerEl.src = src;

    if (trackTitleEl) {
        trackTitleEl.textContent = trackTitleFromSrc(src);
    }

    console.log(`[MÚSICA] Faixa carregada: ${trackTitleFromSrc(src)}`);
}

function togglePlayPause() {
    if (!audioPlayerEl) {
        console.warn("[MÚSICA] Elemento audio não encontrado");
        return;
    }

    // se não tiver nada carregado, carrega a primeira
    if (!audioPlayerEl.src) {
        loadTrack(0);
        audioPlayerEl.play().catch((error) => {
            console.warn("[MÚSICA] Erro ao reproduzir áudio:", error);
        });
        return;
    }

    if (audioPlayerEl.paused) {
        audioPlayerEl.play().catch((error) => {
            console.warn("[MÚSICA] Erro ao reproduzir áudio:", error);
        });
    } else {
        audioPlayerEl.pause();
    }
}

function playPrevTrack() {
    loadTrack(currentTrackIndex - 1);

    if (audioPlayerEl) {
        audioPlayerEl.play().catch((error) => {
            console.warn("[MÚSICA] Erro ao reproduzir áudio:", error);
        });
    }
}

function playNextTrack() {
    loadTrack(currentTrackIndex + 1);

    if (audioPlayerEl) {
        audioPlayerEl.play().catch((error) => {
            console.warn("[MÚSICA] Erro ao reproduzir áudio:", error);
        });
    }
}

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

if (audioPlayerEl) {
    // troca o ícone do botão e vice-versa
    audioPlayerEl.addEventListener("play", () => {
        if (btnPlayPauseTrackEl) {
            btnPlayPauseTrackEl.textContent = "⏸";
        }
        console.log("[MÚSICA] Reprodução iniciada");
    });

    audioPlayerEl.addEventListener("pause", () => {
        if (btnPlayPauseTrackEl) {
            btnPlayPauseTrackEl.textContent = "▶";
        }
        console.log("[MÚSICA] Reprodução pausada");
    });

    // acabou a faixa, passa pra próxima sozinho
    audioPlayerEl.addEventListener("ended", () => {
        console.log("[MÚSICA] Faixa finalizada");
        playNextTrack();
    });

    audioPlayerEl.addEventListener("error", (event) => {
        console.error("[MÚSICA] Erro ao carregar áudio:", event);
        alert("Erro ao carregar arquivo de áudio. Verifique se o arquivo existe em assets/audio/");
    });

    console.log("[MÚSICA] Elemento audio configurado");
}

// carrega a primeira faixa sem dar play (autoplay é bloqueado)
if (audioPlayerEl && playlist.length > 0) {
    loadTrack(0);
    if (btnPlayPauseTrackEl) {
        btnPlayPauseTrackEl.textContent = "▶";
    }
    console.log("[MÚSICA] Player inicializado");
}

// volume
const volumeSliderEl = document.getElementById("volume-slider");
if (audioPlayerEl && volumeSliderEl) {
    audioPlayerEl.volume = parseInt(volumeSliderEl.value, 10) / 100;
    volumeSliderEl.addEventListener("input", () => {
        audioPlayerEl.volume = parseInt(volumeSliderEl.value, 10) / 100;
    });
}
