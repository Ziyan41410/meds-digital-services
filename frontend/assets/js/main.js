/**
 * Main JavaScript - UI and Interactions
 */

// Base API URL
const API_URL = API_CONFIG.BASE;

// ===== MODAL FUNCTIONS =====
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

function switchModal(newModalId) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(m => m.classList.remove('show'));
    openModal(newModalId);
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
});

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger) {
    hamburger.addEventListener('click', function() {
        navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
    });
}

// ===== STICKY NAVBAR =====
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }
});

// ===== LOAD SERVICES =====
async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/services`);
        const data = await response.json();

        if (data.success) {
            const container = document.getElementById('servicesContainer');
            container.innerHTML = data.data.map(service => `
                <div class="service-card">
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                    <div class="features">
                        <ul>
                            <li>السعر: $${service.price}</li>
                            <li>الفئة: ${service.category_name}</li>
                        </ul>
                    </div>
                    <button class="btn-primary" onclick="requestService(${service.id})">طلب الخدمة</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// ===== FAQ ACCORDION =====
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (question) {
            question.addEventListener('click', function() {
                answer.classList.toggle('active');
                const icon = question.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                }
            });
        }
    });
}

// ===== LOAD REVIEWS =====
async function loadReviews() {
    try {
        const response = await fetch(`${API_URL}/reviews/featured`);
        const data = await response.json();

        if (data.success) {
            const container = document.getElementById('reviewsContainer');
            container.innerHTML = data.data.map(review => `
                <div class="review-card">
                    <div class="rating">${'⭐'.repeat(review.rating)}</div>
                    <p>"${review.comment}"</p>
                    <div class="author">- ${review.username}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        
        try {
            // Here you would send the contact form to your backend
            alert('شكراً لرسالتك! سنتواصل معك قريباً');
            this.reset();
        } catch (error) {
            alert('حدث خطأ. يرجى المحاولة لاحقاً');
        }
    });
}

// ===== REQUEST SERVICE =====
function requestService(serviceId) {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    if (!token) {
        alert('يرجى تسجيل الدخول أولاً');
        openModal('loginModal');
        return;
    }
    
    // Redirect to service request form
    window.location.href = `/pages/request-service.html?service=${serviceId}`;
}

// ===== LOGIN FORM =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = this.elements[0].value;
        const password = this.elements[1].value;
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify(data.user));
                alert('تم تسجيل الدخول بنجاح');
                closeModal('loginModal');
                // Redirect to dashboard
                window.location.href = '/pages/dashboard.html';
            } else {
                alert(data.message || 'خطأ في تسجيل الدخول');
            }
        } catch (error) {
            alert('حدث خطأ: ' + error.message);
        }
    });
}

// ===== REGISTER FORM =====
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const first_name = this.elements[0].value;
        const last_name = this.elements[1].value;
        const username = this.elements[2].value;
        const email = this.elements[3].value;
        const phone = this.elements[4].value;
        const password = this.elements[5].value;
        const password_confirm = this.elements[6].value;
        
        if (password !== password_confirm) {
            alert('كلمات المرور غير متطابقة');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name,
                    last_name,
                    username,
                    email,
                    phone,
                    password,
                    password_confirm
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('تم التسجيل بنجاح! يرجى تفعيل بريدك الإلكتروني');
                closeModal('registerModal');
            } else {
                alert(data.error || data.message || 'خطأ في التسجيل');
            }
        } catch (error) {
            alert('حدث خطأ: ' + error.message);
        }
    });
}

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    loadServices();
    loadReviews();
    initializeFAQ();
    
    // Check if user is logged in
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (token && authButtons) {
        const user = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');
        authButtons.innerHTML = `
            <span>مرحباً ${user.username}</span>
            <button class="btn-login" onclick="logout()">خروج</button>
        `;
    }
});

// ===== LOGOUT =====
function logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('تم تسجيل الخروج');
    window.location.reload();
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            navMenu.style.display = 'none';
        }
    });
});
