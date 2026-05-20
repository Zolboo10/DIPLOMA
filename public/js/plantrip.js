const ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjUxNDQ4NTM4ZjU3YzRkNmM5NzVjOTBlOGNiZmVlMmFjIiwiaCI6Im11cm11cjY0In0=";
const API_BASE_URL = window.API_BASE_URL || "http://127.0.0.1:5000/api";

let map;
let currentBaseLayer;
let routeLayer = null;

let startMarker = null;
let endMarker = null;
let resortMarkers = [];

let startPoint = null;
let endPoint = null;
let lastRouteData = null;
let mapClickStep = 0;

const startInput = document.getElementById("start-input");
const endInput = document.getElementById("end-input");
const tripDaysInput = document.getElementById("trip-days");
const getDirectionsBtn = document.getElementById("get-directions");
const saveTripBtn = document.getElementById("save-trip");
const newTripBtn = document.getElementById("new-trip");

const routeSummary = document.getElementById("route-summary");
const routeDistance = document.getElementById("route-distance");
const routeDuration = document.getElementById("route-duration");
const routeDays = document.getElementById("route-days");

const routesPanel = document.getElementById("routes-panel");
const routeOptions = document.getElementById("route-options");
const stepsPanel = document.getElementById("steps-panel");
const directionsSteps = document.getElementById("directions-steps");

const nearbyResortsPanel = document.getElementById("nearby-resorts-panel");
const nearbyResortsList = document.getElementById("nearby-resorts-list");
const closeNearbyPanelBtn = document.getElementById("close-nearby-panel");

const useMyLocationBtn = document.getElementById("use-my-location");
const swapPointsBtn = document.getElementById("swap-points");
const printStepsBtn = document.getElementById("print-steps");

const zoomInBtn = document.getElementById("zoom-in");
const zoomOutBtn = document.getElementById("zoom-out");
const myLocationMapBtn = document.getElementById("my-location-map");
const resetMapBtn = document.getElementById("reset-map");

const layersBtn = document.getElementById("layers-btn");
const layersMenu = document.getElementById("layers-menu");
const layerBtns = document.querySelectorAll("[data-layer]");

const smartTripPanel = document.getElementById("smart-trip-panel");
const smartTripMeta = document.getElementById("smart-trip-meta");
const smartTripResults = document.getElementById("smart-trip-results");
const smartRadiusInput = document.getElementById("smart-radius");

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function formatDurationFromMinutes(totalMinutes) {
  const minutes = Math.round(Number(totalMinutes || 0));

  if (minutes < 60) return `${minutes} мин`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) return `${hours} цаг`;

  return `${hours} цаг ${remainingMinutes} мин`;
}

function formatDurationFromSeconds(seconds) {
  const minutes = Math.round(Number(seconds || 0) / 60);
  return formatDurationFromMinutes(minutes);
}

function setLoadingState(isLoading) {
  if (!getDirectionsBtn) return;

  if (isLoading) {
    getDirectionsBtn.disabled = true;
    getDirectionsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Тооцоолж байна...';
  } else {
    getDirectionsBtn.disabled = false;
    getDirectionsBtn.innerHTML = '<i class="fas fa-route"></i> Маршрут харах';
  }
}

function createBaseLayer(type = "roadmap") {
  if (type === "satellite") {
    return L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri" }
    );
  }

  if (type === "terrain") {
    return L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenTopoMap" }
    );
  }

  return L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "© OpenStreetMap" }
  );
}

function makeMarker(lat, lng, type) {
  const iconUrlMap = {
    start: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    end: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    my: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    resort: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png"
  };

  return L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: iconUrlMap[type] || iconUrlMap.start,
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  });
}

function initMap() {
  map = L.map("map", {
    center: [46.8625, 103.8467],
    zoom: 6,
    zoomControl: false
  });

  currentBaseLayer = createBaseLayer("roadmap");
  currentBaseLayer.addTo(map);

  map.on("click", handleMapClick);
  bindEvents();
}

