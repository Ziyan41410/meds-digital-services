# 💬 نظام المحادثة المتقدم - MEDS Chat System

## 📋 المتطلبات الشاملة

### ✅ الميزات الأساسية (Phase 1)

#### 1. أنواع المحادثات
```
├── المحادثات الفردية (Direct Messages)
│   ├── 1-to-1 بين عميل ومبرمج
│   ├── 1-to-1 بين أي مستخدمين
│   └── حفظ تاريخ كامل
│
├── محادثات جماعية (Group Chats)
│   ├── مشروع واحد (العميل + فريق)
│   ├── أكثر من فريق
│   └── إدارة أعضاء (حذف، إضافة)
│
└── القنوات (Channels)
    ├── #تطوير، #تسويق، #دعم
    ├── رؤية محدودة للمشاركين
    └── أرشفة وتثبيت
```

#### 2. ميزات الرسائل
```
رسالة متكاملة تحتوي على:
├── محتوى
│   ├── نص عادي
│   ├── نص منسق (Markdown بسيط)
│   ├── روابط قابلة للنقر
│   └── mentions @user و @role
│
├── وسائط
│   ├── صور (JPG, PNG, GIF)
│   ├── ملفات (PDF, Word, Excel)
│   ├── فيديو قصير (تحميل / رابط YouTube)
│   ├── ملفات صوتية
│   └── موقع جغرافي (اختياري)
│
└── معلومات
    ├── المرسل + الوقت
    ├── الحالة (مرسل، تم التسليم، مقروء)
    ├── الرد والتعديل والحذف
    └── التفاعلات (emoji reactions)
```

#### 3. التفاعلات
```
✔️ Read Receipts
├── ✔ مرسل
├── ✔✔ تم التسليم
└── ✔✔🔵 تم القراءة + الوقت

📝 Typing Indicator
├── ظهور رسالة "أحمد يكتب..."
└── اختفاء بعد 3 ثواني من التوقف

👍 Reactions
├── 👍 لايك
├── ❤️ حب
├── 😂 ضاحك
├── 😮 مفاجأة
├── 😢 حزن
└── 😡 غضب + عد الإعجابات
```

#### 4. البحث والتصفية
```
بحث شامل:
├── البحث العام في جميع المحادثات
├── البحث داخل محادثة محددة
├── تصفية حسب نوع (صور، ملفات، روابط)
├── تصفية حسب الفترة الزمنية
└── البحث بالكلمات المفتاحية المتقدمة
```

### ⚡ الميزات المتقدمة (Phase 2)

#### 5. الإشعارات والترجيحات
```
إعدادات الإشعارات:
├── إشعارات رسالة جديدة
├── كتم إشعارات المحادثة
├── أصوات مخصصة
├── إشعارات الهاتف (Push notifications)
└── تجميع الإشعارات (لا تزعج وقت معين)
```

#### 6. المكالمات الصوتية
```
مكالمة صوتية P2P:
├── WebRTC للاتصال المباشر
├── جودة متكيفة
├── إظهار المدة
├── تسجيل المكالمة (اختياري)
└── تسجيل السجل
```

#### 7. التكامل مع الذكاء الاصطناعي
```
مساعد ذكي:
├── @ai اسأل سؤال
├── الرد التلقائي على الأسئلة الشائعة
├── تلخيص الرسائل الطويلة
└── ترجمة الرسائل
```

#### 8. الأرشفة والتصدير
```
إدارة البيانات:
├── تصدير محادثة (PDF)
├── تصدير البيانات الشخصية (JSON)
├── أرشفة محادثة (حفظ بدون حذف)
└── النسخ الاحتياطي التلقائي
```

---

## 🗄️ قاعدة البيانات

### جداول جديدة

```sql
-- الجداول المطلوبة
1. chats
   ├── id
   ├── type (direct, group, channel)
   ├── name (اسم المجموعة)
   ├── description
   ├── avatar
   ├── created_by
   ├── is_archived
   ├── is_pinned
   └── created_at, updated_at

2. chat_messages
   ├── id
   ├── chat_id
   ├── sender_id
   ├── content
   ├── edited_at
   ├── deleted_at
   ├── created_at
   └── updated_at

3. chat_attachments
   ├── id
   ├── message_id
   ├── file_url
   ├── file_type
   ├── file_size
   └── created_at

4. chat_participants
   ├── id
   ├── chat_id
   ├── user_id
   ├── role (member, admin, owner)
   ├── joined_at
   └── left_at

5. chat_reactions
   ├── id
   ├── message_id
   ├── user_id
   ├── emoji
   └── created_at

6. chat_read_receipts
   ├── id
   ├── message_id
   ├── user_id
   ├── read_at
   └── delivered_at

7. chat_notifications
   ├── id
   ├── user_id
   ├── chat_id
   ├── message_id
   ├── is_read
   └── created_at
```

---

