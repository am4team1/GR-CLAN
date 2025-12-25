// ملف التطبيق الرئيسي - GR CLAN Website

// بيانات التطبيق العامة
const GR_CLAN_APP = {
    name: "GR CLAN",
    version: "1.0.0",
    currentUser: null,
    clanMembers: [],
    clanStats: {},
    
    // تهيئة التطبيق
    init: function() {
        console.log(`تهيئة ${this.name} الإصدار ${this.version}`);
        this.loadUserData();
        this.loadClanData();
        this.setupEventListeners();
        this.updateUI();
    },
    
    // تحميل بيانات المستخدم
    loadUserData: function() {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            console.log(`تم تحميل بيانات المستخدم: ${this.currentUser.username}`);
        } else {
            console.log('لا يوجد مستخدم مسجل الدخول');
        }
    },
    
    // تحميل بيانات الكلان
    loadClanData: function() {
        const storedMembers = localStorage.getItem('clanMembers');
        const storedStats = localStorage.getItem('clanStats');
        
        if (storedMembers) {
            this.clanMembers = JSON.parse(storedMembers);
        } else {
            // بيانات وهمية للكلان
            this.clanMembers = [
                { id: 1, username: 'GR_Leader', pubgId: '5123456789', rank: 'قائد', joinDate: '2023-01-15' },
                { id: 2, username: 'GR_Pro', pubgId: '5123456790', rank: 'نائب قائد', joinDate: '2023-02-20' },
                { id: 3, username: 'GR_Sniper', pubgId: '5123456791', rank: 'عضو نشط', joinDate: '2023-03-10' },
                { id: 4, username: 'GR_Assault', pubgId: '5123456792', rank: 'عضو نشط', joinDate: '2023-03-15' },
                { id: 5, username: 'GR_Support', pubgId: '5123456793', rank: 'عضو', joinDate: '2023-04-01' }
            ];
            localStorage.setItem('clanMembers', JSON.stringify(this.clanMembers));
        }
        
        if (storedStats) {
            this.clanStats = JSON.parse(storedStats);
        } else {
            // إحصائيات وهمية للكلان
            this.clanStats = {
                totalMembers: this.clanMembers.length,
                totalMatches: 1250,
                totalWins: 487,
                winRate: '39%',
                totalKills: 12500,
                averageKD: 2.8,
                clanRank: 'Platinum',
                clanLevel: 45
            };
            localStorage.setItem('clanStats', JSON.stringify(this.clanStats));
        }
    },
    
    // إعداد مستمعي الأحداث
    setupEventListeners: function() {
        // مستمعي الأحداث العامة
        document.addEventListener('DOMContentLoaded', () => {
            this.handlePageLoad();
        });
        
        // مستمعي الأحداث حسب الصفحة
        const currentPage = this.getCurrentPage();
        
        switch(currentPage) {
            case 'index':
                this.setupHomePageEvents();
                break;
            case 'login':
                this.setupLoginPageEvents();
                break;
            case 'register':
                this.setupRegisterPageEvents();
                break;
            case 'account':
                this.setupAccountPageEvents();
                break;
        }
    },
    
    // الحصول على الصفحة الحالية
    getCurrentPage: function() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'index';
        return page;
    },
    
    // تحديث واجهة المستخدم
    updateUI: function() {
        // تحديث حالة تسجيل الدخول في الهيدر
        this.updateAuthStatus();
        
        // تحديث إحصائيات الكلان في الصفحة الرئيسية
        if (this.getCurrentPage() === 'index') {
            this.updateClanStats();
        }
        
        // تحديث بيانات الحساب
        if (this.getCurrentPage() === 'account' && this.currentUser) {
            this.updateAccountInfo();
        }
    },
    
    // تحديث حالة المصادقة
    updateAuthStatus: function() {
        const userDisplay = document.getElementById('user-id-display');
        const authButtons = document.getElementById('headerAuthButtons') || document.querySelector('.auth-buttons');
        
        if (!userDisplay || !authButtons) return;
        
        if (this.currentUser) {
            userDisplay.textContent = this.currentUser.username;
            userDisplay.style.color = '#D4AF37';
            
            authButtons.innerHTML = `
                <button class="btn btn-login" id="logoutBtn">تسجيل الخروج</button>
            `;
            
            document.getElementById('logoutBtn')?.addEventListener('click', () => {
                this.logout();
            });
        } else {
            userDisplay.textContent = 'زائر';
            userDisplay.style.color = '#FFFFFF';
            
            authButtons.innerHTML = `
                <a href="login.html" class="btn btn-login">تسجيل الدخول</a>
                <a href="register.html" class="btn btn-register">إنشاء حساب</a>
            `;
        }
    },
    
    // تحديث إحصائيات الكلان
    updateClanStats: function() {
        const statsElements = {
            'totalMembers': document.querySelector('.stat:nth-child(1) p'),
            'clanRank': document.querySelector('.stat:nth-child(2) p'),
            'winRate': document.querySelector('.stat:nth-child(3) p')
        };
        
        if (statsElements.totalMembers) {
            statsElements.totalMembers.textContent = this.clanStats.totalMembers + '+';
        }
        
        if (statsElements.clanRank) {
            statsElements.clanRank.textContent = this.clanStats.clanRank;
        }
        
        if (statsElements.winRate) {
            statsElements.winRate.textContent = this.clanStats.winRate;
        }
    },
    
    // تحديث معلومات الحساب
    updateAccountInfo: function() {
        // سيتم تنفيذها في صفحة الحساب
    },
    
    // تسجيل دخول المستخدم
    loginUser: function(username, password, rememberMe = false) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = {
                username: user.username,
                pubgId: user.pubgId,
                joinDate: user.joinDate
            };
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            if (rememberMe) {
                localStorage.setItem('rememberedUser', username);
            }
            
            return { success: true, message: 'تم تسجيل الدخول بنجاح!' };
        } else {
            return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة!' };
        }
    },
    
    // تسجيل خروج المستخدم
    logout: function() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    },
    
    // تسجيل مستخدم جديد
    registerUser: function(pubgId, username, password) {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        
        // التحقق من عدم وجود اسم مستخدم مكرر
        if (users.find(user => user.username === username)) {
            return { success: false, message: 'اسم المستخدم موجود بالفعل!' };
        }
        
        // التحقق من عدم وجود معرف ببجي مكرر
        if (users.find(user => user.pubgId === pubgId)) {
            return { success: false, message: 'معرف الببجي مسجل بالفعل!' };
        }
        
        // إنشاء مستخدم جديد
        const newUser = {
            id: Date.now(),
            pubgId: pubgId,
            username: username,
            password: password,
            joinDate: new Date().toISOString(),
            stats: {
                matches: 0,
                wins: 0,
                kills: 0,
                kd: 0.0
            }
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // تسجيل الدخول تلقائياً
        this.currentUser = {
            username: newUser.username,
            pubgId: newUser.pubgId,
            joinDate: newUser.joinDate
        };
        
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        return { success: true, message: 'تم إنشاء الحساب بنجاح!' };
    },
    
    // الحصول على بيانات مستخدم
    getUserData: function(username) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        return users.find(user => user.username === username);
    },
    
    // تحديث بيانات مستخدم
    updateUserData: function(username, newData) {
        let users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(user => user.username === username);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...newData };
            localStorage.setItem('users', JSON.stringify(users));
            
            // إذا كان المستخدم الحالي هو المحدث
            if (this.currentUser && this.currentUser.username === username) {
                this.currentUser = { ...this.currentUser, ...newData };
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }
            
            return true;
        }
        
        return false;
    },
    
    // معالجة تحميل الصفحة
    handlePageLoad: function() {
        console.log(`صفحة ${this.getCurrentPage()} تم تحميلها`);
        
        // التحقق من الحاجة لإعادة التوجيه
        this.checkRedirect();
        
        // تحميل بيانات التطبيق
        this.init();
        
        // إضافة تأثيرات تفاعلية
        this.addInteractiveEffects();
    },
    
    // التحقق من إعادة التوجيه
    checkRedirect: function() {
        const currentPage = this.getCurrentPage();
        
        // إذا كان في صفحة الحساب ولم يكن مسجلاً
        if (currentPage === 'account' && !this.currentUser) {
            window.location.href = 'login.html';
        }
        
        // إذا كان في صفحة التسجيل/الدخول وكان مسجلاً بالفعل
        if ((currentPage === 'login' || currentPage === 'register') && this.currentUser) {
            window.location.href = 'index.html';
        }
    },
    
    // إضافة تأثيرات تفاعلية
    addInteractiveEffects: function() {
        // تأثيرات الأزرار
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
        
        // تأثيرات عناصر الشريط السفلي
        const taskbarItems = document.querySelectorAll('.taskbar-item');
        taskbarItems.forEach(item => {
            item.addEventListener('click', function() {
                taskbarItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        });
    },
    
    // أحداث الصفحة الرئيسية
    setupHomePageEvents: function() {
        // إضافة أي أحداث خاصة بالصفحة الرئيسية هنا
        console.log('تم إعداد أحداث الصفحة الرئيسية');
    },
    
    // أحداث صفحة تسجيل الدخول
    setupLoginPageEvents: function() {
        // تم التعامل معها في صفحة login.html
        console.log('تم إعداد أحداث صفحة تسجيل الدخول');
    },
    
    // أحداث صفحة إنشاء الحساب
    setupRegisterPageEvents: function() {
        // تم التعامل معها في صفحة register.html
        console.log('تم إعداد أحداث صفحة إنشاء الحساب');
    },
    
    // أحداث صفحة الحساب
    setupAccountPageEvents: function() {
        // تم التعامل معها في صفحة account.html
        console.log('تم إعداد أحداث صفحة الحساب');
    },
    
    // أدوات مساعدة
    helpers: {
        // تنسيق التاريخ
        formatDate: function(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },
        
        // تنسيق الأرقام
        formatNumber: function(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        
        // توليد ألوان عشوائية
        getRandomColor: function() {
            const colors = ['#D4AF37', '#0A1931', '#162447', '#1B1B2F', '#1F4068'];
            return colors[Math.floor(Math.random() * colors.length)];
        },
        
        // التحقق من صحة معرف الببجي
        isValidPubgId: function(id) {
            return /^\d{10}$/.test(id);
        },
        
        // التحقق من قوة كلمة المرور
        isStrongPassword: function(password) {
            return password.length >= 6;
        }
    }
};

// تعريف دوال عامة للاستخدام في الصفحات
window.GR_CLAN = GR_CLAN_APP;

// دوال مساعدة للصفحات
function loginUser(username, password, rememberMe = false) {
    return GR_CLAN_APP.loginUser(username, password, rememberMe);
}

function registerUser(pubgId, username, password) {
    return GR_CLAN_APP.registerUser(pubgId, username, password);
}

function logoutUser() {
    GR_CLAN_APP.logout();
}

function getCurrentUser() {
    return GR_CLAN_APP.currentUser;
}

function getUserData(username) {
    return GR_CLAN_APP.getUserData(username);
}

// تهيئة التطبيق عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        GR_CLAN_APP.init();
    });
} else {
    GR_CLAN_APP.init();
}

// تصدير الدوال للاستخدام في وحدات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GR_CLAN_APP,
        loginUser,
        registerUser,
        logoutUser,
        getCurrentUser,
        getUserData
    };
}
