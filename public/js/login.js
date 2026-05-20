const API_URL = 'http://127.0.0.1:5000/api';

let resetCountdown = null;
let resetEmailValue = '';

function showToast(message, type = 'info') {
  let toast = document.getElementById('toast-notification');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast-notification ${type}`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function saveAuth(token, user, rememberMe) {
  if (rememberMe) {
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  }
}

async function login(email, password, rememberMe) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || 'Нэвтрэхэд алдаа гарлаа', 'error');
      return;
    }

    if (data.success) {
      saveAuth(data.token, data.user, rememberMe);
      showToast('Амжилттай нэвтэрлээ!', 'success');

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } else {
      showToast(data.message || 'Нэвтрэхэд алдаа гарлаа', 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Серверт холбогдоход алдаа гарлаа', 'error');
  }
}

function setupPasswordToggle() {
  const toggleButtons = document.querySelectorAll('.toggle-password');

  toggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');

      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        }
      } else {
        input.type = 'password';
        if (icon) {
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      }
    });
  });
}

function setupLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const rememberMe = document.getElementById('remember-me')?.checked || false;

    if (!email || !password) {
      showToast('Имэйл болон нууц үгээ оруулна уу', 'error');
      return;
    }

    await login(email, password, rememberMe);
  });
}

function startResetTimer() {
  const timerText = document.getElementById('reset-timer');
  const resendBtn = document.getElementById('resend-reset-link');

  let timeLeft = 10 * 60;

  if (resetCountdown) {
    clearInterval(resetCountdown);
  }

  if (resendBtn) {
    resendBtn.disabled = true;
  }

  resetCountdown = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    if (timerText) {
      timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (timeLeft <= 0) {
      clearInterval(resetCountdown);

      if (timerText) {
        timerText.textContent = '00:00';
      }

      if (resendBtn) {
        resendBtn.disabled = false;
      }

      showToast('Холбоосын хугацаа дууслаа. Дахин илгээнэ үү.', 'error');
    }

    timeLeft--;
  }, 1000);
}

async function sendResetLink(email) {
  try {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || 'Алдаа гарлаа', 'error');
      return;
    }

    const resultBox = document.getElementById('reset-result-box');
    const resetMessage = document.getElementById('reset-message');
    const resetUrlLink = document.getElementById('reset-url-link');

    if (resultBox) {
      resultBox.style.display = 'block';
    }

    if (resetMessage) {
  resetMessage.textContent = data.message || 'Нууц үг сэргээх холбоос таны имэйл рүү илгээгдлээ.';
}

    resetEmailValue = email;
    startResetTimer();

    showToast('Нууц үг сэргээх холбоос үүслээ', 'success');
  } catch (error) {
    console.error('Forgot password error:', error);
    showToast('Серверт холбогдоход алдаа гарлаа', 'error');
  }
}

function setupForgotPassword() {
  const forgotLink = document.getElementById('forgot-password-link');
  const modal = document.getElementById('forgot-modal');
  const closeBtn = document.querySelector('.modal-close');
  const sendBtn = document.getElementById('send-reset-link');
  const resendBtn = document.getElementById('resend-reset-link');
  const resetEmail = document.getElementById('reset-email');

  if (forgotLink && modal) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const email = resetEmail?.value.trim();

      if (!email) {
        showToast('Имэйл хаягаа оруулна уу', 'error');
        return;
      }

      await sendResetLink(email);
    });
  }

  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      const email = resetEmailValue || resetEmail?.value.trim();

      if (!email) {
        showToast('Имэйл хаягаа оруулна уу', 'error');
        return;
      }

      await sendResetLink(email);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupPasswordToggle();
  setupLoginForm();
  setupForgotPassword();
});