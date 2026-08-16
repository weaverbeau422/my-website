const KEY="forgeWorkoutData";
const defaultExercises=[
["Barbell Bench Press","Chest"],["Incline Dumbbell Press","Chest"],["Overhead Press","Shoulders"],
["Pull-Up","Back"],["Barbell Row","Back"],["Lat Pulldown","Back"],["Squat","Legs"],
["Romanian Deadlift","Legs"],["Leg Press","Legs"],["Leg Curl","Legs"],["Biceps Curl","Arms"],["Triceps Pushdown","Arms"]
];
let data=JSON.parse(localStorage.getItem(KEY)||'null')||{workouts:[],exercises:defaultExercises.map(x=>({name:x[0],muscle:x[1]}))};
let timer=90,timerInterval=null;
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function fmtDate(d){return new Date(d+"T12:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}
function navigate(page){
  $$(".page").forEach(p=>p.classList.remove("active"));$("#"+page).classList.add("active");
  $$(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const names={dashboard:"Dashboard",workout:"Log Workout",history:"History",exercises:"Exercises"};$("#pageTitle").textContent=names[page];
  if(page==="dashboard")renderDashboard();if(page==="history")renderHistory();if(page==="exercises")renderExercises();
}
$$(".nav-btn").forEach(b=>b.onclick=()=>navigate(b.dataset.page));
$$("[data-page-jump]").forEach(b=>b.onclick=()=>navigate(b.dataset.pageJump));
$("#quickWorkout").onclick=()=>navigate("workout");
$("#dateLabel").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
$("#workoutDate").value=new Date().toISOString().slice(0,10);

function addSetRow(set={}){
 const row=document.createElement("div");row.className="set-row";
 row.innerHTML=`<label>Exercise<select class="exercise">${data.exercises.map(e=>`<option>${e.name}</option>`).join("")}</select></label>
 <label>Weight<input class="weight" type="number" min="0" step="0.5" placeholder="lb" value="${set.weight||""}"></label>
 <label>Reps<input class="reps" type="number" min="1" step="1" placeholder="0" value="${set.reps||""}"></label>
 <label class="rpe">RPE<input class="rpeval" type="number" min="1" max="10" step=".5" placeholder="—" value="${set.rpe||""}"></label>
 <button class="remove-set" title="Remove">×</button>`;
 $("#setRows").appendChild(row);if(set.exercise)row.querySelector(".exercise").value=set.exercise;
 row.querySelector(".remove-set").onclick=()=>row.remove();
}
$("#addSet").onclick=()=>addSetRow();
addSetRow();
$("#saveWorkout").onclick=()=>{
 const rows=[...document.querySelectorAll(".set-row")].map(r=>({exercise:r.querySelector(".exercise").value,weight:+r.querySelector(".weight").value,reps:+r.querySelector(".reps").value,rpe:r.querySelector(".rpeval").value?+r.querySelector(".rpeval").value:null})).filter(s=>s.exercise&&s.weight>=0&&s.reps>0);
 if(!rows.length){toast("Add at least one valid set");return}
 data.workouts.unshift({id:Date.now(),name:$("#workoutName").value.trim()||"Workout",date:$("#workoutDate").value,sets:rows});
 save();toast("Workout saved ✓");$("#workoutName").value="";$("#setRows").innerHTML="";addSetRow();navigate("dashboard");
};
function getPRs(){
 const best={};data.workouts.forEach(w=>w.sets.forEach(s=>{const est=s.weight*(1+s.reps/30);if(!best[s.exercise]||est>best[s.exercise].est)best[s.exercise]={...s,est}}));return best;
}
function renderDashboard(){
 const all=data.workouts.flatMap(w=>w.sets), prs=getPRs(), now=new Date(), week=new Date(now);week.setDate(now.getDate()-6);
 const weekN=data.workouts.filter(w=>new Date(w.date+"T23:59:59")>=week).length;
 $("#weekCount").textContent=weekN;$("#totalWorkouts").textContent=data.workouts.length;$("#totalSets").textContent=all.length;
 $("#totalVolume").textContent=Math.round(all.reduce((a,s)=>a+s.weight*s.reps,0)).toLocaleString();$("#prCount").textContent=Object.keys(prs).length;
 $("#recentWorkouts").innerHTML=data.workouts.slice(0,5).map(w=>`<div class="list-item"><div><div class="list-title">${esc(w.name)}</div><div class="list-sub">${fmtDate(w.date)} · ${w.sets.length} sets</div></div><span class="value">${Math.round(w.sets.reduce((a,s)=>a+s.weight*s.reps,0)).toLocaleString()}</span></div>`).join("")||empty("No workouts yet. Start your first one.");
 $("#prList").innerHTML=Object.entries(prs).slice(0,6).map(([name,s])=>`<div class="list-item"><div><div class="list-title">${esc(name)}</div><div class="list-sub">Best logged set</div></div><span class="value">${s.weight} × ${s.reps}</span></div>`).join("")||empty("Your best sets will appear here.");
}
function empty(t){return `<div class="muted" style="padding:20px 0">${t}</div>`}
function renderHistory(){
 const q=$("#historySearch").value.toLowerCase();
 const ws=data.workouts.filter(w=>w.name.toLowerCase().includes(q)||w.sets.some(s=>s.exercise.toLowerCase().includes(q)));
 $("#historyList").innerHTML=ws.map(w=>`<div class="history-card"><div><h4>${esc(w.name)}</h4><p>${fmtDate(w.date)} · ${w.sets.length} sets · ${Math.round(w.sets.reduce((a,s)=>a+s.weight*s.reps,0)).toLocaleString()} lb volume</p><p style="margin-top:8px">${w.sets.map(s=>`${esc(s.exercise)} ${s.weight}×${s.reps}`).join(" · ")}</p></div><div class="history-actions"><button onclick="deleteWorkout(${w.id})">Delete</button></div></div>`).join("")||empty("No matching workouts.");
}
function deleteWorkout(id){if(confirm("Delete this workout?")){data.workouts=data.workouts.filter(w=>w.id!==id);save();renderHistory();renderDashboard();toast("Workout deleted")}}
$("#historySearch").oninput=renderHistory;
function renderExercises(){$("#exerciseGrid").innerHTML=data.exercises.map((e,i)=>`<div class="exercise-card"><strong>${esc(e.name)}</strong><small>${esc(e.muscle)}</small></div>`).join("")}
$("#addExerciseBtn").onclick=()=>$("#exerciseModal").classList.remove("hidden");
$("#closeModal").onclick=()=>$("#exerciseModal").classList.add("hidden");
$("#saveExercise").onclick=()=>{const name=$("#newExercise").value.trim();if(!name)return;data.exercises.push({name,muscle:$("#newMuscle").value});save();$("#newExercise").value="";$("#exerciseModal").classList.add("hidden");renderExercises();toast("Exercise added ✓")};
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function updateTimer(){const m=String(Math.floor(timer/60)).padStart(2,"0"),s=String(timer%60).padStart(2,"0");$("#timerDisplay").textContent=`${m}:${s}`;if(timer<=0){clearInterval(timerInterval);timerInterval=null;toast("Rest timer complete")}}
$("#timerStart").onclick=()=>{if(timerInterval)return;timerInterval=setInterval(()=>{timer--;updateTimer();if(timer<=0)timer=90},1000)};
$("#timerReset").onclick=()=>{clearInterval(timerInterval);timerInterval=null;timer=90;updateTimer()};
$("#timerBtn").onclick=()=>{$("#timerBox").scrollIntoView({behavior:"smooth",block:"center"})};
$("#exportBtn").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download="forge-workout-backup.json";a.click();toast("Backup exported")};
$("#importBtn").onclick=()=>$("#importFile").click();
$("#importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{data=JSON.parse(r.result);save();renderDashboard();toast("Data imported ✓")}catch{toast("Invalid backup file")}};r.readAsText(f)};
$("#resetBtn").onclick=()=>{if(confirm("Delete all workout data? This cannot be undone.")){localStorage.removeItem(KEY);location.reload()}};
renderDashboard();updateTimer();
