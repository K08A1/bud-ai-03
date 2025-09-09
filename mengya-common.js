/**
 * 萌芽AI - 统一工具库
 * 提供导航、数据管理、通知等通用功能
 */

// 统一导航管理器
const NavigationManager = {
    // 导航历史记录
    history: [],
    
    // 智能返回 - 优先使用全局历史记录
    smartBack() {
        if (this.history.length > 1) {
            // 移除当前页面
            this.history.pop();
            // 获取上一页
            const previousPage = this.history[this.history.length - 1];
            this.navigateTo(previousPage, { skipHistory: true });
        } else {
            // 默认返回首页
            this.navigateTo('home', { skipHistory: true });
        }
    },
    
    // 导航到页面
    navigateTo(page, options = {}) {
        // 添加切换动画
        this.addTransitionAnimation();
        
        // 记录历史（除非明确跳过）
        if (!options.skipHistory) {
            // 避免重复记录相同页面
            if (this.history[this.history.length - 1] !== page) {
                this.history.push(page);
                // 限制历史记录长度
                if (this.history.length > 10) {
                    this.history.shift();
                }
            }
        }
        
        // 保存当前页面状态
        this.saveCurrentPageState();
        
        // 页面跳转
        setTimeout(() => {
            const targetUrl = page.endsWith('.html') ? page : `${page}.html`;
            window.location.href = targetUrl;
        }, 200);
    },
    
    // 保存当前页面状态
    saveCurrentPageState() {
        const currentPage = this.getCurrentPageName();
        const scrollPosition = window.scrollY;
        
        DataManager.setLocal(`pageState_${currentPage}`, {
            scrollPosition,
            timestamp: Date.now()
        });
    },
    
    // 获取当前页面名称
    getCurrentPageName() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename.replace('.html', '') || 'home';
    },
    
    // 恢复页面状态
    restorePageState() {
        const currentPage = this.getCurrentPageName();
        const state = DataManager.getLocal(`pageState_${currentPage}`);
        
        if (state && state.scrollPosition) {
            setTimeout(() => {
                window.scrollTo(0, state.scrollPosition);
            }, 100);
        }
    },
    
    // 添加页面切换动画
    addTransitionAnimation() {
        document.body.style.transition = 'all 0.3s ease';
        document.body.style.opacity = '0.8';
        document.body.style.transform = 'scale(0.98)';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
            document.body.style.transform = 'scale(1)';
        }, 200);
    },
    
    // 初始化导航系统
    init() {
        // 恢复页面状态
        this.restorePageState();
        
        // 记录当前页面到历史
        const currentPage = this.getCurrentPageName();
        if (this.history.length === 0 || this.history[this.history.length - 1] !== currentPage) {
            this.history.push(currentPage);
        }
        
        // 添加浏览器后退按钮支持
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.page) {
                this.navigateTo(event.state.page, { skipHistory: true });
            }
        });
        
        // 添加全局键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                this.smartBack();
            }
        });
    }
};

