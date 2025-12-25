// نظام التسجيل
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const pubgId = document.getElementById('pubg-id').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // التحقق من كلمات المرور
        if (password !== confirmPassword) {
            alert('كلمات المرور غير متطابقة!');
            return;
        }
        
        // الحصول على المستخدمين الحاليين من localStorage
        let users = JSON.parse(localStorage.getItem('users')) || [];
        
        // التحقق من عدم وجود اسم مستخدم مكرر
        if (users.find(user => user.username === username)) {
            alert('اسم المستخدم موجود بالفعل!');
            return;
        }
        
        // إنشاء مستخدم جديد
        const newUser = {
            id: Date.now(),
            pubgId: pubgId,
            username: username,
            password: password, // في الواقع، يجب تشفير كلمة المرور
            joinDate: new Date().toISOString()
        };
        
        // إضافة المستخدم
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // تسجيل الدخول تلقائياً
        localStorage.setItem('currentUser', JSON.stringify({
            username: username,
            pubgId: pubgId
        }));
        
        alert('تم إنشاء الحساب بنجاح!');
        window.location.href = 'index.html';
    });
}

// نظام تسجيل الدخول
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // الحصول على المستخدمين
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // البحث عن المستخدم
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // تسجيل الدخول
            localStorage.setItem('currentUser', JSON.stringify({
                username: user.username,
                pubgId: user.pubgId
            }));
            
            alert('تم تسجيل الدخول بنجاح!');
            window.location.href = 'index.html';
        } else {
            alert('اسم المستخدم أو كلمة المرور غير صحيحة!');
        }
    });
}
