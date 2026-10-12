/* Ужинчик — битва блюд и десерты. Без внешних сервисов и аккаунтов. */
(function () {
  'use strict';
  const recipes = Array.isArray(window.DINNER_RECIPES) ? window.DINNER_RECIPES : [];
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const randint = max => Math.floor(Math.random() * max);
  const shuffle = data => {const a=[...data];for(let i=a.length-1;i>0;i--){const j=randint(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
  const levels={easy:'Легко',medium:'Средне',hard:'Сложно'};
  // Даже если блюдо скрыто фильтрами каталога, встроенный обработчик app.js найдёт его по ID.
  const invokeBase = id => {const el=document.createElement('button');el.type='button';el.hidden=true;el.dataset.open=id;document.body.append(el);el.click();el.remove();};

  // 1. Битва блюд: победитель остаётся, противник меняется. Каждый соперник уникален.
  let battle = null;
  const battlePool=()=>recipes.filter(x=>x.category!=='dessert');
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
    if(btn.hasAttribute('data-battle-open')){invokeBase(battle?.champion.id);return;}
    if(btn.hasAttribute('data-battle-restart')){startBattle();return;}
    if(!battle || battle.finished || !btn.dataset.battleSide)return;
    if(btn.dataset.battleSide==='right')battle.champion=battle.opponent;
    if(battle.round>=battle.total || !battle.remaining.length){battle.finished=true;renderBattle();return;}
    battle.opponent=battle.remaining.shift();battle.round++;renderBattle();
  });

  // 3. Десерты. Новые рецепты расширяют общий каталог и имеют все стандартные инструкции.
  let dessertLast=null;
  function renderDesserts(){
    const all=recipes.filter(r=>r.category==='dessert');
    $('#dessert-count').textContent=`${all.length} рецептов`;
    $('#dessert-grid').innerHTML=all.map(r=>`<button type="button" class="dessert-card" data-dessert-open="${esc(r.id)}"><span class="dessert-emoji">${esc(r.emoji)}</span><strong>${esc(r.name)}</strong><small>${r.minutes} мин · ${levels[r.difficulty]}</small><span class="dessert-next">Открыть рецепт ↗</span></button>`).join('');
  }
  $('#dessert-grid').addEventListener('click',e=>{const button=e.target.closest('[data-dessert-open]');if(button)invokeBase(button.dataset.dessertOpen);});
  $('#dessert-surprise').addEventListener('click',()=>{const all=recipes.filter(r=>r.category==='dessert');const candidates=all.filter(r=>r.id!==dessertLast);const dish=candidates[randint(candidates.length)]||all[0];if(!dish)return;dessertLast=dish.id;invokeBase(dish.id);});

  renderBattle();
  renderDesserts();
  window.NASTIK_FEATURES_TEST={recipeCount:recipes.length,dessertCount:recipes.filter(r=>r.category==='dessert').length,startBattle};
})();
