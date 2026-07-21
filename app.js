const LEVELS = [
  {level:1,month:1,title:"Read & Sound",cefr:"Foundation / Pre-A1",color:"#ff6f91",icon:"📖",focus:"Reading aloud, foundational sounds, and confidence",minutes:180,sessions:10,activities:8,score:55,tasks:["Read at least 8 Read Along stories","Practise reading aloud three days per week","Record 30 new vocabulary words","Record a one-minute reading sample as evidence"],links:[["Read Along","https://readalong.google.com/"],["A1–A2 Vocabulary","https://learnenglishteens.britishcouncil.org/vocabulary/a1-a2-vocabulary"]]},
  {level:2,month:2,title:"Listen & Repeat",cefr:"A1",color:"#ffad42",icon:"🎧",focus:"Listening to slow English, identifying key words, and repeating sentences",minutes:240,sessions:12,activities:10,score:60,tasks:["Complete at least 10 ELLO A1 lessons","Listen to each lesson at least twice","Complete the quiz after listening","Repeat five sentences from each lesson"],links:[["ELLO A1","https://elllo.org/levels/A1-English-Lessons/index.html"],["Read Along","https://readalong.google.com/"]]},
  {level:3,month:3,title:"Everyday English",cefr:"A2",color:"#2fc6a1",icon:"💬",focus:"Everyday English, vocabulary, and basic grammar",minutes:300,sessions:14,activities:12,score:65,tasks:["Complete at least 8 ELLO A2 lessons","Complete 4 grammar or vocabulary lessons","Write a 3–5 sentence summary each week","Speak about daily routines for 1–2 minutes"],links:[["ELLO A2","https://elllo.org/levels/A2-English-Lessons/index.html"],["A1–A2 Grammar","https://learnenglishteens.britishcouncil.org/grammar/a1-a2-grammar"]]},
  {level:4,month:4,title:"Connected Skills",cefr:"B1",color:"#4d8df7",icon:"🧩",focus:"Connecting listening, reading, speaking, and writing",minutes:360,sessions:14,activities:12,score:70,tasks:["Complete at least 8 ELLO B1 lessons","Complete 4 listening or reading lessons","Write two paragraphs of 80–100 words","Summarize what you hear in your own words"],links:[["ELLO B1","https://elllo.org/levels/B1-English-Lessons/index.html"],["British Council Skills","https://learnenglishteens.britishcouncil.org/skills"]]},
  {level:5,month:5,title:"Independent English",cefr:"B2 Challenge",color:"#8367ee",icon:"🚀",focus:"Independent learning through natural conversations and longer content",minutes:420,sessions:16,activities:14,score:70,tasks:["Complete at least 8 ELLO B2 lessons","Complete 4 B1–B2 grammar lessons","Keep an error log based on your mistakes","Express an opinion for 2–3 minutes"],links:[["ELLO B2","https://elllo.org/levels/B2-English-Lessons/index.html"],["B1–B2 Grammar","https://learnenglishteens.britishcouncil.org/grammar/b1-b2-grammar"]]},
  {level:6,month:6,title:"English Showcase",cefr:"C1 Exposure / Project",color:"#ed5da8",icon:"🏆",focus:"Applying English through projects and presentations",minutes:480,sessions:16,activities:14,score:75,tasks:["Choose at least 6 ELLO C1 lessons","Complete 6 British Council activities","Create a video, podcast, or presentation","Write a 150–200 word reflection"],links:[["ELLO C1","https://elllo.org/levels/C1-English-Lessons/index.html"],["LearnEnglish Teens","https://learnenglishteens.britishcouncil.org/"]]}
];

const SOURCES = [
  {name:"Read Along by Google",short:"Read Along",icon:"📚",color:"#ff6f91",url:"https://readalong.google.com/",description:"Practise reading aloud with illustrated stories, audio support, and in-reading guidance.",best:"Level 1–4 · Reading aloud · Pronunciation"},
  {name:"ELLO",short:"ELLO",icon:"🎧",color:"#4d8df7",url:"https://elllo.org/levels/",description:"Free listening lessons from A1 to C1 with video, audio, and activities.",best:"Level 1–6 · Listening · Vocabulary"},
  {name:"British Council LearnEnglish Teens",short:"LearnEnglish Teens",icon:"🇬🇧",color:"#8367ee",url:"https://learnenglishteens.britishcouncil.org/",description:"Practise listening, reading, writing, speaking, grammar, vocabulary, and exam skills.",best:"Level 1–6 · Integrated skills"}
];

const SKILLS = ["Listening","Speaking","Reading","Writing","Vocabulary","Grammar"];
const SKILL_ICONS = {Listening:"🎧",Speaking:"🗣️",Reading:"📖",Writing:"✍️",Vocabulary:"🧠",Grammar:"🧩"};

const CFG = window.APP_CONFIG || {};
const API_READY = Boolean(CFG.API_URL && CFG.API_URL.startsWith("https://script.google.com/"));
const $ = id => document.getElementById(id);
let state = {profile:null,logs:[],teacher:null,classInfo:{announcement:"",weeklyGoal:0,updatedAt:""},studentDetail:null,assignments:[],submissions:[],assessments:[]};
let charts = {};
let teacherTokenCache = sessionStorage.getItem("english6_teacherToken") || "";
let teacherClientId = localStorage.getItem("english6_teacherClientId") || crypto.randomUUID();
localStorage.setItem("english6_teacherClientId",teacherClientId);
let teacherAutoRefresh = null;
let deferredInstallPrompt = null;

const key = name => `english6_${name}`;

window.addEventListener("DOMContentLoaded", init);

async function init(){
  applyTheme(localStorage.getItem(key("theme")) || "light", false);
  initPwa();
  initAccessibility();
  $("appTitle").textContent = CFG.APP_TITLE || "English 6-Level Learning Journey";
  $("schoolName").textContent = CFG.SCHOOL_NAME || "Student progress dashboard";
  $("todayText").textContent = new Intl.DateTimeFormat("en-GB",{dateStyle:"long"}).format(new Date());
  $("modeBadge").textContent = API_READY ? "☁ Shared database connected" : "💻 Demo mode on this device";
  $("setupBanner").classList.toggle("show", !API_READY);
  populateSelects();
  document.querySelector('#logForm [name="date"]').value = todayISO();
  await loadStudent();
  renderSources();
  renderRoadmap();
  if(!state.profile) openProfile();
}

function populateSelects(){
  const options = LEVELS.map(l=>`<option value="${l.level}">Level ${l.level} · ${l.title}</option>`).join("");
  $("logLevel").innerHTML = options;
  $("profileLevel").innerHTML = options;
}

function persistLocal(){
  localStorage.setItem(key("profile"),JSON.stringify(state.profile));
  localStorage.setItem(key("logs"),JSON.stringify(state.logs));
}

async function loadStudent(){
  state.profile = JSON.parse(localStorage.getItem(key("profile")) || "null");
  state.logs = JSON.parse(localStorage.getItem(key("logs")) || "[]");
  state.classInfo = JSON.parse(localStorage.getItem(key("classInfo")) || "null") || state.classInfo;
  state.assignments = JSON.parse(localStorage.getItem(key("assignments")) || "[]");
  state.submissions = JSON.parse(localStorage.getItem(key("submissions")) || "[]");
  state.assessments = JSON.parse(localStorage.getItem(key("assessments")) || "[]");
  if(API_READY && state.profile?.studentKey){
    try{
      const data = await api("studentData",{studentKey:state.profile.studentKey,classCode:CFG.CLASS_CODE});
      if(data.ok){
        state.profile = data.profile;
        state.logs = data.logs || [];
        state.classInfo = data.classInfo || state.classInfo;
        state.assignments = data.assignments || [];
        state.submissions = data.submissions || [];
        state.assessments = data.assessments || [];
        localStorage.setItem(key("classInfo"),JSON.stringify(state.classInfo));
        localStorage.setItem(key("assignments"),JSON.stringify(state.assignments));
        localStorage.setItem(key("submissions"),JSON.stringify(state.submissions));
        localStorage.setItem(key("assessments"),JSON.stringify(state.assessments));
        persistLocal();
      }
    }catch(error){
      toast("Could not load the shared database. Using local data instead.");
    }
  }
  renderStudent();
}

