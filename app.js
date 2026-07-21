const LEVELS = [
  {level:1,month:1,title:"Read & Sound",cefr:"Foundation / Pre-A1",color:"#ff6f91",icon:"📖",focus:"อ่านออกเสียง เสียงพื้นฐาน และความมั่นใจ",minutes:180,sessions:10,activities:8,score:55,tasks:["อ่าน Read Along อย่างน้อย 8 เรื่อง","ฝึกอ่านออกเสียง 3 วันต่อสัปดาห์","บันทึกคำศัพท์ใหม่ 30 คำ","อัดเสียงอ่าน 1 นาทีเป็นหลักฐาน"],links:[["Read Along","https://readalong.google.com/"],["A1–A2 Vocabulary","https://learnenglishteens.britishcouncil.org/vocabulary/a1-a2-vocabulary"]]},
  {level:2,month:2,title:"Listen & Repeat",cefr:"A1",color:"#ffad42",icon:"🎧",focus:"ฟังภาษาอังกฤษช้า จับคำสำคัญ และพูดตาม",minutes:240,sessions:12,activities:10,score:60,tasks:["เรียน ELLO A1 อย่างน้อย 10 บท","ฟังซ้ำอย่างน้อยบทละ 2 รอบ","ทำ Quiz หลังฟัง","พูดตาม 5 ประโยคต่อบท"],links:[["ELLO A1","https://elllo.org/levels/A1-English-Lessons/index.html"],["Read Along","https://readalong.google.com/"]]},
  {level:3,month:3,title:"Everyday English",cefr:"A2",color:"#2fc6a1",icon:"💬",focus:"ภาษาอังกฤษในชีวิตประจำวัน คำศัพท์ และไวยากรณ์พื้นฐาน",minutes:300,sessions:14,activities:12,score:65,tasks:["เรียน ELLO A2 อย่างน้อย 8 บท","ทำ Grammar/Vocabulary 4 บท","เขียนสรุป 3–5 ประโยคต่อสัปดาห์","พูดเรื่องกิจวัตร 1–2 นาที"],links:[["ELLO A2","https://elllo.org/levels/A2-English-Lessons/index.html"],["A1–A2 Grammar","https://learnenglishteens.britishcouncil.org/grammar/a1-a2-grammar"]]},
  {level:4,month:4,title:"Connected Skills",cefr:"B1",color:"#4d8df7",icon:"🧩",focus:"เชื่อมการฟัง อ่าน พูด และเขียนเข้าด้วยกัน",minutes:360,sessions:14,activities:12,score:70,tasks:["เรียน ELLO B1 อย่างน้อย 8 บท","ทำ Listening/Reading 4 บท","เขียนย่อหน้า 80–100 คำ 2 ครั้ง","สรุปสิ่งที่ฟังด้วยคำของตนเอง"],links:[["ELLO B1","https://elllo.org/levels/B1-English-Lessons/index.html"],["British Council Skills","https://learnenglishteens.britishcouncil.org/skills"]]},
  {level:5,month:5,title:"Independent English",cefr:"B2 Challenge",color:"#8367ee",icon:"🚀",focus:"เรียนรู้ด้วยตนเองจากบทสนทนาธรรมชาติและเนื้อหาที่ยาวขึ้น",minutes:420,sessions:16,activities:14,score:70,tasks:["เรียน ELLO B2 อย่างน้อย 8 บท","ทำ B1–B2 Grammar 4 บท","จด Error Log จากข้อผิดพลาด","พูดแสดงความคิดเห็น 2–3 นาที"],links:[["ELLO B2","https://elllo.org/levels/B2-English-Lessons/index.html"],["B1–B2 Grammar","https://learnenglishteens.britishcouncil.org/grammar/b1-b2-grammar"]]},
  {level:6,month:6,title:"English Showcase",cefr:"C1 Exposure / Project",color:"#ed5da8",icon:"🏆",focus:"ประยุกต์ภาษาอังกฤษผ่านโครงงานและการนำเสนอ",minutes:480,sessions:16,activities:14,score:75,tasks:["เลือก ELLO C1 อย่างน้อย 6 บท","ทำกิจกรรม British Council 6 บท","สร้างวิดีโอ/พอดแคสต์/งานนำเสนอ","เขียน Reflection 150–200 คำ"],links:[["ELLO C1","https://elllo.org/levels/C1-English-Lessons/index.html"],["LearnEnglish Teens","https://learnenglishteens.britishcouncil.org/"]]}
];

