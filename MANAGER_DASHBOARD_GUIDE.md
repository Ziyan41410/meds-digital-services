## 🔧 Manager Dashboard - دليل التشغيل والتجريب

### 📌 المتطلبات

لتشغيل لوحة تحكم المدير (Manager Dashboard)، يجب أن يكون المستخدم:
- ✅ مسجل دخول (لديه token صحيح)
- ✅ يمتلك إحدى الأدوار التالية:
  - `admin` - المسؤول العام
  - `programmer` - مدير البرمجة
  - `marketer` - مدير التسويق
  - `cyber_security_expert` - مدير الأمن السيبراني

### 🧪 حسابات الاختبار

تم إنشاء حسابات اختبار تلقائياً عند تشغيل المهاجر `009_seed_test_managers.sql`:

| الحساب | البريد | كلمة المرور | الدور | القسم |
|-------|-------|-----------|-------|-------|
| manager_dev | manager@dev.com | password123 | Programmer | البرمجة |
| manager_mkt | manager@mkt.com | password123 | Marketer | التسويق |
| manager_sec | manager@sec.com | password123 | Cyber Security Expert | الأمن السيبراني |
| admin_user | admin@meds.com | password123 | Admin | الإدارة |

### ⚙️ التجريب

#### 1️⃣ تشغيل السيرفر
```bash
npm start
```

السيرفر سيقوم تلقائياً بتشغيل المهاجرة `009_seed_test_managers.sql` وإنشاء حسابات الاختبار.

#### 2️⃣ فتح الموقع
افتح المتصفح وانتقل إلى:
```
http://127.0.0.1:5500/login.html
```

#### 3️⃣ تسجيل الدخول
استخدم أحد حسابات الاختبار أعلاه:
- **بريد**: `manager@dev.com`
- **كلمة مرور**: `password123`

#### 4️⃣ الوصول لوحة التحكم
بعد تسجيل الدخول بنجاح، ستتم إعادة توجيهك تلقائياً:
- إذا كنت manager → `client-dashboard.html`
- إذا كنت admin → يمكنك الوصول لأي لوحة

### ❌ أخطاء شائعة

#### Error: 403 Forbidden
**السبب**: لا تملك الأدوار المطلوبة
**الحل**: 
- استخدم حساب manager أو admin
- تأكد من تعيين الدور الصحيح في قاعدة البيانات

#### Error: Failed to load profile
**السبب**: Token غير صحيح أو منتهي
**الحل**:
- امسح localStorage وسجل دخول جديد
```javascript
localStorage.clear()
window.location.reload()
```

#### Error: No authentication token
**السبب**: لم تقم بتسجيل الدخول
**الحل**: اذهب إلى صفحة تسجيل الدخول

### 🔐 الأمان والصلاحيات

لا تستخدم كلمات المرور الاختبار في الإنتاج. قم بـ:
1. تغيير كلمات المرور
2. إنشاء حسابات حقيقية
3. حذف حسابات الاختبار

### 📊 هيكل البيانات

يتم جلب البيانات من الجداول التالية:
- `projects` - المشاريع والطلبات
- `users` - بيانات المستخدمين والعملاء
- `services` - الخدمات المقدمة
- `payments` - السجلات المالية

### 🔗 الروابط ذات الصلة

- [Backend Manager Routes](../backend/routes/managerRoutes.js)
- [Frontend Manager Dashboard](../frontend/manager-dashboard.html)
- [Database Schema](../database/meds_schema.sql)