function showPage(id){
  document.querySelectorAll(".page").forEach(page=>page.classList.toggle("active",page.id===id));
  document.querySelectorAll(".nav-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.page===id));
  if(id==="teacher"&&teacherTokenCache&&!state.teacher)refreshTeacher(true);
  window.scrollTo({top:0,behavior:"smooth"});
}

function metrics(){
  const logs = state.logs;
  const minutes = sum(logs,l=>num(l.Minutes ?? l.minutes));
  const activities = sum(logs,l=>num(l.Completed ?? l.completed));
  const scores = logs.map(l=>num(l.Score ?? l.score)).filter(score=>score>0);
  const confidences = logs.map(l=>num(l.Confidence ?? l.confidence)).filter(value=>value>0);
  const avgScore = scores.length ? sum(scores,x=>x)/scores.length : 0;
  const avgConfidence = confidences.length ? sum(confidences,x=>x)/confidences.length : 0;
  const currentLevel = Math.min(6,Math.max(1,...logs.map(l=>num(l.Level ?? l.level)),num(state.profile?.currentLevel || 1)));
  const levelProgress = LEVELS.map(level=>levelProgressOf(level,logs));
  const week = currentWeekData(logs);
  const streak = studyStreak(logs);
  const weeklyGoal = num(state.classInfo?.weeklyGoal) || Math.max(60,Math.round((LEVELS[currentLevel-1]?.minutes || 240)/4));
  const activeDays = uniqueStudyDays(logs).length;
  const sourceUsage = groupSource(logs);
  const sourceCount = Object.values(sourceUsage).filter(value=>value>0).length;
  return {minutes,activities,avgScore,avgConfidence,currentLevel,levelProgress,overallProgress:sum(levelProgress,x=>x)/LEVELS.length,week,streak,weeklyGoal,activeDays,sourceUsage,sourceCount};
}

function levelProgressOf(level,logs){
  const rows = logs.filter(item=>num(item.Level ?? item.level)===level.level);
  const minutes = sum(rows,item=>num(item.Minutes ?? item.minutes));
  const activities = sum(rows,item=>num(item.Completed ?? item.completed));
  const scores = rows.map(item=>num(item.Score ?? item.score)).filter(score=>score>0);
  const avg = scores.length ? sum(scores,x=>x)/scores.length : 0;
  const parts = [Math.min(1,minutes/level.minutes),Math.min(1,rows.length/level.sessions),Math.min(1,activities/level.activities)];
  if(scores.length) parts.push(Math.min(1,avg/level.score));
  return sum(parts,x=>x)/parts.length;
}

function renderStudent(){
  const profile = state.profile;
  const m = metrics();
  $("welcomeText").textContent = profile ? `Hello, ${profile.name.split(" ")[0]}! 👋` : "Welcome, learner! 👋";
  const cards = [
    ["This Week",m.week.minutes,"minutes",Math.min(1,m.week.minutes/m.weeklyGoal),"#dce9ff"],
    ["Study Streak",m.streak,"days",Math.min(1,m.streak/7),"#fff0d8"],
    ["Study Days",m.activeDays,"days",Math.min(1,m.activeDays/30),"#d9f7ed"],
    ["Activities Completed",m.activities,"activities",Math.min(1,m.activities/70),"#e9dcff"],
    ["Average Score",m.avgScore.toFixed(1),"%",m.avgScore/100,"#d9f7ed"],
    ["Current Level",`Level ${m.currentLevel}`,LEVELS[m.currentLevel-1]?.title || "",m.overallProgress,"#ffe7ee"]
  ];
  $("studentMetrics").innerHTML = cards.map(card=>`<div class="card metric" style="--accent:${card[4]}"><div class="metric-label">${card[0]}</div><div class="metric-value">${card[1]}</div><div class="metric-sub">${card[2]}</div><div class="progress"><span style="width:${Math.max(0,Math.min(100,Math.round(card[3]*100)))}%"></span></div></div>`).join("");
  $("levelStrip").innerHTML = LEVELS.map((level,index)=>{
    const progress = m.levelProgress[index];
    const className = progress>=.95 ? "done active" : level.level===m.currentLevel ? "active" : "";
    return `<div class="level-pill ${className}" style="--level-color:${level.color}">L${level.level}<br>${level.title}<div class="level-percent">${Math.round(progress*100)}%</div></div>`;
  }).join("");
  renderClassAnnouncement();
  renderCurrentAssignment();
  renderAssignments();
  renderSkills();
  renderStudentCharts();
  renderRecent();
  renderHeatmap();
  renderAchievements(m);
  $("nextAction").textContent = getNextAction(m);
  $("weeklyGoalBox").innerHTML = `<div class="weekly-goal-line"><span>Weekly Goal</span><span>${m.week.minutes}/${m.weeklyGoal} minutes</span></div><div class="progress"><span style="width:${Math.min(100,Math.round(m.week.minutes/m.weeklyGoal*100))}%"></span></div><div class="weekly-goal-detail">${m.week.sessions} sessions · ${m.week.activities} activities · ${m.week.minutes>=m.weeklyGoal?"Goal achieved 🎉":"Remaining: "+Math.max(0,m.weeklyGoal-m.week.minutes)+" minutes"}</div>`;
  renderRoadmap();
}

function renderStudentCharts(){
  const weekly = buildWeekly(state.logs,12);
  const goal = metrics().weeklyGoal;
  setChart("studentWeeklyChart","bar",{
    labels:weekly.map(item=>item.label),
    datasets:[
      {label:"Study Minutes",data:weekly.map(item=>item.minutes),backgroundColor:"#4d8df7",borderRadius:8},
      {type:"line",label:"Goal",data:weekly.map(()=>goal),borderColor:"#ffad42",borderDash:[6,5],pointRadius:0,tension:0}
    ]
  },{plugins:{title:{display:true,text:"Weekly Study Time"}},scales:{y:{beginAtZero:true}}});
  const sources = groupSource(state.logs);
  setChart("studentSourceChart","doughnut",{
    labels:Object.keys(sources),
    datasets:[{data:Object.values(sources),backgroundColor:["#ff6f91","#4d8df7","#8367ee"],borderWidth:0}]
  },{plugins:{title:{display:true,text:"Use of the Three Websites"},legend:{position:"bottom"}}});
}

function renderRecent(){
  const rows=[...state.logs].sort((a,b)=>String(b.Date??b.date).localeCompare(String(a.Date??a.date))).slice(0,10);
  $("recentTable").innerHTML=rows.length?rows.map(log=>`<tr><td>${fmtDate(log.Date??log.date)}</td><td><span class="badge badge-purple">L${log.Level??log.level}</span></td><td>${esc(displaySource(log.Source??log.source))}</td><td>${esc(log.Activity??log.activity)}</td><td>${num(log.Minutes??log.minutes)} minutes</td><td>${(log.Score??log.score)||"-"}</td></tr>`).join(""):`<tr><td colspan="6" class="empty">No data yet</td></tr>`;
  const history=[...state.logs].sort((a,b)=>String(b.Date??b.date).localeCompare(String(a.Date??a.date))||String(b.CreatedAt??b.createdAt??"").localeCompare(String(a.CreatedAt??a.createdAt??"")));
  $("myLogTable").innerHTML=history.length?history.map(log=>{
    const id=log.LogId??log.logId??"",localId=id||log._localId||"";
    const actions=localId?`<div class="table-actions"><button class="btn-xs btn-edit" onclick="editLog('${escAttr(localId)}')">Edit</button><button class="btn-xs btn-delete" onclick="deleteLog('${escAttr(localId)}')">Delete</button></div>`:`<small>Legacy Entry</small>`;
    const verify=verificationLabel(log.VerificationStatus??log.verificationStatus);
    return `<tr><td>${fmtDate(log.Date??log.date)}</td><td>L${log.Level??log.level}</td><td>${esc((log.Skill??log.skill)||"Not set")}</td><td>${esc(displaySource(log.Source??log.source))}</td><td>${esc(log.Activity??log.activity)}</td><td>${num(log.Minutes??log.minutes)}</td><td>${(log.Score??log.score)||"-"}</td><td>${verify}</td><td>${esc((log.Reflection??log.reflection)||"")}</td><td>${actions}</td></tr>`;
  }).join(""):`<tr><td colspan="10" class="empty">No data yet</td></tr>`;
}

function renderSources(){
  $("sourceCards").innerHTML = SOURCES.map(source=>`<article class="card source-card" style="--source:${source.color};--soft:${source.color}20"><div class="source-icon">${source.icon}</div><h4>${source.name}</h4><p>${source.description}</p><div class="best">${source.best}</div><a href="${source.url}" target="_blank" rel="noopener">Open Website →</a></article>`).join("");
}

function renderRoadmap(){
  $("roadmapGrid").innerHTML = LEVELS.map(level=>{
    const progress = state.logs.length ? levelProgressOf(level,state.logs) : 0;
    return `<article class="level-card" style="--level-color:${level.color}"><div class="level-head"><div class="level-num"><div class="level-circle">${level.icon}</div><div><b>Month ${level.month} · Level ${level.level}</b><div class="cefr-label">${level.cefr}</div></div></div><span class="badge ${progress>=.95?"badge-green":progress>=.5?"badge-orange":"badge-blue"}">${Math.round(progress*100)}%</span></div><h4>${level.title}</h4><p><b>Focus:</b> ${level.focus}</p><p><b>Target:</b> ${level.minutes} minutes · ${level.sessions} sessions · ${level.activities} activities · score ${level.score}%</p><ul class="task-list">${level.tasks.map(task=>`<li>${task}</li>`).join("")}</ul><div class="level-links">${level.links.map(link=>`<a href="${link[1]}" target="_blank" rel="noopener">${link[0]} ↗</a>`).join("")}</div><div class="progress"><span style="width:${Math.round(progress*100)}%;background:${level.color}"></span></div></article>`;
  }).join("");
}

function renderHeatmap(){
  const days = 112;
  const totals = {};
  state.logs.forEach(log=>{
    const date = String(log.Date ?? log.date ?? "").slice(0,10);
    if(date) totals[date] = (totals[date] || 0) + num(log.Minutes ?? log.minutes);
  });
  const cells = [];
  const start = new Date();
  start.setHours(0,0,0,0);
  start.setDate(start.getDate()-(days-1));
  for(let i=0;i<days;i++){
    const date = new Date(start);
    date.setDate(start.getDate()+i);
    const iso = localISO(date);
    const minutes = totals[iso] || 0;
    const level = minutes===0 ? 0 : minutes<20 ? 1 : minutes<40 ? 2 : minutes<60 ? 3 : 4;
    const label = new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric"}).format(date);
    cells.push(`<span class="heat-cell heat-${level}" title="${label}: ${minutes} minutes" aria-label="${label}: ${minutes} minutes"></span>`);
  }
  $("learningHeatmap").innerHTML = cells.join("");
}

function achievementDefinitions(m){
  return [
    {icon:"🌱",title:"First Step",detail:"Log your first activity",ok:state.logs.length>=1},
    {icon:"⏱️",title:"One Hour",detail:"Study for a total of 60 minutes",ok:m.minutes>=60},
    {icon:"🔥",title:"3-Day Streak",detail:"Study for three consecutive days",ok:m.streak>=3},
    {icon:"🧭",title:"Explorer",detail:"Use all three websites",ok:m.sourceCount>=3},
    {icon:"✅",title:"Ten Tasks",detail:"Complete 10 activities",ok:m.activities>=10},
    {icon:"🎯",title:"Strong Score",detail:"Reach an average score of at least 80%",ok:m.avgScore>=80},
    {icon:"💪",title:"Five Hours",detail:"Study for a total of 300 minutes",ok:m.minutes>=300},
    {icon:"🏆",title:"Level Master",detail:"Reach 95% progress in any level",ok:m.levelProgress.some(value=>value>=.95)}
  ];
}

function renderAchievements(m){
  const badges = achievementDefinitions(m);
  const unlocked = badges.filter(item=>item.ok).length;
  $("badgeCount").textContent = `${unlocked}/${badges.length}`;
  $("achievementGrid").innerHTML = badges.map(item=>`<div class="achievement ${item.ok?"unlocked":"locked"}"><span class="achievement-icon">${item.ok?item.icon:"🔒"}</span><div><strong>${item.title}</strong><small>${item.detail}</small></div></div>`).join("");
}

async function saveProfile(event){
  event.preventDefault();
  const form = Object.fromEntries(new FormData(event.target).entries());
  form.classCode = form.classCode || CFG.CLASS_CODE;
  try{
    if(API_READY){
      const data = await api("registerStudent",form);
      if(!data.ok) throw Error(data.error);
      state.profile = data.profile;
    }else{
      state.profile = {...form,studentKey:state.profile?.studentKey || crypto.randomUUID()};
    }
    persistLocal();
    closeProfile();
    renderStudent();
    toast("Profile saved.");
  }catch(error){toast(error.message)}
}

async function submitLog(event){
  event.preventDefault();
  if(!state.profile){openProfile();return;}
  const log = Object.fromEntries(new FormData(event.target).entries());
  log.studentKey = state.profile.studentKey;
  log.classCode = CFG.CLASS_CODE;
  const isEditing = Boolean(log.logId);
  try{
    if(API_READY){
      const data = await api(isEditing?"updateLog":"submitLog",log);
      if(!data.ok) throw Error(data.error);
      await loadStudent();
    }else if(isEditing){
      const index = state.logs.findIndex(item=>(item.LogId ?? item.logId ?? item._localId)===log.logId);
      if(index<0) throw Error("The entry to edit was not found.");
      state.logs[index] = {...state.logs[index],...log,LogId:log.logId,_localId:log.logId};
      persistLocal();renderStudent();
    }else{
      const localId = crypto.randomUUID();
      state.logs.push({...log,LogId:localId,_localId:localId,createdAt:new Date().toISOString()});
      persistLocal();renderStudent();
    }
    toast(isEditing?"Learning log updated.":"Learning log saved.");
    cancelEditLog();
    showPage("dashboard");
  }catch(error){toast(error.message)}
}

async function teacherLoginHandler(event){
  event.preventDefault();
  const pin=$("teacherPin").value;
  if(API_READY){
    try{
      const login=await api("teacherLogin",{pin,classCode:CFG.CLASS_CODE,clientId:teacherClientId});
      if(!login.ok)throw Error(login.error);
      teacherTokenCache=login.token;sessionStorage.setItem("english6_teacherToken",teacherTokenCache);$("teacherPin").value="";
      await refreshTeacher();
      if(!teacherAutoRefresh)teacherAutoRefresh=setInterval(()=>{if(teacherTokenCache)refreshTeacher(true)},300000);
    }catch(error){toast(error.message)}
  }else{
    teacherTokenCache="demo";state.teacher=localTeacher();$("teacherLogin").classList.add("hidden");$("teacherLayout").classList.add("active");renderTeacher();toast("Demo mode: showing data stored on this device.");
  }
}

async function refreshTeacher(silent=false){
  try{
    if(!teacherTokenCache)throw Error("Your teacher session has expired. Please sign in again.");
    const data=API_READY?await api("teacherData",{token:teacherTokenCache,classCode:CFG.CLASS_CODE}):localTeacher();
    if(!data.ok&&API_READY)throw Error(data.error);
    state.teacher=data;state.classInfo=data.classInfo||state.classInfo;state.assignments=data.assignments||state.assignments;
    $("teacherLogin").classList.add("hidden");$("teacherLayout").classList.add("active");populateClasses();renderTeacher();
    if(!silent)toast("Class data updated.");
  }catch(error){if(String(error.message).toLowerCase().includes("session")){teacherLogout(false)}toast(error.message)}
}

function localTeacher(){
  const m = metrics();
  const lastActive = state.logs.length ? String(state.logs.map(log=>log.Date ?? log.date).sort().at(-1) || "") : "";
  return {
    students:state.profile ? [{studentKey:state.profile.studentKey,studentId:state.profile.studentId,name:state.profile.name,className:state.profile.className,currentLevel:m.currentLevel,minutes:m.minutes,activities:m.activities,avgScore:m.avgScore,lastActive,weekMinutes:m.week.minutes,activeDays30:activeDaysWithin(state.logs,30),streak:m.streak,sessions30:logsWithin(state.logs,30).length,verifiedCount:state.logs.filter(log=>String(log.VerificationStatus??log.verificationStatus).toLowerCase()==="verified").length}] : [],
    weekly:buildWeekly(state.logs,12),
    sourceUsage:groupSource(state.logs),
    generatedAt:new Date().toISOString(),
    classInfo:state.classInfo,
    assignments:state.assignments,
    submissions:state.submissions,
    assessmentSummary:buildLocalAssessmentSummary()
  };
}

function populateClasses(){
  const classes = [...new Set((state.teacher.students || []).map(student=>student.className).filter(Boolean))];
  const selected = $("teacherClassFilter").value;
  $("teacherClassFilter").innerHTML = '<option value="">All Classes</option>'+classes.map(name=>`<option>${esc(name)}</option>`).join("");
  if(classes.includes(selected)) $("teacherClassFilter").value = selected;
}

function filteredTeacherStudents(){
  const selectedClass = $("teacherClassFilter").value;
  return (state.teacher?.students || []).filter(student=>!selectedClass || student.className===selectedClass);
}

function renderTeacher(){
  if(!state.teacher) return;
  const students = filteredTeacherStudents();
  const classForm = $("classInfoForm");
  if(classForm){classForm.elements.announcement.value=state.classInfo?.announcement||"";classForm.elements.weeklyGoal.value=num(state.classInfo?.weeklyGoal)||90;}
  const minutes = sum(students,student=>num(student.minutes));
  const scores = students.map(student=>num(student.avgScore)).filter(score=>score>0);
  const active = students.filter(student=>daysAgo(student.lastActive)<=7).length;
  const watch = students.filter(student=>daysAgo(student.lastActive)>7 && daysAgo(student.lastActive)<=14).length;
  const support = students.filter(student=>daysAgo(student.lastActive)>14).length;
  const avgMinutes = students.length ? Math.round(minutes/students.length) : 0;
  const weeklyActive = students.filter(student=>num(student.weekMinutes)>0).length;
  const metricsCards = [
    ["Total Students",students.length,"students","#dce9ff"],
    ["Active This Week",weeklyActive,"students","#d9f7ed"],
    ["Need Follow-up",watch+support,"students","#ffe7ee"],
    ["Average per Student",avgMinutes,"minutes","#ffe9d4"],
    ["Total Study Time",minutes,"minutes","#dce9ff"],
    ["Average Score",scores.length?(sum(scores,x=>x)/scores.length).toFixed(1):"0","%","#f0e7ff"]
  ];
  $("teacherMetrics").innerHTML = metricsCards.map(card=>`<div class="card metric" style="--accent:${card[3]}"><div class="metric-label">${card[0]}</div><div class="metric-value">${card[1]}</div><div class="metric-sub">${card[2]}</div></div>`).join("");
  $("teacherAlerts").innerHTML = `<div class="alert-card alert-active"><small>Active within 7 days</small><strong>${active}</strong><span>Continue normal monitoring.</span></div><div class="alert-card alert-watch"><small>Watch: 8–14 days</small><strong>${watch}</strong><span>Consider sending a reminder or check-in message.</span></div><div class="alert-card alert-support"><small>Needs support: more than 14 days</small><strong>${support}</strong><span>Contact the student and plan appropriate support.</span></div>`;
  $("teacherUpdatedAt").textContent = `Last updated: ${new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short"}).format(new Date())} · Auto-refreshes every 5 minutes`;
  renderTeacherCharts(students);
  renderConsistency(students);
  renderInterventions(students);
  renderTeacherTable();
  renderTeacherAssignments();
  renderAssessmentSummary();
}

function renderTeacherCharts(students){
  const weekly = state.teacher.weekly || [];
  setChart("teacherWeeklyChart","line",{labels:weekly.map(item=>item.label),datasets:[{label:"Total Minutes",data:weekly.map(item=>num(item.minutes)),borderColor:"#4d8df7",backgroundColor:"#4d8df722",fill:true,tension:.35}]},{plugins:{title:{display:true,text:"Weekly Class Activity"}},scales:{y:{beginAtZero:true}}});
  setChart("teacherLevelChart","bar",{labels:LEVELS.map(level=>`L${level.level}`),datasets:[{data:LEVELS.map(level=>students.filter(student=>num(student.currentLevel)===level.level).length),backgroundColor:LEVELS.map(level=>level.color),borderRadius:8}]},{plugins:{title:{display:true,text:"Students by Level"},legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0}}}});
  const sourceUsage = normalizeSourceUsage(state.teacher.sourceUsage || {});
  setChart("teacherSourceChart","doughnut",{labels:Object.keys(sourceUsage),datasets:[{data:Object.values(sourceUsage),backgroundColor:["#ff6f91","#4d8df7","#8367ee"],borderWidth:0}]},{plugins:{title:{display:true,text:"Use of the Three Websites"},legend:{position:"bottom"}}});
}

