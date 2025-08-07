// ==============================
// MANTENIMIENTOS PREVENTIVOS
// ==============================

let mantenimientos = [];
let tecnicos = [];
let currentMaintId = null;
let confirmCallback = null;

// Theme toggle
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.querySelector('.theme-toggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

// Load saved theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    document.querySelector('.theme-toggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    
    initializeMantenimientos();
});

// Initialize
async function initializeMantenimientos() {
    await loadTechnicians();
    await loadMantenimientos();
    setupEventListeners();
}

// Event listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', filterMantenimientos);
    document.getElementById('areaFilter').addEventListener('change', filterMantenimientos);
    document.getElementById('statusFilter').addEventListener('change', filterMantenimientos);

    document.getElementById('maintModal').addEventListener('click', (e) => {
        if (e.target.id === 'maintModal') closeMaintModal();
    });
    document.getElementById('confirmModal').addEventListener('click', (e) => {
        if (e.target.id === 'confirmModal') closeConfirmModal();
    });
}

// Load data
async function loadMantenimientos() {
    try {
        const data = await HttpClient.get('/mantenimientos');
        mantenimientos = data || [];
        renderMantenimientos();
        updateStats();
    } catch (error) {
        console.error('Error loading mantenimientos:', error);
        ToastManager.error('Error al cargar mantenimientos');
        document.getElementById('maintTableBody').innerHTML = '<tr><td colspan="7">❌ Error al cargar datos</td></tr>';
    }
}

async function loadTechnicians() {
    try {
        const users = await HttpClient.get('/usuarios');
        tecnicos = users.filter(u => u.cargo === 'tecnico') || [];

        const select = document.getElementById('tecnico_responsable_id');
        select.innerHTML = '<option value="">Sin asignar</option>' + 
            tecnicos.map(t => `<option value="${t.id}">${t.nombre_completo}</option>`).join('');
    } catch (error) {
        console.error('Error loading technicians:', error);
    }
}

// Render table
function renderMantenimientos() {
    const tbody = document.getElementById('maintTableBody');
    if (!mantenimientos.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">📭 No hay mantenimientos registrados</td></tr>';
        document.getElementById('maintCount').textContent = '0 mantenimientos';
        return;
    }

    tbody.innerHTML = mantenimientos.map(m => `
        <tr>
            <td><div class="user-info"><strong>${m.tarea_nombre}</strong>${m.descripcion ? `<small>${m.descripcion}</small>` : ''}</div></td>
            <td>${m.area_responsable}</td>
            <td>Cada ${m.frecuencia_dias} días</td>
            <td>${m.responsable || 'Sin asignar'}</td>
            <td class="${getDateClass(m.proxima_ejecucion)}">${formatDate(m.proxima_ejecucion)}</td>
            <td><span class="status-badge ${m.estado === 'activo' ? 'status-active' : 'status-inactive'}">${m.estado.toUpperCase()}</span></td>
            <td class="actions-col">
                ${m.estado === 'activo' ? `<button class="btn-action btn-status" onclick="executeMantenimiento(${m.id})" title="Marcar como ejecutado">✅</button>` : ''}
                <button class="btn-action btn-edit" onclick="editMantenimiento(${m.id})" title="Editar">✏️</button>
                <button class="btn-action ${m.estado === 'activo' ? 'btn-delete' : 'btn-status'}" onclick="toggleStatus(${m.id})" title="${m.estado === 'activo' ? 'Desactivar' : 'Activar'}">${m.estado === 'activo' ? '🔴' : '🟢'}</button>
            </td>
        </tr>
    `).join('');

    document.getElementById('maintCount').textContent = `${mantenimientos.length} mantenimientos`;
}

function getDateClass(date) {
    const today = new Date();
    const execDate = new Date(date);
    const diffDays = Math.ceil((execDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'text-error';
    if (diffDays <= 7) return 'text-warning';
    return '';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function updateStats() {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stats = {
        total: mantenimientos.length,
        upcoming: mantenimientos.filter(m => {
            const execDate = new Date(m.proxima_ejecucion);
            return execDate >= today && execDate <= nextWeek && m.estado === 'activo';
        }).length,
        overdue: mantenimientos.filter(m => {
            const execDate = new Date(m.proxima_ejecucion);
            return execDate < today && m.estado === 'activo';
        }).length,
        active: mantenimientos.filter(m => m.estado === 'activo').length
    };

    document.getElementById('totalMaint').textContent = stats.total;
    document.getElementById('upcomingMaint').textContent = stats.upcoming;
    document.getElementById('overdueMaint').textContent = stats.overdue;
    document.getElementById('activeMaint').textContent = stats.active;
}

function filterMantenimientos() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const areaFilter = document.getElementById('areaFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    const filtered = mantenimientos.filter(m => {
        const matchesSearch = !searchTerm || 
            m.tarea_nombre.toLowerCase().includes(searchTerm) ||
            (m.descripcion && m.descripcion.toLowerCase().includes(searchTerm)) ||
            (m.responsable && m.responsable.toLowerCase().includes(searchTerm));
        const matchesArea = !areaFilter || m.area_responsable === areaFilter;
        const matchesStatus = statusFilter === '' || m.estado === statusFilter;
        return matchesSearch && matchesArea && matchesStatus;
    });

    renderFilteredMantenimientos(filtered);
}

function renderFilteredMantenimientos(filtered) {
    const tbody = document.getElementById('maintTableBody');
    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">🔍 No se encontraron mantenimientos</td></tr>';
        return;
    }
    tbody.innerHTML = filtered.map(m => `
        <tr>
            <td><div class="user-info"><strong>${m.tarea_nombre}</strong>${m.descripcion ? `<small>${m.descripcion}</small>` : ''}</div></td>
            <td>${m.area_responsable}</td>
            <td>Cada ${m.frecuencia_dias} días</td>
            <td>${m.responsable || 'Sin asignar'}</td>
            <td class="${getDateClass(m.proxima_ejecucion)}">${formatDate(m.proxima_ejecucion)}</td>
            <td><span class="status-badge ${m.estado === 'activo' ? 'status-active' : 'status-inactive'}">${m.estado.toUpperCase()}</span></td>
            <td class="actions-col">
                ${m.estado === 'activo' ? `<button class="btn-action btn-status" onclick="executeMantenimiento(${m.id})" title="Marcar como ejecutado">✅</button>` : ''}
                <button class="btn-action btn-edit" onclick="editMantenimiento(${m.id})" title="Editar">✏️</button>
                <button class="btn-action ${m.estado === 'activo' ? 'btn-delete' : 'btn-status'}" onclick="toggleStatus(${m.id})" title="${m.estado === 'activo' ? 'Desactivar' : 'Activar'}">${m.estado === 'activo' ? '🔴' : '🟢'}</button>
            </td>
        </tr>
    `).join('');
}