const SOURCES = [
  {name:"Read Along by Google",short:"Read Along",icon:"📚",color:"#ff6f91",url:"https://readalong.google.com/",description:"ฝึกอ่านออกเสียงผ่านเรื่องภาพ พร้อมตัวช่วยฟังและคำแนะนำระหว่างอ่าน",best:"Level 1–4 · Reading aloud · Pronunciation"},
  {name:"ELLO",short:"ELLO",icon:"🎧",color:"#4d8df7",url:"https://elllo.org/levels/",description:"บทเรียนฟังฟรี แยกตามระดับ A1 ถึง C1 พร้อมวิดีโอ เสียง และกิจกรรม",best:"Level 1–6 · Listening · Vocabulary"},
  {name:"British Council LearnEnglish Teens",short:"LearnEnglish Teens",icon:"🇬🇧",color:"#8367ee",url:"https://learnenglishteens.britishcouncil.org/",description:"ฝึก Listening, Reading, Writing, Speaking, Grammar, Vocabulary และข้อสอบ",best:"Level 1–6 · Integrated skills"}
];

const CFG = window.APP_CONFIG || {};
const API_READY = Boolean(CFG.API_URL && CFG.API_URL.startsWith("https://script.google.com/"));
const $ = id => document.getElementById(id);
let state = {profile:null,logs:[],teacher:null,classInfo:{announcement:"",weeklyGoal:0,updatedAt:""},studentDetail:null};
let charts = {};
let teacherPinCache = "";
let teacherAutoRefresh = null;
let deferredInstallPrompt = null;

const key = name => `english6_${name}`;

window.addEventListener("DOMContentLoaded", init);

async function init(){
  applyTheme(localStorage.getItem(key("theme")) || "light", false);
  initPwa();
  $("appTitle").textContent = CFG.APP_TITLE || "English 6-Level Learning Journey";
  $("schoolName").textContent = CFG.SCHOOL_NAME || "Student progress dashboard";
  $("todayText").textContent = new Intl.DateTimeFormat("th-TH",{dateStyle:"long"}).format(new Date());
  $("modeBadge").textContent = API_READY ? "☁ เชื่อมข้อมูลกลางแล้ว" : "💻 โหมดทดลองบนเครื่องนี้";
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
  if(API_READY && state.profile?.studentKey){
    try{
      const data = await api("studentData",{studentKey:state.profile.studentKey,classCode:CFG.CLASS_CODE});
      if(data.ok){
        state.profile = data.profile;
        state.logs = data.logs || [];
        state.classInfo = data.classInfo || state.classInfo;
        localStorage.setItem(key("classInfo"),JSON.stringify(state.classInfo));
        persistLocal();
      }
    }catch(error){
      toast("โหลดข้อมูลกลางไม่สำเร็จ ใช้ข้อมูลในเครื่องแทน");
    }
  }
  renderStudent();
}

function showPage(id){
  document.querySelectorAll(".page").forEach(page=>page.classList.toggle("active",page.id===id));
  document.querySelectorAll(".nav-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.page===id));
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
    ["สัปดาห์นี้",m.week.minutes,"นาที",Math.min(1,m.week.minutes/m.weeklyGoal),"#dce9ff"],
    ["Study streak",m.streak,"วัน",Math.min(1,m.streak/7),"#fff0d8"],
    ["วันที่เรียน",m.activeDays,"วัน",Math.min(1,m.activeDays/30),"#d9f7ed"],
    ["กิจกรรมที่จบ",m.activities,"กิจกรรม",Math.min(1,m.activities/70),"#e9dcff"],
    ["คะแนนเฉลี่ย",m.avgScore.toFixed(1),"%",m.avgScore/100,"#d9f7ed"],
    ["ระดับปัจจุบัน",`Level ${m.currentLevel}`,LEVELS[m.currentLevel-1]?.title || "",m.overallProgress,"#ffe7ee"]
  ];
  $("studentMetrics").innerHTML = cards.map(card=>`<div class="card metric" style="--accent:${card[4]}"><div class="metric-label">${card[0]}</div><div class="metric-value">${card[1]}</div><div class="metric-sub">${card[2]}</div><div class="progress"><span style="width:${Math.max(0,Math.min(100,Math.round(card[3]*100)))}%"></span></div></div>`).join("");
  $("levelStrip").innerHTML = LEVELS.map((level,index)=>{
    const progress = m.levelProgress[index];
    const className = progress>=.95 ? "done active" : level.level===m.currentLevel ? "active" : "";
    return `<div class="level-pill ${className}" style="--level-color:${level.color}">L${level.level}<br>${level.title}<div class="level-percent">${Math.round(progress*100)}%</div></div>`;
  }).join("");
  renderClassAnnouncement();
  renderStudentCharts();
  renderRecent();
  renderHeatmap();
  renderAchievements(m);
  $("nextAction").textContent = getNextAction(m);
  $("weeklyGoalBox").innerHTML = `<div class="weekly-goal-line"><span>เป้าหมายสัปดาห์นี้</span><span>${m.week.minutes}/${m.weeklyGoal} นาที</span></div><div class="progress"><span style="width:${Math.min(100,Math.round(m.week.minutes/m.weeklyGoal*100))}%"></span></div><div class="weekly-goal-detail">${m.week.sessions} ครั้ง · ${m.week.activities} กิจกรรม · ${m.week.minutes>=m.weeklyGoal?"ทำถึงเป้าหมายแล้ว 🎉":"เหลืออีก "+Math.max(0,m.weeklyGoal-m.week.minutes)+" นาที"}</div>`;
  renderRoadmap();
}

