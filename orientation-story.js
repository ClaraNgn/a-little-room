(function(root){
'use strict';
const people={
 emma:{name:'Emma',country:'France',task:'Set up the photo corner',done:'Photo corner ready',question:'What does Emma love doing?',answers:['Taking photos','Making the playlist'],correct:0,hint:'Emma loves taking photos. Have another try.',lines:[['Emma','Hi, I’m Emma! I’m from France. I brought a baguette to share—and my camera.'],['Clara','I’m Clara. Can I help with the photo corner?'],['Emma','Yes! I love taking photos. Let’s capture our first day together.']],thanks:'Perfect! Come stand with us, Clara.'},
 noah:{name:'Noah',country:'Mexico',task:'Get the music ready',done:'Music ready',question:'What did Noah prepare?',answers:['A photo backdrop','The playlist'],correct:1,hint:'Noah made the playlist. Give it another try.',lines:[['Noah','Hey, I’m Noah, from Mexico. I made the playlist for today.'],['Clara','I’m Clara. Music makes a new room feel a little less awkward.'],['Noah','Exactly! Want to help me get the music ready?']],thanks:'Sounds good! Save me a spot in the photo.'},
 maya:{name:'Maya',country:'India',task:'Prepare the welcome table',done:'Welcome table ready',question:'What is Maya helping with?',answers:['Welcoming people','Choosing the music'],correct:0,hint:'Maya is helping welcome everyone. You can try again.',lines:[['Maya','Hi! I’m Maya, from India. I’m helping welcome everyone.'],['Clara','I’m Clara. I’m still finding the words sometimes.'],['Maya','You don’t have to say it perfectly. Want to welcome people with me?']],thanks:'We’re ready. I’m glad you said hello.'}
};
const ids=Object.keys(people);
function normalize(input){
 const clean=a=>Array.isArray(a)?ids.filter(id=>a.includes(id)):[];
 const answered=clean(input?.answered),helped=clean(input?.helped).filter(id=>answered.includes(id));
 return {answered,helped};
}
function answer(input,id,index){const progress=normalize(input),correct=Object.hasOwn(people,id)&&Number.isInteger(index)&&people[id].correct===index;if(correct&&!progress.answered.includes(id))progress.answered.push(id);return {progress,correct};}
function help(input,id){const progress=normalize(input);if(progress.answered.includes(id)&&!progress.helped.includes(id))progress.helped.push(id);return normalize(progress);}
function summary(input){const p=normalize(input);return {...p,count:p.helped.length,complete:p.helped.length===ids.length};}
const api={people,ids,normalize,answer,help,summary};
if(typeof module==='object'&&module.exports)module.exports=api;else root.orientationStory=api;
})(typeof window==='object'?window:globalThis);
