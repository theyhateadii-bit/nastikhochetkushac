/* Ужинчик — мини-игра, бюджет, десерты и личная книга рецептов. Полностью локальная версия. */
(function () {
  'use strict';
  const recipes = Array.isArray(window.DINNER_RECIPES) ? window.DINNER_RECIPES : [];
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const randint = max => Math.floor(Math.random() * max);
  const shuffle = data => {const a=[...data];for(let i=a.length-1;i>0;i--){const j=randint(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
  const read = (key,fallback) => {try {const value=JSON.parse(localStorage.getItem(key));return value ?? fallback;} catch{return fallback;}};
  const write = (key,value) => {try {localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
  const levels={easy:'Легко',medium:'Средне',hard:'Сложно'};
  const types={hot:'Горячее',soup:'Суп',salad:'Салат',snack:'Перекус',breakfast:'Завтрак',dessert:'Сладкое'};
  const show = id => {const e=document.getElementById(id); if(e && !e.open) e.showModal();};
  // Даже если блюдо скрыто фильтрами каталога, встроенный обработчик app.js найдёт его по ID.
  const invokeBase = id => {const el=document.createElement('button');el.type='button';el.hidden=true;el.dataset.open=id;document.body.append(el);el.click();el.remove();};
  const openAny = r => {if(!r)return;r.custom?openMyRecipe(r.id):invokeBase(r.id);};
  function snackToast(message){const toast=$('#toast');if(!toast)return;toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3000);}

  // 1. Битва блюд: победитель остаётся, противник меняется. Каждый соперник уникален.
  let battle = null;
  const battlePool=()=>recipes.filter(x=>x.category!=='dessert').concat(myRecipes.filter(x=>x.category!=='dessert'));
  function startBattle(){
    const pool=shuffle(battlePool());
    if(pool.length<2)return;
    const [champion,opponent,...remaining]=pool;
    battle={champion,opponent,remaining,round:1,total:Math.min(6,pool.length-1),finished:false};
    renderBattle();
  }
  function renderBattle(){
    const area=$('#battle-board');
    if(!battle){area.innerHTML='<div class="feature-empty">Нажми «Начать битву», чтобы выбрать ужин без долгих раздумий.</div>';return;}
    if(battle.finished){area.innerHTML=`<div class="battle-winner"><div class="battle-crown">🏆</div><div class="mini-eyebrow">ПОБЕДИТЕЛЬ БИТВЫ</div><h3>${esc(battle.champion.name)}</h3><p>${esc(battle.champion.description||'Сегодня готовим это!')}</p><div class="feature-actions"><button class="btn btn-primary" type="button" data-battle-open>Смотреть рецепт ↗</button><button class="btn btn-outline" type="button" data-battle-restart>Новая битва ↻</button></div></div>`;return;}
    const card=(r,side)=>`<button class="battle-dish" type="button" data-battle-side="${side}"><span class="battle-dish-emoji">${esc(r.emoji||'🍽️')}</span><span class="battle-dish-name">${esc(r.name)}</span><span class="battle-dish-details">◷ ${Number(r.minutes)||20} мин · ${levels[r.difficulty]||'Рецепт'}</span><span class="battle-vote">Выбрать →</span></button>`;
    area.innerHTML=`<div class="battle-progress"><span>Раунд ${battle.round} из ${battle.total}</span><span>Кто вкуснее?</span></div><div class="battle-meter"><span style="width:${Math.round((battle.round-1)/battle.total*100)}%"></span></div><div class="battle-versus">${card(battle.champion,'left')}<div class="versus-label">VS</div>${card(battle.opponent,'right')}</div><p class="battle-hint">Выбранное блюдо проходит в следующий раунд.</p>`;
  }
  $('#battle-start').addEventListener('click',startBattle);
  $('#battle-board').addEventListener('click',event=>{
    const btn=event.target.closest('button');if(!btn)return;
    if(btn.hasAttribute('data-battle-open')){openAny(battle?.champion);return;}
    if(btn.hasAttribute('data-battle-restart')){startBattle();return;}
    if(!battle || battle.finished || !btn.dataset.battleSide)return;
    if(btn.dataset.battleSide==='right')battle.champion=battle.opponent;
    if(battle.round>=battle.total || !battle.remaining.length){battle.finished=true;renderBattle();return;}
    battle.opponent=battle.remaining.shift();battle.round++;renderBattle();
  });

  // 2. Примерные цены: ₽ за кг/л/штуку (или особую единицу). Это не онлайн-цены.
  const priceSeed={
    'баклажан':[90,'шт'],'болгарский перец':[100,'шт'],'говядина':[980,'кг'],'гречка':[150,'кг'],
    'грибы':[350,'кг'],'дрожжи':[1600,'кг'],'зеленый горошек':[350,'кг'],'имбирь':[500,'кг'],
    'кабачок':[115,'шт'],'капуста':[85,'кг'],'картофель':[23,'шт'],'кинза':[75,'пучок'],
    'кокосовое молоко':[480,'л'],'колбаса':[620,'кг'],'креветки':[1250,'кг'],
    'куриные крылья':[350,'кг'],'курица':[390,'кг'],'кускус':[270,'кг'],
    'лаваш':[40,'лист'],'лайм':[65,'шт'],'лапша':[230,'кг'],'лимон':[65,'шт'],
    'листы лазаньи':[25,'шт'],'лук':[14,'шт'],'макароны':[175,'кг'],'мед':[900,'кг'],
    'молоко':[125,'л'],'морковь':[20,'шт'],'мука':[95,'кг'],'огурец':[55,'шт'],
    'оливки':[850,'кг'],'паприка':[1100,'кг'],'паста том ям':[1650,'кг'],
    'помидор':[42,'шт'],'рис':[160,'кг'],'рыба':[780,'кг'],'салатные листья':[750,'кг'],
    'сахар':[100,'кг'],'свекла':[26,'шт'],'сливки':[420,'л'],'сливочное масло':[1250,'кг'],
    'слоеное тесто':[480,'кг'],'сметана':[370,'кг'],'соевый соус':[450,'л'],
    'сосиски':[580,'кг'],'сулугуни':[850,'кг'],'сыр':[820,'кг'],'творог':[490,'кг'],
    'томатная паста':[450,'кг'],'тунец':[220,'банка'],'фарш':[690,'кг'],
    'фета':[1200,'кг'],'хлеб':[14,'ломтик'],'чеснок':[6,'зубчик'],'чечевица':[250,'кг'],
    'яйцо':[14,'шт'],'корица':[1900,'кг'],'творожный сыр':[980,'кг'],
    'сахарная пудра':[200,'кг'],'клюква':[850,'кг'],'разрыхлитель':[650,'кг'],
    'апельсин':[65,'шт'],'шоколад':[1900,'кг'],'какао':[1150,'кг'],
    'яблоко':[40,'шт'],'банан':[30,'шт'],'манка':[140,'кг'],'йогурт':[330,'кг'],
    'печенье':[340,'кг'],'ягоды':[950,'кг']
  };
  const pricesKey='nastik-budget-prices-v1';
  const loaded=read(pricesKey,{});
  const prices={};
  for(const [name,[value]] of Object.entries(priceSeed)){const custom=Number(loaded?.[name]);prices[name]=Number.isFinite(custom)&&custom>0&&custom<100000?custom:value;}
  const money=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
  function qty(amount,unit){
    const s=String(amount||'').toLowerCase().replace(/,/g,'.');
    if(s==='по вкусу')return null;
    const f=s.match(/(\d+)\s*\/\s*(\d+)/);
    const range=s.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/);
    let n=f?Number(f[1])/Number(f[2]):range?(Number(range[1])+Number(range[2]))/2:Number((s.match(/\d+(?:\.\d+)?/)||[])[0]);
    if(!Number.isFinite(n))return null;
    if(/кг(?:\s|$)/.test(s))return unit==='кг'?n*1000:null;
    if(/(?:^|\s)г(?:\s|$)|(?:^|\s)гр(?:\s|$)/.test(s))return unit==='кг'?n:null;
    if(/мл(?:\s|$)/.test(s))return unit==='л'?n:null;
    if(/(?:^|\s)л(?:\s|$)/.test(s) && !/ст\.?\s*л|ч\.?\s*л/.test(s))return unit==='л'?n*1000:null;
    if(/ст\.?\s*л/.test(s))return unit==='кг'||unit==='л'?n*15:null;
    if(/ч\.?\s*л/.test(s))return unit==='кг'||unit==='л'?n*5:null;
    if(/зубчик/.test(s))return unit==='зубчик'?n:null;
    if(/ломтик/.test(s))return unit==='ломтик'?n:null;
    if(/листа|лист\b/.test(s))return unit==='лист'?n:null;
    if(/банка/.test(s))return unit==='банка'?n:null;
    if(/пучок/.test(s))return unit==='пучок'?n:null;
    if(/головка/.test(s))return unit==='зубчик'?n*8:unit==='шт'?n:null;
    if(/шт/.test(s))return unit==='шт'?n:null;
    return unit==='шт'?n:null;
  }
  function estimate(recipe,servings){
    if(recipe.custom){const cost=Number(recipe.estimatedCost);return cost>0?{total:cost/recipe.serves*servings,unknown:[]}:null;}
    const unknown=[];let sum=0;
    recipe.ingredients.filter(x=>!x.optional).forEach(x=>{
      const entry=priceSeed[x.name],price=prices[x.name];
      if(!entry||!Number.isFinite(price)){unknown.push(x.name);return;}
      const amount=qty(x.amount,entry[1]);if(amount===null){unknown.push(x.name);return;}
      sum+=price*(entry[1]==='кг'||entry[1]==='л'?amount/1000:amount);
    });
    return unknown.length?{total:sum/Math.max(1,recipe.serves)*servings,unknown}: {total:sum/Math.max(1,recipe.serves)*servings,unknown:[]};
  }
  let budgetCount=9;
  let budgetLimit=300;
  let budgetServings=1;
  const dinnerPool=()=>recipes.filter(r=>r.category!=='dessert').concat(myRecipes.filter(r=>r.category!=='dessert' && r.estimatedCost>0));
  function renderBudget(){
    const list=dinnerPool().map(r=>({r,c:estimate(r,budgetServings)})).filter(x=>x.c&&!x.c.unknown.length&&x.c.total<=budgetLimit).sort((a,b)=>a.c.total-b.c.total);
    $('#budget-summary').textContent=`${list.length} ${list.length===1?'блюдо':list.length<5?'блюда':'блюд'} в бюджете до ${money(budgetLimit)} на ${budgetServings} ${budgetServings===1?'порцию':'порции'}`;
    $('#budget-grid').innerHTML=list.length?list.slice(0,budgetCount).map(({r,c})=>`<button class="budget-card" type="button" data-budget-open="${esc(r.id)}"><span class="budget-emoji">${esc(r.emoji)}</span><span class="budget-dish"><strong>${esc(r.name)}</strong><small>◷ ${r.minutes} мин · ${levels[r.difficulty]}</small></span><span class="budget-cost">≈ ${money(c.total)}<small>на ${budgetServings} ${budgetServings===1?'порцию':'порции'}</small></span></button>`).join(''):'<div class="feature-empty">Пока не нашли блюд в этом бюджете. Попробуй увеличить сумму или изменить цены продуктов.</div>';
    $('#budget-more').hidden=budgetCount>=list.length;
  }
  function renderPriceList(){
    const box=$('#price-list');
    box.innerHTML=Object.entries(priceSeed).sort((a,b)=>a[0].localeCompare(b[0],'ru')).map(([name,[,unit]])=>`<label class="price-line"><span>${esc(name)} <small>₽ за ${unit}</small></span><input type="number" inputmode="decimal" min="1" max="99999" step="1" data-price-name="${esc(name)}" value="${prices[name]}" aria-label="Цена: ${esc(name)}"></label>`).join('');
  }
  document.querySelectorAll('[data-budget-max]').forEach(btn=>btn.addEventListener('click',()=>{
    budgetLimit=Number(btn.dataset.budgetMax);budgetCount=9;
    document.querySelectorAll('[data-budget-max]').forEach(x=>{const on=x===btn;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});renderBudget();
  }));
  $('#budget-servings').addEventListener('change',e=>{budgetServings=Number(e.target.value)||1;budgetCount=9;renderBudget();});
  $('#budget-more').addEventListener('click',()=>{budgetCount+=9;renderBudget();});
  $('#budget-grid').addEventListener('click',e=>{const button=e.target.closest('[data-budget-open]');if(button){const r=dinnerPool().find(x=>x.id===button.dataset.budgetOpen);openAny(r);}});
  $('#price-list').addEventListener('change',e=>{
    const input=e.target.closest('[data-price-name]');if(!input)return;
    const n=Number(input.value);
    if(n>0&&n<=99999){prices[input.dataset.priceName]=n;write(pricesKey,prices);renderBudget();}else input.value=prices[input.dataset.priceName];
  });
  $('#price-reset').addEventListener('click',()=>{for(const [k,[v]] of Object.entries(priceSeed))prices[k]=v;write(pricesKey,prices);renderPriceList();renderBudget();snackToast('Примерные цены восстановлены');});

  // 3. Десерты. Новые рецепты расширяют общий каталог и имеют все стандартные инструкции.
  let dessertLast=null;
  function renderDesserts(){
    const all=recipes.filter(r=>r.category==='dessert');
    $('#dessert-count').textContent=`${all.length} рецептов`;
    $('#dessert-grid').innerHTML=all.map(r=>`<button type="button" class="dessert-card" data-dessert-open="${esc(r.id)}"><span class="dessert-emoji">${esc(r.emoji)}</span><strong>${esc(r.name)}</strong><small>${r.minutes} мин · ${levels[r.difficulty]}</small><span class="dessert-next">Открыть рецепт ↗</span></button>`).join('');
  }
  $('#dessert-grid').addEventListener('click',e=>{const button=e.target.closest('[data-dessert-open]');if(button)invokeBase(button.dataset.dessertOpen);});
  $('#dessert-surprise').addEventListener('click',()=>{const all=recipes.filter(r=>r.category==='dessert');const candidates=all.filter(r=>r.id!==dessertLast);const dish=candidates[randint(candidates.length)]||all[0];if(!dish)return;dessertLast=dish.id;invokeBase(dish.id);});

  // 4. Личная книга: сохраняем рецепты только на устройстве, с импортом/экспортом JSON.
  const myKey='nastik-my-recipes-v1';
  const validDifficulty = x => ['easy','medium','hard'].includes(x)?x:'easy';
  const validCategory = x => Object.hasOwn(types,x)?x:'hot';
  function normalizePersonal(input){
    if(!input||typeof input!=='object')return null;
    const name=String(input.name||'').trim().slice(0,90);
    if(!name)return null;
    const rawIngredients=Array.isArray(input.ingredients)?input.ingredients:[];
    const rawSteps=Array.isArray(input.steps)?input.steps:[];
    const ingredients=rawIngredients.slice(0,40).filter(x=>x&&typeof x.name==='string').map(x=>({name:String(x.name).trim().slice(0,90),amount:String(x.amount||'по вкусу').slice(0,40),optional:!!x.optional})).filter(x=>x.name);
    const steps=rawSteps.slice(0,30).map(x=>String(x).trim().slice(0,550)).filter(Boolean);
    if(!ingredients.length||!steps.length)return null;
    return {id:/^my-[\w-]{8,}$/.test(String(input.id||''))?input.id:makeID(),name,
      emoji:/^[\p{Extended_Pictographic}]/u.test(String(input.emoji||''))?String(input.emoji).slice(0,4):'🍽️',
      difficulty:validDifficulty(input.difficulty),category:validCategory(input.category),
      minutes:Math.max(1,Math.min(480,Number(input.minutes)||25)),serves:Math.max(1,Math.min(16,Number(input.serves)||2)),
      description:String(input.description||'Домашний рецепт').slice(0,280),ingredients,steps,
      estimatedCost:Math.max(0,Math.min(100000,Number(input.estimatedCost)||0)),videoUrl:parseVideo(String(input.videoUrl||''))||'',custom:true};
  }
  function makeID(){return 'my-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);}
  function parseVideo(url){
    if(!url.trim())return '';
    try{const u=new URL(url);if(u.protocol!=='https:')return '';
      const h=u.hostname.toLowerCase();if(!['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtu.be','www.youtube-nocookie.com'].includes(h))return '';
      let id=h.includes('youtu.be')?u.pathname.slice(1):u.pathname.startsWith('/shorts/')?u.pathname.split('/')[2]:u.pathname.startsWith('/embed/')?u.pathname.split('/')[2]:u.searchParams.get('v');
      return /^[A-Za-z0-9_-]{11}$/.test(id||'')?`https://www.youtube-nocookie.com/embed/${id}`:'';
    }catch{return '';}
  }
  let myRecipes=Array.isArray(read(myKey,[]))?read(myKey,[]).slice(0,150).map(normalizePersonal).filter(Boolean):[];
  const saveMine=()=>write(myKey,myRecipes);
  function renderMine(){
    $('#mine-count').textContent=`${myRecipes.length} ${myRecipes.length===1?'рецепт':myRecipes.length<5?'рецепта':'рецептов'}`;
    $('#mine-grid').innerHTML=myRecipes.length?myRecipes.map(r=>`<article class="mine-card"><span class="mine-emoji">${esc(r.emoji)}</span><div class="mine-info"><strong>${esc(r.name)}</strong><span>◷ ${r.minutes} мин · ${levels[r.difficulty]} · ${r.serves} порц.</span></div><div class="mine-controls"><button type="button" data-mine-view="${esc(r.id)}" aria-label="Открыть ${esc(r.name)}">Смотреть ↗</button><button type="button" data-mine-edit="${esc(r.id)}">Изменить</button><button type="button" class="mine-danger" data-mine-delete="${esc(r.id)}">Удалить</button></div></article>`).join(''):'<div class="feature-empty">Тут пока пусто. Добавь свой первый рецепт: любимую пасту, фирменные блинчики или семейное блюдо.</div>';
    $('#my-export').disabled=!myRecipes.length;
  }
  function textIngredients(list){return list.map(x=>(x.optional?'?':'')+x.name+(x.amount?' | '+x.amount:'')).join('\n');}
  let editing=null;
  function openForm(id=null){
    editing=id;
    const r=id?myRecipes.find(x=>x.id===id):null;
    $('#my-form').reset();
    $('#my-form-title').textContent=r?'Редактировать рецепт':'Новый рецепт';
    for(const name of ['name','description','minutes','serves','difficulty','category','emoji','estimatedCost']){
      const control=$(`#my-form [name="${name}"]`);if(control&&r&&r[name]!==undefined)control.value=r[name];
    }
    $('#my-form [name="ingredients"]').value=r?textIngredients(r.ingredients):'';
    $('#my-form [name="steps"]').value=r?r.steps.join('\n'):'';
    $('#my-form [name="videoUrl"]').value=r?.videoUrl?.replace('www.youtube-nocookie.com/embed/','www.youtube.com/watch?v=')||'';
    $('#my-form-error').textContent='';show('my-form-dialog');
  }
  function readForm(){
    const data=new FormData($('#my-form'));
    const name=String(data.get('name')||'').trim();
    const ingredients=String(data.get('ingredients')||'').split(/\n/).map(x=>x.trim()).filter(Boolean).map(line=>{const optional=line.startsWith('?');const [name,amount='по вкусу']=(optional?line.slice(1):line).split('|');return {name:name.trim(),amount:amount.trim(),optional};});
    const steps=String(data.get('steps')||'').split(/\n/).map(x=>x.trim()).filter(Boolean);
    const videoUrl=String(data.get('videoUrl')||'').trim();
    if(!name||!ingredients.length||!steps.length)throw new Error('Укажи название, ингредиенты и хотя бы один шаг.');
    if(videoUrl&&!parseVideo(videoUrl))throw new Error('Для видео вставь ссылку на YouTube (youtube.com или youtu.be).');
    return normalizePersonal({id:editing||makeID(),name,description:data.get('description'),minutes:data.get('minutes'),serves:data.get('serves'),difficulty:data.get('difficulty'),category:data.get('category'),emoji:data.get('emoji'),estimatedCost:data.get('estimatedCost'),ingredients,steps,videoUrl});
  }
  function openMyRecipe(id){
    const r=myRecipes.find(x=>x.id===id);if(!r)return;
    const video=r.videoUrl?`<div class="personal-video"><h3>▶ Видеоинструкция</h3><iframe title="Видео: ${esc(r.name)}" src="${r.videoUrl}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" loading="lazy" allowfullscreen></iframe></div>`:'';
    $('#my-view-content').innerHTML=`<div class="my-view-hero"><div class="my-view-emoji">${esc(r.emoji)}</div><div class="mini-eyebrow">МОЙ РЕЦЕПТ</div><h2 id="my-view-title">${esc(r.name)}</h2><p>${esc(r.description)}</p><div class="my-view-tags"><span>◷ ${r.minutes} мин</span><span>${levels[r.difficulty]}</span><span>${r.serves} порции</span>${r.estimatedCost?`<span>≈ ${money(r.estimatedCost)} на весь рецепт</span>`:''}</div></div><div class="my-view-columns"><div class="my-view-panel"><h3>🧺 Ингредиенты</h3><ul>${r.ingredients.map(x=>`<li><span>${esc(x.name)}${x.optional?' (необяз.)':''}</span><small>${esc(x.amount)}</small></li>`).join('')}</ul></div><div class="my-view-panel"><h3>👩‍🍳 Готовим по шагам</h3><ol>${r.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div></div>${video}<div class="feature-actions"><button class="btn btn-outline" type="button" id="mine-edit-view">Редактировать</button></div>`;
    $('#my-view-dialog').dataset.recipeId=id;show('my-view-dialog');
  }
  $('#mine-add').addEventListener('click',()=>openForm());
  $('#mine-grid').addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.mineView){openMyRecipe(b.dataset.mineView);return;}
    if(b.dataset.mineEdit){openForm(b.dataset.mineEdit);return;}
    if(b.dataset.mineDelete){const r=myRecipes.find(x=>x.id===b.dataset.mineDelete);if(!r)return;if(!window.confirm(`Удалить рецепт «${r.name}»?`))return;myRecipes=myRecipes.filter(x=>x.id!==r.id);saveMine();renderMine();renderBudget();snackToast('Рецепт удалён');}
  });
  $('#my-view-content').addEventListener('click',e=>{if(e.target.closest('#mine-edit-view')){$('#my-view-dialog').close();openForm($('#my-view-dialog').dataset.recipeId);}});
  $('#my-form').addEventListener('submit',e=>{
    e.preventDefault();
    try{const r=readForm();if(!r)throw new Error('Проверь ингредиенты и шаги приготовления.');
      if(editing){const index=myRecipes.findIndex(x=>x.id===editing);if(index>=0)myRecipes[index]=r;}
      else {if(myRecipes.length>=150)throw new Error('Достигнут лимит 150 рецептов.');myRecipes.unshift(r);}
      if(!saveMine())throw new Error('Не удалось сохранить в браузере. Проверь свободное место.');
      $('#my-form-dialog').close();renderMine();renderBudget();snackToast('Рецепт сохранён!');
    }catch(err){$('#my-form-error').textContent=err.message||'Не удалось сохранить рецепт.';}
  });
  document.querySelectorAll('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  for(const id of ['my-form-dialog','my-view-dialog']){$('#'+id).addEventListener('click',e=>{if(e.target===$('#'+id))e.target.close();});}
  $('#my-export').addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify({format:'nastik-my-recipes',version:1,recipes:myRecipes},null,2)],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='moi-recepty-nastik.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $('#my-import').addEventListener('change',async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file)return;
    if(file.size>500000){snackToast('Файл слишком большой');return;}
    try{const data=JSON.parse(await file.text());if(data?.format!=='nastik-my-recipes'||!Array.isArray(data.recipes))throw new Error('Неподдерживаемый формат файла');
      const imported=data.recipes.slice(0,150).map(normalizePersonal).filter(Boolean);
      const ids=new Set(myRecipes.map(x=>x.id));let added=0;
      for(const r of imported){if(!ids.has(r.id)&&myRecipes.length<150){myRecipes.push(r);ids.add(r.id);added++;}}
      saveMine();renderMine();renderBudget();snackToast(`Импортировано рецептов: ${added}`);
    }catch{snackToast('Не удалось прочитать файл рецептов');}
  });
  renderBattle();renderPriceList();renderBudget();renderDesserts();renderMine();
  window.NASTIK_FEATURES_TEST={recipeCount:recipes.length,dessertCount:recipes.filter(r=>r.category==='dessert').length,estimate,startBattle,renderBudget,priceSeed,parseVideo};
})();
