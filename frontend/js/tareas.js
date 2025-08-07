let tareas = [];
let historial = [];
let tecnicos = [];
let incidenciasSinTarea = [];
let filteredTareas = [];
let filteredHistorial = [];
let currentTareaId = null;
let currentTab = 'activas';

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    setupEventListeners();
    loadInitialData();
});

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    document.querySelector('.theme-toggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.querySelector('.theme-toggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function setupEventListeners() {
    // Filtros para tareas activas
    document.getElementById('searchInput')?.addEventListener('input', filterTareas);
    document.getElementById('estadoFilter')?.addEventListener('change', filterTareas);
    document.getElementById('tecnicoFilter')?.addEventListener('change', filterTareas);
    
    // Filtros para historial
    document.getElementById('searchHistorial')?.addEventListener('input', filterHistorial);
    document.getElementById('tecnicoHistorialFilter')?.addEventListener('change', filterHistorial);
    document.getElementById('fechaInicioFilter')?.addEventListener('change', filterHistorial);
    document.getElementById('fechaFinFilter')?.addEventListener('change', filterHistorial);
}

async function loadInitialData() {
    try {
        await Promise.all([
            loadTareas(),
            loadTecnicos(),
            loadIncidenciasSinTarea()
        ]);
        
        if (currentTab === 'historial') {
            await loadHistorial();
        }
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        ToastManager.error('Error al cargar datos del sistema');
    }
}

async function loadTareas() {
    try {
        const userRole = UserManager.getRole();
        const userId = UserManager.getId();
        
        const data = await HttpClient.get('/tareas');
        
        // Filtrar según rol
        if (userRole === 'tecnico') {
            tareas = data.filter(t => t.tecnico_id === parseInt(userId));
        } else {
            tareas = data;
        }
        
        filteredTareas = [...tareas];
        renderTareas();
        updateTaskCount();
        loadTecnicoFilter();
    } catch (error) {
        console.error('Error al cargar tareas:', error);
        ToastManager.error('Error al cargar tareas');
        showEmptyState('tareasTableBody', '❌ Error al cargar tareas');
    }
}

async function loadHistorial() {
    try {
        const userRole = UserManager.getRole();
        const userId = UserManager.getId();
        
        const params = userRole === 'tecnico' ? { tecnico_id: userId } : {};
        
        const queryString = new URLSearchParams(params).toString();
        const data = await HttpClient.get(`/tareas/historial${queryString ? '?' + queryString : ''}`);
        
        historial = data;
        filteredHistorial = [...historial];
        renderHistorial();
        updateHistorialCount();
        loadTecnicoHistorialFilter();
    } catch (error) {
        console.error('Error al cargar historial:', error);
        ToastManager.error('Error al cargar historial');
        showEmptyState('historialTableBody', '❌ Error al cargar historial');
    }
}

async function loadTecnicos() {
    try {
        const data = await HttpClient.get('/tecnicos'); // ✅ usa la ruta correcta
        tecnicos = data;

        const tecnicoSelect = document.getElementById('tecnicoSelect');
        const tecnicoFilter = document.getElementById('tecnicoFilter');

        if (tecnicoSelect) {
            tecnicoSelect.innerHTML = '<option value="">Seleccionar técnico</option>' +
                tecnicos.map(t => `<option value="${t.id}">${t.nombre_completo}</option>`).join('');
        }

        if (tecnicoFilter) {
            tecnicoFilter.innerHTML = '<option value="">Todos los técnicos</option>' +
                tecnicos.map(t => `<option value="${t.id}">${t.nombre_completo}</option>`).join('');
        }
    } catch (error) {
        console.error('Error al cargar técnicos:', error);
    }
}



async function loadIncidenciasSinTarea() {
    try {
        const data = await HttpClient.get('/incidencias');
        // Filtrar incidencias sin tarea asignada
        incidenciasSinTarea = data.filter(inc => !tareas.find(t => t.incidencia_id === inc.id));

        const incidenciaSelect = document.getElementById('incidenciaSelect');
        if (incidenciaSelect) {
            incidenciaSelect.innerHTML = '<option value="">Seleccionar incidencia</option>' +
                incidenciasSinTarea.map(inc =>
                    `<option value="${inc.id}">#${inc.id} - ${inc.nombre_ubicacion} - ${inc.tipo_dano}</option>`
                ).join('');
            
            // Limpiar campos de descripción y fallas al cargar
            document.getElementById('descripcionIncidencia').value = '';
            document.getElementById('fallasReportadas').value = '';

            incidenciaSelect.onchange = () => {
                const selectedId = incidenciaSelect.value;
                const incidencia = incidenciasSinTarea.find(i => i.id == selectedId);
                if (incidencia) {
                    document.getElementById('descripcionIncidencia').value = incidencia.descripcion || '';
                    document.getElementById('fallasReportadas').value = incidencia.tipo_dano || '';
                } else {
                    document.getElementById('descripcionIncidencia').value = '';
                    document.getElementById('fallasReportadas').value = '';
                }
            };
        }
    } catch (error) {
        console.error('Error al cargar incidencias:', error);
    }
}
function renderTareas() {
    const tbody = document.getElementById('tareasTableBody');
    
    if (filteredTareas.length === 0) {
        showEmptyState(tbody, '📭 No hay tareas registradas');
        return;
    }
    
    const userRole = UserManager.getRole();
    
    tbody.innerHTML = filteredTareas.map(tarea => {
        const estadoBadge = getEstadoBadge(tarea.estado);
        const prioridadBadge = getPrioridadBadge(tarea.prioridad);
        const fechaLimite = formatFechaLimite(tarea.fecha_limite);
        const actionButtons = getActionButtons(tarea, userRole);
        
        return `
            <tr data-tarea-id="${tarea.id}" data-estado="${tarea.estado}" data-prioridad="${tarea.prioridad}">
                <td>#${tarea.id}</td>
                <td>${tarea.ubicacion_nombre}</td>
                <td>${tarea.tipo_dano}</td>
                <td>${tarea.tecnico_nombre}</td>
                <td>${estadoBadge}</td>
                <td>${prioridadBadge}</td>
                <td>${fechaLimite}</td>
                <td class="description-cell" title="${tarea.descripcion}">${UIUtils.truncateText(tarea.descripcion, 40)}</td>
                <td class="actions-col">${actionButtons}</td>
            </tr>
        `;
    }).join('');
}

function renderHistorial() {
    const tbody = document.getElementById('historialTableBody');
    
    if (filteredHistorial.length === 0) {
        showEmptyState(tbody, '📭 No hay registros en el historial');
        return;
    }
    
    tbody.innerHTML = filteredHistorial.map(registro => {
        const tiempoTotal = registro.tiempo_total_horas ? 
            `${parseFloat(registro.tiempo_total_horas).toFixed(1)}h` : 'N/A';
        
        return `
            <tr data-historial-id="${registro.id}">
                <td>#${registro.tarea_id_original}</td>
                <td>${registro.ubicacion_nombre}</td>
                <td>${registro.tipo_dano}</td>
                <td>${registro.tecnico_nombre}</td>
                <td>${tiempoTotal}</td>
                <td>${UIUtils.formatDateTime(registro.fecha_completada)}</td>
                <td class="description-cell" title="${registro.acciones_realizadas}">
                    ${UIUtils.truncateText(registro.acciones_realizadas, 40)}
                </td>
                <td class="actions-col">
                    <button class="btn-action btn-view" onclick="viewHistorialDetails(${registro.id})" title="Ver detalles">👁️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function getEstadoBadge(estado) {
    const badges = {
        'pendiente': '<span class="status-badge badge-pending">🔴 Pendiente</span>',
        'en_progreso': '<span class="status-badge badge-in-progress">🟡 En Progreso</span>',
        'completada': '<span class="status-badge badge-completed">🟢 Completada</span>'
    };
    return badges[estado] || estado;
}

function getPrioridadBadge(prioridad) {
    const badges = {
        'baja': '<span class="status-badge badge-low">🟢 Baja</span>',
        'media': '<span class="status-badge badge-medium">🟡 Media</span>',
        'alta': '<span class="status-badge badge-high">🔴 Alta</span>'
    };
    return badges[prioridad] || prioridad;
}

function formatFechaLimite(fechaLimite) {
    const fecha = new Date(fechaLimite);
    const now = new Date();
    const diffHours = (fecha - now) / (1000 * 60 * 60);
    
    let className = '';
    let icon = '📅';
    
    if (diffHours < 0) {
        className = 'text-error';
        icon = '⏰';
    } else if (diffHours <= 24) {
        className = 'text-warning';
        icon = '⚠️';
    }
    
    return `<span class="${className}">${icon} ${UIUtils.formatDateTime(fechaLimite)}</span>`;
}

function getActionButtons(tarea, userRole) {
    const userId = UserManager.getId();
    const canUpdate = userRole === 'tecnico' ? tarea.tecnico_id === parseInt(userId) : ['rector', 'supervisor'].includes(userRole);
    const canDelete = ['rector', 'supervisor'].includes(userRole);
    
    let buttons = '';
    
    if (canUpdate) {
        buttons += `<button class="btn-action btn-status" onclick="showUpdateModal(${tarea.id})" title="Actualizar">✏️</button>`;
    }
    
    if (canDelete) {
        buttons += `<button class="btn-action btn-delete" onclick="confirmDelete(${tarea.id})" title="Eliminar">🗑️</button>`;
    }
    
    return buttons;
}

function filterTareas() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const estadoFilter = document.getElementById('estadoFilter')?.value || '';
    const tecnicoFilter = document.getElementById('tecnicoFilter')?.value || '';
    
    filteredTareas = tareas.filter(tarea => {
        const matchesSearch = tarea.descripcion.toLowerCase().includes(searchTerm) ||
                            tarea.tipo_dano.toLowerCase().includes(searchTerm) ||
                            tarea.ubicacion_nombre.toLowerCase().includes(searchTerm) ||
                            tarea.tecnico_nombre.toLowerCase().includes(searchTerm);
        
        const matchesEstado = !estadoFilter || tarea.estado === estadoFilter;
        const matchesTecnico = !tecnicoFilter || tarea.tecnico_id === parseInt(tecnicoFilter);
        
        return matchesSearch && matchesEstado && matchesTecnico;
    });
    
    renderTareas();
    updateTaskCount();
}

function filterHistorial() {
    const searchTerm = document.getElementById('searchHistorial')?.value.toLowerCase() || '';
    const tecnicoFilter = document.getElementById('tecnicoHistorialFilter')?.value || '';
    const fechaInicio = document.getElementById('fechaInicioFilter')?.value || '';
    const fechaFin = document.getElementById('fechaFinFilter')?.value || '';
    
    filteredHistorial = historial.filter(registro => {
        const matchesSearch = registro.descripcion.toLowerCase().includes(searchTerm) ||
                            registro.acciones_realizadas.toLowerCase().includes(searchTerm) ||
                            registro.ubicacion_nombre.toLowerCase().includes(searchTerm);
        
        const matchesTecnico = !tecnicoFilter || registro.tecnico_id === parseInt(tecnicoFilter);
        
        let matchesFecha = true;
        if (fechaInicio || fechaFin) {
            const fechaCompletada = new Date(registro.fecha_completada).toISOString().split('T')[0];
            matchesFecha = (!fechaInicio || fechaCompletada >= fechaInicio) &&
                         (!fechaFin || fechaCompletada <= fechaFin);
        }
        
        return matchesSearch && matchesTecnico && matchesFecha;
    });
    
    renderHistorial();
    updateHistorialCount();
}

function loadTecnicoFilter() {
    const tecnicosUnicos = [...new Set(tareas.map(t => ({ id: t.tecnico_id, nombre: t.tecnico_nombre })))];
    const tecnicoFilter = document.getElementById('tecnicoFilter');
    
    if (tecnicoFilter) {
        tecnicoFilter.innerHTML = '<option value="">Todos los técnicos</option>' +
            tecnicosUnicos.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('');
    }
}

function loadTecnicoHistorialFilter() {
    const tecnicosUnicos = [...new Set(historial.map(h => ({ id: h.tecnico_id, nombre: h.tecnico_nombre })))];
    const tecnicoHistorialFilter = document.getElementById('tecnicoHistorialFilter');
    
    if (tecnicoHistorialFilter) {
        tecnicoHistorialFilter.innerHTML = '<option value="">Todos los técnicos</option>' +
            tecnicosUnicos.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('');
    }
}

function updateTaskCount() {
    const count = filteredTareas.length;
    const total = tareas.length;
    const taskCount = document.getElementById('taskCount');
    if (taskCount) {
        taskCount.textContent = count === total ? `${count} tareas` : `${count} de ${total} tareas`;
    }
}

function updateHistorialCount() {
    const count = filteredHistorial.length;
    const total = historial.length;
    const historialCount = document.getElementById('historialCount');
    if (historialCount) {
        historialCount.textContent = count === total ? `${count} registros` : `${count} de ${total} registros`;
    }
}

function switchTab(tab) {
    currentTab = tab;
    
    // Actualizar botones de tab
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
    
    // Mostrar/ocultar contenido
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}Content`).classList.add('active');
    
    // Cargar datos si es necesario
    if (tab === 'historial' && historial.length === 0) {
        loadHistorial();
    }
}

function showCreateModal() {
    currentTareaId = null;
    document.getElementById('modalTitle').textContent = '➕ Nueva Tarea';
    document.getElementById('tareaForm').reset();
    
    // Configurar fecha mínima (ahora)
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('fechaLimite').min = now.toISOString().slice(0, 16);
    
    document.getElementById('tareaModal').style.display = 'flex';
}

function showUpdateModal(tareaId) {
    const tarea = tareas.find(t => t.id === tareaId);
    if (!tarea) return;
    
    currentTareaId = tareaId;
    
    // Mostrar detalles de la tarea
    document.getElementById('tareaDetails').innerHTML = `
        <div class="tarea-info-card">
            <h4>📋 Información de la Tarea</h4>
            <p><strong>ID:</strong> #${tarea.id}</p>
            <p><strong>Ubicación:</strong> ${tarea.ubicacion_nombre}</p>
            <p><strong>Tipo de Daño:</strong> ${tarea.tipo_dano}</p>
            <p><strong>Descripción:</strong> ${tarea.descripcion}</p>
            <p><strong>Fecha Límite:</strong> ${UIUtils.formatDateTime(tarea.fecha_limite)}</p>
            <p><strong>Asignado:</strong> ${UIUtils.formatDateTime(tarea.fecha_asignacion)}</p>
            ${tarea.fecha_inicio ? `<p><strong>Iniciado:</strong> ${UIUtils.formatDateTime(tarea.fecha_inicio)}</p>` : ''}
        </div>
    `;
    
    // Configurar formulario
    document.getElementById('estadoUpdate').value = tarea.estado;
    document.getElementById('accionesUpdate').value = tarea.acciones_realizadas || '';
    document.getElementById('observacionesUpdate').value = tarea.observaciones || '';
    
    document.getElementById('updateModal').style.display = 'flex';
}

function hideModal() {
    document.getElementById('tareaModal').style.display = 'none';
    currentTareaId = null;
}

function hideUpdateModal() {
    document.getElementById('updateModal').style.display = 'none';
    currentTareaId = null;
}

async function saveTarea() {
    try {
        const incidencia_id = document.getElementById('incidenciaSelect').value;
        const tecnico_id = document.getElementById('tecnicoSelect').value;
        const fecha_limite = document.getElementById('fechaLimite').value;
        const descripcion = document.getElementById('descripcion').value;
        const fallas_reportadas = document.getElementById('fallasReportadas').value;

        const usuario = JSON.parse(localStorage.getItem('usuario'));

        if (!usuario?.id) {
            console.error('Usuario no encontrado en localStorage');
            return;
        }

        const data = {
            incidencia_id,
            tecnico_id,
            supervisor_id: usuario.id,    // 👈 Este campo es obligatorio
            reportado_por: usuario.id,    // 👈 También obligatorio
            fecha_limite,
            descripcion,
            fallas_reportadas
        };

        await HttpClient.post('/tareas', data);
        hideModal('modalTarea');
        await loadTareas();
    } catch (error) {
        console.error('Error al crear tarea:', error);
    }
}


async function updateTarea() {
    if (!currentTareaId) return;
    
    const updateBtn = document.getElementById('updateBtn');
    UIUtils.setLoading(updateBtn, true);
    
    const updateData = {
        estado: document.getElementById('estadoUpdate').value,
        acciones_realizadas: document.getElementById('accionesUpdate').value.trim(),
        observaciones: document.getElementById('observacionesUpdate').value.trim()
    };
    
    try {
        await HttpClient.put(`/tareas/${currentTareaId}`, updateData);
        ToastManager.success('Tarea actualizada exitosamente');
        hideUpdateModal();
        loadTareas();
        
        // Si se completó, recargar historial si está visible
        if (updateData.estado === 'completada' && currentTab === 'historial') {
            loadHistorial();
        }
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        ToastManager.error(error.message || 'Error al actualizar tarea');
    } finally {
        UIUtils.setLoading(updateBtn, false);
    }
}

function confirmDelete(tareaId) {
    currentTareaId = tareaId;
    document.getElementById('confirmMessage').textContent = '¿Está seguro que desea eliminar esta tarea?';
    document.getElementById('confirmModal').style.display = 'flex';
    document.getElementById('confirmBtn').onclick = () => deleteTarea(tareaId);
}

function hideConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    currentTareaId = null;
}

async function deleteTarea(tareaId) {
    const confirmBtn = document.getElementById('confirmBtn');
    UIUtils.setLoading(confirmBtn, true);
    
    try {
        await HttpClient.delete(`/tareas/${tareaId}`);
        ToastManager.success('Tarea eliminada exitosamente');
        hideConfirmModal();
        loadTareas();
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        ToastManager.error(error.message || 'Error al eliminar tarea');
    } finally {
        UIUtils.setLoading(confirmBtn, false);
    }
}

function viewHistorialDetails(historialId) {
    const registro = historial.find(h => h.id === historialId);
    if (!registro) return;
    
    const details = `
        <div class="historial-details">
            <h4>📜 Detalles del Historial</h4>
            <p><strong>ID Tarea Original:</strong> #${registro.tarea_id_original}</p>
            <p><strong>Ubicación:</strong> ${registro.ubicacion_nombre}</p>
            <p><strong>Tipo de Daño:</strong> ${registro.tipo_dano}</p>
            <p><strong>Técnico:</strong> ${registro.tecnico_nombre}</p>
            <p><strong>Descripción:</strong> ${registro.descripcion}</p>
            <p><strong>Acciones Realizadas:</strong> ${registro.acciones_realizadas}</p>
            <p><strong>Fecha Asignación:</strong> ${UIUtils.formatDateTime(registro.fecha_asignacion)}</p>
            ${registro.fecha_inicio ? `<p><strong>Fecha Inicio:</strong> ${UIUtils.formatDateTime(registro.fecha_inicio)}</p>` : ''}
            <p><strong>Fecha Completada:</strong> ${UIUtils.formatDateTime(registro.fecha_completada)}</p>
            <p><strong>Tiempo Total:</strong> ${registro.tiempo_total_horas ? parseFloat(registro.tiempo_total_horas).toFixed(1) + ' horas' : 'N/A'}</p>
            ${registro.observaciones ? `<p><strong>Observaciones:</strong> ${registro.observaciones}</p>` : ''}
        </div>
    `;
    
    // Mostrar en modal
    document.getElementById('tareaDetails').innerHTML = details;
    document.getElementById('updateForm').style.display = 'none';
    document.querySelector('#updateModal .modal-header h3').textContent = '📜 Detalles del Historial';
    document.querySelector('#updateModal .modal-footer').innerHTML = '<button type="button" class="btn btn-secondary" onclick="hideUpdateModal()">Cerrar</button>';
    document.getElementById('updateModal').style.display = 'flex';
}

function showEmptyState(container, message) {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    if (container) {
        container.innerHTML = `<tr><td colspan="9" class="empty-state"><p>${message}</p></td></tr>`;
    }
}

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    const modals = ['tareaModal', 'updateModal', 'confirmModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.style.display = 'none';
            currentTareaId = null;
        }
    });
};