function renderConsistency(students){
  const ranked = [...students].filter(student=>num(student.activeDays30)>0).sort((a,b)=>num(b.activeDays30)-num(a.activeDays30) || num(b.streak)-num(a.streak) || num(b.weekMinutes)-num(a.weekMinutes)).slice(0,5);
  const medals = ["🥇","🥈","🥉","⭐","⭐"];
  $("consistencyList").innerHTML = ranked.length ? ranked.map((student,index)=>`<div class="rank-item"><span class="rank-medal">${medals[index]}</span><div class="rank-person"><strong>${esc(student.name)}</strong><small>${esc(student.className)} · ${num(student.activeDays30)} study days in 30 days</small></div><span class="streak-chip">🔥 ${num(student.streak)}</span></div>`).join("") : `<div class="empty compact-empty">No consistency data yet.</div>`;
}

function renderInterventions(students){
  const rows = [...students].map(student=>({...student,_days:daysAgo(student.lastActive)})).filter(student=>student._days>7).sort((a,b)=>b._days-a._days).slice(0,6);
  $("interventionList").innerHTML = rows.length ? rows.map(student=>{
    const severe = student._days>14;
    const suggestion = severe ? "Contact the student individually and help create a restart plan." : "Send a reminder and suggest a short 15-minute activity.";
    return `<div class="intervention-item ${severe?"priority-high":"priority-medium"}"><div><strong>${esc(student.name)}</strong><small>${esc(student.className)} · ${student._days>=999?"No learning logs yet":`No log for ${student._days} days`}</small><p>${suggestion}</p></div><span class="badge ${severe?"badge-red":"badge-orange"}">${severe?"High Priority":"Follow Up"}</span></div>`;
  }).join("") : `<div class="empty compact-empty">Excellent. No students have been inactive for more than seven days.</div>`;
}

