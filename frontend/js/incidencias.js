let incidencias = [];
let ubicaciones = [];
let currentIncidenciaId = null;
let filteredIncidencias = [];

document.addEventListener("DOMContentLoaded", () => {
    loadUbicaciones();
    loadIncidencias();
    setupEventListeners();
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", savedTheme);
    document.querySelector(".theme-toggle").textContent = savedTheme === "dark" ? "☀️" : "🌙";

});

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    document.querySelector(".theme-toggle").textContent = newTheme === "dark" ? "☀️" : "🌙";
}

function setupEventListeners() {
    document.getElementById("searchInput").addEventListener("input", filterIncidencias);
    document.getElementById("prioridadFilter").addEventListener("change", filterIncidencias);
    document.getElementById("ubicacionFilter").addEventListener("change", filterIncidencias);
}

async function loadUbicaciones() {
    try {
        const data = await HttpClient.get("/ubicaciones");
        ubicaciones = data;

        const bloques = [...new Set(ubicaciones.map((u) => u.bloque))];

        const bloqueSelect = document.getElementById("bloqueSelect");
        const pisoSelect = document.getElementById("pisoSelect");
        const ubicacionSelect = document.getElementById("ubicacion_id");
        const daniosAzotea = document.getElementById("daniosAzotea");
        const daniosNormales = document.getElementById("daniosNormales");

        // Limpiar selects
        bloqueSelect.innerHTML = '<option value="">Seleccionar bloque</option>';
        pisoSelect.innerHTML = '<option value="">Seleccionar piso</option>';
        ubicacionSelect.innerHTML = '<option value="">Seleccionar recurso</option>';

        // Cargar bloques
        bloques.forEach((b) => {
            bloqueSelect.innerHTML += `<option value="${b}">${b}</option>`;
        });

        // Cambio de bloque -> cargar pisos
        bloqueSelect.addEventListener("change", () => {
            const bloqueSeleccionado = bloqueSelect.value;
            const pisos = [...new Set(ubicaciones
                .filter((u) => u.bloque === bloqueSeleccionado)
                .map((u) => u.piso)
            )];

            pisoSelect.disabled = false;
            pisoSelect.innerHTML = '<option value="">Seleccionar piso</option>';
            ubicacionSelect.innerHTML = '<option value="">Seleccionar recurso</option>';
            ubicacionSelect.disabled = true;

            pisos.forEach((p) => {
                pisoSelect.innerHTML += `<option value="${p}">${p}</option>`;
            });
        });

        // Cambio de piso -> cargar ubicaciones y alternar daños
        pisoSelect.addEventListener("change", () => {
            const bloque = bloqueSelect.value;
            const piso = pisoSelect.value;
            const recursos = ubicaciones.filter((u) => u.bloque === bloque && u.piso === piso);

            // Mostrar grupo de daños según si es azotea o no
            const esAzotea = piso.toLowerCase() === "azotea";

            daniosAzotea.style.display = esAzotea ? "block" : "none";
            daniosNormales.style.display = esAzotea ? "none" : "block";

            // Limpiar checkboxes
            daniosAzotea.querySelectorAll("input[type='checkbox']").forEach((cb) => cb.checked = false);
            daniosNormales.querySelectorAll("input[type='checkbox']").forEach((cb) => cb.checked = false);

            // Cargar ubicaciones
            ubicacionSelect.disabled = false;
            ubicacionSelect.innerHTML = '<option value="">Seleccionar recurso</option>';

            recursos.forEach((u) => {
                const nombre = `${u.recurso || ""}${u.salon ? " - " + u.salon : ""}`;
                ubicacionSelect.innerHTML += `<option value="${u.id}">${nombre}</option>`;
            });
        });

    } catch (error) {
        console.error("Error al cargar ubicaciones:", error);
        ToastManager.error("Error al cargar ubicaciones");
    }
}


