# English 6-Level Learning Journey — Version 3

เว็บแดชบอร์ดสำหรับนักเรียนบันทึกการเรียนภาษาอังกฤษ 6 เดือน และให้ครูติดตามข้อมูลนักเรียนทั้งชั้นผ่าน Google Sheets

## จุดเด่น Version 3

### สำหรับนักเรียน
- เป้าหมายเวลาเรียนรายสัปดาห์
- Study streak และจำนวนวันที่เรียน
- Learning Calendar ย้อนหลัง 16 สัปดาห์
- Achievement Badges 8 แบบ
- Dark Mode
- พิมพ์หรือบันทึกรายงานเป็น PDF ผ่านเบราว์เซอร์
- สำรองและนำเข้าข้อมูล JSON
- แสดงชื่อ ELLO แต่ยังอ่านข้อมูลเดิมที่บันทึกเป็น ELLLO ได้

### สำหรับครู
- Active / Watch / Needs support
- เวลาเรียนสัปดาห์ปัจจุบัน
- จำนวนวันที่เรียนใน 30 วัน
- Streak รายคน
- Consistency Spotlight โดยไม่ใช้คะแนนจัดอันดับ
- Intervention Priority สำหรับนักเรียนที่ขาดกิจกรรม
- รีเฟรชอัตโนมัติทุก 5 นาทีหลังเข้าสู่หน้าครู
- ส่งออก CSV และพิมพ์รายงาน

## การแก้ไขแหล่งเรียนตามคำขอ

- Read Along by Google: `Level 1–4`
- ELLLO แสดงบนหน้าเว็บเป็น `ELLO`
- ELLO: `Level 1–6`
- LearnEnglish Teens: `Level 1–6`

> ระบบยังส่งค่าของ ELLO ไปยังฐานข้อมูลเป็น `ELLLO` เพื่อให้เข้ากันได้กับข้อมูลเดิม แต่หน้าเว็บทั้งหมดจะแสดงเป็น `ELLO`

## ไฟล์สำคัญ

```text
index.html          หน้าเว็บหลัก
styles.css          รูปแบบ สี Dark Mode และหน้าพิมพ์
app.js              ตรรกะแดชบอร์ด กราฟ Heatmap และรายงาน
config.js           URL Apps Script และรหัสชั้นเรียน
backend/Code.gs     ฐานข้อมูล Google Sheets และข้อมูลหน้าครู
TEACHER_GUIDE.md    คู่มือใช้งานหน้าครู
MIGRATION_V3.md     วิธีอัปเดตจาก Version 2
```

## ติดตั้งใหม่

1. อัปโหลดไฟล์ทั้งหมดไปยัง GitHub Repository
2. เปิด `config.js`
3. ใส่ Web App URL ที่ลงท้าย `/exec`
4. ตั้ง `CLASS_CODE` ให้ตรงกับ `backend/Code.gs`
5. คัดลอก `backend/Code.gs` ไปยัง Google Apps Script
6. เปลี่ยน `CLASS_CODE` และ `TEACHER_PIN`
7. Run ฟังก์ชัน `setup` หนึ่งครั้ง
8. Deploy เป็น Web app
   - Execute as: Me
   - Who has access: Anyone
9. เปิด GitHub Settings → Pages → Deploy from `main` และ `/ (root)`

## อัปเดตจาก Version 2

ใช้ไฟล์ชุด Update V3 ซึ่งไม่มี `config.js` เพื่อไม่ให้ URL `/exec` และ `CLASS_CODE` เดิมถูกเขียนทับ

สิ่งที่ต้องทำเพิ่มคือคัดลอก `backend/Code.gs` เวอร์ชันใหม่ไปแทนของเดิม แล้ว Deploy เป็น New version โดยไม่ต้อง Run `setup` ใหม่ และไม่ต้องสร้าง Google Sheets ใหม่

ดูขั้นตอนเต็มใน `MIGRATION_V3.md`

## ความเป็นส่วนตัว

ควรเก็บเฉพาะข้อมูลที่จำเป็นต่อการเรียน เช่น รหัสนักเรียน ชื่อ ห้อง เวลาเรียน และผลกิจกรรม ไม่ควรเก็บเลขบัตรประชาชน ที่อยู่ ข้อมูลสุขภาพ หรือข้อมูลอ่อนไหวอื่นในระบบนี้
