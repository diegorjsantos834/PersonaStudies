// PERSONA3.JS - Relógio, data e fase da lua do tema P3 (só visível com body.theme-p3)
// Atualiza a cada segundo: #p3-time (HH:MM), #p3-period, #p3-weekday,
// #p3-date-num (M/D) e a sombra da lua (#p3-moon-shadow) pela fase real.
// Também espelha a cidade buscada em #p3-city.
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

// Fração iluminada + lado da sombra (0=new, 0.5=full)
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

  const timeEl = document.getElementById('p3-time');
  if (timeEl) {
    timeEl.textContent =
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0');
  }

  const periodEl = document.getElementById('p3-period');
  if (periodEl) periodEl.textContent = p3Period(now.getHours());

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

  const shadow = document.getElementById('p3-moon-shadow');
  if (shadow) {
    const { illum, waxing } = p3Moon();
    const off = Math.round(-illum * 100); // -100% (cheia) .. 0% (nova)
    shadow.style.left = waxing ? off + '%' : 'auto';
    shadow.style.right = waxing ? 'auto' : off + '%';
  }
}

updateP3();
setInterval(updateP3, 1000);
