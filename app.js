const $=s=>document.querySelector(s),pad=n=>String(n).padStart(2,'0'),td=(d=new Date())=>d.toLocaleDateString('en-CA');
const E={
wp:{n:'Wall push-up',u:'r',c:'Hands on a wall at shoulder height, body straight. Bend your elbows (about 45° from your body) to bring your chest to the wall, then push back.'},
ip:{n:'Incline push-up',u:'r',c:'Hands on a sturdy table, body straight. Lower your chest to the edge with elbows about 45°, then press up.'},
kp:{n:'Knee push-up',u:'r',c:'Hands under shoulders, knees down, body straight from head to knees. Lower your chest, then press up.'},
pu:{n:'Push-up',u:'r',c:'Hands slightly wider than shoulders, body straight from head to heels. Lower your chest with elbows about 45°, press up without sagging your hips.'},
pk:{n:'Pike push-up',u:'r',c:'Hips high in an upside-down V. Bend your elbows to lower your head toward the floor between your hands, then press up.'},
cd:{n:'Chair dip',u:'r',q:'bench dips beginner form',c:'Hands on the edge of a sturdy chair placed against a wall, knees bent. Lower your elbows straight back only as deep as is comfortable, then press up.'},
br:{n:'Backpack row',u:'r',q:'backpack bent over row form',c:'Hold a loaded backpack, hinge at the hips with a flat back. Pull the bag to your lower ribs, squeeze your shoulder blades, lower slowly. Start light.'},
su:{n:'Superman',u:'r',c:'Lie face down, arms forward. Lift arms and legs slightly with a neutral neck, hold 2 seconds, lower.'},
fp:{n:'Forearm plank',u:'s',c:'Forearms down, elbows under shoulders, body straight from head to heels, stomach tight, hips not sagging.'},
db:{n:'Dead bug',u:'r',p:'per side',c:'On your back, arms up, knees bent 90° over your hips. Lower the opposite arm and leg with your lower back pressed down, then switch.'},
bd:{n:'Bird dog',u:'r',p:'per side',c:'On hands and knees, extend the opposite arm and leg with level hips, hold 2 seconds, switch.'},
cs:{n:'Chair squat',u:'r',c:'Feet shoulder-width in front of a chair. Push your hips back and bend your knees until you lightly touch the seat, then stand through your heels.'},
sq:{n:'Squat',u:'r',c:'Feet shoulder-width, hips back, chest up, knees over toes. Lower to about parallel, then stand.'},
rl:{n:'Reverse lunge',u:'r',p:'per side',c:'Step one foot back and lower until both knees are about 90°. Push through the front heel and alternate legs. Hold a wall if needed.'},
gb:{n:'Glute bridge',u:'r',c:'On your back, knees bent. Lift your hips, squeezing your glutes, until shoulders to knees is a straight line. Pause 1 second, lower slowly.'},
cr:{n:'Calf raise',u:'r',c:'Hold a wall, rise onto your toes, lower slowly.'},
ni:{n:'Neck isometrics',u:'s',p:'per direction',nk:1,q:'neck isometric exercises physiotherapist',c:'Sit tall. Press your palm against your forehead, then each side of your head, then the back of your head. Your head must not move. Push gently and hold. One round = all 4 directions. Go gently, never jerk, stop if you feel pain or dizziness.'},
ct:{n:'Chin tuck',u:'r',nk:1,q:'chin tucks physiotherapist',c:'Sit tall looking ahead. Draw your chin straight back without tilting your head, hold 5 seconds.'}};
const L=[
[['wp',1,8],['cs',1,8],['ni',1,5]],
[['wp',2,8],['cs',2,8],['fp',1,10],['gb',1,8],['ni',2,5]],
[['ip',2,6],['cs',2,10],['br',2,8],['fp',2,15],['gb',2,10],['ni',2,8],['ct',1,5]],
[['ip',2,10],['sq',2,8],['br',2,10],['cd',1,6],['db',2,6],['fp',2,20],['gb',2,12],['ni',3,8],['ct',2,5]],
[['kp',3,8],['sq',3,10],['rl',2,6],['br',3,10],['cd',2,8],['su',2,8],['db',2,8],['bd',2,6],['fp',3,20],['cr',2,12],['ni',3,10],['ct',2,8]],
[['pu',3,8],['pk',2,6],['sq',3,12],['rl',3,8],['br',3,12],['cd',3,10],['su',3,10],['db',3,10],['bd',3,8],['fp',3,30],['gb',3,15],['cr',3,15],['ni',3,10],['ct',3,10]]];

let st=Object.assign({level:1,lvStart:td(),log:{},water:{},goal:8,topic:'',asked:'',sched:{},rem:{w:1,x:1,ws:8,we:20,wi:2,wt:'17:00'}},JSON.parse(localStorage.getItem('ss')||'{}'));
if(!st.topic)st.topic='strength-'+[...crypto.getRandomValues(new Uint8Array(8))].map(b=>pad(b.toString(16))).join('');
const save=()=>localStorage.setItem('ss',JSON.stringify(st));
let tab='today',tm=null;

