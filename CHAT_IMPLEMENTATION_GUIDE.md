# 💬 نظام المحادثة المتقدم - دليل استخدام شامل

## 📋 المحتويات
1. [البدء السريع](#البدء-السريع)
2. [API Endpoints](#api-endpoints)
3. [WebSocket Events](#websocket-events)
4. [أمثلة عملية](#أمثلة-عملية)
5. [الميزات المتقدمة](#الميزات-المتقدمة)
6. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## 🚀 البدء السريع

### الوصول إلى صفحة المحادثات
```
http://localhost:3000/chats.html
```

### تسجيل الدخول المطلوب
- يجب أن تكون مسجل دخول بـ JWT token
- Token يتم حفظه في `localStorage` تحت مفتاح `token`

### الخطوات الأولى
1. **فتح صفحة المحادثات** - سيتم الاتصال تلقائياً بـ WebSocket
2. **إنشاء محادثة** - اضغط على زر "+" في الجانب الأيسر
3. **اختر النوع**:
   - ✅ محادثة مباشرة (1-to-1)
   - ✅ مجموعة (Group)
   - ✅ قناة (Channel)
4. **اختر المشاركين** وانقر "إنشاء"
5. **ابدأ الدردشة** - اكتب رسالة وأرسلها

---

## 🔌 API Endpoints

### الحصول على المحادثات
```bash
GET /api/chats
Authorization: Bearer <token>
```

**الرد:**
```json
{
  "success": true,
  "message": "تم جلب المحادثات بنجاح",
  "data": [
    {
      "id": 1,
      "type": "direct",
      "name": null,
      "description": null,
      "member_count": 2,
      "last_message": "مرحبا",
      "last_message_at": "2026-06-06T21:30:00Z",
      "unread_count": 3
    }
  ]
}
```

### إنشاء محادثة جديدة
```bash
POST /api/chats
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "direct",
  "name": null,
  "participantIds": [2, 3]
}
```

**الرد:**
```json
{
  "success": true,
  "message": "تم إنشاء المحادثة بنجاح",
  "data": {
    "id": 5
  }
}
```

### جلب رسائل محادثة
```bash
GET /api/chats/1/messages?page=1&limit=20
Authorization: Bearer <token>
```

**الرد:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 10,
        "chat_id": 1,
        "sender_id": 2,
        "sender_name": "أحمد محمد",
        "sender_avatar": "/uploads/user2.jpg",
        "content": "مرحبا",
        "created_at": "2026-06-06T21:30:00Z",
        "edited_at": null,
        "deleted_at": null,
        "reaction_count": 2,
        "read_count": 1,
        "reactions": [
          { "emoji": "👍", "count": 1 },
          { "emoji": "❤️", "count": 1 }
        ]
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

### إرسال رسالة عبر REST API
```bash
POST /api/chats/1/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "مرحبا بالجميع!",
  "replyToId": null
}
```

### تعديل رسالة
```bash
PUT /api/messages/10
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "مرحبا بالجميع! (تم التعديل)"
}
```

### حذف رسالة
```bash
DELETE /api/messages/10
Authorization: Bearer <token>
```

### إضافة تفاعل (Emoji)
```bash
POST /api/messages/10/reactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "emoji": "👍"
}
```

### إزالة تفاعل
```bash
DELETE /api/messages/10/reactions/👍
Authorization: Bearer <token>
```

### وضع علامة مقروء
```bash
POST /api/messages/10/read
Authorization: Bearer <token>
```

### جلب أعضاء المحادثة
```bash
GET /api/chats/1/participants
Authorization: Bearer <token>
```

### إضافة عضو إلى المحادثة
```bash
POST /api/chats/1/participants
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 4
}
```

### إزالة عضو من المحادثة
```bash
DELETE /api/chats/1/participants/4
Authorization: Bearer <token>
```

### البحث في المحادثات
```bash
GET /api/chats/search?q=أحمد&type=all
Authorization: Bearer <token>
```

---

## 🔌 WebSocket Events

### الاتصال والاعداد

#### 1. تعيين المستخدم
```javascript
socket.emit('set_user', { userId: 1 });

socket.on('user_set', (data) => {
  console.log('User set:', data.userId);
});
```

#### 2. الانضمام لغرفة محادثة
```javascript
socket.emit('join_room', { 
  chatId: 1, 
  userId: 1 
});

socket.on('room_joined', (data) => {
  console.log('Joined room:', data.roomName);
});
```

#### 3. مغادرة الغرفة
```javascript
socket.emit('leave_room', { chatId: 1 });

socket.on('user_left', (data) => {
  console.log('User left:', data.userId);
});
```

---

### إرسال واستقبال الرسائل

#### إرسال رسالة
```javascript
socket.emit('send_message', {
  chatId: 1,
  content: 'مرحبا الجميع',
  replyToId: null
});
```

#### استقبال رسالة جديدة
```javascript
socket.on('message_received', (message) => {
  console.log('New message:', message);
  // {
  //   id: 10,
  //   chat_id: 1,
  //   sender_id: 2,
  //   sender_name: 'أحمد',
  //   sender_avatar: '/uploads/user.jpg',
  //   content: 'مرحبا الجميع',
  //   created_at: '2026-06-06T21:30:00Z'
  // }
});
```

#### تعديل رسالة
```javascript
socket.emit('edit_message', {
  messageId: 10,
  content: 'مرحبا (تم التعديل)',
  chatId: 1
});

socket.on('message_edited', (data) => {
  console.log('Message edited:', data);
});
```

#### حذف رسالة
```javascript
socket.emit('delete_message', {
  messageId: 10,
  chatId: 1
});

socket.on('message_deleted', (data) => {
  console.log('Message deleted:', data.messageId);
});
```

---

### مؤشر الكتابة

#### بدء الكتابة
```javascript
socket.emit('typing_start', {
  chatId: 1,
  userName: 'أحمد'
});
```

#### استقبال إشعار الكتابة
```javascript
socket.on('user_typing', (data) => {
  console.log(`${data.userName} يكتب...`);
});
```

#### إيقاف الكتابة
```javascript
socket.emit('typing_stop', { chatId: 1 });

socket.on('user_typing_stop', (data) => {
  console.log('User stopped typing');
});
```

---

### التفاعلات (Reactions)

#### إضافة تفاعل
```javascript
socket.emit('add_reaction', {
  messageId: 10,
  emoji: '👍',
  chatId: 1
});

socket.on('reaction_added', (data) => {
  console.log(`${data.emoji} added by user ${data.userId}`);
});
```

#### إزالة تفاعل
```javascript
socket.emit('remove_reaction', {
  messageId: 10,
  emoji: '👍',
  chatId: 1
});

socket.on('reaction_removed', (data) => {
  console.log('Reaction removed');
});
```

---

### علامات القراءة

#### وضع علامة مقروء
```javascript
socket.emit('message_read', {
  messageId: 10,
  chatId: 1
});

socket.on('message_read_receipt', (data) => {
  console.log(`Message ${data.messageId} read by ${data.userId}`);
});
```

---

### حالة المستخدم

#### المستخدم متصل
```javascript
socket.on('user_online', (data) => {
  console.log(`User ${data.userId} is online`);
});
```

#### المستخدم غير متصل
```javascript
socket.on('user_offline', (data) => {
  console.log(`User ${data.userId} is offline`);
});
```

---

### الإشعارات

```javascript
socket.on('notification', (notification) => {
  // {
  //   type: 'message',
  //   chatId: 1,
  //   messageId: 10,
  //   senderName: 'أحمد'
  // }
  console.log(`${notification.senderName} أرسل رسالة`);
});
```

---

## 📝 أمثلة عملية

### مثال 1: إنشاء محادثة مباشرة
```javascript
// 1. طلب REST API لإنشاء محادثة
fetch('/api/chats', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'direct',
    participantIds: [2]
  })
})
.then(res => res.json())
.then(data => {
  const chatId = data.data.id;
  
  // 2. الانضمام للغرفة عبر Socket
  socket.emit('join_room', { chatId, userId: currentUserId });
});
```

### مثال 2: إرسال رسالة مع مراقبة التفاعلات
```javascript
// إرسال الرسالة
socket.emit('send_message', {
  chatId: 1,
  content: 'رسالة تجريبية'
});

// مراقبة الرسالة الجديدة
socket.on('message_received', (message) => {
  displayMessage(message);
  
  // مراقبة التفاعلات على الرسالة
  socket.on('reaction_added', (data) => {
    if (data.messageId === message.id) {
      updateReactionCount(message.id, data.emoji);
    }
  });
});
```

### مثال 3: تطبيق typing indicator
```javascript
const messageInput = document.getElementById('messageInput');
let typingTimeout;

messageInput.addEventListener('input', () => {
  socket.emit('typing_start', { 
    chatId: currentChatId, 
    userName: currentUserName 
  });
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing_stop', { chatId: currentChatId });
  }, 3000);
});

socket.on('user_typing', (data) => {
  showTypingIndicator(`${data.userName} يكتب...`);
});

socket.on('user_typing_stop', () => {
  hideTypingIndicator();
});
```

### مثال 4: نظام الإشعارات
```javascript
// طلب إذن الإشعارات
if ('Notification' in window) {
  Notification.requestPermission();
}

// استقبال إشعار جديد
socket.on('notification', (notification) => {
  if (document.hidden && Notification.permission === 'granted') {
    new Notification(`${notification.senderName} أرسل رسالة`, {
      icon: '/favicon.ico',
      tag: `chat-${notification.chatId}`
    });
  }
});
```

---

## ⚡ الميزات المتقدمة

### 1. البحث في المحادثات
```bash
GET /api/chats/search?q=أحمد&type=all
```

**أنواع البحث:**
- `all` - البحث في الكل (المحادثات والرسائل)
- `messages` - البحث في الرسائل فقط

### 2. إدارة الأعضاء
```bash
# إضافة عضو
POST /api/chats/1/participants
{ "userId": 3 }

# إزالة عضو
DELETE /api/chats/1/participants/3

# جلب الأعضاء
GET /api/chats/1/participants
```

### 3. ميزات القراءة
- ✔️ **مرسل** - الرسالة تم إرسالها للخادم
- ✔✔️ **تم التسليم** - الرسالة وصلت للمتلقي
- ✔✔️🔵 **مقروء** - المتلقي قرأ الرسالة

### 4. التفاعلات المتعددة
الرموز التعبيرية المدعومة:
- 👍 لايك
- ❤️ حب
- 😂 ضاحك
- 😮 مفاجأة
- 😢 حزن
- 😡 غضب

---

## 🔧 استكشاف الأخطاء

### الخطأ: "ليس لديك صلاحية الوصول"
**السبب:** لا تكون عضو في المحادثة
**الحل:** اطلب من مدير المحادثة إضافتك

### الخطأ: "جدول غير موجود"
**السبب:** لم يتم تطبيق migrations بعد
**الحل:** تأكد من تشغيل السيرفر وحذف ملف migrations الكسير

### الخطأ: "Token غير صحيح"
**السبب:** Token منتهي الصلاحية أو غير صحيح
**الحل:** سجل دخول مجدداً وحدّث Token

### الخطأ: "Connection timeout"
**السبب:** WebSocket غير متصل
**الحل:** تحقق من أن Socket.io يعمل على السيرفر

---

## 📊 قاعدة البيانات

### الجداول الرئيسية
| الجدول | الغرض |
|--------|-------|
| `chats` | تخزين المحادثات |
| `chat_messages` | الرسائل |
| `chat_participants` | أعضاء المحادثة |
| `chat_reactions` | التفاعلات |
| `chat_read_receipts` | علامات القراءة |
| `chat_notifications` | الإشعارات |

---

## 🎯 الخطوات التالية

### المرحلة القادمة (Phase 2):
- [ ] رفع الملفات والصور
- [ ] المكالمات الصوتية (WebRTC)
- [ ] تسجيل الرسائل الصوتية
- [ ] مشاركة الشاشة

### الميزات المستقبلية:
- [ ] تشفير end-to-end
- [ ] بوتات ذكية (AI)
- [ ] ترجمة تلقائية
- [ ] نسخ احتياطي تلقائي

---

**الحالة:** ✅ جاهز للإنتاج
**الإصدار:** 1.0.0
**آخر تحديث:** 2026-06-06
