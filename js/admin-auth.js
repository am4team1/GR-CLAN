// نظام المصادقة الإدارية
const AdminAuthSystem = {
    // بيانات المسؤولين (يتم تخزينها في قاعدة بيانات لاحقاً)
    adminUsers: {
        // الأونر
        'gr_owner': {
            password: 'OwnerPass2024!', // غيرها فوراً!
            role: 'owner',
            fullName: 'مالك الكلان',
            permissions: ['all']
        },
        // الأدمنز
        'gr_admin1': {
            password: 'Admin1Pass2024!', // غيرها فوراً!
            role: 'admin',
            fullName: 'المشرف الأول',
            permissions: ['manage_news', 'manage_applications', 'view_stats']
        },
        'gr_admin2': {
            password: 'Admin2Pass2024!', // غيرها فوراً!
            role: 'admin',
            fullName: 'المشرف الثاني',
            permissions: ['manage_news']
        }
    },
    
    // تسجيل دخول الأدمن
    adminLogin: function(username, password) {
        const user = this.adminUsers[username];
        
        if (!user) {
            return { success: false, message: 'اسم المستخدم غير موجود' };
        }
        
        if (user.password === password) {
            // حفظ بيانات الجلسة
            const sessionData = {
                username: username,
                role: user.role,
                fullName: user.fullName,
                permissions: user.permissions,
                loginTime: new Date().toISOString(),
                token: this.generateToken()
            };
            
            localStorage.setItem('adminSession', JSON.stringify(sessionData));
            return { success: true, user: sessionData };
        }
        
        return { success: false, message: 'كلمة المرور غير صحيحة' };
    },
    
    // التحقق من الجلسة
    checkAdminSession: function() {
        const session = localStorage.getItem('adminSession');
        if (!session) return null;
        
        try {
            const data = JSON.parse(session);
            
            // التحقق من انتهاء الصلاحية (24 ساعة)
            const loginTime = new Date(data.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                this.adminLogout();
                return null;
            }
            
            return data;
        } catch (e) {
            return null;
        }
    },
    
    // تسجيل الخروج
    adminLogout: function() {
        localStorage.removeItem('adminSession');
    },
    
    // التحقق من الصلاحية
    hasPermission: function(permission) {
        const session = this.checkAdminSession();
        if (!session) return false;
        
        // الأونر لديه كل الصلاحيات
        if (session.role === 'owner') return true;
        
        // التحقق من صلاحيات الأدمن
        return session.permissions.includes('all') || 
               session.permissions.includes(permission);
    },
    
    // توليد توكن
    generateToken: function() {
        return 'admin_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
    },
    
    // جلب الأدمن الحالي
    getCurrentAdmin: function() {
        return this.checkAdminSession();
    }
};

// جعل النظام متاحاً عالمياً
window.AdminAuthSystem = AdminAuthSystem;
