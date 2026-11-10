(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORE='a-little-room-chapter1-v1', PREF='a-little-room-chapter1-prefs';
const planner=window.deskPlanner,orientationModel=window.orientationStory,keepsakeModel=window.keepsakeStory;
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
 if(data&&Array.isArray(data.slots)){state.keepsakes=keepsakeModel.normalize(data.keepsakes);state.gameEnded=!!data.gameEnded&&state.keepsakes.letterRead;state.orientation=orientationModel.normalize(data.orientation);state.deskActions=planner.normalize(data.deskActions);state.campusGuided=!!data.campusGuided;state.campusClassFound=!!data.campusClassFound;state.campusAsked=state.campusClassFound&&!!data.campusAsked;state.campusLibraryFound=state.campusAsked&&!!data.campusLibraryFound;state.campusCenterFound=state.campusLibraryFound&&!!data.campusCenterFound;state.campusVisit=data.campusVisit==='center'&&state.campusLibraryFound?'center':data.campusVisit==='library'&&state.campusAsked?'library':'classroom';const seen=new Set();state.slots=Array.from({length:6},(_,i)=>{const id=data.slots[i];if(byId(id)&&!seen.has(id)){seen.add(id);return id;}return null;});state.started=!!data.started;state.completed=!!data.completed&&state.slots.every(Boolean);if(state.completed&&journeySteps.includes(data.journey)){state.journey=data.journey;state.message=data.message==='miss'?'miss':'call';state.promise=data.promise==='ask'?'ask':'begin';}}
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
function enterRoom(showGuide=true){stopBenTalk();$('#keepsake-room').hidden=true;$('#game-end').hidden=true;stopOrientationTalk();$('#orientation').hidden=true;
 $('#desk-room').hidden=true;
 close(false);$('#campus').hidden=true;$('#journey').hidden=true;state.started=true;save();$('#world').hidden=true;$('#chapter').hidden=false;document.body.classList.add('in-room');renderChapter();updateResume();setChatCollapsed(false);centerRoom();$('#chapter-title').tabIndex=-1;$('#chapter-title').focus({preventScroll:true});if(showGuide)showChapterGuide(1);
}
function lobby(){stopBenTalk();$('#keepsake-room').hidden=true;$('#game-end').hidden=true;stopOrientationTalk();$('#orientation').hidden=true;$('#desk-room').hidden=true;stopClip();close(false);$('#campus').hidden=true;$('#journey').hidden=true;$('#chapter').hidden=true;$('#world').hidden=false;document.body.classList.remove('in-room');selected=null;speech={kind:'welcome'};updateResume();$('#start').focus({preventScroll:true});}
function open(html,type){
 stopEventAudio();if(!$('#dialog').open)lastFocus=document.activeElement;dialogType=type;$('#dialog').classList.toggle('keepsake-letter-dialog',type==='keepsake-letter');$('#dialog').classList.toggle('event-dialog',!!type?.startsWith('event-'));$('#dialog').classList.toggle('keepsake-puzzle-dialog',type==='keepsake-puzzle');$('#dialog').classList.toggle('chapter-preface-dialog',type==='chapter-preface');$('#dialog').classList.toggle('chapter-guide',type==='chapter-guide');$('#dialog').classList.toggle('desk-dialog',!!type?.startsWith('desk-'));$('#dialog').classList.toggle('packing-dialog',type==='packing');$('#dialog').classList.toggle('campus-map-dialog',type==='campus-guide');$('#dialog').classList.toggle('campus-stamps-dialog',type==='campus-stamps');$('#dialog-content').innerHTML=html;
 if(!$('#dialog').open)$('#dialog').showModal();
 const heading=$('#dialog h2');if(heading){heading.id='active-dialog-title';heading.tabIndex=-1;$('#dialog').setAttribute('aria-labelledby','active-dialog-title');heading.focus();}else $('#close').focus();
}
function close(restore=true){
 stopEventAudio();if($('#dialog').open)$('#dialog').close();dialogType=null;
 if(restore){if(lastFocus?.isConnected&&lastFocus.getClientRects().length)lastFocus.focus({preventScroll:true});else if(!$('#orientation').hidden)$('#orientation-title').focus({preventScroll:true});else if(!$('#desk-room').hidden)$('#desk-title').focus({preventScroll:true});else if(!$('#campus').hidden)$('#campus-map').focus({preventScroll:true});else if(!$('#journey').hidden)$('#journey-title').focus({preventScroll:true});else if(!$('#chapter').hidden)$('#open-case').focus({preventScroll:true});else $('#start').focus({preventScroll:true});}
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
const chapterOpenings={"2": {"title": "The First Few Steps", "body": "Clara arrives at Kent State with hopes for her future, but little certainty about where to begin. Asking for help and making friends now take more courage than she expected.\n\nShe hopes her journey in the U.S. will help her become more confident and learn to handle unfamiliar situations. Today, that journey begins with finding her way and discovering that becoming independent also means knowing when to ask for help.\n\nDear future Clara, remember what it took to take these first few steps.", "connectsTo": "Challenge: English and adapting to a new culture"}, "3": {"title": "When the Day Isn’t Long Enough", "body": "A few weeks pass, and Clara’s days fill with assignments, work shifts, and calls home. She wants to do well in school, become financially independent, and reassure her family, even on days when she feels overwhelmed.\n\nTonight, only one hour remains, and several things are unfinished. She is learning to take responsibility for her choices, recognize her limits, and accept that some things can wait until tomorrow.\n\nDear future Clara, remember how much you wanted to become someone your family could rely on. Give yourself time to rest, too.", "connectsTo": "Challenge: school, work and relationships; hope: supporting family"}, "4": {"title": "From Strangers to Friends", "body": "Clara knows her way around campus now, but she still misses the comfort of being around people who already know her. At an event for international students, she stands among unfamiliar faces, wondering how to begin.\n\nShe hopes to become more comfortable expressing herself, even when her English is imperfect. Meeting people from different backgrounds is also teaching her to listen, question her assumptions, and understand herself better.\n\nToday, her challenge is to start one conversation. Dear future Clara, remember the moment you decided to speak, even though you were nervous.", "connectsTo": "Hope: independence and encouraging other women; adapting and belonging"}, "5": {"title": "The Suitcase She Brought", "body": "Clara finds the suitcase she brought from Vietnam. The familiar objects remind her of home, while an old letter reminds her of the person she was when she left.\n\nShe is still figuring out who she wants to become. She hopes this experience will help her trust her own judgment, face setbacks with patience, and build a life she can feel proud of.\n\nHer future is still taking shape. Before moving forward, she pauses to read the letter and notice how she has already changed.\n\nDear future Clara, whenever you feel like giving up, remember how hard you worked to get here and how much you learned while finding your way.", "connectsTo": "Impact in Vietnam and international-student support; message to future self", "status": "Integrated into Chapter 5"}};
function showChapterPrelude(chapter){
 const story=chapterOpenings[chapter];if(!story)return;
 open(`<div class="chapter-preface"><div class="preface-portrait"><img src="${$('#jenny img').src}" alt="Clara"></div><p class="dialog-kicker">CHAPTER 0${chapter}</p><h2 class="dialog-title airport-dialog-title">${story.title}</h2><p class="preface-copy">${story.body}</p><div class="dialog-bottom"><button class="start" data-chapter-instructions="${chapter}">Continue${icon('arrow')}</button></div></div>`,'chapter-preface');
}
const chapterGuides={
 1:{name:'Beginnings',goal:'Pack six little pieces of home.',steps:[
  ['Choose an object','Tap something in the room to read its story.'],
  ['Pack your suitcase','Drag it into the suitcase, or tap “Pack it”. Open “My suitcase” to arrange all six items.'],
  ['Ready to go','Pack all six, then close the suitcase to continue to the airport.']
 ]},
 2:{name:'Finding my way',goal:'Find three places. Collect three stamps.',steps:[
  ['Read the map','Open Campus map and follow the path to your classroom.'],
  ['Ask for help','Tap Ben and follow his directions to the library.'],
  ['Find your people','Visit Student Center and read the noticeboard. Collect a stamp at each stop.']
 ]},
 3:{name:'Making room',goal:'One hour. Three energy points. Time for yourself.',steps:[
  ['Look around your desk','Tap the laptop, book and glowing phone to choose what to do.'],
  ['Choose what matters','Submit the assignment and decide on reading and home. Time moves only when you choose.'],
  ['Leave room for rest','Keep 10 minutes for rest, then tap the bed. Use “My evening” to undo a choice.']
 ]},
 4:{name:'Finding my people',goal:'Three conversations. Three new friends.',steps:[
  ['Say hello','Tap Emma, Noah and Maya to hear a little about them.'],
  ['Make a memory','Place Clara and Emma in the photo, then press the shutter.'],
  ['Add your own touch','Listen to Noah’s tracks and turn on the speakers. Type a name and choose a sticker for your badge with Maya. Finish with a group photo.']
 ]},
 5:{name:'Looking back',goal:'Six objects. A letter waiting to be opened.',steps:[
 ['Open the suitcase','Tap the lilac suitcase to see the objects Clara brought from home.'],
 ['Find each familiar shape','Drag an object onto its outline, or tap the object and then the outline. You can try again.'],
 ['Read the letter','Match the other five memories first. Place the letter last, then open it.']
 ]}
};
function showChapterGuide(chapter){
 const guide=chapterGuides[chapter];if(!guide)return;
 open(`<p class="dialog-kicker">CHAPTER 0${chapter} · ${guide.name}</p><h2 class="dialog-title airport-dialog-title">How to play</h2><p class="chapter-guide-goal">${guide.goal}</p><ol class="chapter-guide-steps">${guide.steps.map(([title,copy])=>`<li><div><strong>${title}</strong><p>${copy}</p></div></li>`).join('')}</ol><p class="chapter-guide-tip">Swipe to look around on a small screen. You can also use Tab and Enter.</p><div class="dialog-bottom"><button class="start" data-close>Let’s go${icon('arrow')}</button></div>`,'chapter-guide');
}
function gameIntroduction(){open(`<p class="dialog-kicker">INTRODUCTION</p><h2 class="dialog-title airport-dialog-title">The Abroad<br>Chapter</h2><p class="dialog-copy">Meet Clara, a student from Vietnam ready to start her new life in the United States. Tomorrow is her flight! Tonight, she is still in the room she knows by heart.\n\nLet’s witness her journey miles away from home.</p><span class="welcome-tag">Chapter 1 · Beginnings</span><div class="dialog-bottom"><button class="soft-button" data-close>Back to lobby</button><button class="start" data-begin-introduction>Begin my story${icon('arrow')}</button></div>`,'introduction');}
function complete(){
 if(count()!==6)return;state.completed=true;save();updateResume();
 open(`<div class="chapter-complete fade-in"><div class="complete-illustration"><img src="${$('#jenny img').src}" alt="Clara"></div><h2 class="dialog-title">Packed with a little courage.</h2><p class="dialog-copy">“My suitcase is ready. Maybe I don’t have to feel completely ready, too.\nTomorrow, I’ll take the first step.”</p><div class="dialog-bottom"><button class="soft-button" data-review>Look inside my suitcase</button><button class="start" data-journey="morning">Sleep until morning${icon('arrow')}</button></div><button class="resume-button" data-lobby>Back to lobby</button></div>`,'complete');
}
const journeyScenes={
 morning:{title:'The next morning.',place:'Vietnam · Before sunrise',progress:'A new day',text:'I barely slept. Now the suitcase is by the door, and the house is so quiet. I’m going to miss the little things I never thought to notice.',hint:'Take this moment at your own pace.',action:'Leave for the airport',next:'airport'},
 airport:{title:'A small first step.',place:'Vietnam · Airport departures',progress:'1 / 3 · Check in',text:'The airport is already awake. Wheels on the floor, voices overhead… and me, holding my passport a little too tightly. Can you help me check in?',hint:'Tap “Check in” at the counter.',action:'Check in',task:'checkin'},
 checkedin:{title:'A boarding pass, a deep breath.',place:'Airport departures · Before boarding',progress:'2 / 3 · A message home',text:'My suitcase is checked in, and my boarding pass is in my hand. Before I go through to the gate, I want to leave one little message for home.',hint:'Open phone',action:'Open my phone',task:'phone'},
 goodbye:{title:'Home comes with me.',place:'Airport departures · Ready to depart',progress:'3 / 3 · Departure',text:'The message is sent. Somehow, a few words make the distance feel smaller already. My passport and boarding pass are ready. It’s time to depart.',hint:'Tap to depart when you’re ready.',action:'Depart',next:'takeoff'},
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
function enterJourney(step){stopBenTalk();$('#keepsake-room').hidden=true;$('#game-end').hidden=true;stopOrientationTalk();$('#orientation').hidden=true;$('#desk-room').hidden=true;
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
 const physicalAirportAction=['airport','checkedin','goodbye'].includes(step);$('#journey-actions').hidden=physicalAirportAction;
 $('#journey-actions').innerHTML=physicalAirportAction?'':`<button class="chat-primary" ${scene.next?`data-journey="${scene.next}"`:`data-travel-task="${scene.task}"`}>${scene.action} <span aria-hidden="true">→</span></button>`;
 $('#journey-background').src=step==='end'?($('#asset-flight-sky')?.src||window.journeyClips?.flight.poster||asset('airport')):step==='morning'?$('.room-background').src:flying?(window.journeyClips?.flight.poster||asset('airport')):asset('airport');
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
 open(`<h2 class="dialog-title airport-dialog-title">Chapter 1 completed</h2><div class="journey-keepsakes">${items.map(i=>`<img src="${asset(i.id)}" alt="${i.name}">`).join('')}</div><p class="dialog-copy">From my room in Vietnam to a new horizon in the United States.\nOne little suitcase. A whole new chapter.</p><span class="complete-stamp">Packed · Checked in · Across the sky</span><p class="intro-scope">A new place. One small step at a time.</p><div class="dialog-bottom"><button class="soft-button" data-lobby>Back to lobby</button><button class="soft-button" data-replay>Replay Chapter 1</button><button class="start" data-campus="enter">Continue to Chapter 2${icon('arrow')}</button></div>`,'journey-ending');
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
 if(!state.campusLibraryFound)return {label:'Find the library',text:campusPlace()==='library'?'The tall building, the flags… This must be it. Let’s take a look inside.':'I said it! Ben told me to look for the tall building with the flags.',hint:campusPlace()==='library'?'Tap the library entrance.':'Follow Ben’s directions, or use the campus map.'};
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
function enterCampus(){stopBenTalk();$('#keepsake-room').hidden=true;$('#game-end').hidden=true;stopOrientationTalk();$('#orientation').hidden=true;
 $('#desk-room').hidden=true;
 stopClip();close(false);$('#world').hidden=true;$('#chapter').hidden=true;$('#journey').hidden=true;$('#campus').hidden=false;
 document.body.classList.add('in-room');renderCampus();campusCollapsed(false);centerCampus();$('#campus-title').focus({preventScroll:true});announce('Chapter 2. '+campusMission().label+'. '+campusMission().hint);showChapterPrelude(2);
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
 const instruction=target==='classroom'?'Your classroom is in the building behind the arch. Follow the path and take the front steps.':target==='library'?'Ben pointed out the tall building with the flags. Find Library on your map.':target==='center'?'One more stop. Find Student Center and look for a way to meet new people.':!state.campusAsked?'The library is next. Ask the student by the path for directions.':'';
 const action=target?`<button class="start" data-campus-dest="${target}">${target==='classroom'?'Follow the path':target==='library'?'Go to the library':'Go to Student Center'}${icon('arrow')}</button>`:`<button class="soft-button" data-close>Back to campus</button>${campusCount()===3?`<button class="start" data-desk-start>Continue to Chapter 3${icon('arrow')}</button>`:''}`;
 open(`<h2 class="sr-only">Campus Map</h2><div class="campus-map-art"><img class="campus-paper-map" src="${asset('campus-map')}" alt="Pencil campus map: entrance to Classroom, then Library, then Student Center.">${Object.entries(campusLocations).map(([id,l])=>`<button class="map-destination map-${id}${target===id?' map-next':''}" data-campus-dest="${id}" aria-label="Go to ${l.name}${canVisitCampus(id)?'':' · not yet available'}" aria-disabled="${!canVisitCampus(id)}" aria-describedby="map-directions"></button>`).join('')}</div><p class="dialog-copy" id="map-directions" aria-live="polite" ${instruction?'':'hidden'}>${instruction}</p><div class="dialog-bottom">${action}</div>`,'campus-guide');
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
let benTalkStep=null,benReply=null;
const benReplies=["Hi! Could you help me find the library?","Hi! Is the library this way?"];
const benLines=[
 {speaker:'Ben',text:'Hey! First day?'},
 {speaker:'Clara',text:'Hi! Could you help me find the library?'},
 {speaker:'Ben',text:'Of course! Look for the tall building with the flags. I’m Ben, by the way.'},
 {speaker:'Clara',text:'Thank you! I’m Clara.'}
];
function stopBenTalk(restore=false){
 benTalkStep=null;if($('#campus-talk'))$('#campus-talk').hidden=true;$('#campus').classList.remove('is-talking');
 if(restore&&!$('#campus').hidden){renderCampus();campusCollapsed(false);centerCampus();$('#campus-npc').focus({preventScroll:true});}
}
function positionBenBubble(){
 if(benTalkStep===null)return;
 const line=benLines[benTalkStep],img=line.speaker==='Ben'?$('#campus-npc img'):$('#campus-clara img'),r=img.getBoundingClientRect(),room=$('#campus').getBoundingClientRect(),bubble=$('#campus-talk-bubble');
 const width=Math.min(310,room.width-32);bubble.style.width=width+'px';
 const x=r.left+r.width/2-room.left,headY=r.top+r.height*(line.speaker==='Ben'?.1:.18)-room.top;
 const left=Math.max(16,Math.min(room.width-width-16,x-width/2));
 const headerBottom=$('.campus-header').getBoundingClientRect().bottom-room.top;
 bubble.style.left=left+'px';bubble.style.top=Math.max(headerBottom+10,headY-bubble.offsetHeight-18)+'px';bubble.style.setProperty('--talk-tail',Math.max(20,Math.min(width-35,x-left-9))+'px');
}
function showBenLine(){
 if(benTalkStep===null)return;
 const line=benLines[benTalkStep],bubble=$('#campus-talk-bubble');
 $('#campus-talk-speaker').textContent=line.speaker.toUpperCase();const choosing=benTalkStep===1&&benReply===null;$('#campus-talk-line').hidden=choosing;$('#campus-talk-line').textContent='“'+(benTalkStep===1&&benReply!==null?benReplies[benReply]:line.text)+'”';$('#campus-reply-choices').hidden=!choosing;$('#campus-reply-choices').innerHTML=choosing?benReplies.map((text,i)=>`<button data-ben-reply="${i}">${text}</button>`).join(''):'';$('#campus-talk-next').hidden=choosing;$('#campus-talk-thought').textContent=line.thought||'';$('#campus-talk-thought').hidden=!line.thought;
 bubble.classList.toggle('is-clara',line.speaker==='Clara');$('#campus-talk-next').textContent=benTalkStep===benLines.length-1?'Keep exploring →':'Continue →';
 if(benTalkStep===2){state.campusAsked=true;save();}
 positionBenBubble();(choosing?$('#campus-reply-choices button'):$('#campus-talk-next')).focus({preventScroll:true});announce(line.speaker+': '+line.text);
}
function talkToBen(){
 if(!state.campusClassFound||campusPlace()!=='classroom')return;
 close(false);benTalkStep=0;benReply=null;$('#campus').classList.add('is-talking');$('#campus-talk').hidden=false;
 const v=$('#campus-viewport'),vr=v.getBoundingClientRect(),a=$('#campus-clara').getBoundingClientRect(),b=$('#campus-npc').getBoundingClientRect();
 v.scrollLeft+=((a.left+a.width/2+b.left+b.width/2)/2-vr.left)-v.clientWidth/2;
 showBenLine();
}
$('#campus-reply-choices').addEventListener('click',e=>{const b=e.target.closest('[data-ben-reply]');if(benTalkStep===1&&b){benReply=Number(b.dataset.benReply);showBenLine();}});
$('#campus-talk-next').addEventListener('click',()=>{if(benTalkStep===null)return;if(benTalkStep===benLines.length-1)stopBenTalk(true);else{benTalkStep++;showBenLine();}});
$('#campus-talk-close').addEventListener('click',()=>stopBenTalk(true));
$('#campus-viewport').addEventListener('scroll',()=>{if(benTalkStep!==null)positionBenBubble();},{passive:true});
addEventListener('resize',()=>{if(benTalkStep!==null)positionBenBubble();});
document.addEventListener('keydown',e=>{if(benTalkStep!==null&&e.key==='Escape'){e.preventDefault();stopBenTalk(true);}});
function campusNotice(){
 if(campusPlace()!=='center'||!state.campusLibraryFound)return;
 open(`<h2 class="dialog-title airport-dialog-title">A place to begin.</h2><div class="campus-event"><span>YOU’RE INVITED</span><strong>International Student<br>Orientation</strong><p>New faces. Small conversations.<br>Everyone welcome.</p></div><p class="dialog-copy">I don’t have to know anyone before I go. Maybe this is how it starts.</p><div class="dialog-bottom"><button class="start" data-campus="save-event">${state.campusCenterFound?'See my stamps':'Save the invitation'}${icon('arrow')}</button></div>`,'campus-event');
}
function finishCampus(){
 if(campusCount()!==3)return;
 open(`<div class="campus-arrival"><span class="campus-first-stamp" aria-hidden="true">✓<small>3 / 3</small></span><h2 class="dialog-title airport-dialog-title">Chapter 2 completed</h2><p class="dialog-copy">I found my classroom, asked for help, and found a place to meet people.<br><br>This campus feels a little less unfamiliar now.</p><div class="dialog-bottom"><button class="soft-button" data-campus="stamps">My stamps</button><button class="soft-button" data-close>Back to campus</button><button class="start" data-desk-start>Continue to Chapter 3${icon('arrow')}</button></div><button class="resume-button" data-campus="replay">Replay Chapter 2</button></div>`,'campus-complete');
}
function replayCampus(){
 for(const key of ['campusGuided','campusClassFound','campusAsked','campusLibraryFound','campusCenterFound'])state[key]=false;
 state.campusVisit='classroom';save();enterCampus();
}
$('#campus-lobby').addEventListener('click',lobby);$('#campus-map').addEventListener('click',campusGuide);$('#campus-stamps').addEventListener('click',showCampusStamps);$('#campus-entrance').addEventListener('click',campusArrival);$('#campus-npc').addEventListener('click',talkToBen);$('#campus-noticeboard').addEventListener('click',campusNotice);
$('#campus-toggle').addEventListener('click',()=>campusCollapsed(!$('#campus-chat-body').hidden));
$('#campus-help').addEventListener('click',()=>open(`<h2 class="dialog-title airport-dialog-title">Finding my way</h2><p class="dialog-copy">Read the campus map and find your classroom. Ask Ben for directions to the library. Then find Student Center and read the event notice.<br><br>Collect a stamp at each stop. On a narrow screen, swipe across the scenery or focus it and use the arrow keys. Tap − to tuck away Clara’s chat.</p><div class="dialog-bottom"><button class="start" data-close>Got it${icon('arrow')}</button></div>`,'campus-help'));
$('#campus-viewport').addEventListener('keydown',e=>{if(e.target!==$('#campus-viewport'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();$('#campus-viewport').scrollBy({left:(e.key==='ArrowLeft'?-1:1)*innerWidth*.5,behavior:'smooth'});}});
document.addEventListener('click',e=>{
 const destination=e.target.closest('[data-campus-dest]');if(destination){visitCampus(destination.dataset.campusDest);return;}
 const action=e.target.closest('[data-campus]');if(!action)return;
 if(action.dataset.campus==='enter')enterCampus();
 if(action.dataset.campus==='map')campusGuide();
 if(action.dataset.campus==='stamps')showCampusStamps();
 if(action.dataset.campus==='complete')finishCampus();
 if(action.dataset.campus==='replay')replayCampus();
 if(action.dataset.campus==='save-event'&&campusPlace()==='center'&&state.campusLibraryFound){state.campusCenterFound=true;save();renderCampus();showCampusStamps();announce('Invitation saved. All three stamps collected.');}
});

// Chapter 3: a busy desk, a limited evening, and room to rest.
let deskMessage='';
const deskFeedback={assignment:'Submitted. That was the one thing that couldn’t wait.',reading:'A few pages, a few new words. My English is growing a little at a time.',tomorrow:'A note for tomorrow. Not everything has to happen tonight.',call:'A familiar voice. Home feels a little closer.',reply:'A little message is enough tonight. We can talk properly another day.'};
function deskActions(){return state.deskActions||(state.deskActions=[]);}
function deskStatus(){return planner.summary(deskActions());}
function deskChoiceFor(group){return deskActions().find(id=>planner.choices[id].group===group);}
function deskClock(minutes){const total=20*60+minutes;return `${Math.floor(total/60)%12||12}:${String(total%60).padStart(2,'0')} PM`;}
function deskCollapsed(value){$('#desk-chat-body').hidden=value;$('#desk-toggle').textContent=value?'+':'−';$('#desk-toggle').ariaLabel=value?'Expand chat':'Minimize chat';$('#desk-toggle').setAttribute('aria-expanded',String(!value));}
function deskPan(side){const v=$('#desk-viewport'),target=v.scrollWidth*(side<0?.27:.74)-v.clientWidth/2;v.scrollTo({left:Math.max(0,target),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
function centerDesk(){const v=$('#desk-viewport');v.scrollLeft=innerWidth<=700?v.scrollWidth*.73-v.clientWidth/2:(v.scrollWidth-v.clientWidth)/2;$('.desk-pan').hidden=v.scrollWidth<=v.clientWidth+2;}
function renderDesk(){
 const s=deskStatus();$('#desk-clock').textContent=deskClock(s.minutes);$('#desk-time').textContent=s.complete?'Evening complete':`${s.remaining} min until bed`;
 $('#desk-energy').innerHTML=Array.from({length:3},(_,i)=>`<i class="${i<s.energy?'filled':''}" aria-hidden="true"></i>`).join('');$('#desk-energy').ariaLabel=`Energy: ${s.energy} of 3`;
 $('#desk-rest-note').textContent=s.complete?'Rest matters, too.':'Save 10 min for rest';$('#desk-progress').textContent=s.complete?'A little balance ✓':`${s.decisions} / 3 decisions`;
 for(const group of ['laptop','books','phone']){
  const b=$('#desk-'+group),done=!!deskChoiceFor(group);b.classList.toggle('decided',done);b.setAttribute('aria-label',({laptop:'Open the laptop assignment',books:'Look at the English reading',phone:'Read the glowing phone'})[group]+(done?' · decided':''));
 }
 $('#desk-bed').classList.toggle('ready',s.ready&&!s.complete);
 $('#desk-speech').textContent=s.complete?'I can’t do everything tonight. But I can choose what matters next.':deskMessage||(s.ready?'The important things have a place. I can leave a little time for myself, too.':s.decisions?'One choice at a time. What needs me tonight, and what can wait?':'My assignment is due at nine, my reading can wait, and home is calling. I have one hour and a little energy. Help me choose what matters.');
 $('#desk-hint').textContent=s.complete?'You made room for rest.':s.ready?'Tap the bed when you’re ready to stop.':'Tap the laptop, book or glowing phone. My evening lets you change a choice.';
}
function enterDesk(){stopBenTalk();$('#keepsake-room').hidden=true;$('#game-end').hidden=true;stopOrientationTalk();$('#orientation').hidden=true;
 stopClip();close(false);for(const id of ['world','chapter','journey','campus'])$('#'+id).hidden=true;$('#desk-room').hidden=false;document.body.classList.add('in-room');
 state.deskActions=planner.normalize(state.deskActions);deskMessage='';save();renderDesk();deskCollapsed(false);centerDesk();$('#desk-title').focus({preventScroll:true});announce('Chapter 3. Choose what matters. Tap an object on the desk.');if(deskStatus().complete)finishDesk();else showChapterPrelude(3);
}
function deskOption(id,label){
 const c=planner.choices[id],error=planner.reason(deskActions(),id),cost=`${c.minutes} min · ${c.energy?c.energy+' energy':'no energy'}`;
 return `<button class="desk-choice" data-desk-choice="${id}" ${error?'disabled':''}><strong>${label}</strong><small>${cost}</small>${error?`<em>${error}</em>`:''}</button>`;
}
function deskObject(group){
 const s=deskStatus(),selected=deskChoiceFor(group);
 if(group==='bed'){
  if(s.complete){finishDesk();return;}
  open(`<h2 class="dialog-title airport-dialog-title">A little breathing room.</h2><p class="dialog-copy">${s.ready?'My assignment is in. The rest has a place. I don’t have to fill every minute.':'Before I stop, I need to submit my assignment and decide what to do with the book and the phone.'}</p>${s.ready?`<div class="dialog-bottom"><button class="start" data-desk-choice="rest">Make time to rest · 10 min${icon('arrow')}</button></div>`:'<div class="dialog-bottom"><button class="start" data-close>Back to my desk</button></div>'}`,'desk-task');return;
 }
 const titles={laptop:'One thing first.',books:'What can wait?',phone:'A little connection.'};
 if(selected){
  const c=planner.choices[selected];open(`<h2 class="dialog-title airport-dialog-title">${titles[group]}</h2><p class="dialog-copy">✓ ${c.label}<br>${deskFeedback[selected]}</p><div class="dialog-bottom">${!s.complete?`<button class="soft-button" data-desk-undo="${selected}">Try a different choice</button>`:''}<button class="start" data-close>Back to my room${icon('arrow')}</button></div>`,'desk-task');return;
 }
 let body='';
 if(group==='laptop')body=`<div class="desk-task-card"><span>ASSIGNMENT · DUE 9 PM</span><strong>One last paragraph.</strong><p>I know what I want to say. Finding the English words takes a little longer.</p></div><p class="dialog-copy">This is the one deadline I can’t move.</p>${deskOption('assignment','Finish and submit')}`;
 if(group==='books')body=`<div class="desk-task-card"><span>ENGLISH READING · DUE FRIDAY</span><strong>A few more pages?</strong><p>I want to keep improving. But this can also be tomorrow’s small step.</p></div><div class="desk-choice-list">${deskOption('reading','Read for a little while')}${deskOption('tomorrow','Leave a note for tomorrow')}</div>`;
 if(group==='phone')body=`<div class="desk-home-message"><span>HOME ♡</span><p>“Long day? We’re here if you need us.”</p><small>Work reminder · Tomorrow’s shift starts at 8 AM.</small></div><p class="dialog-copy">I miss them. Tonight, a call or a few words can keep us close.</p><div class="desk-choice-list">${deskOption('call','Call home')}${deskOption('reply','Send a quick reply')}</div>`;
 open(`<h2 class="dialog-title airport-dialog-title">${titles[group]}</h2>${body}<div class="desk-task-footer"><button class="text-button" data-desk-review>Review my evening</button><button class="soft-button" data-close>Back</button></div>`,'desk-task');
}
function chooseDesk(id){
 const next=planner.choose(deskActions(),id);if(next.error){announce(next.error);return;}
 state.deskActions=next.actions;deskMessage=deskFeedback[id]||'';save();renderDesk();deskCollapsed(false);close();announce(`${planner.choices[id].label}. ${deskStatus().remaining} minutes left.`);if(id==='rest')finishDesk();
}
function reviewDesk(){
 const s=deskStatus();open(`<h2 class="dialog-title airport-dialog-title">My evening.</h2><p class="dialog-copy">${s.complete?'A little work, a little connection, and a little rest.':'You can rethink a choice. There’s no penalty for trying another plan.'}</p><div class="desk-plan-list">${deskActions().map(id=>`<div><span><strong>${planner.choices[id].label}</strong><small>${planner.choices[id].minutes} min</small></span>${!s.complete?`<button class="soft-button" data-desk-undo="${id}" aria-label="Undo ${planner.choices[id].label}">Undo</button>`:'<span aria-hidden="true">✓</span>'}</div>`).join('')||'<p class="dialog-copy">A fresh evening. Start with something on the desk.</p>'}</div><div class="dialog-bottom"><button class="start" data-close>Back to my room${icon('arrow')}</button></div>`,'desk-plan');
}
function undoDesk(id){state.deskActions=planner.undo(deskActions(),id);deskMessage='Let’s try another way. I’m still learning what works for me.';save();renderDesk();close();announce('Choice undone. Time and energy restored.');}
function finishDesk(){
 if(!deskStatus().complete)return;
 open(`<div class="desk-complete"><div class="desk-finish-art"><img src="${$('#jenny img').src}" alt="Clara"><span aria-hidden="true">☾</span></div><h2 class="dialog-title airport-dialog-title">Chapter 3 completed</h2><p class="dialog-copy">I can’t do everything tonight.<br>But I can choose what matters next.</p><p class="desk-reflection">Being independent also means knowing when to rest.</p><div class="dialog-bottom"><button class="soft-button" data-desk-review>My evening</button><button class="soft-button" data-lobby>Back to lobby</button><button class="start" data-orientation-start>Continue to Chapter 4${icon('arrow')}</button></div><button class="resume-button" data-desk-replay>Replay Chapter 3</button></div>`,'desk-complete');
}
$('#desk-lobby').addEventListener('click',lobby);$('#desk-review').addEventListener('click',reviewDesk);$('#desk-toggle').addEventListener('click',()=>deskCollapsed(!$('#desk-chat-body').hidden));
$('#desk-pan-left').addEventListener('click',()=>deskPan(-1));$('#desk-pan-right').addEventListener('click',()=>deskPan(1));
$('#desk-viewport').addEventListener('keydown',e=>{if(e.target===$('#desk-viewport')&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();deskPan(e.key==='ArrowLeft'?-1:1);}});
$('#desk-help').addEventListener('click',()=>open(`<h2 class="dialog-title airport-dialog-title">One evening at a time.</h2><p class="dialog-copy">Tap the laptop, book and phone to make three decisions. Time moves only when you choose a task.<br><br>Submit the assignment, keep a little connection with home, and decide whether the reading can wait. Leave 10 minutes for rest, then tap the bed.<br><br>Open My evening to undo a choice. On a narrow screen, swipe or use the arrows to see both sides of the room.</p><div class="dialog-bottom"><button class="start" data-close>Got it${icon('arrow')}</button></div>`,'desk-help'));
document.addEventListener('click',e=>{
 const object=e.target.closest('[data-desk-object]');if(object){deskObject(object.dataset.deskObject);return;}
 const choice=e.target.closest('[data-desk-choice]');if(choice){if(!choice.disabled)chooseDesk(choice.dataset.deskChoice);return;}
 const undo=e.target.closest('[data-desk-undo]');if(undo){undoDesk(undo.dataset.deskUndo);return;}
 if(e.target.closest('[data-desk-review]')){reviewDesk();return;}
 if(e.target.closest('[data-desk-start]')){enterDesk();return;}
 if(e.target.closest('[data-desk-replay]')){state.deskActions=[];enterDesk();}
});
addEventListener('resize',()=>{if(!$('#desk-room').hidden)centerDesk();});

// Chapter 4: conversations become a small shared event.
let orientationTalk=null,orientationMessage='';
function orientationStatus(){return orientationModel.summary(state.orientation);}
function orientationCollapsed(value){$('#orientation-chat-body').hidden=value;$('#orientation-toggle').textContent=value?'+':'−';$('#orientation-toggle').setAttribute('aria-expanded',String(!value));$('#orientation-toggle').ariaLabel=value?'Expand chat':'Minimize chat';}
function orientationLook(id,focus=true){
 const person=$(`[data-orientation-person="${id}"]`);if(!person)return;
 const view=$('#orientation-viewport'),r=person.getBoundingClientRect(),v=view.getBoundingClientRect();view.scrollLeft+=r.left+r.width/2-v.left-view.clientWidth/2;
 if(focus)person.focus({preventScroll:true});
}
function renderOrientation(){
 const status=orientationStatus();$('#orientation-progress').textContent=status.count+' / 3 friends';
 for(const id of orientationModel.ids){
  const helped=status.helped.includes(id),answered=status.answered.includes(id),person=$(`[data-orientation-person="${id}"]`),button=$(`[data-orientation-help="${id}"]`);
  person.classList.toggle('is-friend',helped);person.setAttribute('aria-label',`Talk to ${orientationModel.people[id].name}${helped?' · friend':''}`);
  button.hidden=!answered||helped;$(`[data-orientation-result="${id}"]`).hidden=!helped;
 }
 $('#orientation').classList.toggle('event-music-ready',status.activities.music.playing);renderEventRoomDetails();
 const pending=status.answered.find(id=>!status.helped.includes(id));
 $('#orientation-speech').textContent=orientationMessage||(status.complete?'I didn’t need perfect English to belong. I just needed to say hello.':pending?`${orientationModel.people[pending].name} asked for a little help. Let’s get their corner ready.`:status.count?'A little conversation, a little courage. Who should I meet next?':'Finding the room was easy this time. Starting a conversation… that’s another story.');
 $('#orientation-hint').textContent=status.complete?'Three new friends. A little more at home.':pending?'Tap the highlighted station on the table.':'Tap a student to say hello.';$('#orientation-finish').hidden=!status.complete;
}
function enterOrientation(){
 stopBenTalk();$('#keepsake-room').hidden=true;$('#game-end').hidden=true;stopOrientationTalk();stopClip();close(false);for(const id of ['world','chapter','journey','campus','desk-room'])$('#'+id).hidden=true;
 $('#orientation').hidden=false;document.body.classList.add('in-room');state.orientation=orientationModel.normalize(state.orientation);orientationMessage='';save();renderOrientation();orientationCollapsed(false);orientationLook('emma',false);$('#orientation-title').focus({preventScroll:true});
 announce('Chapter 4. Meet three students and help prepare Orientation.');if(orientationStatus().complete)finishOrientation();else showChapterPrelude(4);
}
function stopOrientationTalk(restore=false){
 stopEventAudio();const previous=orientationTalk?.id;orientationTalk=null;if(!$('#orientation-talk'))return;$('#orientation-talk').hidden=true;$('#orientation').classList.remove('is-talking');$$('.orientation-person').forEach(p=>p.classList.remove('talking-target'));$('#orientation-clara').style.removeProperty('--clara-x');if($('#orientation-worn-badge'))$('#orientation-worn-badge').style.left='36%';
 if(restore&&!$('#orientation').hidden){renderOrientation();const pending=previous&&orientationStatus().answered.includes(previous)&&!orientationStatus().helped.includes(previous);(pending?$(`[data-orientation-help="${previous}"]`):$(`[data-orientation-person="${previous||'emma'}"]`)).focus({preventScroll:true});}
}
function positionOrientationBubble(){
 if(!orientationTalk)return;const t=orientationTalk,person=orientationModel.people[t.id],line=t.step<3?person.lines[t.step]:null,speaker=line?.[0]==='Clara'?$('#orientation-clara'):$(`[data-orientation-person="${t.id}"] img`),r=speaker.getBoundingClientRect(),room=$('#orientation').getBoundingClientRect(),bubble=$('#orientation-bubble');
 const width=Math.min(335,room.width-32);bubble.style.width=width+'px';const x=r.left+r.width/2-room.left,left=Math.max(16,Math.min(room.width-width-16,x-width/2)),head=r.top+r.height*(line?.[0]==='Clara'?.18:.06)-room.top,header=$('.orientation-header').getBoundingClientRect().bottom-room.top;
 bubble.style.left=left+'px';bubble.style.top=Math.max(header+8,head-bubble.offsetHeight-18)+'px';bubble.style.setProperty('--talk-tail',Math.max(20,Math.min(width-35,x-left-9))+'px');
}
function showOrientationLine(){
 if(!orientationTalk)return;const t=orientationTalk,p=orientationModel.people[t.id],done=orientationStatus().helped.includes(t.id),line=done?[p.name,p.thanks]:p.lines[Math.min(t.step,1)];
 $('#orientation-speaker').textContent=line[0].toUpperCase();$('#orientation-line').textContent='“'+line[1]+'”';$('#orientation-bubble').classList.toggle('is-clara',line[0]==='Clara');$('#orientation-answers').innerHTML='';$('#orientation-feedback').hidden=true;$('#orientation-next').hidden=false;$('#orientation-next').textContent=done?'Visit our corner →':t.step===0?'Continue →':({emma:'Let’s take a photo →',noah:'Let’s listen →',maya:'Let’s make a badge →'})[t.id];positionOrientationBubble();$('#orientation-next').focus({preventScroll:true});
}
function startOrientationTalk(id){
 if(!orientationModel.people[id]||$('#orientation').hidden)return;orientationMessage='';stopOrientationTalk();const s=orientationStatus();orientationTalk={id,step:0};$('#orientation').classList.add('is-talking');$(`[data-orientation-person="${id}"]`).classList.add('talking-target');$('#orientation-talk').hidden=false;
 const person=$(`[data-orientation-person="${id}"]`),x=parseFloat(person.style.getPropertyValue('--friend-x'));$('#orientation-clara').style.setProperty('--clara-x',(x<35?x+10:x-12)+'%');renderEventRoomDetails();
 const view=$('#orientation-viewport'),r=person.getBoundingClientRect(),v=view.getBoundingClientRect();view.scrollLeft+=r.left+r.width/2-v.left-view.clientWidth/2-65;showOrientationLine();
}
function finishOrientation(){
 if(!orientationStatus().complete)return;stopOrientationTalk();if(!orientationStatus().groupPhoto){groupPhotoScene();return;}
 open(`<div class="orientation-complete"><div class="orientation-group">${['emma','noah','maya'].map(id=>`<img src="${$(`[data-orientation-person="${id}"] img`).src}" alt="${orientationModel.people[id].name}">`).join('')}<img src="${$('#jenny img').src}" alt="Clara"></div><h2 class="dialog-title airport-dialog-title">Chapter 4 completed</h2><p class="dialog-copy">I didn’t need perfect English to belong.<br>I just needed to say hello.</p><p class="orientation-reflection">She came to meet new people. She left with people to meet again.</p><div class="dialog-bottom"><button class="soft-button" data-close>Stay a little longer</button><button class="soft-button" data-lobby>Back to lobby</button><button class="start" data-keepsake-start>Continue to Chapter 5${icon('arrow')}</button></div><button class="resume-button" data-orientation-replay>Replay Chapter 4</button></div>`,'orientation-complete');
}
$('#orientation-lobby').addEventListener('click',lobby);$('#orientation-help').addEventListener('click',()=>showChapterGuide(4));$('#orientation-toggle').addEventListener('click',()=>orientationCollapsed(!$('#orientation-chat-body').hidden));$('#orientation-finish').addEventListener('click',finishOrientation);
$('#orientation-talk-close').addEventListener('click',()=>stopOrientationTalk(true));$('#orientation-next').addEventListener('click',()=>{if(!orientationTalk)return;if(orientationTalk.step>=1||orientationStatus().helped.includes(orientationTalk.id))openEventActivity(orientationTalk.id);else{orientationTalk.step++;showOrientationLine();}});
$('#orientation-viewport').addEventListener('scroll',positionOrientationBubble,{passive:true});$('#orientation-viewport').addEventListener('keydown',e=>{if(e.target!==$('#orientation-viewport')||!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();$('#orientation-viewport').scrollBy({left:(e.key==='ArrowLeft'?-1:1)*innerWidth*.65,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
addEventListener('resize',positionOrientationBubble);
document.addEventListener('keydown',e=>{if(orientationTalk&&e.key==='Escape'){e.preventDefault();stopOrientationTalk(true);}});
document.addEventListener('click',e=>{
 const person=e.target.closest('[data-orientation-person]');if(person){startOrientationTalk(person.dataset.orientationPerson);return;}
 const station=e.target.closest('[data-orientation-help]');if(station){openEventActivity(station.dataset.orientationHelp);return;}
 const look=e.target.closest('[data-orientation-look]');if(look){orientationLook(look.dataset.orientationLook);return;}
 if(e.target.closest('[data-orientation-start]'))enterOrientation();
 if(e.target.closest('[data-orientation-replay]')){state.orientation=orientationModel.normalize(null);enterOrientation();}
});

let eventPhotoSelected=null,eventDrag=null,eventIgnoreUntil=0,eventAudioContext,eventAudioNodes=[],eventMusicTimer;
function eventEscape(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function eventPortrait(id){return id==='clara'?$('#orientation-clara').src:$(`[data-orientation-person="${id}"] img`).src;}
function eventPortraitHTML(id){return `<img src="${eventPortrait(id)}" alt="${id==='clara'?'Clara':orientationModel.people[id].name}" draggable="false">`;}
function eventAct(type,value){state.orientation=orientationModel.act(state.orientation,type,value);save();renderOrientation();}
function stopEventAudio(){clearInterval(eventMusicTimer);eventMusicTimer=null;for(const n of eventAudioNodes){try{n.stop();}catch{}}eventAudioNodes=[];}
function playEventTrack(choice,loop=false){
 stopEventAudio();try{eventAudioContext ||= new(window.AudioContext||window.webkitAudioContext)();eventAudioContext.resume();
 const phrase=()=>{if(document.hidden)return;const seq=choice==='gentle'?[261.63,329.63,392,329.63,293.66,349.23,440,349.23]:[392,493.88,587.33,493.88,440,523.25,659.25,523.25];const step=choice==='gentle'?.42:.28;
 seq.forEach((f,i)=>{const at=eventAudioContext.currentTime+i*step,o=eventAudioContext.createOscillator(),g=eventAudioContext.createGain();o.type=choice==='gentle'?'sine':'triangle';o.frequency.value=f;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(Math.min(.12,volume*.32),at+.02);g.gain.exponentialRampToValueAtTime(.0001,at+step*.95);o.connect(g);g.connect(eventAudioContext.destination);o.start(at);o.stop(at+step);eventAudioNodes.push(o);o.onended=()=>{eventAudioNodes=eventAudioNodes.filter(n=>n!==o);o.disconnect();g.disconnect();};});};phrase();if(loop)eventMusicTimer=setInterval(phrase,3600);
 }catch{announce('Audio is unavailable. You can still choose a track and continue.');}
}
function renderEventRoomDetails(){
 const p=orientationStatus(),badge=$('#orientation-worn-badge');$('#event-room-photo').hidden=!p.activities.photo.taken;
 $('#event-room-photo').innerHTML=p.activities.photo.taken?eventPortraitHTML('clara')+eventPortraitHTML('emma')+'<span>Our first day ♡</span>':'';
 badge.hidden=!p.activities.badge.worn;badge.textContent=p.activities.badge.name.trim()+' '+badgeSticker(p.activities.badge.sticker);badge.style.left=$('#orientation-clara').style.getPropertyValue('--clara-x')||'36%';
}
function openEventActivity(id){
 if(!orientationModel.ids.includes(id))return;stopOrientationTalk();state.orientation=orientationModel.meet(state.orientation,id);save();renderOrientation();
 if(id==='emma')openPhotoCorner();else if(id==='noah')openMusicCorner();else openWelcomeTable();
}
function openPhotoCorner(){
 const p=orientationStatus().activities.photo;
 open(`<h2 class="dialog-title airport-dialog-title">A photo together.</h2><p class="event-description">${p.taken?'One little memory of a new friendship.':'Drag Clara and Emma into the frame, or tap a person and then their spot.'}</p><div class="event-photo-frame ${p.taken?'photo-taken':''}" id="event-photo-frame"><div class="event-photo-backdrop"><span aria-hidden="true">✦</span>${['clara','emma'].map(id=>`<button class="event-photo-slot ${p.placed.includes(id)?'filled':''}" data-event-slot="${id}" aria-label="Place ${id==='clara'?'Clara':'Emma'} in photo" ${p.taken?'disabled':''}>${p.placed.includes(id)?eventPortraitHTML(id):`<span>＋</span><small>${id==='clara'?'Clara':'Emma'}</small>`}</button>`).join('')}</div><span class="event-photo-caption">${p.taken?'Our first day together ♡':'Photo corner'}</span></div>${p.taken?'':`<div class="event-photo-tray">${['clara','emma'].filter(id=>!p.placed.includes(id)).map(id=>`<button class="event-photo-token ${eventPhotoSelected===id?'selected':''}" data-event-person="${id}" aria-pressed="${eventPhotoSelected===id}" aria-label="Select ${id==='clara'?'Clara':'Emma'}">${eventPortraitHTML(id)}<span>${id==='clara'?'Clara':'Emma'}</span></button>`).join('')}</div>`}<p class="event-feedback" id="event-photo-feedback" role="status">${p.taken?'Emma: “I’m glad we’re in this together.”':p.placed.length===2?'Everyone is in place. Ready?':eventPhotoSelected?'Now tap '+(eventPhotoSelected==='clara'?'Clara’s':'Emma’s')+' spot.':'Two people. One new memory.'}</p><div class="dialog-bottom"><button class="start" ${p.taken?'data-event-done="emma"':'data-event-snap'} ${!p.taken&&p.placed.length<2?'disabled':''}>${p.taken?'Keep our photo':'Take photo'}${icon('arrow')}</button></div>`,'event-photo');
}
function placeEventPerson(id,slot){
 if(id!==slot){$('#event-photo-feedback').textContent='Try the spot with '+(id==='clara'?'Clara’s':'Emma’s')+' name.';return;}
 eventAct('place',id);eventPhotoSelected=null;openPhotoCorner();
}
function openMusicCorner(){
 const p=orientationStatus().activities.music;
 open(`<h2 class="dialog-title airport-dialog-title">Find our soundtrack.</h2><div class="event-music-intro">${eventPortraitHTML('noah')}<p>Noah: “I made two little tracks. Which one feels like us?”</p></div><div class="event-tracks">${[['gentle','A gentle hello','Soft and easy'],['bright','A bright beginning','A little more bounce']].map(([id,name,copy])=>`<button class="event-track ${p.choice===id?'selected':''}" data-event-track="${id}" aria-pressed="${p.choice===id}"><span aria-hidden="true">▶</span><strong>${name}</strong><small>${copy} · tap to listen</small></button>`).join('')}</div><div class="event-speaker ${p.playing?'playing':''}" aria-hidden="true"><span>♪</span><i></i><i></i><span>♫</span></div><p class="event-feedback" role="status">${p.playing?'Noah: “That’s our sound. Save me a spot in the photo!”':p.choice?'Your choice is ready. Turn on the speakers.':'Listen to either track. Both choices are welcome.'}</p><div class="dialog-bottom"><button class="start" ${p.playing?'data-event-done="noah"':'data-event-play'} ${!p.choice?'disabled':''}>${p.playing?'Keep the music going':'Turn on speakers'}${icon('arrow')}</button></div>`,'event-music');
}
function badgeSticker(id){return {flower:'✿',star:'★',heart:'♥'}[id]||'';}
function openWelcomeTable(){
 const p=orientationStatus().activities.badge;
 open(`<h2 class="dialog-title airport-dialog-title">A name to remember.</h2><p class="event-description">Maya: “Let’s make your name badge. You’re part of the group now.”</p><div class="event-badge"><span>Hello, I’m</span><strong id="event-badge-name"></strong><span id="event-badge-sticker" class="event-badge-sticker" aria-hidden="true">${badgeSticker(p.sticker)}</span></div><label class="event-name-label" for="event-name">Name on your badge</label><input id="event-name" class="event-name" type="text" maxlength="20" autocomplete="off" placeholder="Clara" value="${eventEscape(p.name)}"><fieldset class="event-stickers"><legend>Choose a sticker</legend>${[['flower','Flower'],['star','Star'],['heart','Heart']].map(([id,name])=>`<button type="button" data-event-sticker="${id}" aria-label="${name} sticker" aria-pressed="${p.sticker===id}" class="${p.sticker===id?'selected':''}"><span aria-hidden="true">${badgeSticker(id)}</span></button>`).join('')}</fieldset><p class="event-feedback" id="event-badge-feedback" role="status">${p.worn?'Maya: “Come join us, '+eventEscape(p.name.trim())+'!”':'Your name, your little touch.'}</p><div class="dialog-bottom"><button class="start" id="event-wear" ${p.worn?'data-event-done="maya"':'data-event-wear'} ${!p.name.trim()||!p.sticker?'disabled':''}>${p.worn?'Join the group':'Wear my badge'}${icon('arrow')}</button></div>`,'event-badge');$('#event-badge-name').textContent=p.name.trim()||'Your name';
}
function finishEventActivity(id){
 close(false);renderOrientation();if(orientationStatus().complete)finishOrientation();else {if(orientationStatus().activities.music.playing)playEventTrack(orientationStatus().activities.music.choice,true);orientationMessage={emma:'A photo with Emma. A new face to look for on campus.',noah:'Noah found the soundtrack. This room feels a little more familiar.',maya:'A name badge, a welcome, and one less reason to feel like a stranger.'}[id];renderOrientation();orientationLook(orientationModel.ids.find(x=>!orientationStatus().helped.includes(x)));}
}
function groupPhotoScene(){
 const p=orientationStatus();open(`<h2 class="dialog-title airport-dialog-title">Room for one more.</h2><p class="event-description">Emma: “Clara, come stand with us!”</p><div class="event-group-photo ${p.groupPhoto?'photo-taken':''}" id="event-group-photo">${['emma','clara','noah','maya'].map(eventPortraitHTML).join('')}<span>${p.groupPhoto?'Our first day together ♡':'Everyone is in the frame.'}</span></div><p class="event-feedback">${p.groupPhoto?'She came to meet new people. She left with people to meet again.':'A little photo of the people who made a new place feel warmer.'}</p><div class="dialog-bottom"><button class="start" ${p.groupPhoto?'data-event-finale':'data-event-group'}>${p.groupPhoto?'Keep this moment':'Take group photo'}${icon('arrow')}</button></div>`,'event-group');
}
function flashEventPhoto(selector){const frame=$(selector);if(!frame)return;frame.classList.remove('camera-flash');void frame.offsetWidth;frame.classList.add('camera-flash');}
$('#dialog').addEventListener('input',e=>{if(e.target.id!=='event-name')return;eventAct('name',e.target.value);$('#event-badge-name').textContent=e.target.value.trim()||'Your name';$('#event-wear').disabled=!e.target.value.trim()||!orientationStatus().activities.badge.sticker;$('#event-wear').removeAttribute('data-event-done');$('#event-wear').setAttribute('data-event-wear','');$('#event-wear').innerHTML='Wear my badge'+icon('arrow');});
document.addEventListener('click',e=>{
 const token=e.target.closest('[data-event-person]');if(token){if(Date.now()<eventIgnoreUntil)return;eventPhotoSelected=token.dataset.eventPerson;openPhotoCorner();return;}
 const slot=e.target.closest('[data-event-slot]');if(slot&&eventPhotoSelected){placeEventPerson(eventPhotoSelected,slot.dataset.eventSlot);return;}
 if(e.target.closest('[data-event-snap]')){eventAct('photo');openPhotoCorner();flashEventPhoto('#event-photo-frame');return;}
 const track=e.target.closest('[data-event-track]');if(track){eventAct('track',track.dataset.eventTrack);openMusicCorner();playEventTrack(track.dataset.eventTrack);return;}
 if(e.target.closest('[data-event-play]')){eventAct('play');openMusicCorner();playEventTrack(orientationStatus().activities.music.choice,true);return;}
 const sticker=e.target.closest('[data-event-sticker]');if(sticker){eventAct('sticker',sticker.dataset.eventSticker);openWelcomeTable();return;}
 if(e.target.closest('[data-event-wear]')){eventAct('wear');openWelcomeTable();return;}
 const done=e.target.closest('[data-event-done]');if(done){finishEventActivity(done.dataset.eventDone);return;}
 if(e.target.closest('[data-event-group]')){eventAct('group');groupPhotoScene();flashEventPhoto('#event-group-photo');return;}
 if(e.target.closest('[data-event-finale]'))finishOrientation();
});
document.addEventListener('pointerdown',e=>{const source=e.target.closest('[data-event-person]');if(!source||e.button!==0)return;eventDrag={source,id:source.dataset.eventPerson,pointer:e.pointerId,x:e.clientX,y:e.clientY,ghost:null};});
document.addEventListener('pointermove',e=>{if(!eventDrag||eventDrag.pointer!==e.pointerId)return;const d=eventDrag;if(!d.ghost&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>7){d.source.setPointerCapture(e.pointerId);d.ghost=document.createElement('img');d.ghost.src=eventPortrait(d.id);d.ghost.className='drag-ghost';d.ghost.alt='';$('#dialog').append(d.ghost);}if(!d.ghost)return;e.preventDefault();d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';},{passive:false});
function endEventDrag(e,cancel=false){if(!eventDrag||eventDrag.pointer!==e.pointerId)return;const d=eventDrag;eventDrag=null;if(!d.ghost)return;d.ghost.remove();eventIgnoreUntil=Date.now()+350;try{d.source.releasePointerCapture(e.pointerId);}catch{}const target=cancel||dialogType!=='event-photo'?null:document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-event-slot]');if(target)placeEventPerson(d.id,target.dataset.eventSlot);}
document.addEventListener('pointerup',endEventDrag);document.addEventListener('pointercancel',e=>endEventDrag(e,true));

// Chapter 5: familiar objects, a changed perspective, and a letter to the future.
let keepsakeSelected=null,keepsakeMemory='',memoryDrag=null,keepsakeIgnoreUntil=0;
function keepsakeStatus(){return keepsakeModel.normalize(state.keepsakes);}
function enterKeepsakes(){
 stopBenTalk();stopOrientationTalk();stopClip();close(false);for(const id of ['world','chapter','journey','campus','desk-room','orientation','game-end'])$('#'+id).hidden=true;
 $('#keepsake-room').hidden=false;document.body.classList.add('in-room');state.keepsakes=keepsakeStatus();keepsakeSelected=null;keepsakeMemory='';save();$('#keepsake-title').focus({preventScroll:true});renderKeepsakeRoom();if(keepsakeStatus().letterRead){if(state.gameEnded)showGameEnd();else finishKeepsakes();}else showChapterPrelude(5);
}
function renderKeepsakeRoom(){
 const p=keepsakeStatus();$('#keepsake-count').textContent=p.matched.length+' / 6 memories';$('#keepsake-room-copy').textContent=p.letterRead?'The same suitcase. A different Clara.':p.matched.length===6?'Every memory is in place. One letter is waiting.':'The things Clara brought from home are still here. What do they mean to her now?';
}
function keepsakePuzzle(){
 open(`<p class="dialog-kicker">CHAPTER 05 · LOOKING BACK</p><h2 class="dialog-title airport-dialog-title">Pieces of home.</h2><div class="keepsake-puzzle-header"><span id="keepsake-puzzle-count"></span><p>Match each object to its outline. The letter comes last.</p></div><div class="keepsake-case"><span class="keepsake-handle" aria-hidden="true"></span><div id="keepsake-outlines" class="keepsake-outlines"></div></div><div id="keepsake-inventory" class="keepsake-inventory"></div><p id="keepsake-memory" class="keepsake-memory" role="status"></p><div class="dialog-bottom"><button id="keepsake-read" class="start" data-keepsake-letter hidden>Read the letter${icon('arrow')}</button></div>`,'keepsake-puzzle');renderKeepsakePuzzle();
}
function renderKeepsakePuzzle(){
 const p=keepsakeStatus();$('#keepsake-puzzle-count').textContent=p.matched.length+' / 6 memories';
 $('#keepsake-outlines').innerHTML=keepsakeModel.ids.map(id=>`<button class="keepsake-outline ${p.matched.includes(id)?'matched':''}" data-keepsake-outline="${id}" aria-label="${p.matched.includes(id)?byId(id).name+' matched':'Match '+byId(id).name+' outline'}" ${p.matched.includes(id)?'disabled':''}><img src="${asset(id)}" alt="" draggable="false">${p.matched.includes(id)?'<span aria-hidden="true">✓</span>':''}</button>`).join('');
 $('#keepsake-inventory').innerHTML=['photo','mug','passport','laptop','notebook','clothes'].map(id=>{const matched=p.matched.includes(id),locked=id==='mug'&&p.matched.length<5;return `<button id="keepsake-piece-${id}" class="keepsake-piece ${keepsakeSelected===id?'selected':''} ${matched?'matched':''}" data-keepsake-item="${id}" ${matched||locked?'disabled':''} aria-label="${byId(id).name}${locked?' · find the other five memories first':matched?' · matched':' · select'}" aria-pressed="${keepsakeSelected===id}"><img src="${asset(id)}" alt="" draggable="false"><span>${byId(id).name}</span>${locked?'<small>Last memory</small>':''}</button>`;}).join('');
 $('#keepsake-memory').textContent=keepsakeMemory||(p.matched.length===6?'A letter from the person who first packed this suitcase.':keepsakeSelected?'Choose the matching outline, or drag the object onto it.':'Choose an object, then its outline. You can also drag it.');$('#keepsake-read').hidden=p.matched.length!==6;
}
function matchKeepsake(item,outline){
 const result=keepsakeModel.match(state.keepsakes,item,outline);if(result.error){keepsakeMemory=result.error;renderKeepsakePuzzle();return;}
 state.keepsakes=result.progress;keepsakeSelected=null;keepsakeMemory=keepsakeModel.memories[item];save();renderKeepsakeRoom();renderKeepsakePuzzle();announce(byId(item).name+' matched. '+result.progress.matched.length+' of 6 memories.');
 const next=keepsakeModel.ids.find(id=>!result.progress.matched.includes(id));(next?$('#keepsake-piece-'+next):$('#keepsake-read')).focus({preventScroll:true});
}
let keepsakeLetterPage=0;
function readKeepsakeLetter(page=0){
 if(keepsakeStatus().matched.length!==6)return;keepsakeLetterPage=page===1?1:0;
 const last=keepsakeLetterPage===1;
 open(`<article class="keepsake-letter" aria-label="Letter page ${keepsakeLetterPage+1} of 2" tabindex="0"><h2 class="dialog-title airport-dialog-title">${keepsakeModel.letter[0]}</h2>${keepsakeModel.letterPages[keepsakeLetterPage].map(text=>`<p>${eventEscape(text)}</p>`).join('')}</article><footer class="letter-navigation"><span class="letter-page-count" aria-live="polite">Page ${keepsakeLetterPage+1} of 2</span><div class="letter-page-buttons"><button class="soft-button" data-keepsake-page="0" ${last?'':'disabled'}>Previous page</button><button class="start" ${last?'data-keepsake-finish':'data-keepsake-page="1"'}>${last?'Carry this with me':'Next page'}${icon('arrow')}</button></div><button class="text-button letter-case-link" data-keepsake-case>Back to my suitcase</button></footer>`,'keepsake-letter');$('#dialog').scrollTop=0;$('.keepsake-letter').scrollTop=0;
}
function finishKeepsakes(){
 if(!keepsakeStatus().letterRead)return;
 open(`<div class="keepsake-ending"><div class="journey-keepsakes">${items.map(i=>`<img src="${asset(i.id)}" alt="${i.name}">`).join('')}</div><h2 class="dialog-title airport-dialog-title">Chapter 5 completed</h2><p class="keepsake-final-title">A little closer to herself.</p><p class="dialog-copy">The same suitcase. A different Clara.<br>Each small step has made a new place feel more like home.</p><p class="keepsake-next-chapter">Her next chapter is still being written.</p><div class="dialog-bottom"><button class="soft-button" data-keepsake-letter>Read the letter again</button><button class="start" data-game-end>Finish my story${icon('arrow')}</button></div><button class="text-button keepsake-lobby-link" data-lobby>Back to lobby</button><button class="resume-button" data-keepsake-replay>Replay Chapter 5</button></div>`,'keepsake-ending');
}
function showGameEnd(){
 if(!keepsakeStatus().letterRead)return;stopBenTalk();stopOrientationTalk();stopClip();close(false);
 for(const id of ['world','chapter','journey','campus','desk-room','orientation','keepsake-room'])$('#'+id).hidden=true;
 state.gameEnded=true;save();document.body.classList.remove('in-room');$('#game-end').hidden=false;$('#game-end-title').focus({preventScroll:true});announce('Thank you for playing The Abroad Chapter.');
}
$('#game-end-lobby').addEventListener('click',lobby);$('#game-end-letter').addEventListener('click',()=>readKeepsakeLetter());
$('#keepsake-lobby').addEventListener('click',lobby);$('#keepsake-help').addEventListener('click',()=>showChapterGuide(5));$('#keepsake-case-open').addEventListener('click',keepsakePuzzle);
document.addEventListener('click',e=>{
 if(Date.now()<keepsakeIgnoreUntil)return;
 const item=e.target.closest('[data-keepsake-item]');if(item&&!item.disabled){keepsakeSelected=item.dataset.keepsakeItem;keepsakeMemory='';renderKeepsakePuzzle();$('#keepsake-piece-'+keepsakeSelected).focus({preventScroll:true});return;}
 const outline=e.target.closest('[data-keepsake-outline]');if(outline&&!outline.disabled){if(keepsakeSelected)matchKeepsake(keepsakeSelected,outline.dataset.keepsakeOutline);else{$('#keepsake-memory').textContent='Choose an object below first.';}return;}
 if(e.target.closest('[data-keepsake-start]'))enterKeepsakes();
 if(e.target.closest('[data-keepsake-case]'))keepsakePuzzle();
 if(e.target.closest('[data-keepsake-letter]'))readKeepsakeLetter();
 const letterPage=e.target.closest('[data-keepsake-page]');if(letterPage&&!letterPage.disabled)readKeepsakeLetter(Number(letterPage.dataset.keepsakePage));
 if(e.target.closest('[data-keepsake-finish]')&&dialogType==='keepsake-letter'&&keepsakeLetterPage===1){state.keepsakes=keepsakeModel.read(state.keepsakes);save();renderKeepsakeRoom();if(!$('#game-end').hidden)showGameEnd();else finishKeepsakes();}
 if(e.target.closest('[data-game-end]'))showGameEnd();
 if(e.target.closest('[data-keepsake-replay]')){state.gameEnded=false;state.keepsakes=keepsakeModel.normalize(null);enterKeepsakes();}
});
document.addEventListener('pointerdown',e=>{const item=e.target.closest('[data-keepsake-item]');if(!item||item.disabled||e.button!==0)return;memoryDrag={source:item,id:item.dataset.keepsakeItem,x:e.clientX,y:e.clientY,pointer:e.pointerId,ghost:null};});
document.addEventListener('pointermove',e=>{
 if(!memoryDrag||memoryDrag.pointer!==e.pointerId)return;const d=memoryDrag;if(!d.ghost&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>7){d.source.setPointerCapture(e.pointerId);d.ghost=document.createElement('img');d.ghost.className='drag-ghost';d.ghost.src=asset(d.id);d.ghost.alt='';$('#dialog').append(d.ghost);}
 if(!d.ghost)return;e.preventDefault();d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';$$('.keepsake-outline.drag-over').forEach(el=>el.classList.remove('drag-over'));document.elementFromPoint(e.clientX,e.clientY)?.closest('.keepsake-outline:not([disabled])')?.classList.add('drag-over');
},{passive:false});
function endMemoryDrag(e,cancel=false){if(!memoryDrag||memoryDrag.pointer!==e.pointerId)return;const d=memoryDrag;memoryDrag=null;if(!d.ghost)return;keepsakeIgnoreUntil=Date.now()+350;d.ghost.remove();$$('.keepsake-outline.drag-over').forEach(el=>el.classList.remove('drag-over'));try{d.source.releasePointerCapture(e.pointerId);}catch{}const target=cancel||dialogType!=='keepsake-puzzle'?null:document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-keepsake-outline]:not([disabled])');if(target)matchKeepsake(d.id,target.dataset.keepsakeOutline);}
document.addEventListener('pointerup',e=>endMemoryDrag(e));document.addEventListener('pointercancel',e=>endMemoryDrag(e,true));

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
 const instructions=e.target.closest('[data-chapter-instructions]');if(instructions)showChapterGuide(Number(instructions.dataset.chapterInstructions));
 if(e.target.closest('[data-begin-introduction]'))intro();
 if(e.target.closest('[data-intro-next]'))introStep<2?intro(introStep+1):enterRoom();
 if(e.target.closest('[data-intro-back]'))intro(introStep-1);
 if(e.target.closest('[data-toggle-music]')){toggleMusic();help();}
 if(e.target.closest('[data-toggle-sfx]')){soundEffects=!soundEffects;if(soundEffects)playClick();save();help();}
 if(e.target.closest('[data-lobby]'))lobby();
 if(e.target.closest('[data-review]')){enterRoom(false);showSuitcase();}
 if(e.target.closest('[data-replay]')){state={...state,started:false,completed:false,slots:Array(6).fill(null)};delete state.journey;delete state.message;delete state.promise;selected=null;speech={kind:'welcome'};save();updateResume();lobby();renderChapter();setChatCollapsed(false);intro();}
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
const previewChapter=new URLSearchParams(location.search).get('chapter');if(previewChapter==='5')enterKeepsakes();else if(previewChapter==='4')enterOrientation();else if(previewChapter==='3')enterDesk();else if(previewChapter==='2')enterCampus();
})();
