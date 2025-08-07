      // Theme toggle functionality
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
            
            // Load dashboard data
            loadDashboardData();
        });

async function loadDashboardData() {
    try {
        // Obtener estadísticas del dashboard
        const stats = await HttpClient.get('/dashboard/stats');

        document.getElementById('pendingTasks').textContent = stats.pendingTasks || '0';
        document.getElementById('completedTasks').textContent = stats.completedTasks || '0';
        document.getElementById('activeUsers').textContent = stats.activeUsers || '0';
        document.getElementById('openIncidents').textContent = stats.openIncidents || '0';

        await loadRecentActivity();

    } catch (error) {
        console.error('❌ ERROR AL CARGAR STATS:', error);
        ToastManager.error('Error al cargar el dashboard');
    }
}

async function loadRecentActivity() {
    const activityList = document.getElementById('activityList');

    try {
        const activity = await HttpClient.get('/dashboard/activity');
        console.log('📦 Datos recibidos:', activity);

        if (!activity || activity.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state">
                    <p>📭 No hay actividad reciente</p>
                </div>
            `;
            return;
        }

        activityList.innerHTML = activity.map(item => {
            const tipo = item.type || 'actividad';
            const usuario = item.nombre_completo || item.usuario || 'Sistema';
            const ubicacion = item.ubicacion || 'Ubicación no registrada';
            const fallas = item.tipo_dano || 'Sin fallas registradas';
            const prioridad = item.prioridad || 'Sin prioridad';
            const descripcion = item.descripcion || 'Sin descripción';
            const fecha = formatDateTime(item.created_at);
            const icono = getActivityIcon(tipo);

            let contenido = '';

            if (tipo.toLowerCase() === 'incidencia') {
                contenido = `
                    <p><strong>📌 Reportada por:</strong> ${usuario}</p>
                    <p><strong>📍 Ubicación:</strong> ${ubicacion}</p>
                    <p><strong>⚙️ Fallas:</strong> ${fallas}</p>
                    <p><strong>📝 Prioridad:</strong> ${prioridad}</p>
                    <p><strong>📄 Descripción:</strong> ${descripcion}</p>
                `;
            } else {
                contenido = `<p><strong>${tipo}:</strong> ${descripcion}</p>`;
            }

            return `
                <div class="activity-item">
                    <div class="activity-icon">${icono}</div>
                    <div class="activity-content">
                        ${contenido}
                        <small class="activity-time">${fecha}</small>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('❌ Error al cargar actividad:', error);
        activityList.innerHTML = `
            <div class="empty-state">
                <p>❌ Error al cargar actividad</p>
            </div>
        `;
    }
}

// Icono según el tipo
function getActivityIcon(type) {
    if (!type) return '📌';
    const normalized = type.toLowerCase();
    if (normalized.includes('tarea')) return '🛠️';
    if (normalized.includes('incidencia')) return '⚠️';
    if (normalized.includes('evaluacion')) return '📋';
    return '📌';
}

// Formato fecha y hora
function formatDateTime(datetime) {
    const date = new Date(datetime);
    return date.toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}


        function refreshActivity() {
            loadRecentActivity();
            ToastManager.success('Actividad actualizada');
        }

        function showProfile() {
            ToastManager.info('Funcionalidad de perfil en desarrollo');
        }