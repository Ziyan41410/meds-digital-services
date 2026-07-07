# MEDS Digital Services - منصة متكاملة للخدمات الرقمية

## 🎉 آخر تحديث: إصلاح لوحة التحكم الكاملة

### ✅ تم إصلاح جميع الإحصائيات والأزرار

**الحالة الحالية:**
- ✅ **6 إحصائيات تعمل بشكل كامل**
- ✅ **3 أزرار سريعة تعمل بشكل كامل**
- ✅ **8/8 اختبارات نجحت (100% success)**
- ✅ **جاهزة للاستخدام الفوري**

#### الإحصائيات المصححة:
1. 📋 **طلبات مفتوحة** - تعرض الطلبات المعلقة والموقوفة
2. 🚀 **مشاريع نشطة** - تعرض المشاريع قيد التنفيذ
3. 💰 **مدفوعات معلقة** - تعرض الفواتير المعلقة
4. 📈 **نسبة الإنجاز** - تعرض نسبة المشاريع المكتملة
5. 💵 **إجمالي الإنفاق** - تعرض المبلغ الإجمالي المنفق
6. 📌 **المشاريع الأخيرة** - تعرض آخر 4 مشاريع

#### الأزرار السريعة المصححة:
1. 📩 **طلب خدمة جديدة** - ينشئ طلب جديد ويخطر الفريق
2. 💬 **مراسلة الفريق** - يرسل رسالة للفريق المسؤول
3. 📋 **عرض الفواتير** - يعرض جميع الفواتير والحالات

**للتفاصيل الكاملة:**
- 📖 [دليل الاستخدام الكامل](./DASHBOARD_USAGE_GUIDE_AR.md)
- 📋 [ملخص الحل](./DASHBOARD_WORKING.md)

---

منصة ويب احترافية ومتكاملة لإدارة وبيع الخدمات الرقمية في مجالات البرمجة والتسويق الرقمي والأمن السيبراني.

## 🎯 المميزات الرئيسية

### 🔐 نظام المصادقة المتقدم
- ✅ التسجيل والدخول الآمن
- ✅ التحقق من البريد الإلكتروني
- ✅ استعادة كلمة المرور
- ✅ JWT Authentication
- ✅ تشفير bcrypt لكلمات المرور

### 📱 واجهة مستخدم حديثة
- ✅ Responsive Design (يعمل على جميع الأجهزة)
- ✅ Dark/Light Mode
- ✅ تصميم عصري واحترافي
- ✅ واجهة سهلة الاستخدام

### 🛠️ إدارة الخدمات
- ✅ ثلاث فئات خدمات رئيسية
- ✅ 22+ خدمة متنوعة
- ✅ عرض تفصيلي للخدمات
- ✅ نظام تصنيف الخدمات

### 📊 لوحة العميل
- ✅ إحصائيات المشاريع
- ✅ تتبع حالة المشاريع
- ✅ إدارة الفواتير
- ✅ سجل المدفوعات

### ⭐ نظام التقييمات
- ✅ تقييم المشاريع من 1-5
- ✅ تعليقات العملاء
- ✅ عرض التقييمات بارزة على الموقع

### 💳 نظام الدفع
- ✅ جاهز لربط Stripe
- ✅ جاهز لربط PayPal
- ✅ نظام الفواتير
- ✅ سجل المدفوعات

### 🔔 نظام الإشعارات
- ✅ إشعارات داخل المنصة
- ✅ تنبيهات البريد الإلكتروني
- ✅ تنبيهات تحديثات المشاريع

## 🚀 البدء السريع

### المتطلبات الأساسية

