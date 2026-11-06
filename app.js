(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORE='a-little-room-chapter1-v1', PREF='a-little-room-chapter1-prefs';
const items=[
 {id:'passport',name:'Passport',x:29,y:41,w:9,story:'Tomorrow, this little book takes me somewhere I’ve only imagined. I’m excited. A little scared, too.'},
 {id:'clothes',name:'Clothes',x:77,y:55,w:14,story:'A few familiar clothes. Maybe getting dressed in a new country will still feel a little like home.'},
 {id:'laptop',name:'Laptop',x:10,y:41,w:17,story:'Assignments, late-night calls, and a whole new way of learning. We have a lot ahead of us, little laptop.'},
 {id:'photo',name:'Family photo',x:16,y:31,w:10,story:'Everyone keeps saying, “You’ll do great.” I’m taking this photo for the days I need to hear it again.'},
 {id:'notebook',name:'Notebook',x:22,y:44,w:10,story:'Dear future me… I don’t know who I’ll become yet. For now, I just want to be brave enough to begin.'},
 {id:'mug',name:'Favorite mug',x:8,y:33,w:9,story:'Tea always tastes a little better in this mug. There should be room for a small comfort, right?'}
];
const byId=id=>items.find(i=>i.id===id), asset=id=>$('#asset-'+id).src;
const icon=id=>`<svg aria-hidden="true"><use href="#lobby-i-${id}"/></svg>`;
const count=()=>state.slots.filter(Boolean).length, packed=id=>state.slots.includes(id);
let state={started:false,completed:false,slots:Array(6).fill(null)};
let volume=.25,music=false,context,musicTimer,toastTimer,lastFocus,dialogType,introStep=0,selected=null,speech={kind:'welcome'},drag=null,ignoreClickUntil=0,storageOK=true,chatCollapsed=false;
try {
 const pref=JSON.parse(localStorage.getItem(PREF));if(pref&&Number.isFinite(pref.volume))volume=Math.max(0,Math.min(.6,pref.volume));
 const data=JSON.parse(localStorage.getItem(STORE));
 if(data&&Array.isArray(data.slots)){const seen=new Set();state.slots=Array.from({length:6},(_,i)=>{const id=data.slots[i];if(byId(id)&&!seen.has(id)){seen.add(id);return id;}return null;});state.started=!!data.started;state.completed=!!data.completed&&state.slots.every(Boolean);}
} catch {storageOK=false;}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));localStorage.setItem(PREF,JSON.stringify({volume}));storageOK=true;}catch{storageOK=false;}}
function announce(message){$('#chapter-status').textContent=message;}
function updateResume(){
 let button=$('#resume');if(!state.started){button?.remove();return;}
 if(!button){button=document.createElement('button');button.id='resume';button.className='resume-button';$('.title-panel').append(button);button.addEventListener('click',()=>{enterRoom();if(state.completed)complete();});}
 button.textContent=state.completed?'Revisit Chapter 1 ✓':`Continue packing · ${count()}/6`;
}
function setChatCollapsed(value){
 chatCollapsed=value;$('#chat-box').classList.toggle('collapsed',value);$('#chat-body').hidden=value;
 $('#chat-toggle').textContent=value?'+':'−';$('#chat-toggle').ariaLabel=value?'Expand chat':'Minimize chat';$('#chat-toggle').setAttribute('aria-expanded',String(!value));
}
function chatText(){
 const item=byId(speech.id);
 if(speech.kind==='packed'&&item&&count()<6)return `${item.id==='clothes'?'My clothes are':item.name+' is'} in! ${item.story} ${6-count()} more ${6-count()===1?'thing':'things'} to go.`;
 if(speech.kind==='removed'&&item)return `Let’s find a better spot for my ${item.name.toLowerCase()}. Pick an empty space in the suitcase, or tap “Pack it”.`;
 if(item)return item.story;
 if(count()===6)return 'A whole life won’t fit in one suitcase. But these little pieces of home are a good place to start. Everything’s in. Shall we close it?';
 if(count()>0)return `There’s a little more room in my suitcase. Can you help me pack the last ${6-count()} ${6-count()===1?'thing':'things'}? Choose an object to hear its story, then put it in.`;
 return 'Tomorrow, I’m flying to the U.S. Will you help me pack six little things from home? Choose an object, then drag it into my suitcase—or tap “Pack it”.';
}
function renderSelection(){
 $$('[data-item]').forEach(el=>{const active=el.dataset.item===selected;el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));});
 const item=byId(speech.id);$('#selected-name').textContent=item?'· '+item.name:'';
 $('#speech').textContent=chatText();$('#packed-count').textContent=`${count()} / 6 packed`;
 $('#chat-hint').textContent=selected?'Drag to the suitcase, or use the button.':count()===6?'All six little things are ready.':'Choose an object in the room.';
 $('#chat-action').hidden=count()===6;$('#finish').hidden=count()!==6;$('#finish').disabled=count()!==6;
 $('#chat-action').innerHTML=selected?'Pack it <span aria-hidden="true">↓</span>':'Show my things <span aria-hidden="true">↗</span>';
 $('#room-case-label').textContent=selected?'Place it here ↓':'My suitcase ↗';$('#room-case').classList.toggle('drop-ready',!!selected);
 $('#room-case').ariaLabel=selected?`Pack ${byId(selected).name} in suitcase`:'Open my suitcase';
 if(dialogType==='packing'){
  $('#case-story').textContent=selected?`${byId(selected).name} · ${byId(selected).story}`:item?chatText():'Choose an item below, then an empty space. Tap a packed item in the suitcase to take it out.';
  $('#drawer-pack').disabled=!selected&&count()!==6;
  $('#drawer-pack').textContent=count()===6?'Close suitcase':selected?'Pack '+byId(selected).name:'Select an item';
 }
}
function inventoryHTML(){return items.map(i=>`<button class="inventory-item${packed(i.id)?' packed':' pickup'}${selected===i.id?' selected':''}" data-item="${i.id}" data-inventory="${i.id}" aria-label="${i.name}${packed(i.id)?' · packed, read its story':' · select'}" aria-pressed="${selected===i.id}"><img src="${asset(i.id)}" alt="" draggable="false"><span>${i.name}</span></button>`).join('');}
function slotsHTML(){return state.slots.map((id,index)=>`<button class="case-slot ${id?'occupied':'empty'}" data-slot="${index}" ${id?'':'data-drop'} aria-label="${id?`Remove ${byId(id).name} from suitcase`:`Empty suitcase slot ${index+1} · place selected item`}">${id?`<img src="${asset(id)}" alt="">`:'+'}</button>`).join('');}
function renderChapter(){
 $('#room-items').innerHTML=items.filter(i=>!packed(i.id)).map(i=>`<button class="scene-item pickup${selected===i.id?' selected':''}" data-item="${i.id}" style="--x:${i.x}%;--y:${i.y}%;--w:${i.w}%" aria-label="Select ${i.name}" aria-pressed="${selected===i.id}"><img src="${asset(i.id)}" alt="" draggable="false"></button>`).join('');
 $('#room-case-fill').innerHTML=state.slots.filter(Boolean).map(id=>`<img src="${asset(id)}" alt="">`).join('');
 if(dialogType==='packing'){$('#case-slots').innerHTML=slotsHTML();$('#inventory').innerHTML=inventoryHTML();$('#case-counter').textContent=count()+' / 6 packed';$('#saved-note').textContent=storageOK?'✓ Saved on this device':'Progress lasts while this page is open';}
 renderSelection();
}
function selectItem(id){
 const item=byId(id);if(!item)return;speech={kind:'selected',id};selected=packed(id)?null:id;setChatCollapsed(false);renderSelection();
 announce(packed(id)?`${item.name} is already packed.`:`${item.name} selected. Drag to the suitcase or use Pack it.`);
}
function pack(id,slotIndex){
 if(!byId(id)||packed(id))return;
 const index=Number.isInteger(slotIndex)&&slotIndex>=0&&slotIndex<6&&!state.slots[slotIndex]?slotIndex:state.slots.indexOf(null);if(index<0)return;
 state.slots[index]=id;state.started=true;state.completed=false;selected=null;speech={kind:count()===6?'ready':'packed',id:count()===6?undefined:id};save();setChatCollapsed(false);renderChapter();updateResume();
 announce(`${byId(id).name} packed. ${count()} of 6.`);
 if(dialogType==='packing'){
  if(count()===6)$('#drawer-pack').focus({preventScroll:true});else $(`[data-inventory="${items.find(i=>!packed(i.id)).id}"]`)?.focus({preventScroll:true});
 }else if(count()===6)$('#finish').focus({preventScroll:true});else $('#chat-action').focus({preventScroll:true});
}
function remove(index){
 const id=state.slots[index];if(!id)return;state.slots[index]=null;state.completed=false;selected=id;speech={kind:'removed',id};save();setChatCollapsed(false);renderChapter();updateResume();announce(`${byId(id).name} returned to the room.`);$(`[data-inventory="${id}"]`)?.focus({preventScroll:true});
}
function centerRoom(){const view=$('#scene-viewport');view.scrollLeft=(view.scrollWidth-view.clientWidth)*.5;}
function enterRoom(){
 close(false);state.started=true;save();$('#world').hidden=true;$('#chapter').hidden=false;document.body.classList.add('in-room');renderChapter();updateResume();setChatCollapsed(false);centerRoom();$('#chapter-title').tabIndex=-1;$('#chapter-title').focus({preventScroll:true});
}
function lobby(){close(false);$('#chapter').hidden=true;$('#world').hidden=false;document.body.classList.remove('in-room');selected=null;speech={kind:'welcome'};updateResume();$('#start').focus({preventScroll:true});}
function open(html,type){
 if(!$('#dialog').open)lastFocus=document.activeElement;dialogType=type;$('#dialog').classList.toggle('packing-dialog',type==='packing');$('#dialog-content').innerHTML=html;
 if(!$('#dialog').open)$('#dialog').showModal();
 const heading=$('#dialog h2');if(heading){heading.id='active-dialog-title';heading.tabIndex=-1;$('#dialog').setAttribute('aria-labelledby','active-dialog-title');heading.focus();}else $('#close').focus();
}
function close(restore=true){
 if($('#dialog').open)$('#dialog').close();dialogType=null;
 if(restore){if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});else if(!$('#chapter').hidden)$('#open-case').focus({preventScroll:true});else $('#start').focus({preventScroll:true});}
}
const intros=[
 ['Hi, I’m Jenny.','I’m from Vietnam. Tomorrow, I’ll fly to the U.S. to start my journey as an international student.'],
 ['The night before.','Everyone has said goodnight, but I’m still awake. A new country, a new school… What if I don’t fit in? What if I do?'],
 ['One little suitcase.','Before any of that, there’s one thing I can do: pack. Come into my room. Let’s choose a few pieces of home to take along.']
];
function intro(step=0){
 introStep=step;const s=intros[step];
 open(`<div class="intro-content fade-in"><div class="intro-art"><img src="${$('#jenny img').src}" alt="Jenny"></div><div class="intro-text"><p class="dialog-kicker">BEFORE THE JOURNEY</p><h2 class="dialog-title">${s[0]}</h2><p class="dialog-copy">${s[1]}</p><span class="welcome-tag">Vietnam → a new beginning</span></div></div><div class="dialog-bottom"><span class="intro-step">0${step+1} / 03</span>${step?'<button class="soft-button" data-intro-back>Back</button>':''}<button class="start" data-intro-next>${step===2?'Enter Jenny’s room':'Continue'}${icon('arrow')}</button></div>`,'intro');
}
function showSuitcase(){
 open(`<p class="dialog-kicker">A FEW PIECES OF HOME</p><h2 class="dialog-title">My little suitcase.</h2><div class="case-dialog-header"><p>Make room for what matters.</p><span class="case-counter" id="case-counter">${count()} / 6 packed</span></div><div class="mini-case"><div class="case-handle" aria-hidden="true"></div><div class="case-top"><span>JENNY’S SUITCASE</span><span aria-hidden="true">✦</span></div><div class="case-slots" id="case-slots">${slotsHTML()}</div></div><div class="inventory" id="inventory">${inventoryHTML()}</div><p class="case-story" id="case-story" aria-live="polite"></p><div class="case-actions"><p class="saved-note" id="saved-note">${storageOK?'✓ Saved on this device':'Progress lasts while this page is open'}</p><button class="chat-primary" id="drawer-pack"></button></div>`,'packing');renderSelection();
}
function help(){open(`<p class="dialog-kicker">CHAPTER 01</p><h2 class="dialog-title">A little help.</h2><ol class="help-list"><li>Jenny gives you your task through the chat in the room. Tap − to tuck it away, or + to bring it back.</li><li>Choose an object to hear its story. Drag it to the open suitcase, or tap “Pack it” in the chat.</li><li>Open “My suitcase” to see all six objects, choose an empty space, or take a packed object out.</li><li>On a narrow screen, swipe across the room or use the look-around arrows to see both sides.</li><li>When all six objects are packed, Jenny will invite you to close the suitcase.</li><li>Keyboard: Tab and Enter to select. Focus the room and use left/right arrows to look around. Escape closes a window.</li></ol><div class="music-controls"><label for="volume">Music volume</label><input type="range" id="volume" min="0" max="60" value="${Math.round(volume*100)}"><output for="volume">${Math.round(volume*100)}%</output></div><button class="soft-button" data-toggle-music>${music?'Turn music off':'Turn music on'}</button><div class="dialog-bottom"><button class="start" data-close>Got it${icon('arrow')}</button></div>`,'help');}
function gameIntroduction(){open(`<p class="dialog-kicker">INTRODUCTION</p><h2 class="dialog-title">The Abroad<br>Chapter</h2><p class="dialog-copy">Meet Jenny, a student from Vietnam about to leave home to study in the United States. Tomorrow is her flight. Tonight, she is still in the room she knows by heart.\n\nHelp her pack six meaningful things, discover the memories they hold, and share the small hopes and worries that come with starting over.</p><span class="welcome-tag">Chapter 1 · Beginnings</span><p class="intro-scope">A short, gentle story to explore at your own pace.</p><div class="dialog-bottom"><button class="soft-button" data-close>Back to lobby</button><button class="start" data-begin-introduction>Begin my story${icon('arrow')}</button></div>`,'introduction');}
function complete(){
 if(count()!==6)return;state.completed=true;save();updateResume();
 open(`<div class="chapter-complete fade-in"><div class="complete-illustration"><img src="${$('#jenny img').src}" alt="Jenny"></div><p class="dialog-kicker">CHAPTER 01 · COMPLETE</p><h2 class="dialog-title">Packed with a little courage.</h2><p class="dialog-copy">“My suitcase is ready. Maybe I don’t have to feel completely ready, too.\n\nTomorrow, I’ll take the first step.”</p><span class="complete-stamp">6 little things · a whole new beginning</span><div class="dialog-bottom"><button class="soft-button" data-review>Look inside my suitcase</button><button class="start" data-lobby>Back to lobby${icon('arrow')}</button></div><button class="resume-button" data-replay>Replay Chapter 1</button></div>`,'complete');
}
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3600);}
function renderMusic(){['#music','#chapter-music'].forEach(sel=>{$(sel).ariaLabel=music?'Turn music off':'Turn music on';$(sel).setAttribute('aria-pressed',String(music));});}
function melody(){if(!music||document.hidden)return;try{context ||= new(window.AudioContext||window.webkitAudioContext)();context.resume();[523.25,659.25,783.99,659.25,587.33,523.25,440,523.25].forEach((f,n)=>{const at=context.currentTime+n*.48,o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(volume*.12,at+.035);g.gain.exponentialRampToValueAtTime(.0001,at+1.25);o.connect(g);g.connect(context.destination);o.start(at);o.stop(at+1.3);});}catch{music=false;clearInterval(musicTimer);renderMusic();}}
function toggleMusic(){music=!music;if(music){melody();musicTimer=setInterval(melody,11000);}else{clearInterval(musicTimer);context?.suspend();}renderMusic();}
$('#start').addEventListener('click',()=>intro());$('#door').addEventListener('click',()=>intro());$('#jenny').addEventListener('click',()=>intro());
$('#help').addEventListener('click',help);$('#chapter-help').addEventListener('click',help);$('#how-link').addEventListener('click',help);$('#introduction')?.addEventListener('click',gameIntroduction);
$('#suitcase').addEventListener('click',()=>toast('Tomorrow begins with a few little things. Let’s help Jenny pack.'));
$('#music').addEventListener('click',toggleMusic);$('#chapter-music').addEventListener('click',toggleMusic);
$('#close').addEventListener('click',()=>close());$('#dialog').addEventListener('cancel',e=>{e.preventDefault();close();});
$('#dialog').addEventListener('click',e=>{
 if(e.target.closest('[data-close]'))close();
 if(e.target.closest('[data-begin-introduction]'))intro();
 if(e.target.closest('[data-intro-next]'))introStep<2?intro(introStep+1):enterRoom();
 if(e.target.closest('[data-intro-back]'))intro(introStep-1);
 if(e.target.closest('[data-toggle-music]')){toggleMusic();help();}
 if(e.target.closest('[data-lobby]'))lobby();
 if(e.target.closest('[data-review]')){enterRoom();showSuitcase();}
 if(e.target.closest('[data-replay]')){state={started:false,completed:false,slots:Array(6).fill(null)};selected=null;speech={kind:'welcome'};save();updateResume();close(false);renderChapter();setChatCollapsed(false);intro();}
 if(e.target.closest('#drawer-pack')){if(count()===6)complete();else if(selected)pack(selected);}
});
$('#dialog').addEventListener('input',e=>{if(e.target.id==='volume'){volume=Number(e.target.value)/100;$('#dialog output').textContent=e.target.value+'%';save();}});
$('#back-lobby').addEventListener('click',lobby);$('#finish').addEventListener('click',complete);$('#open-case').addEventListener('click',showSuitcase);
$('#chat-action').addEventListener('click',()=>selected?pack(selected):showSuitcase());$('#chat-toggle').addEventListener('click',()=>setChatCollapsed(!chatCollapsed));
function pan(direction){$('#scene-viewport').scrollBy({left:direction*Math.max(200,innerWidth*.65),behavior:'smooth'});}
$('#pan-left').addEventListener('click',()=>pan(-1));$('#pan-right').addEventListener('click',()=>pan(1));
$('#scene-viewport').addEventListener('keydown',e=>{if(e.target!==$('#scene-viewport'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();pan(e.key==='ArrowLeft'?-1:1);}});
function gameClick(e){
 if(Date.now()<ignoreClickUntil)return;
 const item=e.target.closest('[data-item]');if(item){selectItem(item.dataset.item);return;}
 const slot=e.target.closest('[data-slot]');if(slot&&state.slots[Number(slot.dataset.slot)]){remove(Number(slot.dataset.slot));return;}
 const drop=e.target.closest('[data-drop]');if(drop){if(selected)pack(selected,slot?Number(slot.dataset.slot):undefined);else showSuitcase();}
}
$('#chapter').addEventListener('click',gameClick);$('#dialog').addEventListener('click',gameClick);
// The room and the suitcase window share pointer controls, including touch.
document.addEventListener('pointerdown',e=>{
 const source=e.target.closest('.pickup');if(!source||e.button!==0)return;
 drag={id:source.dataset.item,x:e.clientX,y:e.clientY,pointer:e.pointerId,source,moved:false,ghost:null};
});
document.addEventListener('pointermove',e=>{
 if(!drag||drag.pointer!==e.pointerId)return;
 if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7){drag.moved=true;drag.source.setPointerCapture(e.pointerId);drag.ghost=document.createElement('img');drag.ghost.src=asset(drag.id);drag.ghost.className='drag-ghost';drag.ghost.alt='';($('#dialog').open?$('#dialog'):document.body).append(drag.ghost);document.body.classList.add('dragging');selected=drag.id;renderSelection();}
 if(!drag.moved)return;e.preventDefault();drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';$$('.drag-over').forEach(el=>el.classList.remove('drag-over'));document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop]')?.classList.add('drag-over');
},{passive:false});
function endDrag(e,cancel=false){
 if(!drag||drag.pointer!==e.pointerId)return;const d=drag;drag=null;
 if(d.moved){ignoreClickUntil=Date.now()+350;d.ghost?.remove();document.body.classList.remove('dragging');$$('.drag-over').forEach(el=>el.classList.remove('drag-over'));try{d.source.releasePointerCapture(e.pointerId);}catch{}
 const drop=cancel?null:document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop]');if(drop)pack(d.id,drop.hasAttribute('data-slot')?Number(drop.dataset.slot):undefined);else selectItem(d.id);
 }
}
document.addEventListener('pointerup',e=>endDrag(e));document.addEventListener('pointercancel',e=>endDrag(e,true));
window.addEventListener('resize',()=>{if(!$('#chapter').hidden)centerRoom();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)context?.suspend();else if(music)context?.resume();});
$('#chapter-note').textContent='Chapter 1 · The night before.';document.documentElement.lang='en';renderMusic();updateResume();renderChapter();
})();
