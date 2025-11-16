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

function showNotification(message, type) {
    type = type || 'info';
    const notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    notification.textContent = message;
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem; border-radius: 5px; color: white; font-weight: 500; z-index: 1001; animation: slideIn 0.3s ease;';
    
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
    } else if (type === 'warning') {
        notification.style.background = 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(function() {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(function() {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = '@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }';
document.head.appendChild(style);

function validateForm(form) {
    const inputs = form.querySelectorAll('input[required]');
    var isValid = true;
    for (var i = 0; i < inputs.length; i++) {
        if (!inputs[i].value.trim()) {
            inputs[i].style.borderColor = '#dc3545';
            isValid = false;
        } else {
            inputs[i].style.borderColor = '#e1e5e9';
        }
    }
    return isValid;
}

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

document.addEventListener('DOMContentLoaded', function() {
    const closeBtns = document.querySelectorAll('.close');
    for (var i = 0; i < closeBtns.length; i++) {
        closeBtns[i].addEventListener('click', function() {
            var modal = this.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    }
    
    const modals = document.querySelectorAll('.modal');
    for (var i = 0; i < modals.length; i++) {
        modals[i].addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    }
    
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const username = this.querySelector('#username');
            const password = this.querySelector('#password');
            if (!username.value.trim() || !password.value.trim()) {
                e.preventDefault();
                showNotification('Please fill in all required fields.', 'warning');
                return false;
            }
            return true;
        });
    }
    
    const anchors = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < anchors.length; i++) {
        anchors[i].addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal:not(.hidden)');
            for (var i = 0; i < openModals.length; i++) {
                closeModal(openModals[i].id);
            }
        }
    });
    
    const submitBtns = document.querySelectorAll('button[type="submit"]');
    for (var i = 0; i < submitBtns.length; i++) {
        if (submitBtns[i].closest('.login-form')) {
            continue;
        }
        submitBtns[i].dataset.originalText = submitBtns[i].textContent;
        submitBtns[i].addEventListener('click', function() {
            if (this.form && validateForm(this.form)) {
                this.disabled = true;
                this.textContent = 'Processing...';
                var btn = this;
                setTimeout(function() {
                    btn.disabled = false;
                    btn.textContent = btn.dataset.originalText || 'Submit';
                }, 3000);
            }
        });
    }
});