function renderTeacherTable(){
  if(!state.teacher) return;
  const selectedClass = $("teacherClassFilter").value;
  const query = ($("studentSearch").value || "").toLowerCase();
  const filter = $("teacherStatusFilter")?.value || "";
  const rows = (state.teacher.students || []).map(student=>({...student,_days:daysAgo(student.lastActive)}))
    .filter(student=>(!selectedClass || student.className===selectedClass) && (`${student.studentId} ${student.name}`.toLowerCase().includes(query)))
    .filter(student=>!filter || (filter==="active"&&student._days<=7) || (filter==="watch"&&student._days>7&&student._days<=14) || (filter==="support"&&student._days>14))
    .sort((a,b)=>b._days-a._days || num(a.weekMinutes)-num(b.weekMinutes));
  $("teacherStudentTable").innerHTML = rows.length ? rows.map(student=>{
    const status = student._days<=7 ? ["Active","badge-green","#2fc6a1",""] : student._days<=14 ? ["Watch","badge-orange","#ffad42","watch-row"] : ["Needs support","badge-red","#ff6f91","risk-row"];
    return `<tr class="${status[3]}"><td><button class="student-link" onclick="openStudentDetail('${escAttr(student.studentKey)}')"><b>${esc(student.name)}</b><br><small>${esc(student.studentId)}</small></button></td><td>${esc(student.className)}</td><td><span class="badge badge-purple">Level ${num(student.currentLevel)}</span></td><td>${num(student.weekMinutes)} minutes</td><td>${num(student.activeDays30)} days</td><td>${num(student.verifiedCount)} verified</td><td>${num(student.avgScore).toFixed(1)}%</td><td>${fmtDate(student.lastActive)}</td><td><div class="student-status"><span class="status-dot" style="background:${status[2]}"></span><span class="badge ${status[1]}">${status[0]}</span></div></td><td><button class="btn-xs btn-view" onclick="openStudentDetail('${escAttr(student.studentKey)}')">View Details</button></td></tr>`;
  }).join("") : `<tr><td colspan="10" class="empty">No students found.</td></tr>`;
}

