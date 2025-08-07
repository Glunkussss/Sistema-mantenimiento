let evaluaciones = [];
let tecnicos = [];
let currentEvaluationId = null;
let deleteEvaluationId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    document.querySelector('.theme-toggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    
    await loadData();
});

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    document.querySelector('.theme-toggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

async function loadData() {
    try {
        showLoading();
        await Promise.all([loadTechnicians(), loadEvaluations()]);
        updateStats();
    } catch (error) {
        console.error('Error loading data:', error);
        ToastManager.error('Error al cargar los datos');
    }
}

async function loadTechnicians() {
    try {
        const response = await HttpClient.get('/usuarios');
        const usuarios = response.usuarios || response;
        tecnicos = usuarios.filter(u => u.cargo === 'tecnico' && u.estado === 'activo');
        
        populateTechnicianSelects();
    } catch (error) {
        console.error('Error loading technicians:', error);
        ToastManager.error('Error al cargar técnicos');
    }
}

function populateTechnicianSelects() {
    const tecnicoSelect = document.getElementById('tecnico_id');
    const tecnicoFilter = document.getElementById('tecnicoFilter');
    
    tecnicoSelect.innerHTML = '<option value="">Seleccionar técnico...</option>';
    tecnicoFilter.innerHTML = '<option value="">Todos los técnicos</option>';
    
    tecnicos.forEach(tecnico => {
        const option1 = new Option(tecnico.nombre_completo, tecnico.id);
        const option2 = new Option(tecnico.nombre_completo, tecnico.id);
        tecnicoSelect.appendChild(option1);
        tecnicoFilter.appendChild(option2);
    });
}

async function loadEvaluations() {
    try {
        const allEvaluations = [];
        
        for (const tecnico of tecnicos) {
            try {
                const response = await HttpClient.get(`/evaluaciones/tecnico/${tecnico.id}`);
                if (response && Array.isArray(response)) {
                    const evaluationsWithTechnician = response.map(eval => ({
                        ...eval,
                        tecnico_nombre: tecnico.nombre_completo,
                        tecnico_id: tecnico.id
                    }));
                    allEvaluations.push(...evaluationsWithTechnician);
                }
            } catch (error) {
                if (error.message !== 'No se encontraron evaluaciones para este tecnico') {
                    console.error(`Error loading evaluations for technician ${tecnico.id}:`, error);
                }
            }
        }
        
        evaluaciones = allEvaluations.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        renderEvaluations();
    } catch (error) {
        console.error('Error loading evaluations:', error);
        showEmptyState();
    }
}

function renderEvaluations() {
    const tbody = document.getElementById('evaluationsTableBody');
    
    if (evaluaciones.length === 0) {
        showEmptyState();
        return;
    }
    
    tbody.innerHTML = evaluaciones.map(evaluation => `
        <tr>
            <td>#${evaluation.id}</td>
            <td>
                <div class="user-info">
                    <strong>${evaluation.tecnico_nombre}</strong>
                </div>
            </td>
            <td>${evaluation.supervisor}</td>
            <td>
                <div class="score-display">
                    <span class="score-stars">${generateStars(evaluation.puntaje)}</span>
                    <span class="score-number">${evaluation.puntaje}</span>
                </div>
            </td>
            <td>${formatDateTime(evaluation.fecha)}</td>
            <td>
                <div class="observation-cell">
                    ${evaluation.observaciones ? 
                        `<span class="observation-text" title="${evaluation.observaciones}">
                            ${evaluation.observaciones.length > 50 ? 
                                evaluation.observaciones.substring(0, 50) + '...' : 
                                evaluation.observaciones}
                        </span>` : 
                        '<span class="no-observation">Sin observaciones</span>'
                    }
                </div>
            </td>
            <td class="actions-col">
                <button class="action-btn delete-btn" onclick="showDeleteModal(${evaluation.id})" title="Eliminar">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
    
    updateEvaluationCount();
}

function generateStars(score) {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '⭐';
    }
    
    if (hasHalfStar) {
        stars += '✨';
    }
    
    return stars;
}

function showLoading() {
    const tbody = document.getElementById('evaluationsTableBody');
    tbody.innerHTML = `
        <tr class="loading-row">
            <td colspan="7">
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Cargando evaluaciones...</p>
                </div>
            </td>
        </tr>
    `;
}

function showEmptyState() {
    const tbody = document.getElementById('evaluationsTableBody');
    tbody.innerHTML = `
        <tr class="loading-row">
            <td colspan="7">
                <div class="empty-state">
                    <p>📭 No hay evaluaciones registradas</p>
                </div>
            </td>
        </tr>
    `;
    updateEvaluationCount();
}

function updateEvaluationCount() {
    const count = evaluaciones.length;
    document.getElementById('evaluationCount').textContent = `${count} evaluación${count !== 1 ? 'es' : ''}`;
}

function updateStats() {
    const totalEvaluations = evaluaciones.length;
    const averageScore = totalEvaluations > 0 ? 
        (evaluaciones.reduce((sum, eval) => sum + parseFloat(eval.puntaje), 0) / totalEvaluations).toFixed(1) : 
        '0.0';
    
    const uniqueTechnicians = new Set(evaluaciones.map(eval => eval.tecnico_id)).size;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyEvaluations = evaluaciones.filter(eval => {
        const evalDate = new Date(eval.fecha);
        return evalDate.getMonth() === currentMonth && evalDate.getFullYear() === currentYear;
    }).length;
    
    document.getElementById('totalEvaluations').textContent = totalEvaluations;
    document.getElementById('averageScore').textContent = averageScore;
    document.getElementById('evaluatedTechnicians').textContent = uniqueTechnicians;
    document.getElementById('monthlyEvaluations').textContent = monthlyEvaluations;
}

function filterEvaluations() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const tecnicoFilter = document.getElementById('tecnicoFilter').value;
    const puntajeFilter = document.getElementById('puntajeFilter').value;
    
    let filtered = evaluaciones.filter(evaluation => {
        const matchesSearch = !searchTerm || 
            evaluation.tecnico_nombre.toLowerCase().includes(searchTerm) ||
            evaluation.supervisor.toLowerCase().includes(searchTerm) ||
            (evaluation.observaciones && evaluation.observaciones.toLowerCase().includes(searchTerm));
        
        const matchesTecnico = !tecnicoFilter || evaluation.tecnico_id.toString() === tecnicoFilter;
        
        const matchesPuntaje = !puntajeFilter || 
            (puntajeFilter === '5' && evaluation.puntaje >= 5) ||
            (puntajeFilter === '4' && evaluation.puntaje >= 4 && evaluation.puntaje < 5) ||
            (puntajeFilter === '3' && evaluation.puntaje >= 3 && evaluation.puntaje < 4) ||
            (puntajeFilter === '2' && evaluation.puntaje >= 2 && evaluation.puntaje < 3) ||
            (puntajeFilter === '1' && evaluation.puntaje >= 1 && evaluation.puntaje < 2);
        
        return matchesSearch && matchesTecnico && matchesPuntaje;
    });
    
    const tbody = document.getElementById('evaluationsTableBody');
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="7">
                    <div class="empty-state">
                        <p>🔍 No se encontraron evaluaciones que coincidan con los filtros</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filtered.map(evaluation => `
        <tr>
            <td>#${evaluation.id}</td>
            <td>
                <div class="user-info">
                    <strong>${evaluation.tecnico_nombre}</strong>
                </div>
            </td>
            <td>${evaluation.supervisor}</td>
            <td>
                <div class="score-display">
                    <span class="score-stars">${generateStars(evaluation.puntaje)}</span>
                    <span class="score-number">${evaluation.puntaje}</span>
                </div>
            </td>
            <td>${formatDateTime(evaluation.fecha)}</td>
            <td>
                <div class="observation-cell">
                    ${evaluation.observaciones ? 
                        `<span class="observation-text" title="${evaluation.observaciones}">
                            ${evaluation.observaciones.length > 50 ? 
                                evaluation.observaciones.substring(0, 50) + '...' : 
                                evaluation.observaciones}
                        </span>` : 
                        '<span class="no-observation">Sin observaciones</span>'
                    }
                </div>
            </td>
            <td class="actions-col">
                <button class="action-btn delete-btn" onclick="showDeleteModal(${evaluation.id})" title="Eliminar">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

function showNewEvaluationModal() {
    currentEvaluationId = null;
    document.getElementById('modalTitle').textContent = '📝 Nueva Evaluación';
    document.getElementById('saveBtn').textContent = '💾 Guardar';
    
    document.getElementById('evaluationForm').reset();
    document.getElementById('evaluationModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('evaluationModal').style.display = 'none';
    currentEvaluationId = null;
}

async function saveEvaluation() {
    const form = document.getElementById('evaluationForm');
    const formData = new FormData(form);
    
    const evaluationData = {
        tecnico_id: parseInt(formData.get('tecnico_id')),
        puntaje: parseFloat(formData.get('puntaje')),
        observaciones: formData.get('observaciones') || null
    };
    
    if (!evaluationData.tecnico_id || !evaluationData.puntaje) {
        ToastManager.error('Por favor complete todos los campos obligatorios');
        return;
    }
    
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '⏳ Guardando...';
    saveBtn.disabled = true;
    
    try {
        await HttpClient.post('/evaluaciones', evaluationData);
        
        ToastManager.success('Evaluación guardada exitosamente');
        closeModal();
        await loadEvaluations();
        updateStats();
    } catch (error) {
        console.error('Error saving evaluation:', error);
        ToastManager.error('Error al guardar la evaluación');
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

function showDeleteModal(evaluationId) {
    deleteEvaluationId = evaluationId;
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    deleteEvaluationId = null;
}

async function confirmDelete() {
    if (!deleteEvaluationId) return;
    
    const deleteBtn = document.getElementById('confirmDeleteBtn');
    const originalText = deleteBtn.textContent;
    deleteBtn.textContent = '⏳ Eliminando...';
    deleteBtn.disabled = true;
    
    try {
        await HttpClient.delete(`/evaluaciones/${deleteEvaluationId}`);
        
        ToastManager.success('Evaluación eliminada exitosamente');
        closeConfirmModal();
        await loadEvaluations();
        updateStats();
    } catch (error) {
        console.error('Error deleting evaluation:', error);
        ToastManager.error('Error al eliminar la evaluación');
    } finally {
        deleteBtn.textContent = originalText;
        deleteBtn.disabled = false;
    }
}

async function refreshEvaluations() {
    await loadData();
    ToastManager.success('Evaluaciones actualizadas');
}

function formatDateTime(datetime) {
    const date = new Date(datetime);
    const options = {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    };
    return date.toLocaleString('es-CO', options);
}

window.onclick = function(event) {
    const evaluationModal = document.getElementById('evaluationModal');
    const confirmModal = document.getElementById('confirmModal');
    
    if (event.target === evaluationModal) {
        closeModal();
    }
    if (event.target === confirmModal) {
        closeConfirmModal();
    }
};