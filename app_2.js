class LizardOS {
    constructor() {
        this.windows = new Map();
        this.windowZIndex = 100;
        this.activeWindow = null;
        this.isStartMenuOpen = false;
        this.dragData = null;
        this.wallpapers = [
            {name: "Default", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"},
            {name: "Ocean", gradient: "linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)"},
            {name: "Forest", gradient: "linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)"},
            {name: "Sunset", gradient: "linear-gradient(135deg, #FF5722 0%, #FF9800 100%)"}
        ];
        
        this.init();
    }

    init() {
        this.bootSystem();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
    }

    bootSystem() {
        setTimeout(() => {
            document.getElementById('bootScreen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('bootScreen').style.display = 'none';
                document.getElementById('desktop').classList.remove('hidden');
                this.setupEventListeners();
                this.showNotification('Welcome to LizardOS', 'System started successfully!');
            }, 500);
        }, 3500);
    }

    setupEventListeners() {
        // Start button
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleStartMenu();
            });
        }

        // Desktop icons with proper double-click handling
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            let clickTimer = null;
            
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Clear any existing timer
                if (clickTimer) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                    // This is a double-click
                    this.handleDesktopIconDoubleClick(icon);
                } else {
                    // Set timer for single click
                    clickTimer = setTimeout(() => {
                        this.handleDesktopIconSingleClick(icon);
                        clickTimer = null;
                    }, 250);
                }
            });
        });

        // Start menu apps
        document.querySelectorAll('.start-app, .start-app-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const appType = item.dataset.app;
                if (appType) {
                    console.log('Launching from start menu:', appType);
                    this.launchApplication(appType);
                    this.toggleStartMenu();
                }
            });
        });

        // Taskbar apps
        document.querySelectorAll('.taskbar-app').forEach(app => {
            app.addEventListener('click', (e) => {
                e.preventDefault();
                const appType = app.dataset.app;
                const windowId = `window-${appType}`;
                
                console.log('Taskbar app clicked:', appType);
                
                if (this.windows.has(windowId)) {
                    const windowData = this.windows.get(windowId);
                    if (windowData.element.style.display === 'none') {
                        // Restore minimized window
                        windowData.element.style.display = 'flex';
                        this.focusWindow(windowId);
                    } else {
                        this.focusWindow(windowId);
                    }
                } else {
                    this.launchApplication(appType);
                }
            });
        });

        // Desktop context menu
        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            });
        }

        // Hide context menu and start menu on click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
            if (!e.target.closest('.start-menu') && !e.target.closest('.start-button')) {
                if (this.isStartMenuOpen) {
                    this.toggleStartMenu();
                }
            }
        });

        // Context menu actions
        document.querySelectorAll('.context-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const action = item.dataset.action;
                this.handleContextAction(action);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcut(e);
        });

        // Power buttons
        document.querySelectorAll('.power-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                this.handlePowerAction(action);
            });
        });

        console.log('Event listeners setup completed');
    }

    handleDesktopIconSingleClick(icon) {
        // Visual feedback for selection
        document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
        console.log('Desktop icon selected:', icon.dataset.app);
    }

    handleDesktopIconDoubleClick(icon) {
        const appType = icon.dataset.app;
        console.log('Desktop icon double-clicked:', appType);
        this.launchApplication(appType);
    }

    toggleStartMenu() {
        const startMenu = document.getElementById('startMenu');
        this.isStartMenuOpen = !this.isStartMenuOpen;
        
        console.log('Toggle start menu:', this.isStartMenuOpen);
        
        if (this.isStartMenuOpen) {
            startMenu.classList.remove('hidden');
        } else {
            startMenu.classList.add('hidden');
        }
    }

    showContextMenu(x, y) {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.classList.remove('hidden');
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            contextMenu.classList.add('hidden');
        }
    }

    handleContextAction(action) {
        console.log('Context action:', action);
        switch (action) {
            case 'refresh':
                location.reload();
                break;
            case 'new-folder':
                this.showNotification('New Folder', 'Feature coming soon!');
                break;
            case 'paste':
                this.showNotification('Paste', 'Nothing to paste');
                break;
            case 'settings':
                this.launchApplication('settings');
                break;
        }
        this.hideContextMenu();
    }

    launchApplication(appType) {
        console.log('Launching application:', appType);
        const windowId = `window-${appType}`;
        
        if (this.windows.has(windowId)) {
            this.focusWindow(windowId);
            return;
        }

        const appData = this.getApplicationData(appType);
        if (!appData) {
            console.error('Application data not found for:', appType);
            return;
        }

        const windowElement = this.createWindow(windowId, appData);
        this.windows.set(windowId, {
            element: windowElement,
            type: appType,
            isMaximized: false,
            originalSize: null
        });

        this.updateTaskbar(windowId, appType, true);
        this.focusWindow(windowId);
        
        console.log('Application launched:', appType);
        this.showNotification('Application Launched', `${appData.title} is now running`);
    }

    getApplicationData(appType) {
        const apps = {
            'file-manager': {
                title: 'File Manager',
                icon: '📁',
                content: this.createFileManagerContent()
            },
            'settings': {
                title: 'Settings',
                icon: '⚙️',
                content: this.createSettingsContent()
            },
            'calculator': {
                title: 'Calculator',
                icon: '🔢',
                content: this.createCalculatorContent()
            },
            'text-editor': {
                title: 'Text Editor',
                icon: '📝',
                content: this.createTextEditorContent()
            },
            'web-browser': {
                title: 'Web Browser',
                icon: '🌐',
                content: this.createWebBrowserContent()
            },
            'games': {
                title: 'Games',
                icon: '🎮',
                content: this.createGamesContent()
            },
            'task-manager': {
                title: 'Task Manager',
                icon: '📊',
                content: this.createTaskManagerContent()
            }
        };
        
        return apps[appType];
    }

    createWindow(windowId, appData) {
        const window = document.createElement('div');
        window.className = 'window';
        window.id = windowId;
        window.style.top = `${50 + (this.windows.size * 30)}px`;
        window.style.left = `${100 + (this.windows.size * 30)}px`;
        window.style.width = '600px';
        window.style.height = '400px';
        window.style.zIndex = ++this.windowZIndex;

        window.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <span>${appData.icon}</span>
                    <span>${appData.title}</span>
                </div>
                <div class="window-controls">
                    <button class="window-control minimize" title="Minimize">−</button>
                    <button class="window-control maximize" title="Maximize">□</button>
                    <button class="window-control close" title="Close">✕</button>
                </div>
            </div>
            <div class="window-content">
                ${appData.content}
            </div>
        `;

        // Window controls
        window.querySelector('.minimize').addEventListener('click', (e) => {
            e.preventDefault();
            this.minimizeWindow(windowId);
        });
        window.querySelector('.maximize').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleMaximizeWindow(windowId);
        });
        window.querySelector('.close').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeWindow(windowId);
        });

        // Window dragging
        const header = window.querySelector('.window-header');
        header.addEventListener('mousedown', (e) => this.startDragging(e, windowId));

        // Window focus
        window.addEventListener('mousedown', () => this.focusWindow(windowId));

        document.getElementById('windowsContainer').appendChild(window);
        return window;
    }

    createFileManagerContent() {
        return `
            <div class="app-file-manager">
                <div class="file-sidebar">
                    <h4>Quick Access</h4>
                    <div class="file-item">📁 Desktop</div>
                    <div class="file-item">📁 Documents</div>
                    <div class="file-item">📁 Pictures</div>
                    <div class="file-item">📁 Downloads</div>
                </div>
                <div class="file-content">
                    <div class="file-toolbar">
                        <button class="btn btn--sm">← Back</button>
                        <button class="btn btn--sm">→ Forward</button>
                        <button class="btn btn--sm">🔄 Refresh</button>
                    </div>
                    <div class="file-list">
                        <div class="file-item">📁 New Folder</div>
                        <div class="file-item">📄 Document.txt</div>
                        <div class="file-item">🖼️ Image.jpg</div>
                        <div class="file-item">🎵 Music.mp3</div>
                    </div>
                </div>
            </div>
        `;
    }

    createCalculatorContent() {
        return `
            <div class="app-calculator">
                <input type="text" class="calc-display" id="calcDisplay-${Date.now()}" readonly value="0">
                <div class="calc-buttons">
                    <button class="calc-btn" data-action="clear">C</button>
                    <button class="calc-btn" data-action="backspace">⌫</button>
                    <button class="calc-btn operator" data-value="/">/</button>
                    <button class="calc-btn operator" data-value="*">*</button>
                    <button class="calc-btn" data-value="7">7</button>
                    <button class="calc-btn" data-value="8">8</button>
                    <button class="calc-btn" data-value="9">9</button>
                    <button class="calc-btn operator" data-value="-">-</button>
                    <button class="calc-btn" data-value="4">4</button>
                    <button class="calc-btn" data-value="5">5</button>
                    <button class="calc-btn" data-value="6">6</button>
                    <button class="calc-btn operator" data-value="+">+</button>
                    <button class="calc-btn" data-value="1">1</button>
                    <button class="calc-btn" data-value="2">2</button>
                    <button class="calc-btn" data-value="3">3</button>
                    <button class="calc-btn operator" data-action="calculate" style="grid-row: span 2">=</button>
                    <button class="calc-btn" data-value="0" style="grid-column: span 2">0</button>
                    <button class="calc-btn" data-value=".">.</button>
                </div>
            </div>
        `;
    }

    createSettingsContent() {
        return `
            <div class="app-settings">
                <div class="settings-section">
                    <h3>Personalization</h3>
                    <div class="settings-row">
                        <label>Wallpaper</label>
                        <div class="wallpaper-grid">
                            ${this.wallpapers.map((wp, index) => 
                                `<div class="wallpaper-option ${index === 0 ? 'selected' : ''}" 
                                      style="background: ${wp.gradient}" 
                                      data-wallpaper="${index}"></div>`
                            ).join('')}
                        </div>
                    </div>
                </div>
                <div class="settings-section">
                    <h3>System</h3>
                    <div class="settings-row">
                        <label>OS Version</label>
                        <span>LizardOS 1.0</span>
                    </div>
                    <div class="settings-row">
                        <label>Build Number</label>
                        <span>2025.09.001</span>
                    </div>
                </div>
                <div class="settings-section">
                    <h3>Accessibility</h3>
                    <div class="settings-row">
                        <label>High Contrast</label>
                        <button class="btn btn--sm" data-action="toggle-contrast">Toggle</button>
                    </div>
                </div>
            </div>
        `;
    }

    createTextEditorContent() {
        return `
            <div class="app-text-editor">
                <div class="text-toolbar">
                    <button class="btn btn--sm" data-action="new-file">New</button>
                    <button class="btn btn--sm" data-action="open-file">Open</button>
                    <button class="btn btn--sm" data-action="save-file">Save</button>
                </div>
                <textarea class="text-area" placeholder="Start typing..."></textarea>
            </div>
        `;
    }

    createWebBrowserContent() {
        return `
            <div class="app-web-browser">
                <div class="browser-toolbar" style="display: flex; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border);">
                    <button class="btn btn--sm">← Back</button>
                    <button class="btn btn--sm">→ Forward</button>
                    <button class="btn btn--sm">🔄 Refresh</button>
                    <input type="text" class="form-control" style="flex: 1;" placeholder="Enter URL or search..." value="https://lizardos.local">
                </div>
                <div style="text-align: center; padding: 40px; background: var(--color-bg-1); border-radius: var(--radius-md);">
                    <h2>🌐 LizardOS Browser</h2>
                    <p>Welcome to the built-in web browser!</p>
                    <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">This is a demo browser interface.</p>
                </div>
            </div>
        `;
    }

    createGamesContent() {
        return `
            <div class="app-games">
                <h3 style="margin-bottom: 16px;">🎮 Game Center</h3>
                <div style="display: grid; gap: 16px;">
                    <button class="btn btn--outline" data-game="tic-tac-toe" style="padding: 16px; text-align: left;">
                        <strong>🎯 Tic Tac Toe</strong><br>
                        <small>Classic 3x3 grid game</small>
                    </button>
                    <button class="btn btn--outline" data-game="memory" style="padding: 16px; text-align: left;">
                        <strong>🧠 Memory Game</strong><br>
                        <small>Match the pairs</small>
                    </button>
                    <button class="btn btn--outline" data-game="snake" style="padding: 16px; text-align: left;">
                        <strong>🐍 Snake</strong><br>
                        <small>Classic snake game</small>
                    </button>
                </div>
            </div>
        `;
    }

    createTaskManagerContent() {
        return `
            <div class="app-task-manager">
                <h3 style="margin-bottom: 16px;">📊 Task Manager</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--color-border);">
                            <th style="text-align: left; padding: 8px;">Process</th>
                            <th style="text-align: right; padding: 8px;">CPU</th>
                            <th style="text-align: right; padding: 8px;">Memory</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid var(--color-border);">
                            <td style="padding: 8px;">🦎 LizardOS System</td>
                            <td style="padding: 8px; text-align: right;">2%</td>
                            <td style="padding: 8px; text-align: right;">128 MB</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--color-border);">
                            <td style="padding: 8px;">📁 File Manager</td>
                            <td style="padding: 8px; text-align: right;">1%</td>
                            <td style="padding: 8px; text-align: right;">32 MB</td>
                        </tr>
                        <tr style="border-bottom: 1px solid var(--color-border);">
                            <td style="padding: 8px;">🌐 Web Browser</td>
                            <td style="padding: 8px; text-align: right;">5%</td>
                            <td style="padding: 8px; text-align: right;">256 MB</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    // Window Management
    startDragging(e, windowId) {
        if (e.target.closest('.window-controls')) return;
        
        const windowElement = this.windows.get(windowId).element;
        const rect = windowElement.getBoundingClientRect();
        
        this.dragData = {
            windowId,
            startX: e.clientX - rect.left,
            startY: e.clientY - rect.top
        };
        
        document.addEventListener('mousemove', this.handleDragging.bind(this));
        document.addEventListener('mouseup', this.stopDragging.bind(this));
        e.preventDefault();
    }

    handleDragging(e) {
        if (!this.dragData) return;
        
        const windowElement = this.windows.get(this.dragData.windowId).element;
        const x = e.clientX - this.dragData.startX;
        const y = e.clientY - this.dragData.startY;
        
        windowElement.style.left = Math.max(0, x) + 'px';
        windowElement.style.top = Math.max(0, y) + 'px';
    }

    stopDragging() {
        this.dragData = null;
        document.removeEventListener('mousemove', this.handleDragging);
        document.removeEventListener('mouseup', this.stopDragging);
    }

    focusWindow(windowId) {
        if (this.activeWindow) {
            this.activeWindow.style.zIndex = this.windowZIndex - 1;
        }
        
        const windowData = this.windows.get(windowId);
        if (windowData) {
            windowData.element.style.zIndex = ++this.windowZIndex;
            this.activeWindow = windowData.element;
        }
    }

    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (windowData) {
            windowData.element.style.display = 'none';
            this.updateTaskbar(windowId, windowData.type, false);
        }
    }

    toggleMaximizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;
        
        if (windowData.isMaximized) {
            // Restore
            const { width, height, top, left } = windowData.originalSize;
            windowData.element.style.width = width;
            windowData.element.style.height = height;
            windowData.element.style.top = top;
            windowData.element.style.left = left;
            windowData.element.classList.remove('maximized');
            windowData.isMaximized = false;
        } else {
            // Maximize
            windowData.originalSize = {
                width: windowData.element.style.width,
                height: windowData.element.style.height,
                top: windowData.element.style.top,
                left: windowData.element.style.left
            };
            windowData.element.classList.add('maximized');
            windowData.isMaximized = true;
        }
    }

    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (windowData) {
            windowData.element.remove();
            this.windows.delete(windowId);
            this.updateTaskbar(windowId, windowData.type, false, true);
        }
    }

    updateTaskbar(windowId, appType, isOpen, isClosing = false) {
        const taskbarApp = document.querySelector(`.taskbar-app[data-app="${appType}"]`);
        if (taskbarApp) {
            if (isClosing) {
                taskbarApp.classList.remove('active');
            } else {
                taskbarApp.classList.toggle('active', isOpen);
            }
        }
    }

    // Utility functions
    updateTime() {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString();
        
        const timeElement = document.getElementById('currentTime');
        const dateElement = document.getElementById('currentDate');
        
        if (timeElement) timeElement.textContent = time;
        if (dateElement) dateElement.textContent = date;
    }

    showNotification(title, message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <h4 style="margin: 0 0 8px 0;">${title}</h4>
            <p style="margin: 0; font-size: var(--font-size-sm);">${message}</p>
        `;
        
        const notificationsContainer = document.getElementById('notifications');
        if (notificationsContainer) {
            notificationsContainer.appendChild(notification);
        }
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    handleKeyboardShortcut(e) {
        // Alt + Tab for window switching
        if (e.altKey && e.key === 'Tab') {
            e.preventDefault();
            this.showWindowSwitcher();
        }
        
        // Windows key for start menu
        if (e.key === 'Meta' || e.key === 'OS') {
            e.preventDefault();
            this.toggleStartMenu();
        }
        
        // Ctrl + Alt + Del for task manager
        if (e.ctrlKey && e.altKey && e.key === 'Delete') {
            e.preventDefault();
            this.launchApplication('task-manager');
        }
    }

    showWindowSwitcher() {
        this.showNotification('Window Switcher', 'Alt+Tab window switching');
    }

    handlePowerAction(action) {
        if (action === 'shutdown') {
            this.showNotification('System', 'Shutting down...');
            setTimeout(() => {
                document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: black; color: white; font-size: 2rem;">System Shutdown</div>';
            }, 2000);
        } else if (action === 'restart') {
            this.showNotification('System', 'Restarting...');
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }
}

// Initialize LizardOS
const lizardOS = new LizardOS();

// Setup event delegation for dynamic content
document.addEventListener('click', function(e) {
    // Calculator buttons
    if (e.target.classList.contains('calc-btn')) {
        const windowContent = e.target.closest('.window-content');
        const display = windowContent.querySelector('.calc-display');
        
        if (e.target.dataset.action === 'clear') {
            display.value = '0';
        } else if (e.target.dataset.action === 'backspace') {
            display.value = display.value.length > 1 ? display.value.slice(0, -1) : '0';
        } else if (e.target.dataset.action === 'calculate') {
            try {
                const result = eval(display.value);
                display.value = result;
            } catch {
                display.value = 'Error';
            }
        } else if (e.target.dataset.value) {
            if (display.value === '0') {
                display.value = e.target.dataset.value;
            } else {
                display.value += e.target.dataset.value;
            }
        }
    }
    
    // Wallpaper selection
    if (e.target.classList.contains('wallpaper-option')) {
        const index = parseInt(e.target.dataset.wallpaper);
        const wallpaper = lizardOS.wallpapers[index];
        document.getElementById('desktop').style.background = wallpaper.gradient;
        
        // Update selected state
        e.target.parentElement.querySelectorAll('.wallpaper-option').forEach((option, i) => {
            option.classList.toggle('selected', i === index);
        });
        
        lizardOS.showNotification('Wallpaper Changed', `Applied ${wallpaper.name} wallpaper`);
    }
    
    // Settings actions
    if (e.target.dataset.action === 'toggle-contrast') {
        document.body.classList.toggle('high-contrast');
        lizardOS.showNotification('Accessibility', 'High contrast mode toggled');
    }
    
    // Text editor actions
    if (e.target.dataset.action === 'new-file') {
        const textarea = e.target.closest('.window-content').querySelector('.text-area');
        textarea.value = '';
        lizardOS.showNotification('Text Editor', 'New file created');
    }
    
    if (e.target.dataset.action === 'save-file') {
        const textarea = e.target.closest('.window-content').querySelector('.text-area');
        const content = textarea.value;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.txt';
        a.click();
        lizardOS.showNotification('Text Editor', 'File saved successfully');
    }
    
    // Game buttons
    if (e.target.dataset.game) {
        const game = e.target.dataset.game;
        lizardOS.showNotification('Games', `${game} coming soon!`);
    }
});