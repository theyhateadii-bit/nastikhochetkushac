/* Ужинчик: дополнительный подбор блюд и меню на неделю. Без API и дополнительных сервисов. */
(function () {
  'use strict';
  const recipes = Array.isArray(window.DINNER_RECIPES) ? window.DINNER_RECIPES : [];
  const app = window.DINNER_APP;
  if (!recipes.length || !app) return;
  const $ = (q) => document.querySelector(q);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const byId = new Map(recipes.map(r => [r.id, r]));
  const weekdays = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
  const key = 'nastik-week-menu-v1';
  let week = [];
  let lastLazy = null;
  let lastMoodIds = [];

  function pick(list, avoidId=null) {
    const pool = list.filter(r => r.id !== avoidId);
    const candidates = pool.length ? pool : list;
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random()*candidates.length)];
  }
  function shuffle(list) {
    const out = [...list];
    for (let i=out.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [out[i],out[j]]=[out[j],out[i]];
    }
    return out;
  }
  function recipeMini(r) {
    return `<span class="smart-food-icon" aria-hidden="true">${esc(r.emoji)}</span><div class="smart-recipe-info"><strong>${esc(r.name)}</strong><small>${r.minutes} мин · ${r.ingredients.filter(x=>!x.optional).length} осн. ингредиента</small></div><button type="button" class="tiny-recipe-btn" data-open="${esc(r.id)}">Рецепт ↗</button>`;
  }

  // Минимум действий на кухне: только действительно быстрые и несложные блюда.
  const lazyPool = recipes.filter(r => r.difficulty === 'easy' && r.minutes <= 15 && r.category !== 'dessert');
  function showLazy() {
    let list = lazyPool;
    if ($('#lazy-pantry-only').checked) {
      const pantry = app.pantryItems();
      if (!pantry.length) {
        $('#lazy-result').innerHTML = '<div class="smart-empty">Сначала укажи продукты в разделе «Что есть дома?» — тогда подберём блюдо без покупок. <a href="#pantry">Перейти к продуктам ↗</a></div>';
        return;
      }
      list = list.filter(r => app.getMatch(r).missing.length===0);
    }
    const sorted = shuffle(list).sort((a,b) => a.ingredients.filter(x=>!x.optional).length - b.ingredients.filter(x=>!x.optional).length);
    const pool = sorted.slice(0,Math.max(3,Math.ceil(sorted.length*.7)));
    const r = pick(pool,lastLazy);
    if (!r) {
      $('#lazy-result').innerHTML = '<div class="smart-empty">С такими продуктами нет блюда до 15 минут. Сними галочку или добавь ингредиенты.</div>';
      return;
    }
    lastLazy = r.id;
    $('#lazy-result').innerHTML = `<div class="smart-recipe">${recipeMini(r)}</div>`;
  }

  // Продукты для «без мяса»: учитываем именно обязательные ингредиенты.
  const animalFoods = /куриц|говядин|свинин|фарш|мяс|колбас|ветчин|сосис|бекон|рыб|лосос|семг|сёмг|тунц|кревет|морепродукт|индейк|баранин|окороч|крыль/i;
  const moodRules = {
    any:r => r.category!=='dessert',
    hearty:r => ['hot','soup'].includes(r.category) && r.minutes>=15,
    light:r => ['salad','soup','breakfast'].includes(r.category) && r.minutes<=45,
    soup:r => r.category==='soup',
    veggie:r => r.category!=='dessert' && !r.ingredients.some(x=>!x.optional && animalFoods.test(x.name)),
    comfort:r => r.category!=='dessert' && /сыр|карто|паст|макарон|омлет|жарен|запеч|сливоч|гречк|лазан|гриб|кесадил/i.test(r.name+' '+r.description)
  };
  function showMood() {
    const type=$('#mood-type').value;
    const minutes=$('#mood-time').value;
    const filtered=recipes.filter(r => (moodRules[type]||moodRules.any)(r) && (minutes==='any'||r.minutes<=Number(minutes)));
    if (!filtered.length) {
      $('#mood-result').innerHTML='<div class="smart-empty">Под такое настроение и время пока нет вариантов. Попробуй увеличить время или изменить пожелание.</div>';
      return;
    }
    const avoiding=filtered.filter(r => !lastMoodIds.includes(r.id));
    const first=shuffle(avoiding).slice(0,3);
    if (first.length<Math.min(filtered.length,3)) first.push(...shuffle(filtered.filter(r=>!first.some(x=>x.id===r.id))).slice(0,3-first.length));
    lastMoodIds=first.map(r=>r.id);
    $('#mood-result').innerHTML=`<div class="mood-list">${first.map(r=>`<div class="smart-recipe">${recipeMini(r)}</div>`).join('')}</div>${first.length<3?'<p class="smart-hint">Это все варианты, которые подходят под выбранные условия.</p>':''}`;
  }

  // Меню: стараемся чередовать типы блюд и время приготовления в течение недели.
  function candidatesForDay(day) {
    const main = recipes.filter(r=>r.category==='hot');
    const soups = recipes.filter(r=>r.category==='soup');
    const pools=[
      main.filter(r=>r.difficulty==='easy'&&r.minutes<=35),
      main.filter(r=>r.minutes>=20&&r.minutes<=60),
      soups,
      main.filter(r=>r.difficulty==='easy'&&r.minutes<=40),
      main.filter(r=>r.minutes>=25&&r.minutes<=65),
      main.filter(r=>r.minutes>=30),
      [...soups,...main.filter(r=>r.minutes<=45)]
    ];
    return pools[day].length ? pools[day] : [...main,...soups];
  }
  function createWeek() {
    const picked=[];
    for (let day=0; day<7; day++) {
      const base=candidatesForDay(day).filter(r=>!picked.some(x=>x.id===r.id));
      const any=recipes.filter(r=>!picked.some(x=>x.id===r.id) && ['hot','soup'].includes(r.category));
      const r=pick(base.length?base:any);
      if(r)picked.push(r);
    }
    return picked;
  }
  function safeRead() {
    try {
      const found=JSON.parse(localStorage.getItem(key)||'null');
      if(!Array.isArray(found)||found.length!==7)return [];
      const rs=found.map(id=>byId.get(id));
      if(rs.some(r=>!r)||new Set(found).size!==7)return [];
      return rs;
    } catch {return []}
  }
  function persist() {
    try {localStorage.setItem(key,JSON.stringify(week.map(r=>r.id)));} catch {}
  }
  function renderWeek() {
    $('#week-shopping').disabled=week.length!==7;
    if(week.length!==7){$('#week-grid').innerHTML='<div class="week-placeholder">Нажми «Составить меню», чтобы получить 7 идей для ужина.</div>';return;}
    $('#week-grid').innerHTML=week.map((r,i)=>`<article class="day-card">
      <div class="day-card-head"><span class="day-number">ДЕНЬ ${i+1}</span><span class="day-name">${weekdays[i]}</span></div>
      <span class="day-emoji" aria-hidden="true">${esc(r.emoji)}</span>
      <h3>${esc(r.name)}</h3><p class="day-meta">${r.minutes} мин · ${r.difficulty==='easy'?'Легко':r.difficulty==='medium'?'Средне':'Сложно'}</p>
      <div class="day-actions"><button type="button" class="day-open" data-open="${esc(r.id)}">Рецепт ↗</button><button type="button" class="day-swap" data-week-swap="${i}" aria-label="Поменять блюдо на ${weekdays[i].toLowerCase()}" title="Другое блюдо">↻</button></div>
    </article>`).join('');
  }
  function swapDay(index) {
    if(!Number.isInteger(index)||index<0||index>=7||week.length!==7)return;
    const used=new Set(week.filter((r,i)=>i!==index).map(r=>r.id));
    let pool=candidatesForDay(index).filter(r=>!used.has(r.id) && r.id!==week[index].id);
    if(!pool.length)pool=recipes.filter(r=>['hot','soup'].includes(r.category)&&!used.has(r.id)&&r.id!==week[index].id);
    const r=pick(pool);
    if(!r)return;
    week[index]=r;persist();renderWeek();
  }
  function addWeekShopping() {
    if(week.length!==7)return;
    const missing=week.flatMap(r=>app.getMatch(r).missing);
    const names=new Set();
    const unique=missing.filter(item=>{
      const normalized=String(item.name).toLowerCase().replace(/ё/g,'е').trim();
      if(names.has(normalized))return false;
      names.add(normalized);return true;
    });
    if(!unique.length){$('#week-notice').textContent='Все обязательные продукты для меню уже отмечены дома.';return;}
    app.addShopping(unique);
    $('#week-notice').textContent='Недостающие продукты добавлены в покупки. Одинаковые продукты не дублируются; количества по рецептам пока не суммируются.';
    document.querySelector('#shopping').scrollIntoView({behavior:'smooth',block:'start'});
  }

  $('#lazy-pick').addEventListener('click',showLazy);
  $('#lazy-pantry-only').addEventListener('change',showLazy);
  $('#mood-pick').addEventListener('click',showMood);
  $('#week-generate').addEventListener('click',()=>{week=createWeek();persist();renderWeek();});
  $('#week-shopping').addEventListener('click',addWeekShopping);
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-week-swap]');
    if(btn)swapDay(Number(btn.dataset.weekSwap));
  });
  week=safeRead();renderWeek();
  // Только для тестирования нового функционала.
  window.DINNER_PLANNER_TEST={createWeek,candidatesForDay,moodRules,lazyCount:lazyPool.length,swapDay,renderWeek};
})();
