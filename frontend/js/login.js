document.addEventListener("DOMContentLoaded", () => {
    // Theme Management
    const initTheme = () => {
        const savedTheme = localStorage.getItem("theme") || "light";
        document.documentElement.setAttribute("data-theme", savedTheme);
        updateThemeIcon(savedTheme);
    };

    const updateThemeIcon = (theme) => {
        const icon = document.getElementById("themeIcon");
        icon.className = theme === "dark" ? "fas fa-moon" : "fas fa-sun";
    };

    const toggleTheme = () => {
        const current = document.documentElement.getAttribute("data-theme");
        const newTheme = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateThemeIcon(newTheme);
    };

    // Particles Animation
    const createParticles = () => {
        const container = document.getElementById("particles");
        const particleCount = window.innerWidth < 768 ? 30 : 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement("div");
            particle.className = "particle";
            particle.style.left = Math.random() * 100 + "%";
            particle.style.top = Math.random() * 100 + "%";
            particle.style.animationDelay = Math.random() * 6 + "s";
            particle.style.animationDuration = Math.random() * 3 + 3 + "s";
            container.appendChild(particle);
        }
    };

    // Password Toggle
    const setupPasswordToggle = () => {
        const toggle = document.getElementById("passwordToggle");
        const input = document.getElementById("password");

        toggle.addEventListener("click", () => {
            const type = input.type === "password" ? "text" : "password";
            input.type = type;
            toggle.querySelector("i").className = type === "password" ? "fas fa-eye-slash" : "fas fa-eye";
        });
    };

    // Input Animations
    const setupInputAnimations = () => {
        const inputs = document.querySelectorAll(".input-wrapper input");
        inputs.forEach((input) => {
            input.addEventListener("focus", () => {
                input.parentNode.classList.add("focused");
            });
            input.addEventListener("blur", () => {
                if (!input.value) {
                    input.parentNode.classList.remove("focused");
                }
            });
        });
    };

    // Ripple Effect
    const createRipple = (event, button) => {
        const ripple = button.querySelector(".btn-ripple");
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        ripple.style.left = x + "px";
        ripple.style.top = y + "px";
    };

    // Enhanced UI Utils
    const UIUtils = {
        showMessage: (container, message, type = "error") => {
            container.className = `message ${type}-message`;
            container.querySelector(".message-text").textContent = message;
            container.style.display = "flex";
            setTimeout(() => (container.style.display = "none"), 5000);
        },
        hideMessage: (container) => {
            container.style.display = "none";
        },
        setLoading: (button, loading) => {
            button.classList.toggle("loading", loading);
            button.disabled = loading;
        },
    };

    // Initialize everything
    initTheme();
    createParticles();
    setupPasswordToggle();
    setupInputAnimations();

    // Check if already logged in
    if (typeof TokenManager !== "undefined" && TokenManager.isValid()) {
        const role = UserManager?.getRole();
        if (role && typeof RouteManager !== "undefined") {
            RouteManager.redirectByRole(role);
            return;
        }
    }

    // DOM Elements
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");
    const errorContainer = document.getElementById("loginError");
    const successContainer = document.getElementById("loginSuccess");
    const themeToggle = document.getElementById("themeToggle");

    // Event Listeners
    themeToggle.addEventListener("click", toggleTheme);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            UIUtils.showMessage(errorContainer, "Por favor ingrese ambos campos.");
            return;
        }

        if (!email.includes("@") || !email.includes(".")) {
            UIUtils.showMessage(errorContainer, "Ingrese un correo válido.");
            return;
        }

        try {
            UIUtils.setLoading(loginBtn, true);
            UIUtils.hideMessage(errorContainer);
            UIUtils.hideMessage(successContainer);

            // Simulate API call if HttpClient is not available
            if (typeof HttpClient !== "undefined") {
                const data = await HttpClient.post("/login", {
                    correo: email,
                    contrasena: password,
                });

                if (typeof TokenManager !== "undefined") TokenManager.set(data.token);
                if (typeof UserManager !== "undefined") {
                    UserManager.set(data.usuario);
                    UserManager.setRole(data.usuario.cargo);
                }

                UIUtils.showMessage(successContainer, "Inicio de sesión exitoso", "success");
                setTimeout(() => {
                    if (typeof RouteManager !== "undefined") {
                        RouteManager.redirectByRole(data.usuario.cargo);
                    } else {
                        window.location.href = "/dashboard";
                    }
                }, 1500);
            } else {
                // Fallback for demo
                setTimeout(() => {
                    UIUtils.setLoading(loginBtn, false);
                    UIUtils.showMessage(successContainer, "Inicio de sesión exitoso", "success");
                }, 1000);
            }
        } catch (error) {
            UIUtils.setLoading(loginBtn, false);
            UIUtils.showMessage(errorContainer, error.message || "Error al iniciar sesión");
        }
    });

    loginBtn.addEventListener("click", (e) => createRipple(e, loginBtn));

    [emailInput, passwordInput].forEach((input) => {
        input.addEventListener("input", () => {
            UIUtils.hideMessage(errorContainer);
            UIUtils.hideMessage(successContainer);
        });
    });

    passwordInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            form.dispatchEvent(new Event("submit"));
        }
    });

    // Advanced features
    emailInput.addEventListener("blur", () => {
        const email = emailInput.value.trim();
        if (email && !email.includes("@unibarranquilla.edu.co")) {
            UIUtils.showMessage(errorContainer, "Use su correo institucional (@unibarranquilla.edu.co)");
        }
    });

    // Auto-focus first empty field
    setTimeout(() => {
        if (!emailInput.value) emailInput.focus();
        else if (!passwordInput.value) passwordInput.focus();
    }, 100);
});
