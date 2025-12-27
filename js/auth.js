// نظام المصادقة - GR CLAN (معدل للنظام الجديد)
const AuthSystem = {
    // ===== تسجيل مستخدم جديد =====
    initRegister: function() {
        if (document.getElementById('registerForm')) {
            document.getElementById('registerForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const pubgId = document.getElementById('pubg-id').value.trim();
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                
                // التحقق من المدخلات
                if (!pubgId || !username || !password || !confirmPassword) {
                    alert('الرجاء ملء جميع الحقول!');
                    return;
                }
                
                // التحقق من كلمات المرور
                if (password !== confirmPassword) {
                    alert('كلمات المرور غير متطابقة!');
                    return;
                }
                
                // التحقق من طول كلمة المرور
                if (password.length < 6) {
                    alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل!');
                    return;
                }
                
                // التحقق من اسم المستخدم (يجب أن يكون فريداً)
                const existingUser = UserManager.searchUser(username);
                if (existingUser.success && existingUser.results.length > 0) {
                    alert('اسم المستخدم موجود بالفعل!');
                    return;
                }
                
                // إنشاء بيانات المستخدم
                const userData = {
                    username: username,
                    pubgId: pubgId,
                    password: password, // سيتم تخزينها في النظام القديم
                    email: '',
                    phone: '',
                    role: 'عضو'
                };
                
                // استخدام UserManager للتسجيل
                const result = UserManager.registerUser(userData);
                
                if (result.success) {
                    // حفظ في النظام القديم أيضاً (للتوافق)
                    let oldUsers = JSON.parse(localStorage.getItem('gr_users')) || [];
                    
                    const oldUser = {
                        id: Date.now(),
                        pubgId: pubgId,
                        username: username,
                        password: password,
                        joinDate: new Date().toISOString()
                    };
                    
                    oldUsers.push(oldUser);
                    localStorage.setItem('gr_users', JSON.stringify(oldUsers));
                    
                    alert('🎉 تم إنشاء الحساب بنجاح!');
                    
                    // إعادة التوجيه للصفحة الرئيسية
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } else {
                    alert(`❌ خطأ: ${result.error}`);
                }
            });
        }
    },
    
    // ===== تسجيل الدخول =====
    initLogin: function() {
        if (document.getElementById('loginForm')) {
            document.getElementById('loginForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value;
                
                // استخدام UserManager لتسجيل الدخول
                const result = UserManager.loginUser(username, password);
                
                if (result.success) {
                    alert('✅ تم تسجيل الدخول بنجاح!');
                    
                    // إعادة التوجيه للصفحة الرئيسية
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } else {
                    alert(`❌ خطأ: ${result.error}`);
                }
            });
        }
    },
    
    // ===== التحقق من تسجيل الدخول =====
    isLoggedIn: function() {
        return UserManager.loadCurrentUser() !== null;
    },
    
    // ===== تسجيل الخروج =====
    logout: function() {
        UserManager.logoutUser();
        alert('تم تسجيل الخروج بنجاح!');
        window.location.href = 'login.html';
    },
    
    // ===== جلب المستخدم الحالي =====
    getCurrentUser: function() {
        return UserManager.loadCurrentUser();
    },
    
    // ===== التهيئة =====
    init: function() {
        console.log('🚀 نظام المصادقة المعدل محمل وجاهز');
        
        // التأكد من تهيئة الأنظمة الأخرى أولاً
        if (!window.UserManager) {
            console.error('❌ UserManager غير محمل');
            return;
        }
        
        if (!window.StorageEngine) {
            console.error('❌ StorageEngine غير محمل');
            return;
        }
        
        UserManager.init();
        StorageEngine.init();
        
        this.initRegister();
        this.initLogin();
    }
};

// جعل النظام متاحاً عالمياً
window.AuthSystem = AuthSystem;

// تهيئة النظام عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    if (window.AuthSystem) {
        window.AuthSystem.init();
    }
});
