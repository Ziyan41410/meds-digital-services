const nodemailer = require('nodemailer');
require('dotenv').config();

// إنشاء transporter بشكل آمن (حتى لو كانت البيانات غير مكتملة)
let transporter = null;
try {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
} catch (err) {
    console.warn('Email service not configured properly');
}

const sendVerificationEmail = async (email, token) => {
    if (!transporter) return console.log('Email disabled: no transporter');
    const url = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify/${token}`;
    try {
        await transporter.sendMail({
            from: `"MEDS Digital" <${process.env.EMAIL_FROM || 'noreply@meds.com'}>`,
            to: email,
            subject: 'تفعيل حسابك في MEDS Digital Services',
            html: `<h2>مرحباً</h2><p>اضغط <a href="${url}">هنا</a> لتفعيل حسابك</p>`
        });
    } catch (err) {
        console.error('Failed to send email:', err.message);
    }
};

const sendPasswordResetEmail = async (email, token) => {
    if (!transporter) return console.log('Email disabled');
    const url = `${process.env.CLIENT_URL || 'http://localhost:5500'}/reset-password.html?token=${token}`;
    try {
        await transporter.sendMail({
            from: `"MEDS Digital" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'إعادة تعيين كلمة المرور',
            html: `<h2>إعادة تعيين</h2><p>اضغط <a href="${url}">هنا</a> لإعادة تعيين كلمة المرور</p><p>الرابط صالح لمدة ساعة</p>`
        });
    } catch (err) {
        console.error('Failed to send reset email:', err.message);
    }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };