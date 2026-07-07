#!/bin/bash

# MEDS Digital Services - Setup Script
# هذا السكريبت يساعد في تثبيت وإعداد المشروع بسهولة

echo "╔════════════════════════════════════════════════════════╗"
echo "║   MEDS Digital Services - Setup Script                ║"
echo "║   منصة متكاملة للخدمات الرقمية - برنامج التثبيت       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 1. Check Node.js
echo "✓ التحقق من وجود Node.js..."
if ! command -v node &> /dev/null
then
    echo "✗ Node.js غير مثبت. يرجى تثبيته من: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION موجود"
echo ""

# 2. Check MySQL
echo "✓ التحقق من وجود MySQL..."
if ! command -v mysql &> /dev/null
then
    echo "⚠ MySQL غير مثبت. يرجى تثبيته من: https://www.mysql.com/"
    echo "  المنصة ستعمل لكن ستحتاج إلى إعداد قاعدة البيانات يدوياً"
fi
echo ""

# 3. Install npm packages
echo "📦 تثبيت المكتبات (npm install)..."
npm install
if [ $? -ne 0 ]; then
    echo "✗ فشل تثبيت المكتبات"
    exit 1
fi
echo "✓ تم تثبيت المكتبات بنجاح"
echo ""

# 4. Setup environment file
echo "⚙️  إعداد متغيرات البيئة..."
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✓ تم إنشاء ملف .env.local"
    echo "⚠  يرجى تعديل .env.local وإدخال بياناتك الخاصة"
else
    echo "✓ ملف .env.local موجود بالفعل"
fi
echo ""

# 5. Create uploads directory
echo "📁 إنشاء مجلدات ضرورية..."
mkdir -p uploads
touch uploads/.gitkeep
echo "✓ تم إنشاء المجلدات"
echo ""

# 6. Display next steps
echo "╔════════════════════════════════════════════════════════╗"
echo "║           الخطوات التالية - Next Steps               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "1️⃣  تحديث ملف .env.local:"
echo "    nano .env.local"
echo ""
echo "2️⃣  إعداد قاعدة البيانات:"
echo "    mysql -u root -p < database/meds_schema.sql"
echo ""
echo "3️⃣  تشغيل المشروع:"
echo "    npm run dev"
echo ""
echo "4️⃣  فتح المتصفح:"
echo "    http://localhost:3000"
echo ""
echo "✓ تم إعداد المشروع بنجاح!"
