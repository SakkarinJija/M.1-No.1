const CLASS_CODE='ENGLISH6';
const TEACHER_PIN='2468';
const DATA_FILE_NAME='English 6-Level Learning Journey Data';

function doGet(e){
  const p=e.parameter||{};
  const cb=String(p.callback||'callback').replace(/[^\w.$]/g,'');
  let r;
  try{
    const a=p.action||'ping';
    if(a==='ping')r={ok:true,version:5};
    else if(a==='registerStudent')r=registerStudent_(p);
    else if(a==='submitLog')r=submitLog_(p);
    else if(a==='updateLog')r=updateLog_(p);
    else if(a==='deleteLog')r=deleteLog_(p);
    else if(a==='studentData')r=studentData_(p);
    else if(a==='teacherData')r=teacherData_(p);
    else if(a==='studentDetail')r=studentDetail_(p);
    else if(a==='saveTeacherNote')r=saveTeacherNote_(p);
    else if(a==='updateClassInfo')r=updateClassInfo_(p);
    else if(a==='classInfo')r=classInfo_(p);
    else r={ok:false,error:'Unknown action'};
  }catch(x){r={ok:false,error:String(x.message||x)};}
  return ContentService.createTextOutput(cb+'('+JSON.stringify(r)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function setup(){const ss=getDb_();Logger.log(ss.getUrl());}
function upgradeV5(){const ss=getDb_();backfillLogIds_(ss.getSheetByName('Logs'));PropertiesService.getScriptProperties().setProperty('V4_MIGRATED','1');PropertiesService.getScriptProperties().setProperty('V5_READY','1');Logger.log('Version 5 English is ready: '+ss.getUrl());}
function upgradeV4(){return upgradeV5();}

function registerStudent_(p){
  verify_(p.classCode);if(!p.studentId||!p.name||!p.className)throw Error('Please complete all required profile fields.');
  const ss=getDb_(),sh=ss.getSheetByName('Students'),rows=objects_(sh);
  const old=rows.find(r=>String(r.StudentId)===String(p.studentId)&&String(r.ClassName)===String(p.className));
  const key=old?old.StudentKey:Utilities.getUuid();
  const row=[new Date(),key,p.studentId,p.name,p.className,Number(p.currentLevel)||1,new Date()];
  old?sh.getRange(old._row,1,1,7).setValues([row]):sh.appendRow(row);
  return{ok:true,profile:{studentKey:key,studentId:p.studentId,name:p.name,className:p.className,currentLevel:Number(p.currentLevel)||1,classCode:CLASS_CODE}};
}

function submitLog_(p){
  verify_(p.classCode);validateLog_(p);
  const ss=getDb_(),students=objects_(ss.getSheetByName('Students')),st=students.find(r=>r.StudentKey===p.studentKey);
  if(!st)throw Error('Student not found.');
  const id=Utilities.getUuid(),lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    ss.getSheetByName('Logs').appendRow([new Date(),p.studentKey,p.date,Number(p.level)||1,p.source,p.activity,Number(p.minutes)||0,Number(p.completed)||0,p.score===''?'':Number(p.score),p.confidence===''?'':Number(p.confidence),p.evidence||'',p.reflection||'',id]);
    ss.getSheetByName('Students').getRange(st._row,6,1,2).setValues([[Number(p.level)||1,new Date()]]);
  }finally{lock.releaseLock();}
  return{ok:true,logId:id};
}

function updateLog_(p){
  verify_(p.classCode);validateLog_(p);if(!p.logId)throw Error('Log ID not found.');
  const ss=getDb_(),sh=ss.getSheetByName('Logs'),row=objects_(sh).find(r=>r.LogId===p.logId&&r.StudentKey===p.studentKey);
  if(!row)throw Error('The learning log to edit was not found.');
  const values=[row.CreatedAt||new Date(),p.studentKey,p.date,Number(p.level)||1,p.source,p.activity,Number(p.minutes)||0,Number(p.completed)||0,p.score===''?'':Number(p.score),p.confidence===''?'':Number(p.confidence),p.evidence||'',p.reflection||'',p.logId];
  sh.getRange(row._row,1,1,values.length).setValues([values]);
  return{ok:true};
}

function deleteLog_(p){
  verify_(p.classCode);if(!p.studentKey||!p.logId)throw Error('Required information is missing.');
  const sh=getDb_().getSheetByName('Logs'),row=objects_(sh).find(r=>r.LogId===p.logId&&r.StudentKey===p.studentKey);
  if(!row)throw Error('The learning log to delete was not found.');sh.deleteRow(row._row);return{ok:true};
}

function validateLog_(p){if(!p.studentKey||!p.date||!p.level||!p.source||!p.activity)throw Error('Please complete all required learning-log fields.');}

function studentData_(p){
  verify_(p.classCode);const ss=getDb_(),st=objects_(ss.getSheetByName('Students')).find(r=>r.StudentKey===p.studentKey);if(!st)throw Error('Student not found.');
  const logs=objects_(ss.getSheetByName('Logs')).filter(r=>r.StudentKey===p.studentKey).slice(-500);
  return{ok:true,version:5,profile:profile_(st),logs:logs.map(clean_),classInfo:getClassInfo_(ss)};
}

function teacherData_(p){
  teacherVerify_(p);const ss=getDb_(),students=objects_(ss.getSheetByName('Students')),logs=objects_(ss.getSheetByName('Logs')),map={};
  logs.forEach(l=>(map[l.StudentKey]||(map[l.StudentKey]=[])).push(l));
  const out=students.map(s=>{
    const rows=map[s.StudentKey]||[],minutes=rows.reduce((a,x)=>a+(Number(x.Minutes)||0),0),activities=rows.reduce((a,x)=>a+(Number(x.Completed)||0),0),scores=rows.map(x=>Number(x.Score)).filter(n=>n>0),avg=scores.length?scores.reduce((a,n)=>a+n,0)/scores.length:0,dates=rows.map(x=>String(x.Date||'').slice(0,10)).filter(Boolean).sort(),last=dates.length?dates[dates.length-1]:'';
    return{studentKey:s.StudentKey,studentId:s.StudentId,name:s.Name,className:s.ClassName,currentLevel:Number(s.CurrentLevel)||1,minutes,activities,avgScore:Math.round(avg*10)/10,lastActive:last,weekMinutes:weekMinutes_(rows),activeDays30:activeDays_(rows,30),streak:streak_(rows),sessions30:sessionsWithin_(rows,30)};
  });
  const src={'Read Along':0,'ELLO':0,'LearnEnglish Teens':0};logs.forEach(x=>{let name=String(x.Source||'');if(name==='ELLLO')name='ELLO';if(src[name]!==undefined)src[name]+=Number(x.Minutes)||0;});
  return{ok:true,version:5,generatedAt:new Date().toISOString(),students:out,weekly:weekly_(logs,12),sourceUsage:src,classInfo:getClassInfo_(ss)};
}

function studentDetail_(p){
  teacherVerify_(p);const ss=getDb_(),st=objects_(ss.getSheetByName('Students')).find(r=>r.StudentKey===p.studentKey);if(!st)throw Error('Student not found.');
  const logs=objects_(ss.getSheetByName('Logs')).filter(r=>r.StudentKey===p.studentKey).slice(-200).map(clean_);
  const note=objects_(ss.getSheetByName('TeacherNotes')).find(r=>r.StudentKey===p.studentKey)||{};
  return{ok:true,profile:profile_(st),logs,note:clean_(note)};
}

function saveTeacherNote_(p){
  teacherVerify_(p);if(!p.studentKey)throw Error('Student not found.');
  const sh=getDb_().getSheetByName('TeacherNotes'),rows=objects_(sh),old=rows.find(r=>r.StudentKey===p.studentKey),row=[new Date(),p.studentKey,String(p.note||'').slice(0,1000),String(p.status||'').slice(0,40),String(p.nextAction||'').slice(0,250)];
  old?sh.getRange(old._row,1,1,row.length).setValues([row]):sh.appendRow(row);
  return{ok:true,note:{UpdatedAt:norm_(row[0]),StudentKey:p.studentKey,TeacherNote:row[2],Status:row[3],NextAction:row[4]}};
}

function classInfo_(p){verify_(p.classCode);return{ok:true,classInfo:getClassInfo_(getDb_())};}
function updateClassInfo_(p){
  teacherVerify_(p);const ss=getDb_(),announcement=String(p.announcement||'').slice(0,500),goal=Math.min(600,Math.max(30,Number(p.weeklyGoal)||90));
  setSetting_(ss,'announcement',announcement);setSetting_(ss,'weeklyGoal',goal);setSetting_(ss,'updatedAt',new Date());return{ok:true,classInfo:getClassInfo_(ss)};
}
function getClassInfo_(ss){const rows=objects_(ss.getSheetByName('Settings')),map={};rows.forEach(r=>map[r.Key]=r.Value);return{announcement:String(map.announcement||''),weeklyGoal:Number(map.weeklyGoal)||0,updatedAt:String(map.updatedAt||'')};}
function setSetting_(ss,key,value){const sh=ss.getSheetByName('Settings'),rows=objects_(sh),old=rows.find(r=>r.Key===key),row=[key,value,new Date()];old?sh.getRange(old._row,1,1,3).setValues([row]):sh.appendRow(row);}

function profile_(st){return{studentKey:st.StudentKey,studentId:st.StudentId,name:st.Name,className:st.ClassName,currentLevel:Number(st.CurrentLevel)||1,classCode:CLASS_CODE};}
function teacherVerify_(p){if(String(p.pin)!==String(TEACHER_PIN))throw Error('Incorrect teacher PIN.');verify_(p.classCode);}

function weekMinutes_(rows){const today=startOfDay_(new Date()),offset=(today.getDay()+6)%7,start=new Date(today);start.setDate(today.getDate()-offset);const end=new Date(start);end.setDate(start.getDate()+6);return rows.reduce((total,row)=>{const d=parseDate_(row.Date);return total+(d>=start&&d<=end?(Number(row.Minutes)||0):0);},0);}
function activeDays_(rows,days){const cutoff=startOfDay_(new Date());cutoff.setDate(cutoff.getDate()-(days-1));const set={};rows.forEach(row=>{const value=String(row.Date||'').slice(0,10),d=parseDate_(value);if(value&&d>=cutoff)set[value]=true;});return Object.keys(set).length;}
function sessionsWithin_(rows,days){const cutoff=startOfDay_(new Date());cutoff.setDate(cutoff.getDate()-(days-1));return rows.filter(row=>parseDate_(row.Date)>=cutoff).length;}
function streak_(rows){const dates={};rows.forEach(row=>{const value=String(row.Date||'').slice(0,10);if(value)dates[value]=true;});const list=Object.keys(dates).sort().reverse();if(!list.length)return 0;let cursor=startOfDay_(new Date()),latest=parseDate_(list[0]),gap=Math.round((cursor-latest)/86400000);if(gap>1)return 0;if(gap===1)cursor=latest;let count=0;for(let i=0;i<list.length;i++){const d=parseDate_(list[i]);if(Math.round((cursor-d)/86400000)===0){count++;cursor.setDate(cursor.getDate()-1);}else if(d<cursor)break;}return count;}
function weekly_(logs,n){const out=[],today=startOfDay_(new Date());for(let i=n-1;i>=0;i--){const end=new Date(today);end.setDate(today.getDate()-i*7);const start=new Date(end);start.setDate(end.getDate()-6);const minutes=logs.reduce((total,row)=>{const d=parseDate_(row.Date);return total+(d>=start&&d<=end?(Number(row.Minutes)||0):0);},0);out.push({label:Utilities.formatDate(end,Session.getScriptTimeZone()||'Asia/Bangkok','d MMM'),minutes});}return out;}
function parseDate_(value){const parts=String(value||'').slice(0,10).split('-').map(Number);if(parts.length!==3||!parts[0])return new Date(0);return new Date(parts[0],parts[1]-1,parts[2]);}
function startOfDay_(date){const d=new Date(date);d.setHours(0,0,0,0);return d;}
function verify_(c){if(String(c)!==String(CLASS_CODE))throw Error('Incorrect class code.');}

function getDb_(){
  const pr=PropertiesService.getScriptProperties();let id=pr.getProperty('DB_ID'),ss;try{if(id)ss=SpreadsheetApp.openById(id);}catch(e){}if(!ss){ss=SpreadsheetApp.create(DATA_FILE_NAME);pr.setProperty('DB_ID',ss.getId());}
  ensureHeaders_(ss,'Students',['CreatedAt','StudentKey','StudentId','Name','ClassName','CurrentLevel','LastUpdated']);
  ensureHeaders_(ss,'Logs',['CreatedAt','StudentKey','Date','Level','Source','Activity','Minutes','Completed','Score','Confidence','Evidence','Reflection','LogId']);
  ensureHeaders_(ss,'TeacherNotes',['UpdatedAt','StudentKey','TeacherNote','Status','NextAction']);
  ensureHeaders_(ss,'Settings',['Key','Value','UpdatedAt']);
  if(!pr.getProperty('V4_MIGRATED')){backfillLogIds_(ss.getSheetByName('Logs'));if(!objects_(ss.getSheetByName('Settings')).some(r=>r.Key==='weeklyGoal'))setSetting_(ss,'weeklyGoal',90);pr.setProperty('V4_MIGRATED','1');}
  ss.getSheets().forEach(sh=>{if(sh.getLastColumn()){sh.setFrozenRows(1);sh.getRange(1,1,1,sh.getLastColumn()).setBackground('#4d8df7').setFontColor('#fff').setFontWeight('bold');}});return ss;
}
function ensureHeaders_(ss,name,headers){let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(!sh.getLastRow()){sh.getRange(1,1,1,headers.length).setValues([headers]);return sh;}const existing=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0];headers.forEach(h=>{if(existing.indexOf(h)<0){sh.getRange(1,sh.getLastColumn()+1).setValue(h);existing.push(h);}});return sh;}
function backfillLogIds_(sh){const rows=objects_(sh),col=headerIndex_(sh,'LogId');rows.filter(r=>!r.LogId).forEach(r=>sh.getRange(r._row,col).setValue(Utilities.getUuid()));}
function headerIndex_(sh,name){const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0],i=h.indexOf(name);if(i<0)throw Error('Column not found: '+name);return i+1;}
function objects_(sh){const v=sh.getDataRange().getValues();if(v.length<2)return[];const h=v[0];return v.slice(1).map((r,i)=>{const o={_row:i+2};h.forEach((x,j)=>o[x]=norm_(r[j]));return o;}).filter(o=>h.some(x=>o[x]!==''&&o[x]!==null));}
function norm_(v){return v instanceof Date?Utilities.formatDate(v,Session.getScriptTimeZone()||'Asia/Bangkok','yyyy-MM-dd'):v;}
function clean_(o){const c={};Object.keys(o||{}).forEach(k=>{if(k!=='_row')c[k]=o[k];});return c;}