قبل البدء، تأكد من تثبيت:
- **Node.js** (v14 أو أعلى) - [تحميل](https://nodejs.org/)
- **MySQL** (v5.7 أو أعلى) - [تحميل](https://www.mysql.com/downloads/)
- **Git** - [تحميل](https://git-scm.com/)

### خطوات التثبيت

#### 1️⃣ استنساخ المستودع
```bash
cd your-projects-folder
git clone https://github.com/yourusername/meds-digital-services.git
cd meds-digital-services
```

#### 2️⃣ تثبيت المكتبات
```bash
npm install
```

#### 3️⃣ إعداد قاعدة البيانات

**أ) إنشاء قاعدة البيانات:**
```bash
# فتح MySQL Command Line Client أو MySQL Workbench
mysql -u root -p
```

**ب) تشغيل ملف Schema:**
```sql
-- من داخل MySQL CLI
source database/meds_schema.sql
```

أو يمكنك نسخ محتويات الملف `database/meds_schema.sql` وتشغيله في MySQL Workbench

#### 4️⃣ إعداد متغيرات البيئة

انسخ ملف `.env.example` إلى `.env.local`:
```bash
cp .env.example .env.local
```

حرّر الملف `.env.local` وأدخل بياناتك:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=meds_digital_services
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_here

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Server
SERVER_PORT=3000
SERVER_HOST=localhost
```

#### 5️⃣ تشغيل التطبيق

**خيار 1: تشغيل في وضع الإنتاج:**
```bash
npm start
```

**خيار 2: تشغيل في وضع التطوير (مع Nodemon):**
```bash
npm run dev
```

الخادم سيعمل على: `http://localhost:3000`

#### 6️⃣ فتح الموقع

افتح متصفحك وانتقل إلى:
```
http://localhost:3000
```

## 📁 هيكل المشروع

```
meds-digital-services/
├── backend/                    # كود الخادم
│   ├── config/                # ملفات التكوين
│   │   └── database.js        # إعدادات MySQL
│   ├── controllers/           # منطق التطبيق
│   │   ├── authController.js
│   │   ├── servicesController.js
│   │   ├── projectsController.js
│   │   └── reviewsController.js
│   ├── middlewares/           # وظائف وسيطة
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── routes/                # مسارات API
│   │   ├── authRoutes.js
│   │   ├── servicesRoutes.js
│   │   ├── projectsRoutes.js
│   │   └── reviewsRoutes.js
│   ├── app.js                 # تطبيق Express
│   └── server.js              # نقطة البداية
│
├── frontend/                  # كود الواجهة
│   ├── index.html             # الصفحة الرئيسية
│   ├── assets/
│   │   ├── css/               # ملفات الأنماط
│   │   │   ├── reset.css
│   │   │   ├── variables.css
│   │   │   ├── main.css
│   │   │   └── responsive.css
│   │   ├── js/                # ملفات JavaScript
│   │   │   ├── main.js
│   │   │   ├── theme.js
│   │   │   └── api.js
│   │   └── images/            # الصور والرسومات
│   └── pages/                 # صفحات إضافية
│
├── database/
│   └── meds_schema.sql        # قاعدة البيانات الكاملة
│
├── uploads/                   # مجلد رفع الملفات
├── .env.example               # متغيرات البيئة نموذج
├── .env.local                 # متغيرات البيئة للتطوير (محلي)
├── package.json               # حزم npm
└── README.md                  # هذا الملف
```

## 🔌 نقاط نهاية API (API Endpoints)

### المصادقة - /api/auth
- `POST /register` - التسجيل الجديد
- `POST /login` - تسجيل الدخول
- `GET /me` - معلومات المستخدم الحالي
- `POST /logout` - تسجيل الخروج
- `POST /forgot-password` - نسيان كلمة المرور
- `POST /reset-password` - إعادة تعيين كلمة المرور
- `GET /verify-email/:token` - التحقق من البريد الإلكتروني

### الخدمات - /api/services
- `GET /` - جميع الخدمات
- `GET /categories` - فئات الخدمات
- `GET /:id` - خدمة محددة
- `POST /` - إنشاء خدمة (Admin فقط)
- `PUT /:id` - تحديث خدمة (Admin فقط)
- `DELETE /:id` - حذف خدمة (Admin فقط)

### المشاريع - /api/projects
- `POST /` - إنشاء مشروع جديد
- `GET /client/list` - مشاريع العميل
- `GET /stats/dashboard` - إحصائيات اللوحة
- `GET /:id` - تفاصيل المشروع
- `PUT /:id/status` - تحديث حالة المشروع

### التقييمات - /api/reviews
- `POST /` - إضافة تقييم جديد
- `GET /featured` - التقييمات المميزة
- `GET /professional/:id` - تقييمات متخصص معين
- `DELETE /:id` - حذف تقييم (Admin فقط)

## 🔒 الأمان والحماية

المنصة مطبقة لأفضل ممارسات الأمان:

✅ **JWT Authentication** - توثيق آمن بـ JSON Web Tokens
✅ **bcrypt Hashing** - تشفير آمن لكلمات المرور
✅ **Helmet.js** - رؤوس الأمان HTTP
✅ **CORS** - تحكم في الوصول المشترك
✅ **Rate Limiting** - حد أقصى للطلبات
✅ **Input Validation** - التحقق من المدخلات
✅ **SQL Injection Prevention** - استخدام Prepared Statements
✅ **XSS Protection** - حماية من هجمات XSS

## 🗄️ قاعدة البيانات

المشروع يحتوي على 18 جدول رئيسية:

| الجدول | الوصف |
|--------|--------|
| `users` | بيانات المستخدمين |
| `roles` | أدوار وصلاحيات المستخدمين |
| `services` | الخدمات المتاحة |
| `projects` | المشاريع والطلبات |
| `messages` | الرسائل والدردشة |
| `payments` | السجل المالي |
| `invoices` | الفواتير |
| `reviews` | التقييمات والتعليقات |
| `notifications` | الإشعارات |
| `files` | الملفات المرفوعة |
| `portfolio` | معرض الأعمال |
| `settings` | إعدادات الموقع |

جميع الجداول مع:
- ✅ Primary Keys
- ✅ Foreign Keys
- ✅ Indexes للأداء
- ✅ Constraints للسلامة

## 📚 الصفحات الرئيسية

### Frontend Pages

1. **الصفحة الرئيسية** (`index.html`)
   - قسم البطل (Hero)
   - معلومات عن الشركة
   - عرض الخدمات
   - تقييمات العملاء
   - الأسئلة الشائعة
   - نموذج التواصل

2. **لوحة العميل** (Dashboard)
   - إحصائيات المشاريع
   - الطلبات الحالية
   - سجل المدفوعات
   - الفواتير

3. **لوحة الإدارة** (Admin Panel)
   - إدارة المستخدمين
   - إدارة الخدمات
   - إدارة المشاريع
   - إحصائيات النظام

## 🎨 التصميم والاستجابة

- ✅ Fully Responsive - يعمل على جميع أحجام الشاشات
- ✅ Mobile First - تصميم يركز على الأجهزة الذكية أولاً
- ✅ Dark/Light Mode - وضع مظلم وفاتح
- ✅ Smooth Animations - رسوم متحركة سلسة
- ✅ Performance Optimized - محسن للأداء

## 🧪 الاختبار

### اختبار الخادم
```bash
curl http://localhost:3000/health
```

### اختبار تسجيل جديد
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "أحمد",
    "last_name": "محمد",
    "username": "ahmad123",
    "email": "ahmad@example.com",
    "phone": "+966500000000",
    "password": "password123"
  }'