function renderStudentCharts(){
  const weekly = buildWeekly(state.logs,12);
  const goal = metrics().weeklyGoal;
  setChart("studentWeeklyChart","bar",{
    labels:weekly.map(item=>item.label),
    datasets:[
      {label:"นาทีที่เรียน",data:weekly.map(item=>item.minutes),backgroundColor:"#4d8df7",borderRadius:8},
      {type:"line",label:"เป้าหมาย",data:weekly.map(()=>goal),borderColor:"#ffad42",borderDash:[6,5],pointRadius:0,tension:0}
    ]
  },{plugins:{title:{display:true,text:"เวลาเรียนรายสัปดาห์"}},scales:{y:{beginAtZero:true}}});
  const sources = groupSource(state.logs);
  setChart("studentSourceChart","doughnut",{
    labels:Object.keys(sources),
    datasets:[{data:Object.values(sources),backgroundColor:["#ff6f91","#4d8df7","#8367ee"],borderWidth:0}]
  },{plugins:{title:{display:true,text:"สัดส่วนการใช้ 3 เว็บไซต์"},legend:{position:"bottom"}}});
}

function renderRecent(){
  const rows = [...state.logs].sort((a,b)=>String(b.Date ?? b.date).localeCompare(String(a.Date ?? a.date))).slice(0,10);
  $("recentTable").innerHTML = rows.length ? rows.map(log=>`<tr><td>${fmtDate(log.Date ?? log.date)}</td><td><span class="badge badge-purple">L${log.Level ?? log.level}</span></td><td>${esc(displaySource(log.Source ?? log.source))}</td><td>${esc(log.Activity ?? log.activity)}</td><td>${num(log.Minutes ?? log.minutes)} นาที</td><td>${(log.Score ?? log.score) || "-"}</td></tr>`).join("") : `<tr><td colspan="6" class="empty">ยังไม่มีข้อมูล</td></tr>`;
  const history = [...state.logs].sort((a,b)=>String(b.Date ?? b.date).localeCompare(String(a.Date ?? a.date)) || String(b.CreatedAt ?? b.createdAt ?? "").localeCompare(String(a.CreatedAt ?? a.createdAt ?? "")));
  $("myLogTable").innerHTML = history.length ? history.map(log=>{
    const id = log.LogId ?? log.logId ?? "";
    const localId = id || log._localId || "";
    const actions = localId ? `<div class="table-actions"><button class="btn-xs btn-edit" onclick="editLog('${escAttr(localId)}')">แก้ไข</button><button class="btn-xs btn-delete" onclick="deleteLog('${escAttr(localId)}')">ลบ</button></div>` : `<small title="ให้ครูอัปเดต Code.gs เป็น V4 เพื่อแก้ไขรายการเก่า">รายการเก่า</small>`;
    return `<tr><td>${fmtDate(log.Date ?? log.date)}</td><td>L${log.Level ?? log.level}</td><td>${esc(displaySource(log.Source ?? log.source))}</td><td>${esc(log.Activity ?? log.activity)}</td><td>${num(log.Minutes ?? log.minutes)}</td><td>${num(log.Completed ?? log.completed)}</td><td>${(log.Score ?? log.score) || "-"}</td><td>${esc((log.Reflection ?? log.reflection) || "")}</td><td>${actions}</td></tr>`;
  }).join("") : `<tr><td colspan="9" class="empty">ยังไม่มีข้อมูล</td></tr>`;
}

function renderSources(){
  $("sourceCards").innerHTML = SOURCES.map(source=>`<article class="card source-card" style="--source:${source.color};--soft:${source.color}20"><div class="source-icon">${source.icon}</div><h4>${source.name}</h4><p>${source.description}</p><div class="best">${source.best}</div><a href="${source.url}" target="_blank" rel="noopener">เปิดเว็บไซต์ →</a></article>`).join("");
}

