/**
 * مدير المستخدمين - GR CLAN User Manager
 * واجهة مبسطة للتعامل مع نظام التخزين
 */

const UserManager = {
    // ===== تسجيل مستخدم جديد =====
    registerUser: function(userData) {
        console.log('📝 بدء تسجيل مستخدم جديد...');
        
        try {
            // 1. التحقق من البيانات
            if (!userData.username || !userData.pubgId) {
                throw new Error('البيانات غير مكتملة');
            }
            
            // 2. استخدام StorageEngine لإنشاء المستخدم
            const result = StorageEngine.createUserFolder(userData);
            
            if (!result.success) {
                throw new Error('فشل في إنشاء حساب المستخدم');
            }
            
            // 3. حفظ بيانات الجلسة
            const sessionData = {
                userHash: result.userHash,
                username: userData.username,
                pubgId: userData.pubgId,
                email: userData.email || '',
                phone: userData.phone || '',
                role: userData.role || 'عضو',
                joinDate: result.profile.joinDate,
                lastLogin: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(sessionData));
            
            // 4. تسجيل النشاط
            StorageEngine.logSystemActivity('user_registered', {
                username: userData.username,
                userHash: result.userHash.substr(0, 20) + '...'
            });
            
            console.log('✅ تم تسجيل مستخدم جديد بنجاح');
            
            return {
                success: true,
                userHash: result.userHash,
                userData: sessionData
            };
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل المستخدم:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // ===== تسجيل الدخول =====
    loginUser: function(username, password) {
        console.log('🔑 محاولة تسجيل دخول...');
        
        try {
            // 1. البحث عن المستخدم في الفهرس
            const userInfo = StorageEngine.findUserByUsername(username);
            
            if (!userInfo) {
                throw new Error('اسم المستخدم غير موجود');
            }
            
            // 2. تحميل بيانات المستخدم
            const userProfile = StorageEngine.loadUserProfile(userInfo.hash);
            
            if (!userProfile) {
                throw new Error('خطأ في تحميل بيانات المستخدم');
            }
            
            // 3. التحقق من كلمة المرور (في نظام حقيقي يجب تشفيرها)
            // هنا نتحقق من localStorage للمستخدمين القدامى
            const oldUsers = JSON.parse(localStorage.getItem('gr_users') || '[]');
            const oldUser = oldUsers.find(u => u.username === username && u.password === password);
            
            if (!oldUser) {
                // البحث في النظام الجديد
                // (في نظام حقيقي، كلمات المرور تكون مشفرة في profile.json)
                throw new Error('كلمة المرور غير صحيحة');
            }
            
            // 4. تحديث آخر دخول
            userProfile.lastLogin = new Date().toISOString();
            StorageEngine.updateUserProfile(userInfo.hash, {
                lastLogin: userProfile.lastLogin
            });
            
            // 5. حفظ بيانات الجلسة
            const sessionData = {
                userHash: userInfo.hash,
                username: userProfile.username,
                pubgId: userProfile.pubgId,
                email: userProfile.email || '',
                phone: userProfile.phone || '',
                role: userProfile.role || 'عضو',
                joinDate: userProfile.joinDate,
                lastLogin: userProfile.lastLogin,
                profilePic: userProfile.profilePic
            };
            
            localStorage.setItem('currentUser', JSON.stringify(sessionData));
            
            // 6. تسجيل النشاط
            StorageEngine.logUserActivity(userInfo.hash, 'login_success', {
                timestamp: Date.now(),
                userAgent: navigator.userAgent
            });
            
            console.log('✅ تم تسجيل الدخول بنجاح');
            
            return {
                success: true,
                userData: sessionData
            };
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل الدخول:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // ===== تحميل المستخدم الحالي =====
    loadCurrentUser: function() {
        try {
            // 1. التحقق من وجود جلسة
            const sessionStr = localStorage.getItem('currentUser');
            
            if (!sessionStr) {
                return null;
            }
            
            const session = JSON.parse(sessionStr);
            
            // 2. إذا كان المستخدم من النظام القديم (بدون userHash)
            if (!session.userHash && session.username) {
                // محاولة البحث عن الهاش
                const userInfo = StorageEngine.findUserByUsername(session.username);
                
                if (userInfo) {
                    // تحديث الجلسة بالهاش الجديد
                    session.userHash = userInfo.hash;
                    localStorage.setItem('currentUser', JSON.stringify(session));
                } else {
                    // إذا لم يوجد، إنشاء مستخدم جديد في النظام الجديد
                    console.log('🔄 ترحيل مستخدم قديم إلى النظام الجديد...');
                    
                    const migrationResult = this.migrateOldUser(session);
                    
                    if (migrationResult.success) {
                        session.userHash = migrationResult.userHash;
                        localStorage.setItem('currentUser', JSON.stringify(session));
                    } else {
                        throw new Error('فشل في ترحيل بيانات المستخدم القديم');
                    }
                }
            }
            
            // 3. تحميل البيانات الكاملة من النظام الجديد
            if (session.userHash) {
                const fullProfile = StorageEngine.loadUserProfile(session.userHash);
                
                if (fullProfile) {
                    return {
                        ...session,
                        ...fullProfile,
                        settings: fullProfile.settings || {},
                        activity: fullProfile.activity || []
                    };
                }
            }
            
            return session;
            
        } catch (error) {
            console.error('❌ خطأ في تحميل بيانات المستخدم:', error);
            return null;
        }
    },
    
    // ===== ترحيل المستخدمين القدامى =====
    migrateOldUser: function(oldUserData) {
        console.log('🔄 بدء ترحيل مستخدم قديم...');
        
        try {
            // 1. البحث عن بيانات المستخدم القديمة
            const oldUsers = JSON.parse(localStorage.getItem('gr_users') || '[]');
            const oldUser = oldUsers.find(u => u.username === oldUserData.username);
            
            if (!oldUser) {
                throw new Error('لم يتم العثور على بيانات المستخدم القديمة');
            }
            
            // 2. إنشاء مستخدم جديد في النظام الجديد
            const newUserData = {
                username: oldUser.username,
                pubgId: oldUser.pubgId || '',
                email: oldUser.email || '',
                phone: oldUser.phone || '',
                role: oldUser.role || 'عضو'
            };
            
            const creationResult = StorageEngine.createUserFolder(newUserData);
            
            if (!creationResult.success) {
                throw new Error('فشل في إنشاء مستخدم جديد');
            }
            
            // 3. نسخ أي بيانات شخصية محفوظة
            const oldUserKey = `gr_clan_user_${oldUser.username}`;
            const oldUserDataStr = localStorage.getItem(oldUserKey);
            
            if (oldUserDataStr) {
                try {
                    const oldUserProfile = JSON.parse(oldUserDataStr);
                    
                    // تحديث بيانات المستخدم الجديد
                    StorageEngine.updateUserProfile(creationResult.userHash, {
                        email: oldUserProfile.email || oldUser.email || '',
                        phone: oldUserProfile.phone || oldUser.phone || '',
                        pubgId: oldUserProfile.pubgId || oldUser.pubgId || ''
                    });
                    
                    // نسخ الصورة الشخصية إذا كانت موجودة
                    if (oldUserProfile.profilePic && 
                        oldUserProfile.profilePic !== 'assets/images/default-avatar.png') {
                        StorageEngine.saveProfilePicture(
                            creationResult.userHash, 
                            oldUserProfile.profilePic
                        );
                    }
                    
                } catch (parseError) {
                    console.warn('تحذير: فشل في تحليل بيانات المستخدم القديمة:', parseError);
                }
            }
            
            // 4. حذف البيانات القديمة
            localStorage.removeItem(oldUserKey);
            
            console.log('✅ تم ترحيل المستخدم القديم بنجاح');
            
            return {
                success: true,
                userHash: creationResult.userHash,
                oldUsername: oldUser.username
            };
            
        } catch (error) {
            console.error('❌ خطأ في ترحيل المستخدم:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // ===== تحديث بيانات المستخدم =====
    updateUserProfile: function(updates) {
        try {
            const currentUser = this.loadCurrentUser();
            
            if (!currentUser || !currentUser.userHash) {
                throw new Error('لم يتم تسجيل الدخول');
            }
            
            // تحديث في StorageEngine
            const updatedProfile = StorageEngine.updateUserProfile(
                currentUser.userHash, 
                updates
            );
            
            // تحديث بيانات الجلسة
            const sessionData = {
                ...currentUser,
                ...updates,
                lastUpdate: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(sessionData));
            
            return {
                success: true,
                profile: updatedProfile,
                session: sessionData
            };
            
        } catch (error) {
            console.error('❌ خطأ في تحديث بيانات المستخدم:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // ===== تغيير صورة الملف الشخصي =====
    updateProfilePicture: function(imageFile) {
        return new Promise((resolve, reject) => {
            try {
                const currentUser = this.loadCurrentUser();
                
                if (!currentUser || !currentUser.userHash) {
                    throw new Error('لم يتم تسجيل الدخول');
                }
                
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    try {
                        // حفظ الصورة في StorageEngine
                        const result = StorageEngine.saveProfilePicture(
                            currentUser.userHash,
                            event.target.result
                        );
                        
                        if (result.success) {
                            // تحديث بيانات الجلسة
                            const sessionData = {
                                ...currentUser,
                                profilePic: event.target.result,
                                lastUpdate: new Date().toISOString()
                            };
                            
                            localStorage.setItem('currentUser', JSON.stringify(sessionData));
                            
                            resolve({
                                success: true,
                                imageData: event.target.result,
                                backupCreated: result.backupCreated
                            });
                        } else {
                            reject(new Error('فشل في حفظ الصورة'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = function() {
                    reject(new Error('خطأ في قراءة الملف'));
                };
                
                reader.readAsDataURL(imageFile);
                
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // ===== تسجيل الخروج =====
    logoutUser: function() {
        try {
            const currentUser = this.loadCurrentUser();
            
            if (currentUser && currentUser.userHash) {
                // تسجيل نشاط الخروج
                StorageEngine.logUserActivity(currentUser.userHash, 'logout', {
                    timestamp: Date.now()
                });
            }
            
            // مسح بيانات الجلسة
            localStorage.removeItem('currentUser');
            
            console.log('👋 تم تسجيل الخروج بنجاح');
            
            return {
                success: true,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('❌ خطأ في تسجيل الخروج:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // ===== حذف الحساب =====
    deleteUserAccount: function() {
        try {
            const currentUser = this.loadCurrentUser();
            
            if (!currentUser || !currentUser.userHash) {
                throw new Error('لم يتم تسجيل الدخول');
            }
            
            // 1. إنشاء نسخة احتياطية نهائية
            StorageEngine.createBackup(currentUser.userHash);
            
            // 2. تسجيل النشاط
            StorageEngine.logUserActivity(currentUser.userHash, 'account_deleted', {
                timestamp: Date.now(),
                reason: 'user_request'
            });
            
            // 3. تحديث الفهرس (وضع علامة محذوف)
            const index = StorageEngine.loadIndex('users');
            if (index.items[currentUser.userHash]) {
                index.items[currentUser.userHash].status = 'deleted';
                index.items[currentUser.userHash].deletedAt = Date.now();
                StorageEngine.saveToVirtualFS('data/users_index.json', index);
            }
            
            // 4. تحديث بيانات المستخدم
            StorageEngine.updateUserProfile(currentUser.userHash, {
                status: 'deleted',
                deletedAt: new Date().toISOString()
            });
            
            // 5. مسح بيانات الجلسة
            localStorage.removeItem('currentUser');
            
            // 6. حذف من قاعدة البيانات القديمة
            const oldUsers = JSON.parse(localStorage.getItem('gr_users') || '[]');
            const updatedOldUsers = oldUsers.filter(u => u.username !== currentUser.username);
            localStorage.setItem('gr_users', JSON.stringify(updatedOldUsers));
            
            console.log('🗑️ تم حذف حساب المستخدم');
            
            return {
                success: true,
                userHash: currentUser.userHash,
                username: currentUser.username,
                deletedAt: Date.now()
            };
            
        } catch (error) {
            console.error('❌ خطأ في حذف الحساب:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // ===== البحث عن مستخدم =====
    searchUser: function(searchTerm) {
        try {
            const index = StorageEngine.loadIndex('users');
            const results = [];
            
            for (const [hash, userInfo] of Object.entries(index.items)) {
                // البحث بالاسم أو المعرف
                if (userInfo.username.includes(searchTerm) || 
                    hash.includes(searchTerm) ||
                    (userInfo.pubgId && userInfo.pubgId.includes(searchTerm))) {
                    
                    // تحميل بيانات إضافية
                    const profile = StorageEngine.loadUserProfile(hash);
                    
                    results.push({
                        hash: hash,
                        username: userInfo.username,
                        pubgId: profile?.pubgId || '',
                        joinDate: userInfo.joinDate,
                        lastLogin: userInfo.lastLogin,
                        profilePic: profile?.profilePic || StorageEngine.getDefaultAvatar()
                    });
                }
            }
            
            return {
                success: true,
                results: results,
                count: results.length
            };
            
        } catch (error) {
            console.error('❌ خطأ في البحث:', error);
            
            return {
                success: false,
                error: error.message,
                results: []
            };
        }
    },
    
    // ===== إحصائيات المستخدم =====
    getUserStats: function() {
        try {
            const index = StorageEngine.loadIndex('users');
            const stats = StorageEngine.loadFromVirtualFS('data/system/stats.json');
            
            return {
                success: true,
                stats: {
                    totalUsers: index.count || 0,
                    activeUsers: Object.values(index.items).filter(u => 
                        !u.status || u.status === 'active'
                    ).length,
                    newToday: Object.values(index.items).filter(u => {
                        const joinDate = new Date(u.joinDate);
                        const today = new Date();
                        return joinDate.toDateString() === today.toDateString();
                    }).length,
                    systemStats: stats?.counters || {}
                }
            };
            
        } catch (error) {
            console.error('❌ خطأ في جلب الإحصائيات:', error);
            
            return {
                success: false,
                error: error.message,
                stats: {}
            };
        }
    },
    
    // ===== التهيئة =====
    init: function() {
        console.log('👤 تهيئة مدير المستخدمين...');
        
        // التأكد من تهيئة StorageEngine أولاً
        if (!window.StorageEngine) {
            console.error('❌ StorageEngine غير محمل');
            return false;
        }
        
        StorageEngine.init();
        
        console.log('✅ مدير المستخدمين جاهز للعمل');
        
        return {
            status: 'ready',
            version: '1.0',
            timestamp: Date.now()
        };
    }
};

// جعل النظام متاحاً عالمياً
window.UserManager = UserManager;

// التهيئة التلقائية
if (window.UserManager) {
    document.addEventListener('DOMContentLoaded', function() {
        window.UserManager.init();
    });
}
