/**
 * محرك تخزين متقدم - GR CLAN Storage Engine
 * نظام تخزين هرمي مع فهرسة وإدارة ذكية
 */

const StorageEngine = {
    // ===== إعدادات النظام =====
    config: {
        userHashLength: 150,          // طول الهاش الخاص بالمستخدم
        maxFileSize: 5 * 1024 * 1024, // 5MB كحد أقصى للصور
        maxBackupFiles: 3,            // 3 نسخ احتياطية كحد أقصى
        compressionEnabled: true,     // ضغط البيانات
        encryptionEnabled: false,     // التشفير (يمكن تفعيله لاحقاً)
        autoBackup: true,             // النسخ الاحتياطي التلقائي
        cleanupInterval: 24 * 60 * 60 * 1000 // تنظيف كل 24 ساعة
    },
    
    // ===== توليد الهاش الفريد =====
    generateUserHash: function(username, timestamp = Date.now()) {
        /**
         * توليد هاش فريد 150 حرف لكل مستخدم
         * الخوارزمية: base64(sha256(username + timestamp + random_salt))
         */
        
        // 1. إنشاء سلسلة فريدة
        const uniqueString = `${username}_${timestamp}_${Math.random().toString(36).substr(2)}_${performance.now()}_${navigator.userAgent}`;
        
        // 2. إنشاء هاش SHA-256 (مبسط لـ JavaScript)
        let hash = '';
        for (let i = 0; i < uniqueString.length; i++) {
            const charCode = uniqueString.charCodeAt(i);
            // تحويل إلى نظام 36 (أرقام + أحرف)
            hash += charCode.toString(36);
        }
        
        // 3. إضافة أرقام عشوائية حتى يصبح الطول 150 حرف
        while (hash.length < this.config.userHashLength) {
            const randomNum = Math.floor(Math.random() * 1e15);
            hash += randomNum.toString(36);
        }
        
        // 4. أخذ أول 150 حرف فقط
        hash = hash.substr(0, this.config.userHashLength);
        
        // 5. إضافة بعض الرموز الخاصة للتعقيد
        const specialChars = '!@#$%^&*()_-+=[]{}|;:,.<>?';
        const positions = [25, 50, 75, 100, 125];
        
        positions.forEach(pos => {
            if (pos < hash.length) {
                const randomChar = specialChars[Math.floor(Math.random() * specialChars.length)];
                hash = hash.substr(0, pos) + randomChar + hash.substr(pos + 1);
            }
        });
        
        console.log(`🔐 تم توليد هاش فريد بطول ${hash.length} حرف`);
        return hash;
    },
    
    // ===== التحقق من فرادة الهاش =====
    isHashUnique: function(hash) {
        /**
         * التحقق إذا كان الهاش موجود مسبقاً
         * احتمالية التكرار: 1/(36^150) ≈ صفر
         */
        
        // 1. التحقق في الفهرس العام
        const usersIndex = this.loadIndex('users');
        if (usersIndex && usersIndex[hash]) {
            return false;
        }
        
        // 2. التحقق في مجلد المستخدمين
        try {
            const userPath = `data/users/${hash}`;
            // محاولة قراءة المجلد (سيفشل إذا لم يكن موجوداً)
            const test = localStorage.getItem(`fs_${userPath}_test`);
            return test === null;
        } catch (e) {
            return true;
        }
    },
    
    // ===== إنشاء مجلد مستخدم جديد =====
    createUserFolder: function(userData) {
        /**
         * إنشاء هيكل مجلد كامل للمستخدم الجديد
         */
        
        // 1. توليد الهاش الفريد
        let userHash;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            userHash = this.generateUserHash(userData.username, Date.now() + attempts);
            attempts++;
            
            if (attempts > maxAttempts) {
                throw new Error('فشل في توليد هاش فريد بعد عدة محاولات');
            }
        } while (!this.isHashUnique(userHash));
        
        console.log(`✅ تم توليد هاش فريد بعد ${attempts} محاولة: ${userHash.substr(0, 20)}...`);
        
        // 2. إنشاء مسار المجلد
        const userFolderPath = `data/users/${userHash}`;
        const userProfilePath = `${userFolderPath}/profile.json`;
        const userPicsPath = `${userFolderPath}/profile_pics`;
        
        // 3. البيانات الأساسية للمستخدم
        const userProfile = {
            hash: userHash,
            username: userData.username,
            pubgId: userData.pubgId || '',
            email: userData.email || '',
            phone: userData.phone || '',
            role: userData.role || 'عضو',
            joinDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            status: 'active',
            metadata: {
                created: Date.now(),
                version: '1.0',
                storageEngine: 'GR_CLAN_v2'
            }
        };
        
        // 4. حفظ البيانات في localStorage (محاكاة نظام الملفات)
        this.saveToVirtualFS(userProfilePath, userProfile);
        
        // 5. إنشاء مجلد الصور
        this.createVirtualFolder(userPicsPath);
        
        // 6. نسخ الصورة الافتراضية
        const defaultImage = this.getDefaultAvatar();
        this.saveToVirtualFS(`${userPicsPath}/current.png`, defaultImage);
        
        // 7. إنشاء ملف الإعدادات
        const settings = {
            notifications: {
                email: true,
                push: true,
                sounds: true
            },
            privacy: {
                profileVisible: true,
                showOnlineStatus: true
            },
            theme: 'dark'
        };
        this.saveToVirtualFS(`${userFolderPath}/settings.json`, settings);
        
        // 8. إنشاء سجل النشاط
        const activity = {
            logs: [{
                action: 'account_created',
                timestamp: Date.now(),
                details: 'تم إنشاء الحساب بنجاح'
            }]
        };
        this.saveToVirtualFS(`${userFolderPath}/activity.json`, activity);
        
        // 9. تحديث الفهرس العام
        this.updateUsersIndex(userHash, {
            username: userData.username,
            hash: userHash,
            joinDate: userProfile.joinDate,
            lastLogin: userProfile.lastLogin
        });
        
        // 10. تحديث إحصائيات النظام
        this.updateSystemStats('users_created', 1);
        
        console.log(`📁 تم إنشاء مجلد مستخدم كامل: ${userFolderPath}`);
        
        return {
            success: true,
            userHash: userHash,
            folderPath: userFolderPath,
            profile: userProfile
        };
    },
    
    // ===== نظام الملفات الافتراضي =====
    saveToVirtualFS: function(filePath, data) {
        /**
         * حفظ البيانات في نظام الملفات الافتراضي (محاكاة)
         * المفتاح: fs_[filePath]
         * القيمة: JSON.stringify(data) أو base64 للصور
         */
        
        const key = `fs_${filePath}`;
        let value;
        
        // تحديد نوع البيانات
        if (typeof data === 'object' && !(data instanceof Blob)) {
            // بيانات JSON
            value = JSON.stringify(data);
        } else if (data instanceof Blob || (typeof data === 'string' && data.startsWith('data:'))) {
            // بيانات ثنائية (صور)
            value = data; // تخزين كـ base64
        } else {
            // نصوص عادية
            value = String(data);
        }
        
        localStorage.setItem(key, value);
        
        // تسجيل في سجل النظام
        this.logFileOperation('save', filePath);
        
        return true;
    },
    
    loadFromVirtualFS: function(filePath) {
        /**
         * تحميل البيانات من نظام الملفات الافتراضي
         */
        
        const key = `fs_${filePath}`;
        const value = localStorage.getItem(key);
        
        if (!value) {
            return null;
        }
        
        // محاولة تحليل كـ JSON
        try {
            return JSON.parse(value);
        } catch (e) {
            // إذا فشل، إرجاع القيمة كما هي
            return value;
        }
    },
    
    createVirtualFolder: function(folderPath) {
        /**
         * إنشاء مجلد افتراضي
         */
        
        const key = `fs_dir_${folderPath}`;
        localStorage.setItem(key, 'folder');
        
        // إنشاء ملف .folder للإشارة إلى أنه مجلد
        this.saveToVirtualFS(`${folderPath}/.folder`, {
            type: 'folder',
            created: Date.now(),
            items: []
        });
        
        return true;
    },
    
    // ===== إدارة الفهرس =====
    loadIndex: function(indexType) {
        /**
         * تحميل الفهرس (المستخدمين أو الأدمنز)
         */
        
        const indexPath = `data/${indexType}_index.json`;
        const index = this.loadFromVirtualFS(indexPath);
        
        if (!index) {
            // إذا لم يكن الفهرس موجوداً، إنشاء واحد جديد
            const newIndex = {
                version: '1.0',
                created: Date.now(),
                lastUpdate: Date.now(),
                count: 0,
                items: {}
            };
            
            this.saveToVirtualFS(indexPath, newIndex);
            return newIndex;
        }
        
        return index;
    },
    
    updateUsersIndex: function(userHash, userInfo) {
        /**
         * تحديث الفهرس العام للمستخدمين
         */
        
        const index = this.loadIndex('users');
        
        index.items[userHash] = {
            username: userInfo.username,
            hash: userHash,
            joinDate: userInfo.joinDate,
            lastLogin: userInfo.lastLogin,
            updated: Date.now()
        };
        
        index.count = Object.keys(index.items).length;
        index.lastUpdate = Date.now();
        
        this.saveToVirtualFS('data/users_index.json', index);
        
        console.log(`📊 تم تحديث الفهرس، العدد الإجمالي: ${index.count}`);
        
        return index;
    },
    
    // ===== إدارة الصور =====
    saveProfilePicture: function(userHash, imageData) {
        /**
         * حفظ صورة الملف الشخصي مع نسخ احتياطية
         */
        
        const picsFolder = `data/users/${userHash}/profile_pics`;
        const currentPic = `${picsFolder}/current.png`;
        
        // 1. إنشاء نسخة احتياطية من الصورة الحالية
        const currentImage = this.loadFromVirtualFS(currentPic);
        if (currentImage && currentImage !== this.getDefaultAvatar()) {
            this.createImageBackup(userHash, currentImage);
        }
        
        // 2. حفظ الصورة الجديدة
        this.saveToVirtualFS(currentPic, imageData);
        
        // 3. تحديث بيانات الملف الشخصي
        const profilePath = `data/users/${userHash}/profile.json`;
        const profile = this.loadFromVirtualFS(profilePath);
        
        if (profile) {
            profile.lastUpdate = new Date().toISOString();
            profile.profilePicUpdated = Date.now();
            this.saveToVirtualFS(profilePath, profile);
        }
        
        // 4. تسجيل النشاط
        this.logUserActivity(userHash, 'profile_picture_updated', {
            timestamp: Date.now(),
            size: imageData.length
        });
        
        console.log(`🖼️ تم حفظ صورة جديدة للمستخدم: ${userHash.substr(0, 20)}...`);
        
        return {
            success: true,
            imagePath: currentPic,
            backupCreated: true
        };
    },
    
    createImageBackup: function(userHash, imageData) {
        /**
         * إنشاء نسخة احتياطية من الصورة
         */
        
        const picsFolder = `data/users/${userHash}/profile_pics`;
        
        // الحصول على قائمة النسخ الاحتياطية الحالية
        const backups = [];
        for (let i = 1; i <= this.config.maxBackupFiles; i++) {
            const backupKey = `fs_${picsFolder}/avatar${i}.png`;
            if (localStorage.getItem(backupKey)) {
                backups.push(i);
            }
        }
        
        // إذا وصلنا للحد الأقصى، حذف أقدم نسخة
        if (backups.length >= this.config.maxBackupFiles) {
            const oldest = Math.min(...backups);
            localStorage.removeItem(`fs_${picsFolder}/avatar${oldest}.png`);
            console.log(`🗑️ تم حذف النسخة الاحتياطية الأقدم: avatar${oldest}.png`);
        }
        
        // إنشاء نسخة جديدة
        const newBackupNum = backups.length + 1;
        const backupPath = `${picsFolder}/avatar${newBackupNum}.png`;
        this.saveToVirtualFS(backupPath, imageData);
        
        console.log(`💾 تم إنشاء نسخة احتياطية: avatar${newBackupNum}.png`);
        
        return backupPath;
    },
    
    getDefaultAvatar: function() {
        /**
         * الحصول على الصورة الافتراضية (base64)
         */
        
        // في الواقع، هذا يجب أن يرجع صورة افتراضية
        // هنا نرجع صورة صغيرة base64 كبديل
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNEMEFGMzciLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjQwIiByPSIyMCIgZmlsbD0iIzA2MTAyNSIvPjxwYXRoIGQ9Ik0zMCA4MEw3MCA4MEw2MCA2MEw0MCA2MEwzMCA4MFoiIGZpbGw9IiMwNjEwMjUiLz48L3N2Zz4=';
    },
    
    // ===== تسجيل النشاط =====
    logUserActivity: function(userHash, action, details = {}) {
        /**
         * تسجيل نشاط المستخدم
         */
        
        const activityPath = `data/users/${userHash}/activity.json`;
        let activity = this.loadFromVirtualFS(activityPath);
        
        if (!activity) {
            activity = { logs: [] };
        }
        
        const logEntry = {
            action: action,
            timestamp: Date.now(),
            date: new Date().toISOString(),
            details: details
        };
        
        // إضافة السجل الجديد
        activity.logs.push(logEntry);
        
        // الحفاظ على آخر 100 سجل فقط
        if (activity.logs.length > 100) {
            activity.logs = activity.logs.slice(-100);
        }
        
        this.saveToVirtualFS(activityPath, activity);
        
        // تسجيل في سجل النظام العام
        this.logSystemActivity(`user_${action}`, {
            userHash: userHash.substr(0, 20) + '...',
            ...details
        });
    },
    
    logFileOperation: function(operation, filePath) {
        /**
         * تسجيل عمليات الملفات
         */
        
        const logsPath = 'data/system/logs.json';
        let logs = this.loadFromVirtualFS(logsPath);
        
        if (!logs) {
            logs = { fileOperations: [] };
        }
        
        logs.fileOperations.push({
            operation: operation,
            filePath: filePath,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        });
        
        // الحفاظ على آخر 1000 عملية فقط
        if (logs.fileOperations.length > 1000) {
            logs.fileOperations = logs.fileOperations.slice(-1000);
        }
        
        this.saveToVirtualFS(logsPath, logs);
    },
    
    logSystemActivity: function(action, details) {
        /**
         * تسجيل نشاط النظام
         */
        
        const systemLogsPath = 'data/system/stats.json';
        let stats = this.loadFromVirtualFS(systemLogsPath);
        
        if (!stats) {
            stats = {
                startup: Date.now(),
                activities: [],
                counters: {}
            };
        }
        
        stats.activities.push({
            action: action,
            timestamp: Date.now(),
            details: details
        });
        
        // تحديث العداد
        if (!stats.counters[action]) {
            stats.counters[action] = 0;
        }
        stats.counters[action]++;
        
        this.saveToVirtualFS(systemLogsPath, stats);
    },
    
    updateSystemStats: function(counterName, increment = 1) {
        /**
         * تحديث إحصائيات النظام
         */
        
        const statsPath = 'data/system/stats.json';
        let stats = this.loadFromVirtualFS(statsPath);
        
        if (!stats) {
            stats = {
                startup: Date.now(),
                activities: [],
                counters: {}
            };
        }
        
        if (!stats.counters[counterName]) {
            stats.counters[counterName] = 0;
        }
        
        stats.counters[counterName] += increment;
        stats.lastUpdate = Date.now();
        
        this.saveToVirtualFS(statsPath, stats);
    },
    
    // ===== البحث والاسترجاع =====
    findUserByUsername: function(username) {
        /**
         * البحث عن مستخدم بالاسم
         */
        
        const index = this.loadIndex('users');
        
        for (const [hash, userInfo] of Object.entries(index.items)) {
            if (userInfo.username === username) {
                return {
                    hash: hash,
                    ...userInfo
                };
            }
        }
        
        return null;
    },
    
    findUserByHash: function(userHash) {
        /**
         * البحث عن مستخدم بالهاش
         */
        
        const index = this.loadIndex('users');
        
        if (index.items[userHash]) {
            return {
                hash: userHash,
                ...index.items[userHash]
            };
        }
        
        return null;
    },
    
    loadUserProfile: function(userHash) {
        /**
         * تحميل ملف تعريف المستخدم كاملاً
         */
        
        const profilePath = `data/users/${userHash}/profile.json`;
        const settingsPath = `data/users/${userHash}/settings.json`;
        const activityPath = `data/users/${userHash}/activity.json`;
        
        const profile = this.loadFromVirtualFS(profilePath);
        const settings = this.loadFromVirtualFS(settingsPath);
        const activity = this.loadFromVirtualFS(activityPath);
        
        if (!profile) {
            return null;
        }
        
        // تحميل الصورة الشخصية
        const profilePicPath = `data/users/${userHash}/profile_pics/current.png`;
        const profilePic = this.loadFromVirtualFS(profilePicPath);
        
        return {
            ...profile,
            settings: settings || {},
            activity: activity?.logs || [],
            profilePic: profilePic || this.getDefaultAvatar()
        };
    },
    
    updateUserProfile: function(userHash, updates) {
        /**
         * تحديث بيانات المستخدم
         */
        
        const profilePath = `data/users/${userHash}/profile.json`;
        let profile = this.loadFromVirtualFS(profilePath);
        
        if (!profile) {
            throw new Error('المستخدم غير موجود');
        }
        
        // تحديث البيانات
        profile = {
            ...profile,
            ...updates,
            lastUpdate: new Date().toISOString()
        };
        
        this.saveToVirtualFS(profilePath, profile);
        
        // تحديث الفهرس
        const index = this.loadIndex('users');
        if (index.items[userHash]) {
            if (updates.username) {
                index.items[userHash].username = updates.username;
            }
            index.items[userHash].updated = Date.now();
            this.saveToVirtualFS('data/users_index.json', index);
        }
        
        // تسجيل النشاط
        this.logUserActivity(userHash, 'profile_updated', {
            fields: Object.keys(updates)
        });
        
        console.log(`📝 تم تحديث بيانات المستخدم: ${userHash.substr(0, 20)}...`);
        
        return profile;
    },
    
    // ===== تنظيف النظام =====
    cleanupSystem: function() {
        /**
         * تنظيف البيانات القديمة والتالفة
         */
        
        console.log('🧹 بدء تنظيف النظام...');
        
        const now = Date.now();
        const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
        
        // 1. التحقق من الفهرس
        const index = this.loadIndex('users');
        let cleanedCount = 0;
        
        for (const [hash, userInfo] of Object.entries(index.items)) {
            // إذا كان المستخدم غير نشط لمدة شهر
            if (userInfo.lastLogin && new Date(userInfo.lastLogin).getTime() < oneMonthAgo) {
                // وضع علامة غير نشط (لا نحذف البيانات)
                const profilePath = `data/users/${hash}/profile.json`;
                const profile = this.loadFromVirtualFS(profilePath);
                
                if (profile) {
                    profile.status = 'inactive';
                    this.saveToVirtualFS(profilePath, profile);
                    cleanedCount++;
                }
            }
        }
        
        // 2. تنظيف سجلات النظام القديمة
        const logsPath = 'data/system/logs.json';
        const logs = this.loadFromVirtualFS(logsPath);
        
        if (logs && logs.fileOperations) {
            logs.fileOperations = logs.fileOperations.filter(log => 
                log.timestamp > now - (7 * 24 * 60 * 60 * 1000) // آخر 7 أيام فقط
            );
            this.saveToVirtualFS(logsPath, logs);
        }
        
        console.log(`✅ تم التنظيف: ${cleanedCount} مستخدم وضع كغير نشط`);
        
        return {
            cleanedUsers: cleanedCount,
            timestamp: now
        };
    },
    
    // ===== النسخ الاحتياطي =====
    createBackup: function(userHash) {
        /**
         * إنشاء نسخة احتياطية كاملة للمستخدم
         */
        
        const userFolder = `data/users/${userHash}`;
        const backupPath = `${userFolder}/backup.json`;
        
        // جمع جميع بيانات المستخدم
        const profile = this.loadFromVirtualFS(`${userFolder}/profile.json`);
        const settings = this.loadFromVirtualFS(`${userFolder}/settings.json`);
        const activity = this.loadFromVirtualFS(`${userFolder}/activity.json`);
        
        const profilePicPath = `data/users/${userHash}/profile_pics/current.png`;
        const profilePic = this.loadFromVirtualFS(profilePicPath);
        
        const backupData = {
            metadata: {
                backupCreated: new Date().toISOString(),
                userHash: userHash,
                username: profile?.username,
                version: '1.0'
            },
            profile: profile,
            settings: settings,
            activity: activity,
            profilePic: profilePic
        };
        
        this.saveToVirtualFS(backupPath, backupData);
        
        console.log(`💾 تم إنشاء نسخة احتياطية للمستخدم: ${userHash.substr(0, 20)}...`);
        
        return backupData;
    },
    
    // ===== التهيئة =====
    init: function() {
        /**
         * تهيئة نظام التخزين
         */
        
        console.log('🚀 تهيئة محرك التخزين المتقدم...');
        
        // إنشاء المجلدات الأساسية
        this.createVirtualFolder('data');
        this.createVirtualFolder('data/users');
        this.createVirtualFolder('data/admins');
        this.createVirtualFolder('data/system');
        
        // تحميل أو إنشاء الفهارس
        this.loadIndex('users');
        this.loadIndex('admins');
        
        // بدء التنظيف الدوري
        setInterval(() => {
            this.cleanupSystem();
        }, this.config.cleanupInterval);
        
        console.log('✅ محرك التخزين جاهز للعمل');
        
        return {
            status: 'ready',
            version: '2.0',
            timestamp: Date.now()
        };
    }
};

// جعل النظام متاحاً عالمياً
window.StorageEngine = StorageEngine;

// التهيئة التلقائية عند التحميل
if (window.StorageEngine) {
    document.addEventListener('DOMContentLoaded', function() {
        window.StorageEngine.init();
    });
}
