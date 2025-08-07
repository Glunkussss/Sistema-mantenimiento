// Estado global
let solicitudesData = [];
let solicitudSeleccionada = null;
let tecnicos = [];
let ubicaciones = [];

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    document.querySelector('.theme-toggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    
    await inicializarPagina();
    configurarEventListeners();
});

// Función principal de inicialización
async function inicializarPagina() {
    try {
        await Promise.all([
            cargarSolicitudes(),
            cargarTecnicos(),
            cargarUbicaciones()
        ]);
        actualizarEstadisticas();
    } catch (error) {
        console.error('❌ Error al inicializar página:', error);
        ToastManager.error('Error al cargar los datos');
    }
}

// Configurar event listeners
function configurarEventListeners() {
    // Búsqueda en tiempo real
    document.getElementById('searchInput').addEventListener('input', filtrarSolicitudes);
    
    // Filtros
    document.getElementById('estadoFilter').addEventListener('change', filtrarSolicitudes);
    document.getElementById('tipoFilter').addEventListener('change', filtrarSolicitudes);
    
    // Cerrar modales al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            cerrarModales();
        }
    });
}

// Cargar solicitudes desde el servidor
async function cargarSolicitudes() {
    try {
        const response = await HttpClient.get('/solicitudes');
        solicitudesData = response || [];
        renderizarSolicitudes(solicitudesData);
        actualizarContador(solicitudesData.length);
    } catch (error) {
        console.error('❌ Error al cargar solicitudes:', error);
        mostrarEstadoVacio('❌ Error al cargar solicitudes');
        ToastManager.error('Error al cargar las solicitudes');
    }
}

// Cargar técnicos disponibles
async function cargarTecnicos() {
    try {
        const response = await HttpClient.get('/usuarios?role=tecnico');
        tecnicos = response || [];
        
        // Llenar select de técnicos
        const selectTecnico = document.getElementById('tecnico_asignado');
        selectTecnico.innerHTML = '<option value="">Sin asignar</option>';
        
        tecnicos.forEach(tecnico => {
            const option = document.createElement('option');
            option.value = tecnico.id;
            option.textContent = `👨‍🔧 ${tecnico.nombre_completo}`;
            selectTecnico.appendChild(option);
        });
    } catch (error) {
        console.error('❌ Error al cargar técnicos:', error);
    }
}

// Cargar ubicaciones disponibles
async function cargarUbicaciones() {
    try {
        const response = await HttpClient.get('/ubicaciones');
        ubicaciones = response || [];
        
        // Llenar select de ubicaciones
        const selectUbicacion = document.getElementById('ubicacion_id');
        selectUbicacion.innerHTML = '<option value="">Seleccione una ubicación</option>';
        
        ubicaciones.forEach(ubicacion => {
            const option = document.createElement('option');
            option.value = ubicacion.id;
            option.textContent = `📍 ${ubicacion.nombre_ubicacion}`;
            selectUbicacion.appendChild(option);
        });
    } catch (error) {
        console.error('❌ Error al cargar ubicaciones:', error);
    }
}

// Renderizar tabla de solicitudes
function renderizarSolicitudes(solicitudes) {
    const tbody = document.getElementById('solicitudesTableBody');
    
    if (!solicitudes || solicitudes.length === 0) {
        mostrarEstadoVacio('📭 No hay solicitudes registradas');
        return;
    }
    
    tbody.innerHTML = solicitudes.map(solicitud => `
        <tr>
            <td><strong>#${solicitud.id}</strong></td>
            <td>
                <div class="user-info">
                    <strong>${solicitud.solicitante}</strong>
                </div>
            </td>
            <td>${solicitud.descripcion}</td>
            <td>📍 ${solicitud.nombre_ubicacion || 'Sin ubicación'}</td>
            <td>
                <span class="status-badge ${getTipoBadgeClass(solicitud.tipo_solicitud)}">
                    ${getTipoIcon(solicitud.tipo_solicitud)} ${solicitud.tipo_solicitud}
                </span>
            </td>
            <td>
                <span class="status-badge ${getEstadoBadgeClass(solicitud.estado)}">
                    ${getEstadoIcon(solicitud.estado)} ${solicitud.estado}
                </span>
            </td>
            <td>
                ${solicitud.tecnico_asignado ? 
                    `👨‍🔧 ${solicitud.tecnico_asignado}` : 
                    '<span style="color: var(--text-secondary);">Sin asignar</span>'
                }
            </td>
            <td>${formatearFecha(solicitud.fecha_solicitud)}</td>
            <td class="actions-col">
                <button class="action-btn edit-btn" onclick="asignarTecnico(${solicitud.id})" title="Asignar técnico">
                    👥
                </button>
                <button class="action-btn btn-status" onclick="cambiarEstado(${solicitud.id})" title="Cambiar estado">
                    🔄
                </button>
                <button class="action-btn delete-btn" onclick="verDetalle(${solicitud.id})" title="Ver detalle">
                    👁️
                </button>
            </td>
        </tr>
    `).join('');
}

