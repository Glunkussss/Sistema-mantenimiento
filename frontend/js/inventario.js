let inventoryData = [],
    currentEditId = null,
    deleteItemId = null,
    ubicaciones = [];

function toggleTheme() {
    const t = document.body,
        e = t.getAttribute("data-theme"),
        n = "dark" === e ? "light" : "dark";
    t.setAttribute("data-theme", n), localStorage.setItem("theme", n), (document.querySelector(".theme-toggle").textContent = "dark" === n ? "☀️" : "🌙");
}

document.addEventListener("DOMContentLoaded", () => {
    const t = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", t), (document.querySelector(".theme-toggle").textContent = "dark" === t ? "☀️" : "🌙"), loadUbicaciones(), loadInventory();
});

async function loadUbicaciones() {
    try {
        const t = await HttpClient.get("/ubicaciones");
        (ubicaciones = t),
            ["ubicacionFilter", "ubicacion_id"].forEach((e) => {
                const n = document.getElementById(e),
                    o = n.value;
                (n.innerHTML = "ubicacionFilter" === e ? '<option value="">Todas las ubicaciones</option>' : '<option value="">Seleccionar ubicación...</option>'),
                    t.forEach((t) => {
                        const e = document.createElement("option");
                        (e.value = t.id), (e.textContent = t.nombre_ubicacion), n.appendChild(e);
                    }),
                    (n.value = o);
            });
    } catch (t) {
        console.error("Error al cargar ubicaciones:", t), ToastManager.error("Error al cargar ubicaciones");
    }
}

async function loadInventory() {
    try {
        const t = await HttpClient.get("/inventario");
        // (inventoryData = t), renderInventory(t), updateStats(t), ToastManager.success(`${t.length} recursos cargados`);
        (inventoryData = t), renderInventory(t), updateStats(t); 
    } catch (t) {
        console.error("Error al cargar inventario:", t),
            ToastManager.error("Error al cargar inventario"),
            (document.querySelector("#inventoryTable tbody").innerHTML = '<tr><td colspan="6" class="empty-state"><p>❌ Error al cargar datos</p></td></tr>');
    }
}