async function loadIncidencias() {
    try {
        const data = await HttpClient.get("/incidencias");
        const user = UserManager.get();
        const userRole = UserManager.getRole();

        // Filtrado según rol
        if (["supervisor", "rector"].includes(userRole)) {
            filteredIncidencias = [...data]; // todos los roles administrativos ven todas
        } else {
            filteredIncidencias = data.filter(inc => inc.reportado_por === user.id); // solo las propias
        }

        incidencias = [...filteredIncidencias];
        renderIncidencias();
        updateIncidenciaCount();
        loadUbicacionFilterFromIncidencias(); // ← importante: cargar filtros según las incidencias visibles

    } catch (error) {
        console.error("Error al cargar incidencias:", error);
        ToastManager.error("Error al cargar incidencias");
        document.getElementById("incidenciasTableBody").innerHTML =
            '<tr><td colspan="7" class="empty-state"><p>❌ Error al cargar incidencias</p></td></tr>';
    }
}



function renderIncidencias() {
    const tbody = document.getElementById("incidenciasTableBody");

    if (filteredIncidencias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><p>📭 No hay incidencias registradas</p></td></tr>';
        return;
    }

    const userRole = UserManager.getRole();
    const userId = UserManager.getId();

    tbody.innerHTML = filteredIncidencias
        .filter((inc) => {
            return ["rector", "supervisor"].includes(userRole) || inc.reportado_por === userId;
        })
        .map((incidencia) => {
            const actionButtons = getActionButtons(incidencia, userRole);
            const nombreReportado = incidencia.nombre_reportado_por || "Desconocido";

            return `
                <tr data-incidencia-id="${incidencia.id}" data-priority="${incidencia.prioridad}">
                    <td>#${incidencia.id}</td>
                    <td>${formatearUbicacionBonita(incidencia.nombre_ubicacion)}</td>
                    <td>${incidencia.tipo_dano}</td>
                    <td><span class="status-badge priority-${incidencia.prioridad}">${getPriorityIcon(incidencia.prioridad)} ${incidencia.prioridad.toUpperCase()}</span></td>
                    <td>${nombreReportado}</td>
                    <td>${UIUtils.formatDateTime(incidencia.fecha_reporte)}</td>
                    <td class="description-cell" title="${incidencia.descripcion}">${UIUtils.truncateText(incidencia.descripcion, 50)}</td>
                    <td class="actions-col">${actionButtons}</td>
                </tr>
            `;
        })
        .join("");

    toggleAccionesColumnVisibility();
}


function toggleAccionesColumnVisibility() {
    const actionCells = document.querySelectorAll("td.actions-col");
    const hasActions = [...actionCells].some(cell => cell.innerHTML.trim() !== "");

    const thAcciones = document.querySelector("th.actions-col");

    if (thAcciones) {
        // Oculta o muestra la columna según si hay botones
        thAcciones.style.display = hasActions ? "" : "none";
        actionCells.forEach(td => {
            td.style.display = hasActions ? "" : "none";
        });

        // Ajustar el colspan si la tabla está vacía
        const emptyRow = document.querySelector("#incidenciasTableBody .empty-state");
        if (emptyRow) {
            emptyRow.parentElement.setAttribute("colspan", hasActions ? "7" : "6");
        }
    }
}

function getActionButtons(incidencia, userRole) {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;
    const isSupervisorOrRector = ["supervisor", "rector"].includes(userRole);

    const puedeEditar = isSupervisorOrRector || incidencia.reportado_por === userId;
    const puedeEliminar = isSupervisorOrRector;

    let buttons = "";

    if (puedeEditar) {
        buttons += `<button class="btn-action btn-edit" onclick="editIncidencia(${incidencia.id})" title="Editar">✏️</button>`;
    }

    if (puedeEliminar) {
        buttons += `<button class="btn-action btn-delete" onclick="confirmDelete(${incidencia.id})" title="Eliminar">🗑️</button>`;
    }

    return buttons;
}

function getPriorityIcon(priority) {
    const icons = { alta: "🔴", media: "🟡", baja: "🟢" };
    return icons[priority] || "⚪";
}