## 🔌 API Endpoints

### المحادثات
```
GET    /api/chats                          # قائمة المحادثات
POST   /api/chats                          # إنشاء محادثة
GET    /api/chats/:id                      # تفاصيل محادثة
PUT    /api/chats/:id                      # تحديث المحادثة
DELETE /api/chats/:id                      # حذف محادثة
```

### الرسائل
```
GET    /api/chats/:id/messages?page=1     # جلب رسائل (pagination)
POST   /api/chats/:id/messages             # إرسال رسالة جديدة
PUT    /api/messages/:id                   # تعديل رسالة
DELETE /api/messages/:id                   # حذف رسالة
```

### الملفات والوسائط
```
POST   /api/messages/:id/upload            # رفع ملف
GET    /api/attachments/:id                # تحميل ملف
```

### التفاعلات
```
POST   /api/messages/:id/reactions         # إضافة رد فعل
DELETE /api/messages/:id/reactions/:emoji  # إزالة رد فعل
GET    /api/messages/:id/reactions         # قائمة الردود
```

### Read Receipts
```
POST   /api/messages/:id/read              # وضع علامة مقروء
GET    /api/chats/:id/read-status          # حالة القراءة
```

### البحث
```
GET    /api/chats/search?q=keyword&type=all
```

### الأعضاء
```
GET    /api/chats/:id/participants
POST   /api/chats/:id/participants         # إضافة عضو
DELETE /api/chats/:id/participants/:userId # حذف عضو
PUT    /api/chats/:id/participants/:userId # تحديث الصلاحيات
```

---

## 🔌 WebSocket Events (Socket.io)

### الاتصال والانفصال
```
socket.on('connect')                       # اتصال جديد
socket.on('disconnect')                    # قطع الاتصال
socket.emit('set_user', { userId })        # تعيين المستخدم
socket.emit('join_room', { chatId })       # الانضمام لغرفة
socket.emit('leave_room', { chatId })      # مغادرة الغرفة
```

### الرسائل
```
socket.emit('send_message', {
  chatId,
  content,
  attachments
})

socket.on('message_received', (message))   # استقبال رسالة
socket.on('message_edited', (message))     # تعديل رسالة
socket.on('message_deleted', (messageId))  # حذف رسالة
```

### الحالات
```
socket.emit('typing_start', { chatId })    # بدء الكتابة
socket.emit('typing_stop', { chatId })     # إيقاف الكتابة
socket.on('user_typing', (userName))       # إشعار كتابة

socket.emit('message_read', { messageId }) # علامة مقروء
socket.on('user_online', { userId })       # مستخدم متصل
socket.on('user_offline', { userId })      # مستخدم غير متصل
```

### التفاعلات
```
socket.emit('add_reaction', {
  messageId,
  emoji
})

socket.on('reaction_added', (data))
socket.on('reaction_removed', (data))
```

---

## 🎨 الواجهة الأمامية

### صفحات رئيسية
```
/chat                           # الصفحة الرئيسية للمحادثات
/chat/:id                       # نافذة محادثة مفتوحة
/chat/new                       # إنشاء محادثة جديدة
/chat/search                    # بحث
/chat/settings                  # الإعدادات
```

### المكونات
```
ChatList              # قائمة المحادثات
ChatWindow            # نافذة المحادثة
MessageItem           # عنصر رسالة واحدة
MessageInput          # حقل إدخال الرسالة
TypingIndicator       # مؤشر الكتابة
ReadReceipt           # علامة مقروء
ReactionPicker        # منتقي الرموز التعبيرية
ParticipantsList      # قائمة الأعضاء
```

---

## 🚀 خطة التطوير المرحلية

### Phase 1: الأساسيات (أسبوع 1-2)
- [ ] قاعدة البيانات والـ Schema
- [ ] API endpoints الأساسية
- [ ] صفحة المحادثات
- [ ] إرسال واستقبال الرسائل

### Phase 2: الميزات (أسبوع 3)
- [ ] Read receipts
- [ ] Typing indicator
- [ ] حذف وتعديل الرسائل
- [ ] الملفات والصور

### Phase 3: المتقدمة (أسبوع 4)
- [ ] Reactions والتفاعلات
- [ ] البحث والتصفية
- [ ] الإشعارات
- [ ] الأرشفة

### Phase 4: الاختيارية (أسبوع 5+)
- [ ] مكالمات صوتية
- [ ] مكالمات فيديو
- [ ] AI integration
- [ ] تصدير البيانات

---

## 📊 إحصائيات الأداء المتوقعة

```
الرسائل في الثانية:      1000+
التأخير (Latency):        < 100ms
حجم الرسالة:             5MB
عدد المشاركين في المجموعة: 500+
عمر الرسائل المخزنة:     سنتان
```

---

**الحالة:** 📝 جاهز للتطوير
**النسخة:** 1.0.0
**الأولوية:** عالية جداً
