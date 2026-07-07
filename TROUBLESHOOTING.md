# 🔧 دليل استكشاف الأخطاء والمشاكل

## ❌ المشاكل التي تواجهك:

### 1️⃣ خطأ 500 Internal Server Error عند التسجيل
### 2️⃣ مشكلة CORS - Origin not allowed

---

## ✅ الحلول:

### **الخطوة 1: تحديث ملف .env**

```bash
# في .env.local أضف CLIENT_URL:
CLIENT_URL=http://localhost:3000,http://localhost:3001,http://localhost:5500

# للبريد الإلكتروني (اختياري للتطوير):
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

### **الخطوة 2: تأكد من قاعدة البيانات**

تأكد من أنك نفذت الـ schema:

```bash
# في MySQL:
mysql -u root -p
# أدخل كلمة المرور (اتركها فارغة إن لم تكن موجودة)

# ثم اختر قاعدة البيانات:
USE meds_digital_services;

# تأكد من وجود جدول users:
SHOW TABLES;
```

---

### **الخطوة 3: إعادة تشغيل الخادم**

```bash
# في terminal واحد:
npm run dev

# يجب أن ترى:
✅ Allowed CORS origins: [http://localhost:3000, ...]
✅ MySQL connection successful
✅ Server running on http://localhost:3000
```

---

### **الخطوة 4: اختبار الـ API**

استخدم Postman أو curl:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "first_name": "محمد",
    "last_name": "أحمد",
    "username": "mohamad",
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "Password@123",
    "confirm_password": "Password@123"
  }'
```

---

## 🔍 خطوات التشخيص المتقدمة:

### تحقق من اتصال قاعدة البيانات:
```bash
# في node terminal:
node -e "
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'meds_digital_services',
  waitForConnections: true,
  connectionLimit: 10
});

pool.getConnection().then(conn => {
  console.log('✅ Database connected!');
  conn.release();
}).catch(err => {
  console.error('❌ Database error:', err.message);
});
"
```

### تحقق من الـ CORS:
```bash
curl -v -X OPTIONS http://localhost:3000/api/auth/register \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```

---

## 📋 قائمة تفقد سريعة:

- [ ] تم تشغيل MySQL
- [ ] تم تنفيذ database/meds_schema.sql
- [ ] تم تحديث .env.local مع CLIENT_URL
- [ ] تم تشغيل `npm install`
- [ ] تم تشغيل `npm run dev`
- [ ] الخادم يعمل على http://localhost:3000
- [ ] لا توجد رسائل خطأ في console

---

## 🚀 إذا لم تنجح الحلول:

**اتبع هذه الخطوات بالترتيب:**

1. توقف الخادم (Ctrl+C)
2. احذف node_modules: `rm -r node_modules` أو `rmdir /s node_modules`
3. أعد التثبيت: `npm install`
4. أعد تشغيل: `npm run dev`

---

## 📞 معلومات الاتصال للدعم:

إذا استمرت المشاكل:
1. تحقق من ملف السجل (console) للأخطاء الدقيقة
2. تأكد من أن جميع المنافذ متاحة (3000 للخادم، 3306 للـ MySQL)
3. تأكد من إذن الوصول لملفات المشروع

