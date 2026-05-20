const API_BASE_URL = 'http://127.0.0.1:5000/api';

const locationsGrid = document.getElementById('locations-grid');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error-message');

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function isLoggedIn() {
    return !!getToken();
}

document.addEventListener('DOMContentLoaded', async function () {
    await loadLocations();
    setupMapMarkers();
});

async function loadLocations() {
    try {
        if (loadingEl) loadingEl.style.display = 'flex';
        if (errorEl) errorEl.style.display = 'none';

        const result = await fetchData(`${API_BASE_URL}/locations`);
        const locations = result.data || [];

        console.log('Татагдсан өгөгдөл:', result);

        if (locations.length > 0) {
            displayLocations(locations);
        } else {
            locationsGrid.innerHTML = '<p class="no-data">Газрын мэдээлэл олдсонгүй</p>';
        }
    } catch (error) {
        console.error('Алдаа:', error);
        showError('Өгөгдөл татахад алдаа гарлаа. Сервер ажиллаж байгаа эсэхийг шалгана уу.');
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

async function fetchData(url) {
    const response = await fetch(url);
    const text = await response.text();

    console.log('Raw response:', text);

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error('Сервер JSON биш хариу буцаалаа');
    }

    if (!response.ok) {
        throw new Error(data.message || `HTTP алдаа: ${response.status}`);
    }

    return data;
}

function showError(message) {
    if (errorEl) {
        errorEl.style.display = 'flex';
        const errorSpan = errorEl.querySelector('span');
        if (errorSpan) errorSpan.textContent = message;
    }
}
function getCategoryFromName(name = '') {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('хийд')) {
        return { icon: 'fa-landmark', name: 'Түүхэн дурсгал' };
    } else if (nameLower.includes('нуур')) {
        return { icon: 'fa-water', name: 'Нуур' };
    } else if (nameLower.includes('уул')) {
        return { icon: 'fa-mountain', name: 'Уул' };
    } else if (nameLower.includes('хүрхрээ')) {
        return { icon: 'fa-water', name: 'Хүрхрээ' };
    } else if (nameLower.includes('тал')) {
        return { icon: 'fa-tree', name: 'Тал хээр' };
    } else if (nameLower.includes('рашаан')) {
        return { icon: 'fa-hot-tub', name: 'Рашаан' };
    } else {
        return { icon: 'fa-tree', name: 'Байгалийн үзэсгэлэнт газар' };
    }
}

function escapeHtml(str = '') {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function savePlace(placeId) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    alert("Та эхлээд нэвтэрнэ үү.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("http://127.0.0.1:5000/api/favorites/" + placeId, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok && data.success) {
      alert(data.message || "Газар хадгалагдлаа.");
    } else {
      alert(data.message || "Хадгалахад алдаа гарлаа.");
    }
  } catch (error) {
    console.error(error);
    alert("Сервертэй холбогдоход алдаа гарлаа.");
  }
}

function displayLocations(locations) {
    if (!locationsGrid) return;

    let html = '';

    locations.forEach((loc) => {
        const category = getCategoryFromName(loc.name);
        const description = loc.description || 'Тайлбар байхгүй';
        const truncatedDesc =
            description.length > 120 ? description.substring(0, 120) + '...' : description;

        let imageUrl = loc.image;
        if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `http://127.0.0.1:5000/images/${imageUrl}`;
        }
        if (!imageUrl || imageUrl.includes('undefined')) {
            imageUrl = 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&auto=format';
        }

        html += `
            <div class="location-card" data-province="${escapeHtml(loc.province || '')}">
                <div class="location-img" style="background-image: url('${imageUrl}')">
                    <span class="location-badge"><i class="fas fa-map-pin"></i> ${escapeHtml(loc.province || '')}</span>
                    <span class="location-category"><i class="fas ${category.icon}"></i> ${category.name}</span>
                </div>
                <div class="location-content">
                    <div class="location-province">
                        <i class="fas fa-location-dot"></i> ${escapeHtml(loc.province || '')} аймаг
                    </div>
                    <h3>${escapeHtml(loc.name || '')}</h3>
                    <p class="location-description">${escapeHtml(truncatedDesc)}</p>
                    <div class="location-actions">
                        <a href="location-detail.html?id=${loc._id}" class="btn-location btn-primary-sm">
                            <i class="fas fa-info-circle"></i> Дэлгэрэнгүй
                        </a>
                        ${
                            isLoggedIn()
                                ? `<button class="btn-location btn-primary-sm" onclick="savePlace('${loc._id}')">
                                        <i class="fas fa-bookmark"></i> Хадгалах
                                   </button>`
                                : ''
                        }
                    </div>
                </div>
            </div>
        `;
    });

    locationsGrid.innerHTML = html;
}

function setupMapMarkers() {
    document.querySelectorAll('.map-marker').forEach((marker) => {
        marker.addEventListener('click', function () {
            const provinceName = this.dataset.province;
            scrollToProvinceLocation(provinceName);
        });
    });
}

function scrollToProvinceLocation(provinceName) {
    const locationCards = document.querySelectorAll('.location-card');

    for (const card of locationCards) {
        if (card.dataset.province === provinceName) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });

            card.style.transition = '0.3s';
            card.style.boxShadow = '0 0 0 2px #e67e22';

            setTimeout(() => {
                card.style.boxShadow = '';
            }, 2000);
            break;
        }
    }
}

console.log('features-api.js ачаалагдлаа');