async function handleMapClick(e) {
  const lat = e.latlng.lat;
  const lng = e.latlng.lng;
  const address = await reverseGeocode(lat, lng);

  if (mapClickStep === 0) {
    clearRouteOnly();

    startPoint = { lat, lng, address, source: "map" };
    startInput.value = address;

    if (startMarker) map.removeLayer(startMarker);
    startMarker = makeMarker(lat, lng, "start")
      .addTo(map)
      .bindPopup("Эхлэх цэг")
      .openPopup();

    mapClickStep = 1;
    return;
  }

  if (mapClickStep === 1) {
    endPoint = { lat, lng, address, source: "map" };
    endInput.value = address;

    if (endMarker) map.removeLayer(endMarker);
    endMarker = makeMarker(lat, lng, "end")
      .addTo(map)
      .bindPopup("Очих цэг")
      .openPopup();

    mapClickStep = 2;
    await getDirections();
    return;
  }

  resetTripSelection();

  startPoint = { lat, lng, address, source: "map" };
  startInput.value = address;

  startMarker = makeMarker(lat, lng, "start")
    .addTo(map)
    .bindPopup("Эхлэх цэг")
    .openPopup();

  mapClickStep = 1;
}

function resetTripSelection() {
  if (startMarker) map.removeLayer(startMarker);
  if (endMarker) map.removeLayer(endMarker);
  if (routeLayer) map.removeLayer(routeLayer);

  clearResortMarkers();

  startMarker = null;
  endMarker = null;
  routeLayer = null;
  startPoint = null;
  endPoint = null;
  lastRouteData = null;
  mapClickStep = 0;

  startInput.value = "";
  endInput.value = "";

  routeSummary.style.display = "none";
  routesPanel.style.display = "none";
  stepsPanel.style.display = "none";
  smartTripPanel.style.display = "none";
  saveTripBtn.style.display = "none";
  nearbyResortsPanel.style.display = "none";

  routeOptions.innerHTML = "";
  directionsSteps.innerHTML = "";
  smartTripResults.innerHTML = "";
  nearbyResortsList.innerHTML = "";
}

function clearRouteOnly() {
  if (routeLayer) map.removeLayer(routeLayer);

  routeLayer = null;
  lastRouteData = null;

  clearResortMarkers();

  routeSummary.style.display = "none";
  routesPanel.style.display = "none";
  stepsPanel.style.display = "none";
  smartTripPanel.style.display = "none";
  saveTripBtn.style.display = "none";
  nearbyResortsPanel.style.display = "none";
}

function clearStoredPoint(which) {
  if (which === "start") {
    startPoint = null;
    mapClickStep = 0;
  }

  if (which === "end") {
    endPoint = null;
    if (startPoint) mapClickStep = 1;
  }
}

function isCoordinateText(value) {
  return /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(value || "");
}

function parseCoordinateText(value) {
  const [lat, lng] = value.split(",").map((item) => Number(item.trim()));

  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return {
    lat,
    lng,
    address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    source: "typed-coordinate"
  };
}

//gazriin neriig coordinate bolgodog functs
async function geocodeAddress(query) {
  const rawQuery = (query || "").trim();
  if (!rawQuery) return null;

  if (isCoordinateText(rawQuery)) {
    return parseCoordinateText(rawQuery);
  }

  const searchQueries = [
    `${rawQuery}, Mongolia`,
    `${rawQuery}, Монгол`,
    rawQuery
  ];

  try {
    for (const searchQuery of searchQueries) {
      const params = new URLSearchParams({
        format: "json",
        limit: "1",
        countrycodes: "mn",
        addressdetails: "1",
        q: searchQuery
      });

      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "Accept-Language": "mn,en"
        }
      });

      if (!res.ok) continue;

      const data = await res.json();
      if (!Array.isArray(data) || !data.length) continue;

      const bestMatch = data[0];

      return {
        lat: parseFloat(bestMatch.lat),
        lng: parseFloat(bestMatch.lon),
        address: bestMatch.display_name || rawQuery,
        originalText: rawQuery,
        source: "typed"
      };
    }

    return null;
  } catch (err) {
    console.error("Geocode error:", err);
    return null;
  }
}