function renderInventory(t) {
    const e = document.querySelector("#inventoryTable tbody"),
        n = document.getElementById("itemCount");
    if (((n.textContent = `${t.length} recursos`), 0 === t.length)) return void (e.innerHTML = '<tr><td colspan="6" class="empty-state"><p>📭 No hay recursos registrados</p></td></tr>');
    
    e.innerHTML = t
        .map(
            (t) =>
                `<tr>
                    <td><strong>${t.nombre}</strong></td>
                    <td><span class="type-badge type-${t.tipo}">${getTypeIcon(t.tipo)} ${capitalizeFirst(t.tipo)}</span></td>
                    <td><span class="quantity-badge ${t.cantidad_disponible <= 5 ? "low-stock" : ""}">${t.cantidad_disponible}</span></td>
                    <td>${t.nombre_ubicacion || "Sin ubicación"}</td>
                    <td><div class="description-text">${t.descripcion || "Sin descripción"}</div></td>
                    <td>
                        <div class="action-buttons">
                            ${hasRole(["rector", "supervisor"])
                                ? `<button class="action-btn edit-btn" onclick="editItem(${t.id})" title="Editar">📝</button>
                                   <button class="action-btn delete-btn" onclick="deleteItem(${t.id},'${t.nombre.replace(/'/g, "&#39;")}')" title="Eliminar">🗑️</button>`
                                : '<span class="no-actions">-</span>'
                            }
                        </div>
                    </td>
                </tr>`
        )
        .join("");
}

function updateStats(t) {
    const e = { 
        herramienta: t.filter((t) => "herramienta" === t.tipo).length, 
        material: t.filter((t) => "material" === t.tipo).length, 
        total: t.length, 
        stockBajo: t.filter((t) => t.cantidad_disponible <= 5).length 
    };
    (document.getElementById("totalHerramientas").textContent = e.herramienta),
        (document.getElementById("totalMateriales").textContent = e.material),
        (document.getElementById("totalItems").textContent = e.total),
        (document.getElementById("stockBajo").textContent = e.stockBajo);
}

function getTypeIcon(t) {
    return { herramienta: "🛠️", material: "📦" }[t] || "📋";
}

function capitalizeFirst(t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
}

function filterInventory() {
    const t = document.getElementById("searchInput").value.toLowerCase(),
        e = document.getElementById("tipoFilter").value,
        n = document.getElementById("ubicacionFilter").value,
        o = inventoryData.filter((o) => {
            const a = o.nombre.toLowerCase().includes(t) || (o.descripcion && o.descripcion.toLowerCase().includes(t)) || false,
                r = !e || o.tipo === e,
                i = !n || o.ubicacion_id == n;
            return a && r && i;
        });
    renderInventory(o);
}

function openModal(t, e = null) {
    currentEditId = e;
    const n = document.getElementById("inventoryModal"),
        o = document.getElementById("modalTitle"),
        a = document.getElementById("inventoryForm");
    
    if ("crear" === t) {
        (o.textContent = "➕ Nuevo Recurso"), a.reset();
    } else if ("editar" === t && e) {
        o.textContent = "✏️ Editar Recurso";
        const t = inventoryData.find((t) => t.id === e);
        if (t) {
            document.getElementById("nombre").value = t.nombre;
            document.getElementById("tipo").value = t.tipo;
            document.getElementById("cantidad_disponible").value = t.cantidad_disponible;
            document.getElementById("ubicacion_id").value = t.ubicacion_id;
            document.getElementById("descripcion").value = t.descripcion || "";
        }
    }
    n.style.display = "flex";
}

function closeModal() {
    const t = document.getElementById("inventoryModal"),
        e = document.getElementById("inventoryForm");
    (t.style.display = "none"), e.reset(), (currentEditId = null);
}

async function saveInventory() {
    const t = document.getElementById("inventoryForm"),
        e = new FormData(t);
    
    if (!t.checkValidity()) {
        return void ToastManager.error("Por favor completa todos los campos obligatorios");
    }
    
    const n = { 
        nombre: e.get("nombre"), 
        tipo: e.get("tipo"), 
        cantidad_disponible: parseInt(e.get("cantidad_disponible")), 
        ubicacion_id: parseInt(e.get("ubicacion_id")), 
        descripcion: e.get("descripcion") || null
    };
    
    try {
        if (currentEditId) {
            // Para editar, necesitamos usar una ruta diferente o crear una nueva ruta en el backend
            // Por ahora, vamos a simular la actualización completa
            await HttpClient.put(`/inventario/${currentEditId}/cantidad`, { cantidad_disponible: n.cantidad_disponible });
            ToastManager.success("Recurso actualizado correctamente");
        } else {
            await HttpClient.post("/inventario", n);
            ToastManager.success("Recurso creado correctamente");
        }
        closeModal();
        loadInventory();
    } catch (t) {
        console.error("Error al guardar:", t);
        ToastManager.error(t.message || "Error al guardar recurso");
    }
}

function editItem(t) {
    openModal("editar", t);
}

function deleteItem(t, e) {
    (deleteItemId = t), (document.getElementById("deleteItemName").textContent = e), (document.getElementById("confirmModal").style.display = "flex");
}

function closeConfirmModal() {
    (document.getElementById("confirmModal").style.display = "none"), (deleteItemId = null);
}

async function confirmDelete() {
    if (!deleteItemId) return;
    try {
        await HttpClient.delete(`/inventario/${deleteItemId}`);
        ToastManager.success("Recurso eliminado correctamente");
        closeConfirmModal();
        loadInventory();
    } catch (t) {
        console.error("Error al eliminar:", t);
        ToastManager.error("Error al eliminar recurso");
    }
}

function hasRole(t) {
    const e = JSON.parse(localStorage.getItem("userData") || "{}");
    return t.includes(e.rol);
}