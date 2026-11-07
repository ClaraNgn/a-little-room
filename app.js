(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORE='a-little-room-chapter1-v1', PREF='a-little-room-chapter1-prefs';
const items=[
 {id:'passport',name:'Passport',x:29,y:41,w:9,story:'Tomorrow, this little passport takes me to my new life. Isn’t it exciting? A little scary, too.'},
 {id:'clothes',name:'School uniform',x:77,y:55,w:14,story:'My high school uniform. A little reminder of where I started, and of the courage I’m taking into this next chapter.'},
 {id:'laptop',name:'Laptop',x:10,y:41,w:17,story:'Assignments, late-night calls, and a whole new way of learning. We have a lot ahead of us, little laptop.'},
 {id:'photo',name:'Family photo',x:16,y:31,w:10,story:'Everyone keeps saying, “You’ll do great.” I’m taking this photo for the days I need to hear it again.'},
 {id:'notebook',name:'Film roll',x:22,y:44,w:10,story:'A few frames from home, and room for all the places I haven’t seen yet. I wonder what stories this little roll will hold.'},
 {id:'mug',name:'Letter',x:8,y:33,w:9,story:'A little letter from home. I’ll save it for a day when the people I love feel an ocean away.'}
];
const byId=id=>items.find(i=>i.id===id), asset=id=>$('#asset-'+id).src;
const icon=id=>`<svg aria-hidden="true"><use href="#lobby-i-${id}"/></svg>`;
const count=()=>state.slots.filter(Boolean).length, packed=id=>state.slots.includes(id);
const journeySteps=['morning','airport','checkedin','goodbye','gate','takeoff','ocean','america','end'];
let state={started:false,completed:false,slots:Array(6).fill(null)};
let volume=.25,music=false,soundEffects=true,context,musicTimer,toastTimer,lastFocus,dialogType,introStep=0,selected=null,speech={kind:'welcome'},drag=null,ignoreClickUntil=0,storageOK=true,chatCollapsed=false;
try {
 const pref=JSON.parse(localStorage.getItem(PREF));if(pref&&Number.isFinite(pref.volume))volume=Math.max(0,Math.min(.6,pref.volume));if(pref&&typeof pref.soundEffects==='boolean')soundEffects=pref.soundEffects;
 const data=JSON.parse(localStorage.getItem(STORE));
 if(data&&Array.isArray(data.slots)){state.campusGuided=!!data.campusGuided;state.campusClassFound=!!data.campusClassFound;state.campusAsked=state.campusClassFound&&!!data.campusAsked;state.campusLibraryFound=state.campusAsked&&!!data.campusLibraryFound;state.campusCenterFound=state.campusLibraryFound&&!!data.campusCenterFound;state.campusVisit=data.campusVisit==='center'&&state.campusLibraryFound?'center':data.campusVisit==='library'&&state.campusAsked?'library':'classroom';const seen=new Set();state.slots=Array.from({length:6},(_,i)=>{const id=data.slots[i];if(byId(id)&&!seen.has(id)){seen.add(id);return id;}return null;});state.started=!!data.started;state.completed=!!data.completed&&state.slots.every(Boolean);if(state.completed&&journeySteps.includes(data.journey)){state.journey=data.journey;state.message=data.message==='miss'?'miss':'call';state.promise=data.promise==='ask'?'ask':'begin';}}
} catch {storageOK=false;}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));localStorage.setItem(PREF,JSON.stringify({volume,soundEffects}));storageOK=true;}catch{storageOK=false;}}
function announce(message){$('#chapter-status').textContent=message;}
function updateResume(){ $('#resume')?.remove(); }
function setChatCollapsed(value){
 chatCollapsed=value;$('#chat-box').classList.toggle('collapsed',value);$('#chat-body').hidden=value;
 $('#chat-toggle').textContent=value?'+':'−';$('#chat-toggle').ariaLabel=value?'Expand chat':'Minimize chat';$('#chat-toggle').setAttribute('aria-expanded',String(!value));
}
function chatText(){
 const item=byId(speech.id);
 if(speech.kind==='packed'&&item&&count()<6)return `${item.name} is in! ${item.story} ${6-count()} more ${6-count()===1?'thing':'things'} to go.`;
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
 $('#chat-hint').textContent=selected?'Drag to the suitcase, or use the button.':count()===6?'':'Choose an object in the room.';$('#chat-hint').hidden=!$('#chat-hint').textContent;
 $('#chat-action').hidden=count()===6;$('#finish').hidden=count()!==6;$('#finish').disabled=count()!==6;
 $('#chat-action').innerHTML=selected?'Pack it <span aria-hidden="true">↓</span>':'Show my things <span aria-hidden="true">↗</span>';
 $('#room-case-label').textContent=selected?'Place it here ↓':'My suitcase ↗';$('#room-case').classList.toggle('drop-ready',!!selected);
 $('#room-case').ariaLabel=selected?`Pack ${byId(selected).name} in suitcase`:'Open my suitcase';
 if(dialogType==='packing'){
  $('#case-story').textContent=selected?`${byId(selected).name} · ${byId(selected).story}`:item?`${item.name} · ${item.story}`:'Choose an item below, then an empty space. Tap a packed item in the suitcase to take it out.';
  $('#drawer-pack').disabled=!selected&&count()!==6;
  $('#drawer-pack').textContent=count()===6?'Close suitcase':selected?'Pack '+byId(selected).name:'Select an item';
 }
}
function inventoryHTML(){return items.map(i=>`<button class="inventory-item${packed(i.id)?' packed':' pickup'}${selected===i.id?' selected':''}" data-item="${i.id}" data-inventory="${i.id}" aria-label="${i.name}${packed(i.id)?' · packed, read its story':' · select'}" aria-pressed="${selected===i.id}"><img src="${asset(i.id)}" alt="" draggable="false"><span>${i.name}</span></button>`).join('');}
function slotsHTML(){return state.slots.map((id,index)=>`<button class="case-slot ${id?'occupied':'empty'}" data-slot="${index}" ${id?'':'data-drop'} aria-label="${id?`Remove ${byId(id).name} from suitcase`:`Empty suitcase slot ${index+1} · place selected item`}">${id?`<img src="${asset(id)}" alt="">`:'+'}</button>`).join('');}
function renderChapter(){
 $('#room-items').innerHTML=items.filter(i=>!packed(i.id)).map(i=>`<button class="scene-item pickup${selected===i.id?' selected':''}" data-item="${i.id}" style="--x:${i.x}%;--y:${i.y}%;--w:${i.w}%" aria-label="Select ${i.name}" aria-pressed="${selected===i.id}"><img src="${asset(i.id)}" alt="" draggable="false"></button>`).join('');
 $('#room-case-fill').innerHTML=state.slots.filter(Boolean).map(id=>`<img src="${asset(id)}" alt="">`).join('');
 if(dialogType==='packing'){$('#case-slots').innerHTML=slotsHTML();$('#inventory').innerHTML=inventoryHTML();$('#case-counter').textContent=count()+' / 6 packed';}
 renderSelection();
}
function selectItem(id){
 const item=byId(id);if(!item)return;speech={kind:'selected',id};selected=packed(id)?null:id;setChatCollapsed(false);renderSelection();
 announce(packed(id)?`${item.name} is already packed.`:`${item.name} selected. Drag to the suitcase or use Pack it.`);
}
function pack(id,slotIndex){
 if(!byId(id)||packed(id))return;
 const index=Number.isInteger(slotIndex)&&slotIndex>=0&&slotIndex<6&&!state.slots[slotIndex]?slotIndex:state.slots.indexOf(null);if(index<0)return;
 state.slots[index]=id;state.started=true;state.completed=false;delete state.journey;selected=null;speech={kind:count()===6?'ready':'packed',id:count()===6?undefined:id};save();setChatCollapsed(false);renderChapter();updateResume();
 announce(`${byId(id).name} packed. ${count()} of 6.`);
 if(dialogType==='packing'){
  if(count()===6)$('#drawer-pack').focus({preventScroll:true});else $(`[data-inventory="${items.find(i=>!packed(i.id)).id}"]`)?.focus({preventScroll:true});
 }else if(count()===6)$('#finish').focus({preventScroll:true});else $('#chat-action').focus({preventScroll:true});
}
function remove(index){
 const id=state.slots[index];if(!id)return;state.slots[index]=null;state.completed=false;delete state.journey;selected=id;speech={kind:'removed',id};save();setChatCollapsed(false);renderChapter();updateResume();announce(`${byId(id).name} returned to the room.`);$(`[data-inventory="${id}"]`)?.focus({preventScroll:true});
}
function centerRoom(){const view=$('#scene-viewport');view.scrollLeft=(view.scrollWidth-view.clientWidth)*.5;}
function enterRoom(){
 close(false);$('#campus').hidden=true;$('#journey').hidden=true;state.started=true;save();$('#world').hidden=true;$('#chapter').hidden=false;document.body.classList.add('in-room');renderChapter();updateResume();setChatCollapsed(false);centerRoom();$('#chapter-title').tabIndex=-1;$('#chapter-title').focus({preventScroll:true});
}
function lobby(){stopClip();close(false);$('#campus').hidden=true;$('#journey').hidden=true;$('#chapter').hidden=true;$('#world').hidden=false;document.body.classList.remove('in-room');selected=null;speech={kind:'welcome'};updateResume();$('#start').focus({preventScroll:true});}
function open(html,type){
 if(!$('#dialog').open)lastFocus=document.activeElement;dialogType=type;$('#dialog').classList.toggle('packing-dialog',type==='packing');$('#dialog').classList.toggle('campus-map-dialog',type==='campus-guide');$('#dialog').classList.toggle('campus-stamps-dialog',type==='campus-stamps');$('#dialog-content').innerHTML=html;
 if(!$('#dialog').open)$('#dialog').showModal();
 const heading=$('#dialog h2');if(heading){heading.id='active-dialog-title';heading.tabIndex=-1;$('#dialog').setAttribute('aria-labelledby','active-dialog-title');heading.focus();}else $('#close').focus();
}
function close(restore=true){
 if($('#dialog').open)$('#dialog').close();dialogType=null;
 if(restore){if(lastFocus?.isConnected&&lastFocus.getClientRects().length)lastFocus.focus({preventScroll:true});else if(!$('#campus').hidden)$('#campus-map').focus({preventScroll:true});else if(!$('#journey').hidden)$('#journey-title').focus({preventScroll:true});else if(!$('#chapter').hidden)$('#open-case').focus({preventScroll:true});else $('#start').focus({preventScroll:true});}
}
const intros=[
 ['Hi, I’m Clara.','I’m from Vietnam. Tomorrow, I’ll fly to the U.S. to start my journey as an international student.'],
 ['The night before.','Everyone has said goodnight, but I’m still awake. A new country, a whole new life… What if I don’t fit in?'],
 ['One little suitcase.','Before any of that, there’s one thing I can do: pack my carry on suitcase. Come into my room. Let’s choose a few pieces of home to take along.']
];
function intro(step=0){
 introStep=step;const s=intros[step];
 open(`<div class="intro-content fade-in"><div class="intro-art"><img src="${$('#jenny img').src}" alt="Clara"></div><div class="intro-text"><h2 class="dialog-title">${s[0]}</h2><p class="dialog-copy">${s[1]}</p></div></div><div class="dialog-bottom"><span class="intro-step">0${step+1} / 03</span>${step?'<button class="soft-button" data-intro-back>Back</button>':''}<button class="start" data-intro-next>${step===2?'Enter Clara’s room':'Continue'}${icon('arrow')}</button></div>`,'intro');
}
function showSuitcase(){
 open(`<h2 class="dialog-title">My little suitcase.</h2><div class="case-dialog-header"><span class="case-counter" id="case-counter">${count()} / 6 packed</span></div><div class="mini-case"><div class="case-handle" aria-hidden="true"></div><div class="case-top"><span>CLARA’S SUITCASE</span><span aria-hidden="true">✦</span></div><div class="case-slots" id="case-slots">${slotsHTML()}</div></div><div class="inventory" id="inventory">${inventoryHTML()}</div><p class="case-story" id="case-story" aria-live="polite"></p><div class="case-actions"><button class="chat-primary" id="drawer-pack"></button></div>`,'packing');renderSelection();
}
function help(){open(`<p class="dialog-kicker">CHAPTER 01</p><h2 class="dialog-title">A little help.</h2><ol class="help-list"><li>Clara gives you your task through the chat in the room. Tap − to tuck it away, or + to bring it back.</li><li>Choose an object to hear its story. Drag it to the open suitcase, or tap “Pack it” in the chat.</li><li>Open “My suitcase” to see all six objects, choose an empty space, or take a packed object out.</li><li>On a narrow screen, swipe across the room or use the look-around arrows to see both sides.</li><li>When all six objects are packed, close the suitcase and choose “Sleep until morning” to continue.</li><li>At the airport, follow Clara’s chat to check in, write home and board. After boarding, enjoy a four-second flight film. Short films continue automatically; use Skip to move on sooner. You can also tap the glowing airport buttons.</li><li>Your packing progress is saved on this device. Choose “Begin my story!” in the lobby to enter Clara’s introduction and return to her room.</li><li>Keyboard: Tab and Enter to select. Focus the room and use left/right arrows to look around. Escape closes a window.</li></ol><div class="music-controls"><label for="volume">Music volume</label><input type="range" id="volume" min="0" max="60" value="${Math.round(volume*100)}"><output for="volume">${Math.round(volume*100)}%</output></div><div class="audio-options"><button class="soft-button" data-toggle-music>${music?'Turn music off':'Turn music on'}</button><button class="soft-button" data-toggle-sfx aria-pressed="${soundEffects}">${soundEffects?'Turn sound effects off':'Turn sound effects on'}</button></div><div class="dialog-bottom"><button class="start" data-close>Got it${icon('arrow')}</button></div>`,'help');}
function gameIntroduction(){open(`<p class="dialog-kicker">INTRODUCTION</p><h2 class="dialog-title">The Abroad<br>Chapter</h2><p class="dialog-copy">Meet Clara, a student from Vietnam ready to start her new life in the United States. Tomorrow is her flight! Tonight, she is still in the room she knows by heart.\n\nLet’s witness her journey miles away from home.</p><span class="welcome-tag">Chapter 1 · Beginnings</span><div class="dialog-bottom"><button class="soft-button" data-close>Back to lobby</button><button class="start" data-begin-introduction>Begin my story${icon('arrow')}</button></div>`,'introduction');}
function complete(){
 if(count()!==6)return;state.completed=true;save();updateResume();
 open(`<div class="chapter-complete fade-in"><div class="complete-illustration"><img src="${$('#jenny img').src}" alt="Clara"></div><h2 class="dialog-title">Packed with a little courage.</h2><p class="dialog-copy">“My suitcase is ready. Maybe I don’t have to feel completely ready, too.\nTomorrow, I’ll take the first step.”</p><div class="dialog-bottom"><button class="soft-button" data-review>Look inside my suitcase</button><button class="start" data-journey="morning">Sleep until morning${icon('arrow')}</button></div><button class="resume-button" data-lobby>Back to lobby</button></div>`,'complete');
}
const journeyScenes={
 morning:{title:'The next morning.',place:'Vietnam · Before sunrise',progress:'A new day',text:'I barely slept. Now the suitcase is by the door, and the house is so quiet. I’m going to miss the little things I never thought to notice.',hint:'Take this moment at your own pace.',action:'Leave for the airport',next:'airport'},
 airport:{title:'A small first step.',place:'Vietnam · Airport departures',progress:'1 / 3 · Check in',text:'The airport is already awake. Wheels on the floor, voices overhead… and me, holding my passport a little too tightly. Can you help me check in?',hint:'Tap “Check in” at the counter.',action:'Check in',task:'checkin'},
 checkedin:{title:'A boarding pass, a deep breath.',place:'Airport departures · Before boarding',progress:'2 / 3 · A message home',text:'My suitcase is checked in, and my boarding pass is in my hand. Before I go through to the gate, I want to leave one little message for home.',hint:'Open phone',action:'Open my phone',task:'phone'},
 goodbye:{title:'Home comes with me.',place:'Airport departures · Ready to depart',progress:'3 / 3 · Departure',text:'The message is sent. Somehow, a few words make the distance feel smaller already. My passport and boarding pass are ready. It’s time to depart.',hint:'Tap “Depart” when you’re ready.',action:'Depart',next:'takeoff'},
 gate:{title:'This is really happening.',place:'Departure gate · Boarding now',progress:'Ready to board',text:'That’s my flight. I thought courage would feel bigger than this. Right now, it feels like taking one breath… and then one step forward.',hint:'You’ve done everything you need for this departure.',action:'Board the plane',next:'takeoff'},
 takeoff:{title:'And then, we lift off.',place:'Above Vietnam · The journey begins',progress:'Taking flight',text:'The wheels leave the ground. The streets become little lines, and everything I know gets smaller beneath the clouds. Goodbye for now, home.',hint:'Watch the clouds go by, then continue when you’re ready.',action:'Look out of the window',next:'ocean'},
 ocean:{title:'Somewhere between two worlds.',place:'Over the ocean · Bound for the United States',progress:'Across the ocean',text:'There’s so much sky out here. Somewhere between the place I’m leaving and the place I haven’t met, I open my notebook. Dear future me… what should I remember?',hint:'Leave a small promise for the Clara who comes next.',action:'Write a little promise',task:'promise'},
 america:{title:'A little closer to tomorrow.',place:'Approaching the United States · A new morning',progress:'A new horizon',text:'The cabin slowly wakes up. Beyond the clouds, a different coastline comes into view. I’m still nervous. But I made it this far, one small step at a time.',hint:'The next part of Clara’s life is just ahead.',action:'Keep this moment',next:'end'},
 end:{title:'Hello, America.',place:'United States · A new beginning',progress:'Chapter 1 · Complete',text:'',hint:'You’ve reached the end of Chapter 1.',action:'My little journey',task:'ending'}
};
let clipNext=null;
function stopClip(){clipNext=null;const video=$('#cutscene-video');video.pause();$('#cutscene').hidden=true;$('#journey').classList.remove('is-cutscene');}
function finishClip(){if(!clipNext)return;const next=clipNext;stopClip();enterJourney(next);}
function startClip(kind){
 const clip=window.journeyClips?.[kind],video=$('#cutscene-video');
 clipNext=kind==='morning'?'airport':'end';$('#cutscene').hidden=false;$('#journey').classList.add('is-cutscene');
 $('#cutscene').classList.toggle('morning-film',kind==='morning');
 $('#clip-kicker').textContent=kind==='morning'?'ONE GOOD SLEEP LATER':'VIETNAM → UNITED STATES';
 $('#clip-title').textContent=kind==='morning'?'The next morning…':'A little plane. A big adventure.';
 $('#clip-skip').textContent='→';$('#clip-skip').ariaLabel='Skip animation';$('#clip-play').hidden=true;
 video.muted=true;video.playsInline=true;video.loop=false;video.poster=clip?.poster||'';
 if(!clip){$('#clip-play').hidden=false;$('#clip-play').textContent='→';$('#clip-play').ariaLabel='Continue';return;}
 video.src=clip.src;video.currentTime=0;
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){$('#clip-play').hidden=false;$('#clip-play').textContent='▷';$('#clip-play').ariaLabel='Play animation';$('#clip-skip').textContent='→';$('#clip-skip').ariaLabel='Continue';}
 else video.play().catch(()=>{$('#clip-play').hidden=false;$('#clip-play').textContent='▷';$('#clip-play').ariaLabel='Play animation';});
 $('#clip-title').focus({preventScroll:true});announce(kind==='morning'?'A 3.5-second film of sunrise in Clara’s room before heading to the airport.':'A 4-second film of a little airplane flying past soft clouds toward America.');
}
$('#cutscene-video').addEventListener('ended',finishClip);
$('#cutscene-video').addEventListener('error',()=>{if(clipNext){$('#clip-play').hidden=true;$('#clip-skip').textContent='→';$('#clip-skip').ariaLabel='Continue';}});
$('#clip-skip').addEventListener('click',finishClip);$('#clip-lobby').addEventListener('click',lobby);
$('#clip-play').addEventListener('click',()=>{if(!window.journeyClips){finishClip();return;}$('#cutscene-video').play().then(()=>{$('#clip-play').hidden=true;}).catch(()=>{$('#clip-skip').textContent='→';$('#clip-skip').ariaLabel='Continue';});});
document.addEventListener('visibilitychange',()=>{if(!clipNext)return;const video=$('#cutscene-video');if(document.hidden)video.pause();else if(!matchMedia('(prefers-reduced-motion: reduce)').matches)video.play().catch(()=>{$('#clip-play').hidden=false;});});
function setJourneyCollapsed(value){$('#journey-chat-body').hidden=value;$('#journey-toggle').textContent=value?'+':'−';$('#journey-toggle').ariaLabel=value?'Expand chat':'Minimize chat';$('#journey-toggle').setAttribute('aria-expanded',String(!value));}
function enterJourney(step){
 if(count()!==6||!journeySteps.includes(step))return;
 // Older saves at the gate now return to the single departure step.
 if(step==='gate')step='goodbye';
 if(step==='ocean'||step==='america')step='takeoff';
 stopClip();
 close(false);state.completed=true;state.started=true;state.journey=step;save();updateResume();
 $('#campus').hidden=true;$('#world').hidden=true;$('#chapter').hidden=true;$('#journey').hidden=false;document.body.classList.add('in-room');
 const scene=journeyScenes[step], flying=journeySteps.indexOf(step)>=5,atAirport=['airport','checkedin','goodbye','gate'].includes(step);
 $('#journey').className='journey scene-'+step+(flying?' is-flying':'')+(atAirport?' is-airport':'');
 $('#journey-title').textContent=atAirport?'Airport':scene.title;$('.journey-caption>p').hidden=atAirport;$('#journey-place').hidden=atAirport;$('#journey-place').textContent=atAirport?'':scene.place;$('#journey-progress').textContent=scene.progress;
 $('#journey-speech').textContent=scene.text;$('#journey-speech').hidden=step==='end';$('#journey-hint').textContent=scene.hint;$('#journey-hint').hidden=!scene.hint;
 $('#journey-actions').hidden=step==='airport'||step==='checkedin';
 $('#journey-actions').innerHTML=(step==='airport'||step==='checkedin')?'':`<button class="chat-primary" ${scene.next?`data-journey="${scene.next}"`:`data-travel-task="${scene.task}"`}>${scene.action} <span aria-hidden="true">→</span></button>`;
 $('#journey-background').src=step==='morning'?$('.room-background').src:flying?(window.journeyClips?.flight.poster||asset('airport')):asset('airport');
 $('#airport-character').hidden=step==='morning'||flying;
 const hotspot=$('#airport-hotspot');hotspot.hidden=!atAirport;hotspot.ariaLabel=step==='checkedin'?'Open Clara’s phone':scene.action;hotspot.innerHTML=step==='checkedin'?`<img src="${asset('phone')}" alt="" draggable="false">`:scene.action+' ↗';
 hotspot.className='airport-hotspot '+(step==='airport'?'at-counter':step==='checkedin'?'at-phone':'at-gate');
 setJourneyCollapsed(false);$('#journey-title').focus({preventScroll:true});announce(scene.title+' '+scene.text);
 if(step==='morning'||step==='takeoff')startClip(step==='morning'?'morning':'flight');
 if(step==='end')$('#journey-actions').insertAdjacentHTML('afterbegin','<button class="text-button" data-journey="takeoff">Watch flight again</button>');
}
function travelTask(task){
 if(task==='checkin'&&state.journey==='airport')open(`<h2 class="dialog-title airport-dialog-title">One step at a time.</h2><div class="travel-document"><img src="${asset('passport')}" alt="Clara’s passport"><p>“Good morning. Your passport, please.”<br><br>I’ve practiced this moment in my head. Now I just need to hand it over.</p></div><div class="dialog-bottom"><button class="start" data-travel-task="passport">Show my passport${icon('arrow')}</button></div>`,'travel');
 if(task==='passport'&&state.journey==='airport')open(`<h2 class="dialog-title airport-dialog-title">My first boarding pass.</h2><div class="boarding-pass"><div><span>BOARDING PASS</span></div><dl><div><dt>PASSENGER</dt><dd>CLARA</dd></div><div><dt>JOURNEY</dt><dd>VIETNAM → U.S.</dd></div><div><dt>SEAT</dt><dd>BY THE WINDOW</dd></div><div><dt>GATE</dt><dd>FOLLOW THE SIGNS</dd></div></dl><span class="ticket-dashes" aria-hidden="true"></span></div><p class="dialog-copy">My suitcase is on its way. I’ll keep my passport and boarding pass close. Next: one little message before boarding.</p><div class="dialog-bottom"><button class="start" data-journey="checkedin">Keep my boarding pass${icon('arrow')}</button></div>`,'travel');
 if(task==='phone'&&state.journey==='checkedin')open(`<h2 class="dialog-title airport-dialog-title">Message from home</h2><div class="phone-conversation"><span class="phone-contact">Home ♡</span><p class="message-in">We’re so proud of you. Take care of yourself, okay?</p><span class="message-time">Before boarding</span></div><p class="dialog-copy">What should I write?</p><div class="story-choices"><button data-home-message="call">I’ll call when I land. Love you.</button><button data-home-message="miss">I miss you already. I’m taking home with me.</button></div>`,'travel');
 if(task==='promise'&&state.journey==='ocean')open(`<p class="dialog-kicker">SOMEWHERE ABOVE THE OCEAN</p><h2 class="dialog-title">Dear future me,</h2><div class="notebook-page"><p>You don’t have to know everything today.</p><span>One small promise is enough.</span></div><div class="story-choices"><button data-promise="begin">I’ll give myself permission to begin again.</button><button data-promise="ask">I’ll ask for help when I need it.</button></div>`,'travel');
 if(task==='ending'&&state.journey==='end')showJourneyEnding();
}
function showJourneyEnding(){
 open(`<h2 class="dialog-title airport-dialog-title">Chapter 1 completed</h2><div class="journey-keepsakes">${items.map(i=>`<img src="${asset(i.id)}" alt="${i.name}">`).join('')}</div><p class="dialog-copy">From my room in Vietnam to a new horizon in the United States.\n\nOne little suitcase. A whole new chapter.</p><span class="complete-stamp">Packed · Checked in · Across the sky</span><p class="intro-scope">A new place. One small step at a time.</p><div class="dialog-bottom"><button class="soft-button" data-lobby>Back to lobby</button><button class="soft-button" data-journey="morning">Revisit departure</button><button class="start" data-campus="enter">Continue to Chapter 2${icon('arrow')}</button></div><button class="resume-button" data-replay>Replay Chapter 1</button>`,'journey-ending');
}
$('#journey-lobby').addEventListener('click',lobby);$('#journey-help').addEventListener('click',help);
$('#journey-toggle').addEventListener('click',()=>setJourneyCollapsed(!$('#journey-chat-body').hidden));
$('#airport-hotspot').addEventListener('click',()=>{const s=journeyScenes[state.journey];if(s.next)enterJourney(s.next);else travelTask(s.task);});
document.addEventListener('click',e=>{
 const next=e.target.closest('[data-journey]');if(next){enterJourney(next.dataset.journey);return;}
 const task=e.target.closest('[data-travel-task]');if(task){travelTask(task.dataset.travelTask);return;}
 const message=e.target.closest('[data-home-message]');if(message&&state.journey==='checkedin'){
  state.message=message.dataset.homeMessage==='miss'?'miss':'call';save();
  open(`<p class="dialog-kicker">CLARA’S PHONE</p><h2 class="dialog-title">A little less far away.</h2><div class="phone-conversation"><span class="phone-contact">Home ♡</span><p class="message-in">We’re so proud of you. Take care of yourself, okay?</p><p class="message-out">${state.message==='miss'?'I miss you already. I’m taking home with me.':'I’ll call when I land. Love you.'}</p><span class="message-time">Sent ♡</span></div><div class="dialog-bottom"><button class="start" data-journey="goodbye">Put my phone away${icon('arrow')}</button></div>`,'travel');return;
 }
 const promise=e.target.closest('[data-promise]');if(promise&&state.journey==='ocean'){state.promise=promise.dataset.promise==='ask'?'ask':'begin';enterJourney('america');}
});

