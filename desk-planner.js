(function(root){
'use strict';
const choices=Object.freeze({
 assignment:{group:'laptop',label:'Assignment submitted',minutes:30,energy:2},
 reading:{group:'books',label:'English reading finished',minutes:15,energy:1},
 tomorrow:{group:'books',label:'Reading saved for tomorrow',minutes:0,energy:0},
 call:{group:'phone',label:'Called home',minutes:15,energy:1},
 reply:{group:'phone',label:'Replied to home',minutes:5,energy:0},
 rest:{group:'rest',label:'Time to rest',minutes:10,energy:-2}
});
function summary(actions=[]){
 const minutes=actions.reduce((n,id)=>n+(choices[id]?.minutes||0),0);
 const spent=actions.reduce((n,id)=>n+(choices[id]?.energy||0),0);
 const groups=new Set(actions.map(id=>choices[id]?.group));
 return {minutes,remaining:60-minutes,energy:Math.max(0,Math.min(3,3-spent)),decisions:['laptop','books','phone'].filter(g=>groups.has(g)).length,ready:['laptop','books','phone'].every(g=>groups.has(g)),complete:groups.has('rest')};
}
function reason(actions,id){
 const c=choices[id],s=summary(actions);
 if(!Object.hasOwn(choices,id))return 'Choose a task on the desk.';
 if(s.complete)return 'This evening is finished. You can replay it.';
 if(actions.some(a=>choices[a]?.group===c.group))return 'Already decided. You can undo it in My evening.';
 if(id==='rest'&&!s.ready)return 'Submit the assignment and decide what to do with the book and phone first.';
 const limit=id==='rest'?60:50;
 if(s.minutes+c.minutes>limit)return 'That would leave too little time for rest. Try a shorter task, or adjust My evening.';
 if(c.energy>s.energy)return 'I’m too tired for that right now. Choose a lighter option, or adjust My evening.';
 return '';
}
function choose(actions,id){const error=reason(actions,id);return {actions:error?[...actions]:[...actions,id],error};}
function normalize(value){
 let result=[];
 if(Array.isArray(value))for(const id of value){if(typeof id==='string'&&!reason(result,id))result.push(id);}
 return result;
}
function undo(actions,id){return summary(actions).complete?[...actions]:actions.filter(a=>a!==id);}
const api=Object.freeze({choices,summary,reason,choose,normalize,undo});
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.deskPlanner=api;
})(typeof window!=='undefined'?window:globalThis);
