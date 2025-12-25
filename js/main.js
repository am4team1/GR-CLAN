// التحقق من حالة تسجيل الدخول
document.addEventListener('DOMContentLoaded', function() {
    const userIdDisplay = document.getElementById('user-id-display');
    
    // التحقق من وجود بيانات مستخدم في localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser) {
        // إذا كان المستخدم مسجل الدخول
        userIdDisplay.textContent = currentUser.username;
        
        // تغيير أزرار الهيدر
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons) {
            authButtons.innerHTML = `
                <button class="btn btn-login" id="logoutBtn">تسجيل الخروج</button>
            `;
            
            document.getElementById('logoutBtn').addEventListener('click', function() {
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            });
        }
    } else {
        // إذا كان زائراً
        userIdDisplay.textContent = 'زائر';
    }
    
    // إضافة تأثيرات للشريط السفلي
    const taskbarItems = document.querySelectorAll('.taskbar-item');
    taskbarItems.forEach(item => {
        item.addEventListener('click', function() {
            taskbarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