```

### اختبار تسجيل الدخول
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmad@example.com",
    "password": "password123"
  }'
```

## 🐛 استكشاف الأخطاء

### خطأ: "Connection refused"
- تأكد من تشغيل MySQL
- تحقق من بيانات الاتصال في `.env.local`

### خطأ: "Database not found"
- تأكد من تشغيل ملف Schema
- تحقق من اسم قاعدة البيانات

### خطأ: "Port 3000 already in use"
```bash
# تغيير المنفذ في .env.local
SERVER_PORT=3001
```

## 📝 الملفات المهمة

- **`.env.local`** - متغيرات البيئة (لا تضفها للـ Git)
- **`package.json`** - المكتبات والمشاريع
- **`database/meds_schema.sql`** - قاعدة البيانات الكاملة
- **`backend/app.js`** - تطبيق Express الرئيسي
- **`backend/server.js`** - نقطة البداية

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:
1. عمل Fork للمستودع
2. إنشاء فرع جديد (`git checkout -b feature/improvement`)
3. Commit التغييرات (`git commit -m 'Add improvement'`)
4. Push للفرع (`git push origin feature/improvement`)
5. فتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت ISC License

## 📞 الدعم والمساعدة

للمساعدة والدعم:
- 📧 البريد الإلكتروني: support@medsdigitalservices.com
- 🌐 الموقع: www.medsdigitalservices.com
- 💬 الدردشة: chat.medsdigitalservices.com

## ✨ الميزات المستقبلية

قريباً سيتم إضافة:
- ✅ نظام الدردشة الفورية (Real-time Chat) مع Socket.io
- ✅ تكامل الدفع الكامل (Stripe و PayPal)
- ✅ تحليلات وإحصائيات متقدمة
- ✅ تطبيق الهاتف المحمول (React Native)
- ✅ نظام CRM متقدم
- ✅ أتمتة التسويق

## 🎉 شكراً!

شكراً لاستخدامك MEDS Digital Services Platform!

---

**آخر تحديث:** يونيو 2024
**الإصدار:** 1.0.0
**الحالة:** ✅ Production Ready