function renderRoadmap(){
  $("roadmapGrid").innerHTML = LEVELS.map(level=>{
    const progress = state.logs.length ? levelProgressOf(level,state.logs) : 0;
    return `<article class="level-card" style="--level-color:${level.color}"><div class="level-head"><div class="level-num"><div class="level-circle">${level.icon}</div><div><b>เดือน ${level.month} · Level ${level.level}</b><div class="cefr-label">${level.cefr}</div></div></div><span class="badge ${progress>=.95?"badge-green":progress>=.5?"badge-orange":"badge-blue"}">${Math.round(progress*100)}%</span></div><h4>${level.title}</h4><p><b>จุดเน้น:</b> ${level.focus}</p><p><b>เป้าหมาย:</b> ${level.minutes} นาที · ${level.sessions} ครั้ง · ${level.activities} กิจกรรม · คะแนน ${level.score}%</p><ul class="task-list">${level.tasks.map(task=>`<li>${task}</li>`).join("")}</ul><div class="level-links">${level.links.map(link=>`<a href="${link[1]}" target="_blank" rel="noopener">${link[0]} ↗</a>`).join("")}</div><div class="progress"><span style="width:${Math.round(progress*100)}%;background:${level.color}"></span></div></article>`;
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
    const label = new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"short",year:"numeric"}).format(date);
    cells.push(`<span class="heat-cell heat-${level}" title="${label}: ${minutes} นาที" aria-label="${label}: ${minutes} นาที"></span>`);
  }
  $("learningHeatmap").innerHTML = cells.join("");
}

function achievementDefinitions(m){
  return [
    {icon:"🌱",title:"First Step",detail:"บันทึกกิจกรรมแรก",ok:state.logs.length>=1},
    {icon:"⏱️",title:"One Hour",detail:"เรียนสะสม 60 นาที",ok:m.minutes>=60},
    {icon:"🔥",title:"3-Day Streak",detail:"เรียนต่อเนื่อง 3 วัน",ok:m.streak>=3},
    {icon:"🧭",title:"Explorer",detail:"ใช้ครบ 3 เว็บไซต์",ok:m.sourceCount>=3},
    {icon:"✅",title:"Ten Tasks",detail:"ทำครบ 10 กิจกรรม",ok:m.activities>=10},
    {icon:"🎯",title:"Strong Score",detail:"คะแนนเฉลี่ยอย่างน้อย 80%",ok:m.avgScore>=80},
    {icon:"💪",title:"Five Hours",detail:"เรียนสะสม 300 นาที",ok:m.minutes>=300},
    {icon:"🏆",title:"Level Master",detail:"ผ่านระดับใดระดับหนึ่ง 95%",ok:m.levelProgress.some(value=>value>=.95)}
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
    toast("บันทึกโปรไฟล์แล้ว");
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
      if(index<0) throw Error("ไม่พบรายการที่ต้องการแก้ไข");
      state.logs[index] = {...state.logs[index],...log,LogId:log.logId,_localId:log.logId};
      persistLocal();renderStudent();
    }else{
      const localId = crypto.randomUUID();
      state.logs.push({...log,LogId:localId,_localId:localId,createdAt:new Date().toISOString()});
      persistLocal();renderStudent();
    }
    toast(isEditing?"แก้ไขบันทึกแล้ว":"บันทึกผลการเรียนแล้ว");
    cancelEditLog();
    showPage("dashboard");
  }catch(error){toast(error.message)}
}

async function teacherLoginHandler(event){
  event.preventDefault();
  teacherPinCache = $("teacherPin").value;
  if(API_READY){
    await refreshTeacher();
    if(!teacherAutoRefresh) teacherAutoRefresh = setInterval(()=>{if(teacherPinCache) refreshTeacher(true)},300000);
  }else{
    state.teacher = localTeacher();
    $("teacherLogin").classList.add("hidden");
    $("teacherLayout").classList.add("active");
    renderTeacher();
    toast("โหมดทดลอง: แสดงข้อมูลในเครื่องนี้");
  }
}

async function refreshTeacher(silent=false){
  try{
    const data = await api("teacherData",{pin:teacherPinCache,classCode:CFG.CLASS_CODE});
    if(!data.ok) throw Error(data.error);
    state.teacher = data;
    state.classInfo = data.classInfo || state.classInfo;
    $("teacherLogin").classList.add("hidden");
    $("teacherLayout").classList.add("active");
    populateClasses();
    renderTeacher();
    if(!silent) toast("อัปเดตข้อมูลชั้นเรียนแล้ว");
  }catch(error){toast(error.message)}
}