// 统一数据管理器
const DataManager = {
    // 内存中的数据存储
    memoryStore: {},
    
    // 设置数据
    setData(path, data) {
        try {
            // 保存到内存
            this.setNestedValue(this.memoryStore, path, data);
            
            // 保存到本地存储
            this.setLocal(path, data);
            
            // 触发数据变化事件
            this.triggerDataChange(path, data);
            
            return true;
        } catch (e) {
            console.error('设置数据失败:', e);
            return false;
        }
    },
    
    // 获取数据 (异步，保持接口一致性)
    async getData(path) {
        try {
            // 先从内存获取
            const memoryData = this.getNestedValue(this.memoryStore, path);
            if (memoryData !== undefined) {
                return memoryData;
            }
            
            // 再从本地存储获取
            const localData = this.getLocal(path);
            if (localData !== null) {
                // 同步到内存
                this.setNestedValue(this.memoryStore, path, localData);
                return localData;
            }
            
            // 返回默认值
            return this.getDefaultValue(path);
        } catch (e) {
            console.error('获取数据失败:', e);
            return null;
        }
    },
    
    // 同步数据（保存到本地存储）
    syncData(force = false) {
        try {
            // 遍历内存中的数据，同步到本地存储
            this.syncMemoryToLocal(this.memoryStore);
            
            // 清理过期数据
            this.cleanExpiredData();
            
            console.log('数据同步完成');
            return true;
        } catch (e) {
            console.error('数据同步失败:', e);
            return false;
        }
    },
    
    // 设置嵌套对象值
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
    },
    
    // 获取嵌套对象值
    getNestedValue(obj, path) {
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === null || current === undefined || !(key in current)) {
                return undefined;
            }
            current = current[key];
        }
        
        return current;
    },
    
    // 获取默认值
    getDefaultValue(path) {
        const defaults = {
            'child.profile': {
                nickname: '小朋友',
                avatar: '👶',
                level: 1,
                experience: 0,
                joinDate: new Date().toISOString()
            },
            'child.progress': {
                totalTasks: 0,
                completedTasks: 0,
                currentStreak: 0,
                maxStreak: 0,
                abilities: {
                    expression: 0,
                    logic: 0,
                    creativity: 0,
                    exploration: 0,
                    habit: 0
                }
            },
            'child.achievements': [],
            'child.virtualPartner': {
                name: '小芽芽',
                level: 1,
                growth: 0,
                activity: 0,
                mood: 'happy',
                lastInteraction: new Date().toISOString()
            }
        };
        
        return defaults[path] || null;
    },
    
    // 同步内存数据到本地存储
    syncMemoryToLocal(obj, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
            const fullPath = prefix ? `${prefix}.${key}` : key;
            
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                this.syncMemoryToLocal(value, fullPath);
            } else {
                this.setLocal(fullPath, value);
            }
        }
    },
    
    // 清理过期数据
    cleanExpiredData() {
        const keys = Object.keys(localStorage);
        const now = Date.now();
        const expireTime = 7 * 24 * 60 * 60 * 1000; // 7天
        
        keys.forEach(key => {
            if (key.startsWith('mengya_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && data.timestamp && (now - data.timestamp) > expireTime) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // 忽略解析错误
                }
            }
        });
    },
    
    // 触发数据变化事件
    triggerDataChange(path, data) {
        const event = new CustomEvent('mengyaDataChange', {
            detail: { path, data }
        });
        window.dispatchEvent(event);
    },
    
    // 本地存储辅助函数
    setLocal(key, value) {
        try {
            localStorage.setItem(`mengya_${key}`, JSON.stringify(value));
        } catch (e) {
            console.error('本地存储失败:', e);
        }
    },
    
    getLocal(key) {
        try {
            const value = localStorage.getItem(`mengya_${key}`);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.error('本地存储读取失败:', e);
            return null;
        }
    }
};

// 统一通知管理器
const NotificationManager = {
    // 通知容器
    container: null,
    
    // 初始化通知系统
    init() {
        if (!this.container) {
            this.createNotificationContainer();
        }
    },
    
    // 创建通知容器
    createNotificationContainer() {
        this.container = document.createElement('div');
        this.container.id = 'mengya-notifications';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    },
    
    // 显示通知
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);
        
        // 入场动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // 自动移除
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
        
        // 点击移除
        notification.addEventListener('click', () => {
            this.removeNotification(notification);
        });
    },
    
    // 创建通知元素
    createNotification(message, type) {
        const notification = document.createElement('div');
        
        const colors = {
            success: { bg: '#10B981', icon: 'fas fa-check-circle' },
            error: { bg: '#EF4444', icon: 'fas fa-exclamation-circle' },
            warning: { bg: '#F59E0B', icon: 'fas fa-exclamation-triangle' },
            info: { bg: '#3B82F6', icon: 'fas fa-info-circle' }
        };
        
        const config = colors[type] || colors.info;
        
        notification.style.cssText = `
            background: ${config.bg};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(10px);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            pointer-events: auto;
            max-width: 300px;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 12px;
        `;
        
        notification.innerHTML = `
            <i class="${config.icon}"></i>
            <span>${message}</span>
        `;
        
        // 添加悬停效果
        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'translateX(-5px) scale(1.02)';
        });
        
        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateX(0) scale(1)';
        });
        
        return notification;
    },
    
    // 移除通知
    removeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },
    
    // 便捷方法
    success(message, duration) {
        this.show(message, 'success', duration);
    },
    
    error(message, duration) {
        this.show(message, 'error', duration);
    },
    
    warning(message, duration) {
        this.show(message, 'warning', duration);
    },
    
    info(message, duration) {
        this.show(message, 'info', duration);
    },
    
    // 清除所有通知
    clearAll() {
        if (this.container) {
            const notifications = this.container.children;
            Array.from(notifications).forEach(notification => {
                this.removeNotification(notification);
            });
        }
    }
};

