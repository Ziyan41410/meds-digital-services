# لوحة المعلومات المحسّنة - MEDS Digital Services

## ✅ الميزات الجديدة

### 1. **إحصائيات ديناميكية من قاعدة البيانات**

لوحة المعلومات الآن تستقبل بيانات حقيقية من قاعدة البيانات بدل الأرقام الثابتة:

#### المقاييس الرئيسية:
- **طلبات مفتوحة** - عدد الطلبات المعلقة والموقوفة مؤقتاً
- **مشاريع نشطة** - عدد المشاريع قيد التنفيذ
- **مدفوعات معلقة** - عدد المشاريع المكتملة التي لم تُدفع بعد
- **معدل الإنجاز** - نسبة المشاريع المكتملة هذا الشهر
- **إجمالي المنفق** - مجموع ميزانيات جميع المشاريع

#### البيانات الحية:
- المشاريع الأخيرة مع أسماءها وحالاتها
- تحديث تلقائي كل دقيقة

### 2. **الأزرار الوظيفية**

#### 📩 **طلب خدمة جديدة**
```javascript
POST /api/dashboard/service-request
Body: {
  service_id: 1,
  title: "عنوان الخدمة",
  description: "وصف الخدمة",
  budget: 1000
}
Response: {
  success: true,
  message: "تم إرسال طلب الخدمة بنجاح",
  project_id: 123
}
```

**الوظيفة:**
- إنشاء طلب خدمة جديد
- إرسال إشعار فوري لفريق الإدارة
- تسجيل الطلب في قاعدة البيانات

#### 💬 **مراسلة الفريق**
```javascript
POST /api/dashboard/message
Body: {
  message: "نص الرسالة",
  project_id: 123
}
Response: {
  success: true,
  message: "تم إرسال الرسالة بنجاح",
  comment_id: 456
}
```

**الوظيفة:**
- إضافة تعليق على المشروع
- إشعار الفريق المسؤولة
- إنشاء محادثة حول المشروع

#### 📄 **عرض الفواتير**
```javascript
GET /api/dashboard/invoices?status=all&page=1&limit=10
Response: {
  success: true,
  data: [
    {
      id: 1,
      title: "موقع تعريفي",
      amount: 500,
      status: "completed",
      payment_status: "معلق",
      service_name: "تطوير مواقع ويب"
    }
  ],
  pagination: { ... }
}
```

**الوظيفة:**
- عرض جميع الفواتير والمشاريع المحتملة
- تصفية حسب الحالة
- عرض حالة الدفع

### 3. **API Endpoints الجديدة**

| الطريقة | المسار | الوصف |
|--------|--------|-------|
| GET | `/api/projects/stats/dashboard` | جلب إحصائيات لوحة التحكم |
| POST | `/api/dashboard/service-request` | إنشاء طلب خدمة |
| POST | `/api/dashboard/message` | إرسال رسالة |
| GET | `/api/dashboard/invoices` | جلب الفواتير |
| GET | `/api/dashboard/services` | جلب قائمة الخدمات |
| GET | `/api/dashboard/messages/:projectId` | جلب رسائل المشروع |

### 4. **المراقب (Controllers) الجديدة**

#### `dashboardActionsController.js`
- `createServiceRequest()` - إنشاء طلب خدمة
- `sendMessageToTeam()` - إرسال رسالة
- `getInvoices()` - جلب الفواتير
- `getAvailableServices()` - جلب الخدمات
- `getProjectMessages()` - جلب رسائل المشروع

#### `projectsController.js` (محدثة)
- `getDashboardStats()` - جلب الإحصائيات الديناميكية (جديدة)

### 5. **البيانات المحسّنة في قاعدة البيانات**

تمت إضافة الأعمدة التالية تلقائياً عند بدء السيرفر:

```sql
-- جدول projects
ALTER TABLE projects ADD COLUMN paid BOOLEAN DEFAULT FALSE;

-- جدول messages  
ALTER TABLE messages ADD COLUMN message_type VARCHAR(50) DEFAULT 'direct';
ALTER TABLE messages ADD COLUMN related_project_id INT;
```

## 🚀 كيفية الاستخدام

### 1. تشغيل السيرفر
```bash
npm start
```

### 2. الوصول إلى لوحة التحكم
```
http://localhost:3000/client-dashboard.html
```

### 3. البيانات تُحدّث تلقائياً
- الإحصائيات تُحدّث كل 60 ثانية
- الخادم يُتحقق كل 30 ثانية

## 📊 مثال على البيانات الديناميكية

### قبل التحسين:
```javascript
animateCounter(document.getElementById('openRequests'), 3);  // أرقام ثابتة
animateCounter(document.getElementById('activeProjects'), 1);
```

### بعد التحسين:
```javascript
// بيانات حقيقية من قاعدة البيانات
const response = await fetch('/api/projects/stats/dashboard');
const data = await response.json();
animateCounter(document.getElementById('openRequests'), data.openRequests);
animateCounter(document.getElementById('activeProjects'), data.activeProjects);
```

## 🔐 المصادقة

جميع الـ endpoints تتطلب توكن JWT في الـ header:

```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

## 🐛 استكشاف الأخطاء

### الخطأ: "الخادم غير متاح"
- تأكد من تشغيل السيرفر: `npm start`
- تحقق من أن قاعدة البيانات تعمل

### الخطأ: "فشل تحميل البيانات"
- تأكد من صحة التوكن
- تحقق من البيانات في قاعدة البيانات

## 📝 الملفات المعدلة

1. **frontend/client-dashboard.html** - إضافة JavaScript للبيانات الحية
2. **backend/app.js** - تسجيل الـ routes الجديدة
3. **backend/controllers/projectsController.js** - إضافة getDashboardStats()
4. **backend/controllers/dashboardActionsController.js** - جديد
5. **backend/routes/dashboardActionsRoutes.js** - جديد
6. **database/migrations/001_add_dashboard_fields.sql** - جديد

## 🎯 الخطوات التالية (اختيارية)

1. إضافة رسوم بيانية (Chart.js)
2. تقارير متقدمة
3. تنبيهات ذكية
4. إحصائيات الأداء
5. نظام الدفع المتقدم

---

**آخر تحديث:** 2026-06-06
