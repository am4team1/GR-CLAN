// نظام المصادقة - GR CLAN
const AuthSystem = {
    // إنشاء ID فريد للمستخدم
    generateUserId: function(username) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${username}_${timestamp}_${random}`;
    },
    
    // نظام التسجيل
    initRegister: function() {
        if (document.getElementById('registerForm')) {
            document.getElementById('registerForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const pubgId = document.getElementById('pubg-id').value;
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
                
                // الحصول على المستخدمين الحاليين
                let users = JSON.parse(localStorage.getItem('gr_users')) || [];
                
                // التحقق من عدم وجود اسم مستخدم مكرر
                if (users.find(user => user.username === username)) {
                    alert('اسم المستخدم موجود بالفعل!');
                    return;
                }
                
                // التحقق من عدم وجود ID ببجي مكرر
                if (users.find(user => user.pubgId === pubgId)) {
                    alert('معرف ببجي موجود بالفعل!');
                    return;
                }
                
                // إنشاء ID فريد للمستخدم
                const userId = AuthSystem.generateUserId(username);
                
                // إنشاء مستخدم جديد
                const newUser = {
                    id: userId, // ← ID فريد
                    pubgId: pubgId,
                    username: username,
                    password: password, // في الواقع، يجب تشفير كلمة المرور
                    email: '', // سيتم تحديثه لاحقاً
                    phone: '', // سيتم تحديثه لاحقاً
                    role: 'عضو',
                    joinDate: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    isActive: true,
                    profilePic: 'assets/images/default-avatar.png'
                };
                
                // إضافة المستخدم
                users.push(newUser);
                localStorage.setItem('gr_users', JSON.stringify(users));
                
                // حفظ بيانات الجلسة الحالية
                const sessionData = {
                    id: newUser.id, // ← استخدم ID الفريد
                    username: username,
                    pubgId: pubgId,
                    email: '',
                    phone: '',
                    role: 'عضو',
                    joinDate: newUser.joinDate,
                    profilePic: 'assets/images/default-avatar.png'
                };
                
                localStorage.setItem('currentUser', JSON.stringify(sessionData));
                
                // إشعار النجاح
                alert('🎉 تم إنشاء الحساب بنجاح!');
                
                // إعادة التوجيه للصفحة الرئيسية
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            });
        }
    },
    
    // نظام تسجيل الدخول
    initLogin: function() {
        if (document.getElementById('loginForm')) {
            document.getElementById('loginForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value;
                
                // الحصول على المستخدمين
                const users = JSON.parse(localStorage.getItem('gr_users')) || [];
                
                // البحث عن المستخدم
                const user = users.find(u => u.username === username && u.password === password);
                
                if (user) {
                    // تحديث آخر دخول
                    user.lastLogin = new Date().toISOString();
                    localStorage.setItem('gr_users', JSON.stringify(users));
                    
                    // تحميل البيانات الشخصية المحفوظة (إن وجدت)
                    const userKey = `gr_clan_user_${user.id}`;
                    const savedData = localStorage.getItem(userKey);
                    
                    let userData = {
                        id: user.id, // ← ID الفريد
                        username: user.username,
                        pubgId: user.pubgId,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        joinDate: user.joinDate,
                        lastLogin: user.lastLogin,
                        profilePic: user.profilePic
                    };
                    
                    // إذا كانت هناك بيانات محفوظة، دمجها
                    if (savedData) {
                        try {
                            const parsedData = JSON.parse(savedData);
                            userData = {
                                ...userData,
                                ...parsedData,
                                id: user.id // الحفاظ على ID الفريد
                            };
                        } catch (e) {
                            console.error('خطأ في تحليل البيانات المحفوظة:', e);
                        }
                    }
                    
                    // حفظ بيانات الجلسة
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    
                    // إشعار النجاح
                    alert('✅ تم تسجيل الدخول بنجاح!');
                    
                    // إعادة التوجيه للصفحة الرئيسية
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } else {
                    alert('❌ اسم المستخدم أو كلمة المرور غير صحيحة!');
                }
            });
        }
    },
    
    // التحقق من تسجيل الدخول
    isLoggedIn: function() {
        const user = localStorage.getItem('currentUser');
        return user !== null;
    },
    
    // تسجيل الخروج
    logout: function() {
        localStorage.removeItem('currentUser');
        alert('تم تسجيل الخروج بنجاح!');
        window.location.href = 'login.html';
    },
    
    // جلب المستخدم الحالي
    getCurrentUser: function() {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr) return null;
        
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('خطأ في تحليل بيانات المستخدم:', e);
            return null;
        }
    },
    
    // تهيئة النظام
    init: function() {
        console.log('🚀 نظام المصادقة محمل وجاهز');
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
