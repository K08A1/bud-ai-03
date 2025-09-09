/**
 * 萌芽AI - 导航修复脚本
 * 解决页面跳转和功能连通性问题
 */

// 页面映射表
const PAGE_MAPPING = {
    'home': 'home.html',
    'learning-path': 'learning-path.html', 
    'ai-assistant': 'ai-assistant.html',
    'story-wall': 'story-wall.html',
    'profile': 'profile.html',
    'badge-center': 'badge-center.html',
    'evaluation': 'evaluation.html',
    'task-detail': 'task-detail.html',
    'report-detail': 'report-detail.html',
    'settings': 'settings.html',
    'profile-edit': 'profile-edit.html',
    'parent-auth': 'parent-auth.html',
    'parent-mode': 'parent-mode.html',
    'parent-panel': 'parent-panel.html',
    'parent-ai': 'parent-ai.html',
    'parent-community': 'parent-community.html',
    'parent-child-task': 'parent-child-task.html',
    'collaborative-learning': 'collaborative-learning.html',
    'family-center': 'family-center.html',
    'family-achievements': 'family-achievements.html',
    'account-center': 'account-center.html',
    'quick-access': 'quick-access.html',
    'system-features': 'system-features.html',
    'learning-dashboard': 'learning-dashboard.html',
    'demo-guide': 'demo-guide.html',
    'test-flow': 'test-flow.html',
    'start': 'start.html',
    // iPad专版页面
    'ipad-start': 'ipad-start.html',
    'ipad-main': 'ipad-main.html',
    'ipad-learning': 'ipad-learning.html',
    'ipad-ai': 'ipad-ai.html',
    'ipad-profile': 'ipad-profile.html'
};

// 修复导航函数
function fixNavigateToPage(page) {
    console.log(`尝试导航到: ${page}`);
    
    // 检查页面是否存在
    if (PAGE_MAPPING[page]) {
        const targetUrl = PAGE_MAPPING[page];
        console.log(`导航到: ${targetUrl}`);
        
        // 保存当前页面到历史
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'home';
        let navigationHistory = JSON.parse(localStorage.getItem('mengya_navigation_history') || '[]');
        
        if (navigationHistory[navigationHistory.length - 1] !== currentPage) {
            navigationHistory.push(currentPage);
            if (navigationHistory.length > 10) {
                navigationHistory.shift();
            }
            localStorage.setItem('mengya_navigation_history', JSON.stringify(navigationHistory));
        }
        
        // 页面跳转
        window.location.href = targetUrl;
        return true;
    } else {
        console.error(`页面不存在: ${page}`);
        alert(`抱歉，页面"${page}"暂未开放或不存在`);
        return false;
    }
}

// 智能返回函数
function smartBack() {
    const navigationHistory = JSON.parse(localStorage.getItem('mengya_navigation_history') || '[]');
    
    if (navigationHistory.length > 1) {
        // 移除当前页面
        navigationHistory.pop();
        // 获取上一页
        const previousPage = navigationHistory[navigationHistory.length - 1];
        localStorage.setItem('mengya_navigation_history', JSON.stringify(navigationHistory));
        
        console.log(`返回到: ${previousPage}`);
        fixNavigateToPage(previousPage);
    } else {
        // 默认返回首页
        console.log('返回首页');
        fixNavigateToPage('home');
    }
}

// 修复通知函数
function fixShowNotification(message, type = 'info', duration = 3000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        max-width: 300px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // 自动移除
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
    
    // 点击移除
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// 震动反馈
function fixVibrateDevice(pattern = [50]) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// 全局修复函数
function applyNavigationFix() {
    // 覆盖全局函数
    window.navigateToPage = fixNavigateToPage;
    window.navigateBack = smartBack;
    window.showNotification = fixShowNotification;
    window.vibrateDevice = fixVibrateDevice;
    
    console.log('✅ 导航修复已应用');
}

// 自动应用修复
if (typeof window !== 'undefined') {
    applyNavigationFix();
}
