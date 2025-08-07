let usuarios = [];
let currentUserId = null;
document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", savedTheme);
    document.querySelector(".theme-toggle").textContent = savedTheme === "dark" ? "☀️" : "🌙";
    loadUsuarios();
    setupEventListeners();
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
    document.getElementById("searchInput").addEventListener("input", filterUsuarios);
    document.getElementById("cargoFilter").addEventListener("change", filterUsuarios);
    document.getElementById("estadoFilter").addEventListener("change", filterUsuarios);
    document.getElementById("userForm").addEventListener("submit", handleSubmit);
    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal")) {
            closeModal();
            closeConfirmModal();
        }
    });
}
async function loadUsuarios() {
    try {
        const data = await HttpClient.get("/usuarios");
        usuarios = data;
        renderUsuarios(usuarios);
        updateUserCount(usuarios.length);
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        ToastManager.error("Error al cargar usuarios");
        document.getElementById("usersTableBody").innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--error-color)">❌ Error al cargar usuarios</td></tr>';
    }
}
function renderUsuarios(usuariosList) {
    const tbody = document.getElementById("usersTableBody");
    if (!usuariosList || usuariosList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary)">📭 No hay usuarios para mostrar</td></tr>';
        return;
    }
    tbody.innerHTML = usuariosList
        .map(
            (usuario) =>
                `<tr><td>${usuario.id}</td><td><div class="user-info"><strong>${usuario.nombre_completo}</strong></div></td><td>${usuario.correo}</td><td><span class="role-badge role-${usuario.cargo}">${getRoleDisplay(
                    usuario.cargo
                )}</span></td><td><span class="status-badge ${usuario.estado === "activo" ? "status-active" : "status-inactive"}">${usuario.estado}</span></td><td><button class="action-btn edit-btn" onclick="editUsuario(${
                    usuario.id
                })" title="Editar">✏️</button><button class="action-btn delete-btn" onclick="confirmDelete(${usuario.id},'${usuario.nombre_completo}')" title="Eliminar">🗑️</button></td></tr>`
        )
        .join("");
}
function getRoleDisplay(cargo) {
    const roles = { estudiante: "Estudiante", rector: "Rector", supervisor: "Supervisor", tecnico: "Técnico" };
    return roles[cargo] || cargo;
}
function filterUsuarios() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const cargoFilter = document.getElementById("cargoFilter").value;
    const estadoFilter = document.getElementById("estadoFilter").value;
    const filtered = usuarios.filter((usuario) => {
        const matchesSearch = usuario.nombre_completo.toLowerCase().includes(searchTerm) || usuario.correo.toLowerCase().includes(searchTerm);
        const matchesCargo = !cargoFilter || usuario.cargo === cargoFilter;
        const matchesEstado = !estadoFilter || usuario.estado === estadoFilter;
        return matchesSearch && matchesCargo && matchesEstado;
    });
    renderUsuarios(filtered);
    updateUserCount(filtered.length);
}
function updateUserCount(count) {
    document.getElementById("userCount").textContent = `${count} usuario${count !== 1 ? "s" : ""}`;
}
function openCreateModal() {
    currentUserId = null;
    document.getElementById("modalTitle").textContent = "Crear Usuario";
    document.getElementById("submitBtn").textContent = "Crear Usuario";
    document.getElementById("userForm").reset();
    document.getElementById("userModal").style.display = "flex";
}
function editUsuario(id) {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return;

    currentUserId = id;
    document.getElementById("modalTitle").textContent = "Editar Usuario";
    document.getElementById("submitBtn").textContent = "Actualizar Usuario";

    document.getElementById("nombre_completo").value = usuario.nombre_completo;
    document.getElementById("correo").value = usuario.correo;
    document.getElementById("cargo").value = usuario.cargo;
    document.getElementById("estado").value = usuario.estado;

    // Limpiar el campo de contraseña para que el usuario pueda ingresar una nueva si desea
    const passwordInput = document.getElementById("contrasena");
    passwordInput.value = "";
    passwordInput.required = false;

    document.getElementById("userModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("userModal").style.display = "none";
    document.getElementById("userForm").reset();
    document.getElementById("contrasena").required = true;
    currentUserId = null;

    document.getElementById("nombre_completo").classList.remove("input-error", "input-success");
    document.getElementById("correo").classList.remove("input-error", "input-success");
}

async function handleSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById("submitBtn");
    const formData = new FormData(e.target);
    const userData = {
    nombre_completo: formData.get("nombre_completo"),
    correo: formData.get("correo"),
    cargo: formData.get("cargo"),
    estado: formData.get("estado") 
    };
    const nombreInput = document.getElementById("nombre_completo");
    const correoInput = document.getElementById("correo");

    const nombreValido = userData.nombre_completo.trim().split(/\s+/).length >= 2;
    const correoValido = /^[a-zA-Z0-9._%+-]+@unibarranquilla\.edu\.co$/.test(userData.correo);

    // Nombre
    if (nombreValido) {
        nombreInput.classList.add("input-success");
        nombreInput.classList.remove("input-error");
    } else {
        nombreInput.classList.add("input-error");
        nombreInput.classList.remove("input-success");
        ToastManager.error("El nombre completo debe tener al menos dos palabras.");
        return;
    }

    // Correo
    if (correoValido) {
        correoInput.classList.add("input-success");
        correoInput.classList.remove("input-error");
    } else {
        correoInput.classList.add("input-error");
        correoInput.classList.remove("input-success");
        ToastManager.error("El correo debe ser institucional (@unibarranquilla.edu.co).");
        return;
    }
    if (formData.get("contrasena")) {
        userData.contrasena = formData.get("contrasena");
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Procesando...";
    try {
        if (currentUserId) {
            await HttpClient.put(`/usuarios/${currentUserId}`, userData);
            ToastManager.success("Usuario actualizado exitosamente");
        } else {
            await HttpClient.post("/usuarios", userData);
            ToastManager.success("Usuario creado exitosamente");
        }
        closeModal();
        loadUsuarios();
    } catch (error) {
        console.error("Error al guardar usuario:", error);
        ToastManager.error(error.message || "Error al guardar usuario");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = currentUserId ? "Actualizar Usuario" : "Crear Usuario";
    }
}
function confirmDelete(id, nombre) {
    currentUserId = id;
    document.getElementById("deleteUserName").textContent = nombre;
    document.getElementById("confirmModal").style.display = "flex";
    document.getElementById("confirmDeleteBtn").onclick = () => deleteUsuario(id);
}
function closeConfirmModal() {
    document.getElementById("confirmModal").style.display = "none";
    currentUserId = null;
}
async function deleteUsuario(id) {
    const deleteBtn = document.getElementById("confirmDeleteBtn");
    deleteBtn.disabled = true;
    deleteBtn.textContent = "Eliminando...";
    try {
        await HttpClient.delete(`/usuarios/${id}`);
        ToastManager.success("Usuario eliminado exitosamente");
        closeConfirmModal();
        loadUsuarios();
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        ToastManager.error("Error al eliminar usuario");
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = "Eliminar";
    }
}
