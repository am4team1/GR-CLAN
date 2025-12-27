// نظام المصادقة الإدارية - GR CLAN (معدل للنظام الجديد)
const AdminAuthSystem = {
    // ===== بيانات المسؤولين المعدلة =====
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
    
    // ===== تسجيل دخول الأدمن (محدث للنظام الجديد) =====
    adminLogin: function(username, password) {
        console.log(`🔐 محاولة تسجيل دخول أدمن: ${username}`);
        
        try {
            const user = this.adminUsers[username];
            
            if (!user) {
                this.logAdminActivity('login_failed', { username, reason: 'user_not_found' });
                return { success: false, message: 'اسم المستخدم غير موجود' };
            }
            
            if (user.password === password) {
                // إنشاء هاش فريد للأدمن
                const adminHash = this.generateAdminHash(username);
                
                // التحقق من وجود الأدمن في الفهرس
                let adminIndex = StorageEngine.loadIndex('admins');
                let adminInfo = adminIndex.items[adminHash];
                
                // إذا لم يكن الأدمن موجوداً في الفهرس، إضافته
                if (!adminInfo) {
                    adminInfo = {
                        username: username,
                        hash: adminHash,
                        role: user.role,
                        fullName: user.fullName,
                        email: user.email,
                        joinDate: user.joinDate,
                        lastLogin: new Date().toISOString(),
                        permissions: user.permissions,
                        status: 'active',
                        created: Date.now()
                    };
                    
                    adminIndex.items[adminHash] = adminInfo;
                    adminIndex.count = Object.keys(adminIndex.items).length;
                    adminIndex.lastUpdate = Date.now();
                    
                    StorageEngine.saveToVirtualFS('data/admins_index.json', adminIndex);
                } else {
                    // تحديث آخر دخول
                    adminInfo.lastLogin = new Date().toISOString();
                    adminIndex.items[adminHash] = adminInfo;
                    StorageEngine.saveToVirtualFS('data/admins_index.json', adminIndex);
                }
                
                // إنشاء ID فريد للجلسة الإدارية
                const sessionId = `admin_session_${username}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                // حفظ بيانات الجلسة
                const sessionData = {
                    sessionId: sessionId,
                    adminHash: adminHash,
                    username: username,
                    role: user.role,
                    fullName: user.fullName,
                    email: user.email,
                    permissions: user.permissions,
                    joinDate: user.joinDate,
                    loginTime: new Date().toISOString(),
                    loginTimestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    token: this.generateToken(),
                    lastActivity: Date.now()
                };
                
                localStorage.setItem('adminSession', JSON.stringify(sessionData));
                
                // تسجيل النشاط
                this.logAdminActivity('login_success', { 
                    username, 
                    adminHash: adminHash.substr(0, 20) + '...',
                    role: user.role 
                });
                
                // تحديث إحصائيات النظام
                StorageEngine.updateSystemStats('admin_logins', 1);
                
                console.log(`✅ تم تسجيل دخول الأدمن: ${username} (${user.role}) - ${adminHash.substr(0, 20)}...`);
                
                return { 
                    success: true, 
                    user: sessionData,
                    adminHash: adminHash
                };
                
            } else {
                this.logAdminActivity('login_failed', { username, reason: 'wrong_password' });
                return { success: false, message: 'كلمة المرور غير صحيحة' };
            }
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل دخول الأدمن:', error);
            this.logAdminActivity('login_error', { username, error: error.message });
            
            return { 
                success: false, 
                message: 'خطأ في النظام، يرجى المحاولة لاحقاً' 
            };
        }
    },
    
    // ===== توليد هاش فريد للأدمن =====
    generateAdminHash: function(username) {
        // استخدام نفس نظام توليد الهاش ولكن ببادئة مختلفة
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const uniqueString = `admin_${username}_${timestamp}_${random}_${performance.now()}`;
        
        let hash = '';
        for (let i = 0; i < uniqueString.length; i++) {
            const charCode = uniqueString.charCodeAt(i);
            hash += charCode.toString(36);
        }
        
        // جعل الطول 150 حرف
        while (hash.length < 150) {
            const randomNum = Math.floor(Math.random() * 1e15);
            hash += randomNum.toString(36);
        }
        
        hash = hash.substr(0, 150);
        
        // إضافة رموز خاصة
        const specialChars = '!@#$%^&*()_-+=[]{}|;:,.<>?';
        const positions = [25, 50, 75, 100, 125];
        
        positions.forEach(pos => {
            if (pos < hash.length) {
                const randomChar = specialChars[Math.floor(Math.random() * specialChars.length)];
                hash = hash.substr(0, pos) + randomChar + hash.substr(pos + 1);
            }
        });
        
        return hash;
    },
    
    // ===== التحقق من جلسة الأدمن (محدث) =====
    checkAdminSession: function() {
        try {
            const session = localStorage.getItem('adminSession');
            if (!session) {
                console.log('❌ لا توجد جلسة أدمن نشطة');
                return null;
            }
            
            const data = JSON.parse(session);
            
            // التحقق من انتهاء صلاحية الجلسة (ساعتين)
            const sessionAge = Date.now() - data.loginTimestamp;
            const sessionTimeout = 2 * 60 * 60 * 1000; // ساعتين
            
            if (sessionAge > sessionTimeout) {
                console.log('⌛ انتهت صلاحية جلسة الأدمن');
                this.adminLogout();
                return null;
            }
            
            // تحديث آخر نشاط
            data.lastActivity = Date.now();
            localStorage.setItem('adminSession', JSON.stringify(data));
            
            console.log(`🔍 جلسة أدمن نشطة: ${data.username} (${data.role}) - ${data.adminHash.substr(0, 20)}...`);
            
            return data;
            
        } catch (e) {
            console.error('❌ خطأ في تحليل جلسة الأدمن:', e);
            return null;
        }
    },
    
    // ===== تسجيل خروج الأدمن (محدث) =====
    adminLogout: function() {
        try {
            const session = this.checkAdminSession();
            if (session) {
                // تسجيل نشاط الخروج
                this.logAdminActivity('logout', {
                    username: session.username,
                    adminHash: session.adminHash,
                    sessionDuration: Date.now() - session.loginTimestamp
                });
                
                console.log(`👋 تم تسجيل خروج الأدمن: ${session.username} (${session.adminHash.substr(0, 20)}...)`);
            }
            
            localStorage.removeItem('adminSession');
            
            return { success: true, timestamp: Date.now() };
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل خروج الأدمن:', error);
            return { success: false, error: error.message };
        }
    },
    
    // ===== التحقق من الصلاحية (محدث) =====
    hasPermission: function(permission) {
        const session = this.checkAdminSession();
        if (!session) return false;
        
        // الأونرز لديهم كل الصلاحيات
        if (session.role === 'owner') return true;
        
        // التحقق من صلاحيات الأدمن
        return session.permissions.includes('all') || 
               session.permissions.includes(permission);
    },
    
    // ===== توليد توكن =====
    generateToken: function() {
        return 'admin_token_' + Math.random().toString(36).substr(2) + '_' + Date.now().toString(36);
    },
    
    // ===== جلب الأدمن الحالي =====
    getCurrentAdmin: function() {
        return this.checkAdminSession();
    },
    
    // ===== جلب جميع الأدمنز من الفهرس =====
    getAllAdmins: function() {
        try {
            const index = StorageEngine.loadIndex('admins');
            return {
                success: true,
                admins: Object.values(index.items),
                count: index.count,
                lastUpdate: index.lastUpdate
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                admins: [],
                count: 0
            };
        }
    },
    
    // ===== التحقق إذا كان أدمن =====
    isAdmin: function() {
        return this.checkAdminSession() !== null;
    },
    
    // ===== التحقق إذا كان أونر =====
    isOwner: function() {
        const session = this.checkAdminSession();
        return session && session.role === 'owner';
    },
    
    // ===== تسجيل نشاط الأدمن =====
    logAdminActivity: function(action, details = {}) {
        try {
            const session = this.checkAdminSession();
            const adminHash = session ? session.adminHash : 'system';
            const username = session ? session.username : 'system';
            
            // تسجيل في سجل النظام
            StorageEngine.logSystemActivity(`admin_${action}`, {
                adminHash: adminHash.substr(0, 20) + '...',
                username: username,
                ...details
            });
            
            // إذا كان هناك أدمن مسجل دخول، تسجيل في سجله الشخصي
            if (session && session.adminHash) {
                StorageEngine.logUserActivity(session.adminHash, `admin_${action}`, {
                    ...details,
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل نشاط الأدمن:', error);
        }
    },
    
    // ===== تحديث بيانات الأدمن =====
    updateAdminProfile: function(username, updates) {
        try {
            // البحث عن الأدمن في الفهرس
            const index = StorageEngine.loadIndex('admins');
            let adminHash = null;
            
            // البحث عن الهاش باستخدام اسم المستخدم
            for (const [hash, adminInfo] of Object.entries(index.items)) {
                if (adminInfo.username === username) {
                    adminHash = hash;
                    break;
                }
            }
            
            if (!adminHash) {
                throw new Error('الأدمن غير موجود');
            }
            
            // تحديث البيانات
            const adminInfo = index.items[adminHash];
            index.items[adminHash] = {
                ...adminInfo,
                ...updates,
                updated: Date.now()
            };
            
            index.lastUpdate = Date.now();
            StorageEngine.saveToVirtualFS('data/admins_index.json', index);
            
            // تسجيل النشاط
            this.logAdminActivity('profile_updated', {
                username: username,
                adminHash: adminHash.substr(0, 20) + '...',
                fields: Object.keys(updates)
            });
            
            console.log(`📝 تم تحديث بيانات الأدمن: ${username}`);
            
            return {
                success: true,
                adminHash: adminHash,
                updatedFields: Object.keys(updates)
            };
            
        } catch (error) {
            console.error('❌ خطأ في تحديث بيانات الأدمن:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // ===== تهيئة نموذج تسجيل دخول الأدمن =====
    initAdminLoginForm: function() {
        if (document.getElementById('adminLoginForm')) {
            document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const username = document.getElementById('adminUsername').value.trim();
                const password = document.getElementById('adminPassword').value;
                
                const result = AdminAuthSystem.adminLogin(username, password);
                
                if (result.success) {
                    alert(`✅ مرحباً ${result.user.fullName}! تم تسجيل دخولك بنجاح.`);
                    
                    // إعادة التوجيه للوحة التحكم
                    setTimeout(() => {
                        window.location.href = 'admin/dashboard.html';
                    }, 1000);
                } else {
                    alert(`❌ ${result.message}`);
                }
            });
        }
    },
    
    // ===== تهيئة النظام =====
    init: function() {
        console.log('🚀 نظام المصادقة الإدارية المعدل محمل وجاهز');
        
        // التأكد من وجود StorageEngine
        if (!window.StorageEngine) {
            console.error('❌ StorageEngine غير محمل');
            return false;
        }
        
        // تهيئة الفهرس إذا لم يكن موجوداً
        StorageEngine.loadIndex('admins');
        
        // إحصائيات النظام
        console.log('📊 إحصائيات النظام الإداري:');
        console.log(`   👑 عدد الأونرز: 2`);
        console.log(`   ⚡ عدد الأدمنز: 10`);
        console.log(`   👥 إجمالي المسؤولين: 12`);
        console.log(`   🔐 نظام الهاش: 150 حرف فريد لكل أدمن`);
        
        // إضافة مستمعين للأحداث
        this.initAdminLoginForm();
        
        // تنظيف الجلسات المنتهية
        this.cleanupExpiredSessions();
        
        console.log('✅ نظام المصادقة الإدارية جاهز للعمل');
        
        return {
            status: 'ready',
            version: '2.0',
            timestamp: Date.now()
        };
    },
    
    // ===== تنظيف الجلسات المنتهية =====
    cleanupExpiredSessions: function() {
        try {
            const session = localStorage.getItem('adminSession');
            if (!session) return;
            
            const data = JSON.parse(session);
            const sessionAge = Date.now() - data.loginTimestamp;
            const sessionTimeout = 2 * 60 * 60 * 1000; // ساعتين
            
            if (sessionAge > sessionTimeout) {
                console.log('🧹 تنظيف جلسة أدمن منتهية الصلاحية');
                localStorage.removeItem('adminSession');
            }
        } catch (error) {
            console.error('❌ خطأ في تنظيف الجلسات:', error);
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
