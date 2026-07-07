# 🎨 نظام النماذج الديناميكية - دليل الاستخدام

## ✨ الميزات الجديدة

### ✅ تطوير الواجهة الأمامية

تم استبدال نوافذ الحوار البسيطة (`prompt`) بنماذج احترافية وديناميكية:

**قبل:**
```javascript
const title = prompt('عنوان الخدمة:');      // نافذة حوار بسيطة
const budget = prompt('الميزانية:');        // غير احترافية
```

**الآن:**
```javascript
const form = new DynamicForm({
  title: '📩 طلب خدمة جديدة',
  fields: [
    { name: 'title', label: 'عنوان الخدمة', type: 'text' },
    { name: 'budget', label: 'الميزانية', type: 'number' }
  ]
});
form.show();  // نموذج احترافي مع تحقق من البيانات
```

---

## 📋 أنواع الحقول المدعومة

### 1. **Text Input**
```javascript
{
  name: 'title',
  label: 'العنوان',
  type: 'text',
  placeholder: 'أدخل العنوان...',
  required: true
}
```

### 2. **Number Input**
```javascript
{
  name: 'budget',
  label: 'الميزانية',
  type: 'number',
  min: '0',
  required: true
}
```

### 3. **Email Input**
```javascript
{
  name: 'email',
  label: 'البريد الإلكتروني',
  type: 'email',
  required: true
}
```

### 4. **Textarea**
```javascript
{
  name: 'description',
  label: 'الوصف',
  type: 'textarea',
  rows: 5,
  placeholder: 'اشرح بالتفصيل...',
  required: true
}
```

### 5. **Select (Dropdown)**
```javascript
{
  name: 'service_id',
  label: 'نوع الخدمة',
  type: 'select',
  options: [
    { label: 'تطوير مواقع', value: '1' },
    { label: 'تسويق رقمي', value: '2' },
    { label: 'أمن سيبراني', value: '3' }
  ],
  required: true
}
```

### 6. **Checkbox**
```javascript
{
  name: 'agree',
  label: 'أوافق على الشروط والأحكام',
  type: 'checkbox',
  required: true
}
```

---

## 🛠️ كيفية الاستخدام

### مثال 1: نموذج بسيط
```javascript
const form = new DynamicForm({
  title: 'نموذج الاتصال',
  submitText: 'إرسال',
  fields: [
    {
      name: 'name',
      label: 'الاسم',
      type: 'text',
      required: true
    },
    {
      name: 'email',
      label: 'البريد الإلكتروني',
      type: 'email',
      required: true
    }
  ],
  onSubmit: (data) => {
    console.log('البيانات:', data);
    // { name: 'أحمد', email: 'ahmed@example.com' }
  }
});

form.show();
```

### مثال 2: نموذج معقد
```javascript
const form = new DynamicForm({
  title: '📩 طلب خدمة متقدم',
  submitText: 'إرسال الطلب',
  fields: [
    {
      name: 'service',
      label: 'نوع الخدمة',
      type: 'select',
      options: services,  // من API
      required: true
    },
    {
      name: 'title',
      label: 'عنوان المشروع',
      type: 'text',
      placeholder: 'مثال: موقع إلكتروني...',
      required: true
    },
    {
      name: 'description',
      label: 'الوصف التفصيلي',
      type: 'textarea',
      rows: 5,
      required: true
    },
    {
      name: 'budget',
      label: 'الميزانية (ريال)',
      type: 'number',
      min: '0',
      required: true
    },
    {
      name: 'urgent',
      label: 'هذا المشروع عاجل',
      type: 'checkbox'
    }
  ],
  onSubmit: async (data) => {
    // إرسال البيانات للـ API
    const response = await fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    // ...
  }
});

form.show();
```

---

## 🎨 الخصائص المتقدمة

### إنشاء نموذج مخصص

```javascript
const form = new DynamicForm({
  // معرف فريد (اختياري)
  id: 'my-custom-form',
  
  // عنوان النموذج
  title: '🎯 نموذج مخصص',
  
  // نصوص الأزرار
  submitText: 'تقديم',
  cancelText: 'الغاء',
  
  // الحقول
  fields: [
    { /* ... */ }
  ],
  
  // دالة عند الإرسال
  onSubmit: (data) => {
    console.log('تم الإرسال:', data);
  }
});
```

---

## 📱 الميزات

✅ **واجهة احترافية:**
- تصميم حديث وأنيق
- رسوم متحركة سلسة
- دعم Dark Mode

✅ **تجربة المستخدم:**
- تحقق تلقائي من البيانات
- رسائل خطأ واضحة
- اختفاء سلس عند الإغلاق

✅ **التوافقية:**
- أجهزة محمولة (Responsive)
- متصفحات حديثة
- دعم RTL كامل

✅ **سهولة الاستخدام:**
- واجهة برمجية بسيطة
- قابل للتخصيص بالكامل
- بدون تبعيات خارجية

---

## 🎯 الأزرار الوظيفية

### 1️⃣ طلب خدمة جديدة

```
الزر → openServiceRequestModal()
↓
عرض نموذج احترافي
↓
تجميع البيانات تلقائياً
↓
إرسال للـ API
↓
تحديث Dashboard
```

**الحقول:**
- نوع الخدمة (Select)
- عنوان الخدمة (Text)
- الوصف (Textarea)
- الميزانية (Number)

### 2️⃣ مراسلة الفريق

```
الزر → openMessageModal()
↓
عرض نموذج الرسالة
↓
معرف المشروع + النص
↓
إرسال للـ API
↓
تأكيد الإرسال
```

**الحقول:**
- معرف المشروع (Number)
- نص الرسالة (Textarea)

### 3️⃣ عرض الفواتير

```
الزر → viewInvoices()
↓
جلب الفواتير من API
↓
عرض في alert محسّن
```

---

## 💻 الملفات

### الملفات المضافة:

1. **`frontend/js/dynamicForms.js`** - كود النماذج الديناميكية
2. **`frontend/css/dynamicForms.css`** - تصميم النماذج

### الملفات المعدّلة:

1. **`frontend/client-dashboard.html`** - تحديث الأزرار والدوال

---

## 🚀 الميزات القادمة

- [ ] Validation Rules متقدمة
- [ ] File Upload في النماذج
- [ ] Multi-step Forms
- [ ] Auto-save Draft
- [ ] Form History
- [ ] Advanced Search
- [ ] Datepicker
- [ ] Color Picker

---

## 📊 مقارنة

| الميزة | قبل | بعد |
|--------|-----|-----|
| نوع الواجهة | نوافذ حوار بسيطة | نماذج احترافية |
| التحقق من البيانات | يدوي | تلقائي |
| التصميم | عادي | حديث وأنيق |
| الأجهزة المحمولة | ضعيف | متقدم |
| Animation | بدون | سلسة |
| Accessibility | محدود | كامل |

---

**النسخة:** 1.0.0
**التاريخ:** 2026-06-06
**الحالة:** ✅ جاهز للاستخدام
