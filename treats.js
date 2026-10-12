(function () {
  'use strict';
  const treats = [
    ['Синнабон','🥮','sweet','Булочка с корицей и кремом. Вариант, от которого сложно отказаться.'],
    ['Клюквенный хлеб','🍞','sweet','Лучше свежий, мягкий. Можно взять к чаю.'],
    ['Choco Boy','🍄','sweet','Печеньки-грибочки в шоколаде. Прямо из коробки.'],
    ['Шоколадный круассан','🥐','sweet','Из пекарни или с полки.'],
    ['Тирамису в стаканчике','🍰','sweet','Десерт без всякой готовки.'],
    ['Чизкейк','🍰','sweet','Один кусочек, а настроение уже лучше.'],
    ['Моти','🍡','sweet','Нежный японский десерт с начинкой.'],
    ['Мороженое пломбир','🍦','sweet','Классика, работает в любой сезон.'],
    ['Пломбир с фисташкой','🍨','sweet','Если хочется чего-то интереснее обычного.'],
    ['Клубника в шоколаде','🍓','sweet','Готовая коробочка из кондитерской.'],
    ['Вафли с шоколадом','🧇','sweet','Хрустящие и сладкие.'],
    ['Профитроли','🍮','sweet','Маленькие пирожные с кремом.'],
    ['Донат','🍩','sweet','С глазурью, посыпкой или начинкой.'],
    ['Мармеладки','🍬','sweet','Кислые или фруктовые, на выбор.'],
    ['Макаронс','🧁','sweet','Яркие миндальные пирожные.'],
    ['Брауни','🍫','sweet','Плотный шоколадный десерт.'],
    ['Палочки Pocky','🍫','sweet','Шоколадные палочки к фильму.'],
    ['Чокопай','🍪','sweet','Когда хочется сладкого быстро.'],
    ['Чипсы с сыром','🥔','salty','Для фильма и уютного вечера.'],
    ['Начос с соусом','🌮','salty','Возьми баночку сырного соуса рядом.'],
    ['Сыр-косичка','🧀','salty','Солёный перекус без хлопот.'],
    ['Крекеры с сыром','🧀','salty','Сразу можно есть, без сборки.'],
    ['Солёные фисташки','🥜','salty','Если хочется похрустеть.'],
    ['Вяленое манго','🥭','sweet','Сладкий фруктовый снек.'],
    ['Попкорн','🍿','salty','Готовый пакет для кино.'],
    ['Мини-сэндвич из магазина','🥪','salty','Уже собран — только распаковать.'],
    ['Сырная тарелка','🧀','salty','Готовая упаковка ассорти.'],
    ['Кукурузные снеки','🌽','salty','Лёгкий хрустящий перекус.'],
    ['Крекеры-рыбки','🐟','salty','Просто открыть пачку.'],
    ['Нулёвка','🍺','drink','Безалкогольное пиво 0,0%. Если хочется именно такого вкуса.'],
    ['Холодный чай','🧋','drink','Персик, лимон или что попадётся.'],
    ['Лимонад','🥤','drink','Прохладный и пузырчатый.'],
    ['Клюквенный морс','🫐','drink','Кисло-сладкий вариант к перекусу.'],
    ['Молочный коктейль','🥛','drink','Готовый в бутылочке.'],
    ['Айс-латте','🧊','drink','Холодный кофе из магазина или кофейни.'],
    ['Комбуча','🍹','drink','Если хочется необычный газированный напиток.'],
    ['Вишнёвый сок','🍒','drink','Классический вариант.'],
    ['Газированная вода с лимоном','🍋','drink','Для чего-то лёгкого.']
  ];
  const special = {name:'Сидр №2',emoji:'👀',kind:'meme',description:'Без объяснений. Настик поймёт.'};
  const result = document.getElementById('treats-result');
  const trigger = document.getElementById('treats-spin');
  if (!result || !trigger) return;
  let kind = 'all';
  let last = '';
  document.querySelectorAll('[data-treat-kind]').forEach(button => button.addEventListener('click', () => {
    kind = button.dataset.treatKind;
    document.querySelectorAll('[data-treat-kind]').forEach(b => {
      const chosen = b === button;
      b.classList.toggle('is-active', chosen);
      b.setAttribute('aria-pressed', String(chosen));
    });
  }));
  const safe = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function show(item) {
    last = item.name;
    const meme = item.kind === 'meme';
    result.classList.toggle('is-meme', meme);
    result.innerHTML = '<span class="treats-tag">'+(meme?'СЕКРЕТНЫЙ ДРОП':item.kind==='sweet'?'СЛАДКОЕ':item.kind==='salty'?'СОЛЁНОЕ':'НАПИТОК')+'</span>'+
      '<span class="treats-emoji" aria-hidden="true">'+item.emoji+'</span><strong>'+safe(item.name)+'</strong>'+
      '<span class="treats-desc">'+safe(item.description)+'</span>'+
      '<button class="treats-add" type="button" id="treats-add">＋ В список покупок</button>';
    result.querySelector('#treats-add').addEventListener('click', () => {
      // Используем существующее поле и обработчик добавления покупок.
      const input = document.getElementById('manual-shopping');
      const form = document.getElementById('manual-shopping-form');
      if (!input || !form) return;
      input.value = item.name;
      if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else form.querySelector('button[type="submit"]')?.click();
      result.querySelector('#treats-add').textContent = '✓ Добавлено в покупки';
    });
  }
  function spin() {
    const pool = treats.filter(item => kind === 'all' || item[2] === kind).map(([name,emoji,kind,description])=>({name,emoji,kind,description}));
    // Сидр №2 — редкий пасхальный результат при выборе «Всё подряд».
    if(kind==='all' && Math.random()<0.045){show(special);return;}
    const others=pool.filter(item=>item.name!==last);
    const available=others.length?others:pool;
    show(available[Math.floor(Math.random()*available.length)]);
  }
  trigger.addEventListener('click', spin);
  document.getElementById('treats-meme-btn')?.addEventListener('click',()=>{show(special);result.scrollIntoView({behavior:'smooth',block:'nearest'});});
})();
