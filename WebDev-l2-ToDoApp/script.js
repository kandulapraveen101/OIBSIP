/**
 * TaskFlow — Interactive To-Do List Application
 * Features: LocalStorage persistence, inline editing, task counts, completion timestamps,
 * search & priority filtering, confetti celebrations, theme toggling, and smooth view transitions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. Initial State & Configuration
    // ==========================================
    const LOCAL_STORAGE_KEY = 'taskflow_tasks_v1';
    const THEME_STORAGE_KEY = 'taskflow_theme_v1';

    // Sample default tasks if local storage is completely empty
    const DEFAULT_TASKS = [
        {
            id: 'task_sample_1',
            text: 'Welcome to TaskFlow! Double-click or click edit to modify inline',
            completed: false,
            priority: 'high',
            category: 'general',
            createdAt: new Date().toISOString(),
            completedAt: null
        },
        {
            id: 'task_sample_2',
            text: 'Click the checkbox to complete this task and celebrate 🎉',
            completed: false,
            priority: 'medium',
            category: 'work',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            completedAt: null
        },
        {
            id: 'task_sample_3',
            text: 'Create your first custom task using the form above',
            completed: true,
            priority: 'low',
            category: 'ideas',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            completedAt: new Date(Date.now() - 43200000).toISOString()
        }
    ];

    let tasks = [];
    let activeFilter = 'all'; // 'all' | 'pending' | 'completed'
    let searchQuery = '';
    let editingTaskId = null;

    // ==========================================
    // 2. DOM Elements
    // ==========================================
    const addTaskForm = document.getElementById('add-task-form');
    const taskInput = document.getElementById('task-input');
    const prioritySelect = document.getElementById('task-priority-select');
    const categorySelect = document.getElementById('task-category-select');

    const pendingList = document.getElementById('pending-list');
    const completedList = document.getElementById('completed-list');

    const pendingCountBadge = document.getElementById('pending-count');
    const completedCountBadge = document.getElementById('completed-count');

    const pendingEmptyState = document.getElementById('pending-empty-state');
    const completedEmptyState = document.getElementById('completed-empty-state');

    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressPercentText = document.getElementById('progress-percent');
    const progressStatsText = document.getElementById('progress-stats');
    const progressBarContainer = document.getElementById('progress-bar-container');

    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const toastContainer = document.getElementById('toast-container');
    const confettiCanvas = document.getElementById('confetti-canvas');

    // ==========================================
    // 3. Application Initialization
    // ==========================================
    function init() {
        loadThemePreference();
        loadTasks();
        setupEventListeners();
        render();
    }

    // ==========================================
    // 4. Persistence (LocalStorage)
    // ==========================================
    function loadTasks() {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) {
                tasks = JSON.parse(stored);
            } else {
                tasks = DEFAULT_TASKS;
                saveTasks();
            }
        } catch (e) {
            console.error('Failed to load tasks from localStorage:', e);
            tasks = DEFAULT_TASKS;
        }
    }

    function saveTasks() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
        } catch (e) {
            console.error('Failed to save tasks to localStorage:', e);
            showToast('⚠️ Could not save tasks locally.', 'error');
        }
    }

    function loadThemePreference() {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            updateThemeIcons(true);
        } else {
            document.body.classList.remove('light-theme');
            updateThemeIcons(false);
        }
    }

    function toggleTheme() {
        const isLight = document.body.classList.toggle('light-theme');
        localStorage.setItem(THEME_STORAGE_KEY, isLight ? 'light' : 'dark');
        updateThemeIcons(isLight);
        showToast(isLight ? 'Light theme activated ☀️' : 'Dark theme activated 🌙');
    }

    function updateThemeIcons(isLight) {
        const sunIcon = themeToggleBtn.querySelector('.sun-icon');
        const moonIcon = themeToggleBtn.querySelector('.moon-icon');
        if (isLight) {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    }

    // ==========================================
    // 5. Event Listeners Setup
    // ==========================================
    function setupEventListeners() {
        // Add Task Form Submission
        addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAddTask();
        });

        // Search Input Filter
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            clearSearchBtn.classList.toggle('hidden', searchQuery === '');
            renderWithTransition();
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.classList.add('hidden');
            searchInput.focus();
            renderWithTransition();
        });

        // Filter Pills Click
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                activeFilter = btn.dataset.filter;
                renderWithTransition();
            });
        });

        // Clear Completed Tasks
        clearCompletedBtn.addEventListener('click', () => {
            const completedCount = tasks.filter(t => t.completed).length;
            if (completedCount === 0) return;
            
            tasks = tasks.filter(t => !t.completed);
            saveTasks();
            showToast(`Cleared ${completedCount} completed task(s) ✨`);
            renderWithTransition();
        });

        // Theme Toggle
        themeToggleBtn.addEventListener('click', toggleTheme);

        // Delegation for Task Action Clicks in Lists
        [pendingList, completedList].forEach(listEl => {
            listEl.addEventListener('click', (e) => {
                const taskItem = e.target.closest('.task-item');
                if (!taskItem) return;

                const taskId = taskItem.dataset.id;

                // Handle Delete Action
                if (e.target.closest('.action-btn-delete')) {
                    handleDeleteTask(taskId);
                    return;
                }

                // Handle Edit Action
                if (e.target.closest('.action-btn-edit')) {
                    startEditingTask(taskId);
                    return;
                }

                // Handle Save Inline Edit Action
                if (e.target.closest('.save-btn')) {
                    saveEditingTask(taskId, taskItem);
                    return;
                }

                // Handle Cancel Inline Edit Action
                if (e.target.closest('.cancel-btn')) {
                    cancelEditingTask();
                    return;
                }
            });

            // Handle Checkbox Change
            listEl.addEventListener('change', (e) => {
                if (e.target.classList.contains('task-checkbox')) {
                    const taskId = e.target.closest('.task-item').dataset.id;
                    handleToggleTask(taskId, e.target.checked);
                }
            });

            // Double Click Text to Edit
            listEl.addEventListener('dblclick', (e) => {
                if (e.target.classList.contains('task-text')) {
                    const taskId = e.target.closest('.task-item').dataset.id;
                    startEditingTask(taskId);
                }
            });
        });
    }

    // ==========================================
    // 6. Core CRUD Handlers
    // ==========================================
    function handleAddTask() {
        const text = taskInput.value.trim();
        if (!text) return;

        const newTask = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            text: text,
            completed: false,
            priority: prioritySelect.value,
            category: categorySelect.value,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        tasks.unshift(newTask);
        saveTasks();

        taskInput.value = '';
        taskInput.focus();

        showToast('Task added to pending! 🚀');
        renderWithTransition();
    }

    function handleToggleTask(id, isCompleted) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = isCompleted;
        task.completedAt = isCompleted ? new Date().toISOString() : null;

        saveTasks();

        if (isCompleted) {
            triggerConfetti();
            showToast('Task completed! Great job 🎯');
        } else {
            showToast('Task moved back to pending');
        }

        renderWithTransition();
    }

    function handleDeleteTask(id) {
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) return;

        const deletedText = tasks[taskIndex].text;
        tasks.splice(taskIndex, 1);
        saveTasks();

        showToast(`Deleted "${truncateString(deletedText, 24)}" 🗑️`);
        renderWithTransition();
    }

    function startEditingTask(id) {
        editingTaskId = id;
        render();
        // Focus the inline edit input
        const editInput = document.querySelector(`.task-item[data-id="${id}"] .edit-input`);
        if (editInput) {
            editInput.focus();
            editInput.select();

            // Keyboard listeners inside inline edit
            editInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveEditingTask(id, editInput.closest('.task-item'));
                } else if (e.key === 'Escape') {
                    cancelEditingTask();
                }
            });
        }
    }

    function saveEditingTask(id, taskItem) {
        const editInput = taskItem.querySelector('.edit-input');
        if (!editInput) return;

        const newText = editInput.value.trim();
        if (!newText) {
            showToast('Task text cannot be empty', 'error');
            return;
        }

        const task = tasks.find(t => t.id === id);
        if (task) {
            task.text = newText;
            saveTasks();
            showToast('Task updated ✏️');
        }

        editingTaskId = null;
        renderWithTransition();
    }

    function cancelEditingTask() {
        editingTaskId = null;
        render();
    }

    // ==========================================
    // 7. Rendering Logic & View Transitions
    // ==========================================
    function renderWithTransition() {
        if (document.startViewTransition) {
            document.startViewTransition(() => render());
        } else {
            render();
        }
    }

    function render() {
        // Filter Tasks based on search query and status filter
        const filteredTasks = tasks.filter(task => {
            const matchesSearch = task.text.toLowerCase().includes(searchQuery);
            if (!matchesSearch) return false;

            if (activeFilter === 'pending') return !task.completed;
            if (activeFilter === 'completed') return task.completed;
            return true; // 'all'
        });

        const pendingTasks = filteredTasks.filter(t => !t.completed);
        const completedTasks = filteredTasks.filter(t => t.completed);

        // Render Pending List
        if (pendingTasks.length === 0) {
            pendingList.innerHTML = '';
            pendingEmptyState.classList.remove('hidden');
        } else {
            pendingEmptyState.classList.add('hidden');
            pendingList.innerHTML = pendingTasks.map(t => createTaskItemHTML(t)).join('');
        }

        // Render Completed List
        if (completedTasks.length === 0) {
            completedList.innerHTML = '';
            completedEmptyState.classList.remove('hidden');
        } else {
            completedEmptyState.classList.add('hidden');
            completedList.innerHTML = completedTasks.map(t => createTaskItemHTML(t)).join('');
        }

        // Update Counter Badges
        const totalPendingCount = tasks.filter(t => !t.completed).length;
        const totalCompletedCount = tasks.filter(t => t.completed).length;
        
        pendingCountBadge.textContent = `${totalPendingCount} pending`;
        completedCountBadge.textContent = `${totalCompletedCount} completed`;

        // Update Clear All Completed button visibility
        clearCompletedBtn.classList.toggle('hidden', totalCompletedCount === 0);

        // Update Progress Bar
        updateProgressBar(totalPendingCount, totalCompletedCount);
    }

    function createTaskItemHTML(task) {
        const isEditing = editingTaskId === task.id;
        const formattedCreatedDate = formatDate(task.createdAt);
        const formattedCompletedDate = task.completedAt ? formatDate(task.completedAt) : null;

        const categoryLabel = getCategoryLabel(task.category);

        return `
            <div class="task-item ${task.completed ? 'completed-item' : ''}" data-id="${task.id}" role="listitem">
                <div class="task-main-row">
                    <label class="checkbox-container" title="${task.completed ? 'Mark as Pending' : 'Mark as Complete'}">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                        <span class="checkmark">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </span>
                    </label>

                    <div class="task-content">
                        ${isEditing ? `
                            <div class="edit-form">
                                <input type="text" class="edit-input" value="${escapeHTML(task.text)}" maxlength="120">
                                <div class="edit-actions">
                                    <button class="action-btn-sm save-btn" title="Save (Enter)">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    </button>
                                    <button class="action-btn-sm cancel-btn" title="Cancel (Esc)">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            </div>
                        ` : `
                            <span class="task-text" title="Double click to edit">${escapeHTML(task.text)}</span>
                        `}
                    </div>

                    ${!isEditing ? `
                        <div class="task-actions">
                            <button class="action-btn action-btn-edit" title="Edit task" aria-label="Edit task">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="action-btn action-btn-delete" title="Delete task" aria-label="Delete task">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    ` : ''}
                </div>

                <div class="task-meta-row">
                    <div class="task-tags">
                        <span class="priority-pill priority-${task.priority}">
                            ${task.priority}
                        </span>
                        <span class="category-pill">
                            ${categoryLabel}
                        </span>
                    </div>

                    <div class="timestamp">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>${task.completed ? `Done ${formattedCompletedDate}` : `Added ${formattedCreatedDate}`}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function updateProgressBar(pending, completed) {
        const total = pending + completed;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        progressBarFill.style.width = `${percent}%`;
        progressPercentText.textContent = `${percent}%`;
        progressStatsText.textContent = `${completed} of ${total} tasks completed`;
        progressBarContainer.setAttribute('aria-valuenow', percent);
    }

    // ==========================================
    // 8. Helper Functions & Utilities
    // ==========================================
    function formatDate(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const isToday = date.toDateString() === now.toDateString();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (isToday) return `today at ${timeStr}`;

        return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
    }

    function getCategoryLabel(cat) {
        const map = {
            general: '📋 General',
            work: '💼 Work',
            personal: '👤 Personal',
            urgent: '⚡ Urgent',
            ideas: '💡 Ideas'
        };
        return map[cat] || '📋 General';
    }

    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function truncateString(str, num) {
        if (str.length <= num) return str;
        return str.slice(0, num) + '...';
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-exit');
            toast.addEventListener('animationend', () => toast.remove());
        }, 2800);
    }

    // Simple Lightweight Canvas Confetti
    function triggerConfetti() {
        if (!confettiCanvas) return;
        const ctx = confettiCanvas.getContext('2d');
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

        for (let i = 0; i < 40; i++) {
            particles.push({
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 300,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 1.5) * 10,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        let animationFrame;
        function animate() {
            ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            let active = false;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.25; // gravity
                p.rotation += p.rotationSpeed;
                p.opacity -= 0.015;

                if (p.opacity > 0) {
                    active = true;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                }
            });

            if (active) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
                cancelAnimationFrame(animationFrame);
            }
        }

        animate();
    }

    // Run app initialization
    init();
});
