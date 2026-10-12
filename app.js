(function () {
  'use strict';

  const recipes = Array.isArray(window.DINNER_RECIPES) ? window.DINNER_RECIPES : [];
  if (!recipes.length) { console.error('Файл recipes.js не загрузился.'); return; }

  const $ = (selector) => document.querySelector(selector);
  const escapeHTML = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const storageKey = 'nastik-dinner-v1';
  const palette = ['peach','lime','lilac','yellow','blue','pink','coral','cream'];
  const levels = {easy:'Легко',medium:'Средне',hard:'Сложно'};
  const categories = {hot:'Горячее',soup:'Суп',salad:'Салат',snack:'Перекус',breakfast:'Завтрак',dessert:'Сладкое'};
  const short = (word, max = 40) => String(word).slice(0, max);
  const toneOf = (r) => palette[recipes.indexOf(r) % palette.length];

  // Все сравнения ингредиентов происходят локально — сайт работает без API и сервера.
  const synonyms = {
    'курица':['курица','курицу','куриное филе','куриная грудка','куриная грудка','куриная грудка без кости','грудка','куриные бедра','куриное мясо','куриные ножки','филе курицы','филе'],
    'куриные крылья':['крылышки','куриные крылышки','куриные крылья','крылья курицы','крылья'],
    'говядина':['говядина','говядину','говяжье мясо','мясо говядины'],
    'фарш':['фарш','мясной фарш','говяжий фарш','свиной фарш','куриный фарш'],
    'картофель':['картофель','картошка','картошку','картофелины','картофеля','картошки'],
    'лук':['лук','луковица','луковицы','репчатый лук','лук репчатый'],
    'морковь':['морковь','морковка','морковку','моркови'],
    'яйцо':['яйца','яйцо','яиц','яйца куриные','куриные яйца','яйцо куриное'],
    'помидор':['помидор','помидоры','помидора','помидоров','томаты','томат','помидоры черри','черри'],
    'огурец':['огурец','огурцы','огурцов','огурчика','огурчики'],
    'сыр':['сыр','сыра','твердый сыр','твердый сыр','российский сыр','сыр твердый','сыр гауда','гауда','моцарелла'],
    'сулугуни':['сулугуни','сыр сулугуни'],
    'фета':['фета','сыр фета','брынза','фетакса'],
    'молоко':['молоко','молока'],
    'сливки':['сливки','сливок','сливки 10','сливки 20','сливки 33'],
    'сметана':['сметана','сметану','сметаны'],
    'сливочное масло':['сливочное масло','масло сливочное'],
    'макароны':['макароны','макаронины','паста','спагетти','фузилли','пенне','рожки'],
    'рис':['рис','риса'],
    'гречка':['гречка','гречку','гречневая крупа','гречки'],
    'грибы':['грибы','грибочки','шампиньоны','шампиньон','вешенки','грибов'],
    'мука':['мука','муки','пшеничная мука'],
    'сахар':['сахар','сахара'],
    'хлеб':['хлеб','батон','багет','тосты','тостовый хлеб'],
    'лаваш':['лаваш','тортилья','лепешки','лепешка'],
    'болгарский перец':['болгарский перец','сладкий перец','перец болгарский','красный перец','перец сладкий'],
    'чеснок':['чеснок','чеснока','зубчики чеснока'],
    'капуста':['капуста','капусту','белокочанная капуста','капусты'],
    'салатные листья':['салатные листья','листья салата','салат','айсберг','ромэн','латук','листовой салат'],
    'лапша':['лапша','лапшу','вермишель','удон','яичная лапша','пшеничная лапша'],
    'соевый соус':['соевый соус','соуса соевого'],
    'томатная паста':['томатная паста','томатную пасту','паста томатная'],
    'тунец':['тунец','тунец консервированный','консервированный тунец','консерва тунца','тунец в банке'],
    'фасоль':['фасоль','фасоли'],
    'чечевица':['чечевица','чечевицу','чечевицы','красная чечевица'],
    'кабачок':['кабачок','кабачки','цукини'],
    'баклажан':['баклажан','баклажаны','баклажана'],
    'сосиски':['сосиски','сосиска','сосисок'],
    'колбаса':['колбаса','колбасу','ветчина','колбасы'],
    'лимон':['лимон','лимона','лимоны'],
    'лайм':['лайм','лайма'],
    'творог':['творог','творога'],
    'оливки':['оливки','маслины','оливок'],
    'зелень':['зелень','укроп','петрушка','зеленый лук','зелёный лук'],
    'кинза':['кинза','кинзу','кориандр свежий'],
    'дрожжи':['дрожжи','сухие дрожжи'],
    'рыба':['рыба','рыбу','филе рыбы','рыбное филе','лосось','семга','сёмга','минтай','треска','форель'],
    'креветки':['креветки','креветка','креветок'],
    'мед':['мед','мёд','меда','мёда'],
    'кокосовое молоко':['кокосовое молоко','молоко кокосовое'],
    'паста том ям':['паста том ям','том ям паста'],
    'листы лазаньи':['листы лазаньи','лазанья листы','листы для лазаньи'],
    'слоеное тесто':['слоеное тесто','слоёное тесто','тесто слоеное'],
    'зеленый горошек':['горошек','зеленый горошек','зелёный горошек','консервированный горошек'],
    'кускус':['кускус','кус кус'],
    'имбирь':['имбирь','имбиря'],
    'паприка':['паприка','молотая паприка']
  };
  const norm = (input) => String(input).toLowerCase().replace(/ё/g,'е').replace(/[^а-яa-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();
  const synonymMap = new Map();
  Object.entries(synonyms).forEach(([key, aliases]) => [key,...aliases].forEach((alias) => synonymMap.set(norm(alias), key)));
  const canonical = (name) => {
    const cleaned = norm(String(name)
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:кг|г|гр|мл|л|шт|штук|ст\.?\s*л\.?|ч\.?\s*л\.?)?\b/gi,' ')
      .replace(/^(?:у меня есть|у нас есть|есть дома|есть|у меня|у нас)\s+/i,''));
    return synonymMap.get(cleaned) || cleaned;
  };
  // Понимает и списки через запятую, и фразы вроде «у меня есть курица картошка рис».
  const knownAliases = [...synonymMap.entries()].sort((a,b)=>b[0].length-a[0].length);
  const parsePantry = (text) => {
    const parts = String(text).split(/[,;\n]+|\s+и\s+/i);
    const result = [];
    for (const part of parts) {
      const cleaned = canonical(part);
      if (!cleaned) continue;
      if (synonymMap.has(norm(part)) || synonyms[cleaned]) {result.push(cleaned);continue;}
      const string = ' ' + norm(part) + ' ';
      const occupied = new Set();
      const found = [];
      for (const [alias, name] of knownAliases) {
        let start = 0;
        while (start < string.length) {
          const at = string.indexOf(' ' + alias + ' ', start);
          if (at < 0) break;
          const from = at + 1, to = from + alias.length;
          if (![...Array(to-from)].some((_,i)=>occupied.has(from+i))) {
            for (let i=from;i<to;i++) occupied.add(i);
            found.push({name,from});
          }
          start = at + 1;
        }
      }
      if (found.length) result.push(...found.sort((a,b)=>a.from-b.from).map(x=>x.name));
      else result.push(cleaned);
    }
    return [...new Set(result.filter(Boolean))].slice(0,60);
  };
  const loadState = () => {
    try { const raw = JSON.parse(localStorage.getItem(storageKey) || '{}'); return raw && typeof raw === 'object' ? raw : {}; }
    catch { return {}; }
  };
  const saved = loadState();
  const state = {
    pantry: typeof saved.pantry === 'string' ? saved.pantry : '',
    favorites: new Set(Array.isArray(saved.favorites) ? saved.favorites : []),
    cooked: new Set(Array.isArray(saved.cooked) ? saved.cooked : []),
    shopping: Array.isArray(saved.shopping) ? saved.shopping.filter(x => x && typeof x.name === 'string').slice(0,200).map(x=>({name:short(x.name,80),amount:short(x.amount||'',40),done:!!x.done})) : [],
    catalogDifficulty:'all', category:'all', search:'', catalogLimit:12,
    rouletteDifficulty:'all', lastRandomId:null, spinning:false,
    hasSearched:false, showAllMatches:false, activeRecipeId:null
  };
  const save = () => { try { localStorage.setItem(storageKey,JSON.stringify({pantry:state.pantry,favorites:[...state.favorites],cooked:[...state.cooked],shopping:state.shopping})); } catch {} };
  const pantryItems = () => parsePantry(state.pantry);
  const getMatch = (recipe, pantry = pantryItems()) => {
    const required = recipe.ingredients.filter(x=>!x.optional);
    const have = required.filter(x=>pantry.includes(canonical(x.name)));
    const missing = required.filter(x=>!pantry.includes(canonical(x.name)));
    return { have, missing, total:required.length, score:(missing.length===0?1000:0)+have.length*19-missing.length*12+100*have.length/Math.max(1,required.length) };
  };

  let toastTimeout;
  const toast = (message) => {
    const node = $('#toast'); node.textContent = message; node.classList.add('show');
    clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>node.classList.remove('show'),2800);
  };
  const updateBagCount = () => { $('#bag-count').textContent = String(state.shopping.filter(x=>!x.done).length); };
  const quick = [{emoji:'🥚',name:'яйца'},{emoji:'🍅',name:'помидоры'},{emoji:'🥔',name:'картошка'},{emoji:'🍗',name:'курица'},{emoji:'🧀',name:'сыр'},{emoji:'🍚',name:'рис'},{emoji:'🍄',name:'грибы'},{emoji:'🥛',name:'молоко'}];
  $('#quick-ingredients').innerHTML = quick.map((x)=>`<button class="quick-chip" type="button" data-quick="${escapeHTML(x.name)}">${x.emoji} ${escapeHTML(x.name)} +</button>`).join('');
  $('#recipe-count').textContent = recipes.length;
  $('#pantry-input').value = state.pantry;
  $('#pantry-input').addEventListener('input',(e)=>{state.pantry=e.target.value;save();});

  function cardHTML(r, match=null) {
    const fav = state.favorites.has(r.id);
    const matchText = match ? (!match.missing.length ? '✓ Всё есть дома' : `Докупить: ${match.missing.slice(0,2).map(x=>x.name).join(', ')}${match.missing.length>2?'…':''}`) : null;
    return `<article class="recipe-card">
      <div class="recipe-hit" role="button" tabindex="0" aria-label="Открыть рецепт ${escapeHTML(r.name)}" data-open="${r.id}">
        <div class="recipe-visual tone-${toneOf(r)}"><span class="recipe-emoji" aria-hidden="true">${r.emoji}</span><span class="recipe-time-badge">◷ ${r.minutes} мин</span></div>
        <div class="recipe-body"><div class="card-topline"><span class="difficulty-tag difficulty-${r.difficulty}">${levels[r.difficulty]}</span><span class="category-tag">${categories[r.category]||'Рецепт'}</span></div>
        <h3>${escapeHTML(r.name)}</h3><p>${escapeHTML(r.description)}</p>
        ${matchText ? `<div class="missing-preview ${match.missing.length===0?'available':''}">${escapeHTML(matchText)}</div>` : ''}
        <div class="card-footer"><span>${state.cooked.has(r.id)?'✓ Уже готовила':'🍴 На '+r.serves+' порции'}</span><span class="card-arrow">↗</span></div></div>
      </div>
      <button class="favorite-btn ${fav?'is-favorite':''}" type="button" data-fav="${r.id}" aria-label="${fav?'Убрать из избранного':'Добавить в избранное'}: ${escapeHTML(r.name)}" aria-pressed="${fav}">${fav?'★':'☆'}</button>
    </article>`;
  }

  function renderCatalog() {
    const search = norm(state.search);
    const filtered = recipes.filter(r => (state.catalogDifficulty==='all'||r.difficulty===state.catalogDifficulty)
      && (state.category==='all'||r.category===state.category)
      && (!search || norm(r.name+' '+r.description+' '+r.ingredients.map(x=>x.name).join(' ')).includes(search)));
    $('#catalog-total').textContent = `Найдено: ${filtered.length} ${plural(filtered.length,'рецепт','рецепта','рецептов')}`;
    const grid = $('#catalog-grid');
    grid.innerHTML = filtered.length ? filtered.slice(0,state.catalogLimit).map(r=>cardHTML(r)).join('')
      : '<div class="empty-catalog">🥺 Ничего не нашлось. Попробуй другое название или сними фильтры.</div>';
    $('#show-more-btn').hidden = filtered.length <= state.catalogLimit;
    document.querySelectorAll('[data-catalog-difficulty]').forEach(btn=>{const active=btn.dataset.catalogDifficulty===state.catalogDifficulty;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
  }
  function plural(n,one,few,many){return n%10===1 && n%100!==11?one :n%10>=2 && n%10<=4 && (n%100<12||n%100>14)?few:many;}

  function renderMatches() {
    const box = $('#results');
    if(!state.hasSearched) {box.hidden=true;return;}
    box.hidden=false;
    const pantry = pantryItems();
    if(!pantry.length){box.innerHTML='<div class="empty-match">🥕 Для начала впиши хотя бы один продукт — например, <b>курица, рис, морковь</b>. Можно нажать на быстрые подсказки выше.</div>';return;}
    const matches = recipes.map(r=>({r,match:getMatch(r,pantry)})).filter(({match})=>match.have.length>0);
    matches.sort((a,b)=>Number(b.match.missing.length===0)-Number(a.match.missing.length===0)||a.match.missing.length-b.match.missing.length||b.match.score-a.match.score||a.r.minutes-b.r.minutes);
    const ready = matches.filter(x=>x.match.missing.length===0).length;
    const almost = matches.filter(x=>x.match.missing.length>0 && x.match.missing.length<=2).length;
    if (!matches.length) {box.innerHTML=`<div class="match-summary"><div><h3>Пока нет точных совпадений 🥕</h3><p>Попробуй написать основные продукты другими словами или посмотри рецепты ниже.</p></div></div>`;return;}
    const visible = matches.slice(0,state.showAllMatches?matches.length:9);
    box.innerHTML=`<div class="match-summary"><div><h3>Вот что можно приготовить ✨</h3><p>Нашла ${matches.length} ${plural(matches.length,'идею','идеи','идей')} по твоим продуктам. Сначала — блюда с минимумом покупок.</p></div>
      <div class="match-metrics"><span class="metric-pill">✓ Уже можно: ${ready}</span><span class="metric-pill missing">＋ Докупить 1–2: ${almost}</span></div></div>
      <div class="recipe-grid compact">${visible.map(({r,match})=>cardHTML(r,match)).join('')}</div>
      ${matches.length>9?`<div class="show-more-wrap"><button class="btn btn-outline" data-show-matches type="button">${state.showAllMatches?'Свернуть ↑':`Показать ещё ${matches.length-9} ↓`}</button></div>`:''}`;
  }
  function renderFavorites(){
    const favorites=recipes.filter(r=>state.favorites.has(r.id));
    $('#favorites-content').innerHTML=favorites.length ? favorites.map(r=>`<div class="small-recipe"><span class="small-recipe-emoji">${r.emoji}</span><span class="small-recipe-details"><strong>${escapeHTML(r.name)}</strong><small>◷ ${r.minutes} мин · ${levels[r.difficulty]}</small></span><button class="small-open" type="button" data-open="${r.id}" aria-label="Открыть ${escapeHTML(r.name)}">↗</button><button class="small-open" type="button" data-fav="${r.id}" aria-label="Убрать из избранного">×</button></div>`).join('')
      :'<div class="personal-empty"><span>⭐</span><strong>Пока нет избранных рецептов</strong>Нажми ☆ на карточке рецепта, чтобы сохранить его сюда.</div>';
  }
  function renderShopping(){
    $('#shopping-content').innerHTML=state.shopping.length ? `<ul class="shopping-list">${state.shopping.map((item,i)=>`<li class="shopping-row ${item.done?'done':''}"><label><input type="checkbox" data-shop-check="${i}" ${item.done?'checked':''}><span class="shopping-text">${escapeHTML(item.name)}</span></label>${item.amount?`<span class="shopping-amount">${escapeHTML(item.amount)}</span>`:''}<button class="remove-shopping" type="button" data-shop-remove="${i}" aria-label="Убрать ${escapeHTML(item.name)}">×</button></li>`).join('')}</ul>`
      : '<div class="personal-empty"><span>🛍️</span><strong>Покупок пока нет</strong>Открой рецепт и добавь продукты, которых не хватает.</div>';
    updateBagCount();
  }
  function renderAll(){renderCatalog();renderMatches();renderFavorites();renderShopping();}

  function addShopping(items){
    let count=0;
    items.forEach(item=>{
      const name=short(item.name.trim(),80);
      if(!name) return;
      const existing=state.shopping.find(x=>canonical(x.name)===canonical(name));
      if(existing){if(existing.done)existing.done=false;return;}
      state.shopping.push({name,amount:short(item.amount||'',40),done:false});count++;
    });
    save();renderShopping();
    toast(count?`🛍️ Добавлено в покупки: ${count}`:'Эти продукты уже есть в списке');
  }
  function openRecipe(id){
    const r=recipes.find(x=>x.id===id);
    if(!r)return;
    state.activeRecipeId=id;
    const match=getMatch(r);
    const hasPantry=pantryItems().length>0;
    const fav=state.favorites.has(id);
    const cooked=state.cooked.has(id);
    const hasMissing=match.missing.length>0;
    $('#dialog-content').innerHTML=`
      <div class="dialog-hero tone-${toneOf(r)}"><span aria-hidden="true">${r.emoji}</span></div>
      <div class="dialog-inside"><div class="section-kicker">✦ ГОТОВИМ С УДОВОЛЬСТВИЕМ</div>
      <h2 id="dialog-title">${escapeHTML(r.name)}</h2><p class="dialog-description">${escapeHTML(r.description)}</p>
      <div class="dialog-meta"><span>◷ ${r.minutes} минут</span><span>${levels[r.difficulty]}</span><span>🍴 ${r.serves} порции</span>${cooked?'<span>✓ Уже готовила</span>':''}</div>
      <div class="dialog-content-columns">
       <div class="dialog-panel"><h3>🧺 Что понадобится</h3><ul class="ingredient-list">${r.ingredients.map(item=>{
         const owned=pantryItems().includes(canonical(item.name));
         const color=item.optional?'optional-ingredient':(!hasPantry?'':owned?'has-it':'need-it');
         const marker=item.optional?'＋':(!hasPantry?'·':owned?'✓':'＋');
         return `<li><span class="${color}">${marker} ${escapeHTML(item.name)}${item.optional?' (по желанию)':''}</span><small>${escapeHTML(item.amount)}</small></li>`;
       }).join('')}</ul>
       ${hasPantry?`<p class="shopping-help">${match.missing.length===0?'💚 Всё основное у тебя уже есть!':`🛍️ Не хватает: ${match.missing.map(x=>escapeHTML(x.name)).join(', ')}.`}</p>`:''}
       </div>
       <div class="dialog-steps"><h3>👩‍🍳 Как приготовить</h3><ol>${r.steps.map(step=>`<li>${escapeHTML(step)}</li>`).join('')}</ol></div>
      </div>
      <div class="upgrade-box"><strong>✨ Сделать ещё вкуснее</strong><p>${escapeHTML(r.upgrade)}</p><p class="pair-line"><strong>🍽️ Для полноценного ужина:</strong> ${escapeHTML(r.pair)}</p></div>
      <div class="dialog-actions"><button class="btn btn-primary" type="button" data-add-missing="${r.id}" ${hasMissing?'':'disabled'}>${hasMissing?`🛍️ Добавить недостающее (${match.missing.length})`:'✓ Всё необходимое есть'}</button><button class="btn btn-outline" type="button" data-modal-fav="${r.id}">${fav?'★ В избранном':'☆ В избранное'}</button><button class="btn btn-outline" type="button" data-cooked="${r.id}">${cooked?'✓ Приготовлено':'🍳 Я приготовила!'}</button></div>
      </div>`;
    const dialog=$('#recipe-dialog');
    if(!dialog.open) dialog.showModal();
    $('#close-dialog').focus();
  }

  function toggleFavorite(id){if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);save();renderFavorites();renderCatalog();renderMatches();if($('#recipe-dialog').open && state.activeRecipeId===id)openRecipe(id);toast(state.favorites.has(id)?'★ Добавлено в избранное':'Убрано из избранного');}
  function toggleCooked(id){if(state.cooked.has(id))state.cooked.delete(id);else state.cooked.add(id);save();renderCatalog();renderMatches();if($('#recipe-dialog').open && state.activeRecipeId===id)openRecipe(id);toast(state.cooked.has(id)?'Ура! Ещё один вкусный ужин 🎉':'Отметка снята');}

  document.addEventListener('click',(e)=>{
    const btn=e.target.closest('button,[data-open]');
    if(!btn)return;
    if(btn.dataset.quick){const value=btn.dataset.quick;const items=pantryItems();if(items.includes(canonical(value))){toast('Этот продукт уже указан');return;}state.pantry=state.pantry.trim().replace(/[,;\s]+$/,'')+(state.pantry.trim()?', ':'')+value;$('#pantry-input').value=state.pantry;save();toast(`Добавлено: ${value}`);return;}
    if(btn.dataset.fav){toggleFavorite(btn.dataset.fav);return;}
    if(btn.dataset.modalFav){toggleFavorite(btn.dataset.modalFav);return;}
    if(btn.dataset.cooked){toggleCooked(btn.dataset.cooked);return;}
    if(btn.dataset.addMissing){const r=recipes.find(x=>x.id===btn.dataset.addMissing);if(r)addShopping(getMatch(r).missing);return;}
    if(btn.hasAttribute('data-show-matches')){state.showAllMatches=!state.showAllMatches;renderMatches();return;}
    if(btn.dataset.open){openRecipe(btn.dataset.open);return;}
    if(btn.dataset.shopRemove!==undefined){const index=Number(btn.dataset.shopRemove);if(Number.isInteger(index)&&index>=0&&index<state.shopping.length){state.shopping.splice(index,1);save();renderShopping();}return;}
  });
  document.addEventListener('keydown',(e)=>{
    if((e.key==='Enter'||e.key===' ') && e.target.matches('[data-open][role="button"]')){e.preventDefault();openRecipe(e.target.dataset.open);}
    if(e.key==='Enter' && e.target===$('#pantry-input') && (e.ctrlKey||e.metaKey)){e.preventDefault();runSearch();}
  });
  document.addEventListener('change',(e)=>{
    if(e.target.matches('[data-shop-check]')){const i=Number(e.target.dataset.shopCheck);if(state.shopping[i]){state.shopping[i].done=e.target.checked;save();renderShopping();}}
  });

  function runSearch(){state.pantry=$('#pantry-input').value;state.hasSearched=true;state.showAllMatches=false;save();renderMatches();$('#results').scrollIntoView({behavior:'smooth',block:'nearest'});}
  $('#find-btn').addEventListener('click',runSearch);
  document.querySelectorAll('[data-catalog-difficulty]').forEach(btn=>btn.addEventListener('click',()=>{state.catalogDifficulty=btn.dataset.catalogDifficulty;state.catalogLimit=12;renderCatalog();}));
  $('#category-select').addEventListener('change',e=>{state.category=e.target.value;state.catalogLimit=12;renderCatalog();});
  $('#recipe-search').addEventListener('input',e=>{state.search=e.target.value;state.catalogLimit=12;renderCatalog();});
  $('#show-more-btn').addEventListener('click',()=>{state.catalogLimit+=12;renderCatalog();});
  document.querySelectorAll('[data-random-difficulty]').forEach(btn=>btn.addEventListener('click',()=>{
    if(state.spinning)return;
    state.rouletteDifficulty=btn.dataset.randomDifficulty;
    document.querySelectorAll('[data-random-difficulty]').forEach(el=>{const active=el===btn;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
  }));
  const chooseRandom = (pool) => {
    const options=pool.length>1?pool.filter(r=>r.id!==state.lastRandomId):pool;
    return options[Math.floor(Math.random()*options.length)];
  };
  function renderRandom(r, spinning=false){
    const out=$('#random-output');out.classList.toggle('spinning',spinning);
    out.innerHTML=`<div class="random-orbit" aria-hidden="true"><span>🍜</span><span>🍕</span><span>🥟</span></div><div class="roulette-result"><span class="roll-kicker">${spinning?'ИЩЕМ ЧТО-ТО ВКУСНОЕ…':'✨ СЕГОДНЯ ГОТОВИМ'}</span><span class="roll-emoji" aria-hidden="true">${r.emoji}</span><h3>${escapeHTML(r.name)}</h3><p>${r.minutes} мин · ${levels[r.difficulty]}</p><button type="button" class="btn btn-primary" ${spinning?'disabled':''} data-open="${r.id}">Посмотреть рецепт ↗</button></div>`;
  }
  // Шуточная пасхалка внутри обычной рулетки. Кнопка не предлагает заказать или купить напитки.
  $('#beer-break-btn').addEventListener('click',()=>{
    if(state.spinning)return;
    const out=$('#random-output');
    out.classList.remove('spinning');
    out.innerHTML=`<div class="random-orbit" aria-hidden="true"><span>🍻</span><span>🥨</span><span>🍺</span></div><div class="roulette-result beer-result"><span class="roll-kicker">ПЛАН НА ВЕЧЕР ИЗМЕНИЛСЯ</span><span class="roll-emoji" aria-hidden="true">🍺</span><h3>ДАВАЙ ЕБАНЁМ ПИВА!</h3><p>В пизду всё, заебал Максим. Сегодня рулетка объявляет выходной от готовки.</p><button type="button" class="btn btn-primary" id="beer-back-to-food">Ладно, давай всё-таки поедим ↻</button></div>`;
    const back=out.querySelector('#beer-back-to-food');
    back.addEventListener('click',()=>$('#spin-btn').click());
  });
  $('#spin-btn').addEventListener('click',()=>{
    if(state.spinning)return;
    const pool=recipes.filter(r=>state.rouletteDifficulty==='all'||r.difficulty===state.rouletteDifficulty);
    if(!pool.length)return;
    state.spinning=true;$('#spin-btn').disabled=true;$('#beer-break-btn').disabled=true;
    let ticks=0;
    const interval=setInterval(()=>{renderRandom(pool[Math.floor(Math.random()*pool.length)],true);ticks++;if(ticks>=11){clearInterval(interval);const r=chooseRandom(pool);state.lastRandomId=r.id;state.spinning=false;$('#spin-btn').disabled=false;$('#beer-break-btn').disabled=false;$('#spin-btn').innerHTML='Ещё раз! <span aria-hidden="true">↻</span>';renderRandom(r);}},75);
  });
  $('#manual-shopping-form').addEventListener('submit',e=>{e.preventDefault();const input=$('#manual-shopping');if(!input.value.trim())return;addShopping([{name:input.value.trim(),amount:''}]);input.value='';});
  $('#clear-done').addEventListener('click',()=>{const before=state.shopping.length;state.shopping=state.shopping.filter(x=>!x.done);save();renderShopping();toast(before!==state.shopping.length?'Купленные продукты убраны ✓':'Пока нет отмеченных покупок');});
  $('#copy-shopping').addEventListener('click',async()=>{
    const remaining=state.shopping.filter(x=>!x.done);
    if(!remaining.length){toast('Список пока пуст');return;}
    const text='🛍️ Покупки для ужинчика:\n'+remaining.map(x=>`• ${x.name}${x.amount?' — '+x.amount:''}`).join('\n');
    try{if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');await navigator.clipboard.writeText(text);toast('Список скопирован!');}
    catch{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();try{const success=document.execCommand('copy');toast(success?'Список скопирован!':'Не получилось скопировать — попробуй позже');}catch{toast('Не получилось скопировать — попробуй позже');}area.remove();}
  });
  $('#close-dialog').addEventListener('click',()=>$('#recipe-dialog').close());
  $('#recipe-dialog').addEventListener('click',e=>{if(e.target===$('#recipe-dialog'))$('#recipe-dialog').close();});
  $('#recipe-dialog').addEventListener('close',()=>{state.activeRecipeId=null;});

  renderAll();
  // Не используется в интерфейсе; простые функции для автоматической проверки сайта.
  window.DINNER_TEST = {canonical,parsePantry,getMatch,recipesCount:recipes.length};
})();
