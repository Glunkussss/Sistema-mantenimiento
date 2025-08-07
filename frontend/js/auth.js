// Middleware de autenticación para páginas protegidas
const AuthGuard = {
  // Verificar si el usuario está autenticado
  checkAuth: () => {
    if (!TokenManager.isValid()) {
      RouteManager.redirectToLogin();
      return false;
    }
    return true;
  },

  // Verificar rol específico
  checkRole: (requiredRoles) => {
    if (!AuthGuard.checkAuth()) return false;
    
    const userRole = UserManager.getRole();
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    if (!roles.includes(userRole)) {
      RouteManager.logout();
      return false;
    }
    
    return true;
  },

  // Inicializar protección en página
  init: (requiredRoles = null) => {
    // Verificar autenticación básica
    if (!AuthGuard.checkAuth()) return;

    // Verificar rol si es necesario
    if (requiredRoles && !AuthGuard.checkRole(requiredRoles)) return;

    // Configurar logout automático si el token expira
    AuthGuard.setupTokenValidation();
    
    // Configurar elementos de UI
    AuthGuard.setupUI();
  },

  // Validación periódica del token
  setupTokenValidation: () => {
    setInterval(async () => {
      try {
        await HttpClient.get('/verify-token');
      } catch (error) {
        console.warn('Token inválido, cerrando sesión');
        RouteManager.logout();
      }
    }, 300000); // Verificar cada 5 minutos
  },

  // Configurar elementos de UI comunes
  setupUI: () => {
    const user = UserManager.get();
    
    // Mostrar información del usuario en el header
    const userInfo = document.querySelector('[data-user-info]');
    if (userInfo && user) {
      userInfo.textContent = user.nombre || user.correo;
    }

    // Configurar botón de logout
    const logoutBtns = document.querySelectorAll('[data-logout]');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        AuthGuard.logout();
      });
    });

    // Mostrar/ocultar elementos según rol
    AuthGuard.showRoleBasedElements();
  },

  // Mostrar elementos según rol del usuario
  showRoleBasedElements: () => {
    const userRole = UserManager.getRole();
    
    // Elementos específicos por rol
    const roleElements = {
      'rector': document.querySelectorAll('[data-role="rector"]'),
      'supervisor': document.querySelectorAll('[data-role="supervisor"]'), 
      'tecnico': document.querySelectorAll('[data-role="tecnico"]'),
      'estudiante': document.querySelectorAll('[data-role="estudiante"]')

    };

    // Ocultar todos los elementos de rol
    Object.values(roleElements).forEach(elements => {
      elements.forEach(el => el.style.display = 'none');
    });

    // Mostrar elementos del rol actual
    if (roleElements[userRole]) {
      roleElements[userRole].forEach(el => el.style.display = '');
    }

    // Elementos para múltiples roles
    const multiRoleElements = document.querySelectorAll('[data-roles]');
    multiRoleElements.forEach(el => {
      const allowedRoles = el.dataset.roles.split(',');
      el.style.display = allowedRoles.includes(userRole) ? '' : 'none';
    });
  },

  // Logout con confirmación
  logout: () => {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
      RouteManager.logout();
    }
  }
};

// Auto-inicializar en páginas que no sean login
document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.includes('login.html');
  
  if (!isLoginPage) {
    // Obtener roles requeridos desde el atributo data del body
    const requiredRoles = document.body.dataset.requiredRoles;
    AuthGuard.init(requiredRoles ? requiredRoles.split(',') : null);
  }
});