// ui.js - تحسينات واجهة المستخدم

// تأثيرات الصفحات
const UIEffects = {
    // تأثير تحميل الصفحة
    pageLoadEffect: function() {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
    },
    
    // تأثير الأزرار
    buttonEffects: function() {
        document.querySelectorAll('button, .btn').forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
            
            button.addEventListener('mousedown', function() {
                this.style.transform = 'translateY(1px)';
            });
            
            button.addEventListener('mouseup', function() {
                this.style.transform = 'translateY(-2px)';
            });
        });
    },
    
    // تأثير الحقول
    inputEffects: function() {
        document.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.style.transform = 'scale(1.02)';
            });
            
            input.addEventListener('blur', function() {
                this.parentElement.style.transform = 'scale(1)';
            });
        });
    },
    
    // تأثير البطاقات
    cardEffects: function() {
        document.querySelectorAll('.card, .info-card, .news-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.boxShadow = '';
            });
        });
    },
    
    // تأثيرات التمرير السلس
    smoothScroll: function() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });
    },
    
    // تأثير الظهور التدريجي للعناصر
    fadeInElements: function() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.fade-in').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(el);
        });
    },
    
    // تأثيرات النصوص الذهبية
    goldTextEffect: function() {
        document.querySelectorAll('.gold-text').forEach(text => {
            text.addEventListener('mouseenter', function() {
                this.style.textShadow = '0 0 15px rgba(212, 175, 55, 0.7)';
            });
            
            text.addEventListener('mouseleave', function() {
                this.style.textShadow = '';
            });
        });
    },
    
    // تحسينات للجوال
    mobileOptimizations: function() {
        if (window.innerWidth <= 768) {
            // إخفاء بعض العناصر على الجوال
            document.querySelectorAll('.desktop-only').forEach(el => {
                el.style.display = 'none';
            });
            
            // زيادة حجم الأزرار على الجوال
            document.querySelectorAll('button, .btn').forEach(btn => {
                btn.style.padding = '12px 20px';
                btn.style.fontSize = '1rem';
            });
        }
    },
    
    // تهيئة كل التأثيرات
    init: function() {
        this.pageLoadEffect();
        this.buttonEffects();
        this.inputEffects();
        this.cardEffects();
        this.smoothScroll();
        this.fadeInElements();
        this.goldTextEffect();
        this.mobileOptimizations();
        
        console.log('✨ تأثيرات الواجهة مفعلة');
    }
};

// إدارة الثيمات
const ThemeManager = {
    currentTheme: 'dark',
    
    themes: {
        dark: {
            '--primary-gold': '#D4AF37',
            '--secondary-gold': '#FFD700',
            '--dark-bg': '#0A1931',
            '--darker-bg': '#061025',
            '--text-color': '#FFFFFF'
        },
        light: {
            '--primary-gold': '#B8860B',
            '--secondary-gold': '#DAA520',
            '--dark-bg': '#F5F5F5',
            '--darker-bg': '#E0E0E0',
            '--text-color': '#333333'
        }
    },
    
    toggleTheme: function() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        localStorage.setItem('theme', this.currentTheme);
    },
    
    applyTheme: function() {
        const theme = this.themes[this.currentTheme];
        Object.keys(theme).forEach(key => {
            document.documentElement.style.setProperty(key, theme[key]);
        });
    },
    
    init: function() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.currentTheme = savedTheme;
        this.applyTheme();
    }
};

// نظام الإشعارات
const NotificationSystem = {
    show: function(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${this.getIcon(type)}</div>
            <div class="notification-content">${message}</div>
            <button class="notification-close">✕</button>
        `;
        
        // إضافة الأنماط إذا لم تكن موجودة
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(10, 25, 49, 0.95);
                    backdrop-filter: blur(20px);
                    border: 2px solid var(--primary-gold);
                    border-radius: 15px;
                    padding: 20px;
                    min-width: 300px;
                    max-width: 400px;
                    box-shadow: 0 15px 40px rgba(0,0,0,0.4);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    animation: slideInRight 0.3s ease;
                }
                
                .notification-icon {
                    font-size: 1.8rem;
                }
                
                .notification-info .notification-icon { color: #2e86de; }
                .notification-success .notification-icon { color: #2ed573; }
                .notification-warning .notification-icon { color: #ffa502; }
                .notification-error .notification-icon { color: #ff4757; }
                
                .notification-content {
                    flex: 1;
                    color: white;
                    font-size: 0.95rem;
                }
                
                .notification-close {
                    background: transparent;
                    border: none;
                    color: rgba(255,255,255,0.5);
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 5px;
                    transition: color 0.3s ease;
                }
                
                .notification-close:hover {
                    color: var(--primary-gold);
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // إغلاق الإشعار
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // إزالة تلقائية بعد المدة
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    },
    
    getIcon: function(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }
};

// تهيئة كل الأنظمة
document.addEventListener('DOMContentLoaded', function() {
    UIEffects.init();
    ThemeManager.init();
    
    // إضافة مستمع للثيم
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => ThemeManager.toggleTheme());
    }
    
    // اختبار الإشعارات
    if (window.location.href.includes('main.html')) {
        setTimeout(() => {
            NotificationSystem.show('مرحباً بك في GR CLAN!', 'success', 3000);
        }, 1500);
    }
});

// تصدير للاستخدام في الصفحات
window.UI = {
    effects: UIEffects,
    theme: ThemeManager,
    notify: NotificationSystem
};