// Chapter 2: find three destinations, ask for help and collect memories.
const campusLocations={
 classroom:{name:'Classroom',alt:'Kent State entrance arch and the orange classroom building beyond the path.'},
 library:{name:'Library',alt:'The tall tan library with vertical windows, flagpoles and a Library sign.'},
 center:{name:'Student Center',alt:'The curved Student Center, its green lawn and blue Kent State sign.'}
};
const campusStamps=[{key:'campusClassFound',name:'Classroom',title:'FIRST CLASS'},{key:'campusLibraryFound',name:'Library',title:'ASKED FOR HELP'},{key:'campusCenterFound',name:'Student Center',title:'A NEW CONNECTION'}];
function campusCount(){return campusStamps.filter(s=>state[s.key]).length;}
function campusPlace(){return state.campusVisit||'classroom';}
function centerCampus(){const v=$('#campus-viewport');v.scrollLeft=(v.scrollWidth-v.clientWidth)*(innerWidth<=700&&campusPlace()==='library'?.65:.5);}
function campusCollapsed(value){$('#campus-chat-body').hidden=value;$('#campus-toggle').textContent=value?'+':'−';$('#campus-toggle').ariaLabel=value?'Expand chat':'Minimize chat';$('#campus-toggle').setAttribute('aria-expanded',String(!value));}
function campusMission(){
 if(!state.campusClassFound)return {label:'Find my classroom',text:state.campusGuided?'The building behind the arch. Follow the path, then take the front steps. Let’s try it.':'First day at Kent State. New places, new faces… Where do I even begin?',hint:state.campusGuided?'Tap the steps to walk to the classroom building.':'Read the campus map to find the way.'};
 if(!state.campusAsked)return {label:'Find the library',text:'One place found. Now, the library… Maybe I can ask that student for directions.',hint:'Tap the student waving by the path.'};
 if(!state.campusLibraryFound)return {label:'Find the library',text:campusPlace()==='library'?'The tall building, the flags… This must be it. Let’s take a look inside.':'I said it! Alex told me to look for the tall building with the flags.',hint:campusPlace()==='library'?'Tap the library entrance.':'Follow Alex’s directions, or use the campus map.'};
 if(!state.campusCenterFound)return {label:'Find Student Center',text:campusPlace()==='center'?'An event notice. I don’t know anyone yet… but maybe that’s a reason to go.':'My English wasn’t perfect. But someone understood me. That’s a start. One more place to find.',hint:campusPlace()==='center'?'Tap the noticeboard to read the invitation.':'Open the campus map and find Student Center.'};
 return {label:'3 / 3 stamps ✓',text:'Three little stamps. A new place feels a little more like somewhere I belong.',hint:'Open your stamp collection to keep this moment.'};
}
function renderCampus(){
 const place=campusPlace(),mission=campusMission(),bg=$('.campus-background'),entrance=$('#campus-entrance');
 $('#campus').className='campus campus-scene-'+place;
 bg.src=asset('campus-'+place);bg.alt=campusLocations[place].alt;
 $('#campus-stamp-count').textContent=campusCount()+' / 3 stamps';$('#campus-progress').textContent=mission.label;
 $('#campus-speech').textContent=mission.text;$('#campus-hint').textContent=mission.hint;
 $('#campus-clara').classList.toggle('has-arrived',place==='classroom'&&!!state.campusClassFound);
 $('#campus-npc').hidden=place!=='classroom'||!state.campusClassFound||state.campusLibraryFound;
 $('#campus-noticeboard').hidden=place!=='center';
 entrance.hidden=place==='center'||(place==='classroom'&&(!state.campusGuided||state.campusClassFound&&(!state.campusAsked||state.campusLibraryFound)));
 entrance.textContent=place==='library'?(state.campusLibraryFound?'Find Student Center ↗':'Enter the library ↗'):state.campusClassFound?'Walk to the library ↗':'Walk up the steps ↗';
 entrance.classList.toggle('campus-path',place==='classroom'&&!!state.campusClassFound);
}
function enterCampus(){
 stopClip();close(false);$('#world').hidden=true;$('#chapter').hidden=true;$('#journey').hidden=true;$('#campus').hidden=false;
 document.body.classList.add('in-room');renderCampus();campusCollapsed(false);centerCampus();$('#campus-title').focus({preventScroll:true});announce('Chapter 2. '+campusMission().label+'. '+campusMission().hint);
}
function canVisitCampus(place){return place==='classroom'||place==='library'&&state.campusAsked||place==='center'&&state.campusLibraryFound;}
function visitCampus(place){
 if(!campusLocations[place])return;
 if(!canVisitCampus(place)){
  const hint=place==='library'?'Ask the student for directions to the library first.':'Find the library before heading to Student Center.';
  if($('#map-directions'))$('#map-directions').textContent=hint;announce(hint);return;
 }
 state.campusVisit=place;if(place==='classroom')state.campusGuided=true;save();close(false);renderCampus();campusCollapsed(false);centerCampus();$('#campus-title').focus({preventScroll:true});announce(campusLocations[place].name+'. '+campusMission().hint);
}
function campusGuide(){
 const target=!state.campusClassFound?'classroom':!state.campusAsked?null:!state.campusLibraryFound?'library':!state.campusCenterFound?'center':null;
 const instruction=target==='classroom'?'Your classroom is in the building behind the arch. Follow the path and take the front steps.':target==='library'?'Alex pointed out the tall building with the flags. Find Library on your map.':target==='center'?'One more stop. Find Student Center and look for a way to meet new people.':!state.campusAsked?'The library is next. Ask the student by the path for directions.':'Three places found. You can revisit any destination.';
 const action=target?`<button class="start" data-campus-dest="${target}">${target==='classroom'?'Follow the path':target==='library'?'Go to the library':'Go to Student Center'}${icon('arrow')}</button>`:`<button class="start" data-close>Back to campus${icon('arrow')}</button>`;
 open(`<h2 class="sr-only">Campus Map</h2><div class="campus-map-art"><img class="campus-paper-map" src="${asset('campus-map')}" alt="Pencil campus map: entrance to Classroom, then Library, then Student Center.">${Object.entries(campusLocations).map(([id,l])=>`<button class="map-destination map-${id}${target===id?' map-next':''}" data-campus-dest="${id}" aria-label="Go to ${l.name}${canVisitCampus(id)?'':' · not yet available'}" aria-disabled="${!canVisitCampus(id)}" aria-describedby="map-directions"></button>`).join('')}</div><p class="dialog-copy" id="map-directions" aria-live="polite">${instruction}</p><div class="dialog-bottom">${action}</div>`,'campus-guide');
}
function showCampusStamps(){
 const collected=campusCount();
 open(`<h2 class="sr-only">Stamp Collection</h2><div class="stamp-paper"><img src="${asset('stamp-collection')}" alt="Cream Stamp Collection paper with three spaces: Classroom, Library and Student Center.">${campusStamps.map((s,i)=>state[s.key]?`<span class="paper-stamp paper-stamp-${i}" role="img" aria-label="${s.name}: ${s.title.toLowerCase()} stamp collected"><b aria-hidden="true">✓</b><small>${s.title}</small></span>`:'').join('')}<span class="paper-stamp-count" aria-label="${collected} of 3 stamps collected">${collected} / 3</span></div><div class="dialog-bottom"><button class="soft-button" data-close>Back to campus</button>${collected===3?`<button class="start" data-campus="complete">Keep this moment${icon('arrow')}</button>`:`<button class="start" data-campus="map">Open campus map${icon('arrow')}</button>`}</div>`,'campus-stamps');
}
function campusStampArrival(index,title,text){
 const stamp=campusStamps[index];
 announce(stamp.name+' found. '+campusCount()+' of 3 stamps collected.');
 open(`<div class="campus-arrival"><span class="campus-first-stamp" aria-label="${stamp.title.toLowerCase()} stamp collected">✓<small>${stamp.title}</small></span><h2 class="dialog-title airport-dialog-title">${title}</h2><p class="dialog-copy">${text}</p><div class="dialog-bottom"><button class="start" data-close>${index===0?'Keep exploring':'Back to campus'}${icon('arrow')}</button><button class="soft-button" data-campus="stamps">My stamps</button></div></div>`,'campus-arrival');
}
function campusArrival(){
 const place=campusPlace();
 if(place==='classroom'){
  if(state.campusClassFound){if(state.campusAsked)visitCampus('library');return;}
  if(!state.campusGuided)return;state.campusClassFound=true;save();renderCampus();campusCollapsed(false);
  campusStampArrival(0,'Found my classroom!','One small step. One little stamp.<br>Maybe I can find my way here.');
 }else if(place==='library'){
  if(state.campusLibraryFound){campusGuide();return;}
  if(!state.campusAsked)return;state.campusLibraryFound=true;save();renderCampus();campusCollapsed(false);
  campusStampArrival(1,'Found the library!','My English wasn’t perfect. But someone understood me. That’s a start.');
 }
}
function talkToAlex(){
 if(!state.campusClassFound||campusPlace()!=='classroom')return;
 open(`<h2 class="dialog-title airport-dialog-title">A little courage.</h2><div class="campus-conversation"><img src="${asset('campus-alex')}" alt="Alex waving hello"><div><span>ALEX</span><p>“Hey! First day?”</p><p class="clara-thought">I practiced introducing myself all night. Somehow, “Hi” still feels like the hardest word.</p></div></div><div class="story-choices"><button data-campus-ask="help">Hi! Could you help me find the library?</button><button data-campus-ask="way">Hi! Is the library this way?</button></div>`,'campus-conversation');
}
function alexDirections(){
 if(!state.campusClassFound||campusPlace()!=='classroom')return;
 state.campusAsked=true;save();renderCampus();
 open(`<h2 class="dialog-title airport-dialog-title">Nice to meet you.</h2><div class="campus-conversation"><img src="${asset('campus-alex')}" alt="Alex"><div><span>ALEX</span><p>“Of course! Look for the tall building with the flags. I’m Alex, by the way.”</p><span>CLARA</span><p>“Thank you! I’m Clara.”</p></div></div><div class="dialog-bottom"><button class="start" data-close>Thanks, Alex${icon('arrow')}</button></div>`,'campus-conversation');
}
function campusNotice(){
 if(campusPlace()!=='center'||!state.campusLibraryFound)return;
 open(`<h2 class="dialog-title airport-dialog-title">A place to begin.</h2><div class="campus-event"><span>YOU’RE INVITED</span><strong>International Student<br>Meet &amp; Greet</strong><p>New faces. Small conversations.<br>Everyone welcome.</p></div><p class="dialog-copy">I don’t have to know anyone before I go. Maybe this is how it starts.</p><div class="dialog-bottom"><button class="start" data-campus="save-event">${state.campusCenterFound?'See my stamps':'Save the invitation'}${icon('arrow')}</button></div>`,'campus-event');
}
function finishCampus(){
 if(campusCount()!==3)return;
 open(`<div class="campus-arrival"><span class="campus-first-stamp" aria-hidden="true">✓<small>3 / 3</small></span><h2 class="dialog-title airport-dialog-title">Chapter 2 completed</h2><p class="dialog-copy">I found my classroom, asked for help, and found a place to meet people.<br><br>This campus feels a little less unfamiliar now.</p><div class="dialog-bottom"><button class="soft-button" data-campus="stamps">My stamps</button><button class="start" data-close>Back to campus${icon('arrow')}</button></div><button class="resume-button" data-campus="replay">Replay Chapter 2</button></div>`,'campus-complete');
}
function replayCampus(){
 for(const key of ['campusGuided','campusClassFound','campusAsked','campusLibraryFound','campusCenterFound'])state[key]=false;
 state.campusVisit='classroom';save();enterCampus();
}
$('#campus-lobby').addEventListener('click',lobby);$('#campus-map').addEventListener('click',campusGuide);$('#campus-stamps').addEventListener('click',showCampusStamps);$('#campus-entrance').addEventListener('click',campusArrival);$('#campus-npc').addEventListener('click',talkToAlex);$('#campus-noticeboard').addEventListener('click',campusNotice);
$('#campus-toggle').addEventListener('click',()=>campusCollapsed(!$('#campus-chat-body').hidden));
$('#campus-help').addEventListener('click',()=>open(`<h2 class="dialog-title airport-dialog-title">Finding my way</h2><p class="dialog-copy">Read the campus map and find your classroom. Ask Alex for directions to the library. Then find Student Center and read the event notice.<br><br>Collect a stamp at each stop. Both ways of asking Alex are welcome. On a narrow screen, swipe across the scenery or focus it and use the arrow keys. Tap − to tuck away Clara’s chat.</p><div class="dialog-bottom"><button class="start" data-close>Got it${icon('arrow')}</button></div>`,'campus-help'));
$('#campus-viewport').addEventListener('keydown',e=>{if(e.target!==$('#campus-viewport'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();$('#campus-viewport').scrollBy({left:(e.key==='ArrowLeft'?-1:1)*innerWidth*.5,behavior:'smooth'});}});
document.addEventListener('click',e=>{
 const destination=e.target.closest('[data-campus-dest]');if(destination){visitCampus(destination.dataset.campusDest);return;}
 if(e.target.closest('[data-campus-ask]')){alexDirections();return;}
 const action=e.target.closest('[data-campus]');if(!action)return;
 if(action.dataset.campus==='enter')enterCampus();
 if(action.dataset.campus==='map')campusGuide();
 if(action.dataset.campus==='stamps')showCampusStamps();
 if(action.dataset.campus==='complete')finishCampus();
 if(action.dataset.campus==='replay')replayCampus();
 if(action.dataset.campus==='save-event'&&campusPlace()==='center'&&state.campusLibraryFound){state.campusCenterFound=true;save();renderCampus();showCampusStamps();announce('Invitation saved. All three stamps collected.');}
});

function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3600);}
// Short overlapping voices keep click feedback immediate, independent of music.
const clickVoices=[$('#click-sound')];
for(let i=1;i<4;i++){const voice=clickVoices[0].cloneNode(true);voice.id='click-sound-'+(i+1);clickVoices[0].parentNode.append(voice);clickVoices.push(voice);}
let clickVoice=0;
function playClick(){
 if(!soundEffects)return;
 const voice=clickVoices[clickVoice++%clickVoices.length];
 try{voice.pause();if(voice.readyState>0)voice.currentTime=0;voice.volume=.18;voice.play()?.catch(()=>{});}catch{}
}
document.addEventListener('click',e=>{
 const button=e.target instanceof Element?e.target.closest('button'):null;
 if(!button||button.disabled||button.getAttribute('aria-disabled')==='true')return;
 if(Date.now()<ignoreClickUntil&&button.matches('[data-item],[data-slot],[data-drop]'))return;
 playClick();
},{capture:true});
function renderMusic(){['#music','#chapter-music'].forEach(sel=>{$(sel).ariaLabel=music?'Turn music off':'Turn music on';$(sel).setAttribute('aria-pressed',String(music));});}
function melody(){if(!music||document.hidden)return;try{context ||= new(window.AudioContext||window.webkitAudioContext)();context.resume();[523.25,659.25,783.99,659.25,587.33,523.25,440,523.25].forEach((f,n)=>{const at=context.currentTime+n*.48,o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(volume*.12,at+.035);g.gain.exponentialRampToValueAtTime(.0001,at+1.25);o.connect(g);g.connect(context.destination);o.start(at);o.stop(at+1.3);});}catch{music=false;clearInterval(musicTimer);renderMusic();}}
function toggleMusic(){music=!music;if(music){melody();musicTimer=setInterval(melody,11000);}else{clearInterval(musicTimer);context?.suspend();}renderMusic();}
$('#start').addEventListener('click',()=>intro());$('#door').addEventListener('click',()=>intro());$('#jenny').addEventListener('click',()=>intro());
$('#help').addEventListener('click',help);$('#chapter-help').addEventListener('click',help);$('#how-link').addEventListener('click',help);$('#introduction')?.addEventListener('click',gameIntroduction);
$('#suitcase').addEventListener('click',()=>intro());
$('#music').addEventListener('click',toggleMusic);$('#chapter-music').addEventListener('click',toggleMusic);
$('#close').addEventListener('click',()=>close());$('#dialog').addEventListener('cancel',e=>{e.preventDefault();close();});
$('#dialog').addEventListener('click',e=>{
 if(e.target.closest('[data-close]'))close();
 if(e.target.closest('[data-begin-introduction]'))intro();
 if(e.target.closest('[data-intro-next]'))introStep<2?intro(introStep+1):enterRoom();
 if(e.target.closest('[data-intro-back]'))intro(introStep-1);
 if(e.target.closest('[data-toggle-music]')){toggleMusic();help();}
 if(e.target.closest('[data-toggle-sfx]')){soundEffects=!soundEffects;if(soundEffects)playClick();save();help();}
 if(e.target.closest('[data-lobby]'))lobby();
 if(e.target.closest('[data-review]')){enterRoom();showSuitcase();}
 if(e.target.closest('[data-replay]')){state={started:false,completed:false,slots:Array(6).fill(null)};selected=null;speech={kind:'welcome'};save();updateResume();lobby();renderChapter();setChatCollapsed(false);intro();}
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
window.addEventListener('resize',()=>{if(!$('#chapter').hidden)centerRoom();if(!$('#campus').hidden)centerCampus();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)context?.suspend();else if(music)context?.resume();});
document.documentElement.lang='en';renderMusic();updateResume();renderChapter();
if(new URLSearchParams(location.search).get('chapter')==='2')enterCampus();
})();
