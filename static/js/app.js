const API_URL = '/api';

// State
let state = { user: null, token: null, projects: [], tasks: [], users: [], stats: null };

// Initialize
function init() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
        state.token = token; state.user = user;
        renderApp();
    } else {
        renderLogin();
    }
}

// API Calls
async function api(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(state.token ? { 'Authorization': `Bearer ${state.token}` } : {})
    };
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (response.status === 401) { logout(); return; }
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API Error');
    return data;
}

// Auth
async function login(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        state.token = data.token; state.user = data.user;
        localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user));
        renderApp();
    } catch (err) { alert(err.message); }
}

async function register(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    try {
        await api('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password, role }) });
        alert('Registration successful. Please login.');
        renderLogin();
    } catch (err) { alert(err.message); }
}

function logout() {
    state.token = null; state.user = null;
    localStorage.removeItem('token'); localStorage.removeItem('user');
    renderLogin();
}

// Data Fetching
async function loadDashboardData() {
    try {
        const [stats, projects, tasks, users] = await Promise.all([
            api('/dashboard'), api('/projects'), api('/tasks'), api('/users')
        ]);
        state.stats = stats; state.projects = projects; state.tasks = tasks; state.users = users;
    } catch (err) { console.error(err); }
}

// UI Rendering
function renderLogin() {
    document.getElementById('app').innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h2><i class="fas fa-layer-group"></i> TaskFlow</h2>
                <form id="loginForm" onsubmit="login(event)">
                    <input type="email" id="email" placeholder="Email Address" required>
                    <input type="password" id="password" placeholder="Password" required>
                    <button type="submit" style="width: 100%; margin-top: 1rem; font-size: 1.1rem; padding: 0.8rem;">Log In</button>
                    <p style="text-align: center; margin-top: 1.5rem; color: var(--text-muted)">
                        Don't have an account? <a href="#" onclick="renderRegister(); return false;" style="font-weight: 600;">Sign up</a>
                    </p>
                </form>
            </div>
        </div>
    `;
}

function renderRegister() {
    document.getElementById('app').innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <h2>Create Account</h2>
                <form id="registerForm" onsubmit="register(event)">
                    <input type="text" id="username" placeholder="Username" required>
                    <input type="email" id="email" placeholder="Email Address" required>
                    <input type="password" id="password" placeholder="Password" required>
                    <select id="role">
                        <option value="Member">Member Role</option>
                        <option value="Admin">Admin Role</option>
                    </select>
                    <button type="submit" style="width: 100%; margin-top: 1rem; font-size: 1.1rem; padding: 0.8rem;">Register</button>
                    <p style="text-align: center; margin-top: 1.5rem; color: var(--text-muted)">
                        Already have an account? <a href="#" onclick="renderLogin(); return false;" style="font-weight: 600;">Log in</a>
                    </p>
                </form>
            </div>
        </div>
    `;
}

async function renderApp(view = 'dashboard') {
    await loadDashboardData();
    document.getElementById('app').innerHTML = `
        <div class="app-container">
            <aside class="sidebar">
                <div class="sidebar-logo"><i class="fas fa-layer-group"></i> TaskFlow</div>
                <div class="nav-link ${view === 'dashboard' ? 'active' : ''}" onclick="renderApp('dashboard')"><i class="fas fa-chart-pie"></i> Dashboard</div>
                <div class="nav-link ${view === 'projects' ? 'active' : ''}" onclick="renderApp('projects')"><i class="fas fa-project-diagram"></i> Projects</div>
                <div class="nav-link ${view === 'tasks' ? 'active' : ''}" onclick="renderApp('tasks')"><i class="fas fa-tasks"></i> Tasks</div>
                <div style="flex:1"></div>
                <div class="nav-link" onclick="logout()" style="color: var(--danger);"><i class="fas fa-sign-out-alt"></i> Logout</div>
            </aside>
            <main class="main-content">
                <div class="topbar">
                    <h2 style="font-size: 1.8rem;">${view.charAt(0).toUpperCase() + view.slice(1)}</h2>
                    <div class="user-info">
                        <span class="badge ${state.user.role === 'Admin' ? 'inprogress' : 'todo'}">${state.user.role}</span>
                        <div style="font-weight: 500;">${state.user.username}</div>
                        <div style="width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #a855f7); display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 4px 10px rgba(99,102,241,0.3)">
                            ${state.user.username.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
                <div id="view-content"></div>
            </main>
        </div>
        <div id="modal-root"></div>
    `;
    const content = document.getElementById('view-content');
    if (view === 'dashboard') content.innerHTML = getDashboardHTML();
    if (view === 'projects') content.innerHTML = getProjectsHTML();
    if (view === 'tasks') content.innerHTML = getTasksHTML();
}

function getDashboardHTML() {
    let completionsHTML = '';
    if (state.user.role === 'Admin' && state.stats?.member_completions?.length > 0) {
        completionsHTML = `
            <h3 style="margin-top: 2rem; margin-bottom: 1.5rem; font-size: 1.4rem;">Member Completions</h3>
            <div class="stats-grid" style="margin-bottom: 2rem;">
                ${state.stats.member_completions.map(c => `
                    <div class="stat-card" style="align-items: center; text-align: center; justify-content: center;">
                        <div class="stat-title">${c.username}</div>
                        <div class="stat-value" style="color: var(--success);">${c.count}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">Tasks Completed</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-title">Total Tasks</div>
                <div class="stat-value">${state.stats?.total || 0}</div>
            </div>
            <div class="stat-card progress">
                <div class="stat-title">In Progress</div>
                <div class="stat-value">${state.stats?.in_progress || 0}</div>
            </div>
            <div class="stat-card done">
                <div class="stat-title">Completed</div>
                <div class="stat-value">${state.stats?.done || 0}</div>
            </div>
            <div class="stat-card overdue">
                <div class="stat-title">Overdue</div>
                <div class="stat-value">${state.stats?.overdue || 0}</div>
            </div>
        </div>
        ${completionsHTML}
        <h3 style="margin-bottom: 1.5rem; font-size: 1.4rem;">Recent Tasks</h3>
        <div class="task-grid">
            ${state.tasks.slice(0, 3).map(task => getTaskCard(task)).join('')}
            ${state.tasks.length === 0 ? '<p style="color:var(--text-muted)">No tasks found.</p>' : ''}
        </div>
    `;
}

function getProjectsHTML() {
    return `
        ${state.user.role === 'Admin' ? `<button onclick="openModal('project')" style="margin-bottom: 2rem"><i class="fas fa-plus"></i> New Project</button>` : ''}
        <div class="task-grid">
            ${state.projects.map(p => `
                <div class="card">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <h3 style="margin-bottom: 0.75rem; font-size: 1.25rem;">${p.name}</h3>
                        ${state.user.role === 'Admin' ? `<button class="close-btn" onclick="openEditProjectModal(${p.id})" style="padding:0.2rem 0.5rem; color:var(--text-muted);"><i class="fas fa-edit"></i></button>` : ''}
                    </div>
                    <p style="color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.5;">${p.description}</p>
                    <div style="font-size: 0.85rem; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
                        <i class="far fa-calendar-alt"></i> Created: ${new Date(p.created_at).toLocaleDateString()}
                    </div>
                </div>
            `).join('')}
            ${state.projects.length === 0 ? '<p style="color:var(--text-muted)">No projects found.</p>' : ''}
        </div>
    `;
}

function getTasksHTML() {
    return `
        ${state.user.role === 'Admin' ? `<button onclick="openModal('task')" style="margin-bottom: 2rem"><i class="fas fa-plus"></i> New Task</button>` : ''}
        <div class="task-grid">
            ${state.tasks.map(task => getTaskCard(task)).join('')}
            ${state.tasks.length === 0 ? '<p style="color:var(--text-muted)">No tasks found.</p>' : ''}
        </div>
    `;
}

function getTaskCard(task) {
    const project = state.projects.find(p => p.id === task.project_id);
    const statusClass = task.status.toLowerCase().replace(' ', '');
    return `
        <div class="task-card ${statusClass}">
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <div class="badge ${statusClass}">${task.status}</div>
            </div>
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5; min-height: 3em;">${task.description || 'No description provided.'}</p>
            <div class="task-meta">
                <div style="display:flex; align-items:center; gap:0.5rem;"><i class="fas fa-project-diagram" style="color:var(--primary)"></i> ${project ? project.name : 'Unknown'}</div>
                <div style="display:flex; align-items:center; gap:0.5rem;"><i class="fas fa-user-circle" style="color:var(--primary)"></i> ${task.assigned_to ? task.assigned_to : 'Unassigned'}</div>
            </div>
            ${(state.user.role === 'Admin' || state.user.username === task.assigned_to) ? `
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05);">
                    <select onchange="updateTaskStatus(${task.id}, this.value)" style="margin-bottom:0; background-color: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1);">
                        <option value="To Do" ${task.status === 'To Do' ? 'selected' : ''}>To Do</option>
                        <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Done" ${task.status === 'Done' ? 'selected' : ''}>Done</option>
                    </select>
                </div>
            ` : ''}
        </div>
    `;
}

async function updateTaskStatus(taskId, status) {
    try { await api('/tasks/' + taskId, { method: 'PUT', body: JSON.stringify({ status }) }); renderApp('tasks'); } 
    catch (err) { alert(err.message); }
}

function openModal(type) {
    const root = document.getElementById('modal-root');
    let content = '';
    if (type === 'project') {
        content = `
            <div class="modal-header"><h3>Create Project</h3><button class="close-btn" onclick="closeModal()"><i class="fas fa-times"></i></button></div>
            <form onsubmit="createProject(event)">
                <input type="text" id="proj-name" placeholder="Project Name" required>
                <textarea id="proj-desc" placeholder="Project Description" rows="4"></textarea>
                <button type="submit" style="width: 100%; margin-top: 1rem;">Create Project</button>
            </form>`;
    } else if (type === 'task') {
        content = `
            <div class="modal-header"><h3>Create Task</h3><button class="close-btn" onclick="closeModal()"><i class="fas fa-times"></i></button></div>
            <form onsubmit="createTask(event)">
                <input type="text" id="task-title" placeholder="Task Title" required>
                <textarea id="task-desc" placeholder="Task Description" rows="3"></textarea>
                <select id="task-project" required><option value="">Select Project</option>${state.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</select>
                <select id="task-assignee"><option value="">Assign To...</option>${state.users.map(u => `<option value="${u.username}">${u.username}</option>`).join('')}</select>
                <input type="datetime-local" id="task-due" style="color-scheme: dark;">
                <button type="submit" style="width: 100%; margin-top: 1rem;">Create Task</button>
            </form>`;
    }
    root.innerHTML = `<div class="modal-overlay" id="modal-overlay"><div class="modal">${content}</div></div>`;
    setTimeout(() => document.getElementById('modal-overlay').classList.add('active'), 10);
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    setTimeout(() => document.getElementById('modal-root').innerHTML = '', 300);
}

function openEditProjectModal(projectId) {
    const project = state.projects.find(p => p.id === projectId);
    if(!project) return;
    const root = document.getElementById('modal-root');
    const content = `
        <div class="modal-header"><h3>Edit Project</h3><button class="close-btn" onclick="closeModal()"><i class="fas fa-times"></i></button></div>
        <form onsubmit="updateProject(event, ${project.id})">
            <input type="text" id="edit-proj-name" placeholder="Project Name" value="${project.name}" required>
            <textarea id="edit-proj-desc" placeholder="Project Description" rows="4">${project.description || ''}</textarea>
            <button type="submit" style="width: 100%; margin-top: 1rem;">Save Changes</button>
        </form>`;
    root.innerHTML = `<div class="modal-overlay" id="modal-overlay"><div class="modal">${content}</div></div>`;
    setTimeout(() => document.getElementById('modal-overlay').classList.add('active'), 10);
}

async function updateProject(e, projectId) {
    e.preventDefault();
    try {
        await api('/projects/' + projectId, { 
            method: 'PUT', 
            body: JSON.stringify({ 
                name: document.getElementById('edit-proj-name').value, 
                description: document.getElementById('edit-proj-desc').value 
            }) 
        });
        closeModal(); renderApp('projects');
    } catch(err) { alert(err.message); }
}

async function createProject(e) {
    e.preventDefault();
    try {
        await api('/projects', { method: 'POST', body: JSON.stringify({ name: document.getElementById('proj-name').value, description: document.getElementById('proj-desc').value }) });
        closeModal(); renderApp('projects');
    } catch(err) { alert(err.message); }
}

async function createTask(e) {
    e.preventDefault();
    try {
        await api('/tasks', { method: 'POST', body: JSON.stringify({
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-desc').value,
            project_id: document.getElementById('task-project').value,
            assigned_to: document.getElementById('task-assignee').value || null,
            due_date: document.getElementById('task-due').value ? new Date(document.getElementById('task-due').value).toISOString() : null
        }) });
        closeModal(); renderApp('tasks');
    } catch(err) { alert(err.message); }
}

window.addEventListener('DOMContentLoaded', init);