//coordinate-iig hayg bolgono. 47.918000, 106.917000-Сүхбаатарын талбай, Улаанбаатар, Монгол geh met
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Accept-Language": "mn,en"
      }
    });

    const data = await res.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (err) {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

//marchrutiin ehleh bolon ochih tsegiig olj butsaadag funts
async function resolvePoint(type) {
  if (type === "start") {
    if (startPoint) return startPoint;
    return await geocodeAddress(startInput.value.trim());
  }

  if (endPoint) return endPoint;
  return await geocodeAddress(endInput.value.trim());
}

function updateMarkers() {
  if (startMarker) map.removeLayer(startMarker);
  if (endMarker) map.removeLayer(endMarker);

  if (startPoint) {
    startMarker = makeMarker(startPoint.lat, startPoint.lng, "start")
      .addTo(map)
      .bindPopup("Эхлэх цэг");
  }

  if (endPoint) {
    endMarker = makeMarker(endPoint.lat, endPoint.lng, "end")
      .addTo(map)
      .bindPopup("Очих цэг");
  }
}

//marshrutiig map deer zurj haruulna
function renderRouteGeoJSON(geojson) {
  if (routeLayer) map.removeLayer(routeLayer);

  routeLayer = L.geoJSON(geojson, {
    style: {
      color: "#d97706",
      weight: 5,
      opacity: 0.85
    }
  }).addTo(map);

  map.fitBounds(routeLayer.getBounds(), { padding: [30, 30] });
}

//chigleliig alham alhamaar haruulna.
function displayDirectionsFromORS(feature) {
  directionsSteps.innerHTML = "";

  const segments = feature.properties?.segments || [];
  const steps = segments[0]?.steps || [];

  if (!steps.length) {
    directionsSteps.innerHTML = `<div class="step-item">Алхамчилсан чиглэл олдсонгүй.</div>`;
    return;
  }

  steps.forEach((step, index) => {
    const distanceKm = ((step.distance || 0) / 1000).toFixed(1);
    const durationText = formatDurationFromSeconds(step.duration);

    const stepDiv = document.createElement("div");
    stepDiv.className = "step-item";
    stepDiv.innerHTML = `
      <div>
        <strong>${index + 1}.</strong> ${step.instruction || "Чиглэл байхгүй"}
        <div class="step-distance">${distanceKm} км • ${durationText}</div>
      </div>
    `;

    directionsSteps.appendChild(stepDiv);
  });
}

function showRouteSummary(summary) {
  const km = ((summary.distance || 0) / 1000).toFixed(1);
  const durationText = formatDurationFromSeconds(summary.duration);
  const tripDays = Math.max(1, Number(tripDaysInput.value || 1));

  routeDistance.innerText = `${km} км`;
  routeDuration.innerText = durationText;
  routeDays.innerText = `${tripDays} өдөр`;
  routeSummary.style.display = "flex";
}

function renderRouteInfo(feature) {
  const summary = feature.properties?.summary;
  if (!summary) return;

  const km = ((summary.distance || 0) / 1000).toFixed(1);
  const durationText = formatDurationFromSeconds(summary.duration);

  routeOptions.innerHTML = `
    <div class="route-option active">
      <span>Үндсэн маршрут</span>
      <span>${km} км • ${durationText}</span>
    </div>
  `;

  routesPanel.style.display = "block";
}

function prepareRouteForSaving(feature) {
  const summary = feature.properties?.summary || {};
  const segments = feature.properties?.segments || [];
  const steps = segments[0]?.steps || [];
  const tripDays = Math.max(1, Number(tripDaysInput.value || 1));

  lastRouteData = {
    startAddress: startPoint?.originalText || startPoint?.address || startInput.value.trim(),
    endAddress: endPoint?.originalText || endPoint?.address || endInput.value.trim(),

    startPoint: {
      lat: startPoint.lat,
      lng: startPoint.lng,
      address: startPoint.address
    },

    endPoint: {
      lat: endPoint.lat,
      lng: endPoint.lng,
      address: endPoint.address
    },

    routeGeoJSON: feature,
    travelMode: "DRIVING",
    tripDays,

    distanceText: `${((summary.distance || 0) / 1000).toFixed(1)} км`,
    durationText: formatDurationFromSeconds(summary.duration),

    distanceValue: summary.distance || 0,
    durationValue: summary.duration || 0,
    routeIndex: 0,

    steps: steps.map((step) => ({
      instruction: step.instruction || "",
      distanceText: `${((step.distance || 0) / 1000).toFixed(1)} км`,
      durationText: formatDurationFromSeconds(step.duration)
    }))
  };
}

async function fetchFeaturedPlaces() {
  try {
    const response = await fetch(`${API_BASE_URL}/locations`);
    const result = await response.json();

    if (response.ok && result.success) return result.data || [];
    return [];
  } catch (error) {
    console.error("Fetch featured places error:", error);
    return [];
  }
}

function getDistanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function interpolatePoint(start, end, ratio) {
  return {
    lat: start.lat + (end.lat - start.lat) * ratio,
    lng: start.lng + (end.lng - start.lng) * ratio
  };
}

function pickSmartStops({ start, end, days, places, radiusKm }) {
  if (!start || !end || !days || !Array.isArray(places)) return [];

  const usedIds = new Set();
  const results = [];

  for (let day = 1; day <= days; day++) {
    const ratio = days === 1 ? 1 : day / days;
    const targetPoint = interpolatePoint(start, end, ratio);
    const candidates = [];

    for (const place of places) {
      if (!place.location || typeof place.location.lat !== "number" || typeof place.location.lng !== "number") {
        continue;
      }

      const placeId = place._id?.toString() || `${place.name}-${place.province}`;
      if (usedIds.has(placeId)) continue;

      const placePoint = {
        lat: place.location.lat,
        lng: place.location.lng
      };

      const distanceFromTarget = getDistanceKm(targetPoint, placePoint);

      if (distanceFromTarget <= radiusKm) {
        candidates.push({
          ...place,
          _smartDistanceKm: distanceFromTarget
        });
      }
    }

    candidates.sort((a, b) => a._smartDistanceKm - b._smartDistanceKm);

    if (candidates.length > 0) {
      const bestPlace = candidates[0];
      usedIds.add(bestPlace._id?.toString() || `${bestPlace.name}-${bestPlace.province}`);
      results.push({ day, place: bestPlace });
    }
  }

  return results;
}

function escapeForJs(str = "") {
  return String(str).replace(/'/g, "\\'");
}

window.openSmartPlace = function (id) {
  window.location.href = `location-detail.html?id=${id}`;
};

window.fillSmartDestination = async function (name, lat, lng) {
  endPoint = {
    lat,
    lng,
    address: await reverseGeocode(lat, lng),
    originalText: name,
    source: "smart-trip"
  };

  endInput.value = name;
  updateMarkers();
  map.setView([lat, lng], 10);

  if (startInput.value.trim()) {
    getDirections();
  }
};

function renderSmartTrip({ days, totalDistanceKm, smartStops, radiusKm }) {
  smartTripPanel.style.display = "block";

  smartTripMeta.innerHTML = `
    Нийт зай: <strong>${totalDistanceKm.toFixed(1)} км</strong><br>
    Аяллын хоног: <strong>${days} өдөр</strong><br>
    Өдөрт ойролцоогоор: <strong>${Math.ceil(totalDistanceKm / Math.max(days, 1))} км</strong><br>
    Санал болгох хүрээ: <strong>зорилтот цэгээс ${radiusKm} км дотор</strong>
  `;

  if (!smartStops.length) {
    smartTripResults.innerHTML = `<div class="smart-stop-card">Санал болгох газар олдсонгүй.</div>`;
    return;
  }

  smartTripResults.innerHTML = smartStops.map((item) => {
    const place = item.place;
    const desc = place.description || "Тайлбар байхгүй";
    const shortDesc = desc.length > 120 ? `${desc.slice(0, 120)}...` : desc;

    return `
      <div class="smart-stop-card">
        <span class="smart-stop-day">${item.day}-р өдөр</span>
        <h4>${place.name} · ${place.province}</h4>
        <p>${shortDesc}</p>
        <div class="smart-stop-distance">
          Чиглэлийн зорилтот цэгээс ойролцоогоор ${place._smartDistanceKm.toFixed(1)} км
        </div>
        <div class="smart-stop-actions">
          <button class="btn-smart" onclick="fillSmartDestination('${escapeForJs(place.name)}', ${place.location.lat}, ${place.location.lng})">
            Очих цэг болгох
          </button>
          <button class="btn-smart" onclick="openSmartPlace('${place._id}')">
            Дэлгэрэнгүй
          </button>
        </div>
      </div>
    `;
  }).join("");
}

async function buildSmartTripSuggestions() {
  if (!startPoint || !endPoint) return;

  const days = Math.max(1, Number(tripDaysInput.value || 1));
  const radiusKm = Number(smartRadiusInput?.value || 250);
  const places = await fetchFeaturedPlaces();
  const totalDistanceKm = getDistanceKm(startPoint, endPoint);

  const smartStops = pickSmartStops({
    start: startPoint,
    end: endPoint,
    days,
    places,
    radiusKm
  });

  renderSmartTrip({
    days,
    totalDistanceKm,
    smartStops,
    radiusKm
  });
}
//marshrut gargah functs
async function getDirections() {
  const startText = startInput.value.trim();
  const endText = endInput.value.trim();

  if (!navigator.onLine) {
    const cached = localStorage.getItem("cachedRoute");
    if (cached) {
      const parsed = JSON.parse(cached);
      const feature = parsed.route.features[0];

      startPoint = parsed.startPoint;
      endPoint = parsed.endPoint;
      
      startInput.value = startPoint.originalText || startPoint.address;
      endInput.value = endPoint.originalText || endPoint.address;

      updateMarkers();
      renderRouteGeoJSON(parsed.route);
      renderRouteInfo(feature);
      displayDirectionsFromORS(feature);
      showRouteSummary(parsed.summary);

      routesPanel.style.display = "block";
      stepsPanel.style.display = "block";

      alert("Offline хадгалсан маршрут харууллаа.");
      return;
    }

    alert("Интернэт байхгүй байна. Өмнө хадгалсан маршрут олдсонгүй.");
    return;
  }

  if (!startText || !endText) {
    alert("Эхлэх болон очих цэгээ оруулна уу.");
    return;
  }

  setLoadingState(true);
  saveTripBtn.style.display = "none";
  smartTripPanel.style.display = "none";
  routesPanel.style.display = "none";
  stepsPanel.style.display = "none";
  nearbyResortsPanel.style.display = "none";
  lastRouteData = null;

  try {
    const [originPoint, destinationPoint] = await Promise.all([
      resolvePoint("start"),
      resolvePoint("end")
    ]);

    if (!originPoint && !destinationPoint) {
      throw new Error("Эхлэх болон очих цэг хоёулаа олдсонгүй. Газрын нэрээ тодорхой бичнэ үү.");
    }

    if (!originPoint) {
      throw new Error(`"${startText}" гэсэн эхлэх цэг олдсонгүй.`);
    }

    if (!destinationPoint) {
      throw new Error(`"${endText}" гэсэн очих цэг олдсонгүй.`);
    }

    startPoint = originPoint;
    endPoint = destinationPoint;

    startInput.value = startPoint.originalText || startText;
    endInput.value = endPoint.originalText || endText;

    updateMarkers();

    const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        coordinates: [
          [startPoint.lng, startPoint.lat],
          [endPoint.lng, endPoint.lat]
        ],
        instructions: true,
        radiuses: [5000, 5000]
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("ORS error:", data);
      throw new Error(data.error?.message || "Маршрут тооцоолоход алдаа гарлаа.");
    }

    if (!data.features || !data.features.length) {
      throw new Error("Маршрут олдсонгүй.");
    }

    const feature = data.features[0];
    const summary = feature.properties?.summary;

    const routeCacheData = {
  route: data,
  summary,
  startPoint,
  endPoint,
  startText: startInput.value,
  endText: endInput.value,
  tripDays: tripDaysInput.value
};

localStorage.setItem("cachedRoute", JSON.stringify(routeCacheData));
localStorage.setItem("lastRoute", JSON.stringify(routeCacheData));

    renderRouteGeoJSON(data);
    renderRouteInfo(feature);
    displayDirectionsFromORS(feature);
    showRouteSummary(summary);
    prepareRouteForSaving(feature);

    await buildSmartTripSuggestions();
    await loadNearbyResorts();

    stepsPanel.style.display = "block";
    saveTripBtn.style.display = "block";
  } catch (err) {
    console.error(err);
    alert(err.message || "Маршрут олдсонгүй.");

    if (startPoint && endPoint) {
      const dist = getDistanceKm(startPoint, endPoint).toFixed(1);
      routeDistance.innerText = `${dist} км`;
      routeDuration.innerText = "-";
      routeDays.innerText = `${Math.max(1, Number(tripDaysInput.value || 1))} өдөр`;
      routeSummary.style.display = "flex";
    }
  } finally {
    setLoadingState(false);
  }
}

function clearResortMarkers() {
  resortMarkers.forEach(marker => map.removeLayer(marker));
  resortMarkers = [];
}

function renderResortMarkers(resorts) {
  clearResortMarkers();

  resorts.forEach((resort) => {
    if (!resort.location || typeof resort.location.lat !== "number" || typeof resort.location.lng !== "number") return;

    const marker = makeMarker(resort.location.lat, resort.location.lng, "resort")
      .addTo(map)
      .bindPopup(`
        <strong>${resort.name}</strong><br>
        ${resort.type || ""}<br>
        Очих цэгээс ${resort.distanceKm} км
      `);

    resortMarkers.push(marker);
  });
}

async function loadNearbyResorts() {
  if (!endPoint) return;

  nearbyResortsPanel.style.display = "block";
  nearbyResortsList.innerHTML = `<div class="nearby-empty">Ачааллаж байна...</div>`;
  clearResortMarkers();

  const lat = endPoint.lat;
  const lng = endPoint.lng;
  const radiusMeters = 50000; 

  const query = `
    [out:json][timeout:30];
    (
      node["tourism"="camp_site"](around:${radiusMeters},${lat},${lng});
      node["tourism"="ger_camp"](around:${radiusMeters},${lat},${lng});
      node["tourism"="resort"](around:${radiusMeters},${lat},${lng});
      node["tourism"="hotel"](around:${radiusMeters},${lat},${lng});
      node["tourism"="guest_house"](around:${radiusMeters},${lat},${lng});
      way["tourism"="camp_site"](around:${radiusMeters},${lat},${lng});
      way["tourism"="ger_camp"](around:${radiusMeters},${lat},${lng});
    );
    out center tags;
  `;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query
    });

    const data = await res.json();
    const elements = data.elements || [];

    console.log("Overpass илэрц:", elements.length, elements);

    if (!elements.length) {
      nearbyResortsList.innerHTML = `
        <div class="nearby-empty">Очих цэгээс 100 км дотор амралтын газар олдсонгүй.</div>`;
      return;
    }

    const typeMap = {
      camp_site: "Жуулчны бааз",
      ger_camp: "Гэр бааз",
      resort: "Амралтын газар",
      hotel: "Зочид буудал",
      guest_house: "Гэр буудал"
    };

    const resorts = elements
      .map(el => {
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        if (!elLat || !elLng) return null;

        return {
          name: el.tags?.name || el.tags?.["name:mn"] || "Нэргүй газар",
          type: typeMap[el.tags?.tourism] || el.tags?.tourism || "",
          phone: el.tags?.phone || el.tags?.["contact:phone"] || "",
          website: el.tags?.website || "",
          location: { lat: elLat, lng: elLng },
          distanceKm: getDistanceKm({ lat, lng }, { lat: elLat, lng: elLng }).toFixed(1)
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20);

    resorts.forEach(resort => {
      const marker = makeMarker(resort.location.lat, resort.location.lng, "resort")
        .addTo(map)
        .bindPopup(`<strong>${resort.name}</strong><br>${resort.type}<br>${resort.distanceKm} км`);
      resortMarkers.push(marker);
    });

    nearbyResortsList.innerHTML = resorts.map(resort => `
      <div class="nearby-resort-card">
        <h4>${resort.name}</h4>
        <p><i class="fas fa-location-dot"></i> Очих цэгээс ${resort.distanceKm} км</p>
        ${resort.phone ? `<p><i class="fas fa-phone"></i> ${resort.phone}</p>` : ""}
        ${resort.website ? `<p><a href="${resort.website}" target="_blank">Вэбсайт</a></p>` : ""}
        <span class="nearby-type">${resort.type}</span>
      </div>
    `).join("");

  } catch (error) {
    console.error("Overpass error:", error);
    nearbyResortsList.innerHTML = `<div class="nearby-empty">Өгөгдөл татахад алдаа гарлаа.</div>`;
  }
}

