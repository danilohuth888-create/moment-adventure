(()=>{
'use strict';
const W=240,H=426,T=Math.PI*2,SAVE='moment-pixel-v4';
const $=id=>document.getElementById(id);
const canvas=$('game'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const overlay=$('overlay'),panel=$('panel'),toast=$('toast'),hud=$('hud'),combatUI=$('combat-ui');
const joy=$('joy-ring'),stick=$('joy-stick'),pauseBtn=$('pause'),dashBtn=$('dash'),skillBtn=$('skill'),fileInput=$('import-save');
canvas.width=W;canvas.height=H;
const held={},input={x:0,y:0};
const save=loadSave();
const HEROES={
  mage:{name:'Arkanist',title:'Fernkampfmagier',hp:88,attack:14,rate:0.42,speed:78,color:'#c586ff',bullet:'#e7d6ff',skill:'Astralregen',desc:'Viele Magiegeschosse und starke Skill-Salve.'},
  knight:{name:'Wächter',title:'Standhafter Ritter',hp:118,attack:11,rate:0.36,speed:70,color:'#6abef5',bullet:'#fff0b4',skill:'Klingenwirbel',desc:'Mehr Leben, Schutz und ein mächtiger Nahbereichs-Skill.'}
};
const PERKS=[
  {id:'power',name:'Stärkerer Schuss',desc:'+20% Schaden',apply:r=>r.damageMul*=1.2},
  {id:'rate',name:'Schnellere Angriffe',desc:'+18% Angriffstempo',apply:r=>r.rateMul*=1.18},
  {id:'speed',name:'Leichte Schritte',desc:'+12 Lauftempo',apply:r=>r.speed+=12},
  {id:'vital',name:'Mehr Herz',desc:'+20 maximales Leben + Heilung',apply:r=>{r.maxHp+=20;r.hp=Math.min(r.maxHp,r.hp+20)}},
  {id:'multi',name:'Doppelprojektil',desc:'1 zusätzliches Projektil',apply:r=>r.projectiles=Math.min(4,r.projectiles+1)},
  {id:'nova',name:'Runenorbit',desc:'Ein rotierender Orbitalschaden',apply:r=>r.orbitals=Math.min(3,r.orbitals+1)},
  {id:'magnet',name:'Magnetstaub',desc:'Größere Sammelreichweite',apply:r=>r.pickup+=18},
  {id:'armor',name:'Sternenpanzer',desc:'+1 Rüstung',apply:r=>r.armor=Math.min(5,r.armor+1)}
];
let mode='home',heroKey='mage',run=null,last=0,now=0,pointerId=null,spawnTimer=0,killTarget=12,bossSpawned=false,shake=0;
let enemies=[],bullets=[],enemyBullets=[],particles=[],texts=[],pickups=[];
let toastTimer=0,dashCd=0,skillCd=0;
const state={screen:'home'};

function loadSave(){
  const base={gold:0,bestRoom:0,runs:0,hpBonus:0,powerBonus:0,latestHero:'mage'};
  try{const raw=JSON.parse(localStorage.getItem(SAVE)||'null');if(raw)return {...base,...raw};}catch{}
  try{const old=JSON.parse(localStorage.getItem('moment-adventure-save-v3')||'null');if(old)return {...base,gold:+old.gold||0,bestRoom:+old.bestRoom||0,runs:+old.runs||0,hpBonus:+old.hpBonus||0,powerBonus:+old.powerBonus||0,latestHero:old.latestHero||'mage'};}catch{}
  return base;
}
function persist(){localStorage.setItem(SAVE,JSON.stringify(save));}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function rand(a,b){return Math.random()*(b-a)+a;}
function irand(a,b){return Math.floor(rand(a,b+1));}
function dist(a,b,c,d){return Math.hypot(c-a,d-b);}
function toastMsg(msg,t=2){toast.textContent=msg;toast.classList.remove('hidden');toastTimer=t;}
function hideToast(){toast.classList.add('hidden');}
function pixelButton(label,sub,action,cls='menu-btn'){return `<button class="${cls}" data-action="${action}"><span>${label}${sub?`<span class="sub">${sub}</span>`:''}</span><span>▶</span></button>`;}
function setScreen(name){document.body.dataset.screen=name;state.screen=name;}
function showOverlay(html,title='MOMENT'){overlay.classList.remove('hidden');panel.innerHTML=html;$('panel-title').textContent=title; bindOverlay();}
function hideOverlay(){overlay.classList.add('hidden');}
function showHUD(v){hud.classList.toggle('hidden',!v);combatUI.classList.toggle('hidden',!v);}
function bindOverlay(){panel.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',e=>handleAction(e.currentTarget.dataset.action)));}

function home(){
  mode='home';showHUD(false);hideToast();setScreen('home');heroKey=save.latestHero||'mage';
  showOverlay(`
    <div class="eyebrow">PIXEL FANTASY · OFFLINE</div>
    <h1>MOMENT</h1>
    <p>Jetzt als echtes Pixel-Action-RPG: klein, arcadig, gemütlich und jederzeit spielbar – sogar offline.</p>
    <div class="hero-banner">
      <div class="hero-art pixel-forest"><div class="mage"></div></div>
      <div>
        <div class="pixel-tag">V0.4 · PIXEL SURVIVORS UPDATE</div>
        <p>Erkunde fünf Räume, besiege den Boss und baue deinen Helden mit zufälligen Pixel-Upgrades aus.</p>
      </div>
    </div>
    ${pixelButton('Abenteuer starten','Neuen Run beginnen','heroes','menu-btn primary')}
    ${pixelButton('Zuflucht','Schmiede, Garten und Chronik','sanctuary')}
    <div class="menu-grid">
      <button class="mini-btn" data-action="export">Spielstand exportieren</button>
      <button class="mini-btn" data-action="import">Spielstand importieren</button>
    </div>
    <div class="stats">
      <div class="stat"><strong>${save.gold}</strong><span>Gesammeltes Gold</span></div>
      <div class="stat"><strong>${Math.max(1,save.bestRoom||0)}</strong><span>Bestes Kapitel</span></div>
      <div class="stat"><strong>${save.runs}</strong><span>Runs insgesamt</span></div>
      <div class="stat"><strong>${save.hpBonus}/${save.powerBonus}</strong><span>Schmiede HP / Kraft</span></div>
    </div>
    <h2>Wie es sich anfühlt</h2>
    <ul class="list">
      <li>Pixelige Grafik mit kleiner interner Auflösung.</li>
      <li>Vampire-Survivors-artiges Kampfgefühl, aber mit eigener Fantasy-Welt.</li>
      <li>Kein Konto, keine Werbung, nur lokaler Spielstand.</li>
    </ul>
  `,'MOMENT');
}

function heroes(){
  mode='heroes';showHUD(false);setScreen('heroes');
  const card=(key)=>{
    const h=HEROES[key], active=heroKey===key;
    return `<article class="hero-card ${active?'active':''}" data-pick="${key}">
      <div class="hero-card-head">
        <div style="display:flex;gap:10px;align-items:center;">
          <div class="hero-sprite ${key}"></div>
          <div class="hero-meta"><h3>${h.name}</h3><p>${h.title}</p></div>
        </div>
        <span class="badge">${key==='mage'?'MAGIE':'STAHL'}</span>
      </div>
      <div class="hero-stats">
        <div><div class="tiny">LEBEN</div><div class="meter"><span style="width:${key==='mage'?72:96}%"></span></div></div>
        <div><div class="tiny">POWER</div><div class="meter"><span style="width:${key==='mage'?95:76}%"></span></div></div>
        <div><div class="tiny">TEMPO</div><div class="meter"><span style="width:${key==='mage'?88:74}%"></span></div></div>
      </div>
      <p>${h.desc}</p>
    </article>`;
  };
  showOverlay(`
    <div class="eyebrow">HELD WÄHLEN</div>
    <h1>Deine Klasse</h1>
    <p>Beide Helden spielen sich unterschiedlich, bleiben aber bewusst kompakt und handyfreundlich.</p>
    <div class="hero-list">${card('mage')}${card('knight')}</div>
    <div class="menu-grid">
      <button class="mini-btn" data-action="home">Zurück</button>
      <button class="mini-btn" data-action="begin-run">Run starten</button>
    </div>
  `,'Helden');
  panel.querySelectorAll('[data-pick]').forEach(el=>el.addEventListener('click',()=>{heroKey=el.dataset.pick;save.latestHero=heroKey;persist();heroes();}));
}

function sanctuary(){
  mode='sanctuary';showHUD(false);setScreen('sanctuary');
  const hpCost=(save.hpBonus+1)*25, powCost=(save.powerBonus+1)*25;
  showOverlay(`
    <div class="eyebrow">DIE ZUFLUCHT</div>
    <h1>Pixel-Zuflucht</h1>
    <p>Hier kannst du zwischen den Runs kurz runterkommen, deinen Build verbessern und deinen Spielstand sichern.</p>
    <div class="note">Gold bleibt dauerhaft. Schmiede-Upgrades gelten für alle künftigen Runs.</div>
    <div class="shop">
      <div class="shop-item"><div><strong>Mehr Leben</strong><div class="tiny">+8 permanentes Start-Leben</div></div><button class="mini-btn" data-action="buy-hp">${hpCost} Gold</button></div>
      <div class="shop-item"><div><strong>Mehr Kraft</strong><div class="tiny">+1 permanenter Grundschaden</div></div><button class="mini-btn" data-action="buy-power">${powCost} Gold</button></div>
      <div class="shop-item"><div><strong>Garten</strong><div class="tiny">Eine ruhige Pause ohne Kampf.</div></div><button class="mini-btn" data-action="garden">Öffnen</button></div>
    </div>
    <h2>Chronik</h2>
    <ul class="list">
      <li>Runs insgesamt: <strong>${save.runs}</strong></li>
      <li>Bestes Kapitel: <strong>${Math.max(1,save.bestRoom||0)}</strong></li>
      <li>Goldvorrat: <strong>${save.gold}</strong></li>
    </ul>
    <div class="menu-grid">
      <button class="mini-btn" data-action="home">Zurück</button>
      <button class="mini-btn" data-action="heroes">Abenteuer</button>
    </div>
  `,'Zuflucht');
}

function garden(){
  mode='garden';showHUD(false);setScreen('garden');
  showOverlay(`
    <div class="eyebrow">RUHIGER ORT</div>
    <h1>Pixel-Garten</h1>
    <p>Ein kleiner Rückzugsort. Kein Zeitdruck, keine Gegner. Einfach nur kurz runterkommen.</p>
    <ul class="list">
      <li>Atme kurz durch.</li>
      <li>Wenn du magst, starte danach direkt wieder einen Run.</li>
      <li>Alles bleibt lokal auf deinem Gerät gespeichert.</li>
    </ul>
    <div class="menu-grid">
      <button class="mini-btn" data-action="sanctuary">Zurück zur Zuflucht</button>
      <button class="mini-btn" data-action="heroes">Neuer Run</button>
    </div>
  `,'Garten');
}

function handleAction(action){
  if(action==='home') return home();
  if(action==='heroes') return heroes();
  if(action==='sanctuary') return sanctuary();
  if(action==='garden') return garden();
  if(action==='begin-run') return startRun(heroKey);
  if(action==='continue') return resumeFight();
  if(action==='restart') return startRun(heroKey);
  if(action==='import') return fileInput.click();
  if(action==='export') return exportSave();
  if(action==='buy-hp') return buyUpgrade('hp');
  if(action==='buy-power') return buyUpgrade('power');
}

function buyUpgrade(kind){
  if(kind==='hp'){
    const cost=(save.hpBonus+1)*25; if(save.gold<cost) return toastMsg('Nicht genug Gold.');
    save.gold-=cost; save.hpBonus++; persist(); toastMsg('Mehr Leben freigeschaltet!'); return sanctuary();
  }
  const cost=(save.powerBonus+1)*25; if(save.gold<cost) return toastMsg('Nicht genug Gold.');
  save.gold-=cost; save.powerBonus++; persist(); toastMsg('Mehr Kraft freigeschaltet!'); sanctuary();
}

function baseRun(h){
  return {
    hero:heroKey,name:h.name,level:1,xp:0,xpNext:10,
    room:1,kills:0,goldThisRun:0,
    hp:h.hp+save.hpBonus*8,maxHp:h.hp+save.hpBonus*8,
    attack:h.attack+save.powerBonus,attackTimer:0,
    rate:h.rate,speed:h.speed,
    damageMul:1,rateMul:1,projectiles:1,orbitals:0,pickup:20,armor:0,
    x:W/2,y:H/2,r:6,vx:0,vy:0,facingX:1,facingY:0,skillName:h.skill,
    inv:0,dash:0,alive:true
  };
}

function resetRoom(){
  enemies=[];bullets=[];enemyBullets=[];particles=[];texts=[];pickups=[];spawnTimer=.6;bossSpawned=false;
  killTarget=10+run.room*4;
  run.kills=0;
  placePlayerCenter();
}
function placePlayerCenter(){run.x=W/2;run.y=H/2;run.vx=run.vy=0;}
function startRun(key){
  heroKey=key;save.latestHero=key;persist();
  const h=HEROES[key];run=baseRun(h);save.runs++;persist();
  mode='fight';setScreen('fight');hideOverlay();showHUD(true);resetRoom();dashCd=0;skillCd=0;toastMsg('Run gestartet!',1.4);updateHUD();
}
function resumeFight(){hideOverlay();showHUD(true);mode='fight';}
function pause(){if(mode!=='fight')return;mode='pause';showHUD(false);showOverlay(`
  <div class="eyebrow">PAUSE</div>
  <h1>Run pausiert</h1>
  <p>Gold dieser Runde: <strong>${run.goldThisRun}</strong></p>
  <div class="menu-grid">
    <button class="mini-btn" data-action="continue">Weiter</button>
    <button class="mini-btn" data-action="restart">Neu starten</button>
  </div>
  <div class="menu-grid">
    <button class="mini-btn" data-action="sanctuary">Zuflucht</button>
    <button class="mini-btn" data-action="home">Hauptmenü</button>
  </div>
  `,'Pause');
}

function finishRun(win){
  const bonus = win ? 20+run.room*6 : 8+Math.max(0,run.room-1)*4;
  save.gold += run.goldThisRun + bonus;
  save.bestRoom = Math.max(save.bestRoom, run.room);
  persist();
  const title = win ? 'Boss besiegt!' : 'Run beendet';
  const msg = win ? 'Du hast das Kapitel bezwungen und mehr Gold erhalten.' : 'Sammle Gold, verbessere deine Schmiede und versuche es erneut.';
  mode='home';showHUD(false);
  showOverlay(`
    <div class="eyebrow">${win?'SIEG':'NIEDERLAGE'}</div>
    <h1>${title}</h1>
    <p>${msg}</p>
    <div class="stats">
      <div class="stat"><strong>${run.room}</strong><span>Erreichtes Kapitel</span></div>
      <div class="stat"><strong>${run.goldThisRun}</strong><span>Gold im Run</span></div>
      <div class="stat"><strong>${bonus}</strong><span>Abschlussbonus</span></div>
      <div class="stat"><strong>${save.gold}</strong><span>Gesamtgold</span></div>
    </div>
    <div class="menu-grid">
      <button class="mini-btn" data-action="restart">Nochmal</button>
      <button class="mini-btn" data-action="sanctuary">Zuflucht</button>
    </div>
  `,title);
}

function chooseUpgrade(){
  mode='upgrade';showHUD(false);
  const picks=[...PERKS].sort(()=>Math.random()-.5).slice(0,3);
  showOverlay(`
    <div class="eyebrow">UPGRADE</div>
    <h1>Wähle eine Gabe</h1>
    <p>Nach jedem Raum stärkst du deinen Helden mit einer von drei Runen.</p>
    <div class="choice-grid">
      ${picks.map((p,i)=>`<button class="choice-btn" data-choice="${i}"><strong>${p.name}</strong><small>${p.desc}</small></button>`).join('')}
    </div>
  `,'Upgrade');
  panel.querySelectorAll('[data-choice]').forEach((el,i)=>el.addEventListener('click',()=>{picks[i].apply(run);toastMsg(picks[i].name,1.6);mode='fight';hideOverlay();showHUD(true);if(run.room<5){run.room++;resetRoom();}else{finishRun(true);}updateHUD();}));
}

function exportSave(){
  const blob=new Blob([JSON.stringify(save,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='moment-save-v4.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);toastMsg('Spielstand exportiert.');
}
fileInput.addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{const data=JSON.parse(await file.text());Object.assign(save,data);persist();toastMsg('Spielstand importiert.');home();}catch{toastMsg('Import fehlgeschlagen.');}
  e.target.value='';
});

function spawnEnemy(type='mob'){
  const side=irand(0,3); let x,y;
  if(side===0){x=rand(12,W-12);y=-10;} else if(side===1){x=W+10;y=rand(12,H-12);} else if(side===2){x=rand(12,W-12);y=H+10;} else {x=-10;y=rand(12,H-12);}  
  if(type==='boss'){
    enemies.push({type:'boss',x:W/2,y:50,r:12,hp:130+run.room*18,maxHp:130+run.room*18,speed:24,color:'#f26c8d',shot:1.7,flash:0});
    toastMsg('Boss erscheint!',1.8);
    return;
  }
  const pool=['slime','bat','skeleton'];
  const kind=pool[irand(0,pool.length-1)];
  const data={
    slime:{r:8,hp:16+run.room*4,speed:18+run.room*2,color:'#7ed07e'},
    bat:{r:6,hp:12+run.room*3,speed:28+run.room*2,color:'#c586ff'},
    skeleton:{r:7,hp:20+run.room*4,speed:20+run.room*1.5,color:'#f7ca67'}
  }[kind];
  enemies.push({type:kind,x,y,...data,maxHp:data.hp,shot:0,flash:0});
}

function nearestEnemy(){
  let best=null,bd=1e9;for(const e of enemies){const d=dist(run.x,run.y,e.x,e.y);if(d<bd){bd=d;best=e;}}return best;
}
function fireAt(target){
  const angle=Math.atan2(target.y-run.y,target.x-run.x);
  const spreadBase=run.projectiles>1?.17:0;
  for(let i=0;i<run.projectiles;i++){
    const spread=(i-(run.projectiles-1)/2)*spreadBase;
    const a=angle+spread;
    bullets.push({x:run.x,y:run.y,vx:Math.cos(a)*120,vy:Math.sin(a)*120,life:1.1,r:2,color:HEROES[run.hero].bullet,damage:(run.attack*run.damageMul)});
  }
}
function castSkill(){
  if(mode!=='fight'||skillCd>0||!run) return;
  if(run.hero==='mage'){
    for(let i=0;i<12;i++){
      const a=i*(T/12)+rand(-.08,.08);
      bullets.push({x:run.x,y:run.y,vx:Math.cos(a)*110,vy:Math.sin(a)*110,life:1.25,r:3,color:'#fff1be',damage:run.attack*1.3*run.damageMul});
    }
    textFx(run.x,run.y-12,'ASTRAL!', '#fff1be');
  } else {
    for(let i=0;i<enemies.length;i++){
      const e=enemies[i]; if(dist(run.x,run.y,e.x,e.y)<48){damageEnemy(e,run.attack*1.7*run.damageMul,true);}
    }
    particlesBurst(run.x,run.y,18,'#6abef5',3);
    textFx(run.x,run.y-12,'WIRBEL!', '#bde9ff');
  }
  skillCd=run.hero==='mage'?8:9;
}
function dash(){
  if(mode!=='fight'||dashCd>0||!run) return;
  let dx=input.x || (held['ArrowRight']?1:0) - (held['ArrowLeft']?1:0);
  let dy=input.y || (held['ArrowDown']?1:0) - (held['ArrowUp']?1:0);
  const len=Math.hypot(dx,dy)||1; dx/=len; dy/=len;
  run.x=clamp(run.x+dx*28,10,W-10); run.y=clamp(run.y+dy*28,26,H-14); run.inv=.35; dashCd=3.2; particlesBurst(run.x,run.y,10,HEROES[run.hero].color,2); shake=2.5;
}
pauseBtn.addEventListener('click',pause);dashBtn.addEventListener('click',dash);skillBtn.addEventListener('click',castSkill);

function gainXP(v){
  run.xp += v;
  while(run.xp>=run.xpNext){ run.xp -= run.xpNext; run.xpNext = Math.floor(run.xpNext*1.28)+4; run.level++; run.maxHp+=3; run.hp=Math.min(run.maxHp,run.hp+6); textFx(run.x,run.y-18,'LEVEL UP!', '#fff0b4'); }
}

function damageEnemy(e,amount,knock=false){
  e.hp -= amount; e.flash=.08; if(knock){const a=Math.atan2(e.y-run.y,e.x-run.x); e.x+=Math.cos(a)*6; e.y+=Math.sin(a)*6;}
  textFx(e.x,e.y-10,''+Math.round(amount), '#fff0b4');
  if(e.hp<=0){
    enemies.splice(enemies.indexOf(e),1); run.kills++; gainXP(e.type==='boss'?10:3); const drop=e.type==='boss'?5:1; for(let i=0;i<drop;i++) pickups.push({x:e.x+rand(-4,4),y:e.y+rand(-4,4),r:3,type:i===0?'gold':'xp'}); particlesBurst(e.x,e.y,e.type==='boss'?20:9,e.color,3); save.bestRoom=Math.max(save.bestRoom,run.room); persist();
    if(e.type==='boss'){ chooseUpgrade(); }
  }
}
function hurtPlayer(dmg){
  if(run.inv>0||!run.alive)return;
  const final=Math.max(1,Math.round(dmg-run.armor)); run.hp-=final; run.inv=.45; shake=3.5; textFx(run.x,run.y-10,'-'+final,'#ff9090');
  if(run.hp<=0){run.hp=0;run.alive=false;finishRun(false);} 
}
function textFx(x,y,text,color){texts.push({x,y,text,color,life:.8,max:.8});}
function particlesBurst(x,y,count,color,size){for(let i=0;i<count;i++)particles.push({x,y,vx:rand(-30,30),vy:rand(-30,30),life:rand(.25,.6),max:0,r:size?rand(1,size):2,color});}

function update(dt){
  now += dt; if(shake>0) shake=Math.max(0,shake-dt*10);
  if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)hideToast();}
  if(mode!=='fight'||!run) return updateHUD();
  if(dashCd>0) dashCd-=dt; if(skillCd>0) skillCd-=dt; if(run.inv>0) run.inv-=dt;
  let dx=input.x + ((held['ArrowRight']?1:0)-(held['ArrowLeft']?1:0));
  let dy=input.y + ((held['ArrowDown']?1:0)-(held['ArrowUp']?1:0));
  const len=Math.hypot(dx,dy); if(len>0){dx/=len;dy/=len;run.facingX=dx;run.facingY=dy;}
  run.x=clamp(run.x+dx*run.speed*dt,8,W-8); run.y=clamp(run.y+dy*run.speed*dt,28,H-10);
  run.attackTimer -= dt; const target=nearestEnemy(); if(target && run.attackTimer<=0){ fireAt(target); run.attackTimer = 1/(run.rate*run.rateMul); }
  spawnTimer -= dt;
  if(!bossSpawned && run.kills>=killTarget){ bossSpawned=true; spawnEnemy('boss'); }
  if(!bossSpawned && spawnTimer<=0){ spawnEnemy(); spawnTimer=Math.max(.18, .8-run.room*.08-Math.min(run.kills*.01,.2)); }

  bullets = bullets.filter(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt; return b.life>0 && b.x>-12&&b.x<W+12&&b.y>-12&&b.y<H+12;});
  enemyBullets = enemyBullets.filter(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(dist(b.x,b.y,run.x,run.y)<b.r+run.r){hurtPlayer(8+run.room);return false;}return b.life>0&&b.x>-12&&b.x<W+12&&b.y>-12&&b.y<H+12;});

  for(const e of enemies){
    const ang=Math.atan2(run.y-e.y,run.x-e.x); e.x+=Math.cos(ang)*e.speed*dt; e.y+=Math.sin(ang)*e.speed*dt; if(e.flash>0)e.flash-=dt;
    if(e.type==='boss'){ e.shot -= dt; if(e.shot<=0){ for(let i=0;i<6;i++){const a=(T/6)*i+now; enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*58,vy:Math.sin(a)*58,r:3,life:2}); } e.shot=2.1; } }
    if(dist(e.x,e.y,run.x,run.y)<e.r+run.r+1){ hurtPlayer(e.type==='boss'?14:6+run.room*.7); }
  }
  for(const b of bullets){ for(const e of enemies){ if(dist(b.x,b.y,e.x,e.y)<b.r+e.r){ damageEnemy(e,b.damage); b.life=0; break; } } }

  // Orbitals
  for(let i=0;i<run.orbitals;i++){
    const a=now*2.4+i*(T/Math.max(1,run.orbitals));
    const ox=run.x+Math.cos(a)*18, oy=run.y+Math.sin(a)*18;
    for(const e of enemies){ if(dist(ox,oy,e.x,e.y)<e.r+4){ damageEnemy(e,run.attack*.06*run.damageMul*60*dt); } }
  }

  for(const p of pickups){
    const d=dist(p.x,p.y,run.x,run.y); if(d<run.pickup){ const a=Math.atan2(run.y-p.y,run.x-p.x); p.x+=Math.cos(a)*72*dt; p.y+=Math.sin(a)*72*dt; }
  }
  pickups=pickups.filter(p=>{if(dist(p.x,p.y,run.x,run.y)<8){ if(p.type==='gold'){ run.goldThisRun+=3; save.gold+=0; } else gainXP(2); return false; } return true;});

  particles=particles.filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;return p.life>0;});
  texts=texts.filter(t=>{t.y-=18*dt;t.life-=dt;return t.life>0;});
  updateHUD();
}

