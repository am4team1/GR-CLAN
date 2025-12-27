/**
 * مدير الملفات - GR CLAN File Manager
 * إدارة الملفات والصور في النظام
 */

const FileManager = {
    // ===== إعدادات النظام =====
    config: {
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxImageSize: 5 * 1024 * 1024, // 5MB
        imageQuality: 0.85, // جودة الضغط
        thumbnailSize: 150, // حجم الصورة المصغرة
        autoRotate: true, // التدوير التلقائي
        backupEnabled: true // النسخ الاحتياطي
    },
    
    // ===== تحميل صورة =====
    uploadImage: function(file, userHash, imageType = 'profile') {
        return new Promise((resolve, reject) => {
            console.log(`📤 بدء تحميل صورة: ${file.name}`);
            
            try {
                // 1. التحقق من نوع الملف
                if (!this.config.allowedImageTypes.includes(file.type)) {
                    throw new Error('نوع الملف غير مدعوم. يرجى استخدام: JPEG, PNG, GIF, WebP');
                }
                
                // 2. التحقق من حجم الملف
                if (file.size > this.config.maxImageSize) {
                    throw new Error(`حجم الملف كبير جداً. الحد الأقصى: ${this.config.maxImageSize / 1024 / 1024}MB`);
                }
                
                // 3. قراءة الملف
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    try {
                        // 4. تحسين الصورة
                        this.optimizeImage(event.target.result)
                            .then(optimizedImage => {
                                // 5. حفظ الصورة
                                const saveResult = StorageEngine.saveProfilePicture(
                                    userHash, 
                                    optimizedImage
                                );
                                
                                if (saveResult.success) {
                                    // 6. إنشاء صورة مصغرة
                                    this.createThumbnail(optimizedImage)
                                        .then(thumbnail => {
                                            // حفظ الصورة المصغرة
                                            const thumbPath = `data/users/${userHash}/profile_pics/thumbnail.png`;
                                            StorageEngine.saveToVirtualFS(thumbPath, thumbnail);
                                            
                                            console.log('✅ تم تحميل الصورة بنجاح');
                                            
                                            resolve({
                                                success: true,
                                                originalSize: file.size,
                                                optimizedSize: optimizedImage.length,
                                                imagePath: saveResult.imagePath,
                                                thumbnail: thumbnail,
                                                backupCreated: saveResult.backupCreated
                                            });
                                        })
                                        .catch(thumbError => {
                                            console.warn('تحذير: فشل في إنشاء الصورة المصغرة:', thumbError);
                                            resolve({
                                                success: true,
                                                originalSize: file.size,
                                                optimizedSize: optimizedImage.length,
                                                imagePath: saveResult.imagePath,
                                                backupCreated: saveResult.backupCreated
                                            });
                                        });
                                } else {
                                    throw new Error('فشل في حفظ الصورة');
                                }
                            })
                            .catch(optimizeError => {
                                reject(optimizeError);
                            });
                    } catch (processError) {
                        reject(processError);
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('خطأ في قراءة الملف'));
                };
                
                reader.readAsDataURL(file);
                
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // ===== تحسين الصورة =====
    optimizeImage: function(imageData) {
        return new Promise((resolve, reject) => {
            try {
                const img = new Image();
                
                img.onload = () => {
                    try {
                        // 1. إنشاء canvas
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // 2. تعيين الأبعاد (الحد الأقصى 1000px)
                        let width = img.width;
                        let height = img.height;
                        
                        const maxDimension = 1000;
                        if (width > maxDimension || height > maxDimension) {
                            if (width > height) {
                                height = (height * maxDimension) / width;
                                width = maxDimension;
                            } else {
                                width = (width * maxDimension) / height;
                                height = maxDimension;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        // 3. رسم الصورة
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // 4. تحويل إلى base64 مع الجودة المحددة
                        const optimizedImage = canvas.toDataURL(
                            'image/webp', 
                            this.config.imageQuality
                        );
                        
                        resolve(optimizedImage);
                        
                    } catch (canvasError) {
                        // إذا فشل التحسين، إرجاع الصورة الأصلية
                        console.warn('تحذير: فشل في تحسين الصورة، استخدام الأصلية');
                        resolve(imageData);
                    }
                };
                
                img.onerror = () => {
                    reject(new Error('خطأ في تحميل الصورة للتحسين'));
                };
                
                img.src = imageData;
                
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // ===== إنشاء صورة مصغرة =====
    createThumbnail: function(imageData) {
        return new Promise((resolve, reject) => {
            try {
                const img = new Image();
                
                img.onload = () => {
                    try {
                        // 1. إنشاء canvas للصورة المصغرة
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // 2. حساب الأبعاد مع الحفاظ على التناسب
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > height) {
                            height = (height * this.config.thumbnailSize) / width;
                            width = this.config.thumbnailSize;
                        } else {
                            width = (width * this.config.thumbnailSize) / height;
                            height = this.config.thumbnailSize;
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        // 3. رسم الصورة المصغرة
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // 4. تحويل إلى base64
                        const thumbnail = canvas.toDataURL('image/webp', 0.7);
                        
                        resolve(thumbnail);
                        
                    } catch (canvasError) {
                        reject(canvasError);
                    }
                };
                
                img.onerror = () => {
                    reject(new Error('خطأ في إنشاء الصورة المصغرة'));
                };
                
                img.src = imageData;
                
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // ===== جلب الصورة الشخصية =====
    getProfilePicture: function(userHash, size = 'original') {
        try {
            let imagePath;
            
            switch (size) {
                case 'thumbnail':
                    imagePath = `data/users/${userHash}/profile_pics/thumbnail.png`;
                    break;
                case 'small':
                    imagePath = `data/users/${userHash}/profile_pics/avatar1.png`; // نسخة احتياطية 1
                    break;
                case 'medium':
                    imagePath = `data/users/${userHash}/profile_pics/avatar2.png`; // نسخة احتياطية 2
                    break;
                default:
                    imagePath = `data/users/${userHash}/profile_pics/current.png`;
            }
            
            const imageData = StorageEngine.loadFromVirtualFS(imagePath);
            
            if (imageData) {
                return {
                    success: true,
                    imageData: imageData,
                    size: size,
                    path: imagePath
                };
            } else {
                // إذا لم توجد صورة بالحجم المطلوب، جلب الصورة الافتراضية
                return {
                    success: true,
                    imageData: StorageEngine.getDefaultAvatar(),
                    size: 'default',
                    isDefault: true
                };
            }
            
        } catch (error) {
            console.error('❌ خطأ في جلب الصورة:', error);
            
            return {
                success: false,
                error: error.message,
                imageData: StorageEngine.getDefaultAvatar(),
                isDefault: true
            };
        }
    },
    
    // ===== جلب جميع صور المستخدم =====
    getUserImages: function(userHash) {
        try {
            const images = [];
            const picsFolder = `data/users/${userHash}/profile_pics`;
            
            // الصورة الحالية
            const current = this.getProfilePicture(userHash, 'original');
            if (current.success && !current.isDefault) {
                images.push({
                    type: 'current',
                    data: current.imageData,
                    size: 'original'
                });
            }
            
            // الصورة المصغرة
            const thumbnail = this.getProfilePicture(userHash, 'thumbnail');
            if (thumbnail.success && !thumbnail.isDefault) {
                images.push({
                    type: 'thumbnail',
                    data: thumbnail.imageData,
                    size: 'thumbnail'
                });
            }
            
            // النسخ الاحتياطية
            for (let i = 1; i <= 3; i++) {
                const backupPath = `${picsFolder}/avatar${i}.png`;
                const backupData = StorageEngine.loadFromVirtualFS(backupPath);
                
                if (backupData) {
                    images.push({
                        type: 'backup',
                        index: i,
                        data: backupData,
                        size: 'backup'
                    });
                }
            }
            
            return {
                success: true,
                images: images,
                count: images.length
            };
            
        } catch (error) {
            console.error('❌ خطأ في جلب صور المستخدم:', error);
            
            return {
                success: false,
                error: error.message,
                images: [],
                count: 0
            };
        }
    },
    
    // ===== حذف صورة =====
    deleteImage: function(userHash, imageType, index = null) {
        try {
            let imagePath;
            
            switch (imageType) {
                case 'current':
                    imagePath = `data/users/${userHash}/profile_pics/current.png`;
                    break;
                case 'thumbnail':
                    imagePath = `data/users/${userHash}/profile_pics/thumbnail.png`;
                    break;
                case 'backup':
                    if (!index) {
                        throw new Error('رقم النسخة الاحتياطية مطلوب');
                    }
                    imagePath = `data/users/${userHash}/profile_pics/avatar${index}.png`;
                    break;
                default:
                    throw new Error('نوع الصورة غير معروف');
            }
            
            // حذف الملف
            localStorage.removeItem(`fs_${imagePath}`);
            
            // تسجيل النشاط
            StorageEngine.logUserActivity(userHash, 'image_deleted', {
                imageType: imageType,
                index: index,
                timestamp: Date.now()
            });
            
            console.log(`🗑️ تم حذف الصورة: ${imageType}${index ? ' #' + index : ''}`);
            
            return {
                success: true,
                imageType: imageType,
                index: index,
                deletedAt: Date.now()
            };
            
        } catch (error) {
            console.error('❌ خطأ في حذف الصورة:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // ===== استعادة نسخة احتياطية =====
    restoreBackupImage: function(userHash, backupIndex) {
        try {
            const backupPath = `data/users/${userHash}/profile_pics/avatar${backupIndex}.png`;
            const currentPath = `data/users/${userHash}/profile_pics/current.png`;
            
            // قراءة النسخة الاحتياطية
            const backupData = StorageEngine.loadFromVirtualFS(backupPath);
            
            if (!backupData) {
                throw new Error('النسخة الاحتياطية غير موجودة');
            }
            
            // حفظ كصورة حالية
            StorageEngine.saveToVirtualFS(currentPath, backupData);
            
            // إنشاء صورة مصغرة جديدة
            this.createThumbnail(backupData)
                .then(thumbnail => {
                    const thumbPath = `data/users/${userHash}/profile_pics/thumbnail.png`;
                    StorageEngine.saveToVirtualFS(thumbPath, thumbnail);
                })
                .catch(thumbError => {
                    console.warn('تحذير: فشل في إنشاء صورة مصغرة:', thumbError);
                });
            
            // تسجيل النشاط
            StorageEngine.logUserActivity(userHash, 'image_restored', {
                backupIndex: backupIndex,
                timestamp: Date.now()
            });
            
            console.log(`↩️ تم استعادة النسخة الاحتياطية: #${backupIndex}`);
            
            return {
                success: true,
                backupIndex: backupIndex,
                restoredAt: Date.now()
            };
            
        } catch (error) {
            console.error('❌ خطأ في استعادة النسخة الاحتياطية:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // ===== تحميل ملفات أخرى =====
    uploadFile: function(file, userHash, fileType) {
        return new Promise((resolve, reject) => {
            console.log(`📤 بدء تحميل ملف: ${file.name} (${file.type})`);
            
            try {
                // 1. التحقق من حجم الملف
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (file.size > maxSize) {
                    throw new Error(`حجم الملف كبير جداً. الحد الأقصى: ${maxSize / 1024 / 1024}MB`);
                }
                
                // 2. قراءة الملف
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    try {
                        // 3. إنشاء اسم فريد للملف
                        const timestamp = Date.now();
                        const random = Math.random().toString(36).substr(2, 8);
                        const fileExtension = file.name.split('.').pop();
                        const fileName = `${fileType}_${timestamp}_${random}.${fileExtension}`;
                        
                        // 4. إنشاء مجلد الملفات إذا لم يكن موجوداً
                        const filesFolder = `data/users/${userHash}/files`;
                        StorageEngine.createVirtualFolder(filesFolder);
                        
                        // 5. حفظ الملف
                        const filePath = `${filesFolder}/${fileName}`;
                        StorageEngine.saveToVirtualFS(filePath, event.target.result);
                        
                        // 6. تحديث الفهرس
                        const fileIndexPath = `${filesFolder}/index.json`;
                        let fileIndex = StorageEngine.loadFromVirtualFS(fileIndexPath);
                        
                        if (!fileIndex) {
                            fileIndex = {
                                files: [],
                                lastUpdate: Date.now()
                            };
                        }
                        
                        fileIndex.files.push({
                            name: fileName,
                            originalName: file.name,
                            type: fileType,
                            size: file.size,
                            mimeType: file.type,
                            uploaded: Date.now(),
                            path: filePath
                        });
                        
                        StorageEngine.saveToVirtualFS(fileIndexPath, fileIndex);
                        
                        // 7. تسجيل النشاط
                        StorageEngine.logUserActivity(userHash, 'file_uploaded', {
                            fileName: file.name,
                            fileType: fileType,
                            size: file.size,
                            timestamp: Date.now()
                        });
                        
                        console.log(`✅ تم تحميل الملف بنجاح: ${fileName}`);
                        
                        resolve({
                            success: true,
                            fileName: fileName,
                            originalName: file.name,
                            size: file.size,
                            type: fileType,
                            path: filePath
                        });
                        
                    } catch (saveError) {
                        reject(saveError);
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('خطأ في قراءة الملف'));
                };
                
                reader.readAsDataURL(file);
                
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // ===== جلب قائمة الملفات =====
    getUserFiles: function(userHash, fileType = null) {
        try {
            const filesFolder = `data/users/${userHash}/files`;
            const fileIndexPath = `${filesFolder}/index.json`;
            
            const fileIndex = StorageEngine.loadFromVirtualFS(fileIndexPath);
            
            if (!fileIndex || !fileIndex.files) {
                return {
                    success: true,
                    files: [],
                    count: 0
                };
            }
            
            let files = fileIndex.files;
            
            // تصفية حسب النوع إذا طلب
            if (fileType) {
                files = files.filter(file => file.type === fileType);
            }
            
            // ترتيب حسب تاريخ الرفع (الأحدث أولاً)
            files.sort((a, b) => b.uploaded - a.uploaded);
            
            return {
                success: true,
                files: files,
                count: files.length
            };
            
        } catch (error) {
            console.error('❌ خطأ في جلب قائمة الملفات:', error);
            
            return {
                success: false,
                error: error.message,
                files: [],
                count: 0
            };
        }
    },
    
    // ===== تنزيل ملف =====
    downloadFile: function(userHash, fileName) {
        try {
            const filesFolder = `data/users/${userHash}/files`;
            const filePath = `${filesFolder}/${fileName}`;
            
            // قراءة الملف
            const fileData = StorageEngine.loadFromVirtualFS(filePath);
            
            if (!fileData) {
                throw new Error('الملف غير موجود');
            }
            
            // البحث عن اسم الملف الأصلي
            const fileIndexPath = `${filesFolder}/index.json`;
            const fileIndex = StorageEngine.loadFromVirtualFS(fileIndexPath);
            
            let originalName = fileName;
            if (fileIndex && fileIndex.files) {
                const fileInfo = fileIndex.files.find(f => f.name === fileName);
                if (fileInfo) {
                    originalName = fileInfo.originalName;
                }
            }
            
            // تسجيل النشاط
            StorageEngine.logUserActivity(userHash, 'file_downloaded', {
                fileName: fileName,
                originalName: originalName,
                timestamp: Date.now()
            });
            
            return {
                success: true,
                fileData: fileData,
                fileName: originalName,
                path: filePath
            };
            
        } catch (error) {
            console.error('❌ خطأ في تنزيل الملف:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // ===== حذف ملف =====
    deleteFile: function(userHash, fileName) {
        try {
            const filesFolder = `data/users/${userHash}/files`;
            const filePath = `${filesFolder}/${fileName}`;
            
            // 1. حذف الملف
            localStorage.removeItem(`fs_${filePath}`);
            
            // 2. تحديث الفهرس
            const fileIndexPath = `${filesFolder}/index.json`;
            const fileIndex = StorageEngine.loadFromVirtualFS(fileIndexPath);
            
            if (fileIndex && fileIndex.files) {
                fileIndex.files = fileIndex.files.filter(f => f.name !== fileName);
                fileIndex.lastUpdate = Date.now();
                StorageEngine.saveToVirtualFS(fileIndexPath, fileIndex);
            }
            
            // 3. تسجيل النشاط
            StorageEngine.logUserActivity(userHash, 'file_deleted', {
                fileName: fileName,
                timestamp: Date.now()
            });
            
            console.log(`🗑️ تم حذف الملف: ${fileName}`);
            
            return {
                success: true,
                fileName: fileName,
                deletedAt: Date.now()
            };
            
        } catch (error) {
            console.error('❌ خطأ في حذف الملف:', error);
            
            return {
                success: false,
                error: error.message
            };
        }
    },
    
    // ===== إحصائيات الملفات =====
    getFileStats: function(userHash) {
        try {
            const files = this.getUserFiles(userHash);
            
            if (!files.success) {
                throw new Error(files.error);
            }
            
            // حساب إجمالي حجم الملفات
            let totalSize = 0;
            const filesByType = {};
            
            files.files.forEach(file => {
                totalSize += file.size || 0;
                
                if (!filesByType[file.type]) {
                    filesByType[file.type] = 0;
                }
                filesByType[file.type]++;
            });
            
            return {
                success: true,
                stats: {
                    totalFiles: files.count,
                    totalSize: totalSize,
                    sizeInMB: (totalSize / 1024 / 1024).toFixed(2),
                    filesByType: filesByType,
                    lastUpdate: files.files.length > 0 ? 
                        Math.max(...files.files.map(f => f.uploaded)) : null
                }
            };
            
        } catch (error) {
            console.error('❌ خطأ في جلب إحصائيات الملفات:', error);
            
            return {
                success: false,
                error: error.message,
                stats: {}
            };
        }
    },
    
    // ===== التهيئة =====
    init: function() {
        console.log('📁 تهيئة مدير الملفات...');
        
        // التأكد من تهيئة StorageEngine أولاً
        if (!window.StorageEngine) {
            console.error('❌ StorageEngine غير محمل');
            return false;
        }
        
        console.log('✅ مدير الملفات جاهز للعمل');
        
        return {
            status: 'ready',
            version: '1.0',
            timestamp: Date.now()
        };
    }
};

// جعل النظام متاحاً عالمياً
window.FileManager = FileManager;

// التهيئة التلقائية
if (window.FileManager) {
    document.addEventListener('DOMContentLoaded', function() {
        window.FileManager.init();
    });
}
