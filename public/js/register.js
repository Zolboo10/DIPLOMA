const API_URL = 'http://127.0.0.1:5000/api';

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

async function register(userData) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.errors && data.errors.length > 0) {
        showToast(data.errors[0].msg, 'error');
        return;
      }

      showToast(data.message || 'Бүртгүүлэхэд алдаа гарлаа', 'error');
      return;
    }

    if (data.success) {
      showToast('Амжилттай бүртгүүллээ! Нэвтрэх хуудас руу шилжиж байна...', 'success');

      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } else {
      showToast(data.message || 'Бүртгүүлэхэд алдаа гарлаа', 'error');
    }
  } catch (error) {
    console.error('Register error:', error);
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

function setupRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('reg-firstname')?.value.trim();
    const lastName = document.getElementById('reg-lastname')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const confirmPassword = document.getElementById('reg-confirm-password')?.value;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      showToast('Бүх талбарыг бөглөнө үү', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Нууц үгүүд таарахгүй байна', 'error');
      return;
    }

    if (password.length < 4) {
      showToast('Нууц үг хамгийн багадаа 4 тэмдэгт байх ёстой', 'error');
      return;
    }

    await register({
      firstName,
      lastName,
      email,
      password
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupPasswordToggle();
  setupRegisterForm();
});