// Filtrar solicitudes
function filtrarSolicitudes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const estadoFilter = document.getElementById('estadoFilter').value;
    const tipoFilter = document.getElementById('tipoFilter').value;
    
    let solicitudesFiltradas = solicitudesData.filter(solicitud => {
        const matchSearch = !searchTerm || 
            solicitud.solicitante.toLowerCase().includes(searchTerm) ||
            solicitud.descripcion.toLowerCase().includes(searchTerm) ||
            (solicitud.nombre_ubicacion && solicitud.nombre_ubicacion.toLowerCase().includes(searchTerm));
        
        const matchEstado = !estadoFilter || solicitud.estado === estadoFilter;
        const matchTipo = !tipoFilter || solicitud.tipo_solicitud === tipoFilter;
        
        return matchSearch && matchEstado && matchTipo;
    });
    
    renderizarSolicitudes(solicitudesFiltradas);
    actualizarContador(solicitudesFiltradas.length);
}

// Actualizar estadísticas
function actualizarEstadisticas() {
    const total = solicitudesData.length;
    const enProceso = solicitudesData.filter(s => s.estado === 'procesando').length;
    const completadas = solicitudesData.filter(s => s.estado === 'completada').length;
    const sinAsignar = solicitudesData.filter(s => !s.asignado_a).length;
    
    document.getElementById('totalSolicitudes').textContent = total;
    document.getElementById('solicitudesProceso').textContent = enProceso;
    document.getElementById('solicitudesCompletadas').textContent = completadas;
    document.getElementById('solicitudesSinAsignar').textContent = sinAsignar;
}

// Actualizar contador
function actualizarContador(count) {
    document.getElementById('solicitudesCount').textContent = 
        `${count} ${count === 1 ? 'solicitud' : 'solicitudes'}`;
}

// Mostrar estado vacío
function mostrarEstadoVacio(mensaje) {
    const tbody = document.getElementById('solicitudesTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="9">
                <div class="empty-state">
                    <p>${mensaje}</p>
                </div>
            </td>
        </tr>
    `;
}

// Nueva solicitud
function nuevaSolicitud() {
    document.getElementById('modalTitle').textContent = '📨 Nueva Solicitud';
    document.getElementById('solicitudForm').reset();
    solicitudSeleccionada = null;
    mostrarModal('solicitudModal');
}

// Guardar solicitud
async function guardarSolicitud() {
    const form = document.getElementById('solicitudForm');
    const formData = new FormData(form);
    
    const solicitudData = {
        solicitante: formData.get('solicitante'),
        descripcion: formData.get('descripcion'),
        ubicacion_id: formData.get('ubicacion_id'),
        tipo_solicitud: formData.get('tipo_solicitud')
    };
    
    // Validar campos requeridos
    if (!solicitudData.solicitante || !solicitudData.descripcion || 
        !solicitudData.ubicacion_id || !solicitudData.tipo_solicitud) {
        ToastManager.error('Por favor complete todos los campos obligatorios');
        return;
    }
    
    try {
        if (solicitudSeleccionada) {
            // Actualizar solicitud existente
            await HttpClient.put(`/solicitudes/${solicitudSeleccionada.id}`, solicitudData);
            ToastManager.success('Solicitud actualizada correctamente');
        } else {
            // Crear nueva solicitud
            await HttpClient.post('/solicitudes', solicitudData);
            ToastManager.success('Solicitud creada correctamente');
        }
        
        cerrarModal();
        await cargarSolicitudes();
        actualizarEstadisticas();
        
    } catch (error) {
        console.error('❌ Error al guardar solicitud:', error);
        ToastManager.error('Error al guardar la solicitud');
    }
}

// Asignar técnico
function asignarTecnico(solicitudId) {
    solicitudSeleccionada = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitudSeleccionada) return;
    
    document.getElementById('solicitudInfo').textContent = 
        `#${solicitudSeleccionada.id} - ${solicitudSeleccionada.solicitante}`;
    
    // Preseleccionar técnico actual si existe
    document.getElementById('tecnico_asignado').value = solicitudSeleccionada.asignado_a || '';
    
    mostrarModal('asignarModal');
}

// Confirmar asignación
async function confirmarAsignacion() {
    if (!solicitudSeleccionada) return;
    
    const tecnicoId = document.getElementById('tecnico_asignado').value;
    
    try {
        await HttpClient.put(`/solicitudes/${solicitudSeleccionada.id}/asignar`, {
            asignado_a: tecnicoId || null
        });
        
        ToastManager.success('Técnico asignado correctamente');
        cerrarAsignarModal();
        await cargarSolicitudes();
        actualizarEstadisticas();
        
    } catch (error) {
        console.error('❌ Error al asignar técnico:', error);
        ToastManager.error('Error al asignar técnico');
    }
}

// Cambiar estado
function cambiarEstado(solicitudId) {
    solicitudSeleccionada = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitudSeleccionada) return;
    
    document.getElementById('estadoSolicitudInfo').textContent = 
        `#${solicitudSeleccionada.id} - ${solicitudSeleccionada.solicitante}`;
    
    // Preseleccionar estado actual
    document.getElementById('nuevo_estado').value = solicitudSeleccionada.estado;
    
    mostrarModal('estadoModal');
}

