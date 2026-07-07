/**
 * Theme Toggle - Dark/Light Mode
 */

const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Check saved theme preference or default to light mode
const savedTheme = localStorage.getItem('theme') || 'light-mode';

// Apply saved theme
function applyTheme(theme) {
    document.body.classList.remove('dark-mode', 'light-mode');
    document.body.classList.add(theme);
    localStorage.setItem('theme', theme);
    
    // Update icon
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark-mode') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
}

// Apply saved theme on page load
applyTheme(savedTheme);

// Toggle theme on button click
if (themeToggle) {
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode';
        const newTheme = currentTheme === 'dark-mode' ? 'light-mode' : 'dark-mode';
        applyTheme(newTheme);
    });
}

// Respect system preference if no saved preference
if (!localStorage.getItem('theme')) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark-mode' : 'light-mode');
}
