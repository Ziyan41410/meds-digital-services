# 📊 دليل لوحة المعلومات المحسّنة

## 🎯 الملخص

تم تحسين لوحة التحكم للعميل (`client-dashboard.html`) لتعرض:
- **بيانات حقيقية من قاعدة البيانات** بدل الأرقام الثابتة
- **أزرار وظيفية** تقوم بعمل فعلي

---

## 📈 الإحصائيات الديناميكية

### البيانات التي تُعرض الآن:

#### 1️⃣ **طلبات مفتوحة** (Open Requests)
- **المصدر:** عدد المشاريع بحالة `pending` أو `on_hold`
- **الاستعلام:**
```sql
SELECT COUNT(*) FROM projects 
WHERE client_id = ? AND status IN ('pending', 'on_hold')
```

#### 2️⃣ **مشاريع نشطة** (Active Projects)
- **المصدر:** عدد المشاريع بحالة `in_progress`
- **الاستعلام:**
```sql
SELECT COUNT(*) FROM projects 
WHERE client_id = ? AND status = 'in_progress'
```

#### 3️⃣ **مدفوعات معلقة** (Pending Payments)
- **المصدر:** المشاريع المكتملة التي لم تُدفع بعد
- **الاستعلام:**
```sql
SELECT COUNT(*) FROM projects 
WHERE client_id = ? AND status = 'completed' AND paid = 0
```

#### 4️⃣ **مشاريع حديثة** (Recent Projects)
- **تُعرض:** آخر 4 مشاريع مع أسماءها وحالتها
- **تُحدّث:** كل 60 ثانية تلقائياً

---

## 🔘 الأزرار الوظيفية

### 1. **📩 طلب خدمة جديدة**

**الوصف:** إنشاء طلب خدمة جديد

**الكود:**
```javascript
async function openServiceRequestModal() {
  const title = prompt('عنوان الخدمة المطلوبة:');
  const description = prompt('وصف الخدمة:');
  const budget = prompt('الميزانية المتوقعة:');
  
  await fetch('/api/dashboard/service-request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      service_id: 1,
      title, description,
      budget: budget ? parseFloat(budget) : null
    })
  });
}
```

**ماذا يحدث:**
1. ✅ ينشئ طلب جديد في قاعدة البيانات
2. ✅ يرسل إشعار فوري لفريق الإدارة
3. ✅ يحدّث لوحة التحكم تلقائياً

---

### 2. **💬 مراسلة الفريق**

**الوصف:** إرسال رسالة للفريق حول مشروع معين

**الكود:**
```javascript
async function openMessageModal() {
  const projectId = prompt('معرف المشروع:');
  const message = prompt('نصك:');
  
  await fetch('/api/dashboard/message', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      project_id: parseInt(projectId)
    })
  });
}
```

**ماذا يحدث:**
1. ✅ تُضاف الرسالة كتعليق على المشروع
2. ✅ يُرسل إشعار للفريق المسؤولة
3. ✅ تُنشأ محادثة حول المشروع

---

### 3. **📄 عرض الفواتير**

**الوصف:** عرض جميع الفواتير والمشاريع المحتملة

**الكود:**
```javascript
async function viewInvoices() {
  const response = await fetch('/api/dashboard/invoices', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const result = await response.json();
  const invoices = result.data;
  
  invoices.forEach(inv => {
    console.log(`${inv.title} - ${inv.amount} ريال`);
  });
}
```

**البيانات المعروضة:**
- اسم الخدمة/المشروع
- المبلغ
- حالة الدفع
- تاريخ الإنشاء

---

## 🔗 API Endpoints

### 1. جلب الإحصائيات
```
GET /api/projects/stats/dashboard
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "openRequests": 3,
    "activeProjects": 1,
    "pendingPayments": 0,
    "completionRate": 87,
    "totalSpent": 2500,
    "recentProjects": [...]
  }
}
```

