# วิธีอัปเดตจาก Version 2 เป็น Version 3

## ส่วนที่ 1: อัปเดตไฟล์ GitHub

1. แตกไฟล์ `English_6_Level_Class_Dashboard_Update_V3.zip`
2. เปิด GitHub Repository เดิม
3. เลือก **Add file → Upload files**
4. อัปโหลดไฟล์ทั้งหมดจาก ZIP
5. ยอมรับการแทนที่ไฟล์เดิม
6. Commit message แนะนำ:

```text
Upgrade dashboard to Version 3
```

ชุด Update ไม่มี `config.js` ดังนั้น URL Apps Script และรหัสชั้นเรียนที่ตั้งไว้จะยังอยู่เหมือนเดิม

## ส่วนที่ 2: อัปเดต Google Apps Script

Version 3 ต้องใช้ `Code.gs` ใหม่เพื่อคำนวณ:

- เวลาเรียนสัปดาห์นี้
- จำนวนวันที่เรียนใน 30 วัน
- Streak
- Consistency Spotlight
- Intervention Priority

ทำตามนี้:

1. เปิดโปรเจกต์เดิมที่ `script.google.com`
2. เปิด `Code.gs`
3. จดค่า `CLASS_CODE` และ `TEACHER_PIN` เดิมไว้
4. ลบโค้ดเดิมทั้งหมด
5. วางโค้ดจาก `backend/Code.gs` ของ Version 3
6. ใส่ `CLASS_CODE` และ `TEACHER_PIN` เดิมกลับเข้าไป
7. กด Save
8. ไม่ต้อง Run `setup` ใหม่
9. เลือก **Deploy → Manage deployments**
10. กดรูปดินสอที่ Deployment เดิม
11. ตรง Version เลือก **New version**
12. กด **Deploy**

URL `/exec` เดิมยังใช้ต่อได้ จึงไม่ต้องแก้ `config.js`

## ส่วนที่ 3: ตรวจสอบ

1. เปิดเว็บไซต์ GitHub Pages
2. กดรีเฟรชแบบไม่ใช้ Cache
   - Windows: `Ctrl + Shift + R`
   - Mac: `Command + Shift + R`
3. ตรวจหน้าแหล่งเรียนว่าแสดง:
   - Read Along: Level 1–4
   - ELLO: Level 1–6
4. เข้าหน้าครู
5. ตรวจว่าตารางมีคอลัมน์สัปดาห์นี้ วันที่เรียน 30 วัน และ Streak

## ข้อมูลเดิมจะหายหรือไม่

ไม่หาย Version 3 ใช้ Google Sheets เดิมและหัวคอลัมน์เดิม ไม่มีการลบหรือย้ายข้อมูล

รายการที่เคยบันทึกเป็น `ELLLO` จะถูกแสดงเป็น `ELLO` อัตโนมัติ
