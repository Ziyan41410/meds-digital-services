const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const createToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
});

const validationErrors = (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return false;

    res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        error: errors.array()[0].msg,
        errors: errors.array(),
    });
    return true;
};

exports.register = async (req, res, next) => {
    try {
        if (validationErrors(req, res)) return;

        const { first_name, last_name, username, email, phone, password, confirm_password } = req.body;

        if (confirm_password && password !== confirm_password) {
            return res.status(400).json({ success: false, error: 'كلمتا المرور غير متطابقتين' });
        }

        const existing = await User.findByEmail(email) || await User.findByUsername(username) || await User.findByPhone(phone);
        if (existing) {
            return res.status(400).json({ success: false, error: 'هذه البيانات مسجلة مسبقا' });
        }

        const userId = await User.create({ first_name, last_name, username, email, phone, password });
        const verificationToken = uuidv4();

        await User.updateVerificationToken(userId, verificationToken);
        await sendVerificationEmail(email, verificationToken);

        const token = createToken({ id: userId, email });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح. يرجى تفعيل البريد الإلكتروني عند توفر الرسالة.',
            token,
            user: { id: userId, first_name, last_name, username, email, phone, role: 5 },
        });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        if (validationErrors(req, res)) return;

        const { identifier, password } = req.body;
        const user = await User.findByEmail(identifier) || await User.findByUsername(identifier) || await User.findByPhone(identifier);

        if (!user || !user.is_active) {
            return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة أو الحساب معطل' });
        }

        // Check password
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة' });
        }

        // Allow login even if email not verified (for development)
        // In production, you should uncomment the check below:
        // if (!user.is_verified) {
        //     return res.status(401).json({ success: false, error: 'الحساب غير مفعل. تحقق من بريدك الإلكتروني أولا.' });
        // }

        await User.updateLastLogin(user.id);

        const token = createToken({ id: user.id, email: user.email, role: user.role_id });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role_id,
                is_verified: user.is_verified
            },
        });
    } catch (err) {
        next(err);
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const verified = await User.verifyEmail(req.params.token);
        if (!verified) {
            return res.status(404).json({ success: false, error: 'رابط التفعيل غير صالح أو تم استخدامه سابقا' });
        }
        res.json({ success: true, message: 'تم تفعيل الحساب بنجاح' });
    } catch (err) {
        next(err);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(404).json({ success: false, error: 'البريد الإلكتروني غير موجود' });
        }

        const token = uuidv4();
        const expires = new Date(Date.now() + 3600000);

        await User.updateResetToken(email, token, expires);
        await sendPasswordResetEmail(email, token);

        res.json({ success: true, message: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني' });
    } catch (err) {
        next(err);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { token, new_password } = req.body;
        const updated = await User.resetPassword(token, new_password);

        if (!updated) {
            return res.status(400).json({ success: false, error: 'رابط إعادة التعيين غير صالح أو منتهي' });
        }

        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (err) {
        next(err);
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });

        delete user.password_hash;
        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const first_name = (req.body.first_name || '').trim();
        const last_name = (req.body.last_name || '').trim();
        const email = (req.body.email || '').trim().toLowerCase();
        const phone = (req.body.phone || '').trim();

        if (!first_name || !last_name || !email || !phone) {
            return res.status(400).json({
                success: false,
                error: 'يرجى ملء الاسم والبريد الإلكتروني ورقم الهاتف',
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, error: 'البريد الإلكتروني غير صالح' });
        }

        if (await User.valueExistsForOtherUser('email', email, userId)) {
            return res.status(409).json({ success: false, error: 'هذا البريد الإلكتروني مستخدم من حساب آخر' });
        }

        if (await User.valueExistsForOtherUser('phone', phone, userId)) {
            return res.status(409).json({ success: false, error: 'رقم الهاتف مستخدم من حساب آخر' });
        }

        await User.updateProfile(userId, { first_name, last_name, email, phone });
        const updated = await User.findById(userId);
        delete updated.password_hash;

        res.json({
            success: true,
            message: 'تم تحديث الملف الشخصي بنجاح',
            user: updated,
            data: updated,
        });
    } catch (err) {
        next(err);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { old_password, new_password } = req.body;
        if (!old_password || !new_password) {
            return res.status(400).json({ success: false, error: 'يرجى ملء كلمة المرور الحالية والجديدة' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ success: false, error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
        }

        const user = await User.findById(req.user.id);
        const valid = await bcrypt.compare(old_password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ success: false, error: 'كلمة المرور الحالية غير صحيحة' });
        }

        await User.updatePassword(req.user.id, new_password);
        res.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح' });
    } catch (err) {
        next(err);
    }
};