const rest=()=>st.level>=5?45:30;
const mins=it=>Math.round(it.reduce((t,[k,s,a])=>t+s*((E[k].u=='s'?a*(E[k].nk?4:1):a*3)+rest()),0)/60)||1;
const yt=e=>'https://www.youtube.com/results?search_query='+encodeURIComponent(e.q||e.n+' beginner form').replace(/%20/g,'+');
function lv(n){if(n<=6)return L[n-1];const x=n-6;return L[5].map(([k,s,a])=>[k,Math.min(4,s+(x>>1)),a+(E[k].u=='s'?5:2)*x])}
const items=()=>lv(st.level).filter(([k])=>!E[k].nk||[1,3,5].includes(new Date().getDay()));
function streak(){let n=0;const d=new Date();for(let i=0;i<400;i++,d.setDate(d.getDate()-1)){const w=d.getDay();if(w==0||w==6)continue;const l=st.log[td(d)];if(l&&l.ok)n++;else if(i>0)break}return n}
function lvCheck(){const t=td();if(st.asked==t)return 0;const a=new Date(st.lvStart+'T00:00'),n=new Date(t+'T00:00');if((n-a)/864e5<14)return 0;let tot=0,ok=0;for(const d=new Date(a);d<n;d.setDate(d.getDate()+1)){const w=d.getDay();if(w>0&&w<6){tot++;const l=st.log[td(d)];if(l&&l.ok)ok++}}return tot&&ok/tot>=.8}

const dose=([k,s,a])=>{const e=E[k];return `${s} × ${a}${e.u=='s'?' sec':''}${e.p?' '+e.p:''}`};
const card=it=>{const k=it[0],s=it[1],a=it[2],e=E[k],n=(st.log[td()]||{s:{}}).s[k]||0;
return `<section class="card${n>=s?' ok':''}"><h2>${e.n}</h2><p class=dose>${dose(it)}</p><p class=cue>${e.c}</p><div class=row>${Array.from({length:s},(_,i)=>`<button class="chip${i<n?' on':''}" data-a=set data-k=${k} data-i=${i} aria-label="Set ${i+1}">${i+1}</button>`).join('')}${e.u=='s'?`<button class=btn data-a=hold data-k=${k} data-s=${a}>Start ${a}s timer</button>`:''}</div><a href="${yt(e)}" target=_blank rel=noopener>Watch how</a></section>`};
const water=()=>{const w=st.water[td()]||0;return `<section class=card><h2>Water</h2><p class=dose>${w} of ${st.goal} glasses</p><div class=bar><i style="width:${Math.min(100,w/st.goal*100)}%"></i></div><div class=row><button class=btn data-a=w data-d=-1 aria-label="Remove a glass">−</button><button class=btn data-a=w data-d=1>+ Glass</button></div></section>`};

function today(){const d=new Date(),w=d.getDay(),lg=st.log[td()]||{ok:0},tr=w>0&&w<6,it=tr?items():[];
return `<p class=sub>${d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</p><div class=big>${streak()}</div><p class=sub>day streak. Level ${st.level}${tr?', about '+mins(it)+' min today':', rest day'}.</p>`
+(lvCheck()?`<section class=card><h2>Ready to level up?</h2><p class=cue>You finished most sessions over the last 2 weeks.</p><div class=row><button class=btn data-a=lvl data-v=up>Level up</button><button class=btn data-a=lvl data-v=stay>Stay</button><button class=btn data-a=lvl data-v=down>Go easier</button></div></section>`:'')
+(tr?it.map(card).join('')+`<button class="btn wide" data-a=ok>${lg.ok?'Completed. Tap to undo':'Mark today complete'}</button>`:`<section class=card><h2>Rest day</h2><p class=cue>Recover and drink water.</p></section>`)
+water()}

function plan(){return `<h1>Plan</h1><p class=note>Stop if you feel sharp pain. If you have an injury or medical condition, check with a doctor first. Train Monday to Friday, with neck work on Monday, Wednesday and Friday. Every 2 weeks the app asks whether to level up.</p>`
+L.map((l,i)=>`<details class=card><summary>Level ${i+1}, about ${mins(l)} min</summary>${l.map(it=>{const e=E[it[0]];return `<p><b>${e.n}</b> ${dose(it)}${e.nk?' (neck days)':''}<br><span class=cue>${e.c}</span></p>`}).join('')}</details>`).join('')}

function sett(){const r=st.rem;return `<h1>Settings</h1>
<section class=card><h2>Level</h2><select data-f=level aria-label="Level">${Array.from({length:12},(_,i)=>`<option value=${i+1}${i+1==st.level?' selected':''}>Level ${i+1}</option>`).join('')}</select><h2 style="margin-top:.8rem">Daily water goal</h2><input type=number min=1 max=20 value=${st.goal} data-f=goal aria-label="Glasses per day"> glasses</section>
<section class=card><h2>Reminders</h2><ol class=steps><li>Install the free <b>ntfy</b> app from the Play Store.</li><li>Subscribe to this topic: <code>${st.topic}</code> <button class=btn data-a=copy>Copy</button></li><li>Tap Send test.</li></ol>
<label><input type=checkbox data-f=w ${r.w?'checked':''}> Water every <input type=number min=1 max=6 value=${r.wi} data-f=wi aria-label="Hours between reminders"> h, from <input type=number min=0 max=23 value=${r.ws} data-f=ws aria-label="Start hour"> to <input type=number min=0 max=23 value=${r.we} data-f=we aria-label="End hour"></label>
<label><input type=checkbox data-f=x ${r.x?'checked':''}> Workout, Monday to Friday at <input type=time value=${r.wt} data-f=wt aria-label="Workout time"></label>
<button class=btn data-a=test>Send test</button>
<p class=note>Reminders are queued up to 3 days ahead each time you open the app, so open it at least every 3 days. Changed times apply to days not queued yet. They go out at top priority, which can ring through Do Not Disturb if you allow it for ntfy in Android settings.</p></section>
<button class="btn danger" data-a=reset>Reset all data</button>`}

function render(){$('#app').innerHTML=tab=='today'?today():tab=='plan'?plan():sett();document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t==tab))}

function bar(){const b=$('#tb');b.hidden=!tm;if(tm)b.innerHTML=`<span>${tm.l}</span><b>${tm.left}s</b><button data-a=skip>Skip</button>`}
function timer(l,s,end){if(tm)clearInterval(tm.id);tm={l,left:s,end};tm.id=setInterval(()=>{tm.left--;bar();if(tm&&tm.left<=0){clearInterval(tm.id);navigator.vibrate&&navigator.vibrate([200,100,200]);const f=tm.end;tm=null;bar();f&&f()}},1000);bar()}

const pub=o=>fetch('https://ntfy.sh/',{method:'POST',body:JSON.stringify(Object.assign({topic:st.topic,priority:5},o))});
async function sync(){const r=st.rem,now=Date.now(),lim=now+71*36e5,step=Math.max(1,r.wi|0),jobs=[];
for(let k=0;k<3;k++){const d=new Date();d.setDate(d.getDate()+k);const ds=td(d),w=d.getDay();
if(r.w)for(let h=+r.ws;h<=+r.we;h+=step)jobs.push([ds,h,0,'w','Drink water','Have a glass of water now.','droplet']);
if(r.x&&w>0&&w<6){const[H,M]=r.wt.split(':');jobs.push([ds,+H,+M,'x','Time to train','Your session is short. Start now.','muscle'])}}
for(const[ds,h,m,t,title,message,tag]of jobs){const key=ds+'-'+h+':'+m+t,at=new Date(`${ds}T${pad(h)}:${pad(m)}:00`).getTime();
if(at<now+3e4||at>lim||st.sched[key])continue;
try{const x=await pub({title,message,tags:[tag],delay:String(Math.floor(at/1000))});if(x.ok)st.sched[key]=1}catch(e){break}}
for(const k in st.sched)if(k.slice(0,10)<td())delete st.sched[k];save()}

document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,k=b.dataset.k,t=td(),lg=st.log[t]=st.log[t]||{s:{},ok:0};
if(a=='tab')tab=b.dataset.t;
else if(a=='skip'){if(tm){clearInterval(tm.id);tm=null;bar()}return}
else if(a=='set'){const i=+b.dataset.i,c=lg.s[k]||0,s=items().find(x=>x[0]==k)[1];lg.s[k]=i<c?i:i+1;if(lg.s[k]>c&&lg.s[k]<s)timer('Rest',rest())}
else if(a=='hold')timer(E[k].n,+b.dataset.s,()=>{const s=items().find(x=>x[0]==k)[1];lg.s[k]=Math.min(s,(lg.s[k]||0)+1);save();render()});
else if(a=='ok')lg.ok=lg.ok?0:1;
else if(a=='w')st.water[t]=Math.max(0,(st.water[t]||0)+ +b.dataset.d);
else if(a=='lvl'){const v=b.dataset.v;st.level=Math.max(1,st.level+(v=='up'?1:v=='down'?-1:0));st.lvStart=st.asked=t}
else if(a=='copy'){navigator.clipboard&&navigator.clipboard.writeText(st.topic);return}
else if(a=='test'){pub({title:'Test reminder',message:'Reminders are working.',tags:['white_check_mark']}).then(r=>alert(r.ok?'Sent. Check the ntfy app.':'ntfy rejected the test.')).catch(()=>alert('Could not reach ntfy. Check your connection.'));return}
else if(a=='reset'){if(confirm('Erase all progress and settings?')){localStorage.removeItem('ss');location.reload()}return}
save();render()});

document.addEventListener('change',e=>{const f=e.target.dataset.f;if(!f)return;const v=e.target.type=='checkbox'?+e.target.checked:e.target.value;
if(f=='goal')st.goal=Math.max(1,+v||8);else if(f=='level'){st.level=+v;st.lvStart=td()}else st.rem[f]=f=='wt'?v:+v;
save();if(f=='level'||f=='goal')render();else sync()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});

render();sync();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