function showCreateModal() {
    currentMaintId = null;
    document.getElementById('modalTitle').textContent = '➕ Nuevo Mantenimiento';
    document.getElementById('maintForm').reset();
    document.getElementById('maintModal').style.display = 'flex';
}

function editMantenimiento(id) {
    const maint = mantenimientos.find(m => m.id === id);
    if (!maint) return;

    currentMaintId = id;
    document.getElementById('modalTitle').textContent = '✏️ Editar Mantenimiento';
    document.getElementById('tarea_nombre').value = maint.tarea_nombre;
    document.getElementById('descripcion').value = maint.descripcion || '';
    document.getElementById('frecuencia_dias').value = maint.frecuencia_dias;
    document.getElementById('area_responsable').value = maint.area_responsable;
    document.getElementById('tecnico_responsable_id').value = maint.responsable_id || '';
    document.getElementById('maintModal').style.display = 'flex';
}

function closeMaintModal() {
    document.getElementById('maintModal').style.display = 'none';
    currentMaintId = null;
}

async function saveMaintenance() {
    const form = document.getElementById('maintForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const data = {
        tarea_nombre: document.getElementById('tarea_nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim() || null,
        frecuencia_dias: parseInt(document.getElementById('frecuencia_dias').value),
        area_responsable: document.getElementById('area_responsable').value,
        responsable_id: document.getElementById('tecnico_responsable_id').value || null
    };

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.classList.add('loading');
    saveBtn.textContent = '💾 Guardando...';

    try {
        if (currentMaintId) {
            await HttpClient.put(`/mantenimientos/${currentMaintId}`, data);
            ToastManager.success('Mantenimiento actualizado exitosamente');
        } else {
            await HttpClient.post('/mantenimientos', data);
            ToastManager.success('Mantenimiento creado exitosamente');
        }
        closeMaintModal();
        await loadMantenimientos();
    } catch (error) {
        console.error('Error saving maintenance:', error);
        ToastManager.error(error.message || 'Error al guardar mantenimiento');
    } finally {
        saveBtn.classList.remove('loading');
        saveBtn.textContent = '💾 Guardar';
    }
}

async function executeMantenimiento(id) {
    const maint = mantenimientos.find(m => m.id === id);
    if (!maint) return;

    showConfirmModal('✅ Ejecutar Mantenimiento', `¿Confirma que se ejecutó el mantenimiento "${maint.tarea_nombre}"?<br><small>Se actualizará la fecha de próxima ejecución.</small>`, async () => {
        try {
            await HttpClient.put(`/mantenimientos/${id}/ejecutar`);
            ToastManager.success('Mantenimiento marcado como ejecutado');
            await loadMantenimientos();
        } catch (error) {
            console.error('Error executing maintenance:', error);
            ToastManager.error('Error al ejecutar mantenimiento');
        }
    });
}

async function toggleStatus(id) {
    const maint = mantenimientos.find(m => m.id === id);
    if (!maint) return;

    const newStatus = maint.estado === 'inactivo';
    const action = newStatus ? 'activar' : 'desactivar';

    showConfirmModal(`${newStatus ? '🟢' : '🔴'} ${newStatus ? 'Activar' : 'Desactivar'} Mantenimiento`, `¿Está seguro de ${action} el mantenimiento "${maint.tarea_nombre}"?`, async () => {
        try {
            await HttpClient.put(`/mantenimientos/${id}/estado`, { estado: newStatus ? 'activo' : 'inactivo' });
            ToastManager.success(`Mantenimiento ${newStatus ? 'activado' : 'desactivado'} exitosamente`);
            await loadMantenimientos();
        } catch (error) {
            console.error('Error updating status:', error);
            ToastManager.error('Error al actualizar estado');
        }
    });
}

function showConfirmModal(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').innerHTML = message;
    confirmCallback = callback;
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    confirmCallback = null;
}

function confirmAction() {
    if (confirmCallback) {
        confirmCallback();
        closeConfirmModal();
    }
}