function exportTeacherCsv(){
  if(!state.teacher) return;
  const header = ["Student ID","Name","Class","Current Level","Total Minutes","Week Minutes","Activities","Active Days 30","Verified Evidence","Average Score","Last Active"];
  const rows = (state.teacher.students || []).map(student=>[student.studentId,student.name,student.className,student.currentLevel,student.minutes,student.weekMinutes,student.activities,student.activeDays30,student.verifiedCount,student.avgScore,student.lastActive]);
  download('\ufeff'+[header,...rows].map(row=>row.map(csv).join(",")).join("\n"),"teacher_summary_v6.csv","text/csv;charset=utf-8");
}

function exportMyData(){download(JSON.stringify({version:6,exportedAt:new Date().toISOString(),profile:state.profile,logs:state.logs,assignments:state.assignments,submissions:state.submissions,assessments:state.assessments},null,2),"my_english_data_v6.json","application/json")}

function importMyData(event){
  const file = event.target.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      if(!data.profile || !Array.isArray(data.logs)) throw Error("Invalid backup file format.");
      state.profile = data.profile;
      state.logs = data.logs;
      state.assignments = data.assignments || []; state.submissions = data.submissions || []; state.assessments = data.assessments || [];
      localStorage.setItem(key("assignments"),JSON.stringify(state.assignments));localStorage.setItem(key("submissions"),JSON.stringify(state.submissions));localStorage.setItem(key("assessments"),JSON.stringify(state.assessments));
      persistLocal();
      renderStudent();
      toast("Data imported successfully.");
    }catch(error){toast(error.message || "Could not import data.")}
    finally{event.target.value=""}
  };
  reader.readAsText(file);
}

function openProfile(){
  const form = $("profileForm");
  const profile = state.profile || {};
  ["studentId","name","className","currentLevel","classCode"].forEach(field=>form.elements[field].value=profile[field] || (field==="classCode"?CFG.CLASS_CODE:""));
  openModal("profileModal");
}
function closeProfile(){closeModal("profileModal")}


function renderClassAnnouncement(){
  const box = $("classAnnouncement");
  if(!box) return;
  const text = String(state.classInfo?.announcement || "").trim();
  box.classList.toggle("hidden",!text);
  if(text){$("announcementText").textContent=text;$("announcementUpdated").textContent=state.classInfo?.updatedAt?`Updated ${fmtDate(state.classInfo.updatedAt)}`:"";}
}

function findLogById(id){return state.logs.find(log=>(log.LogId ?? log.logId ?? log._localId)===id)}
function editLog(id){
  const log=findLogById(id);if(!log){toast("Learning log not found.");return;}
  const form=$("logForm");
  const map={logId:id,date:log.Date??log.date,level:log.Level??log.level,source:(log.Source??log.source)==="ELLO"?"ELLLO":(log.Source??log.source),skill:log.Skill??log.skill??"",minutes:log.Minutes??log.minutes,activity:log.Activity??log.activity,completed:log.Completed??log.completed,score:log.Score??log.score,confidence:log.Confidence??log.confidence,evidence:log.Evidence??log.evidence,reflection:log.Reflection??log.reflection};
  Object.entries(map).forEach(([name,value])=>{if(form.elements[name])form.elements[name].value=value??""});
  $("logFormTitle").textContent="Edit Learning Log";$("logFormHint").textContent="Review the information, then save your changes.";$("saveLogButton").textContent="Save Changes";$("cancelEditButton").classList.remove("hidden");form.closest(".form-card").classList.add("editing-banner");showPage("log");
}
function cancelEditLog(){
  const form=$("logForm");if(!form)return;form.reset();form.elements.logId.value="";form.elements.date.value=todayISO();form.elements.minutes.value=30;form.elements.completed.value=1;if(form.elements.skill)form.elements.skill.value="";$("logFormTitle").textContent="Learning Log";$("logFormHint").textContent="Complete this after studying. It takes about one minute.";$("saveLogButton").textContent="Save Learning Log";$("cancelEditButton").classList.add("hidden");form.closest(".form-card").classList.remove("editing-banner");
}
async function deleteLog(id){
  if(!confirm("Delete this learning log?"))return;
  try{if(API_READY){const data=await api("deleteLog",{classCode:CFG.CLASS_CODE,studentKey:state.profile.studentKey,logId:id});if(!data.ok)throw Error(data.error);await loadStudent();}else{state.logs=state.logs.filter(log=>(log.LogId??log.logId??log._localId)!==id);persistLocal();renderStudent();}toast("Learning log deleted.");}catch(error){toast(error.message)}
}

async function saveClassInfo(event){
  event.preventDefault();const form=Object.fromEntries(new FormData(event.target).entries());
  try{if(API_READY){const data=await api("updateClassInfo",{...form,token:teacherTokenCache,classCode:CFG.CLASS_CODE});if(!data.ok)throw Error(data.error);state.classInfo=data.classInfo;}else{state.classInfo={...form,weeklyGoal:num(form.weeklyGoal),updatedAt:todayISO()};localStorage.setItem(key("classInfo"),JSON.stringify(state.classInfo));}renderStudent();toast("Class settings saved.");}catch(error){toast(error.message)}
}

async function openStudentDetail(studentKey){
  try{
    let data;if(API_READY){data=await api("studentDetail",{token:teacherTokenCache,classCode:CFG.CLASS_CODE,studentKey});if(!data.ok)throw Error(data.error)}else{data={ok:true,profile:state.profile,logs:state.logs,note:JSON.parse(localStorage.getItem(key("teacherNote"))||"null")||{},assessments:state.assessments,submissions:state.submissions}};
    state.studentDetail=data;renderStudentDetail();openModal("studentDetailModal");
  }catch(error){toast(error.message)}
}
function closeStudentDetail(){closeModal("studentDetailModal")}
function renderStudentDetail(){
  const data=state.studentDetail;if(!data)return;const profile=data.profile||{},logs=data.logs||[],minutes=sum(logs,log=>num(log.Minutes??log.minutes)),scores=logs.map(log=>num(log.Score??log.score)).filter(Boolean),avg=scores.length?sum(scores,x=>x)/scores.length:0,week=currentWeekData(logs),streak=studyStreak(logs);
  $("studentDetailName").textContent=profile.name||"Student Details";$("studentDetailMeta").textContent=`${profile.studentId||"-"} · ${profile.className||"-"} · Level ${profile.currentLevel||1}`;
  const cards=[["Total Study Time",minutes,"minutes"],["This Week",week.minutes,"minutes"],["Verified Evidence",logs.filter(log=>String(log.VerificationStatus||"").toLowerCase()==="verified").length,"entries"],["Average Score",avg.toFixed(1),"%"]];$("studentDetailMetrics").innerHTML=cards.map(card=>`<div class="card metric"><div class="metric-label">${card[0]}</div><div class="metric-value">${card[1]}</div><div class="metric-sub">${card[2]}</div></div>`).join("");
  const weekly=buildWeekly(logs,8);setChart("studentDetailChart","bar",{labels:weekly.map(item=>item.label),datasets:[{label:"Minutes",data:weekly.map(item=>item.minutes),backgroundColor:"#8367ee",borderRadius:8}]},{plugins:{title:{display:true,text:"Study Time Over the Last 8 Weeks"}},scales:{y:{beginAtZero:true}}});
  renderMiniSkillGrid(logs);
  $("studentDetailLogs").innerHTML=logs.length?[...logs].sort((a,b)=>String(b.Date).localeCompare(String(a.Date))).slice(0,20).map(log=>{const id=log.LogId||"",status=String(log.VerificationStatus||"Pending");return `<tr><td>${fmtDate(log.Date)}</td><td>${esc(log.Skill||"Not set")}</td><td>${esc(log.Activity)}</td><td>${num(log.Minutes)}</td><td>${log.Score||"-"}</td><td>${log.Evidence?`<a href="${escAttr(log.Evidence)}" target="_blank" rel="noopener">Open</a>`:"-"}</td><td><div class="table-actions">${verificationLabel(status)}${id?`<button class="btn-xs btn-view" onclick="verifyLog('${escAttr(id)}','Verified')">Verify</button><button class="btn-xs btn-delete" onclick="verifyLog('${escAttr(id)}','Needs revision')">Revise</button>`:""}</div></td></tr>`}).join(""):`<tr><td colspan="7" class="empty">No data yet</td></tr>`;
  const form=$("teacherNoteForm"),note=data.note||{};form.elements.studentKey.value=profile.studentKey||"";form.elements.status.value=note.Status??note.status??"";form.elements.note.value=note.TeacherNote??note.note??"";form.elements.nextAction.value=note.NextAction??note.nextAction??"";
  const assessmentForm=$("assessmentForm");assessmentForm.elements.studentKey.value=profile.studentKey||"";assessmentForm.elements.assessmentDate.value=todayISO();renderStudentAssessmentHistory(data.assessments||[]);
}
async function saveTeacherNote(event){
  event.preventDefault();const form=Object.fromEntries(new FormData(event.target).entries());
  try{if(API_READY){const data=await api("saveTeacherNote",{...form,token:teacherTokenCache,classCode:CFG.CLASS_CODE});if(!data.ok)throw Error(data.error);state.studentDetail.note=data.note}else{localStorage.setItem(key("teacherNote"),JSON.stringify(form));state.studentDetail.note=form}toast("Teacher guidance saved.")}catch(error){toast(error.message)}
}