function localTeacher(){
  const m = metrics();
  const lastActive = state.logs.length ? String(state.logs.map(log=>log.Date ?? log.date).sort().at(-1) || "") : "";
  return {
    students:state.profile ? [{studentKey:state.profile.studentKey,studentId:state.profile.studentId,name:state.profile.name,className:state.profile.className,currentLevel:m.currentLevel,minutes:m.minutes,activities:m.activities,avgScore:m.avgScore,lastActive,weekMinutes:m.week.minutes,activeDays30:activeDaysWithin(state.logs,30),streak:m.streak,sessions30:logsWithin(state.logs,30).length}] : [],
    weekly:buildWeekly(state.logs,12),
    sourceUsage:groupSource(state.logs),
    generatedAt:new Date().toISOString(),
    classInfo:state.classInfo
  };
}

function populateClasses(){
  const classes = [...new Set((state.teacher.students || []).map(student=>student.className).filter(Boolean))];
  const selected = $("teacherClassFilter").value;
  $("teacherClassFilter").innerHTML = '<option value="">ทุกห้อง</option>'+classes.map(name=>`<option>${esc(name)}</option>`).join("");
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
    ["นักเรียนทั้งหมด",students.length,"คน","#dce9ff"],
    ["เรียนสัปดาห์นี้",weeklyActive,"คน","#d9f7ed"],
    ["ต้องติดตาม",watch+support,"คน","#ffe7ee"],
    ["เวลาเฉลี่ย/คน",avgMinutes,"นาที","#ffe9d4"],
    ["เวลาเรียนรวม",minutes,"นาที","#dce9ff"],
    ["คะแนนเฉลี่ย",scores.length?(sum(scores,x=>x)/scores.length).toFixed(1):"0","%","#f0e7ff"]
  ];
  $("teacherMetrics").innerHTML = metricsCards.map(card=>`<div class="card metric" style="--accent:${card[3]}"><div class="metric-label">${card[0]}</div><div class="metric-value">${card[1]}</div><div class="metric-sub">${card[2]}</div></div>`).join("");
  $("teacherAlerts").innerHTML = `<div class="alert-card alert-active"><small>Active ภายใน 7 วัน</small><strong>${active}</strong><span>ติดตามต่อเนื่องตามปกติ</span></div><div class="alert-card alert-watch"><small>Watch 8–14 วัน</small><strong>${watch}</strong><span>ควรส่งข้อความเตือนหรือสอบถาม</span></div><div class="alert-card alert-support"><small>Needs support เกิน 14 วัน</small><strong>${support}</strong><span>ควรติดต่อและวางแผนช่วยเหลือ</span></div>`;
  $("teacherUpdatedAt").textContent = `อัปเดตล่าสุด ${new Intl.DateTimeFormat("th-TH",{dateStyle:"medium",timeStyle:"short"}).format(new Date())} · รีเฟรชอัตโนมัติทุก 5 นาที`;
  renderTeacherCharts(students);
  renderConsistency(students);
  renderInterventions(students);
  renderTeacherTable();
}

function renderTeacherCharts(students){
  const weekly = state.teacher.weekly || [];
  setChart("teacherWeeklyChart","line",{labels:weekly.map(item=>item.label),datasets:[{label:"นาทีรวม",data:weekly.map(item=>num(item.minutes)),borderColor:"#4d8df7",backgroundColor:"#4d8df722",fill:true,tension:.35}]},{plugins:{title:{display:true,text:"กิจกรรมรายสัปดาห์"}},scales:{y:{beginAtZero:true}}});
  setChart("teacherLevelChart","bar",{labels:LEVELS.map(level=>`L${level.level}`),datasets:[{data:LEVELS.map(level=>students.filter(student=>num(student.currentLevel)===level.level).length),backgroundColor:LEVELS.map(level=>level.color),borderRadius:8}]},{plugins:{title:{display:true,text:"นักเรียนตามระดับ"},legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0}}}});
  const sourceUsage = normalizeSourceUsage(state.teacher.sourceUsage || {});
  setChart("teacherSourceChart","doughnut",{labels:Object.keys(sourceUsage),datasets:[{data:Object.values(sourceUsage),backgroundColor:["#ff6f91","#4d8df7","#8367ee"],borderWidth:0}]},{plugins:{title:{display:true,text:"การใช้ 3 เว็บไซต์"},legend:{position:"bottom"}}});
}

function renderConsistency(students){
  const ranked = [...students].filter(student=>num(student.activeDays30)>0).sort((a,b)=>num(b.activeDays30)-num(a.activeDays30) || num(b.streak)-num(a.streak) || num(b.weekMinutes)-num(a.weekMinutes)).slice(0,5);
  const medals = ["🥇","🥈","🥉","⭐","⭐"];
  $("consistencyList").innerHTML = ranked.length ? ranked.map((student,index)=>`<div class="rank-item"><span class="rank-medal">${medals[index]}</span><div class="rank-person"><strong>${esc(student.name)}</strong><small>${esc(student.className)} · ${num(student.activeDays30)} วันที่เรียนใน 30 วัน</small></div><span class="streak-chip">🔥 ${num(student.streak)}</span></div>`).join("") : `<div class="empty compact-empty">ยังไม่มีข้อมูลความสม่ำเสมอ</div>`;
}

function renderInterventions(students){
  const rows = [...students].map(student=>({...student,_days:daysAgo(student.lastActive)})).filter(student=>student._days>7).sort((a,b)=>b._days-a._days).slice(0,6);
  $("interventionList").innerHTML = rows.length ? rows.map(student=>{
    const severe = student._days>14;
    const suggestion = severe ? "ติดต่อเป็นรายบุคคลและช่วยวางแผนเริ่มใหม่" : "ส่งข้อความเตือนและแนะนำกิจกรรมสั้น 15 นาที";
    return `<div class="intervention-item ${severe?"priority-high":"priority-medium"}"><div><strong>${esc(student.name)}</strong><small>${esc(student.className)} · ${student._days>=999?"ยังไม่เคยบันทึก":`ไม่ได้บันทึก ${student._days} วัน`}</small><p>${suggestion}</p></div><span class="badge ${severe?"badge-red":"badge-orange"}">${severe?"ช่วยก่อน":"ติดตาม"}</span></div>`;
  }).join("") : `<div class="empty compact-empty">ยอดเยี่ยม ขณะนี้ไม่มีนักเรียนที่ขาดกิจกรรมเกิน 7 วัน</div>`;
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
    return `<tr class="${status[3]}"><td><button class="student-link" onclick="openStudentDetail('${escAttr(student.studentKey)}')"><b>${esc(student.name)}</b><br><small>${esc(student.studentId)}</small></button></td><td>${esc(student.className)}</td><td><span class="badge badge-purple">Level ${num(student.currentLevel)}</span></td><td>${num(student.weekMinutes)} นาที</td><td>${num(student.activeDays30)} วัน</td><td><span class="streak-chip">🔥 ${num(student.streak)}</span></td><td>${num(student.avgScore).toFixed(1)}%</td><td>${fmtDate(student.lastActive)}</td><td><div class="student-status"><span class="status-dot" style="background:${status[2]}"></span><span class="badge ${status[1]}">${status[0]}</span></div></td><td><button class="btn-xs btn-view" onclick="openStudentDetail('${escAttr(student.studentKey)}')">ดูรายคน</button></td></tr>`;
  }).join("") : `<tr><td colspan="10" class="empty">ไม่พบนักเรียน</td></tr>`;
}

function exportTeacherCsv(){
  if(!state.teacher) return;
  const header = ["Student ID","Name","Class","Current Level","Total Minutes","Week Minutes","Activities","Active Days 30","Streak","Average Score","Last Active"];
  const rows = (state.teacher.students || []).map(student=>[student.studentId,student.name,student.className,student.currentLevel,student.minutes,student.weekMinutes,student.activities,student.activeDays30,student.streak,student.avgScore,student.lastActive]);
  download('\ufeff'+[header,...rows].map(row=>row.map(csv).join(",")).join("\n"),"teacher_summary_v4.csv","text/csv;charset=utf-8");
}

function exportMyData(){download(JSON.stringify({version:4,exportedAt:new Date().toISOString(),profile:state.profile,logs:state.logs},null,2),"my_english_data_v4.json","application/json")}

function importMyData(event){
  const file = event.target.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      if(!data.profile || !Array.isArray(data.logs)) throw Error("รูปแบบไฟล์ไม่ถูกต้อง");
      state.profile = data.profile;
      state.logs = data.logs;
      persistLocal();
      renderStudent();
      toast("นำเข้าข้อมูลสำเร็จ");
    }catch(error){toast(error.message || "นำเข้าข้อมูลไม่สำเร็จ")}
    finally{event.target.value=""}
  };
  reader.readAsText(file);
}

function openProfile(){
  const form = $("profileForm");
  const profile = state.profile || {};
  ["studentId","name","className","currentLevel","classCode"].forEach(field=>form.elements[field].value=profile[field] || (field==="classCode"?CFG.CLASS_CODE:""));
  $("profileModal").classList.add("open");
}
function closeProfile(){$("profileModal").classList.remove("open")}


