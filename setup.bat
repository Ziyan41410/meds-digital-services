@echo off
REM MEDS Digital Services - Setup Script for Windows
REM برنامج التثبيت لنظام Windows

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   MEDS Digital Services - Setup Script                ║
echo ║   منصة متكاملة للخدمات الرقمية - برنامج التثبيت       ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
echo ✓ التحقق من وجود Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js غير مثبت. يرجى تثبيته من: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% موجود
echo.

REM Install npm packages
echo 📦 تثبيت المكتبات (npm install)...
call npm install
if errorlevel 1 (
    echo ✗ فشل تثبيت المكتبات
    pause
    exit /b 1
)
echo ✓ تم تثبيت المكتبات بنجاح
echo.

REM Setup environment file
echo ⚙️  إعداد متغيرات البيئة...
if not exist .env.local (
    copy .env.example .env.local
    echo ✓ تم إنشاء ملف .env.local
    echo ⚠  يرجى تعديل .env.local وإدخال بياناتك الخاصة
) else (
    echo ✓ ملف .env.local موجود بالفعل
)
echo.

REM Create uploads directory
echo 📁 إنشاء مجلدات ضرورية...
if not exist uploads mkdir uploads
echo ✓ تم إنشاء المجلدات
echo.

REM Display next steps
echo ╔════════════════════════════════════════════════════════╗
echo ║           الخطوات التالية - Next Steps               ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 1️⃣  تحديث ملف .env.local بـ الفراغات الفارغة
echo.
echo 2️⃣  إعداد قاعدة البيانات MySQL:
echo    - افتح MySQL Command Line أو MySQL Workbench
echo    - شغّل ملف: database\meds_schema.sql
echo.
echo 3️⃣  تشغيل المشروع:
echo    npm run dev
echo.
echo 4️⃣  فتح المتصفح:
echo    http://localhost:3000
echo.
echo ✓ تم إعداد المشروع بنجاح!
echo.
pause