// 统一交互工具
const InteractionUtils = {
    // 震动反馈
    vibrate(pattern = [50]) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    },
    
    // 添加涟漪效果
    addRippleEffect(element, event) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    },
    
    // 添加点击动画
    addClickAnimation(element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }
};

// 页面生命周期管理
const PageLifecycle = {
    // 页面初始化
    onInit(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    },
    
    // 页面可见性变化
    onVisibilityChange(callback) {
        document.addEventListener('visibilitychange', callback);
    },
    
    // 页面卸载前
    onBeforeUnload(callback) {
        window.addEventListener('beforeunload', callback);
    },
    
    // 设置页面动画
    setupPageAnimations() {
        const animatedElements = document.querySelectorAll('[data-animate]');
        animatedElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
};

// 常用页面配置
const PageConfigs = {
    // 儿童页面导航配置
    childPages: {
        'home': { title: '首页', icon: 'fas fa-home' },
        'learning-path': { title: '学习路径', icon: 'fas fa-road', back: 'home' },
        'ai-assistant': { title: 'AI助手', icon: 'fas fa-robot', back: 'home' },
        'story-wall': { title: '故事墙', icon: 'fas fa-book', back: 'home' },
        'badge-center': { title: '勋章中心', icon: 'fas fa-trophy', back: 'profile' },
        'evaluation': { title: '能力评估', icon: 'fas fa-chart-bar', back: 'profile' },
        'profile': { title: '个人中心', icon: 'fas fa-user', back: 'home' },
        'profile-edit': { title: '编辑资料', icon: 'fas fa-edit', back: 'profile' },
        'settings': { title: '设置', icon: 'fas fa-cog', back: 'profile' },
        'task-detail': { title: '任务详情', icon: 'fas fa-tasks', back: 'learning-path' },
        'report-detail': { title: '任务报告', icon: 'fas fa-file-alt', back: 'learning-path' },
        'system-features': { title: '系统功能', icon: 'fas fa-cogs', back: 'settings' },
        'collaborative-learning': { title: '协作学习', icon: 'fas fa-users', back: 'home' },
        'family-center': { title: '家庭中心', icon: 'fas fa-home-heart', back: 'home' }
    },
    
    // 家长页面导航配置
    parentPages: {
        'parent-auth': { title: '家长验证', icon: 'fas fa-shield-alt', back: 'home' },
        'parent-mode': { title: '家长模式', icon: 'fas fa-user-shield', back: 'home' },
        'parent-panel': { title: '家长控制面板', icon: 'fas fa-tachometer-alt', back: 'parent-mode' },
        'parent-ai': { title: 'AI分析报告', icon: 'fas fa-brain', back: 'parent-panel' },
        'parent-community': { title: '家长社区', icon: 'fas fa-users', back: 'parent-panel' },
        'parent-child-task': { title: '亲子任务', icon: 'fas fa-heart', back: 'parent-panel' }
    },
    
    // 获取页面配置
    getPageConfig(pageName) {
        return this.childPages[pageName] || this.parentPages[pageName] || { 
            title: '未知页面', 
            icon: 'fas fa-question', 
            back: 'home' 
        };
    }
};

// 全局暴露工具函数
window.MengyaUtils = {
    Navigation: NavigationManager,
    Data: DataManager,
    Notification: NotificationManager,
    Interaction: InteractionUtils,
    Lifecycle: PageLifecycle,
    PageConfigs: PageConfigs
};

// 兼容性别名
window.navigateToPage = NavigationManager.navigateTo;
window.navigateBack = NavigationManager.smartBack;
window.showNotification = NotificationManager.show;
window.vibrateDevice = InteractionUtils.vibrate;

// 自动初始化系统
PageLifecycle.onInit(() => {
    // 初始化导航系统
    NavigationManager.init();
    
    // 初始化通知系统
    NotificationManager.init();
    
    // 设置页面动画
    PageLifecycle.setupPageAnimations();
    
    // 初始化数据（加载默认数据）
    DataManager.syncData();
});

// 添加全局CSS样式
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    [data-animate] {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.6s ease;
    }
`;
document.head.appendChild(style);

// 萌芽AI统一工具库已加载 