function renderClassAnnouncement(){
  const box = $("classAnnouncement");
  if(!box) return;
  const text = String(state.classInfo?.announcement || "").trim();
  box.classList.toggle("hidden",!text);
  if(text){$("announcementText").textContent=text;$("announcementUpdated").textContent=state.classInfo?.updatedAt?`อัปเดต ${fmtDate(state.classInfo.updatedAt)}`:"";}
}

function findLogById(id){return state.logs.find(log=>(log.LogId ?? log.logId ?? log._localId)===id)}
function editLog(id){
  const log=findLogById(id);if(!log){toast("ไม่พบบันทึก");return;}
  const form=$("logForm");
  const map={logId:id,date:log.Date??log.date,level:log.Level??log.level,source:(log.Source??log.source)==="ELLO"?"ELLLO":(log.Source??log.source),minutes:log.Minutes??log.minutes,activity:log.Activity??log.activity,completed:log.Completed??log.completed,score:log.Score??log.score,confidence:log.Confidence??log.confidence,evidence:log.Evidence??log.evidence,reflection:log.Reflection??log.reflection};
  Object.entries(map).forEach(([name,value])=>{if(form.elements[name])form.elements[name].value=value??""});
  $("logFormTitle").textContent="แก้ไขบันทึกการเรียน";$("logFormHint").textContent="ตรวจสอบข้อมูลแล้วกดบันทึกการแก้ไข";$("saveLogButton").textContent="บันทึกการแก้ไข";$("cancelEditButton").classList.remove("hidden");form.closest(".form-card").classList.add("editing-banner");showPage("log");
}
function cancelEditLog(){
  const form=$("logForm");if(!form)return;form.reset();form.elements.logId.value="";form.elements.date.value=todayISO();form.elements.minutes.value=30;form.elements.completed.value=1;$("logFormTitle").textContent="บันทึกการเรียน";$("logFormHint").textContent="กรอกหลังเรียนเสร็จ ใช้เวลาประมาณ 1 นาที";$("saveLogButton").textContent="บันทึกผลการเรียน";$("cancelEditButton").classList.add("hidden");form.closest(".form-card").classList.remove("editing-banner");
}
async function deleteLog(id){
  if(!confirm("ต้องการลบบันทึกรายการนี้หรือไม่?"))return;
  try{if(API_READY){const data=await api("deleteLog",{classCode:CFG.CLASS_CODE,studentKey:state.profile.studentKey,logId:id});if(!data.ok)throw Error(data.error);await loadStudent();}else{state.logs=state.logs.filter(log=>(log.LogId??log.logId??log._localId)!==id);persistLocal();renderStudent();}toast("ลบบันทึกแล้ว");}catch(error){toast(error.message)}
}

async function saveClassInfo(event){
  event.preventDefault();const form=Object.fromEntries(new FormData(event.target).entries());
  try{if(API_READY){const data=await api("updateClassInfo",{...form,pin:teacherPinCache,classCode:CFG.CLASS_CODE});if(!data.ok)throw Error(data.error);state.classInfo=data.classInfo;}else{state.classInfo={...form,weeklyGoal:num(form.weeklyGoal),updatedAt:todayISO()};localStorage.setItem(key("classInfo"),JSON.stringify(state.classInfo));}renderStudent();toast("บันทึกการตั้งค่าชั้นเรียนแล้ว");}catch(error){toast(error.message)}
}

