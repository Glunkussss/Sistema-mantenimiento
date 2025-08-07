// Configuración de la API
const API_BASE = 'http://localhost:4000/api';

// Utilidades para el manejo de tokens
const TokenManager = {
  set: (token) => sessionStorage.setItem('token', token),
  get: () => sessionStorage.getItem('token'),
  remove: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('user');
  },
  isValid: () => !!sessionStorage.getItem('token')
};

// Utilidades para el usuario (actualizado)
const UserManager = {
  set: (user) => sessionStorage.setItem('user', JSON.stringify(user)),
  get: () => {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  getRole: () => sessionStorage.getItem('role'),
  setRole: (role) => sessionStorage.setItem('role', role),
  
  // Nuevas funciones útiles
  getId: () => {
    const user = UserManager.get();
    return user?.id || null;
  },
  getName: () => {
    const user = UserManager.get();
    return user?.nombre_completo || user?.nombre || 'Usuario';
  },
  getEmail: () => {
    const user = UserManager.get();
    return user?.correo || user?.email || '';
  },
  hasPermission: (requiredRoles) => {
    const userRole = UserManager.getRole();
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(userRole);
  }
};


const HttpClient = {
  async request(url, options = {}) {
    const token = TokenManager.get();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(`${API_BASE}${url}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          const customMessage = data?.error || data?.message;

          // ⚠️ Mostrar mensaje específico si la autenticación falla
          if (customMessage === 'Correo o contrasena incorrectos') {
            throw new Error(customMessage);
          }

          // Si no hay mensaje personalizado o es por token inválido
          RouteManager.logout();
          throw new Error('Sesión expirada');
        }

        throw new Error(data.error || data.message || `Error ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('HTTP Request failed:', error);
      throw error;
    }
  },

  get: (url, options = {}) => HttpClient.request(url, { method: 'GET', ...options }),

  post: (url, body, options = {}) => HttpClient.request(url, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options
  }),

  put: (url, body, options = {}) => HttpClient.request(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options
  }),

  delete: (url, options = {}) => HttpClient.request(url, { method: 'DELETE', ...options }),

  postFormData: async (url, formData) => {
    const token = TokenManager.get();

    try {
      const response = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }) // No pongas Content-Type
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          const customMessage = data?.error || data?.message;
          if (customMessage === 'Correo o contrasena incorrectos') {
            throw new Error(customMessage);
          }
          RouteManager.logout();
          throw new Error('Sesión expirada');
        }

        throw new Error(data.error || data.message || `Error ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('FormData POST failed:', error);
      throw error;
    }
  }
};


// Utilidades para UI (mejoradas)
const UIUtils = {
  showError: (element, message) => {
    element.textContent = message;
    element.style.display = 'flex';
    element.className = 'message error-message';
  },

  showSuccess: (element, message) => {
    element.textContent = message;
    element.style.display = 'flex';
    element.className = 'message success-message';
  },

  hideMessage: (element) => {
    element.style.display = 'none';
  },

  setLoading: (button, isLoading) => {
    if (!button) return;
    button.disabled = isLoading;
    
    if (isLoading) {
      button.dataset.originalText = button.textContent;
      button.textContent = '⏳ Cargando...';
      button.classList.add('loading');
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.classList.remove('loading');
    }
  },

  // Nuevas utilidades
  formatDate: (dateString, options = {}) => {
    if (!dateString) return 'N/A';
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    return new Date(dateString).toLocaleDateString('es-ES', defaultOptions);
  },

  formatDateTime: (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  truncateText: (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
};

// Redirección con animación fade
function redirectWithFade(url) {
  document.body.classList.add('fade-out');
  setTimeout(() => {
    window.location.href = url;
  }, 300); // debe coincidir con la duración del CSS
}

const RouteManager = {
  redirectToLogin: () => redirectWithFade('login.html'),

  redirectByRole: (role) => {
    const routes = {
      'rector': 'index.html',
      'supervisor': 'index.html',
      'tecnico': 'index.html',
      'estudiante': 'index.html'

    };

    const cleanRole = typeof role === 'string' ? role.toLowerCase().trim() : '';
    const route = routes[cleanRole];

    if (route) {
      redirectWithFade(route);
    } else {
      UIUtils.showError(document.body, `Rol no autorizado: "${role}"`);
      TokenManager.remove();
      setTimeout(() => RouteManager.redirectToLogin(), 2000);
    }
  },

  logout: () => {
    TokenManager.remove();
    RouteManager.redirectToLogin();
  },

  goTo: (page) => redirectWithFade(page),

  getCurrentPage: () => {
    return window.location.pathname.split('/').pop() || 'index.html';
  },

  isCurrentPage: (page) => {
    return RouteManager.getCurrentPage() === page;
  }
};


// Utilidades para notificaciones toast (nuevo)
const ToastManager = {
  show: (message, type = 'info', duration = 3000) => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${ToastManager.getIcon(type)}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    document.body.appendChild(toast);

    // Animar entrada
    setTimeout(() => toast.classList.add('toast-show'), 100);

    // Auto-remove
    if (duration > 0) {
      setTimeout(() => ToastManager.remove(toast), duration);
    }

    return toast;
  },

  remove: (toast) => {
    toast.classList.remove('toast-show');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  },

  getIcon: (type) => {
    const icons = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': '💡'
    };
    return icons[type] || icons.info;
  },

  success: (message, duration = 3000) => ToastManager.show(message, 'success', duration),
  error: (message, duration = 5000) => ToastManager.show(message, 'error', duration),
  warning: (message, duration = 4000) => ToastManager.show(message, 'warning', duration),
  info: (message, duration = 3000) => ToastManager.show(message, 'info', duration)
};

// Auto-inicialización de elementos comunes
document.addEventListener('DOMContentLoaded', () => {
  // Configurar información del usuario en elementos con data-user-info
  const userInfoElements = document.querySelectorAll('[data-user-info]');
  userInfoElements.forEach(element => {
    const user = UserManager.get();
    if (user) {
      element.textContent = `${UserManager.getName()} (${UIUtils.capitalize(UserManager.getRole())})`;
    }
  });

  // Configurar botones de logout
  const logoutButtons = document.querySelectorAll('[data-logout]');
  logoutButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('¿Está seguro que desea cerrar sesión?')) {
        RouteManager.logout();
      }
    });
  });

  // Marcar página actual en navegación
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPage = RouteManager.getCurrentPage();
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
});

function createTransitionOverlay() {
    if (!document.getElementById('pageTransitionOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'pageTransitionOverlay';
        overlay.className = 'page-transition-overlay';
        overlay.innerHTML = '<div class="page-transition-loader"></div>';
        document.body.appendChild(overlay);
    }
}

// Mostrar transición
function showPageTransition() {
    const overlay = document.getElementById('pageTransitionOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

// Ocultar transición
function hidePageTransition() {
    const overlay = document.getElementById('pageTransitionOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Navegar con transición
function navigateWithTransition(url) {
    // Aplicar animación de salida
    document.body.classList.add('page-exit');
    
    // Mostrar overlay
    showPageTransition();
    
    // Navegar después de la animación
    setTimeout(() => {
        window.location.href = url;
    }, 400);
}

// Interceptar clicks en enlaces de navegación
function setupPageTransitions() {
    createTransitionOverlay();
    
    // Interceptar links de navegación
    document.querySelectorAll('.nav-link, a[href$=".html"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Solo aplicar transición a páginas internas
            if (href && href.includes('.html') && !href.startsWith('http')) {
                e.preventDefault();
                navigateWithTransition(href);
            }
        });
    });
    
    // Ocultar overlay cuando la página esté cargada
    window.addEventListener('load', () => {
        setTimeout(hidePageTransition, 100);
    });
}

// Inicializar al cargar el DOM
document.addEventListener('DOMContentLoaded', setupPageTransitions);

// Mostrar overlay al inicio de la carga
document.addEventListener('DOMContentLoaded', () => {
    if (document.readyState === 'loading') {
        showPageTransition();
    }
  });

  function loadGlobalHeader() {
  const headerContainer = document.getElementById('dashboard-header');
  if (!headerContainer) return;

  const pageTitles = {
    'index.html': '🏠 Dashboard Principal',
    'tareas.html': '📋 Gestión de Tareas',
    'incidencias.html': '⚠️ Gestión de Incidencias',
    'inventario.html': '📦 Inventario',
    'solicitudes.html': '📨 Solicitudes',
    'evaluaciones.html': '📊 Evaluaciones',
    'usuarios.html': '👥 Usuarios',
    'mantenimientos.html': '🛠️ Mantenimientos Preventivos',
    'reportes.html': '📈 Reportes'
  };

  const currentPage = RouteManager.getCurrentPage();
  const title = pageTitles[currentPage] || '🛠️ Sistema IUB';

const navLinks = [
  { href: 'index.html', icon: '🏠', label: 'Dashboard' },
  { href: 'incidencias.html', icon: '⚠️', label: 'Incidencias', roles: ['rector', 'supervisor'] },
  { href: 'tareas.html', icon: '📋', label: 'Tareas', roles: ['rector', 'supervisor', 'tecnico'] },
  { href: 'inventario.html', icon: '📦', label: 'Inventario', roles: ['rector', 'supervisor', 'tecnico'] },
  { href: 'solicitudes.html', icon: '📨', label: 'Solicitudes', roles: ['rector', 'supervisor'] },
  { href: 'evaluaciones.html', icon: '📊', label: 'Evaluaciones', roles: ['rector', 'supervisor'] },
  { href: 'usuarios.html', icon: '👥', label: 'Usuarios', roles: ['rector', 'supervisor'] },
  { href: 'mantenimientos.html', icon: '🛠️', label: 'Mantenimientos', roles: ['rector', 'supervisor', 'tecnico'] },
  { href: 'reportes.html', icon: '📈', label: 'Reportes', roles: ['rector', 'supervisor'] }
];

  const userRole = UserManager.getRole();

  const navItems = navLinks.map(link => {
    if (link.roles && !link.roles.includes(userRole)) return '';
    const active = link.href === currentPage ? 'active' : '';
    return `<a href="${link.href}" class="nav-link ${active}">${link.icon} ${link.label}</a>`;
  }).join('');

  headerContainer.innerHTML = `
    <header class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-container">
            <img src="assets/logo.png" alt="Logo IUB" class="header-logo" />
          </div>
          <h1>${title}</h1>
          <p class="welcome-text" data-user-info></p>
        </div>
        <nav class="header-nav">
          ${navItems}
          <button class="btn btn-secondary" data-logout>Cerrar Sesión</button>
        </nav>
      </div>
    </header>
  `;
}

// Llama a la función cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  loadGlobalHeader();
});
