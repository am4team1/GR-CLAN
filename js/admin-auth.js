// نظام المصادقة الإدارية
const AdminAuthSystem = {
    // بيانات المسؤولين (تغيير كلمات المرور فوراً!)
    adminUsers: {
        // الأونر
        'gr_owner': {
            password: 'OwnerPass2024', // غيرها! OwnerPass2024
            role: 'owner',
            fullName: 'مالك الكلان',
            permissions: ['all']
        },
        // الأدمنز
        'gr_admin1': {
            password: 'Admin1Pass2024', // غيرها!
            role: 'admin',
            fullName: 'المشرف الأول',
            permissions: ['manage_news', 'manage_applications', 'view_stats']
        },
        'gr_admin2': {
            password: 'Admin2Pass2024', // غيرها!
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
            console.log(`✅ تم تسجيل دخول الأدمن: ${username} (${user.role})`);
            return { success: true, user: sessionData };
        }
        
        return { success: false, message: 'كلمة المرور غير صحيحة' };
    },
    
    // التحقق من الجلسة
    checkAdminSession: function() {
        const session = localStorage.getItem('adminSession');
        if (!session) {
            console.log('❌ لا توجد جلسة أدمن نشطة');
            return null;
        }
        
        try {
            const data = JSON.parse(session);
            console.log(`🔍 جلسة أدمن موجودة: ${data.username} (${data.role})`);
            return data;
        } catch (e) {
            console.error('❌ خطأ في تحليل جلسة الأدمن:', e);
            return null;
        }
    },
    
    // تسجيل الخروج
    adminLogout: function() {
        console.log('👋 تم تسجيل خروج الأدمن');
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
    },
    
    // تهيئة النظام (اختياري)
    init: function() {
        console.log('🚀 نظام المصادقة الإدارية محمل وجاهز');
        console.log('👑 حسابات الأدمن المتاحة:');
        Object.keys(this.adminUsers).forEach(username => {
            const user = this.adminUsers[username];
            console.log(`   ${username} - ${user.role} (${user.fullName})`);
        });
    }
};

// جعل النظام متاحاً عالمياً
window.AdminAuthSystem = AdminAuthSystem;

// تهيئة النظام عند التحميل
if (window.AdminAuthSystem) {
    window.AdminAuthSystem.init();
}