async function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Таны browser байршил дэмжихгүй байна.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const address = await reverseGeocode(lat, lng);

      startPoint = {
        lat,
        lng,
        address,
        source: "geolocation"
      };

      startInput.value = address;
      mapClickStep = 1;

      if (startMarker) map.removeLayer(startMarker);
      startMarker = makeMarker(lat, lng, "my")
        .addTo(map)
        .bindPopup("Миний байршил");

      map.setView([lat, lng], 14);

      if (endInput.value.trim()) await getDirections();
    },
    () => alert("Байршлыг тодорхойлж чадсангүй."),
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function swapPoints() {
  const tempText = startInput.value;
  startInput.value = endInput.value;
  endInput.value = tempText;

  const tempPoint = startPoint;
  startPoint = endPoint;
  endPoint = tempPoint;

  updateMarkers();

  if (startInput.value.trim() && endInput.value.trim()) {
    getDirections();
  }
}

function printDirections() {
  const steps = directionsSteps.innerHTML;
  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <html>
    <head>
      <title>Чиглэл - ${startInput.value} → ${endInput.value}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #d97706; }
        .step-item { margin-bottom: 15px; padding: 10px; border-bottom: 1px solid #ddd; }
        .step-distance { color: #666; font-size: 12px; margin-top: 5px; }
      </style>
    </head>
    <body>
      <h1>${startInput.value} → ${endInput.value}</h1>
      <p>Аяллын хоног: ${Math.max(1, Number(tripDaysInput.value || 1))} өдөр</p>
      <div>${steps}</div>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.print();
}

async function saveCurrentTrip() {
  const token = getToken();

  if (!token) {
    alert("Та эхлээд нэвтэрнэ үү.");
    window.location.href = "login.html";
    return;
  }

  if (!lastRouteData) {
    alert("Хадгалах маршрут олдсонгүй.");
    return;
  }

  try {
    saveTripBtn.disabled = true;
    saveTripBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Хадгалж байна...';

    const response = await fetch(`${API_BASE_URL}/trips`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(lastRouteData)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert("Маршрут амжилттай хадгалагдлаа.");
    } else {
      alert(data.message || "Маршрут хадгалахад алдаа гарлаа.");
    }
  } catch (error) {
    console.error("Save trip error:", error);
    alert("Маршрут хадгалахад алдаа гарлаа.");
  } finally {
    saveTripBtn.disabled = false;
    saveTripBtn.innerHTML = '<i class="fas fa-bookmark"></i> Маршрут хадгалах';
  }
}

function bindEvents() {
  useMyLocationBtn?.addEventListener("click", getCurrentLocation);
  myLocationMapBtn?.addEventListener("click", getCurrentLocation);
  getDirectionsBtn?.addEventListener("click", getDirections);
  swapPointsBtn?.addEventListener("click", swapPoints);
  printStepsBtn?.addEventListener("click", printDirections);
  saveTripBtn?.addEventListener("click", saveCurrentTrip);
  newTripBtn?.addEventListener("click", () => {
  localStorage.removeItem("lastRoute");
  resetTripSelection();
  map.setView([46.8625, 103.8467], 6);
});

  closeNearbyPanelBtn?.addEventListener("click", () => {
    nearbyResortsPanel.style.display = "none";
  });

  startInput?.addEventListener("input", () => clearStoredPoint("start"));
  endInput?.addEventListener("input", () => clearStoredPoint("end"));

  startInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") getDirections();
  });

  endInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") getDirections();
  });

  tripDaysInput?.addEventListener("input", () => {
    routeDays.innerText = `${Math.max(1, Number(tripDaysInput.value || 1))} өдөр`;

    if (startPoint && endPoint) {
      buildSmartTripSuggestions();
    }
  });

  smartRadiusInput?.addEventListener("change", () => {
    if (startPoint && endPoint) {
      buildSmartTripSuggestions();
    }
  });

  zoomInBtn?.addEventListener("click", () => map.zoomIn());
  zoomOutBtn?.addEventListener("click", () => map.zoomOut());

  resetMapBtn?.addEventListener("click", () => {
    map.setView([46.8625, 103.8467], 6);
    resetTripSelection();
  });

  layersBtn?.addEventListener("click", () => {
    layersMenu.style.display = layersMenu.style.display === "block" ? "none" : "block";
  });

  layerBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const layerType = btn.getAttribute("data-layer");

      if (currentBaseLayer) map.removeLayer(currentBaseLayer);

      currentBaseLayer = createBaseLayer(layerType);
      currentBaseLayer.addTo(map);
      layersMenu.style.display = "none";
    });
  });

  document.addEventListener("click", (e) => {
    if (!layersBtn?.contains(e.target) && !layersMenu?.contains(e.target)) {
      layersMenu.style.display = "none";
    }
  });
}