function initPwa(){
  if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
  window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;const button=$("installButton");if(button){button.classList.remove("hidden");button.classList.add("install-ready")}});
  window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;$("installButton")?.classList.add("hidden");toast("App installed.")});
}
async function installApp(){if(!deferredInstallPrompt){toast("This browser is not currently offering the install option.");return;}deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("installButton")?.classList.add("hidden");}

function getNextAction(m){
  if(!m.minutes) return "Start Level 1 with 15–20 minutes of Read Along, then log your first activity.";
  const level = LEVELS[m.currentLevel-1];
  const progress = m.levelProgress[m.currentLevel-1];
  if(m.week.minutes<m.weeklyGoal*.5) return `Add another ${Math.max(10,Math.round((m.weeklyGoal-m.week.minutes)/2))} minutes to move closer to this week’s goal.`;
  if(progress>=.95 && m.currentLevel<6) return `Start the first activity in Level ${m.currentLevel+1}.`;
  const currentRows = state.logs.filter(log=>num(log.Level ?? log.level)===m.currentLevel);
  const sources = groupSource(currentRows);
  if(!sources.ELLO) return "Add an ELLO lesson to build listening and vocabulary skills.";
  if(!sources["LearnEnglish Teens"]) return "Add a British Council activity to practise a wider range of skills.";
  if(m.avgScore && m.avgScore<level.score) return "Review the previous lesson and update your error log before starting a new one.";
  return `Continue Level ${m.currentLevel}: ${level.tasks[0]}`;
}

function buildWeekly(logs,n=12){
  const result = [];
  const today = new Date();
  today.setHours(0,0,0,0);
  for(let i=n-1;i>=0;i--){
    const end = new Date(today);
    end.setDate(today.getDate()-i*7);
    const start = new Date(end);
    start.setDate(end.getDate()-6);
    const rows = logs.filter(log=>{const date=parseLogDate(log.Date ?? log.date);return date>=start && date<=end});
    result.push({label:new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short"}).format(end),minutes:sum(rows,log=>num(log.Minutes ?? log.minutes))});
  }
  return result;
}

function currentWeekData(logs){
  const now = new Date();
  const day = (now.getDay()+6)%7;
  const start = new Date(now);
  start.setHours(0,0,0,0);
  start.setDate(start.getDate()-day);
  const end = new Date(start);
  end.setDate(end.getDate()+6);
  const rows = logs.filter(log=>{const date=parseLogDate(log.Date ?? log.date);return date>=start && date<=end});
  return {minutes:sum(rows,log=>num(log.Minutes ?? log.minutes)),sessions:rows.length,activities:sum(rows,log=>num(log.Completed ?? log.completed))};
}

function groupSource(logs){
  const result = {"Read Along":0,"ELLO":0,"LearnEnglish Teens":0};
  logs.forEach(log=>{
    const source = displaySource(log.Source ?? log.source);
    if(source in result) result[source] += num(log.Minutes ?? log.minutes);
  });
  return result;
}

function normalizeSourceUsage(usage){
  return {
    "Read Along":num(usage["Read Along"]),
    "ELLO":num(usage.ELLO)+num(usage.ELLLO),
    "LearnEnglish Teens":num(usage["LearnEnglish Teens"])
  };
}

function displaySource(source){return source==="ELLLO" || source==="ELLO" ? "ELLO" : source || "-"}

function uniqueStudyDays(logs){return [...new Set(logs.map(log=>String(log.Date ?? log.date ?? "").slice(0,10)).filter(Boolean))]}

function studyStreak(logs){
  const days = uniqueStudyDays(logs).sort().reverse();
  if(!days.length) return 0;
  let cursor = new Date();
  cursor.setHours(0,0,0,0);
  const latest = parseLogDate(days[0]);
  const gap = Math.round((cursor-latest)/86400000);
  if(gap>1) return 0;
  if(gap===1) cursor=latest;
  let streak=0;
  for(const value of days){
    const date=parseLogDate(value);
    if(Math.round((cursor-date)/86400000)===0){streak++;cursor.setDate(cursor.getDate()-1)}
    else if(date<cursor) break;
  }
  return streak;
}

function logsWithin(logs,days){
  const cutoff = new Date();
  cutoff.setHours(0,0,0,0);
  cutoff.setDate(cutoff.getDate()-(days-1));
  return logs.filter(log=>parseLogDate(log.Date ?? log.date)>=cutoff);
}

function activeDaysWithin(logs,days){return new Set(logsWithin(logs,days).map(log=>String(log.Date ?? log.date).slice(0,10))).size}

function toggleTheme(){applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark",true)}

function applyTheme(theme,save=true){
  document.documentElement.dataset.theme = theme;
  if(save) localStorage.setItem(key("theme"),theme);
  if($("themeButton")) $("themeButton").textContent = theme==="dark" ? "☀️" : "🌙";
  if(typeof Chart!=="undefined"){
    Chart.defaults.color = theme==="dark" ? "#cbd5e1" : "#53657d";
    Chart.defaults.borderColor = theme==="dark" ? "rgba(148,163,184,.18)" : "rgba(83,101,125,.12)";
  }
  if(state.logs) renderStudentCharts();
  if(state.teacher) renderTeacherCharts(filteredTeacherStudents());
}

function printReport(){window.print()}

function setChart(id,type,data,options={}){
  if(typeof Chart==="undefined" || !$(id)) return;
  if(charts[id]) charts[id].destroy();
  charts[id] = new Chart($(id),{type,data,options:{responsive:true,maintainAspectRatio:false,...options}});
}

function api(action,params={}){
  return new Promise((resolve,reject)=>{
    const callback = `cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timer = setTimeout(()=>finish(Error("The server request timed out.")),15000);
    function finish(error,data){clearTimeout(timer);delete window[callback];script.remove();error?reject(error):resolve(data)}
    window[callback] = data=>finish(null,data);
    script.onerror = ()=>finish(Error("Could not connect to the database."));
    script.src = `${CFG.API_URL}?${new URLSearchParams({action,callback,...params})}`;
    document.body.appendChild(script);
  });
}

function toast(message){
  const element = $("toast");
  element.textContent = message;
  element.classList.add("show");
  setTimeout(()=>element.classList.remove("show"),2800);
}

function fmtDate(value){
  if(!value) return "-";
  const date = parseLogDate(value);
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"2-digit"}).format(date);
}
function parseLogDate(value){return new Date(String(value || "").slice(0,10)+"T00:00:00")}
function daysAgo(value){return value?Math.max(0,Math.floor((new Date()-parseLogDate(value))/86400000)):999}
function todayISO(){return localISO(new Date())}
function localISO(date){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");return `${y}-${m}-${d}`}
function num(value){const number=Number(value);return Number.isFinite(number)?number:0}
function sum(array,fn){return array.reduce((total,item)=>total+fn(item),0)}
function escAttr(value){return esc(value).replace(/`/g,"&#096;")}
function esc(value){return String(value ?? "").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]))}
function csv(value){return `"${String(value ?? "").replaceAll('"','""')}"`}
function download(content,name,type){const blob=new Blob([content],{type}),anchor=document.createElement("a");anchor.href=URL.createObjectURL(blob);anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(anchor.href),1000)}


