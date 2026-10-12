/* Рулетка доставки: только локальные предпочтения. Не подключается к API магазинов и не оформляет заказ. */
(function () {
  'use strict';

  const resultNode = document.getElementById('order-result');
  const spinButton = document.getElementById('order-spin');
  const memoryNode = document.getElementById('order-memory');
  const resetButton = document.getElementById('order-reset');
  if (!resultNode || !spinButton || !memoryNode || !resetButton) return;

  const providers = Object.freeze({
    yandex: { title: 'Яндекс Еда', url: 'https://eda.yandex.ru/' },
    samokat: { title: 'Самокат', url: 'https://samokat.ru/' }
  });

  // Это категории-подсказки, а не подтверждённые предложения ресторанов или каталога Самоката.
  const choices = [
    { id: 'pizza',       title: 'Пицца',               emoji: '🍕', description: 'Большая пицца с любимой начинкой. Можно даже не доставать тарелку.', services: ['yandex'] },
    { id: 'sushi',       title: 'Роллы',               emoji: '🍣', description: 'Роллы, соевый соус и вечер без кухни.', services: ['yandex'] },
    { id: 'burger',      title: 'Бургер и картошка',   emoji: '🍔', description: 'Сочный бургер, хрустящая картошка и что-нибудь попить.', services: ['yandex'] },
    { id: 'wok',         title: 'Вок с лапшой',        emoji: '🍜', description: 'Горячая лапша с соусом и начинкой на выбор.', services: ['yandex'] },
    { id: 'shawarma',    title: 'Шаурма',              emoji: '🌯', description: 'Сытно, быстро, никакой горы посуды.', services: ['yandex'] },
    { id: 'khinkali',    title: 'Хинкали',             emoji: '🥟', description: 'Горячие хинкали с сочной начинкой.', services: ['yandex'] },
    { id: 'ramen',       title: 'Рамен',               emoji: '🍥', description: 'Большая миска насыщенного супа с лапшой.', services: ['yandex'] },
    { id: 'chicken',     title: 'Крылышки',            emoji: '🍗', description: 'Горячие крылышки, любимый соус и хороший фильм.', services: ['yandex'] },
    { id: 'poke',        title: 'Поке',                emoji: '🥗', description: 'Рис, овощи и что-нибудь вкусное сверху.', services: ['yandex'] },
    { id: 'pasta',       title: 'Паста из ресторана',  emoji: '🍝', description: 'Пусть сегодня кто-то другой варит пасту и моет кастрюлю.', services: ['yandex'] },
    { id: 'kebab',       title: 'Шашлык',              emoji: '🍢', description: 'Мясо или овощи на гриле, лаваш и соус.', services: ['yandex'] },
    { id: 'pancakes',    title: 'Блинчики',            emoji: '🥞', description: 'Сытные или сладкие — выбирать можно уже после рулетки.', services: ['yandex', 'samokat'] },
    { id: 'cinnabon',    title: 'Булочка с корицей',   emoji: '🍥', description: 'Мягкая сладкая булочка с корицей. Почти синнабон — если найдётся в каталоге.', services: ['samokat', 'yandex'] },
    { id: 'cranberry',   title: 'Клюквенный хлеб',     emoji: '🍞', description: 'Да, сегодня можно просто взять клюквенный хлеб. Проверим, где он есть.', services: ['samokat'] },
    { id: 'cheesecake',  title: 'Чизкейк',             emoji: '🍰', description: 'Десерт вместо долгих раздумий. Иногда именно это и нужно.', services: ['samokat', 'yandex'] },
    { id: 'icecream',    title: 'Мороженое',           emoji: '🍨', description: 'Кремовое, шоколадное или ягодное. Что-нибудь точно приглянется.', services: ['samokat'] },
    { id: 'ready-meal',  title: 'Готовый обед',        emoji: '🥡', description: 'Открыть раздел готовой еды и выбрать, что сразу можно разогреть.', services: ['samokat'] },
    { id: 'pie',         title: 'Пирог или слойка',    emoji: '🥧', description: 'Свежая выпечка — и вопрос с перекусом закрыт.', services: ['samokat', 'yandex'] },
    { id: 'dumplings',   title: 'Пельмени',            emoji: '🥟', description: 'Готовые горячие пельмени с соусом или сметаной.', services: ['yandex'] },
    { id: 'sandwich',    title: 'Сэндвич',             emoji: '🥪', description: 'Что-нибудь простое и сытное, чтобы не тратить вечер на готовку.', services: ['samokat', 'yandex'] },
    { id: 'desserts',    title: 'Набор десертов',      emoji: '🧁', description: 'Эклеры, пирожные или другие сладости на выбор.', services: ['samokat', 'yandex'] },
    { id: 'soup',        title: 'Суп из ресторана',    emoji: '🍲', description: 'Хочется чего-нибудь горячего и домашнего? Закажем суп.', services: ['yandex'] }
  ];

  const storeKey = 'nastik-order-roulette-v1';
  const today = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  function loadState() {
    const fallback = { day: today(), rejected: [], likes: {}, last: null };
    try {
      const source = JSON.parse(localStorage.getItem(storeKey) || 'null');
      if (!source || typeof source !== 'object') return fallback;
      const validIds = new Set(choices.map((item) => item.id));
      const rejected = Array.isArray(source.rejected) ? source.rejected.filter((id) => validIds.has(id)) : [];
      const likes = {};
      if (source.likes && typeof source.likes === 'object') {
        for (const [id, count] of Object.entries(source.likes)) {
          if (validIds.has(id) && Number.isFinite(count) && count > 0) likes[id] = Math.min(Math.floor(count), 30);
        }
      }
      return {
        day: today(),
        rejected: source.day === today() ? [...new Set(rejected)] : [],
        likes,
        last: validIds.has(source.last) ? source.last : null
      };
    } catch (_) { return fallback; }
  }

  let state = loadState();
  let selected = null;

  function saveState() {
    try { localStorage.setItem(storeKey, JSON.stringify(state)); } catch (_) { /* В приватном режиме память может быть недоступна. */ }
  }

  function refreshDay() {
    if (state.day !== today()) {
      state.day = today();
      state.rejected = [];
      saveState();
    }
  }

  function availableChoices() {
    refreshDay();
    const rejected = new Set(state.rejected);
    return choices.filter((item) => !rejected.has(item.id));
  }

  function chooseNext() {
    let available = availableChoices();
    if (available.length > 1) available = available.filter((item) => item.id !== state.last);
    if (!available.length) return null;
    // Лайки мягко повышают вероятность, но каждый доступный вариант по-прежнему может выпасть.
    const weighted = available.map((item) => ({
      item,
      weight: 1 + Math.min(state.likes[item.id] || 0, 6) * 0.35
    }));
    const total = weighted.reduce((sum, x) => sum + x.weight, 0);
    let cursor = Math.random() * total;
    for (const entry of weighted) {
      cursor -= entry.weight;
      if (cursor < 0) return entry.item;
    }
    return available[available.length - 1];
  }

  function updateMemory() {
    const rejectedCount = state.rejected.length;
    if (!selected && rejectedCount === choices.length) {
      memoryNode.textContent = 'Все варианты сегодня отклонены. Можно вернуть их и попробовать снова.';
    } else if (rejectedCount > 0) {
      memoryNode.textContent = `Не показываем сегодня: ${rejectedCount} из ${choices.length} вариантов.`;
    } else if (selected) {
      memoryNode.textContent = 'Не подходит? Откажись от варианта или крути ещё.';
    } else {
      memoryNode.textContent = 'Нажми «Реши за меня!», чтобы начать.';
    }
    resetButton.hidden = rejectedCount === 0;
    spinButton.disabled = rejectedCount === choices.length;
    spinButton.innerHTML = selected ? '<span aria-hidden="true">🎲</span> Давай ещё <span aria-hidden="true">↻</span>' : '<span aria-hidden="true">🎲</span> Реши за меня! <span aria-hidden="true">→</span>';
  }

  function showEmpty() {
    selected = null;
    resultNode.innerHTML = `
      <div class="order-idle order-appears">
        <div class="order-icon order-icon-idle" aria-hidden="true">😅</div>
        <div class="order-result-tag">ТАК, МЫ ПЕРЕБРАЛИ ВСЁ</div>
        <h3>Ничего не подошло?</h3>
        <p>Верни отклонённые варианты и попробуй заново.</p>
      </div>`;
    updateMemory();
  }

  function renderResult(item) {
    selected = item;
    state.last = item.id;
    saveState();
    const [primaryKey, ...alternates] = item.services;
    const primary = providers[primaryKey];
    resultNode.innerHTML = `
      <div class="order-picked order-appears">
        <div class="order-icon" aria-hidden="true">${item.emoji}</div>
        <div class="order-result-tag">СЕГОДНЯ ВЫПАЛО</div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="order-actions">
          <a class="order-accept" id="order-accept" href="${primary.url}" target="_blank" rel="noopener noreferrer" aria-label="Хочу ${item.title}. Посмотреть в ${primary.title}, откроется новая вкладка">О, вот это хочу! <span aria-hidden="true">↗</span></a>
          <button class="order-decline" id="order-decline" type="button">Фу, не хочу</button>
        </div>
        <div class="order-provider">Искать в <strong>${primary.title}</strong>${alternates.map((key) => ` · <a data-order-alt href="${providers[key].url}" target="_blank" rel="noopener noreferrer">${providers[key].title} ↗</a>`).join('')}</div>
      </div>`;
    document.getElementById('order-accept').addEventListener('click', rememberLike);
    resultNode.querySelectorAll('[data-order-alt]').forEach((node) => node.addEventListener('click', rememberLike));
    document.getElementById('order-decline').addEventListener('click', () => {
      if (!state.rejected.includes(item.id)) state.rejected.push(item.id);
      saveState();
      spin();
    });
    updateMemory();
  }

  function rememberLike() {
    if (!selected) return;
    state.likes[selected.id] = Math.min((state.likes[selected.id] || 0) + 1, 30);
    saveState();
  }

  function spin() {
    const next = chooseNext();
    if (next) renderResult(next);
    else showEmpty();
  }

  spinButton.addEventListener('click', spin);
  resetButton.addEventListener('click', () => {
    state.rejected = [];
    saveState();
    spin();
  });
  updateMemory();
})();
