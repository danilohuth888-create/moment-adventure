/* MOMENT — Realms of Adventure 1.0
   Self-contained, original offline-friendly 2D survivor RPG.
   No remote assets, no external libraries, all content locally bundled. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const canvas=$('world'),ctx=canvas.getContext('2d',{alpha:false});
const root=$('app'),overlay=$('overlay'),screen=$('screen'),hud=$('hud'),controls=$('controls');
const joystick=$('joystick'),knob=$('joystick-knob'),dashButton=$('dash-button'),ultimateButton=$('ultimate-button');
const SAVE_KEY='moment-aetheria-save-v1';
const LEGACY_KEYS=['moment-pixel-v4','moment-realm-save-v2','moment-adventure-save-v3','moment-adventure-v1'];
const WORLD=2400,TAU=Math.PI*2;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const dist2=(a,b,c,d)=>(a-c)**2+(b-d)**2;
const fmtTime=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const STORY=[
 {title:'I · Die Stimme im Moos',speaker:'Lyra, Hüterin der Zuflucht',text:'Seit dem Zerbrechen der Siegel wächst der Flüsterwald unaufhaltsam. Lyra bittet dich, den Wurzelkönig aufzuhalten und das erste Fragment zurückzubringen.'},
 {title:'II · Die schweigende Krone',speaker:'Lyra, Hüterin der Zuflucht',text:'Das erste Siegel weist nach Norden. In der Frostzitadelle hält ein einsamer Wächter die Tore verschlossen. Sein Herz schlägt im Eis.'},
 {title:'III · Das Herz der Glut',speaker:'Der alte Schmied Orin',text:'Unter der Erde brennt die Glutschmiede weiter. Der Aschefürst schützt das letzte Fragment. Nur wer die Glut bezwingt, kann Aetheria wieder einen.'},
 {title:'Epilog · Ein neuer Morgen',speaker:'Lyra, Hüterin der Zuflucht',text:'Drei Fragmente leuchten in deinen Händen. Die Portale beruhigen sich, der Wald atmet auf. Die Welt ist nicht frei von Gefahren, doch ihr Schicksal gehört wieder ihren Bewohnern.'}
];
const DAILY_REWARD=12;
const VERSION=1;
const RUN_DURATION=190;
const MAX_ENTITIES=95;
const REALMS=[
 {id:0,name:'Flüsterwald',area:'GRÜNE GRENZE',theme:'forest',icon:'🌲',boss:'Wurzelkönig',desc:'Ein verwunschener Wald voller Schleime, Kobolde und verlassener Schreine.',reward:55,colors:['#263d34','#2d483c','#325343','#335d49','#436348'],accent:'#8fd69d'},
 {id:1,name:'Frostzitadelle',area:'EWIGER WINTER',theme:'frost',icon:'❄',boss:'Eiswächter',desc:'Gefrorene Mauern, frostige Geister und Kristalle im ewigen Schnee.',reward:95,colors:['#2f4559','#365466','#47667a','#547386','#618597'],accent:'#9bdfff'},
 {id:2,name:'Glutschmiede',area:'TIEFE GLUT',theme:'ember',icon:'🔥',boss:'Aschefürst',desc:'Verlorene Schmiedehallen, heiße Asche und der Wächter des letzten Siegels.',reward:145,colors:['#4a3034','#59373a','#6d4242','#784b3f','#8c6044'],accent:'#f8b16d'}
];
const CLASSES=[
 {id:'mage',name:'Arkanist',badge:'MAGIE',portrait:'✦',hp:94,speed:79,power:1,armor:0,start:'arcane',ultimate:'Astralnova',desc:'Magische Geschosse, hohe Reichweite und starke Flächenzauber.',color:'#d0a4ff'},
 {id:'knight',name:'Wächter',badge:'STAHL',portrait:'⚔',hp:144,speed:70,power:1.05,armor:2,start:'blade',ultimate:'Stahlkreis',desc:'Nahkampfklingen, viel Leben und solider Schutz.',color:'#99c2f5'},
 {id:'ranger',name:'Waldläufer',badge:'BOGEN',portrait:'➶',hp:106,speed:86,power:1,armor:0,start:'arrow',ultimate:'Pfeilhagel',desc:'Schnelle Pfeile, weite Sicht und wendige Ausweichmanöver.',color:'#a9e7aa'},
 {id:'rogue',name:'Schattenläufer',badge:'SCHATTEN',portrait:'◆',hp:89,speed:97,power:1.13,armor:0,start:'dagger',ultimate:'Schattenstoß',desc:'Rasende Wurfklingen, Tempo und riskante kritische Treffer.',color:'#f6a7d3'}
];
const WEAPONS=[
 {id:'arcane',name:'Arkaner Schuss',icon:'✦',desc:'Zielsuchende Magiegeschosse.',max:5,rarity:'common'},
 {id:'blade',name:'Runenklingen',icon:'⚔',desc:'Klingen kreisen schützend um dich.',max:5,rarity:'common'},
 {id:'arrow',name:'Waldbogen',icon:'➶',desc:'Pfeile durchbohren Gegner.',max:5,rarity:'common'},
 {id:'dagger',name:'Schattenmesser',icon:'◆',desc:'Schnelle, kritische Wurfklingen.',max:5,rarity:'common'},
 {id:'fire',name:'Glutfunke',icon:'🔥',desc:'Explosive Feuerkugeln.',max:5,rarity:'rare'},
 {id:'frost',name:'Frostsplitter',icon:'❄',desc:'Eiskristalle verlangsamen Feinde.',max:5,rarity:'rare'},
 {id:'lightning',name:'Kettenblitz',icon:'ϟ',desc:'Elektrizität springt zwischen Zielen.',max:5,rarity:'epic'},
 {id:'spirit',name:'Lichtgeist',icon:'☼',desc:'Ein Lichtgeist schießt aus der Ferne.',max:5,rarity:'rare'}
];
const PASSIVES=[
 {id:'might',name:'Kraft',icon:'✶',desc:'+12% Gesamtschaden pro Stufe.',max:5},
 {id:'haste',name:'Eile',icon:'»',desc:'+10% Angriffstempo pro Stufe.',max:5},
 {id:'heart',name:'Vitalität',icon:'♥',desc:'+15 maximales Leben und Heilung.',max:5},
 {id:'boots',name:'Windstiefel',icon:'↟',desc:'+7% Bewegungstempo pro Stufe.',max:5},
 {id:'magnet',name:'Magnetfeld',icon:'◎',desc:'+18 Sammelreichweite pro Stufe.',max:5},
 {id:'shield',name:'Eisenhaut',icon:'▣',desc:'+1 Rüstung pro Stufe.',max:5},
 {id:'fortune',name:'Glücksstern',icon:'✧',desc:'+10% Gold und mehr Krit-Chance.',max:5}
];
const ACHIEVEMENTS=[
 {id:'first_run',name:'Erster Schritt',desc:'Starte dein erstes Abenteuer.',reward:10},
 {id:'kills_100',name:'Monsterjäger',desc:'Besiege insgesamt 100 Gegner.',reward:25},
 {id:'kills_500',name:'Legende des Waldes',desc:'Besiege insgesamt 500 Gegner.',reward:75},
 {id:'level_10',name:'Erwachte Macht',desc:'Erreiche Stufe 10 in einem Run.',reward:30},
 {id:'first_boss',name:'Siegelbrecher',desc:'Besiege deinen ersten Boss.',reward:60},
 {id:'all_realms',name:'Held von Aetheria',desc:'Besiege alle drei Gebietsbosse.',reward:150},
 {id:'forge_5',name:'Meister der Schmiede',desc:'Kaufe insgesamt fünf Schmiede-Upgrades.',reward:35},
 {id:'all_classes',name:'Vielseitig',desc:'Starte einen Run mit jeder Klasse.',reward:40}
];
const ENEMIES={
 slime:{hp:24,spd:25,rad:9,damage:9,exp:3,gold:.09,kind:'slime'},
 bat:{hp:15,spd:49,rad:7,damage:6,exp:2,gold:.08,kind:'bat'},
 bone:{hp:31,spd:29,rad:9,damage:10,exp:4,gold:.14,kind:'bone'},
 caster:{hp:32,spd:26,rad:9,damage:11,exp:5,gold:.15,kind:'caster'},
 brute:{hp:85,spd:20,rad:14,damage:16,exp:9,gold:.28,kind:'brute'}
};
const BOSS_STATS=[{hp:950,spd:22,rad:24,damage:17},{hp:1300,spd:26,rad:24,damage:20},{hp:1800,spd:29,rad:26,damage:24}];

const makeDefault=()=>({version:VERSION,gold:0,shards:0,unlockedRealm:0,bestTime:[0,0,0],wins:[0,0,0],runs:0,totalKills:0,heroRuns:{mage:0,knight:0,ranger:0,rogue:0},forge:{hp:0,damage:0,speed:0,armor:0},achievements:[],quests:{day:'',done:[]},settings:{sound:true,shake:true,particles:true,autoResume:false},activeRun:null});
let save=readSave();
function readSave(){
  let raw=null;
  try{raw=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch{}
  if(raw&&raw.version===VERSION){
    const d=makeDefault();
    return {...d,...raw,forge:{...d.forge,...raw.forge},heroRuns:{...d.heroRuns,...raw.heroRuns},settings:{...d.settings,...raw.settings},quests:{...d.quests,...raw.quests}};
  }
  const legacy={};
  for(const key of LEGACY_KEYS){try{const item=JSON.parse(localStorage.getItem(key)||'null');if(item){legacy.gold=Math.max(legacy.gold||0,Number(item.gold)||0);legacy.runs=Math.max(legacy.runs||0,Number(item.runs)||0);legacy.forge={hp:Math.max(legacy.forge?.hp||0,Number(item.hpBonus)||0),damage:Math.max(legacy.forge?.damage||0,Number(item.powerBonus)||0)};}}catch{}}
  const d=makeDefault();return {...d,...legacy,forge:{...d.forge,...legacy.forge}};
}
let saveTimer=0,mode='home',selectedHero='mage',selectedRealm=0,game=null;
let W=270,H=550,scale=1,last=0,clock=0,toastTimeout=0,stickPointer=null;
const keys=new Set(),input={x:0,y:0},camera={x:0,y:0};
let audioCtx=null;
function persist(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));return true;}
  catch(e){showToast('SPEICHERN NICHT MÖGLICH');console.warn('Save failure',e);return false;}
}
function snapshotRun(){
  if(!game||!['fight','upgrade','pause'].includes(mode))return;
  save.activeRun={hero:game.hero,realm:game.realm,elapsed:game.elapsed,x:game.player.x,y:game.player.y,hp:game.player.hp,level:game.level,xp:game.xp,xpTarget:game.xpTarget,coins:game.coins,kills:game.kills,weapons:game.weapons,passives:game.passives,seed:game.seed,spawnCount:game.spawnCount,bossTriggered:game.bossTriggered,bossHp:game.boss?.hp??null,pendingLevels:game.pendingLevels};
  persist();
}
function closeOverlay(){overlay.classList.add('hidden');}
function showOverlay(html){overlay.classList.remove('hidden');screen.innerHTML=html;screen.scrollTop=0;overlay.scrollTop=0;}
function showGameUI(visible){hud.classList.toggle('hidden',!visible);controls.classList.toggle('hidden',!visible);}
function setMode(m){mode=m;document.body.dataset.screen=m;}
function showToast(message,duration=1.9){const t=$('toast');t.textContent=message;t.classList.remove('hidden');toastTimeout=duration;}
function button(title,detail,action,arg='',style=''){return `<button type="button" class="pixel-button ${style}" data-action="${action}" data-arg="${arg}"><span>${title}${detail?`<small>${detail}</small>`:''}</span><span class="button-icon">›</span></button>`;}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function stat(value,label){return `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`;}
function section(label){return `<div class="section-title">${label}</div>`;}
function goHome(){
  if(game&&['fight','pause','upgrade'].includes(mode))snapshotRun();
  setMode('home');showGameUI(false);
  const hasRun=!!save.activeRun;
  showOverlay(`<div class="eyebrow">DAS ABENTEUER BEGINNT</div><h1 class="main-title">MOMENT</h1><p class="intro">Ein kleines großes Fantasy-Abenteuer. Kämpfe, entdecke neue Waffen und schalte ganz Aetheria frei.</p>
  <div class="keyart" aria-hidden="true"><div class="moon"></div><div class="hill"></div><div class="tree one"></div><div class="tree two"></div><div class="tree three"></div><div class="tree four"></div><div class="hero"></div><div class="ground"></div><span class="title-stamp">DREI SIEGEL. EINE LEGENDE.</span></div>
  ${hasRun?button('▶ RUN FORTSETZEN',`${REALMS[save.activeRun.realm]?.name||'Aetheria'} · ${fmtTime(save.activeRun.elapsed||0)}`,'resume','','gold'):''}
  ${button('⚔ NEUES ABENTEUER','Charakter, Welt und Waffen wählen','heroes','','primary')}
  ${button('⌂ DIE ZUFLUCHT','Schmiede, Chronik und Ruheort','sanctuary')}
  <div class="grid-2"><button class="mini-button" data-action="codex">✧ CHRONIK</button><button class="mini-button" data-action="settings">⚙ EINSTELLUNGEN</button></div>
  ${section('DEIN FORTSCHRITT')}<div class="grid-3">${stat(save.gold,'GOLD')}${stat(save.shards,'SIEGEL')}${stat(save.totalKills,'Gegner')}</div>
  <p class="small-note">100 % offline nach der ersten Installation · Keine Anmeldung · Keine Werbung</p>`);
}
function goHeroes(){setMode('heroes');showGameUI(false);
  const cards=CLASSES.map(h=>`<button class="class-card ${selectedHero===h.id?'selected':''}" data-action="pickHero" data-arg="${h.id}"><span class="sprite-tile"><canvas class="sprite-preview" data-sprite="${h.id}" width="28" height="28"></canvas></span><span class="class-body"><b>${h.name}</b><p>${h.desc}</p><div class="status-line">${h.badge} · ♥${h.hp} · GESCHW. ${h.speed}</div></span>${selectedHero===h.id?'<span class="badge">AKTIV</span>':''}</button>`).join('');
  showOverlay(`<div class="eyebrow">01 / HELD WÄHLEN</div><h2 class="screen-title">Deine Legende</h2><p class="intro">Vier Klassen, vier verschiedene Startwaffen. Jede Waffe kann sich im Run weiterentwickeln.</p>${cards}<div class="grid-2"><button class="mini-button" data-action="home">← ZURÜCK</button><button class="mini-button" data-action="realms">WEITER →</button></div>`);drawPreviews();
}
function goRealms(){setMode('realms');showGameUI(false);
  const cards=REALMS.map(r=>{const unlocked=r.id<=save.unlockedRealm;return `<button class="realm-card ${selectedRealm===r.id&&unlocked?'selected':''} ${unlocked?'':'disabled'}" data-action="pickRealm" data-arg="${r.id}" ${unlocked?'':'disabled'}><span class="sprite-tile" style="background:${r.colors[0]};color:${r.accent};font-size:30px">${r.icon}</span><span class="realm-body"><b>0${r.id+1} · ${r.name}</b><p>${r.desc}</p><div class="status-line">${unlocked?`BESTZEIT ${fmtTime(save.bestTime[r.id])} · SIEGE ${save.wins[r.id]}`:'🔒 SIEG IM VORHERIGEN GEBIET NÖTIG'}</div></span></button>`}).join('');
  showOverlay(`<div class="eyebrow">02 / KAPITEL WÄHLEN</div><h2 class="screen-title">Die drei Siegel</h2><p class="intro">Ein Run dauert etwa 3–5 Minuten. Sammle XP, überlebe bis zum Boss und besiege ihn, um das nächste Gebiet freizuschalten.</p>${cards}<div class="grid-2"><button class="mini-button" data-action="heroes">← HELD</button><button class="mini-button" data-action="start">ABENTEUER →</button></div>`);
}
function goSanctuary(){setMode('sanctuary');showGameUI(false);
  const entries=[{id:'hp',title:'Lebenskraft',desc:'Pro Stufe +10 Startleben.',value:save.forge.hp,max:10},{id:'damage',title:'Runenkraft',desc:'Pro Stufe +7% Schaden.',value:save.forge.damage,max:10},{id:'speed',title:'Wanderstiefel',desc:'Pro Stufe +3% Bewegung.',value:save.forge.speed,max:8},{id:'armor',title:'Plattenrüstung',desc:'Pro Stufe +1 Rüstung.',value:save.forge.armor,max:6}];
  const shop=entries.map(e=>{const cost=forgeCost(e.id);return `<div class="shop-card"><div><b>${e.title} · ${e.value}/${e.max}</b><p>${e.desc}</p></div><button class="mini-button" data-action="buy" data-arg="${e.id}" ${e.value>=e.max?'disabled':''}>${e.value>=e.max?'MAX':cost+' G'}</button></div>`}).join('');
  showOverlay(`<div class="eyebrow">RUHE ZWISCHEN DEN ABENTEUERN</div><h2 class="screen-title">Die Zuflucht</h2><p class="intro">Hier bleibt deine Entwicklung erhalten. Kein Stress, keine Zeitlimits.</p><div class="grid-3">${stat(save.gold,'GOLD')}${stat(save.wins.reduce((a,b)=>a+b,0),'BOSSE')}${stat(save.runs,'RUNS')}</div>${section('DIE SCHMIEDE')}${shop}${section('DEIN RUHEORT')}${button('☘ DER GARTEN','Ein stiller Ort für ein paar Minuten','garden')}${button('▤ LYRA & DIE GESCHICHTE','Dein nächstes Ziel und die Siegelchronik','story')}${button('✎ KLEINE MISSIONEN','Freiwillige Mini-Aufgaben ohne Druck','missions')}<div class="grid-2"><button class="mini-button" data-action="home">← HAUPTMENÜ</button><button class="mini-button" data-action="heroes">⚔ LOSZIEHEN</button></div>`);
}
function forgeCost(id){const lev=save.forge[id]||0;return Math.round(35+lev*35+lev*lev*9);}
function purchaseForge(id){const max={hp:10,damage:10,speed:8,armor:6};if(!(id in max)||save.forge[id]>=max[id])return;const cost=forgeCost(id);if(save.gold<cost){showToast('NICHT GENUG GOLD');return;}save.gold-=cost;save.forge[id]++;persist();sfx('upgrade');checkAchievements();goSanctuary();showToast('VERBESSERT!');}
function goStory(){
 setMode('story');showGameUI(false);
 const next=save.wins.findIndex(v=>v===0);
 const objective=next===-1?'Alle drei Siegel geborgen. Aetheria ist gerettet.':`Nächstes Ziel: ${REALMS[next].boss} im Gebiet ${REALMS[next].name} besiegen.`;
 const chapters=STORY.map((s,i)=>{
  const unlocked=i===0||save.wins[i-1]>0;
  return `<div class="card"><span class="eyebrow">${unlocked?'GELESEN / FREIGESCHALTET':'NOCH VERSCHLOSSEN'}</span><b style="display:block;margin-bottom:5px;color:#ffe2a6">${s.title}</b>${unlocked?`<p class="intro">${s.text}</p><p class="small-note">— ${s.speaker}</p>`:'<p class="intro">Dieses Kapitel entfaltet sich nach dem Sieg über den vorherigen Siegelwächter.</p>'}</div>`;
 }).join('');
 showOverlay(`<div class="eyebrow">DIE GESCHICHTE VON AETHERIA</div><h2 class="screen-title">Die drei Siegel</h2><p class="intro">${objective}</p>${chapters}${button('← ZUR ZUFLUCHT','','sanctuary')}`);
}
function goGarden(){setMode('garden');showGameUI(false);showOverlay(`<div class="eyebrow">KLEINER RÜCKZUGSORT</div><h2 class="screen-title">Das Mondbeet</h2><div class="keyart"><div class="moon"></div><div class="hill"></div><div class="tree one"></div><div class="tree three"></div><div class="ground"></div><span class="title-stamp">DU MUSST GERADE NICHTS SCHAFFEN.</span></div><div class="card"><b style="color:#fff0b7">Drei ruhige Atemzüge</b><p class="intro">Atme langsam ein, dann länger wieder aus. Keine Punkte, keine Strafe, kein Timer.</p><button class="mini-button" data-action="breath">✧ EINEN ATEMZUG NEHMEN</button><p id="breath-count" class="small-note">Du kannst einfach hier bleiben.</p></div><div class="grid-2"><button class="mini-button" data-action="sanctuary">← ZUFLUCHT</button><button class="mini-button" data-action="heroes">⚔ ABENTEUER</button></div>`);}
const MISSION_DATA=[{id:'idea',text:'Schreibe eine kleine kreative Idee auf.'},{id:'water',text:'Trinke ein Glas Wasser und mach kurz Pause.'},{id:'stretch',text:'Strecke dich und bewege dich zwei Minuten.'},{id:'tidy',text:'Räume fünf Minuten eine kleine Ecke auf.'},{id:'learn',text:'Lerne etwas Kleines über Programmierung.'},{id:'outside',text:'Geh kurz an die frische Luft.'}];
function todayLocal(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function goMissions(){setMode('missions');showGameUI(false);const day=todayLocal();if(save.quests.day!==day){save.quests={day,done:[]};persist();}
 const cards=MISSION_DATA.map(m=>`<div class="shop-card"><div><b>${m.text}</b><p>Freiwillig · +${DAILY_REWARD} Gold · einmal täglich</p></div><button class="mini-button" data-action="mission" data-arg="${m.id}" ${save.quests.done.includes(m.id)?'disabled':''}>${save.quests.done.includes(m.id)?'✓':'FERTIG'}</button></div>`).join('');
 showOverlay(`<div class="eyebrow">FREIWILLIG UND ENTSPANNT</div><h2 class="screen-title">Alltags-Missionen</h2><p class="intro">Wenn du im echten Leben etwas Kleines machst, gibt es einen Bonus. Du kannst sämtliche Gebiete aber auch ohne diese Aufgaben spielen.</p>${cards}<p class="muted-note">Die App prüft nichts und verfolgt dich nicht. Du entscheidest selbst, was du erledigt hast.</p>${button('← ZUR ZUFLUCHT','','sanctuary')}`);}
function finishMission(id){if(!MISSION_DATA.some(m=>m.id===id))return;const day=todayLocal();if(save.quests.day!==day)save.quests={day,done:[]};if(save.quests.done.includes(id))return;save.quests.done.push(id);save.gold+=DAILY_REWARD;persist();goMissions();showToast(`+${DAILY_REWARD} GOLD`);sfx('coin');}
function goCodex(){setMode('codex');showGameUI(false);
 const medals=ACHIEVEMENTS.map(a=>`<div class="shop-card"><div><b>${save.achievements.includes(a.id)?'✦':'◇'} ${a.name}</b><p>${a.desc}</p></div><span class="badge ${save.achievements.includes(a.id)?'':'lock'}">${save.achievements.includes(a.id)?'✓':'+'+a.reward+' G'}</span></div>`).join('');
 showOverlay(`<div class="eyebrow">DEINE GESCHICHTE</div><h2 class="screen-title">Chronik & Erfolge</h2><div class="grid-3">${stat(save.totalKills,'KILLS')}${stat(save.runs,'RUNS')}${stat(save.shards,'SIEGEL')}</div>${section('DIE DREI REICHE')}${REALMS.map(r=>`<div class="status-line">${r.icon} ${r.name}: ${save.wins[r.id]} Siege</div>`).join('')}${section('ERFOLGE')}${medals}${button('← ZURÜCK','','home')}`);
}
function goSettings(){setMode('settings');showGameUI(false);const sett=[['sound','Töne','Kurze eigene Retro-Sounds'],['shake','Bildschirmwackeln','Bei starken Treffern'],['particles','Partikeleffekte','Kleine Pixel-Effekte']];
 const rows=sett.map(([id,name,desc])=>`<div class="setting-row"><span><b>${name}</b><br><span class="muted-note">${desc}</span></span><button class="toggle" data-action="toggle" data-arg="${id}">${save.settings[id]?'AN':'AUS'}</button></div>`).join('');
 showOverlay(`<div class="eyebrow">SPIEL & DATEN</div><h2 class="screen-title">Einstellungen</h2><div class="card">${rows}</div>${section('SPIELSTAND SICHERN')}${button('↧ SPIELSTAND EXPORTIEREN','Als lokale JSON-Datei herunterladen','export')}${button('↥ SPIELSTAND IMPORTIEREN','Eine vorhandene Sicherung verwenden','import')}<div class="card"><b>Deine Daten bleiben bei dir.</b><p class="small-note">Es gibt keinen Online-Account und kein Tracking. iOS kann Website-Daten löschen: Exportiere gelegentlich deinen Spielstand.</p></div>${button('← HAUPTMENÜ','','home')}`);
}
function exportSave(){snapshotRun();const blob=new Blob([JSON.stringify({...save,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});const a=document.createElement('a');a.download='MOMENT-1.0-Spielstand.json';a.href=URL.createObjectURL(blob);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);showToast('SPIELSTAND EXPORTIERT');}
function importSave(file){if(!file||file.size>1000000){showToast('DATEI ZU GROSS');return;}file.text().then(s=>{const val=JSON.parse(s);if(val.version!==VERSION||!Number.isFinite(val.gold)||!Array.isArray(val.wins)||!val.forge)throw Error('Unpassender Spielstand');if(!window.confirm('Aktuellen Spielstand wirklich durch die Datei ersetzen?'))return;const d=makeDefault();save={...d,...val,forge:{...d.forge,...val.forge},heroRuns:{...d.heroRuns,...val.heroRuns},settings:{...d.settings,...val.settings}};save.gold=clamp(Math.floor(save.gold),0,100000000);save.shards=clamp(Math.floor(save.shards||0),0,3);save.unlockedRealm=clamp(Math.floor(save.unlockedRealm||0),0,2);persist();game=null;goHome();showToast('SPIELSTAND GELADEN');}).catch(()=>showToast('UNGÜLTIGER SPIELSTAND'));}
function checkAchievements(){const checks={first_run:save.runs>0,kills_100:save.totalKills>=100,kills_500:save.totalKills>=500,level_10:game?.level>=10,first_boss:save.wins.some(n=>n>0),all_realms:save.wins.every(n=>n>0),forge_5:Object.values(save.forge).reduce((a,b)=>a+b,0)>=5,all_classes:Object.values(save.heroRuns).every(n=>n>0)};for(const a of ACHIEVEMENTS)if(checks[a.id]&&!save.achievements.includes(a.id)){save.achievements.push(a.id);save.gold+=a.reward;showToast(`ERFOLG! ${a.name.toUpperCase()} +${a.reward} G`,3);sfx('success');}persist();}

function classOf(id){return CLASSES.find(h=>h.id===id)||CLASSES[0];}
function levelOf(id){return WEAPONS.find(w=>w.id===id)||PASSIVES.find(p=>p.id===id);}
function makeRun(heroId,realmId){
 const hero=classOf(heroId);
 return {
   hero:hero.id,realm:realmId,elapsed:0,seed:Math.floor(Math.random()*1e9),spawnCount:0,bossTriggered:false,
   player:{x:WORLD/2,y:WORLD/2,hp:hero.hp+save.forge.hp*10,maxHp:hero.hp+save.forge.hp*10,inv:0,face:1,anim:0,dash:0},
   weapons:{[hero.start]:1},passives:{},timers:{},projectiles:[],enemyShots:[],enemies:[],drops:[],fx:[],labels:[],
   level:1,xp:0,xpTarget:18,pendingLevels:0,kills:0,coins:0,damageDealt:0,
   spawnClock:.8,dashCd:0,ultimateCd:0,ultimateFlash:0,shake:0,boss:null,nextEnemyId:1,lastSaved:0,
   pausedDuration:0,summonDelay:1,bonusShield:0
 };
}
function startRun(){
 if(selectedRealm>save.unlockedRealm){showToast('DIESE WELT IST NOCH GESPERRT');return;}
 save.activeRun=null;
 game=makeRun(selectedHero,selectedRealm);save.runs++;save.heroRuns[selectedHero]=(save.heroRuns[selectedHero]||0)+1;
 persist();checkAchievements();beginPlaying();snapshotRun();showToast(REALMS[game.realm].name.toUpperCase(),2);
}
function restoreRun(){
 const a=save.activeRun;if(!a){goHome();return;}
 if(!CLASSES.some(h=>h.id===a.hero)||!Number.isFinite(a.elapsed)||!REALMS[a.realm]){save.activeRun=null;persist();goHome();return;}
 game=makeRun(a.hero,a.realm);Object.assign(game,{elapsed:clamp(a.elapsed,0,RUN_DURATION+30),level:clamp(a.level||1,1,60),xp:a.xp||0,xpTarget:a.xpTarget||18,coins:a.coins||0,kills:a.kills||0,weapons:a.weapons||game.weapons,passives:a.passives||{},spawnCount:a.spawnCount||0,bossTriggered:!!a.bossTriggered,pendingLevels:a.pendingLevels||0});
 game.player.x=clamp(a.x||WORLD/2,32,WORLD-32);game.player.y=clamp(a.y||WORLD/2,32,WORLD-32);
 const hero=classOf(game.hero);game.player.maxHp=hero.hp+save.forge.hp*10+(game.passives.heart||0)*15;
 game.player.hp=clamp(a.hp||1,1,game.player.maxHp);
 if(game.bossTriggered)spawnBoss(a.bossHp);
 beginPlaying();if(game.pendingLevels>0)showLevelUp();else showToast('RUN FORTGESETZT',2);
}
function beginPlaying(){setMode('fight');closeOverlay();showGameUI(true);releaseJoystick();updateHud();sfx('start');}
function pauseRun(){
 if(mode!=='fight')return;
 setMode('pause');releaseJoystick();snapshotRun();showGameUI(false);
 showOverlay(`<div class="eyebrow">DEIN ABENTEUER WARTET</div><h2 class="screen-title">PAUSE</h2><p class="intro">${REALMS[game.realm].name} · ${fmtTime(game.elapsed)} · Stufe ${game.level}</p><div class="grid-3">${stat(game.kills,'Gegner')}${stat(game.coins,'Gold')}${stat(game.level,'Level')}</div>
 ${button('▶ WEITERSPIELEN','Genau hier weitermachen','continue','','primary')}
 ${button('⌂ INS HAUPTMENÜ','Dieser Run wird gespeichert','home')}
 ${button('✕ RUN AUFGEBEN','Bisherige Goldbeute wird gesichert','abandon')}
 <p class="small-note">Dein aktueller Run wird gespeichert und kann später fortgesetzt werden.</p>`);
}
function continueRun(){if(!game){restoreRun();return;}beginPlaying();}
function abandonRun(){if(!game){goHome();return;}finishRun(false,'Du hast den Run beendet.');}
function gainXP(n){
 if(!game)return;game.xp+=n;
 while(game.xp>=game.xpTarget&&game.level<50){game.xp-=game.xpTarget;game.level++;game.pendingLevels++;game.xpTarget=Math.round(game.xpTarget*1.22+5);}
 if(game.pendingLevels>0&&mode==='fight'){showLevelUp();}
}
function cardOptions(){
 const options=[];
 for(const w of WEAPONS){const l=game.weapons[w.id]||0;if(l<w.max)options.push({type:'weapon',id:w.id,name:w.name,icon:w.icon,rarity:w.rarity,desc:l?`${w.desc} · STUFE ${l+1}/${w.max}`:`NEUE WAFFE · ${w.desc}`,level:l+1});}
 for(const p of PASSIVES){const l=game.passives[p.id]||0;if(l<p.max)options.push({type:'passive',id:p.id,name:p.name,icon:p.icon,rarity:l>=3?'rare':'common',desc:p.desc,level:l+1});}
 // Stable simple random selection, avoid duplicate IDs.
 for(let i=options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
 return options.slice(0,3);
}
let currentOptions=[];
function showLevelUp(){
 if(!game)return;
 if(game.pendingLevels<=0){beginPlaying();return;}
 setMode('upgrade');snapshotRun();showGameUI(false);
 currentOptions=cardOptions();
 const cards=currentOptions.map((o,i)=>`<button class="upgrade-card rarity-${o.rarity}" data-action="upgrade" data-arg="${i}"><span class="perk-icon">${o.icon}</span><span><b>${o.name}</b><p>${o.desc}</p><div class="level">${o.type==='weapon'?'WAFFE':'TALENT'} · STUFE ${o.level}</div></span></button>`).join('');
 showOverlay(`<div class="eyebrow">✦ LEVEL UP ✦</div><h2 class="screen-title">STUFE ${game.level}</h2><p class="intro">Wähle eine Fähigkeit. Unterschiedliche Kombinationen ergeben neue Builds.</p>${cards}<p class="small-note">Dein Abenteuer pausiert während der Auswahl.</p>`);
 sfx('level');
}
function chooseCard(idx){
 const card=currentOptions[idx];if(mode!=='upgrade'||!card)return;
 if(card.type==='weapon')game.weapons[card.id]=(game.weapons[card.id]||0)+1;
 else{
   game.passives[card.id]=(game.passives[card.id]||0)+1;
   if(card.id==='heart'){game.player.maxHp+=15;game.player.hp=Math.min(game.player.maxHp,game.player.hp+24);}
 }
 game.pendingLevels--;
 spawnFx(game.player.x,game.player.y,'#edd18e',16,42);
 showToast(card.name.toUpperCase(),1.3);
 snapshotRun();if(game.pendingLevels>0)showLevelUp();else beginPlaying();
}
function finishRun(won,message=''){
 if(!game)return;
 const g=game;
 if(mode==='result')return;
 const realm=REALMS[g.realm];
 const bonus=won?realm.reward:Math.floor(g.elapsed/23)+Math.floor(g.level/2);
 const winnings=Math.max(0,Math.floor(g.coins+bonus));
 save.gold+=winnings;
 save.totalKills+=g.kills;
 save.bestTime[g.realm]=Math.max(save.bestTime[g.realm],Math.floor(g.elapsed));
 if(won){save.wins[g.realm]++;save.shards=Math.min(3,save.wins.filter(n=>n>0).length);save.unlockedRealm=Math.max(save.unlockedRealm,Math.min(2,g.realm+1));}
 save.activeRun=null;
 persist();
 setMode('result');showGameUI(false);checkAchievements();
 const title=won?'SIEG ÜBER DEN BOSS!':'ABENTEUER BEENDET';
 showOverlay(`<div class="eyebrow">${won?'✦ SIEGEL GEBORGEN ✦':'✧ DEINE REISE GEHT WEITER'}</div><h2 class="screen-title">${title}</h2><p class="intro">${message|| (won?`Du hast ${realm.boss} bezwungen. Ein neues Kapitel deiner Geschichte beginnt.`:'Du bist stärker geworden. Kehre zur Schmiede zurück und versuche es erneut.')}</p>
 <div class="card"><div class="grid-2">${stat(fmtTime(g.elapsed),'ÜBERLEBT')}${stat(g.level,'LEVEL')}${stat(g.kills,'BESIEGTE GEGNER')}${stat(winnings,'GOLD ERHALTEN')}</div></div>
 ${won&&g.realm<2?`<p class="status-line">NEUES GEBIET FREIGESCHALTET: ${REALMS[g.realm+1].name.toUpperCase()}</p>`:''}${won&&g.realm===2?'<div class="card"><b style="color:#ffe9ba">DIE WELT ATMET WIEDER.</b><p class="intro">Mit dem dritten Fragment sind die Siegel vereint. Lyra wartet mit dem Epilog in der Zuflucht.</p></div>':''}
 ${button('⚔ NEUES ABENTEUER','Anderen Build ausprobieren','heroes','','primary')}
 ${button('⌂ ZUR ZUFLUCHT','Schmiede und dauerhafte Upgrades','sanctuary')}
 <div class="grid-2"><button class="mini-button" data-action="codex">CHRONIK</button><button class="mini-button" data-action="home">HAUPTMENÜ</button></div>`);
 sfx(won?'success':'hit');
}
function heroSpeed(g){return classOf(g.hero).speed*(1+save.forge.speed*.03+(g.passives.boots||0)*.07);}
function totalDamage(g){return classOf(g.hero).power*(1+save.forge.damage*.07+(g.passives.might||0)*.12);}
function totalRate(g){return 1+(g.passives.haste||0)*.10;}
function playerArmor(g){return classOf(g.hero).armor+save.forge.armor+(g.passives.shield||0);}
function pickupRadius(g){return 25+(g.passives.magnet||0)*18;}
function goldMultiplier(g){return 1+(g.passives.fortune||0)*.1;}
function critChance(g){return .04+(g.passives.fortune||0)*.035+(g.hero==='rogue'?.17:0);}
function angleTo(x,y,tx,ty){return Math.atan2(ty-y,tx-x);}
function spawnEnemy(type,boss=false){
 if(!game)return;
 const g=game;const center=g.player;
 const a=rnd(0,TAU),d=Math.max(W,H)*.7+40;
 const x=clamp(center.x+Math.cos(a)*d,24,WORLD-24),y=clamp(center.y+Math.sin(a)*d,24,WORLD-24);
 const data=boss?BOSS_STATS[g.realm]:ENEMIES[type];const mul=(1+g.elapsed/180*.68+g.realm*.30);
 const maxHp=Math.round(data.hp*(boss?1:mul));
 const entity={id:g.nextEnemyId++,type:boss?'boss':type,x,y,hp:maxHp,maxHp,rad:data.rad,spd:data.spd*(boss?1:1+Math.min(.28,g.elapsed/600)),damage:data.damage,attackCd:0,flash:0,shootCd:boss?1.7:rnd(1.5,2.8),dashCd:3.4,slow:0,angle:0,anim:rnd(0,TAU),boss,death:false};
 g.enemies.push(entity);if(boss){g.boss=entity;g.bossTriggered=true;showToast(`BOSS: ${REALMS[g.realm].boss.toUpperCase()}!`,2.5);sfx('boss');}
}
function spawnBoss(health=null){
 if(!game||game.boss?.hp>0)return;
 spawnEnemy('boss',true);
 if(health!==null&&Number.isFinite(health))game.boss.hp=clamp(health,1,game.boss.maxHp);
}
function randomEnemyType(){
 const t=game.elapsed;
 const pool=t<35?['slime','slime','bat']:t<95?['slime','bat','bat','bone']:['slime','bat','bone','caster','brute'];
 return pick(pool);
}
function spawnWave(dt){
 const g=game;
 if(!g.bossTriggered && g.elapsed>=RUN_DURATION){spawnBoss();return;}
 if(g.bossTriggered)return;
 g.spawnClock-=dt;
 if(g.spawnClock<=0&&g.enemies.length<MAX_ENTITIES){
  const wave=1+Math.floor(g.elapsed/38);
  const count=Math.min(4,1+Math.floor(wave/2));
  for(let i=0;i<count&&g.enemies.length<MAX_ENTITIES;i++)spawnEnemy(randomEnemyType());
  g.spawnCount+=count;
  g.spawnClock=Math.max(.31,1.12-wave*.11);
 }
}
function nearestEnemy(maxDistance=Infinity,x=game?.player.x,y=game?.player.y){
 if(!game)return null;
 let candidate=null,shortest=maxDistance*maxDistance;
 for(const e of game.enemies){if(e.death)continue;const d=dist2(x,y,e.x,e.y);if(d<shortest){shortest=d;candidate=e;}}
 return candidate;
}
function addProjectile(x,y,angle,speed,damage,kind,opts={}){
 if(game.projectiles.length>300)return;
 game.projectiles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,damage,kind,rad:opts.rad||4,ttl:opts.ttl||2,pierce:opts.pierce||0,seen:[],slow:opts.slow||0,explosion:opts.explosion||0,crit:opts.crit||false});
}
function addEnemyShot(x,y,angle,speed,damage,kind='bolt'){
 if(game.enemyShots.length>90)return;
 game.enemyShots.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,damage,kind,rad:kind==='heavy'?7:4,ttl:4});
}
function weaponCooldown(id,lv){return ({arcane:.76,blade:.38,arrow:1.12,dagger:.52,fire:2.25,frost:1.65,lightning:2.7,spirit:1.3})[id]/(1+(lv-1)*.13)/totalRate(game);}
function weaponAttack(id,lv){
 const g=game,p=g.player,target=nearestEnemy(280); if(!target&&id!=='blade')return;
 const pow=totalDamage(g),a=target?angleTo(p.x,p.y,target.x,target.y):0;
 switch(id){
 case 'arcane':{
   const count=1+Math.floor(lv/3);
   for(let i=0;i<count;i++)addProjectile(p.x,p.y,a+(i-(count-1)/2)*.14,185,(16+lv*5)*pow,'arcane',{rad:4,pierce:lv>=5?1:0});break;
 }
 case 'arrow':{
   const count=1+Math.floor((lv-1)/2);
   for(let i=0;i<count;i++)addProjectile(p.x,p.y,a+(i-(count-1)/2)*.13,225,(19+lv*7)*pow,'arrow',{rad:3,pierce:1+Math.floor(lv/3)});break;
 }
 case 'dagger':{
   const count=1+Math.floor(lv/2);
   for(let i=0;i<count;i++)addProjectile(p.x,p.y,a+(i-(count-1)/2)*.09,260,(13+lv*4)*pow,'dagger',{rad:3,pierce:lv>=4?1:0});break;
 }
 case 'fire': addProjectile(p.x,p.y,a,132,(24+lv*8)*pow,'fire',{rad:6,explosion:23+lv*5});break;
 case 'frost': for(let i=-1;i<=1;i++)addProjectile(p.x,p.y,a+i*.16,135,(9+lv*4)*pow,'frost',{rad:4,slow:.9+lv*.18});break;
 case 'lightning':{
   const chain=1+lv;let from={x:p.x,y:p.y};const hit=new Set();
   for(let i=0;i<chain;i++){let candidate=null,shortest=170*170;for(const e of g.enemies){if(hit.has(e.id))continue;const d=dist2(from.x,from.y,e.x,e.y);if(d<shortest){candidate=e;shortest=d;}}if(!candidate)break;g.fx.push({type:'bolt',x:from.x,y:from.y,x2:candidate.x,y2:candidate.y,ttl:.22,max:.22,color:'#d4d7ff'});hit.add(candidate.id);damageEnemy(candidate,(23+lv*11)*pow,'lightning');from=candidate;}
   sfx('spark');break;
 }
 case 'spirit': addProjectile(p.x+12,p.y-10,a,205,(18+lv*6)*pow,'spirit',{rad:5,pierce:lv>=4?1:0});break;
 case 'blade':break;
 }
}
function castUltimate(){
 if(mode!=='fight'||!game||game.ultimateCd>0)return;
 const g=game,p=g.player;g.ultimateCd=18;g.ultimateFlash=.45;g.shake=save.settings.shake?5:0;
 const pow=totalDamage(g),h=g.hero;
 if(h==='mage'){
  for(let i=0;i<20;i++)addProjectile(p.x,p.y,i*TAU/20,210,50*pow,'arcane',{rad:5,pierce:2});
 } else if(h==='knight'){
  for(const e of [...g.enemies])if(dist2(e.x,e.y,p.x,p.y)<100*100)damageEnemy(e,140*pow,'blade');
  spawnFx(p.x,p.y,'#9cc5ff',28,110);
 } else if(h==='ranger'){
  for(let i=0;i<16;i++)addProjectile(p.x,p.y,i*TAU/16,240,45*pow,'arrow',{rad:3,pierce:3});
 }else{
  p.inv=2.5;
  for(const e of [...g.enemies])if(dist2(e.x,e.y,p.x,p.y)<150*150)damageEnemy(e,88*pow,'dagger');
 }
 spawnFx(p.x,p.y,classOf(h).color,18,65);sfx('ultimate');showToast(classOf(h).ultimate.toUpperCase(),1.2);
}
function dash(){
 if(mode!=='fight'||!game||game.dashCd>0)return;
 const p=game.player;let vx=input.x,vy=input.y;
 if(!vx&&!vy){vx=p.face||1;vy=0;}
 const mag=Math.hypot(vx,vy)||1;
 p.x=clamp(p.x+vx/mag*70,25,WORLD-25);p.y=clamp(p.y+vy/mag*70,25,WORLD-25);p.inv=.45;
 game.dashCd=4.7;spawnFx(p.x,p.y,'#d9d0ff',12,45);sfx('dash');
}
function spawnFx(x,y,color,count=7,spread=30){if(!game||!save.settings.particles)return;for(let i=0;i<count;i++){const a=rnd(0,TAU),s=rnd(spread*.2,spread);game.fx.push({type:'particle',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,ttl:rnd(.24,.65),max:.65,color,size:Math.random()<.5?2:3});}if(game.fx.length>240)game.fx.splice(0,game.fx.length-240);}
function addText(x,y,text,color='#fff0b5'){if(!game)return;game.labels.push({x,y,text:String(text),color,ttl:.7,max:.7});if(game.labels.length>65)game.labels.shift();}
function healPlayer(n){const p=game.player;p.hp=Math.min(p.maxHp,p.hp+n);addText(p.x,p.y-19,`+${Math.round(n)}`,'#abefaf');sfx('coin');}
function damageEnemy(e,amount,kind){
 if(!game||e.death)return;
 const crit=Math.random()<critChance(game);
 const damage=Math.max(1,Math.round(amount*(crit?1.8:1)));
 e.hp-=damage;e.flash=.10;
 game.damageDealt+=damage;
 addText(e.x,e.y-e.rad-6,(crit?'✦':'')+damage,crit?'#ffd980':'#fff0d4');
 if(kind==='frost')e.slow=Math.max(e.slow,1.2);
 if(e.hp<=0)killEnemy(e);
}
function killEnemy(e){
 if(e.death)return;e.death=true;
 const g=game;g.kills++;
 spawnFx(e.x,e.y,e.boss?'#eaa1b5':e.type==='slime'?'#8aca8e':'#d9c4a0',e.boss?28:8,e.boss?65:32);
 if(!e.boss){
  const exp=ENEMIES[e.type]?.exp||3;g.drops.push({x:e.x,y:e.y,type:'xp',amount:exp,age:0});
  if(Math.random()<.27)g.drops.push({x:e.x+rnd(-7,7),y:e.y+rnd(-7,7),type:'gold',amount:Math.ceil(rnd(2,5)*goldMultiplier(g)),age:0});
  if(Math.random()<.018)g.drops.push({x:e.x,y:e.y-4,type:'heal',amount:18,age:0});
 }else{
  g.boss=null;g.bossKilled=true;
 }
 if(e.boss){finishRun(true);}else if(g.kills%25===0){showToast(`${g.kills} GEGNER BESIEGT!`,1.2);sfx('coin');}
}
function damagePlayer(n){
 if(!game||mode!=='fight')return;const p=game.player;
 if(p.inv>0)return;
 const damage=Math.max(1,Math.round(n-playerArmor(game)));
 p.hp=Math.max(0,p.hp-damage);p.inv=.75;game.shake=save.settings.shake?3:0;spawnFx(p.x,p.y,'#ff8d93',8,30);addText(p.x,p.y-15,'-'+damage,'#ff929c');sfx('hit');
 if(p.hp<=0)finishRun(false,'Du bist gefallen. Deine gesammelten Münzen und Verbesserungen bleiben dir erhalten.');
}
function updateFight(dt){
 const g=game;if(!g||mode!=='fight')return;
 g.elapsed+=dt;g.lastSaved+=dt;
 const p=g.player;
 p.inv=Math.max(0,p.inv-dt);p.anim+=dt;
 g.dashCd=Math.max(0,g.dashCd-dt);g.ultimateCd=Math.max(0,g.ultimateCd-dt);g.ultimateFlash=Math.max(0,g.ultimateFlash-dt);g.shake=Math.max(0,g.shake-18*dt);
 // Keyboard & touch controls. Auto-attacks work while moving, Survivor-style.
 let dx=input.x+(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0);
 let dy=input.y+(keys.has('ArrowDown')||keys.has('s')?1:0)-(keys.has('ArrowUp')||keys.has('w')?1:0);
 const len=Math.hypot(dx,dy);
 if(len>.02){dx/=len;dy/=len;p.face=dx>=0?1:-1;p.x=clamp(p.x+dx*heroSpeed(g)*dt,18,WORLD-18);p.y=clamp(p.y+dy*heroSpeed(g)*dt,18,WORLD-18);}
 spawnWave(dt);
 for(const [id,level] of Object.entries(g.weapons)){
   if(id==='blade')continue;
   g.timers[id]=(g.timers[id]??rnd(.05,.25))-dt;
   if(g.timers[id]<=0){if(g.enemies.length)weaponAttack(id,level);g.timers[id]=weaponCooldown(id,level);}
 }
 const bladeLevel=g.weapons.blade||0;
 if(bladeLevel>0){
   const count=2+Math.floor(bladeLevel/2);const radius=26+bladeLevel*2;
   for(let i=0;i<count;i++){
     const a=g.elapsed*2.8+i*TAU/count,x=p.x+Math.cos(a)*radius,y=p.y+Math.sin(a)*radius;
     for(const e of g.enemies){if(e.death||dist2(x,y,e.x,e.y)>(e.rad+6)**2)continue;if((e.bladeHit||0)>g.elapsed)continue;e.bladeHit=g.elapsed+.35;damageEnemy(e,(9+bladeLevel*4)*totalDamage(g),'blade');}
   }
 }
 // Enemies chase, flank, fire projectiles and collide.
 for(const e of g.enemies){
   if(e.death)continue;
   e.anim+=dt;e.flash=Math.max(0,e.flash-dt);e.slow=Math.max(0,e.slow-dt);e.attackCd=Math.max(0,e.attackCd-dt);e.shootCd-=dt;e.dashCd-=dt;
   let angle=angleTo(e.x,e.y,p.x,p.y);e.angle=angle;
   const slow=e.slow>0?.53:1;
   const d=Math.sqrt(dist2(e.x,e.y,p.x,p.y));
   const steering=e.type==='caster'&&d<130?-.45:1;
   const velocity=e.spd*slow*steering;
   e.x=clamp(e.x+Math.cos(angle)*velocity*dt,10,WORLD-10);
   e.y=clamp(e.y+Math.sin(angle)*velocity*dt,10,WORLD-10);
   if(e.boss){
     if(e.shootCd<=0){const bolts=e.hp<e.maxHp*.45?12:8;for(let k=0;k<bolts;k++)addEnemyShot(e.x,e.y,k*TAU/bolts+g.elapsed*.7,79+g.realm*9,11+g.realm*3,'heavy');e.shootCd=e.hp<e.maxHp*.45?1.4:2.1;sfx('boss');}
     if(e.dashCd<=0){e.x=clamp(e.x+Math.cos(angle)*40,25,WORLD-25);e.y=clamp(e.y+Math.sin(angle)*40,25,WORLD-25);e.dashCd=3.8;spawnFx(e.x,e.y,'#eb8aa2',8,28);}
   }else if(e.type==='caster'&&e.shootCd<=0){
     addEnemyShot(e.x,e.y,angle,95+g.realm*7,8+g.realm*2);e.shootCd=rnd(2.2,3.1);
   }
   if(d<e.rad+9&&e.attackCd<=0){damagePlayer(e.damage);e.attackCd=.9;}
 }
 g.enemies=g.enemies.filter(e=>!e.death&&dist2(e.x,e.y,p.x,p.y)<1250**2);
 // Player projectiles. Keep projectile hit-sets for piercing.
 for(const b of g.projectiles){
   b.x+=b.vx*dt;b.y+=b.vy*dt;b.ttl-=dt;
   if(b.ttl<=0||b.x<0||b.y<0||b.x>WORLD||b.y>WORLD)continue;
   for(const e of [...g.enemies]){
     if(e.death||b.seen.includes(e.id))continue;
     if(dist2(b.x,b.y,e.x,e.y)<(b.rad+e.rad)**2){
       b.seen.push(e.id);damageEnemy(e,b.damage,b.kind);
       if(b.slow)e.slow=Math.max(e.slow,b.slow);
       if(b.explosion){spawnFx(b.x,b.y,'#ffae73',13,40);for(const other of [...g.enemies])if(!other.death&&other.id!==e.id&&dist2(b.x,b.y,other.x,other.y)<b.explosion**2)damageEnemy(other,b.damage*.55,'fire');}
       if(b.seen.length>b.pierce){b.ttl=0;break;}
     }
   }
 }
 g.projectiles=g.projectiles.filter(b=>b.ttl>0&&dist2(b.x,b.y,p.x,p.y)<650**2);
 for(const b of g.enemyShots){b.x+=b.vx*dt;b.y+=b.vy*dt;b.ttl-=dt;if(b.ttl>0&&dist2(b.x,b.y,p.x,p.y)<(b.rad+7)**2){damagePlayer(b.damage);b.ttl=0;}}
 g.enemyShots=g.enemyShots.filter(b=>b.ttl>0&&dist2(b.x,b.y,p.x,p.y)<700**2);
 for(const drop of g.drops){
   drop.age+=dt;
   const d2=dist2(drop.x,drop.y,p.x,p.y);
   if(d2<pickupRadius(g)**2){
     const a=angleTo(drop.x,drop.y,p.x,p.y);const d=Math.sqrt(d2);
     const speed=120+(pickupRadius(g)-d)*3;
     drop.x+=Math.cos(a)*speed*dt;drop.y+=Math.sin(a)*speed*dt;
   }
   if(d2<12**2){drop.dead=true;
     if(drop.type==='xp')gainXP(drop.amount);
     else if(drop.type==='gold'){g.coins+=drop.amount;sfx('coin');}
     else if(drop.type==='heal')healPlayer(drop.amount);
   }
 }
 g.drops=g.drops.filter(d=>!d.dead&&d.age<45);
 for(const f of g.fx){f.ttl-=dt;if(f.type==='particle'){f.x+=f.vx*dt;f.y+=f.vy*dt;}}
 g.fx=g.fx.filter(f=>f.ttl>0);
 for(const t of g.labels){t.ttl-=dt;t.y-=18*dt;}g.labels=g.labels.filter(t=>t.ttl>0);
 if(g.pendingLevels>0&&mode==='fight'){showLevelUp();return;}
 if(g.lastSaved>=8){g.lastSaved=0;snapshotRun();}
 updateHud();
}
function updateHud(){if(!game)return;const g=game,p=g.player;
 $('hud-class').textContent=classOf(g.hero).name.toUpperCase();$('hud-level').textContent='LV '+g.level;
 $('hp-fill').style.width=clamp(p.hp/p.maxHp*100,0,100)+'%';$('hp-text').textContent=`${Math.ceil(p.hp)}/${p.maxHp}`;
 $('xp-fill').style.width=clamp(g.xp/g.xpTarget*100,0,100)+'%';
 $('hero-portrait').textContent=classOf(g.hero).portrait;
 $('hud-world').textContent=`0${g.realm+1} · ${REALMS[g.realm].name.toUpperCase()}`;
 $('hud-wave').textContent=g.bossTriggered?'BOSS':`WELLE ${Math.min(5,1+Math.floor(g.elapsed/38))}`;
 $('hud-time').textContent=fmtTime(g.elapsed);$('hud-kills').textContent=`${g.kills} BESIEGT`;
 $('dash-label').textContent=g.dashCd>.05?`${Math.ceil(g.dashCd)}s`:'SPRINT';
 $('ultimate-label').textContent=g.ultimateCd>.05?`${Math.ceil(g.ultimateCd)}s`:'ULTI';
 dashButton.classList.toggle('cooldown',g.dashCd>.05);ultimateButton.classList.toggle('cooldown',g.ultimateCd>.05);
 const boss=g.boss&&!g.boss.death?g.boss:null;
 $('boss-bar').classList.toggle('hidden',!boss);if(boss){$('boss-name').textContent=REALMS[g.realm].boss.toUpperCase();$('boss-fill').style.width=clamp(boss.hp/boss.maxHp*100,0,100)+'%';}
}

// Procedurally rendered original pixel sprites. Each character is a crisp pixel.
const SPRITES={
 mage:[
 '.....aaa......','....aabaaa....','....abbbba....','....acccca....','...abddddba...','...adddddda...','..addfccfdda..','..addffffdda..','...aeeffeea...','..aeeeeeeea...','..aeeeeeeea...','...eeeeeaea...','...geeeegga...','..gg......gg..','..gg......gg..'],
 knight:[
 '....aaaaa.....','...aabbbbaa...','...abccccba...','...acdccdca...','..aacddddcaa..','..aaddffddaa..','..aeeffffeea..','..aeeffffeea..','...eeeeeeee...','..aeeeeeeeea..','..aeeeeeeeea..','...ee..ee.....','..ggg..ggg....','..gg....gg....','..gg....gg....'],
 ranger:[
 '....aaaa......','...aabbbbaa...','..aabccccbaa..','..abccccccba..','...accddcca...','..aaeffeeaaa..','..aeeffeeeea..','..aeeffeeeea..','..aeeeeeeeea..','...eeeeeaea...','...eeeeeeee...','...gg..gg.....','..ggg..ggg....','..gg....gg....','..gg....gg....'],
 rogue:[
 '....aaaa......','...aabbbbaa...','..aabccccbaa..','..abccccccba..','...accddcca...','..aaeffeeaaa..','..aeeffeeeea..','..aeeffeeeea..','..aeeeeeeeea..','...eeeeeeee...','...eeeeeeee...','...gg..gg.....','..ggg..ggg....','..gg....gg....','..gg....gg....'],
 slime:['............','...aaaaaa...','..aaaaaaab..','.aaacccaaab.','aaaccccccaaa','aaadccddcaaa','aaaccccccaaa','.aaaaaaaaaa.','..aaaaaaaa..','...aaaaaa...'],
 bat:['............','aaa......aaa','aaaaa....aaa','aaabbbbbbaaa','.abbbbbbbba.','...bccccb...','...bdccdb...','....bbbb....','...bb..bb...','............'],
 bone:['...aaaaaa...','..aaaaaaaa..','..aadccdaa..','..aaddddaa..','...acccca...','..aaabbaa...','...abbbba...','..aabbbb aa.','..aaabbaa...','..aa..aa....','..aa..aa....'],
 caster:['...aaaaaa...','..aaaaaaaa..','..aabccbaa..','..aabddbaa..','...acccca...','..aeeeeeea..','..aeeeeeea..','..aeeeeeea..','..aeeeeeea..','...ee..ee...','..gg....gg..'],
 brute:['...aaaaaaaa...','..aaaaaaaaaa..','.aaabbccbaaa.','aaabbccccbaa','aaabdccdcbaa','aaabccccccaa','aaabccccccaa','.aeeeeeeeea.','..eeeeeeee..','..gg....gg..','..gg....gg..'],
 boss:['.......aaaa.......','.....aaaaaaaa.....','....aabbbbbaaa....','...aabccccbbaaa...','...abccccccbaaa...','..aabddddddbaa....','..aabddddddbaa....','..aabcdeedcbaaa...','..aabcdeedcbaaa...','..aabcddddcbaaa...','...aaeeeeeeaaa....','...aeeeeeeeeaa....','..aeeeeeeeeeea....','..aeeeeeeeeeea....','...eea....aee.....','..gggg....gggg....','..gggg....gggg....']
};
const PALETTES={
 mage:{a:'#4e315f',b:'#8865b3',c:'#f4dbbe',d:'#e6c9a6',e:'#6950a1',f:'#4c3657',g:'#34324c'},
 knight:{a:'#414b62',b:'#a8b8ce',c:'#e7d5ad',d:'#efc490',e:'#6288a9',f:'#303b54',g:'#30354a'},
 ranger:{a:'#3a6045',b:'#5e9457',c:'#e4d6ae',d:'#f1c78b',e:'#648557',f:'#334937',g:'#3a4738'},
 rogue:{a:'#3c3351',b:'#665476',c:'#f0d2af',d:'#f2bd8d',e:'#765077',f:'#24263c',g:'#303040'},
 slime:{a:'#6eb06a',b:'#427b4b',c:'#92d781',d:'#1d4637'},
 bat:{a:'#7e5489',b:'#b991ce',c:'#d7bbd9',d:'#322943'},
 bone:{a:'#e3d5bb',b:'#8a7980',c:'#cebba6',d:'#25283d'},
 caster:{a:'#665c8b',b:'#8e82af',c:'#d5b89c',d:'#342942',e:'#574d8a',g:'#2e264c'},
 brute:{a:'#654b4a',b:'#916b5a',c:'#b08d6b',d:'#352e35',e:'#72604b',g:'#302b37'},
 boss:{a:'#5f3d50',b:'#aa6079',c:'#df8b94',d:'#763f59',e:'#f4c69a',g:'#3a253b'}
};
function renderSprite(context,id,x,y,zoom=2,flashed=false,flip=false){
 const rows=SPRITES[id]||SPRITES.slime,colors=PALETTES[id]||PALETTES.slime;
 const cols=Math.max(...rows.map(r=>r.length));const w=cols*zoom,h=rows.length*zoom;
 context.fillStyle='#080b11a0';context.fillRect(Math.round(x-w*.33),Math.round(y-zoom*2),Math.round(w*.67),Math.round(zoom*2));
 for(let ry=0;ry<rows.length;ry++){const line=rows[ry];for(let rx=0;rx<line.length;rx++){const ch=line[rx];if(ch==='.'||ch===' ')continue;context.fillStyle=flashed?'#fff4e2':colors[ch]||'#f5d49e';const px=flip?(cols-rx-1):rx;context.fillRect(Math.round(x-w/2+px*zoom),Math.round(y-h+ry*zoom),Math.ceil(zoom),Math.ceil(zoom));}}
}
function drawPreviews(){for(const el of screen.querySelectorAll('canvas[data-sprite]')){const c=el.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,28,28);renderSprite(c,el.dataset.sprite,14,28,1.5,false,false);}}
function hash(x,y,seed=0){let a=(Math.imul(x,374761393)+Math.imul(y,668265263)+seed*19349663)|0;a=Math.imul(a^(a>>>13),1274126177);return ((a^(a>>>16))>>>0)/4294967295;}
function groundAndProps(realm,camX,camY){
 const theme=REALMS[realm],ts=18;
 ctx.fillStyle=theme.colors[1];ctx.fillRect(0,0,W,H);
 const minX=Math.floor(camX/ts)-1,maxX=Math.floor((camX+W)/ts)+1,minY=Math.floor(camY/ts)-1,maxY=Math.floor((camY+H)/ts)+1;
 for(let gy=minY;gy<=maxY;gy++)for(let gx=minX;gx<=maxX;gx++){
  const x=Math.round(gx*ts-camX),y=Math.round(gy*ts-camY),v=hash(gx,gy,realm+1);
  ctx.fillStyle=theme.colors[Math.floor(v*theme.colors.length)];ctx.fillRect(x,y,ts+1,ts+1);
  if(v>.89){ctx.fillStyle=realm===1?'#8fbdc9':realm===2?'#9e6954':'#537a56';ctx.fillRect(x+3,y+7,4,2);ctx.fillRect(x+9,y+4,3,2);}
  if(v<.045){ctx.fillStyle=realm===1?'#a2bdc9':realm===2?'#302632':'#2c3f38';ctx.fillRect(x+5,y+4,8,9);ctx.fillStyle=theme.colors[4];ctx.fillRect(x+5,y+4,7,2);}
  if(v>.46&&v<.472){ctx.fillStyle=realm===1?'#dbf2f1':realm===2?'#e2a568':'#c6d49c';ctx.fillRect(x+11,y+12,2,2);}
  if(v>.52&&v<.531){ctx.fillStyle=realm===1?'#b7ddeb':realm===2?'#f7a36e':'#4c7252';ctx.fillRect(x+5,y+3,2,6);ctx.fillRect(x+2,y+5,8,2);}
 }
 // Scattered bigger decorations, generated deterministically across an endless-feeling world.
 const sz=100,ix0=Math.floor(camX/sz)-1,iy0=Math.floor(camY/sz)-1;
 for(let j=iy0;j<iy0+Math.ceil(H/sz)+3;j++)for(let i=ix0;i<ix0+Math.ceil(W/sz)+3;i++){
  const v=hash(i,j,realm+43),x=Math.round(i*sz+v*58-camX),y=Math.round(j*sz+hash(i+24,j-13,realm)*44-camY);
  if(v>.71&&v<.89)drawEnvironmentProp(x,y,realm,v);
 }
}
function drawEnvironmentProp(x,y,realm,v){
 if(realm===0){ctx.fillStyle='#342d32';ctx.fillRect(x-3,y-5,8,14);ctx.fillStyle=v>.81?'#436e4b':'#345d43';ctx.fillRect(x-12,y-16,26,13);ctx.fillStyle='#5b8b5c';ctx.fillRect(x-8,y-23,18,12);ctx.fillRect(x-4,y-29,10,8);}
 else if(realm===1){ctx.fillStyle='#8ac6d4';ctx.fillRect(x-8,y-22,16,24);ctx.fillStyle='#c1e9e9';ctx.fillRect(x-3,y-27,7,10);ctx.fillStyle='#568ea8';ctx.fillRect(x-9,y-14,4,13);}
 else{ctx.fillStyle='#2c2732';ctx.fillRect(x-8,y-14,18,17);ctx.fillStyle='#8b5353';ctx.fillRect(x-6,y-14,14,4);ctx.fillStyle='#f49e5d';ctx.fillRect(x,y-7,5,3);}
}
function drawWeaponFx(g){
 const p=g.player;
 const lvl=g.weapons.blade||0;
 if(lvl){const count=2+Math.floor(lvl/2),radius=26+lvl*2;
  for(let i=0;i<count;i++){const a=g.elapsed*2.8+i*TAU/count,x=p.x+Math.cos(a)*radius-camera.x,y=p.y+Math.sin(a)*radius-camera.y;ctx.fillStyle='#fde3b0';ctx.fillRect(Math.round(x)-2,Math.round(y)-8,4,14);ctx.fillStyle='#a9c7ea';ctx.fillRect(Math.round(x)-2,Math.round(y)-8,4,5);ctx.fillStyle='#604f73';ctx.fillRect(Math.round(x)-3,Math.round(y)+5,6,3);}
 }
 if(g.weapons.spirit){const x=p.x+Math.cos(g.elapsed*2)*19-camera.x,y=p.y-25+Math.sin(g.elapsed*3)*8-camera.y;ctx.fillStyle='#fff0a1';ctx.fillRect(Math.round(x)-3,Math.round(y)-3,6,6);ctx.fillStyle='#9bdfff';ctx.fillRect(Math.round(x)-1,Math.round(y)-7,2,14);}
}
function drawProjectile(b){const x=Math.round(b.x-camera.x),y=Math.round(b.y-camera.y);
 if(x<-20||y<-20||x>W+20||y>H+20)return;
 const colors={arcane:['#8b78df','#e8d4ff'],arrow:['#806b50','#fcebc7'],dagger:['#73668c','#edb3ec'],fire:['#ec764b','#ffe28a'],frost:['#74cde2','#e4fdff'],spirit:['#98d8dc','#fff8c8']};const c=colors[b.kind]||colors.arcane;
 ctx.fillStyle=c[0];ctx.fillRect(x-4,y-3,8,6);ctx.fillStyle=c[1];ctx.fillRect(x-2,y-2,4,4);
}
function drawDrops(g){
 for(const d of g.drops){const x=Math.round(d.x-camera.x),y=Math.round(d.y-camera.y);if(x<-10||y<-10||x>W+10||y>H+10)continue;
  if(d.type==='xp'){ctx.fillStyle='#2c6b9e';ctx.fillRect(x-3,y-3,7,7);ctx.fillStyle='#9de8ff';ctx.fillRect(x-1,y-4,3,5);}
  else if(d.type==='gold'){ctx.fillStyle='#9c713d';ctx.fillRect(x-4,y-4,9,9);ctx.fillStyle='#ffd67c';ctx.fillRect(x-2,y-3,5,7);ctx.fillStyle='#fff0ae';ctx.fillRect(x,y-1,2,3);}
  else{ctx.fillStyle='#ae4b5d';ctx.fillRect(x-4,y-4,9,9);ctx.fillStyle='#fca1a2';ctx.fillRect(x-2,y-2,5,5);}
 }
}
function drawEnemies(g){const sorted=g.enemies.filter(e=>!e.death).sort((a,b)=>a.y-b.y);for(const e of sorted){
 const x=e.x-camera.x,y=e.y-camera.y;if(x<-60||y<-65||x>W+60||y>H+65)continue;
 const squish=e.type==='slime'&&Math.sin(e.anim*5)>.5?1:0;
 renderSprite(ctx,e.type,Math.round(x),Math.round(y+squish),e.boss?3:e.type==='brute'?2:1.65,e.flash>0,Math.cos(e.angle)<0);
 if(e.boss){ctx.fillStyle='#1e1221';ctx.fillRect(Math.round(x)-24,Math.round(y)-55,48,5);ctx.fillStyle='#e88a9e';ctx.fillRect(Math.round(x)-23,Math.round(y)-54,Math.round(46*clamp(e.hp/e.maxHp,0,1)),3);}
 }}
function drawHero(g){const p=g.player,x=p.x-camera.x,y=p.y-camera.y;
 if(p.inv>0&&Math.floor(clock*15)%2===0)return;
 renderSprite(ctx,g.hero,Math.round(x),Math.round(y)+7,1.95,false,p.face<0);
 if(g.ultimateFlash>0){ctx.strokeStyle='#eadbff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,20+35*(1-g.ultimateFlash/.45),0,TAU);ctx.stroke();}
}
function drawFx(g){for(const f of g.fx){
 const a=clamp(f.ttl/(f.max||.45),0,1);ctx.globalAlpha=a;
 if(f.type==='particle'){ctx.fillStyle=f.color;ctx.fillRect(Math.round(f.x-camera.x),Math.round(f.y-camera.y),f.size||2,f.size||2);}
 else if(f.type==='bolt'){ctx.strokeStyle=f.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(Math.round(f.x-camera.x),Math.round(f.y-camera.y));const mx=(f.x+f.x2)/2-camera.x+6;const my=(f.y+f.y2)/2-camera.y-8;ctx.lineTo(mx,my);ctx.lineTo(Math.round(f.x2-camera.x),Math.round(f.y2-camera.y));ctx.stroke();}
 ctx.globalAlpha=1;
 }
 ctx.font='bold 9px monospace';ctx.textAlign='center';for(const t of g.labels){ctx.globalAlpha=clamp(t.ttl/t.max,0,1);ctx.fillStyle='#151320';ctx.fillText(t.text,Math.round(t.x-camera.x)+1,Math.round(t.y-camera.y)+1);ctx.fillStyle=t.color;ctx.fillText(t.text,Math.round(t.x-camera.x),Math.round(t.y-camera.y));}ctx.globalAlpha=1;
}
function render(){
 ctx.imageSmoothingEnabled=false;
 let active=game;
 if(!active){camera.x=1100;camera.y=1050;groundAndProps(0,camera.x,camera.y);renderSprite(ctx,'mage',W/2,H*.63,3,false,false);return;}
 const p=active.player;
 camera.x=clamp(p.x-W/2,0,WORLD-W);camera.y=clamp(p.y-H/2,0,WORLD-H);
 ctx.save();if(active.shake>0&&save.settings.shake)ctx.translate(rnd(-active.shake,active.shake),rnd(-active.shake,active.shake));
 groundAndProps(active.realm,camera.x,camera.y);
 drawDrops(active);drawEnemies(active);drawHero(active);drawWeaponFx(active);
 for(const b of active.projectiles)drawProjectile(b);
 for(const b of active.enemyShots){const x=Math.round(b.x-camera.x),y=Math.round(b.y-camera.y);ctx.fillStyle=b.kind==='heavy'?'#ed728b':'#cc85c9';ctx.fillRect(x-4,y-4,b.kind==='heavy'?9:7,b.kind==='heavy'?9:7);ctx.fillStyle='#fff0d7';ctx.fillRect(x-1,y-1,3,3);}
 drawFx(active);ctx.restore();
 // World countdown only, UI bars intentionally outside the pixel canvas.
 if(mode==='fight'&&!active.bossTriggered){const ratio=clamp(active.elapsed/RUN_DURATION,0,1);ctx.fillStyle='#0a0c13bb';ctx.fillRect(6,H-9,W-12,4);ctx.fillStyle=REALMS[active.realm].accent;ctx.fillRect(6,H-9,(W-12)*ratio,4);}
}
function resizeCanvas(){
 const rect=root.getBoundingClientRect();const w=Math.max(180,rect.width||innerWidth),h=Math.max(320,rect.height||innerHeight);
 W=270;H=Math.round(W*h/w);scale=w/W;canvas.width=W;canvas.height=H;ctx.imageSmoothingEnabled=false;
}
function frame(t){
 const dt=Math.min((t-last)/1000||0,.04);last=t;clock+=dt;
 if(toastTimeout>0){toastTimeout-=dt;if(toastTimeout<=0)$('toast').classList.add('hidden');}
 if(mode==='fight')updateFight(dt);
 render();requestAnimationFrame(frame);
}
// Interaction: buttons are delegated so regenerated screens never keep stale handlers.
screen.addEventListener('click',ev=>{
 const btn=ev.target.closest('button[data-action]');if(!btn||btn.disabled)return;
 const a=btn.dataset.action,arg=btn.dataset.arg;
 if(a==='home')return goHome();
 if(a==='heroes')return goHeroes();
 if(a==='realms')return goRealms();
 if(a==='sanctuary')return goSanctuary();
 if(a==='codex')return goCodex();
 if(a==='garden')return goGarden();
 if(a==='story')return goStory();
 if(a==='missions')return goMissions();
 if(a==='settings')return goSettings();
 if(a==='pickHero'){selectedHero=arg;return goHeroes();}
 if(a==='pickRealm'){if(Number(arg)<=save.unlockedRealm){selectedRealm=Number(arg);return goRealms();}return;}
 if(a==='start'){
   if(save.activeRun&&!window.confirm('Dein vorheriger Run wird durch den neuen ersetzt. Neuen Run starten?'))return;
   return startRun();
 }
 if(a==='resume')return restoreRun();
 if(a==='continue')return continueRun();
 if(a==='abandon'){if(window.confirm('Möchtest du den Run wirklich beenden?'))return abandonRun();return;}
 if(a==='upgrade')return chooseCard(Number(arg));
 if(a==='buy')return purchaseForge(arg);
 if(a==='mission')return finishMission(arg);
 if(a==='export')return exportSave();
 if(a==='import')return $('import-file').click();
 if(a==='toggle'&&arg in save.settings){save.settings[arg]=!save.settings[arg];persist();return goSettings();}
 if(a==='breath'){
   const el=$('breath-count');let n=Number(el.dataset.count||0)+1;el.dataset.count=String(n);
   el.textContent=n>=3?'Gut gemacht. Nimm dir die Zeit, die du brauchst.':`${n} von 3 ruhigen Atemzügen. Ganz ohne Eile.`;
   sfx('coin');return;
 }
});
$('import-file').addEventListener('change',ev=>{const f=ev.target.files?.[0];if(f)importSave(f);ev.target.value='';});
$('pause-button').addEventListener('click',pauseRun);
dashButton.addEventListener('click',dash);
ultimateButton.addEventListener('click',castUltimate);
function onJoystick(e){
 const r=joystick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;
 const len=Math.hypot(x,y),fraction=Math.min(1,len/(r.width*.33));
 input.x=len?x/len*fraction:0;input.y=len?y/len*fraction:0;
 knob.style.transform=`translate(${Math.round(input.x*30)}px,${Math.round(input.y*30)}px)`;
}
function releaseJoystick(){stickPointer=null;input.x=0;input.y=0;knob.style.transform='translate(0px,0px)';}
joystick.addEventListener('pointerdown',e=>{if(mode!=='fight')return;e.preventDefault();stickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);onJoystick(e);});
joystick.addEventListener('pointermove',e=>{if(stickPointer===e.pointerId){e.preventDefault();onJoystick(e);}});
joystick.addEventListener('pointerup',e=>{if(stickPointer===e.pointerId)releaseJoystick();});
joystick.addEventListener('pointercancel',e=>{if(stickPointer===e.pointerId)releaseJoystick();});
addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
 keys.add(k==='arrowup'?'ArrowUp':k==='arrowdown'?'ArrowDown':k==='arrowleft'?'ArrowLeft':k==='arrowright'?'ArrowRight':k);
 if(e.repeat)return;
 if(k==='escape'){if(mode==='fight')pauseRun();else if(mode==='pause')continueRun();}
 if(k===' ')castUltimate();if(k==='shift')dash();
});
addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys.delete(k.startsWith('arrow')?'Arrow'+k.slice(5,6).toUpperCase()+k.slice(6):k);});
addEventListener('blur',()=>{keys.clear();releaseJoystick();if(mode==='fight')pauseRun();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='fight')pauseRun();});
addEventListener('pagehide',()=>{if(game&&['fight','pause','upgrade'].includes(mode))snapshotRun();});
addEventListener('beforeunload',()=>{if(game&&['fight','pause','upgrade'].includes(mode))snapshotRun();});
// Web Audio is used only for tiny original synthesized effects. All sounds are optional.
function sfx(kind){
 if(!save.settings.sound)return;
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  if(!audioCtx)audioCtx=new Audio();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
  const notes={coin:[940,1050,.08,'sine'],level:[480,740,.17,'triangle'],upgrade:[670,890,.18,'triangle'],start:[300,600,.16,'triangle'],hit:[150,74,.09,'square'],dash:[310,480,.09,'triangle'],spark:[500,760,.1,'square'],ultimate:[220,800,.25,'sawtooth'],boss:[160,80,.22,'sawtooth'],success:[400,1050,.31,'triangle']};
  const [f1,f2,dur,type]=notes[kind]||notes.coin;
  const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type=type;osc.frequency.setValueAtTime(f1,audioCtx.currentTime);osc.frequency.exponentialRampToValueAtTime(Math.max(f2,30),audioCtx.currentTime+dur);
  gain.gain.setValueAtTime(.0001,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.035,audioCtx.currentTime+.012);gain.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);
  osc.connect(gain);gain.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+dur+.01);
 }catch{}
}
// The game is playable as an ordinary single-page website and as an installed PWA.
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{const tag=$('offline-status');if(tag)tag.textContent='● OFFLINE BEREIT';}).catch(err=>{console.warn('Offline cache unavailable:',err);const tag=$('offline-status');if(tag)tag.textContent='● CACHE-FEHLER';});
 });
}
resizeCanvas();addEventListener('resize',resizeCanvas);addEventListener('orientationchange',()=>setTimeout(resizeCanvas,100));
try{if(!localStorage.getItem(SAVE_KEY))persist();}catch{}
selectedRealm=Math.min(save.unlockedRealm,2);
goHome();requestAnimationFrame(frame);
// Debug/test surface only when launched with explicit ?test=1 (never needed for playing).
if(new URLSearchParams(location.search).get('test')==='1'){
 window.__MOMENT_TEST__={getMode:()=>mode,getSave:()=>JSON.parse(JSON.stringify(save)),getRun:()=>game,begin:(hero='mage',realm=0)=>{selectedHero=hero;selectedRealm=realm;startRun();},advance:(seconds)=>{if(game){game.elapsed+=seconds;updateHud();}},tick:(seconds)=>{if(game){for(let t=0;t<seconds;t+=.033){if(mode!=='fight')break;updateFight(.033);}}},giveXP:(n=50)=>gainXP(n),spawnBoss:()=>spawnBoss(),win:()=>{if(game)finishRun(true);},lose:()=>{if(game)finishRun(false);},upgrade:()=>{if(game){game.pendingLevels++;showLevelUp();}},pause:pauseRun,resume:restoreRun};
}
})();