// Confirmar cambio de estado
async function confirmarCambioEstado() {
    if (!solicitudSeleccionada) return;
    
    const nuevoEstado = document.getElementById('nuevo_estado').value;
    
    try {
        await HttpClient.put(`/solicitudes/${solicitudSeleccionada.id}/estado`, {
            estado: nuevoEstado
        });
        
        ToastManager.success('Estado actualizado correctamente');
        cerrarEstadoModal();
        await cargarSolicitudes();
        actualizarEstadisticas();
        
    } catch (error) {
        console.error('❌ Error al cambiar estado:', error);
        ToastManager.error('Error al cambiar estado');
    }
}

// Ver detalle de solicitud
function verDetalle(solicitudId) {
    const solicitud = solicitudesData.find(s => s.id === solicitudId);
    if (!solicitud) return;
    
    const detalles = `
📋 DETALLE DE SOLICITUD #${solicitud.id}

👤 Solicitante: ${solicitud.solicitante}
📝 Descripción: ${solicitud.descripcion}
📍 Ubicación: ${solicitud.nombre_ubicacion}
🔧 Tipo: ${solicitud.tipo_solicitud}
📊 Estado: ${solicitud.estado}
👨‍🔧 Técnico: ${solicitud.tecnico_asignado || 'Sin asignar'}
📅 Fecha: ${formatearFecha(solicitud.fecha_solicitud)}
    `;
    
    alert(detalles);
}

// Funciones de utilidad
function getTipoIcon(tipo) {
    const iconos = {
        'mantenimiento': '🔧',
        'reparacion': '⚙️',
        'limpieza': '🧹',
        'otro': '📋'
    };
    return iconos[tipo] || '📋';
}

function getTipoBadgeClass(tipo) {
    return `tipo-${tipo}`;
}

function getEstadoIcon(estado) {
    const iconos = {
        'recibida': '📨',
        'procesando': '⏳',
        'completada': '✅',
        'cancelada': '❌'
    };
    return iconos[estado] || '📋';
}

function getEstadoBadgeClass(estado) {
    return estado === 'completada' ? 'status-active' : 
           estado === 'cancelada' ? 'status-inactive' : 
           'status-badge';
}

function formatearFecha(fecha) {
    if (!fecha) return 'Sin fecha';
    
    const date = new Date(fecha);
    const options = {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleString('es-CO', options);
}

// Funciones de modal
function mostrarModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    document.getElementById('solicitudModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function cerrarAsignarModal() {
    document.getElementById('asignarModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function cerrarEstadoModal() {
    document.getElementById('estadoModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function cerrarModales() {
    cerrarModal();
    cerrarAsignarModal();
    cerrarEstadoModal();
}

// Función de toggle de tema (desde index.html)
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    document.querySelector('.theme-toggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}