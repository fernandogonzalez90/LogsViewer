document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const btnText = loginBtn.querySelector(".btn-text");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  // Poner el foco en el campo de usuario o contraseña al cargar
  if (!usernameInput.value) {
    usernameInput.focus();
  } else {
    passwordInput.focus();
  }

  // Manejar el envío del formulario
  loginForm.addEventListener("submit", (e) => {
    loginBtn.classList.add("loading");
    btnText.textContent = "Verificando...";
    loginBtn.disabled = true;
  });

  // Permitir el envío con la tecla Enter
  [usernameInput, passwordInput].forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        if (input === usernameInput && !passwordInput.value) {
          passwordInput.focus();
        } else {
          loginForm.requestSubmit();
        }
      }
    });
  });

  // Restablecer el estado del botón al volver a la página (ej. usando el botón "atrás" del navegador)
  window.addEventListener("pageshow", () => {
    loginBtn.classList.remove("loading");
    btnText.textContent = "Iniciar Sesión";
    loginBtn.disabled = false;
  });

  // Animación escalonada para las alertas
  const alerts = document.querySelectorAll(".alert");
  alerts.forEach((alert, index) => {
    setTimeout(() => {
      alert.style.animation = "slideIn 0.3s ease-out";
    }, index * 100);
  });
});