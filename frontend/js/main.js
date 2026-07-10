// Get API origin dynamically from window location
const protocol = window.location.protocol;
const host = window.location.hostname;
const port = window.location.port ? `:${window.location.port}` : '';
const API_ORIGIN = `${protocol}//${host}${port}`;

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch (error) {
        return null;
    }
}

async function updateApiStatus() {
    const apiStatus = document.getElementById('apiStatus');
    if (!apiStatus) return;

    try {
        const response = await fetch(`${API_ORIGIN}/health`);
        if (!response.ok) throw new Error('API unavailable');
        apiStatus.textContent = 'الخادم متصل';
        apiStatus.style.background = '#dcfce7';
        apiStatus.style.color = '#15803d';
    } catch (error) {
        apiStatus.textContent = 'الخادم غير متصل';
        apiStatus.style.background = '#fee2e2';
        apiStatus.style.color = '#b91c1c';
    }
}

function hydrateDashboard() {
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    const logoutButton = document.getElementById('logoutButton');

    if (!welcomeTitle) return;

    const user = getStoredUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    welcomeTitle.textContent = `مرحبا ${user.first_name || user.username}`;
    welcomeSubtitle.textContent = `الحساب: ${user.email || user.username}`;

    logoutButton?.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });
}

hydrateDashboard();
updateApiStatus();
