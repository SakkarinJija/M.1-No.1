const CLASS_CODE='ENGLISH6';
const TEACHER_PIN='2468';
const DATA_FILE_NAME='English 6-Level Learning Journey Data';

function doGet(e){
  const p=e.parameter||{};
  const cb=String(p.callback||'callback').replace(/[^\w.$]/g,'');
  let r;
  try{
    const a=p.action||'ping';
    if(a==='ping')r={ok:true,version:3};
    else if(a==='registerStudent')r=registerStudent_(p);
    else if(a==='submitLog')r=submitLog_(p);
    else if(a==='studentData')r=studentData_(p);
    else if(a==='teacherData')r=teacherData_(p);
    else r={ok:false,error:'Unknown action'};
  }catch(x){r={ok:false,error:String(x.message||x)};}
  return ContentService.createTextOutput(cb+'('+JSON.stringify(r)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function setup(){const ss=getDb_();Logger.log(ss.getUrl());}

function registerStudent_(p){
  verify_(p.classCode);
  if(!p.studentId||!p.name||!p.className)throw Error('กรอกข้อมูลให้ครบ');
  const ss=getDb_(),sh=ss.getSheetByName('Students'),rows=objects_(sh);
  const old=rows.find(r=>String(r.StudentId)===String(p.studentId)&&String(r.ClassName)===String(p.className));
  const key=old?old.StudentKey:Utilities.getUuid();
  const row=[new Date(),key,p.studentId,p.name,p.className,Number(p.currentLevel)||1,new Date()];
  old?sh.getRange(old._row,1,1,7).setValues([row]):sh.appendRow(row);
  return{ok:true,profile:{studentKey:key,studentId:p.studentId,name:p.name,className:p.className,currentLevel:Number(p.currentLevel)||1,classCode:CLASS_CODE}};
}

function submitLog_(p){
  verify_(p.classCode);
  if(!p.studentKey||!p.date||!p.level||!p.source||!p.activity)throw Error('กรอกข้อมูลกิจกรรมให้ครบ');
  const ss=getDb_(),students=objects_(ss.getSheetByName('Students'));
  const st=students.find(r=>r.StudentKey===p.studentKey);
  if(!st)throw Error('ไม่พบนักเรียน');
  const lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try{
    ss.getSheetByName('Logs').appendRow([new Date(),p.studentKey,p.date,Number(p.level)||1,p.source,p.activity,Number(p.minutes)||0,Number(p.completed)||0,p.score===''?'':Number(p.score),p.confidence===''?'':Number(p.confidence),p.evidence||'',p.reflection||'']);
    ss.getSheetByName('Students').getRange(st._row,6,1,2).setValues([[Number(p.level)||1,new Date()]]);
  }finally{lock.releaseLock();}
  return{ok:true};
}

function studentData_(p){
  verify_(p.classCode);
  const ss=getDb_();
  const st=objects_(ss.getSheetByName('Students')).find(r=>r.StudentKey===p.studentKey);
  if(!st)throw Error('ไม่พบนักเรียน');
  const logs=objects_(ss.getSheetByName('Logs')).filter(r=>r.StudentKey===p.studentKey).slice(-500);
  return{ok:true,profile:{studentKey:st.StudentKey,studentId:st.StudentId,name:st.Name,className:st.ClassName,currentLevel:Number(st.CurrentLevel)||1,classCode:CLASS_CODE},logs:logs.map(clean_)};
}

function teacherData_(p){
  if(String(p.pin)!==String(TEACHER_PIN))throw Error('รหัสครูไม่ถูกต้อง');
  verify_(p.classCode);
  const ss=getDb_(),students=objects_(ss.getSheetByName('Students')),logs=objects_(ss.getSheetByName('Logs')),map={};
  logs.forEach(l=>(map[l.StudentKey]||(map[l.StudentKey]=[])).push(l));
  const out=students.map(s=>{
    const rows=map[s.StudentKey]||[];
    const minutes=rows.reduce((a,x)=>a+(Number(x.Minutes)||0),0);
    const activities=rows.reduce((a,x)=>a+(Number(x.Completed)||0),0);
    const scores=rows.map(x=>Number(x.Score)).filter(n=>n>0);
    const avg=scores.length?scores.reduce((a,n)=>a+n,0)/scores.length:0;
    const dates=rows.map(x=>String(x.Date||'').slice(0,10)).filter(Boolean).sort();
    const last=dates.length?dates[dates.length-1]:'';
    return{
      studentId:s.StudentId,
      name:s.Name,
      className:s.ClassName,
      currentLevel:Number(s.CurrentLevel)||1,
      minutes:minutes,
      activities:activities,
      avgScore:Math.round(avg*10)/10,
      lastActive:last,
      weekMinutes:weekMinutes_(rows),
      activeDays30:activeDays_(rows,30),
      streak:streak_(rows),
      sessions30:sessionsWithin_(rows,30)
    };
  });
  const src={'Read Along':0,'ELLO':0,'LearnEnglish Teens':0};
  logs.forEach(x=>{
    let name=String(x.Source||'');
    if(name==='ELLLO')name='ELLO';
    if(src[name]!==undefined)src[name]+=Number(x.Minutes)||0;
  });
  return{ok:true,version:3,generatedAt:new Date().toISOString(),students:out,weekly:weekly_(logs,12),sourceUsage:src};
}

function weekMinutes_(rows){
  const today=startOfDay_(new Date());
  const offset=(today.getDay()+6)%7;
  const start=new Date(today);start.setDate(today.getDate()-offset);
  const end=new Date(start);end.setDate(start.getDate()+6);
  return rows.reduce((total,row)=>{const d=parseDate_(row.Date);return total+(d>=start&&d<=end?(Number(row.Minutes)||0):0);},0);
}

function activeDays_(rows,days){
  const cutoff=startOfDay_(new Date());cutoff.setDate(cutoff.getDate()-(days-1));
  const set={};
  rows.forEach(row=>{const value=String(row.Date||'').slice(0,10),d=parseDate_(value);if(value&&d>=cutoff)set[value]=true;});
  return Object.keys(set).length;
}

function sessionsWithin_(rows,days){
  const cutoff=startOfDay_(new Date());cutoff.setDate(cutoff.getDate()-(days-1));
  return rows.filter(row=>parseDate_(row.Date)>=cutoff).length;
}

function streak_(rows){
  const dates={};
  rows.forEach(row=>{const value=String(row.Date||'').slice(0,10);if(value)dates[value]=true;});
  const list=Object.keys(dates).sort().reverse();
  if(!list.length)return 0;
  let cursor=startOfDay_(new Date());
  const latest=parseDate_(list[0]);
  const gap=Math.round((cursor-latest)/86400000);
  if(gap>1)return 0;
  if(gap===1)cursor=latest;
  let count=0;
  for(let i=0;i<list.length;i++){
    const d=parseDate_(list[i]);
    if(Math.round((cursor-d)/86400000)===0){count++;cursor.setDate(cursor.getDate()-1);}
    else if(d<cursor)break;
  }
  return count;
}

function weekly_(logs,n){
  const out=[],today=startOfDay_(new Date());
  for(let i=n-1;i>=0;i--){
    const end=new Date(today);end.setDate(today.getDate()-i*7);
    const start=new Date(end);start.setDate(end.getDate()-6);
    const minutes=logs.reduce((total,row)=>{const d=parseDate_(row.Date);return total+(d>=start&&d<=end?(Number(row.Minutes)||0):0);},0);
    out.push({label:Utilities.formatDate(end,Session.getScriptTimeZone()||'Asia/Bangkok','d MMM'),minutes:minutes});
  }
  return out;
}

function parseDate_(value){
  const parts=String(value||'').slice(0,10).split('-').map(Number);
  if(parts.length!==3||!parts[0])return new Date(0);
  return new Date(parts[0],parts[1]-1,parts[2]);
}
function startOfDay_(date){const d=new Date(date);d.setHours(0,0,0,0);return d;}
function verify_(c){if(String(c)!==String(CLASS_CODE))throw Error('รหัสชั้นเรียนไม่ถูกต้อง');}

function getDb_(){
  const pr=PropertiesService.getScriptProperties();
  let id=pr.getProperty('DB_ID'),ss;
  try{if(id)ss=SpreadsheetApp.openById(id);}catch(e){}
  if(!ss){ss=SpreadsheetApp.create(DATA_FILE_NAME);pr.setProperty('DB_ID',ss.getId());}
  ensure_(ss,'Students',['CreatedAt','StudentKey','StudentId','Name','ClassName','CurrentLevel','LastUpdated']);
  ensure_(ss,'Logs',['CreatedAt','StudentKey','Date','Level','Source','Activity','Minutes','Completed','Score','Confidence','Evidence','Reflection']);
  ss.getSheets().forEach(sh=>{if(sh.getLastColumn()){sh.setFrozenRows(1);sh.getRange(1,1,1,sh.getLastColumn()).setBackground('#4d8df7').setFontColor('#fff').setFontWeight('bold');}});
  return ss;
}
function ensure_(ss,n,h){let sh=ss.getSheetByName(n);if(!sh)sh=ss.insertSheet(n);if(!sh.getLastRow())sh.getRange(1,1,1,h.length).setValues([h]);}
function objects_(sh){const v=sh.getDataRange().getValues();if(v.length<2)return[];const h=v[0];return v.slice(1).map((r,i)=>{const o={_row:i+2};h.forEach((x,j)=>o[x]=norm_(r[j]));return o;}).filter(o=>h.some(x=>o[x]!==''&&o[x]!==null));}
function norm_(v){return v instanceof Date?Utilities.formatDate(v,Session.getScriptTimeZone()||'Asia/Bangkok','yyyy-MM-dd'):v;}
function clean_(o){const c={};Object.keys(o).forEach(k=>{if(k!=='_row')c[k]=o[k];});return c;}