function updateOfflineStatus() {
  const banner = document.getElementById("offline-banner");

  if (!banner) return;

  banner.style.display = navigator.onLine ? "none" : "block";
}

//refresh hiisen ch omnoh marchrut ni baih functs
function loadLastRouteFromStorage() {
  const saved = localStorage.getItem("lastRoute");
  if (!saved) return false;

  try {
    const parsed = JSON.parse(saved);

    if (!parsed.route || !parsed.route.features || !parsed.route.features.length) {
      return false;
    }

    const feature = parsed.route.features[0];

    startPoint = parsed.startPoint;
    endPoint = parsed.endPoint;

    startInput.value = parsed.startText || startPoint.address || "";
    endInput.value = parsed.endText || endPoint.address || "";
    tripDaysInput.value = parsed.tripDays || 1;

    updateMarkers();
    renderRouteGeoJSON(parsed.route);
    renderRouteInfo(feature);
    displayDirectionsFromORS(feature);
    showRouteSummary(parsed.summary);
    prepareRouteForSaving(feature);

    routesPanel.style.display = "block";
    stepsPanel.style.display = "block";
    saveTripBtn.style.display = "block";

    buildSmartTripSuggestions();
    loadNearbyResorts();

    return true;
  } catch (error) {
    console.error("Last route restore error:", error);
    return false;
  }
}

