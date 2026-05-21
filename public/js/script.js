window.API_BASE_URL = 'https://diploma-3ssv.onrender.com/api';

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function isLoggedIn() {
    return !!getToken();
}

function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'index.html';
}

async function checkAuth() {
    const token = getToken();

    const loggedOut = document.getElementById('loggedOutState');
    const loggedIn = document.getElementById('loggedInState');

    if (!token) {
        if (loggedOut) loggedOut.style.display = 'flex';
        if (loggedIn) loggedIn.style.display = 'none';
        return;
    }

    try {
        const res = await fetch(`${window.API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        if (data.success) {
            if (loggedOut) loggedOut.style.display = 'none';
            if (loggedIn) loggedIn.style.display = 'block';

            const nameEl = document.getElementById('userNameDisplay');
            if (nameEl) nameEl.textContent = data.user.firstName;
        } else {
            logout();
        }
    } catch (err) {
        console.error('checkAuth error:', err);
        logout();
    }
}

function setupDropdown() {
    const btn = document.getElementById('userMenuBtn');
    const menu = document.getElementById('userDropdown');

    if (!btn || !menu) return;

    btn.onclick = () => menu.classList.toggle('show');

    document.addEventListener('click', e => {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('show');
        }
    });
}

function setupLogout() {
    const btn = document.getElementById('logoutBtn');
    if (btn) btn.onclick = logout;
}

function escapeHtml(str) {
    return str?.replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}

async function fetchLocations() {
    const res = await fetch(`${window.API_BASE_URL}/locations`);
    const result = await res.json();
    return result.data || [];
}

async function savePlace(placeId) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    alert("Та эхлээд нэвтэрнэ үү.");
    return;
  }

  try {
    const res = await fetch(`${window.API_BASE_URL}/favorites/${placeId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    console.log("FAVORITE RESPONSE:", data);

    if (res.ok && data.success) {
      alert("Амжилттай хадгаллаа ");
    } else {
      alert(data.message || "Хадгалахад алдаа ");
    }

  } catch (error) {
    console.error(error);
    alert("Сервертэй холбогдож чадсангүй");
  }
}


const sliderData = [
    {
        image: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Mongolia_%2835427009881%29.jpg",
        title: "Говь цөлийн гайхамшиг"
    },
    {
        image: "https://upload.wikimedia.org/wikipedia/commons/6/67/Hovsgol_Lake_at_sunset_-_panoramio.jpg",
        title: "Хөвсгөл нуур"
    },
    {
        image: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Genghis_Khan_Equestrian_Statue.jpg",
        title: "Чингис хааны хөшөө"
    },
    {
        
        image: "https://upload.wikimedia.org/wikipedia/commons/0/09/Tavan_Bogd_Mountain.jpg",
        title: "Алтай таван богд"
    }
];

let currentSlide = 0;
let sliderInterval = null;

function updateSlider(index) {
    const heroImage = document.getElementById('heroImage');
    const slideTitle = document.getElementById('slideTitle');
    const slideDesc = document.getElementById('slideDesc');
    const dots = document.querySelectorAll('.slider-dot');

    if (!heroImage || !slideTitle) return;

    currentSlide = index;

    heroImage.src = sliderData[currentSlide].image;
    heroImage.alt = sliderData[currentSlide].title;
    slideTitle.textContent = sliderData[currentSlide].title;

    if (slideDesc) {
        slideDesc.textContent = sliderData[currentSlide].desc;
    }

    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });

    console.log('Slide changed to:', currentSlide);
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % sliderData.length;
    updateSlider(currentSlide);
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + sliderData.length) % sliderData.length;
    updateSlider(currentSlide);
}

function startAutoSlider() {
    stopAutoSlider();
    sliderInterval = setInterval(nextSlide, 4000);
}

function stopAutoSlider() {
    if (sliderInterval) {
        clearInterval(sliderInterval);
        sliderInterval = null;
    }
}

function setupSlider() {
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    const dots = document.querySelectorAll('.slider-dot');

    if (!document.getElementById('heroImage')) return;

    updateSlider(0);

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            startAutoSlider();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            startAutoSlider();
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            updateSlider(index);
            startAutoSlider();
        });
    });

    startAutoSlider();
}

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupDropdown();
    setupLogout();
    setupSlider();
    if (typeof loadCards === "function") {
    loadCards();
}

    const startBtn = document.querySelector('.btn-primary');
    if (startBtn && !isLoggedIn()) {
        startBtn.onclick = (e) => {
            e.preventDefault();
            alert('Эхлээд нэвтэрнэ үү!');
            window.location.href = 'login.html';
        };
    }
});