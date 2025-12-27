// نظام المصادقة الإدارية - GR CLAN
const AdminAuthSystem = {
    // بيانات المسؤولين (تغيير كلمات المرور فوراً!)
    adminUsers: {
        // ===== الأونرز (المالكون) =====
        'gr_owner1': {
            password: 'Owner1Pass2024!', // غيرها!
            role: 'owner',
            fullName: 'مالك الكلان الأول',
            email: 'owner1@grclan.com',
            permissions: ['all'],
            joinDate: '2024-01-01'
        },
        'gr_owner2': {
            password: 'Owner2Pass2024!', // غيرها!
            role: 'owner',
            fullName: 'مالك الكلان الثاني',
            email: 'owner2@grclan.com',
            permissions: ['all'],
            joinDate: '2024-01-01'
        },
        
        // ===== الأدمنز (المشرفون) =====
        'gr_admin1': {
            password: 'Admin1Pass2024!', // غيرها!
            role: 'admin',
            fullName: 'المشرف الأول',
            email: 'admin1@grclan.com',
            permissions: ['manage_news', 'manage_applications', 'view_stats', 'manage_members'],
            joinDate: '2024-01-01'
        },
        'gr_admin2': {
            password: 'Admin2Pass2024!', // غيرها!
            role: 'admin',
            fullName: 'المشرف الثاني',
            email: 'admin2@grclan.com',
            permissions: ['manage_news', 'manage_applications', 'view_stats'],
            joinDate: '2024-01-01'
        },
        'gr_admin3': {
            password: 'Admin3Pass2024!', // غيرها!
            role: 'admin',
            fullName: 'المشرف الثالث',
            email: 'admin3@grclan.com',
            permissions: ['manage_news', 'view_stats'],
            joinDate: '2024-01-01'
        },
        'gr_admin4': {
            password: 'Admin4Pass2024!', // غيرها!
            role: 'admin',
            fullName: 'المشرف الرابع',
            email: 'admin4@grclan.com',
            permissions: ['manage_applications', 'manage_members'],
            joinDate: '2024-01-01'
        },
        'gr_admin5': {
            password: 'Admin5Pass2024!', // غيرها!
            role: 'admin',
            fullName: 'المشرف الخامس',
            email: 'admin5@grclan.com',
            permissions: ['manage_news', 'manage_applications'],
            joinDate: '2024-01-01'
        },
        'gr_admin6': {
            password: 'Admin6Pass2024!', // غيرها!
            role: 'admin',
            fullName: 'المشرف السادس',
            email: 'admin6@grclan.com',
            permissions: ['view_stats', 'manage_members'],
            joinDate: '2024-01-01'
        },
        'gr_admin7': {
            password: 'Admin7Pass2024!', // غيرها!
            role: 'admin',
            fullName: 'المشرف السابع',
            email: 'admin7@grclan.com',
            permissions: ['manage_news'],
            joinDate: '2024-01-01'
        },
        'gr_admin8': {
            password: 'Admin8Pass2024!', // غيرها!
            role: 'admin',
            fullName: 'المشرف الثامن',
            email: 'admin8@grclan.com',
            permissions: ['manage_applications'],
            joinDate: '2024-01-01'
        },
        'gr_admin9': {
            password: 'Admin9Pass2024!', // غيرها!
            role: 'admin',
            fullName: 'المشرف التاسع',
            email: 'admin9@grclan.com',
            permissions: ['view_stats'],
            joinDate: '2024-01-01'
        },
        'gr_admin10': {
            password: 'Admin10Pass2024!', // غيرها!
            role: 'admin',
            fullName: 'المشرف العاشر',
            email: 'admin10@grclan.com',
            permissions: ['manage_members'],
            joinDate: '2024-01-01'
        }
    },
    
    // تسجيل دخول الأدمن
    adminLogin: function(username, password) {
        const user = this.adminUsers[username];
        
        if (!user) {
            return { success: false, message: 'اسم المستخدم غير موجود' };
        }
        
        if (user.password === password) {
            // إنشاء ID فريد للجلسة الإدارية
            const sessionId = `admin_${username}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // حفظ بيانات الجلسة
            const sessionData = {
                sessionId: sessionId, // ← ID فريد للجلسة
                username: username,
                role: user.role,
                fullName: user.fullName,
                email: user.email,
                permissions: user.permissions,
                joinDate: user.joinDate,
                loginTime: new Date().toISOString(),
                token: this.generateToken()
            };
            
            localStorage.setItem('adminSession', JSON.stringify(sessionData));
            console.log(`✅ تم تسجيل دخول الأدمن: ${username} (${user.role}) - ${sessionId}`);
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
            console.log(`🔍 جلسة أدمن موجودة: ${data.username} (${data.role}) - ${data.sessionId}`);
            return data;
        } catch (e) {
            console.error('❌ خطأ في تحليل جلسة الأدمن:', e);
            return null;
        }
    },
    
    // تسجيل الخروج
    adminLogout: function() {
        const session = this.checkAdminSession();
        if (session) {
            console.log(`👋 تم تسجيل خروج الأدمن: ${session.username} (${session.sessionId})`);
        }
        localStorage.removeItem('adminSession');
    },
    
    // التحقق من الصلاحية
    hasPermission: function(permission) {
        const session = this.checkAdminSession();
        if (!session) return false;
        
        // الأونرز لديهم كل الصلاحيات
        if (session.role === 'owner') return true;
        
        // التحقق من صلاحيات الأدمن
        return session.permissions.includes('all') || 
               session.permissions.includes(permission);
    },
    
    // توليد توكن
    generateToken: function() {
        return 'admin_token_' + Math.random().toString(36).substr(2) + '_' + Date.now().toString(36);
    },
    
    // جلب الأدمن الحالي
    getCurrentAdmin: function() {
        return this.checkAdminSession();
    },
    
    // جلب جميع الأدمنز
    getAllAdmins: function() {
        return this.adminUsers;
    },
    
    // التحقق إذا كان أدمن
    isAdmin: function() {
        return this.checkAdminSession() !== null;
    },
    
    // التحقق إذا كان أونر
    isOwner: function() {
        const session = this.checkAdminSession();
        return session && session.role === 'owner';
    },
    
    // تهيئة النظام
    init: function() {
        console.log('🚀 نظام المصادقة الإدارية محمل وجاهز');
        console.log('📊 إحصائيات النظام:');
        console.log(`   👑 عدد الأونرز: 2`);
        console.log(`   ⚡ عدد الأدمنز: 10`);
        console.log(`   👥 إجمالي المسؤولين: 12`);
        
        // إضافة مستمعين للأحداث إذا كان هناك نموذج تسجيل دخول أدمن
        this.initAdminLoginForm();
    },
    
    // تهيئة نموذج تسجيل دخول الأدمن
    initAdminLoginForm: function() {
        if (document.getElementById('adminLoginForm')) {
            document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const username = document.getElementById('adminUsername').value.trim();
                const password = document.getElementById('adminPassword').value;
                
                const result = AdminAuthSystem.adminLogin(username, password);
                
                if (result.success) {
                    alert(`✅ مرحباً ${result.user.fullName}! تم تسجيل دخولك بنجاح.`);
                    window.location.href = 'admin/dashboard.html'; // أو الصفحة الإدارية المناسبة
                } else {
                    alert(`❌ ${result.message}`);
                }
            });
        }
    }
};

// جعل النظام متاحاً عالمياً
window.AdminAuthSystem = AdminAuthSystem;

// تهيئة النظام عند التحميل
if (window.AdminAuthSystem) {
    document.addEventListener('DOMContentLoaded', function() {
        window.AdminAuthSystem.init();
    });
}
