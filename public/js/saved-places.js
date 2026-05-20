const API_BASE_URL = "http://127.0.0.1:5000/api";
const savedPlacesList = document.getElementById("savedPlacesList");

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

async function loadSavedPlaces() {
  const token = getToken();

  if (!token) {
    alert("Та эхлээд нэвтэрнэ үү.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/favorites/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      savedPlacesList.innerHTML = "<p>Хадгалсан газар авахад алдаа гарлаа.</p>";
      return;
    }

    if (!result.data.length) {
      savedPlacesList.innerHTML = "<p>Танд хадгалсан газар байхгүй байна.</p>";
      return;
    }

    savedPlacesList.innerHTML = result.data.map((fav) => {
  const place = fav.place;
  if (!place) return "";

  const imageSrc = place.image
    ? (place.image.startsWith("http") ? place.image : `/images/${place.image}`)
    : "/images/default-place.jpg";

  return `
    <div class="saved-place-card">
      <div class="saved-place-img">
        <img src="${imageSrc}" alt="${place.name}">
      </div>

      <div class="saved-place-body">
        <div class="saved-province">
          <i class="fas fa-location-dot"></i> ${place.province || "Монгол"}
        </div>

        <h3>${place.name}</h3>
        <p>${place.description || "Тайлбар байхгүй."}</p>

        <div class="saved-actions">
          <a href="location-detail.html?id=${place._id}" class="saved-detail-btn">
            <i class="fas fa-circle-info"></i> Дэлгэрэнгүй
          </a>

          <button onclick="removeFavorite('${place._id}')" class="saved-remove-btn">
            <i class="fas fa-trash"></i> Устгах
          </button>
        </div>
      </div>
    </div>
  `;
}).join("");
  } catch (error) {
    console.error(error);
    savedPlacesList.innerHTML = "<p>Сервертэй холбогдоход алдаа гарлаа.</p>";
  }
}

async function removeFavorite(placeId) {
  const token = getToken();

  await fetch(`${API_BASE_URL}/favorites/${placeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  loadSavedPlaces();
}

document.addEventListener("DOMContentLoaded", loadSavedPlaces);