function filterIncidencias() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const prioridadFilter = document.getElementById("prioridadFilter").value;
    const ubicacionFilter = document.getElementById("ubicacionFilter").value;

    filteredIncidencias = incidencias.filter((incidencia) => {
        const matchesSearch = (
            incidencia.tipo_dano.toLowerCase().includes(searchTerm) ||
            incidencia.descripcion.toLowerCase().includes(searchTerm) ||
            incidencia.nombre_ubicacion.toLowerCase().includes(searchTerm)
        );

        const matchesPrioridad = !prioridadFilter || incidencia.prioridad === prioridadFilter;
        const matchesUbicacion = !ubicacionFilter || String(incidencia.ubicacion_id) === ubicacionFilter;

        return matchesSearch && matchesPrioridad && matchesUbicacion;
    });

    renderIncidencias();
    updateIncidenciaCount();
}

function loadUbicacionFilterFromIncidencias() {
    const ubicacionesUnicas = new Map();

    filteredIncidencias.forEach(i => {
        if (i.ubicacion_id && i.nombre_ubicacion) {
            ubicacionesUnicas.set(i.ubicacion_id, i.nombre_ubicacion);
        }
    });

    const ubicacionFilter = document.getElementById("ubicacionFilter");
    if (!ubicacionFilter) return;

    ubicacionFilter.innerHTML = '<option value="">Todas las ubicaciones</option>';
    ubicacionesUnicas.forEach((nombre, id) => {
        ubicacionFilter.innerHTML += `<option value="${id}">${nombre}</option>`;
    });

    ubicacionFilter.addEventListener("change", filterIncidencias);
}


function updateIncidenciaCount() {
    const count = filteredIncidencias.length;
    const total = incidencias.length;
    document.getElementById("incidenciaCount").textContent = count === total ? `${count} incidencias` : `${count} de ${total} incidencias`;
}

function showCreateModal() {
    currentIncidenciaId = null;
    document.getElementById("modalTitle").textContent = "➕ Nueva Incidencia";
    document.getElementById("incidenciaForm").reset();
    document.getElementById("incidenciaModal").style.display = "flex";
}

function editIncidencia(id) {
    const incidencia = incidencias.find((i) => i.id === id);
    if (!incidencia) return;

    currentIncidenciaId = id;
    document.getElementById("modalTitle").textContent = "✏️ Editar Incidencia";

    const ubicacionSelect = document.getElementById("ubicacion_id");
    const pisoSelect = document.getElementById("pisoSelect");
    const bloqueSelect = document.getElementById("bloqueSelect");

    const ubicacion = ubicaciones.find((u) => u.id === incidencia.ubicacion_id);
    if (ubicacion) {
        bloqueSelect.value = ubicacion.bloque;
        const pisos = [...new Set(ubicaciones.filter((u) => u.bloque === ubicacion.bloque).map((u) => u.piso))];
        pisoSelect.innerHTML = '<option value="">Seleccionar piso</option>';
        pisos.forEach((p) => (pisoSelect.innerHTML += `<option value="${p}">${p}</option>`));
        pisoSelect.disabled = false;
        pisoSelect.value = ubicacion.piso;

        const recursos = ubicaciones.filter((u) => u.bloque === ubicacion.bloque && u.piso === ubicacion.piso);
        ubicacionSelect.innerHTML = '<option value="">Seleccionar recurso</option>';
        recursos.forEach((u) => {
            const nombre = `${u.recurso || ""}${u.salon ? " - " + u.salon : ""}`;
            ubicacionSelect.innerHTML += `<option value="${u.id}">${nombre}</option>`;
        });
        ubicacionSelect.disabled = false;
        ubicacionSelect.value = incidencia.ubicacion_id;

        const isAzotea = (ubicacion.piso || "").toLowerCase() === "azotea";
        document.getElementById("daniosAzotea").style.display = isAzotea ? "block" : "none";
        document.getElementById("daniosNormales").style.display = isAzotea ? "none" : "block";

        const tiposSeleccionados = incidencia.tipo_dano.split(",").map((t) => t.trim());

        const checkboxes = isAzotea ? document.querySelectorAll('#daniosAzotea input[type="checkbox"]') : document.querySelectorAll('#daniosNormales input[type="checkbox"]');

        checkboxes.forEach((cb) => {
            cb.checked = tiposSeleccionados.includes(cb.value);
        });
    }

    document.getElementById("prioridad").value = incidencia.prioridad;
    document.getElementById("descripcion").value = incidencia.descripcion;

    document.getElementById("incidenciaModal").style.display = "flex";
}