function initAccessibility(){
  document.addEventListener("keydown",event=>{if(event.key==="Escape"){document.querySelectorAll(".modal.open").forEach(modal=>closeModal(modal.id))}});
}
function openModal(id){const modal=$(id);if(!modal)return;modal.classList.add("open");setTimeout(()=>modal.querySelector("input,select,textarea,button,[tabindex]")?.focus(),30)}
function closeModal(id){const modal=$(id);if(modal)modal.classList.remove("open")}
function insertReflectionStarter(text){const area=$("logForm")?.elements.reflection;if(!area)return;area.value=(area.value?area.value+" ":"")+text;area.focus()}
function showTeacherTab(id){document.querySelectorAll(".teacher-tab").forEach(btn=>{const active=btn.dataset.teacherTab===id;btn.classList.toggle("active",active);btn.setAttribute("aria-selected",String(active))});document.querySelectorAll(".teacher-panel").forEach(panel=>panel.classList.toggle("active",panel.dataset.teacherPanel===id))}
function teacherLogout(showMessage=true){teacherTokenCache="";sessionStorage.removeItem("english6_teacherToken");state.teacher=null;clearInterval(teacherAutoRefresh);teacherAutoRefresh=null;$("teacherLayout")?.classList.remove("active");$("teacherLogin")?.classList.remove("hidden");if(showMessage)toast("Teacher session ended.")}

function assignmentId(item){return item.AssignmentId??item.assignmentId??""}
function submissionFor(id){return state.submissions.find(item=>(item.AssignmentId??item.assignmentId)===id)}
function activeAssignments(){return [...state.assignments].filter(item=>String(item.Active??item.active??"TRUE").toUpperCase()!=="FALSE").sort((a,b)=>String(a.DueDate??a.dueDate).localeCompare(String(b.DueDate??b.dueDate)))}
function renderCurrentAssignment(){const box=$("currentAssignment");if(!box)return;const assignment=activeAssignments().find(item=>!submissionFor(assignmentId(item)))||activeAssignments()[0];if(!assignment){box.classList.add("hidden");return}const id=assignmentId(assignment),submission=submissionFor(id),due=assignment.DueDate??assignment.dueDate;box.classList.remove("hidden");box.innerHTML=`<div><small>Current Assignment</small><h3>${esc(assignment.Title??assignment.title)}</h3><p>${esc(assignment.Objective??assignment.objective)}</p><div class="assignment-meta"><span class="badge badge-blue">Due ${fmtDate(due)}</span><span class="badge badge-purple">${num(assignment.EstimatedMinutes??assignment.estimatedMinutes)} minutes</span><span class="badge ${submission?"badge-green":"badge-orange"}">${submission?"Submitted":"Not submitted"}</span></div></div><button class="btn btn-primary" onclick="showPage('assignments')">View Assignment</button>`}
function renderAssignments(){const host=$("assignmentCards");if(!host)return;const rows=activeAssignments();host.innerHTML=rows.length?rows.map(item=>{const id=assignmentId(item),sub=submissionFor(id),url=item.ResourceUrl??item.resourceUrl,skills=item.Skills??item.skills??"",status=sub?String(sub.Status??sub.status??"Submitted"):"Not submitted";return `<article class="card assignment-card"><div class="assignment-status"><span class="badge badge-blue">Due ${fmtDate(item.DueDate??item.dueDate)}</span><span class="badge ${sub?"badge-green":"badge-orange"}">${esc(status)}</span></div><div><h4>${esc(item.Title??item.title)}</h4><p class="assignment-objective">${esc(item.Objective??item.objective)}</p></div><div class="assignment-detail"><b>Instructions</b><p>${esc(item.Instructions??item.instructions)}</p></div><div><b>Evidence:</b> ${esc(item.EvidenceRequired??item.evidenceRequired)}</div><div><b>Success Criteria:</b> ${esc(item.SuccessCriteria??item.successCriteria)}</div><div class="assignment-meta"><span>${esc(skills)}</span><span>${num(item.EstimatedMinutes??item.estimatedMinutes)} minutes</span></div><div class="assignment-actions">${url?`<a class="btn btn-outline" href="${escAttr(url)}" target="_blank" rel="noopener">Open Resource</a>`:""}<button class="btn btn-primary" onclick="openAssignmentSubmission('${escAttr(id)}')">${sub?"Update Submission":"Submit Evidence"}</button></div>${sub?`<small>Submitted ${fmtDate(sub.SubmittedAt??sub.submittedAt)}${sub.TeacherFeedback?` · Feedback: ${esc(sub.TeacherFeedback)}`:""}</small>`:""}</article>`}).join(""):`<div class="card empty">No active assignments yet.</div>`}
function openAssignmentSubmission(id){const assignment=state.assignments.find(item=>assignmentId(item)===id),sub=submissionFor(id);if(!assignment)return;const form=$("assignmentSubmissionForm");form.elements.assignmentId.value=id;form.elements.evidenceUrl.value=sub?.EvidenceUrl??sub?.evidenceUrl??"";form.elements.reflection.value=sub?.Reflection??sub?.reflection??"";$("assignmentSubmissionTitle").textContent=assignment.Title??assignment.title;$("assignmentSubmissionHint").textContent=assignment.EvidenceRequired??assignment.evidenceRequired??"";openModal("assignmentSubmissionModal")}
function closeAssignmentSubmission(){closeModal("assignmentSubmissionModal")}
async function submitAssignment(event){event.preventDefault();if(!state.profile){openProfile();return}const form=Object.fromEntries(new FormData(event.target).entries());form.studentKey=state.profile.studentKey;form.classCode=CFG.CLASS_CODE;try{if(API_READY){const data=await api("submitAssignment",form);if(!data.ok)throw Error(data.error);await loadStudent()}else{const old=state.submissions.find(item=>(item.AssignmentId??item.assignmentId)===form.assignmentId);const row={AssignmentId:form.assignmentId,StudentKey:form.studentKey,EvidenceUrl:form.evidenceUrl,Reflection:form.reflection,Status:"Submitted",SubmittedAt:todayISO()};if(old)Object.assign(old,row);else state.submissions.push(row);localStorage.setItem(key("submissions"),JSON.stringify(state.submissions));renderStudent()}closeAssignmentSubmission();toast("Assignment submitted.")}catch(error){toast(error.message)}}

