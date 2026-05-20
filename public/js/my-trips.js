const API_BASE_URL = "http://127.0.0.1:5000/api";
const myTripsList = document.getElementById("myTripsList");

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function openTrip(tripId) {
  window.location.href = `plantrip.html?tripId=${tripId}`;
}

async function loadMyTrips() {
  const token = getToken();

  if (!token) {
    alert("Та эхлээд нэвтэрнэ үү.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/trips/my`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      myTripsList.innerHTML = `<p class="empty-message">Аяллын мэдээлэл авахад алдаа гарлаа.</p>`;
      return;
    }

    if (!result.data.length) {
      myTripsList.innerHTML = `
        <div class="empty-trip-box">
          <i class="fas fa-route"></i>
          <h3>Одоогоор хадгалсан аялал алга</h3>
          <p>Аялал төлөвлөгч дээр маршрут гаргаад “Маршрут хадгалах” товч дарна уу.</p>
          <a href="plantrip.html">Аялал төлөвлөх</a>
        </div>
      `;
      return;
    }

    myTripsList.innerHTML = result.data.map((trip) => {
      const createdDate = trip.createdAt
        ? new Date(trip.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          })
        : "";

      const firstStep = trip.steps && trip.steps.length ? trip.steps[0] : null;

      return `
        <div class="trip-mini-card" onclick="openTrip('${trip._id}')">
          <div class="trip-map-thumb">
            <i class="fas fa-route"></i>
          </div>

          <div class="trip-mini-content">

            <h3>${trip.startAddress || "Эхлэх цэг"} → ${trip.endAddress || "Очих цэг"}</h3>

            <div class="trip-mini-meta">
              <span>${trip.durationText || "--"}</span>
              <span>·</span>
              <span>${trip.distanceText || "--"}</span>
              <span>·</span>
              <span><i class="fas fa-road"></i> ${firstStep?.distanceText || "--"}</span>
              <span>·</span>
              <span><i class="fas fa-clock"></i> ${firstStep?.durationText || "--"}</span>
            </div>

            <p>${createdDate} · Mongolia</p>
          </div>

          <button class="trip-delete-mini" onclick="event.stopPropagation(); deleteTrip('${trip._id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join("");

  } catch (error) {
    console.error(error);
    myTripsList.innerHTML = `<p class="empty-message">Сервертэй холбогдоход алдаа гарлаа.</p>`;
  }
}

async function deleteTrip(tripId) {
  const token = getToken();

  if (!confirm("Энэ аяллыг устгах уу?")) return;

  try {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.ok && data.success) {
      alert("Маршрут устгагдлаа.");
      loadMyTrips();
    } else {
      alert(data.message || "Устгахад алдаа гарлаа.");
    }
  } catch (error) {
    console.error(error);
    alert("Сервертэй холбогдоход алдаа гарлаа.");
  }
}

window.openTrip = openTrip;
window.deleteTrip = deleteTrip;

document.addEventListener("DOMContentLoaded", loadMyTrips);