async function openStudentDetail(studentKey){
  try{let data;if(API_READY){data=await api("studentDetail",{pin:teacherPinCache,classCode:CFG.CLASS_CODE,studentKey});if(!data.ok)throw Error(data.error);}else{data={ok:true,profile:state.profile,logs:state.logs,note:JSON.parse(localStorage.getItem(key("teacherNote"))||"null")||{}};}state.studentDetail=data;renderStudentDetail();$("studentDetailModal").classList.add("open");}catch(error){toast(error.message)}
}
function closeStudentDetail(){$("studentDetailModal").classList.remove("open")}
function renderStudentDetail(){
  const data=state.studentDetail;if(!data)return;const profile=data.profile||{},logs=data.logs||[],minutes=sum(logs,log=>num(log.Minutes??log.minutes)),scores=logs.map(log=>num(log.Score??log.score)).filter(Boolean),avg=scores.length?sum(scores,x=>x)/scores.length:0,week=currentWeekData(logs),streak=studyStreak(logs);
  $("studentDetailName").textContent=profile.name||"รายละเอียดนักเรียน";$("studentDetailMeta").textContent=`${profile.studentId||"-"} · ${profile.className||"-"} · Level ${profile.currentLevel||1}`;
  const cards=[["เวลาเรียน",minutes,"นาที"],["สัปดาห์นี้",week.minutes,"นาที"],["Streak",streak,"วัน"],["คะแนนเฉลี่ย",avg.toFixed(1),"%"]];$("studentDetailMetrics").innerHTML=cards.map(card=>`<div class="card metric"><div class="metric-label">${card[0]}</div><div class="metric-value">${card[1]}</div><div class="metric-sub">${card[2]}</div></div>`).join("");
  const weekly=buildWeekly(logs,8);setChart("studentDetailChart","bar",{labels:weekly.map(item=>item.label),datasets:[{label:"นาที",data:weekly.map(item=>item.minutes),backgroundColor:"#8367ee",borderRadius:8}]},{plugins:{title:{display:true,text:"เวลาเรียน 8 สัปดาห์ล่าสุด"}},scales:{y:{beginAtZero:true}}});
  $("studentDetailLogs").innerHTML=logs.length?[...logs].sort((a,b)=>String(b.Date).localeCompare(String(a.Date))).slice(0,20).map(log=>`<tr><td>${fmtDate(log.Date)}</td><td>L${log.Level}</td><td>${esc(displaySource(log.Source))}</td><td>${esc(log.Activity)}</td><td>${num(log.Minutes)}</td><td>${log.Score||"-"}</td><td>${esc(log.Reflection||"")}</td></tr>`).join(""):`<tr><td colspan="7" class="empty">ยังไม่มีข้อมูล</td></tr>`;
  const form=$("teacherNoteForm"),note=data.note||{};form.elements.studentKey.value=profile.studentKey||"";form.elements.status.value=note.Status??note.status??"";form.elements.note.value=note.TeacherNote??note.note??"";form.elements.nextAction.value=note.NextAction??note.nextAction??"";
}
async function saveTeacherNote(event){
  event.preventDefault();const form=Object.fromEntries(new FormData(event.target).entries());
  try{if(API_READY){const data=await api("saveTeacherNote",{...form,pin:teacherPinCache,classCode:CFG.CLASS_CODE});if(!data.ok)throw Error(data.error);state.studentDetail.note=data.note;}else{localStorage.setItem(key("teacherNote"),JSON.stringify(form));state.studentDetail.note=form;}toast("บันทึกคำแนะนำของครูแล้ว");}catch(error){toast(error.message)}
}

function initPwa(){
  if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(()=>{});
  window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;const button=$("installButton");if(button){button.classList.remove("hidden");button.classList.add("install-ready")}});
  window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;$("installButton")?.classList.add("hidden");toast("ติดตั้งแอปแล้ว")});
}
async function installApp(){if(!deferredInstallPrompt){toast("เบราว์เซอร์นี้ยังไม่แสดงตัวเลือกติดตั้ง");return;}deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("installButton")?.classList.add("hidden");}

function getNextAction(m){
  if(!m.minutes) return "เริ่ม Level 1 ด้วย Read Along 15–20 นาที แล้วบันทึกกิจกรรมแรก";
  const level = LEVELS[m.currentLevel-1];
  const progress = m.levelProgress[m.currentLevel-1];
  if(m.week.minutes<m.weeklyGoal*.5) return `เพิ่มเวลาอีก ${Math.max(10,Math.round((m.weeklyGoal-m.week.minutes)/2))} นาที เพื่อเข้าใกล้เป้าหมายสัปดาห์นี้`;
  if(progress>=.95 && m.currentLevel<6) return `เริ่มกิจกรรมแรกของ Level ${m.currentLevel+1}`;
  const currentRows = state.logs.filter(log=>num(log.Level ?? log.level)===m.currentLevel);
  const sources = groupSource(currentRows);
  if(!sources.ELLO) return "เพิ่มบทเรียน ELLO เพื่อพัฒนาการฟังและคำศัพท์";
  if(!sources["LearnEnglish Teens"]) return "เพิ่มกิจกรรม British Council เพื่อฝึกทักษะให้หลากหลาย";
  if(m.avgScore && m.avgScore<level.score) return "ทบทวนบทเดิมและจด Error Log ก่อนเพิ่มบทใหม่";
  return `ทำต่อ Level ${m.currentLevel}: ${level.tasks[0]}`;
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
    result.push({label:new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"short"}).format(end),minutes:sum(rows,log=>num(log.Minutes ?? log.minutes))});
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
    const timer = setTimeout(()=>finish(Error("หมดเวลารอเซิร์ฟเวอร์")),15000);
    function finish(error,data){clearTimeout(timer);delete window[callback];script.remove();error?reject(error):resolve(data)}
    window[callback] = data=>finish(null,data);
    script.onerror = ()=>finish(Error("เชื่อมต่อฐานข้อมูลไม่สำเร็จ"));
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
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"short",year:"2-digit"}).format(date);
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
