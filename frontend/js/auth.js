const API_BASE_URL = API_CONFIG.BASE;

const messageBox = document.getElementById('formMessage');

function showMessage(type, text) {
    if (!messageBox) return;
    messageBox.className = `message ${type} is-visible`;
    messageBox.textContent = text;
}

function setLoading(form, isLoading) {
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;

    button.disabled = isLoading;
    button.dataset.originalText = button.dataset.originalText || button.textContent;
    button.textContent = isLoading ? 'جار المعالجة...' : button.dataset.originalText;
}

function getDashboardUrl(user) {
    const managerRoleIds = new Set([1, 2, 3, 4]);
    return managerRoleIds.has(Number(user?.role)) ? 'manager-dashboard.html' : 'client-dashboard.html';
}

async function request(path, options) {
    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options,
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(payload.error || payload.message || 'تعذر تنفيذ الطلب');
        }

        return payload;
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error('لا يمكن الاتصال بالخادم. شغل السيرفر بالأمر npm start وتأكد أن المنفذ 3001 متاح.');
        }
        throw error;
    }
}

document.getElementById('registerForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    if (data.password !== data.confirm_password) {
        showMessage('error', 'كلمتا المرور غير متطابقتين');
        return;
    }

    setLoading(form, true);

    try {
        const result = await request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        sessionStorage.setItem('token', result.token);
        sessionStorage.setItem('user', JSON.stringify(result.user));
        showMessage('success', result.message || 'تم إنشاء الحساب بنجاح');

        window.setTimeout(() => {
            window.location.href = 'client-dashboard.html';
        }, 700);
    } catch (error) {
        showMessage('error', error.message);
    } finally {
        setLoading(form, false);
    }
});

document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;

    setLoading(form, true);

    try {
        const result = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ identifier, password }),
        });

        sessionStorage.setItem('token', result.token);
        sessionStorage.setItem('user', JSON.stringify(result.user));
        window.location.href = getDashboardUrl(result.user);
    } catch (error) {
        showMessage('error', error.message);
    } finally {
        setLoading(form, false);
    }
});