function updateHUD(){
  if(!run)return;
  $('class-label').textContent=HEROES[run.hero].name.toUpperCase();
  $('level').textContent='LV '+run.level;
  $('area-label').textContent='WALD I';
  $('room-label').textContent='RAUM '+run.room+'/5';
  $('coins').textContent='GOLD '+(save.gold + run.goldThisRun);
  $('kill-label').textContent=bossSpawned?`BOSS ${enemies.filter(e=>e.type==='boss').length?'AKTIV':'BESIEGT'}`:`${run.kills} / ${killTarget}`;
  $('health-fill').style.width=(run.hp/run.maxHp*100).toFixed(1)+'%';
  $('hp-label').textContent=Math.ceil(run.hp)+'/'+run.maxHp;
  $('xp-fill').style.width=(run.xp/run.xpNext*100).toFixed(1)+'%';
  dashBtn.classList.toggle('cooldown',dashCd>0);
  skillBtn.classList.toggle('cooldown',skillCd>0);
  $('skill-timer').textContent=skillCd>0?Math.ceil(skillCd)+'s':'SKILL';
}

function clear(){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);ctx.imageSmoothingEnabled=false;}
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function outline(x,y,w,h,c='#000'){ctx.strokeStyle=c;ctx.strokeRect(Math.round(x)+.5,Math.round(y)+.5,Math.round(w),Math.round(h));}
function bg(){
  // sky / vignette
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1f1830');g.addColorStop(.45,'#26363b');g.addColorStop(1,'#17261d');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // stars
  for(let i=0;i<18;i++){px((i*37)%W,(i*53)%90,1,1, i%3===0?'#fff0b4':'#c586ff');}
  // floor tiles
  const tile=16; for(let y=106;y<H;y+=tile){ for(let x=0;x<W;x+=tile){ const alt=((x/tile + y/tile)&1)?'#2c4736':'#33533d'; px(x,y,tile,tile,alt); px(x,y,tile,1,'#24372e'); px(x,y,1,tile,'#24372e'); } }
  // path
  for(let y=122;y<H;y+=16){ px(90,y,60,16,(y/16)&1?'#6f655a':'#83796b'); }
  // tree line
  for(let i=0;i<9;i++){const x=i*28+((i%2)*6)-4; px(x,72,8,34,'#4b3226'); px(x-8,60,24,16,'#3d7b48'); px(x-6,52,20,10,'#4e945b'); }
  // ruins
  px(20,120,22,18,'#61736f');px(198,138,18,20,'#61736f');px(24,118,14,3,'#87918d');px(202,136,10,3,'#87918d');
}
function drawHero(){
  const x=Math.round(run.x),y=Math.round(run.y), blink=run.inv>0 && Math.floor(now*18)%2===0;
  if(blink)return;
  // shadow
  px(x-5,y+6,10,3,'#00000066');
  if(run.hero==='mage'){
    px(x-4,y-10,8,4,'#e8ddff'); px(x-5,y-6,10,10,'#e8ddff'); px(x-6,y+4,12,8,'#6b53c8'); px(x-8,y+12,4,6,'#6b53c8'); px(x+4,y+12,4,6,'#6b53c8'); px(x-10,y-2,4,10,'#6b53c8'); px(x+6,y-2,4,10,'#6b53c8'); px(x+10,y-12,2,16,'#c7b4ff'); px(x+12,y-14,4,4,'#fff0b4');
  } else {
    px(x-4,y-10,8,4,'#f4d28e'); px(x-5,y-6,10,10,'#f4d28e'); px(x-6,y+4,12,8,'#6781a4'); px(x-8,y+12,4,6,'#6781a4'); px(x+4,y+12,4,6,'#6781a4'); px(x-10,y-2,4,10,'#8aa0bf'); px(x+6,y-2,4,10,'#8aa0bf'); px(x+10,y-8,8,2,'#f7ca67'); px(x+16,y-10,2,10,'#f7ca67');
  }
  if(run.orbitals>0){ for(let i=0;i<run.orbitals;i++){const a=now*2.4+i*(T/run.orbitals); const ox=x+Math.cos(a)*18, oy=y+Math.sin(a)*18; px(ox-2,oy-2,4,4,'#9ff2ff'); } }
}
function drawEnemy(e){
  const x=Math.round(e.x),y=Math.round(e.y), hit=e.flash>0;
  if(e.type==='slime'){ px(x-8,y-4,16,10,hit?'#fff0b4':'#7ed07e'); px(x-6,y-8,12,4,hit?'#fff0b4':'#92e092'); px(x-4,y-2,2,2,'#0a0a0a'); px(x+2,y-2,2,2,'#0a0a0a'); }
  else if(e.type==='bat'){ px(x-8,y-2,6,4,hit?'#fff0b4':'#c586ff'); px(x+2,y-2,6,4,hit?'#fff0b4':'#c586ff'); px(x-2,y-4,4,8,'#f0e1ff'); }
  else if(e.type==='skeleton'){ px(x-6,y-8,12,10,hit?'#fff0b4':'#efe6d1'); px(x-7,y+2,14,8,'#8a7b66'); px(x-8,y+10,4,6,'#8a7b66'); px(x+4,y+10,4,6,'#8a7b66'); px(x-4,y-4,2,2,'#0a0a0a'); px(x+2,y-4,2,2,'#0a0a0a'); }
  else { px(x-14,y-10,28,20,hit?'#fff0b4':'#f26c8d'); px(x-10,y-18,20,8,'#d64b6f'); px(x-6,y-6,3,3,'#fff0b4'); px(x+3,y-6,3,3,'#fff0b4'); }
  const bw=e.type==='boss'?26:18; px(x-bw/2,y-(e.type==='boss'?18:14),bw,3,'#120b18'); px(x-bw/2,y-(e.type==='boss'?18:14),bw*(e.hp/e.maxHp),3,e.type==='boss'?'#e86161':'#f7ca67');
}
function drawBullet(b){px(b.x-2,b.y-2,4,4,b.color);} function drawEnemyBullet(b){px(b.x-2,b.y-2,5,5,'#f593b1');}
function drawPickups(){for(const p of pickups){ if(p.type==='gold'){ px(p.x-2,p.y-2,5,5,'#f7ca67'); px(p.x-1,p.y-1,3,3,'#fff0b4'); } else { px(p.x-2,p.y-2,4,4,'#6abef5'); } }}
function drawParticles(){for(const p of particles){ ctx.globalAlpha=clamp(p.life/Math.max(.1,p.max||p.life),0,1); px(p.x,p.y,p.r,p.r,p.color); } ctx.globalAlpha=1;}
function drawTexts(){ctx.textAlign='center';ctx.font='10px "Courier New", monospace';for(const t of texts){ctx.globalAlpha=clamp(t.life/t.max,0,1);ctx.fillStyle='#000';ctx.fillText(t.text,Math.round(t.x)+1,Math.round(t.y)+1);ctx.fillStyle=t.color;ctx.fillText(t.text,Math.round(t.x),Math.round(t.y));}ctx.globalAlpha=1;}
function drawMenuBackdrop(){bg(); ctx.globalAlpha=.7; px(0,0,W,H,'#0b0910aa'); ctx.globalAlpha=1;}
function draw(){
  clear(); if(overlay.classList.contains('hidden')||mode==='fight'){
    if(shake>0){ctx.save();ctx.translate(rand(-shake,shake),rand(-shake,shake));}
    bg(); drawPickups(); bullets.forEach(drawBullet); enemyBullets.forEach(drawEnemyBullet); enemies.forEach(drawEnemy); if(run) drawHero(); drawParticles(); drawTexts();
    if(shake>0) ctx.restore();
  } else { drawMenuBackdrop(); if(run) drawHero(); }
}

function loop(ts){ const dt=clamp((ts-last)/1000||0,0,.033); last=ts; update(dt); draw(); requestAnimationFrame(loop);} requestAnimationFrame(loop);

function resize(){canvas.style.width='100%';canvas.style.height='100dvh';}
addEventListener('resize',resize); resize();
function joyMove(e){const r=joy.getBoundingClientRect(); const x=e.clientX-(r.left+r.width/2), y=e.clientY-(r.top+r.height/2); const d=Math.hypot(x,y), m=Math.min(d/36,1); input.x=d?x/d*m:0; input.y=d?y/d*m:0; stick.style.transform=`translate(${Math.round(input.x*26)}px,${Math.round(input.y*26)}px)`; }
joy.addEventListener('pointerdown',e=>{if(mode!=='fight')return;pointerId=e.pointerId;joy.setPointerCapture(e.pointerId);joyMove(e);});
joy.addEventListener('pointermove',e=>{if(pointerId===e.pointerId)joyMove(e);});
function release(e){ if(pointerId!==null&&(!e||e.pointerId===pointerId)){ pointerId=null; input.x=0; input.y=0; stick.style.transform='translate(0px,0px)'; } }
joy.addEventListener('pointerup',release); joy.addEventListener('pointercancel',release); addEventListener('blur',()=>{release(); if(mode==='fight')pause();});
addEventListener('keydown',e=>{ if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault(); held[e.key]=true; if(e.repeat)return; if(e.key===' ')castSkill(); if(e.key==='Shift')dash(); if(e.key==='Escape'&&mode==='fight')pause(); });
addEventListener('keyup',e=>held[e.key]=false);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='fight')pause();});
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){ addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
home();
})();
