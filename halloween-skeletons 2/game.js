(() => {
'use strict';
const data=window.SKELETON_GAME_DATA,A=window.SkeletonArt,model=new window.SkeletonEngine(data);
const $=id=>document.getElementById(id),board=$('board');
let selected=false,drag=null,loaded=false,loadFailed=false,sound=false,audio=null,musicTimer=null,hintTimer=null,ignoreClickUntil=0;
const mobile=window.matchMedia('(max-width:760px)');
function say(s){$('message').textContent=s;}
function picture(a,prefix,width=240,height=330){const r=a.sourceRect,scale=Math.min((width-24)/r[2],(height-22)/r[3]);return A.defs(data,prefix)+A.sprite(a,prefix+'-piece',prefix,false,[(width-r[2]*scale)/2,(height-r[3]*scale)/2,r[2]*scale,r[3]*scale]);}
function render(){
 board.innerHTML=A.defs(data,'board')+'<image href="assets/background.png" width="1600" height="1000" preserveAspectRatio="xMidYMid slice"/><rect width="1600" height="1000" fill="#221430" opacity=".13"/>'+data.characters.map(c=>A.character(data,c,'board',model.placed,model.phase==='complete',model.phase==='playing')).join('');
 board.classList.toggle('dancing',model.phase==='complete');
 for(const p of data.parts){const g=$('board-slot-'+p.id);if(g&&!model.placed.has(p.id))g.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&selected){e.preventDefault();attempt(p.id);}});}
 $('progress').textContent=`${model.placed.size} / 18`;
 $('dots').innerHTML=data.parts.map((_,i)=>`<span class="dot ${i<model.placed.size?'done':''}"></span>`).join('');
}
function showPiece(){
 const p=model.current;selected=false;$('piece').classList.remove('selected','dragging');
 const playing=loaded&&model.phase==='playing';$('piece').disabled=!playing;$('hint').disabled=!playing;
 $('piece').setAttribute('aria-pressed','false');
 if(p){$('piece-title').textContent=p.label;$('piece').setAttribute('aria-label',`Выбрать деталь: ${p.label}`);$('piece-art').innerHTML=picture(p,'tray');}
 else{const complete=model.phase==='complete';$('piece-title').textContent=complete?'Все в сборе!':'Соберём друзей?';$('piece-art').innerHTML=picture(data.art['tito-maraca'],'tray');}
}
function selectPiece(){if(model.phase!=='playing')return;selected=true;$('piece').classList.add('selected');$('piece').setAttribute('aria-pressed','true');say('Теперь нажми на подходящую тень.');}
function clearDrag(){if(drag){const id=drag.id;drag=null;try{if($('piece').hasPointerCapture(id))$('piece').releasePointerCapture(id);}catch{}}$('ghost').hidden=true;$('piece').classList.remove('dragging');}
function stopMusic(){clearInterval(musicTimer);musicTimer=null;}
function ensureAudio(){try{if(!audio){const C=window.AudioContext||window.webkitAudioContext;if(C)audio=new C();}if(audio?.state==='suspended')audio.resume().catch(()=>{});}catch{}}
function tone(freq,duration=.14,delay=0){if(!sound||document.hidden)return;ensureAudio();if(!audio)return;const t=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.055,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration+.03);}
function music(){stopMusic();if(!sound)return;const notes=[523,659,784,659,587,698,880,698,523,659,784,1046,880,784,659,587];let n=0;musicTimer=setInterval(()=>{if(model.phase!=='complete'||!sound){stopMusic();return;}if(document.hidden)return;tone(notes[n%notes.length],.2);if(n%4===0)tone(131,.19);if(++n>=48)stopMusic();},220);}
function start(){if(!loaded)return;clearDrag();stopMusic();clearTimeout(hintTimer);model.start();$('start').hidden=true;$('instruction').textContent='Найди, кому подходит косточка';render();showPiece();say('Сравни форму и изгиб. Кому подходит эта деталь?');}
function attempt(id){if(model.phase!=='playing')return;const result=model.place(id);if(!result.ok){say('Попробуй другую тень. Посмотри на форму и изгиб.');return;}
 clearTimeout(hintTimer);tone(659);tone(880,.16,.1);render();showPiece();$('board-slot-'+id)?.classList.add('just-placed');
 if(result.complete){$('instruction').textContent='Все друзья собрались — пора танцевать!';say('Ура! Ты собрал всех троих. Давай потанцуем!');$('start').textContent='Собрать ещё раз';$('start').hidden=false;music();}
 else{const c=model.characters.get(result.characterId),count=[...model.placed].filter(id=>model.parts.get(id).characterId===c.id).length;say(count===6?`${c.name} готов! Поможем остальным.`:'Подходит! Теперь следующая косточка.');}
}
function point(e){const matrix=board.getScreenCTM();return matrix?new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse()):null;}
function moveGhost(e){const p=model.current;if(!p)return;const m=board.getScreenCTM();if(!m)return;const scale=Math.hypot(m.a,m.b),b=p.bounds,w=b[2]*scale,h=b[3]*scale;$('ghost').style.width=w+'px';$('ghost').style.height=h+'px';$('ghost').style.left=e.clientX-w/2+'px';$('ghost').style.top=e.clientY-h/2+'px';}
$('piece').addEventListener('pointerdown',e=>{if(model.phase!=='playing'||drag||(e.pointerType==='mouse'&&e.button!==0))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};$('piece').setPointerCapture(e.pointerId);});
$('piece').addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7&&!drag.moved){drag.moved=true;const p=model.current,b=p.bounds;$('ghost-art').setAttribute('viewBox',`0 0 ${b[2]} ${b[3]}`);$('ghost-art').innerHTML=A.defs(data,'ghost')+A.sprite(p,'ghost-piece','ghost',false,[0,0,b[2],b[3]]);$('ghost').hidden=false;$('piece').classList.add('dragging');}if(drag.moved)moveGhost(e);});
$('piece').addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const moved=drag.moved;clearDrag();ignoreClickUntil=performance.now()+350;if(!moved){selectPiece();return;}const p=point(e),target=p&&model.dragTarget(p);attempt(target?.id||'');});
$('piece').addEventListener('pointercancel',clearDrag);$('piece').addEventListener('lostpointercapture',clearDrag);
$('piece').addEventListener('click',e=>{if(e.detail===0&&performance.now()>ignoreClickUntil)selectPiece();});
board.addEventListener('click',e=>{if(!selected||model.phase!=='playing'||performance.now()<ignoreClickUntil)return;const p=point(e),target=p&&model.tapTarget(p);attempt(target?.id||'');});
$('hint').addEventListener('click',()=>{const p=model.current;if(!p)return;clearTimeout(hintTimer);board.querySelectorAll('.hinting').forEach(n=>n.classList.remove('hinting'));const g=$('board-slot-'+p.id);g.classList.add('hinting');say('Подходящая тень мерцает. Найди её на поле.');hintTimer=setTimeout(()=>g.classList.remove('hinting'),3200);});
$('start').addEventListener('click',()=>loadFailed?loadAssets():start());$('reset').addEventListener('click',start);
$('sound').addEventListener('click',()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').textContent=sound?'Звук: вкл.':'Звук: выкл.';if(sound){ensureAudio();tone(659);if(model.phase==='complete')music();}else{stopMusic();audio?.suspend().catch(()=>{});}});
$('reference-toggle').addEventListener('click',()=>{clearDrag();const all=new Set(data.parts.map(p=>p.id));$('reference-art').innerHTML=A.defs(data,'reference')+data.characters.map(c=>A.character(data,c,'reference',all,false,false)).join('');$('reference').showModal();});
$('reference-close').addEventListener('click',()=>$('reference').close());
$('reference').addEventListener('click',e=>{if(e.target===$('reference')){const r=$('reference').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('reference').close();}});
function resize(){clearDrag();board.setAttribute('viewBox',mobile.matches?'0 155 1240 745':'0 0 1600 1000');}
window.addEventListener('resize',resize);window.addEventListener('blur',clearDrag);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearDrag();});
async function loadAssets(){loaded=false;loadFailed=false;$('start').disabled=true;$('start').textContent='Загрузка…';say('Загружаем рисунки…');
 const paths=[...new Set(['assets/background.png',...Object.values(data.art).map(a=>a.texture)])];
 try{await Promise.all(paths.map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=()=>reject(new Error(src));img.src=src;})));loaded=true;$('start').disabled=false;$('reset').disabled=false;$('start').textContent='Начать игру';say('Помоги трём друзьям собраться для танца.');}
 catch{loadFailed=true;$('start').disabled=false;$('start').textContent='Повторить загрузку';say('Не удалось загрузить рисунки. Проверь, что папки assets и data загружены целиком.');}
}
resize();render();showPiece();loadAssets();
})();