function hideModal() {
    document.getElementById("incidenciaModal").style.display = "none";
    currentIncidenciaId = null;
}

async function saveIncidencia() {
    const form = document.getElementById("incidenciaForm");
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const saveBtn = document.getElementById("saveBtn");
    UIUtils.setLoading(saveBtn, true);

    // Obtener daños seleccionados (ya sea de Normales o Azotea)
    const daniosSeleccionados = Array.from(
        document.querySelectorAll(
            '#daniosNormales input[type="checkbox"]:checked, #daniosAzotea input[type="checkbox"]:checked'
        )
    ).map(cb => cb.value);

    // Construir objeto JSON
    const incidenciaData = {
        ubicacion_id: document.getElementById("ubicacion_id").value,
        tipo_dano: daniosSeleccionados.join(", "), // <- Convertir a string
        prioridad: document.getElementById("prioridad").value,
        descripcion: document.getElementById("descripcion").value.trim(),
    };

    try {
        if (currentIncidenciaId) {
            await HttpClient.put(`/incidencias/${currentIncidenciaId}`, incidenciaData);
            ToastManager.success("Incidencia actualizada correctamente");
        } else {
            await HttpClient.post("/incidencias", incidenciaData);
            ToastManager.success("Incidencia creada correctamente");
        }

        hideModal();
        loadIncidencias();
    } catch (error) {
        console.error("Error al guardar incidencia:", error);
        ToastManager.error(error.message || "Error al guardar incidencia");
    } finally {
        UIUtils.setLoading(saveBtn, false);
    }
}


function confirmDelete(id) {
    currentIncidenciaId = id;
    document.getElementById("confirmModal").style.display = "flex";
    document.getElementById("confirmDeleteBtn").onclick = () => deleteIncidencia(id);
}

function hideConfirmModal() {
    document.getElementById("confirmModal").style.display = "none";
    currentIncidenciaId = null;
}

async function deleteIncidencia(id) {
    const deleteBtn = document.getElementById("confirmDeleteBtn");
    UIUtils.setLoading(deleteBtn, true);

    try {
        await HttpClient.delete(`/incidencias/${id}`);
        ToastManager.success("Incidencia eliminada correctamente");
        hideConfirmModal();
        loadIncidencias();
    } catch (error) {
        console.error("Error al eliminar incidencia:", error);
        ToastManager.error(error.message || "Error al eliminar incidencia");
    } finally {
        UIUtils.setLoading(deleteBtn, false);
    }
}

function formatearUbicacionBonita(nombreUbicacion) {
    if (!nombreUbicacion) return "";

    const [bloqueYpiso, recurso] = nombreUbicacion.split(" - ");
    if (!bloqueYpiso || !recurso) return nombreUbicacion;

    const bloqueMatch = bloqueYpiso.match(/^([A-Z]) Piso (\d+|Azotea)$/i);
    if (!bloqueMatch) return nombreUbicacion;

    const bloque = bloqueMatch[1].toUpperCase();
    const piso = bloqueMatch[2].toLowerCase() === "azotea" ? "Azotea" : `Piso ${bloqueMatch[2]}`;

    return `Bloque ${bloque} - ${piso} - ${recurso}`;
}

window.onclick = function (event) {
    const modal = document.getElementById("incidenciaModal");
    const confirmModal = document.getElementById("confirmModal");
    if (event.target === modal) {
        hideModal();
    }
    if (event.target === confirmModal) {
        hideConfirmModal();
    }
};