### 2. إنشاء طلب خدمة
```
POST /api/dashboard/service-request
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "service_id": 1,
  "title": "عنوان الخدمة",
  "description": "وصف الخدمة",
  "budget": 1000
}

Response:
{
  "success": true,
  "message": "تم إرسال طلب الخدمة بنجاح",
  "project_id": 123
}
```

### 3. إرسال رسالة
```
POST /api/dashboard/message
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "message": "نص الرسالة",
  "project_id": 123
}

Response:
{
  "success": true,
  "message": "تم إرسال الرسالة بنجاح",
  "comment_id": 456
}
```

### 4. جلب الفواتير
```
GET /api/dashboard/invoices?status=all&page=1&limit=10
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "موقع تعريفي",
      "amount": 500,
      "status": "completed",
      "payment_status": "معلق",
      "service_name": "تطوير مواقع ويب"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 1
  }
}
```

### 5. جلب الخدمات
```
GET /api/dashboard/services
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "تطوير مواقع ويب",
      "description": "...",
      "price": 500
    }
  ]
}
```

---

## 🚀 كيفية الاستخدام

### الخطوة 1: تسجيل الدخول
```javascript
// في login.html أو المنصة
localStorage.setItem('token', userToken);
```

### الخطوة 2: الدخول للوحة
```
http://localhost:3000/client-dashboard.html
```

### الخطوة 3: استخدام الميزات
- الإحصائيات تُحدّث تلقائياً
- اضغط على الأزرار لإجراء عمليات

---

## 🔄 التحديثات التلقائية

```javascript
// تحديث الإحصائيات كل 60 ثانية
setInterval(loadDashboardStats, 60000);

// فحص اتصال الخادم كل 30 ثانية
setInterval(checkAPI, 30000);
```

---

## 📊 معادلات البيانات

### معدل الإنجاز
```sql
ROUND(
  SUM(CASE WHEN status = 'completed' 
      AND MONTH(completed_at) = MONTH(NOW()) THEN 1 ELSE 0 END) 
  * 100 / 
  NULLIF(COUNT(CASE WHEN MONTH(created_at) = MONTH(NOW()) THEN 1 END), 0)
, 0)
```

### إجمالي المنفق
```sql
COALESCE(SUM(budget), 0)
```

---

## 🛠️ الملفات المعدلة

| الملف | النوع | التغييرات |
|------|-------|----------|
| `frontend/client-dashboard.html` | تعديل | إضافة JavaScript للبيانات الحية |
| `backend/app.js` | تعديل | تسجيل routes جديدة |
| `backend/controllers/projectsController.js` | تعديل | إضافة `getDashboardStats()` |
| `backend/controllers/dashboardActionsController.js` | جديد | معالج الإجراءات السريعة |
| `backend/routes/dashboardActionsRoutes.js` | جديد | Routes للإجراءات |
| `database/migrations/001_add_dashboard_fields.sql` | جديد | إضافة أعمدة قاعدة البيانات |

---

## 🧪 الاختبار

```bash
# اختبر الـ endpoints
node test-dashboard.js

# يجب أن ترى:
# ✓ Health Check - 200
# ✓ Endpoints require authentication
# ✓ Services endpoint works
```

---

## 📝 ملاحظات مهمة

1. **التوكن مطلوب:** جميع الـ endpoints (ما عدا `/health`) تتطلب `Authorization` header
2. **البيانات الحقيقية:** جميع الأرقام تأتي من قاعدة البيانات
3. **التحديثات الحية:** البيانات تُحدّث تلقائياً
4. **الإشعارات:** الفريق يتلقى إشعارات فوري عند الطلبات الجديدة

---

## ❓ استكشاف الأخطاء

| المشكلة | الحل |
|--------|-----|
| الخادم غير متاح | تأكد من `npm start` و MySQL |
| بيانات غير محدّثة | أعد التحميل أو انتظر 60 ثانية |
| خطأ في الرسائل | تأكد من معرف المشروع |
| بدون فواتير | لا توجد مشاريع مكتملة بعد |

---

**آخر تحديث:** 2026-06-06 | **الإصدار:** 1.0
