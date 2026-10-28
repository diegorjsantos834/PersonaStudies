// persona3.js — relógio, data e lua do tema P3
// Não faz nada se o body não tiver a classe theme-p3.
// A cada segundo ele atualiza a hora, o período (Morning/Evening...),
// o dia da semana, a data e a fase da lua.
// A cidade ali no canto é só um espelho do que foi buscado no widget de clima.
console.log('persona3.js');

function p3IsActive() {
  return document.body && document.body.classList.contains('theme-p3');
}

function p3Period(h) {
  if (h >= 5 && h < 12) return 'Morning';
  if (h >= 12 && h < 18) return 'Afternoon';
  if (h >= 18 && h < 23) return 'Evening';
  return 'Night';
}

// Quanto da lua está acesa (0 = nova, 1 = cheia) e de que lado ela está
function p3Moon() {
  const synodic = 29.53058867;
  const ref = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
  const now = Date.now() / 86400000;
  const phase = (((now - ref) % synodic) + synodic) % synodic / synodic;
  const illum = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  return { illum, waxing: phase < 0.5 };
}

function updateP3() {
  if (!p3IsActive()) return;
  const now = new Date();
  const h = now.getHours();
  const min = now.getMinutes();

  const timeEl = document.getElementById('p3-time');
  if (timeEl) {
    timeEl.textContent =
      String(h).padStart(2, '0') + ':' +
      String(min).padStart(2, '0');
  }

  const periodEl = document.getElementById('p3-period');
  if (periodEl) periodEl.textContent = p3Period(h);

  const wdEl = document.getElementById('p3-weekday');
  if (wdEl) {
    wdEl.textContent = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
  }

  const dateNum = document.getElementById('p3-date-num');
  if (dateNum) dateNum.textContent = (now.getMonth() + 1) + '/' + now.getDate();

  const dateWd = document.getElementById('p3-date-wd');
  if (dateWd) {
    dateWd.textContent = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()];
  }

  const p3City = document.getElementById('p3-city');
  const srcCity = document.getElementById('current-city-name');
  if (p3City && srcCity && srcCity.textContent) p3City.textContent = srcCity.textContent;

  // de dia a bola fica amarela (sol), de noite ela escurece e só a parte
  // iluminada da lua aparece clara
  const moonEl = document.getElementById('p3-moon');
  if (moonEl) moonEl.classList.toggle('is-night', h >= 18 || h < 5);

  const shadow = document.getElementById('p3-moon-shadow');
  if (shadow) {
    const { illum, waxing } = p3Moon();
    const off = Math.round(-illum * 100); // -100 = cheia (sai toda), 0 = nova (fica toda coberta)
    shadow.style.left = waxing ? off + '%' : 'auto';
    shadow.style.right = waxing ? 'auto' : off + '%';
  }
}

updateP3();
setInterval(updateP3, 1000);
