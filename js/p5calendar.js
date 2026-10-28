console.log('p5calendar.js');
// p5calendar.js - calendário do P5 por sprites (roda só com body.theme-p5).
// Pega mês/dia/dia-da-semana de hoje e posiciona os recortes das sheets que
// estão em assets/images/p5/ (mês 120x120, dias 100x150, weekday 191x74).
// O ícone de clima (weather_spritesheet4.png) anima 3 quadros em loop; o
// widgets.js avisa qual condição usar (sol/nuvem/chuva/neve) via animateWeatherSprites().
let weatherSpriteIndex = 0;
let weatherImageIndex = 0;
const weatherSpriteInterval = 350;
function updateStackedSprite(spriteIndex, idPrefix, obj) {
  if (!obj) obj = document;
  const top = obj.querySelector(idPrefix + '-top');
  const mid = obj.querySelector(idPrefix + '-mid');
  const base = obj.querySelector(idPrefix + '-base');
  if (!top || !mid || !base) return;
  const style = getComputedStyle(top);
  const w = parseInt(style.width) || (idPrefix.includes('month') ? 120 : 100);
  const h = parseInt(style.height) || (idPrefix.includes('month') ? 120 : 150);
  const x = -(spriteIndex * w) + 'px';
  top.style.backgroundPosition = x + ' 0px';
  mid.style.backgroundPosition = x + ' -' + h + 'px';
  base.style.backgroundPosition = x + ' -' + (h * 2) + 'px';
}
function updateWeekdaySprite(weekdayIndex, el) {
  if (!el) return;
  const style = getComputedStyle(el);
  const w = parseInt(style.width) || 191;
  const h = parseInt(style.height) || 74;
  const row = Math.floor(weekdayIndex / 3);
  const col = weekdayIndex % 3;
  el.style.backgroundPosition = -(col * w) + 'px ' + -(row * h) + 'px';
}
function updateWeatherSprite(el, cond) {
  if (!el) return;
  const style = getComputedStyle(el);
  const w = parseInt(style.width) || 75;
  const h = parseInt(style.height) || 72;
  const x = -(cond * w) + 'px';
  const y = -(weatherSpriteIndex * h) + 'px';
  el.style.backgroundPosition = x + ' ' + y;
}
function isP5Theme() {
  return document.body && document.body.classList.contains('theme-p5');
}
function animateWeatherSprites(cond) {
  if (!isP5Theme()) return;
  if (typeof cond === 'number') weatherImageIndex = cond;
  weatherSpriteIndex = (weatherSpriteIndex + 1) % 3;
  const today = document.querySelector('#p5-calendar .current-weather-sprite');
  if (today) updateWeatherSprite(today, weatherImageIndex);
}
function setCurrentDate() {
  if (!isP5Theme()) return;
  const now = new Date();
  const date = now.getDate();
  const month = now.getMonth() + 1;
  const wd = (now.getDay() + 6) % 7;
  const box = document.querySelector('#p5-calendar .datebox') || document;
  updateStackedSprite(month - 1, '.month', box);
  updateStackedSprite(Math.floor(date / 10), '.date-tens', box);
  updateStackedSprite(date % 10, '.date-ones', box);
  const wdEl = document.querySelector('#p5-calendar .weekday-sprite');
  updateWeekdaySprite(wd, wdEl);
}
function startCalendar() {
  setCurrentDate();
  setInterval(setCurrentDate, 1000);
  setInterval(() => animateWeatherSprites(), weatherSpriteInterval);
}
window.animateWeatherSprites = animateWeatherSprites;
startCalendar();
