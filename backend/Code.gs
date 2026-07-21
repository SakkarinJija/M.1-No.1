const CLASS_CODE='ENGLISH6';
const TEACHER_PIN='2468';
const DATA_FILE_NAME='English 6-Level Learning Journey Data';
const TEACHER_SESSION_SECONDS=1800;
const SKILLS=['Listening','Speaking','Reading','Writing','Vocabulary','Grammar'];

function doGet(e){
  const p=e.parameter||{};
  const cb=String(p.callback||'callback').replace(/[^\w.$]/g,'');
  let r;
  try{
    const actions={
      ping:()=>({ok:true,version:6}),
      registerStudent:()=>registerStudent_(p),
      submitLog:()=>submitLog_(p),
      updateLog:()=>updateLog_(p),
      deleteLog:()=>deleteLog_(p),
      studentData:()=>studentData_(p),
      teacherLogin:()=>teacherLogin_(p),
      teacherData:()=>teacherData_(p),
      studentDetail:()=>studentDetail_(p),
      saveTeacherNote:()=>saveTeacherNote_(p),
      classInfo:()=>classInfo_(p),
      updateClassInfo:()=>updateClassInfo_(p),
      saveAssignment:()=>saveAssignment_(p),
      submitAssignment:()=>submitAssignment_(p),
      saveAssessment:()=>saveAssessment_(p),
      verifyLog:()=>verifyLog_(p)
    };
    const fn=actions[p.action||'ping'];
    r=fn?fn():{ok:false,error:'Unknown action.'};
  }catch(error){r={ok:false,error:String(error.message||error)};}
  return ContentService.createTextOutput(cb+'('+JSON.stringify(r)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function setup(){const ss=getDb_();Logger.log(ss.getUrl());}
function upgradeV6(){const ss=getDb_();backfillLogIds_(ss.getSheetByName('Logs'));PropertiesService.getScriptProperties().setProperty('V6_READY','1');Logger.log('Version 6 is ready: '+ss.getUrl());}
function upgradeV5(){return upgradeV6();}
function upgradeV4(){return upgradeV6();}

function registerStudent_(p){
  verify_(p.classCode);
  if(!p.studentId||!p.name||!p.className)throw Error('Please complete all required profile fields.');
  const ss=getDb_(),sh=ss.getSheetByName('Students'),rows=objects_(sh);
  const old=rows.find(r=>String(r.StudentId)===String(p.studentId)&&String(r.ClassName)===String(p.className));
  const key=old?old.StudentKey:Utilities.getUuid();
  const values={CreatedAt:old&&old.CreatedAt?old.CreatedAt:new Date(),StudentKey:key,StudentId:String(p.studentId).slice(0,80),Name:String(p.name).slice(0,150),ClassName:String(p.className).slice(0,80),CurrentLevel:clamp_(p.currentLevel,1,6,1),LastUpdated:new Date()};
  old?updateObjectRow_(sh,old._row,values):appendObject_(sh,values);
  audit_(ss,'student:'+key,'PROFILE_SAVED',key,p.studentId);
  return{ok:true,profile:profile_(values)};
}

function submitLog_(p){
  verify_(p.classCode);validateLog_(p);
  const ss=getDb_(),students=objects_(ss.getSheetByName('Students')),st=students.find(r=>r.StudentKey===p.studentKey);
  if(!st)throw Error('Student profile not found.');
  const sh=ss.getSheetByName('Logs'),logs=activeLogs_(ss);
  const normalizedSource=normalizeSource_(p.source),activity=String(p.activity||'').trim();
  const duplicate=logs.find(r=>r.StudentKey===p.studentKey&&String(r.Date)===String(p.date)&&normalizeSource_(r.Source)===normalizedSource&&String(r.Activity||'').trim().toLowerCase()===activity.toLowerCase());
  if(duplicate)throw Error('A matching learning log already exists for this date. Edit the existing entry instead.');
  const id=Utilities.getUuid();
  appendObject_(sh,{CreatedAt:new Date(),StudentKey:p.studentKey,Date:p.date,Level:clamp_(p.level,1,6,1),Source:normalizedSource,Activity:activity,Minutes:clamp_(p.minutes,1,300,30),Completed:clamp_(p.completed,0,100,0),Score:scoreOrBlank_(p.score),Confidence:confidenceOrBlank_(p.confidence),Evidence:String(p.evidence||'').slice(0,500),Reflection:String(p.reflection||'').slice(0,1500),LogId:id,Skill:validSkill_(p.skill),VerificationStatus:'Pending',VerifiedAt:'',DeletedAt:'',UpdatedAt:new Date()});
  updateObjectRow_(ss.getSheetByName('Students'),st._row,{CurrentLevel:clamp_(p.level,1,6,1),LastUpdated:new Date()});
  audit_(ss,'student:'+p.studentKey,'LOG_CREATED',id,activity);
  return{ok:true,logId:id};
}

function updateLog_(p){
  verify_(p.classCode);validateLog_(p);if(!p.logId)throw Error('Log ID not found.');
  const ss=getDb_(),sh=ss.getSheetByName('Logs'),row=objects_(sh).find(r=>r.LogId===p.logId&&r.StudentKey===p.studentKey&&!r.DeletedAt);
  if(!row)throw Error('The learning log to edit was not found.');
  updateObjectRow_(sh,row._row,{Date:p.date,Level:clamp_(p.level,1,6,1),Source:normalizeSource_(p.source),Activity:String(p.activity||'').trim().slice(0,250),Minutes:clamp_(p.minutes,1,300,30),Completed:clamp_(p.completed,0,100,0),Score:scoreOrBlank_(p.score),Confidence:confidenceOrBlank_(p.confidence),Evidence:String(p.evidence||'').slice(0,500),Reflection:String(p.reflection||'').slice(0,1500),Skill:validSkill_(p.skill),VerificationStatus:'Pending',VerifiedAt:'',UpdatedAt:new Date()});
  audit_(ss,'student:'+p.studentKey,'LOG_UPDATED',p.logId,p.activity);
  return{ok:true};
}

function deleteLog_(p){
  verify_(p.classCode);if(!p.studentKey||!p.logId)throw Error('Required information is missing.');
  const ss=getDb_(),sh=ss.getSheetByName('Logs'),row=objects_(sh).find(r=>r.LogId===p.logId&&r.StudentKey===p.studentKey&&!r.DeletedAt);
  if(!row)throw Error('The learning log to delete was not found.');
  updateObjectRow_(sh,row._row,{DeletedAt:new Date(),UpdatedAt:new Date()});
  audit_(ss,'student:'+p.studentKey,'LOG_DELETED',p.logId,row.Activity||'');
  return{ok:true};
}

function validateLog_(p){
  if(!p.studentKey||!p.date||!p.level||!p.source||!p.activity||!p.skill)throw Error('Please complete all required learning-log fields.');
  const date=parseDate_(p.date),today=startOfDay_(new Date());if(date>today)throw Error('The learning-log date cannot be in the future.');
  clamp_(p.minutes,1,300,30);scoreOrBlank_(p.score);confidenceOrBlank_(p.confidence);validSkill_(p.skill);
}

function studentData_(p){
  verify_(p.classCode);const ss=getDb_(),st=objects_(ss.getSheetByName('Students')).find(r=>r.StudentKey===p.studentKey);if(!st)throw Error('Student not found.');
  return{ok:true,version:6,profile:profile_(st),logs:activeLogs_(ss).filter(r=>r.StudentKey===p.studentKey).slice(-500).map(clean_),classInfo:getClassInfo_(ss),assignments:activeAssignments_(ss).map(clean_),submissions:objects_(ss.getSheetByName('Submissions')).filter(r=>r.StudentKey===p.studentKey).map(clean_),assessments:objects_(ss.getSheetByName('Assessments')).filter(r=>r.StudentKey===p.studentKey).map(clean_)};
}

function teacherLogin_(p){
  verify_(p.classCode);
  const cache=CacheService.getScriptCache(),client=String(p.clientId||'anonymous').replace(/[^\w-]/g,'').slice(0,80),failKey='teacher_fail_'+client,attempts=Number(cache.get(failKey)||0);
  if(attempts>=5)throw Error('Too many incorrect attempts. Try again in 10 minutes.');
  if(String(p.pin)!==String(TEACHER_PIN)){cache.put(failKey,String(attempts+1),600);throw Error('Incorrect teacher PIN.');}
  cache.remove(failKey);const token=Utilities.getUuid().replace(/-/g,'');cache.put('teacher_token_'+token,'1',TEACHER_SESSION_SECONDS);
  audit_(getDb_(),'teacher','SESSION_STARTED',token.slice(0,8),'');
  return{ok:true,token,expiresIn:TEACHER_SESSION_SECONDS};
}

function teacherData_(p){
  teacherVerify_(p);const ss=getDb_(),students=objects_(ss.getSheetByName('Students')),logs=activeLogs_(ss),map={};
  logs.forEach(l=>(map[l.StudentKey]||(map[l.StudentKey]=[])).push(l));
  const out=students.map(s=>{
    const rows=map[s.StudentKey]||[],minutes=sum_(rows,x=>Number(x.Minutes)||0),activities=sum_(rows,x=>Number(x.Completed)||0),scores=rows.map(x=>Number(x.Score)).filter(n=>n>0),avg=scores.length?sum_(scores,x=>x)/scores.length:0,dates=rows.map(x=>String(x.Date||'').slice(0,10)).filter(Boolean).sort(),last=dates.length?dates[dates.length-1]:'';
    return{studentKey:s.StudentKey,studentId:s.StudentId,name:s.Name,className:s.ClassName,currentLevel:Number(s.CurrentLevel)||1,minutes,activities,avgScore:Math.round(avg*10)/10,lastActive:last,weekMinutes:weekMinutes_(rows),activeDays30:activeDays_(rows,30),streak:streak_(rows),sessions30:sessionsWithin_(rows,30),verifiedCount:rows.filter(x=>String(x.VerificationStatus).toLowerCase()==='verified').length};
  });
  const src={'Read Along':0,'ELLO':0,'LearnEnglish Teens':0};logs.forEach(x=>{const name=normalizeSource_(x.Source);if(src[name]!==undefined)src[name]+=Number(x.Minutes)||0;});
  return{ok:true,version:6,generatedAt:new Date().toISOString(),students:out,weekly:weekly_(logs,12),sourceUsage:src,classInfo:getClassInfo_(ss),assignments:objects_(ss.getSheetByName('Assignments')).map(clean_),submissions:objects_(ss.getSheetByName('Submissions')).map(clean_),assessmentSummary:assessmentSummary_(ss,students)};
}

function studentDetail_(p){
  teacherVerify_(p);const ss=getDb_(),st=objects_(ss.getSheetByName('Students')).find(r=>r.StudentKey===p.studentKey);if(!st)throw Error('Student not found.');
  const note=objects_(ss.getSheetByName('TeacherNotes')).find(r=>r.StudentKey===p.studentKey)||{};
  return{ok:true,profile:profile_(st),logs:activeLogs_(ss).filter(r=>r.StudentKey===p.studentKey).slice(-300).map(clean_),note:clean_(note),assessments:objects_(ss.getSheetByName('Assessments')).filter(r=>r.StudentKey===p.studentKey).map(clean_),submissions:objects_(ss.getSheetByName('Submissions')).filter(r=>r.StudentKey===p.studentKey).map(clean_)};
}

function saveTeacherNote_(p){
  teacherVerify_(p);if(!p.studentKey)throw Error('Student not found.');
  const ss=getDb_(),sh=ss.getSheetByName('TeacherNotes'),old=objects_(sh).find(r=>r.StudentKey===p.studentKey),values={UpdatedAt:new Date(),StudentKey:p.studentKey,TeacherNote:String(p.note||'').slice(0,1000),Status:String(p.status||'').slice(0,40),NextAction:String(p.nextAction||'').slice(0,250)};
  old?updateObjectRow_(sh,old._row,values):appendObject_(sh,values);audit_(ss,'teacher','SUPPORT_NOTE_SAVED',p.studentKey,p.status||'');return{ok:true,note:clean_(values)};
}

function classInfo_(p){verify_(p.classCode);return{ok:true,classInfo:getClassInfo_(getDb_())};}
function updateClassInfo_(p){teacherVerify_(p);const ss=getDb_(),announcement=String(p.announcement||'').slice(0,500),goal=clamp_(p.weeklyGoal,30,600,90);setSetting_(ss,'announcement',announcement);setSetting_(ss,'weeklyGoal',goal);setSetting_(ss,'updatedAt',new Date());audit_(ss,'teacher','CLASS_SETTINGS_UPDATED','class','');return{ok:true,classInfo:getClassInfo_(ss)};}
function getClassInfo_(ss){const rows=objects_(ss.getSheetByName('Settings')),map={};rows.forEach(r=>map[r.Key]=r.Value);return{announcement:String(map.announcement||''),weeklyGoal:Number(map.weeklyGoal)||0,updatedAt:String(map.updatedAt||'')};}
function setSetting_(ss,key,value){const sh=ss.getSheetByName('Settings'),old=objects_(sh).find(r=>r.Key===key),values={Key:key,Value:value,UpdatedAt:new Date()};old?updateObjectRow_(sh,old._row,values):appendObject_(sh,values);}

function saveAssignment_(p){
  teacherVerify_(p);if(!p.title||!p.objective||!p.instructions||!p.evidenceRequired||!p.dueDate||!p.successCriteria)throw Error('Please complete all required assignment fields.');
  const ss=getDb_(),sh=ss.getSheetByName('Assignments'),id=p.assignmentId||Utilities.getUuid(),old=objects_(sh).find(r=>r.AssignmentId===id),values={AssignmentId:id,CreatedAt:old&&old.CreatedAt?old.CreatedAt:new Date(),Title:String(p.title).slice(0,120),Objective:String(p.objective).slice(0,500),ResourceName:String(p.resourceName||'').slice(0,120),ResourceUrl:String(p.resourceUrl||'').slice(0,500),Instructions:String(p.instructions).slice(0,1000),EvidenceRequired:String(p.evidenceRequired).slice(0,500),DueDate:p.dueDate,EstimatedMinutes:clamp_(p.estimatedMinutes,5,600,30),Skills:String(p.skills||'').slice(0,250),SuccessCriteria:String(p.successCriteria).slice(0,700),Active:String(p.active||'TRUE').toUpperCase()==='FALSE'?'FALSE':'TRUE',UpdatedAt:new Date()};
  old?updateObjectRow_(sh,old._row,values):appendObject_(sh,values);audit_(ss,'teacher','ASSIGNMENT_SAVED',id,p.title);return{ok:true,assignment:clean_(values)};
}

function submitAssignment_(p){
  verify_(p.classCode);if(!p.studentKey||!p.assignmentId||!String(p.reflection||'').trim())throw Error('Please add a reflection before submitting.');
  const ss=getDb_(),assignment=objects_(ss.getSheetByName('Assignments')).find(r=>r.AssignmentId===p.assignmentId&&String(r.Active).toUpperCase()!=='FALSE');if(!assignment)throw Error('Assignment not found or no longer active.');
  const sh=ss.getSheetByName('Submissions'),old=objects_(sh).find(r=>r.AssignmentId===p.assignmentId&&r.StudentKey===p.studentKey),values={SubmittedAt:old&&old.SubmittedAt?old.SubmittedAt:new Date(),AssignmentId:p.assignmentId,StudentKey:p.studentKey,EvidenceUrl:String(p.evidenceUrl||'').slice(0,500),Reflection:String(p.reflection).slice(0,1000),Status:'Submitted',TeacherFeedback:old?old.TeacherFeedback||'':'',Score:old?old.Score||'':'',UpdatedAt:new Date()};
  old?updateObjectRow_(sh,old._row,values):appendObject_(sh,values);audit_(ss,'student:'+p.studentKey,'ASSIGNMENT_SUBMITTED',p.assignmentId,assignment.Title||'');return{ok:true,submission:clean_(values)};
}

function saveAssessment_(p){
  teacherVerify_(p);if(!p.studentKey||!p.assessmentType||!p.assessmentDate)throw Error('Student, assessment type, and date are required.');
  const type=String(p.assessmentType),allowed=['Baseline','Progress','Post'];if(allowed.indexOf(type)<0)throw Error('Invalid assessment type.');
  const scores={};SKILLS.forEach(skill=>scores[skill]=scoreOrBlank_(p[skill.toLowerCase()]));const numeric=SKILLS.map(skill=>scores[skill]).filter(v=>v!==''),overall=numeric.length?Math.round(sum_(numeric,x=>Number(x))/numeric.length):0;
  const ss=getDb_(),sh=ss.getSheetByName('Assessments'),old=objects_(sh).find(r=>r.StudentKey===p.studentKey&&r.AssessmentType===type),values={UpdatedAt:new Date(),StudentKey:p.studentKey,AssessmentType:type,AssessmentDate:p.assessmentDate,Listening:scores.Listening,Speaking:scores.Speaking,Reading:scores.Reading,Writing:scores.Writing,Vocabulary:scores.Vocabulary,Grammar:scores.Grammar,Overall:overall,Notes:String(p.notes||'').slice(0,1000)};
  old?updateObjectRow_(sh,old._row,values):appendObject_(sh,values);audit_(ss,'teacher','ASSESSMENT_SAVED',p.studentKey,type);return{ok:true,assessment:clean_(values)};
}

function verifyLog_(p){
  teacherVerify_(p);if(!p.logId)throw Error('Log ID is required.');const allowed=['Verified','Needs revision','Pending'],status=allowed.indexOf(p.status)>=0?p.status:'Pending';
  const ss=getDb_(),sh=ss.getSheetByName('Logs'),row=objects_(sh).find(r=>r.LogId===p.logId&&!r.DeletedAt);if(!row)throw Error('Learning log not found.');updateObjectRow_(sh,row._row,{VerificationStatus:status,VerifiedAt:status==='Pending'?'':new Date(),UpdatedAt:new Date()});audit_(ss,'teacher','LOG_VERIFICATION_UPDATED',p.logId,status);return{ok:true,status};
}

function assessmentSummary_(ss,students){
  const rows=objects_(ss.getSheetByName('Assessments')),map={};rows.forEach(r=>{map[r.StudentKey]=map[r.StudentKey]||{};map[r.StudentKey][String(r.AssessmentType).toLowerCase()]=Number(r.Overall)||0;});
  return students.map(s=>({studentKey:s.StudentKey,studentId:s.StudentId,name:s.Name,className:s.ClassName,baseline:(map[s.StudentKey]||{}).baseline||0,progress:(map[s.StudentKey]||{}).progress||0,post:(map[s.StudentKey]||{}).post||0}));
}
function activeAssignments_(ss){return objects_(ss.getSheetByName('Assignments')).filter(r=>String(r.Active||'TRUE').toUpperCase()!=='FALSE');}
function activeLogs_(ss){return objects_(ss.getSheetByName('Logs')).filter(r=>!r.DeletedAt);}
function profile_(st){return{studentKey:st.StudentKey,studentId:st.StudentId,name:st.Name,className:st.ClassName,currentLevel:Number(st.CurrentLevel)||1,classCode:CLASS_CODE};}

function teacherVerify_(p){
  verify_(p.classCode);const token=String(p.token||''),cache=CacheService.getScriptCache();
  if(token&&cache.get('teacher_token_'+token)){cache.put('teacher_token_'+token,'1',TEACHER_SESSION_SECONDS);return true;}
  if(String(p.pin)===String(TEACHER_PIN))return true;
  throw Error('Your teacher session has expired. Please sign in again.');
}

function weekMinutes_(rows){const today=startOfDay_(new Date()),offset=(today.getDay()+6)%7,start=new Date(today);start.setDate(today.getDate()-offset);const end=new Date(start);end.setDate(start.getDate()+6);return rows.reduce((total,row)=>{const d=parseDate_(row.Date);return total+(d>=start&&d<=end?(Number(row.Minutes)||0):0);},0);}
function activeDays_(rows,days){const cutoff=startOfDay_(new Date());cutoff.setDate(cutoff.getDate()-(days-1));const set={};rows.forEach(row=>{const value=String(row.Date||'').slice(0,10),d=parseDate_(value);if(value&&d>=cutoff)set[value]=true;});return Object.keys(set).length;}
function sessionsWithin_(rows,days){const cutoff=startOfDay_(new Date());cutoff.setDate(cutoff.getDate()-(days-1));return rows.filter(row=>parseDate_(row.Date)>=cutoff).length;}
function streak_(rows){const dates={};rows.forEach(row=>{const value=String(row.Date||'').slice(0,10);if(value)dates[value]=true;});const list=Object.keys(dates).sort().reverse();if(!list.length)return 0;let cursor=startOfDay_(new Date()),latest=parseDate_(list[0]),gap=Math.round((cursor-latest)/86400000);if(gap>1)return 0;if(gap===1)cursor=latest;let count=0;for(let i=0;i<list.length;i++){const d=parseDate_(list[i]);if(Math.round((cursor-d)/86400000)===0){count++;cursor.setDate(cursor.getDate()-1);}else if(d<cursor)break;}return count;}
function weekly_(logs,n){const out=[],today=startOfDay_(new Date());for(let i=n-1;i>=0;i--){const end=new Date(today);end.setDate(today.getDate()-i*7);const start=new Date(end);start.setDate(end.getDate()-6);const minutes=logs.reduce((total,row)=>{const d=parseDate_(row.Date);return total+(d>=start&&d<=end?(Number(row.Minutes)||0):0);},0);out.push({label:Utilities.formatDate(end,Session.getScriptTimeZone()||'Asia/Bangkok','d MMM'),minutes});}return out;}
function parseDate_(value){const parts=String(value||'').slice(0,10).split('-').map(Number);if(parts.length!==3||!parts[0])return new Date(0);return new Date(parts[0],parts[1]-1,parts[2]);}
function startOfDay_(date){const d=new Date(date);d.setHours(0,0,0,0);return d;}
function verify_(c){if(String(c)!==String(CLASS_CODE))throw Error('Incorrect class code.');}
function normalizeSource_(value){return String(value||'')==='ELLLO'?'ELLO':String(value||'');}
function validSkill_(value){const skill=String(value||'');if(SKILLS.indexOf(skill)<0)throw Error('Please select a valid primary skill.');return skill;}
function scoreOrBlank_(value){if(value===''||value===null||value===undefined)return'';const n=Number(value);if(!Number.isFinite(n)||n<0||n>100)throw Error('Scores must be between 0 and 100.');return n;}
function confidenceOrBlank_(value){if(value===''||value===null||value===undefined)return'';const n=Number(value);if(!Number.isFinite(n)||n<1||n>5)throw Error('Confidence must be between 1 and 5.');return n;}
function clamp_(value,min,max,fallback){const n=Number(value);if(!Number.isFinite(n))return fallback;if(n<min||n>max)throw Error('A numeric value is outside the allowed range.');return n;}
function sum_(rows,fn){return rows.reduce((total,row)=>total+fn(row),0);}

function getDb_(){
  const pr=PropertiesService.getScriptProperties();let id=pr.getProperty('DB_ID'),ss;try{if(id)ss=SpreadsheetApp.openById(id);}catch(error){}if(!ss){ss=SpreadsheetApp.create(DATA_FILE_NAME);pr.setProperty('DB_ID',ss.getId());}
  ensureHeaders_(ss,'Students',['CreatedAt','StudentKey','StudentId','Name','ClassName','CurrentLevel','LastUpdated']);
  ensureHeaders_(ss,'Logs',['CreatedAt','StudentKey','Date','Level','Source','Activity','Minutes','Completed','Score','Confidence','Evidence','Reflection','LogId','Skill','VerificationStatus','VerifiedAt','DeletedAt','UpdatedAt']);
  ensureHeaders_(ss,'TeacherNotes',['UpdatedAt','StudentKey','TeacherNote','Status','NextAction']);
  ensureHeaders_(ss,'Settings',['Key','Value','UpdatedAt']);
  ensureHeaders_(ss,'Assignments',['AssignmentId','CreatedAt','Title','Objective','ResourceName','ResourceUrl','Instructions','EvidenceRequired','DueDate','EstimatedMinutes','Skills','SuccessCriteria','Active','UpdatedAt']);
  ensureHeaders_(ss,'Submissions',['SubmittedAt','AssignmentId','StudentKey','EvidenceUrl','Reflection','Status','TeacherFeedback','Score','UpdatedAt']);
  ensureHeaders_(ss,'Assessments',['UpdatedAt','StudentKey','AssessmentType','AssessmentDate','Listening','Speaking','Reading','Writing','Vocabulary','Grammar','Overall','Notes']);
  ensureHeaders_(ss,'AuditLog',['Timestamp','Actor','Action','TargetId','Details']);
  backfillLogIds_(ss.getSheetByName('Logs'));
  if(!objects_(ss.getSheetByName('Settings')).some(r=>r.Key==='weeklyGoal'))setSetting_(ss,'weeklyGoal',90);
  ss.getSheets().forEach(sh=>{if(sh.getLastColumn()){sh.setFrozenRows(1);sh.getRange(1,1,1,sh.getLastColumn()).setBackground('#4d8df7').setFontColor('#fff').setFontWeight('bold');}});
  return ss;
}
function ensureHeaders_(ss,name,headers){let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(!sh.getLastRow()){sh.getRange(1,1,1,headers.length).setValues([headers]);return sh;}const existing=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0];headers.forEach(h=>{if(existing.indexOf(h)<0){sh.getRange(1,sh.getLastColumn()+1).setValue(h);existing.push(h);}});return sh;}
function appendObject_(sh,values){const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];sh.appendRow(headers.map(h=>Object.prototype.hasOwnProperty.call(values,h)?values[h]:''));}
function updateObjectRow_(sh,rowNumber,values){const headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0],current=sh.getRange(rowNumber,1,1,headers.length).getValues()[0];headers.forEach((h,i)=>{if(Object.prototype.hasOwnProperty.call(values,h))current[i]=values[h];});sh.getRange(rowNumber,1,1,headers.length).setValues([current]);}
function backfillLogIds_(sh){const rows=objects_(sh),col=headerIndex_(sh,'LogId');rows.filter(r=>!r.LogId).forEach(r=>sh.getRange(r._row,col).setValue(Utilities.getUuid()));}
function headerIndex_(sh,name){const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0],i=h.indexOf(name);if(i<0)throw Error('Column not found: '+name);return i+1;}
function objects_(sh){const v=sh.getDataRange().getValues();if(v.length<2)return[];const h=v[0];return v.slice(1).map((r,i)=>{const o={_row:i+2};h.forEach((x,j)=>o[x]=norm_(r[j]));return o;}).filter(o=>h.some(x=>o[x]!==''&&o[x]!==null));}
function norm_(v){return v instanceof Date?Utilities.formatDate(v,Session.getScriptTimeZone()||'Asia/Bangkok','yyyy-MM-dd'):v;}
function clean_(o){const c={};Object.keys(o||{}).forEach(k=>{if(k!=='_row')c[k]=o[k];});return c;}
function audit_(ss,actor,action,target,details){try{appendObject_(ss.getSheetByName('AuditLog'),{Timestamp:new Date(),Actor:String(actor||''),Action:String(action||''),TargetId:String(target||''),Details:String(details||'').slice(0,500)});}catch(error){}}
