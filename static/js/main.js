// Main JavaScript file for ACME University Enrollment App

// Utility functions
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('hidden');
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
            break;
        case 'warning':
            notification.style.background = 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Form validation
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = '#dc3545';
            isValid = false;
        } else {
            input.style.borderColor = '#e1e5e9';
        }
    });
    
    return isValid;
}

// API helper functions
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, mergedOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'An error occurred');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Course enrollment functionality
async function enrollInCourse(courseId) {
    showLoading();
    
    try {
        const result = await apiRequest('/api/enroll', {
            method: 'POST',
            body: JSON.stringify({ course_id: courseId })
        });
        
        if (result.success) {
            showNotification('Successfully enrolled in course!', 'success');
            // Reload page to show updated enrollment
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to enroll in course. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Grade update functionality
async function updateGrade(enrollmentId, grade) {
    showLoading();
    
    try {
        const result = await apiRequest('/api/update_grade', {
            method: 'POST',
            body: JSON.stringify({ 
                enrollment_id: enrollmentId,
                grade: grade
            })
        });
        
        if (result.success) {
            showNotification('Grade updated successfully!', 'success');
            return true;
        } else {
            showNotification(result.message, 'error');
            return false;
        }
    } catch (error) {
        showNotification('Failed to update grade. Please try again.', 'error');
        return false;
    } finally {
        hideLoading();
    }
}

// Student list functionality
async function loadCourseStudents(courseId) {
    try {
        const result = await apiRequest(`/api/course/${courseId}/students`);
        return result.students || [];
    } catch (error) {
        showNotification('Failed to load students. Please try again.', 'error');
        return [];
    }
}

// Modal functionality
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Theme Management
function initTheme() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    const html = document.documentElement;
    
    // Apply saved theme
    if (savedTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        updateThemeIcon('dark');
    } else {
        html.removeAttribute('data-theme');
        updateThemeIcon('light');
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
        // Switch to light mode
        html.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        updateThemeIcon('light');
    } else {
        // Switch to dark mode
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateThemeIcon('dark');
    }
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-moon';
            themeIcon.setAttribute('aria-label', 'Switch to light mode');
        } else {
            themeIcon.className = 'fas fa-sun';
            themeIcon.setAttribute('aria-label', 'Switch to dark mode');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme on page load
    initTheme();
    
    // Add theme toggle button event listener
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    // Add click handlers for modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // Add form validation to login form (simplified)
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            // Only validate if fields are empty, don't prevent submission for other issues
            const username = this.querySelector('#username');
            const password = this.querySelector('#password');
            
            if (!username.value.trim() || !password.value.trim()) {
                e.preventDefault();
                showNotification('Please fill in all required fields.', 'warning');
                return false;
            }
            
            // Allow form to submit normally
            return true;
        });
    }
    
    // Add smooth scrolling for better UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape key closes modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
    
    // Add loading states to buttons (excluding login form)
    document.querySelectorAll('button[type="submit"]').forEach(button => {
        // Skip login form buttons to avoid interference
        if (button.closest('.login-form')) {
            return;
        }
        
        button.addEventListener('click', function() {
            if (this.form && validateForm(this.form)) {
                this.disabled = true;
                this.textContent = 'Processing...';
                
                // Re-enable after form submission (success or error)
                setTimeout(() => {
                    this.disabled = false;
                    this.textContent = this.dataset.originalText || 'Submit';
                }, 3000);
            }
        });
    });
    
    // Store original button text
    document.querySelectorAll('button[type="submit"]').forEach(button => {
        button.dataset.originalText = button.textContent;
    });
});

// Export functions for use in other scripts
window.ACME = {
    showNotification,
    validateForm,
    apiRequest,
    enrollInCourse,
    updateGrade,
    loadCourseStudents,
    openModal,
    closeModal,
    showLoading,
    hideLoading,
    toggleTheme,
    initTheme
};