async function loadSavedTripOnMap(tripId) {
  const token = getToken();

  try {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      alert("Маршрут ачаалж чадсангүй.");
      return;
    }

    const trip = result.data;

    startInput.value = trip.startAddress || "";
    endInput.value = trip.endAddress || "";
    tripDaysInput.value = trip.tripDays || 1;

    routeDistance.innerText = trip.distanceText || "-- км";
    routeDuration.innerText = trip.durationText || "--";
    routeDays.innerText = `${trip.tripDays || 1} өдөр`;
    routeSummary.style.display = "flex";

    if (trip.startPoint && trip.endPoint) {
      startPoint = trip.startPoint;
      endPoint = trip.endPoint;
      updateMarkers();
    }

    routesPanel.style.display = "block";
    stepsPanel.style.display = "block";
    saveTripBtn.style.display = "none";

    if (trip.routeGeoJSON) {
      const geojson = {
        type: "FeatureCollection",
        features: [trip.routeGeoJSON]
      };

      renderRouteGeoJSON(geojson);
      renderRouteInfo(trip.routeGeoJSON);
      displayDirectionsFromORS(trip.routeGeoJSON);
      return;
    }

    directionsSteps.innerHTML = trip.steps && trip.steps.length
      ? trip.steps.map((step, index) => `
        <div class="step-item">
          <div>
            <strong>${index + 1}.</strong> ${step.instruction || "Чиглэл байхгүй"}
            <div class="step-distance">
              ${step.distanceText || ""} ${step.durationText ? "• " + step.durationText : ""}
            </div>
          </div>
        </div>
      `).join("")
      : `<div class="step-item">Алхамчилсан чиглэл хадгалагдаагүй байна.</div>`;

  } catch (error) {
    console.error("Saved trip load error:", error);
    alert("Сервертэй холбогдоход алдаа гарлаа.");
  }
}

window.addEventListener("online", updateOfflineStatus);
window.addEventListener("offline", updateOfflineStatus);

document.addEventListener("DOMContentLoaded", async () => {
  initMap();
  updateOfflineStatus();

  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("tripId");

  if (tripId) {
    await loadSavedTripOnMap(tripId);
    return;
  }

  loadLastRouteFromStorage();
});