function skillStats(logs){const result={};SKILLS.forEach(skill=>result[skill]={entries:0,verified:0,scores:[],minutes:0});logs.forEach(log=>{const skill=log.Skill??log.skill;if(!result[skill])return;result[skill].entries++;result[skill].minutes+=num(log.Minutes??log.minutes);const score=num(log.Score??log.score);if(score>0)result[skill].scores.push(score);if(String(log.VerificationStatus??log.verificationStatus).toLowerCase()==="verified")result[skill].verified++});return result}
function renderSkills(){const host=$("skillMatrix");if(!host)return;const stats=skillStats(state.logs);host.innerHTML=SKILLS.map(skill=>{const data=stats[skill],avg=data.scores.length?sum(data.scores,x=>x)/data.scores.length:0;return `<article class="skill-card"><div class="skill-card-head"><strong>${SKILL_ICONS[skill]} ${skill}</strong><span class="badge badge-purple">${data.verified} verified</span></div><div class="skill-score">${avg?avg.toFixed(0)+"%":"—"}</div><small>${data.entries} evidence entries · ${data.minutes} minutes</small><div class="progress"><span style="width:${Math.min(100,avg)}%"></span></div></article>`}).join("");renderAssessmentGrowth()}
function renderAssessmentGrowth(){const assessments=[...state.assessments].sort((a,b)=>String(a.AssessmentDate??a.assessmentDate).localeCompare(String(b.AssessmentDate??b.assessmentDate)));const labels=SKILLS;const sets=assessments.map((row,index)=>({label:row.AssessmentType??row.assessmentType,data:labels.map(skill=>num(row[skill]??row[skill.toLowerCase()])),borderColor:["#ff6f91","#ffad42","#4d8df7"][index%3],backgroundColor:"transparent",tension:.25}));setChart("assessmentGrowthChart","radar",{labels,datasets:sets},{scales:{r:{beginAtZero:true,max:100}},plugins:{legend:{position:"bottom"}}});const host=$("assessmentCards");host.innerHTML=assessments.length?assessments.map(row=>`<div class="assessment-result"><strong><span>${esc(row.AssessmentType??row.assessmentType)}</span><span>${num(row.Overall??row.overall)}%</span></strong><p>${fmtDate(row.AssessmentDate??row.assessmentDate)} · ${esc(row.Notes??row.notes??"")}</p></div>`).join(""):`<div class="empty compact-empty">No teacher assessments yet.</div>`}
function verificationLabel(value){const status=String(value||"Pending");const low=status.toLowerCase();const cls=low==="verified"?"verification-verified":low.includes("revision")||low.includes("reject")?"verification-rejected":"verification-pending";return `<span class="verification-chip ${cls}">${esc(status)}</span>`}

function resetAssignmentForm(){const form=$("assignmentForm");form.reset();form.elements.assignmentId.value="";form.elements.estimatedMinutes.value=30;form.elements.active.value="TRUE"}
function renderTeacherAssignments(){const host=$("teacherAssignmentList");if(!host||!state.teacher)return;const assignments=state.teacher.assignments||[],submissions=state.teacher.submissions||[];host.innerHTML=assignments.length?[...assignments].sort((a,b)=>String(b.CreatedAt).localeCompare(String(a.CreatedAt))).map(item=>{const id=assignmentId(item),count=submissions.filter(sub=>(sub.AssignmentId??sub.assignmentId)===id).length,active=String(item.Active??"TRUE").toUpperCase()!=="FALSE";return `<article class="teacher-assignment-item"><header><div><strong>${esc(item.Title)}</strong><small>Due ${fmtDate(item.DueDate)} · ${count} submissions</small></div><span class="badge ${active?"badge-green":"badge-orange"}">${active?"Active":"Archived"}</span></header><p>${esc(item.Objective||"")}</p><button class="btn-xs btn-edit" onclick="editAssignment('${escAttr(id)}')">Edit</button></article>`}).join(""):`<div class="empty compact-empty">No assignments yet.</div>`}
function editAssignment(id){const item=(state.teacher?.assignments||[]).find(row=>assignmentId(row)===id);if(!item)return;const form=$("assignmentForm");const map={assignmentId:id,title:item.Title,objective:item.Objective,resourceName:item.ResourceName,resourceUrl:item.ResourceUrl,instructions:item.Instructions,evidenceRequired:item.EvidenceRequired,dueDate:item.DueDate,estimatedMinutes:item.EstimatedMinutes,skills:item.Skills,successCriteria:item.SuccessCriteria,active:String(item.Active).toUpperCase()==="FALSE"?"FALSE":"TRUE"};Object.entries(map).forEach(([name,value])=>{if(form.elements[name])form.elements[name].value=value??""});form.scrollIntoView({behavior:"smooth",block:"start"})}
async function saveAssignment(event){event.preventDefault();const form=Object.fromEntries(new FormData(event.target).entries());try{if(API_READY){const data=await api("saveAssignment",{...form,token:teacherTokenCache,classCode:CFG.CLASS_CODE});if(!data.ok)throw Error(data.error)}else{const id=form.assignmentId||crypto.randomUUID(),row={AssignmentId:id,...Object.fromEntries(Object.entries(form).map(([k,v])=>[k[0].toUpperCase()+k.slice(1),v]))};const old=state.assignments.find(item=>assignmentId(item)===id);old?Object.assign(old,row):state.assignments.push(row);localStorage.setItem(key("assignments"),JSON.stringify(state.assignments))}resetAssignmentForm();await refreshTeacher(true);renderStudent();toast("Assignment saved.")}catch(error){toast(error.message)}}

function renderAssessmentSummary(){const host=$("assessmentSummaryTable");if(!host||!state.teacher)return;const summary=state.teacher.assessmentSummary||[];host.innerHTML=summary.length?summary.map(row=>{const growth=(num(row.post)-num(row.baseline));return `<tr><td><b>${esc(row.name)}</b><br><small>${esc(row.studentId)}</small></td><td>${esc(row.className)}</td><td>${row.baseline?row.baseline+"%":"—"}</td><td>${row.progress?row.progress+"%":"—"}</td><td>${row.post?row.post+"%":"—"}</td><td>${row.post&&row.baseline?`${growth>=0?"+":""}${growth}`:"—"}</td><td><button class="btn-xs btn-view" onclick="openStudentDetail('${escAttr(row.studentKey)}')">Open</button></td></tr>`}).join(""):`<tr><td colspan="7" class="empty">No assessment data yet.</td></tr>`}
function buildLocalAssessmentSummary(){if(!state.profile)return[];const find=type=>state.assessments.find(row=>String(row.AssessmentType??row.assessmentType).toLowerCase()===type.toLowerCase());return[{studentKey:state.profile.studentKey,studentId:state.profile.studentId,name:state.profile.name,className:state.profile.className,baseline:num(find("Baseline")?.Overall),progress:num(find("Progress")?.Overall),post:num(find("Post")?.Overall)}]}
function renderMiniSkillGrid(logs){const stats=skillStats(logs);$("studentDetailSkills").innerHTML=SKILLS.map(skill=>{const d=stats[skill],avg=d.scores.length?sum(d.scores,x=>x)/d.scores.length:0;return `<div class="mini-skill"><strong>${SKILL_ICONS[skill]} ${skill}</strong><small>${d.entries} entries · ${d.verified} verified · ${avg?avg.toFixed(0)+"%":"no score"}</small></div>`}).join("")}
function renderStudentAssessmentHistory(rows){const host=$("studentAssessmentHistory");host.innerHTML=rows.length?[...rows].sort((a,b)=>String(b.AssessmentDate??b.assessmentDate).localeCompare(String(a.AssessmentDate??a.assessmentDate))).map(row=>`<div class="assessment-history-row"><span>${esc(row.AssessmentType??row.assessmentType)} · ${fmtDate(row.AssessmentDate??row.assessmentDate)}</span><strong>${num(row.Overall??row.overall)}%</strong></div>`).join(""):`<div class="empty compact-empty">No assessments yet.</div>`}
async function saveAssessment(event){event.preventDefault();const form=Object.fromEntries(new FormData(event.target).entries());try{const data=API_READY?await api("saveAssessment",{...form,token:teacherTokenCache,classCode:CFG.CLASS_CODE}):{ok:true,assessment:{...form,Overall:averageAssessment(form)}};if(!data.ok)throw Error(data.error);if(!API_READY){state.assessments=state.assessments.filter(row=>!((row.StudentKey??row.studentKey)===form.studentKey&&(row.AssessmentType??row.assessmentType)===form.assessmentType));state.assessments.push(data.assessment);localStorage.setItem(key("assessments"),JSON.stringify(state.assessments))}await openStudentDetail(form.studentKey);await refreshTeacher(true);toast("Assessment saved.")}catch(error){toast(error.message)}}
function averageAssessment(form){const values=SKILLS.map(skill=>form[skill.toLowerCase()]).filter(value=>value!==""&&value!==undefined&&value!==null).map(num);return values.length?Math.round(sum(values,x=>x)/values.length):0}
async function verifyLog(logId,status){try{if(API_READY){const data=await api("verifyLog",{token:teacherTokenCache,classCode:CFG.CLASS_CODE,logId,status});if(!data.ok)throw Error(data.error)}else{const log=state.logs.find(item=>(item.LogId??item.logId??item._localId)===logId);if(log)log.VerificationStatus=status;persistLocal()}await openStudentDetail(state.studentDetail.profile.studentKey);await refreshTeacher(true);toast("Evidence verification updated.")}catch(error){toast(error.message)}}
