const API_BASE_URL = "http://127.0.0.1:5000/api";

const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error-message");
const detailContent = document.getElementById("detail-content");

const placeImage = document.getElementById("place-image");
const placeName = document.getElementById("place-name");
const placeProvince = document.getElementById("place-province");
const placeProvinceText = document.getElementById("place-province-text");
const placeDescription = document.getElementById("place-description");
const placeCoordinates = document.getElementById("place-coordinates");
const saveBtn = document.getElementById("save-btn");

let currentPlaceId = null;

document.addEventListener("DOMContentLoaded", loadLocationDetail);

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function getLocationId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadLocationDetail() {
  const id = getLocationId();
  currentPlaceId = id;

  if (!id) {
    showError("Газрын ID олдсонгүй.");
    return;
  }

  try {
    loadingEl.style.display = "flex";
    errorEl.style.display = "none";

    const res = await fetch(`${API_BASE_URL}/locations/${id}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Газрын мэдээлэл олдсонгүй.");
    }

    displayLocation(data.data);
  } catch (error) {
    console.error(error);
    showError(error.message || "Мэдээлэл татахад алдаа гарлаа.");
  } finally {
    loadingEl.style.display = "none";
  }
}

function displayLocation(loc) {
  let imageUrl = loc.image;

  if (imageUrl && !imageUrl.startsWith("http")) {
    imageUrl = `http://127.0.0.1:5000/images/${imageUrl}`;
  }

  if (!imageUrl || imageUrl.includes("undefined")) {
    imageUrl = "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&auto=format";
  }

  placeImage.src = imageUrl;
  placeName.textContent = loc.name || "Нэргүй газар";
  placeProvince.textContent = `${loc.province || ""} аймаг`;
  placeDescription.textContent =
  loc.detailDescription || loc.description || "Тайлбар мэдээлэл байхгүй.";

  const lat = loc.location?.lat;
const lng = loc.location?.lng;

detailContent.style.display = "block";

if (lat && lng) {
  setTimeout(() => {
    initMap(lat, lng, loc.name);
  }, 100);
}


  if (!getToken()) {
    saveBtn.style.display = "none";
  }
}

saveBtn.addEventListener("click", async () => {
  const token = getToken();

  if (!token) {
    alert("Та эхлээд нэвтэрнэ үү.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/favorites/${currentPlaceId}`, {
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
});

function showError(message) {
  errorEl.style.display = "flex";
  errorEl.querySelector("span").textContent = message;
}

function initMap(lat, lng, title) {
  const map = L.map("detail-map").setView([lat, lng], 8);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(`<b>${title}</b>`)
    .openPopup();
}