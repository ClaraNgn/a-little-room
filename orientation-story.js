(function(root){
'use strict';
const people={
 emma:{name:'Emma',country:'France',task:'Set up the photo corner',done:'Photo corner ready',lines:[['Emma','Hi, I’m Emma! I’m from France. I brought a baguette to share—and my camera.'],['Clara','I’m Clara. Can I help with the photo corner?'],['Emma','Yes! I love taking photos. Let’s capture our first day together.']],thanks:'Perfect! Come stand with us, Clara.'},
 noah:{name:'Noah',country:'Mexico',task:'Get the music ready',done:'Music ready',lines:[['Noah','Hey, I’m Noah, from Mexico. I made the playlist for today.'],['Clara','I’m Clara. Music makes a new room feel a little less awkward.'],['Noah','Exactly! Want to help me get the music ready?']],thanks:'Sounds good! Save me a spot in the photo.'},
 maya:{name:'Maya',country:'India',task:'Prepare the welcome table',done:'Welcome table ready',lines:[['Maya','Hi! I’m Maya, from India. I’m helping welcome everyone.'],['Clara','I’m Clara. I’m still finding the words sometimes.'],['Maya','You don’t have to say it perfectly. Want to welcome people with me?']],thanks:'We’re ready. I’m glad you said hello.'}
};
const ids=Object.keys(people);
function normalize(input){
 const clean=a=>Array.isArray(a)?ids.filter(id=>a.includes(id)):[];
 const answered=clean(input?.answered),old=input?.version!==2,legacy=old?clean(input?.helped).filter(id=>answered.includes(id)):[];
 const a=input?.activities||{},photo={placed:Array.isArray(a.photo?.placed)?['clara','emma'].filter(id=>a.photo.placed.includes(id)):[],taken:a.photo?.taken===true},music={choice:['gentle','bright'].includes(a.music?.choice)?a.music.choice:null,playing:a.music?.playing===true},badge={name:typeof a.badge?.name==='string'?a.badge.name.slice(0,20):'',sticker:['flower','star','heart'].includes(a.badge?.sticker)?a.badge.sticker:null,worn:a.badge?.worn===true};
 if(legacy.includes('emma')){photo.placed=['clara','emma'];photo.taken=true;}if(legacy.includes('noah')){music.choice='gentle';music.playing=true;}if(legacy.includes('maya')){badge.name='Clara';badge.sticker='flower';badge.worn=true;}
 photo.taken=photo.taken&&photo.placed.length===2;music.playing=music.playing&&!!music.choice;badge.worn=badge.worn&&!!badge.name.trim()&&!!badge.sticker;
 const helped=ids.filter(id=>answered.includes(id)&&({emma:photo.taken,noah:music.playing,maya:badge.worn})[id]);
 return {version:2,answered,helped,activities:{photo,music,badge},groupPhoto:helped.length===3&&(input?.groupPhoto===true||legacy.length===3)};
}
function meet(input,id){const p=normalize(input);if(ids.includes(id)&&!p.answered.includes(id))p.answered.push(id);return normalize(p);}
function act(input,type,value){const p=normalize(input),a=p.activities;
 if(type==='place'&&p.answered.includes('emma')&&['clara','emma'].includes(value)&&!a.photo.placed.includes(value))a.photo.placed.push(value);
 if(type==='photo'&&p.answered.includes('emma')&&a.photo.placed.length===2)a.photo.taken=true;
 if(type==='track'&&p.answered.includes('noah')&&['gentle','bright'].includes(value)){a.music.choice=value;a.music.playing=false;}
 if(type==='play'&&p.answered.includes('noah')&&a.music.choice)a.music.playing=true;
 if(type==='name'&&p.answered.includes('maya')&&typeof value==='string'){a.badge.name=value.slice(0,20);a.badge.worn=false;}
 if(type==='sticker'&&p.answered.includes('maya')&&['flower','star','heart'].includes(value)){a.badge.sticker=value;a.badge.worn=false;}
 if(type==='wear'&&p.answered.includes('maya')&&a.badge.name.trim()&&a.badge.sticker)a.badge.worn=true;
 if(type==='group'&&p.helped.length===3)p.groupPhoto=true;
 return normalize(p);
}
function summary(input){const p=normalize(input);return {...p,count:p.helped.length,complete:p.helped.length===ids.length};}
const api={people,ids,normalize,meet,act,summary};
if(typeof module==='object'&&module.exports)module.exports=api;else root.orientationStory=api;
})(typeof window==='object'?window:globalThis);
