# อัปเกรด Version 3 เป็น Version 4

Version 4 ใช้ Google Sheets เดิมและข้อมูลเดิมได้

1. อัปโหลดไฟล์หน้าเว็บจาก ZIP Update V4 ไปแทนไฟล์เดิมใน GitHub
2. อย่าแทนที่ `config.js` เดิม
3. เปิด Apps Script และสำรอง `CLASS_CODE` กับ `TEACHER_PIN`
4. วาง `backend/Code.gs` ของ V4 แทนโค้ดเดิม
5. คืนค่า `CLASS_CODE` และ `TEACHER_PIN`
6. เลือกฟังก์ชัน `upgradeV4` แล้วกด Run หนึ่งครั้ง
7. เลือก Deploy → Manage deployments → รูปดินสอ → New version → Deploy
8. รีเฟรช GitHub Pages แบบ Hard refresh

ฟังก์ชัน `upgradeV4` จะเพิ่ม `LogId`, ชีต `TeacherNotes` และชีต `Settings` โดยไม่ลบข้อมูลเดิม
