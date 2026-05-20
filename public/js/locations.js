// js/locations.js

const API_BASE_URL = 'http://localhost:3000/api';

// DOM элементүүд
const locationsContainer = document.getElementById('locations-container');
const provinceTabs = document.querySelectorAll('.province-tab');
const viewBtns = document.querySelectorAll('.view-btn');

// Төлөв (state)
let currentProvince = 'all';
let currentView = 'grid';
let allLocations = [];
let provinces = [];

// Хуудас ачаалагдах үед
document.addEventListener('DOMContentLoaded', async function() {
    await fetchProvinces();
    await fetchAllLocations();
    
    // Провинц товчлуурууд
    provinceTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            provinceTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentProvince = this.dataset.province;
            displayLocations();
        });
    });
    
    // View товчлуурууд
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            viewBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentView = this.dataset.view;
            locationsContainer.className = `locations-grid ${currentView === 'list' ? 'list-view' : ''}`;
            displayLocations();
        });
    });
});

// Аймгуудыг татах
async function fetchProvinces() {
    try {
        const response = await fetch(`${API_BASE_URL}/provinces`);
        provinces = await response.json();
        
        // Province tabs-ийг шинэчлэх (хэрэгтэй бол)
        updateProvinceTabs();
    } catch (error) {
        console.error('Аймгууд татахад алдаа:', error);
    }
}

// Бүх газруудыг татах
async function fetchAllLocations() {
    try {
        const response = await fetch(`${API_BASE_URL}/locations`);
        allLocations = await response.json();
        displayLocations();
    } catch (error) {
        console.error('Газрууд татахад алдаа:', error);
        // Алдаа гарвал өмнөх жишээ өгөгдлийг ашиглах
        useSampleData();
    }
}

// Жишээ өгөгдөл ашиглах
function useSampleData() {
    allLocations = [
        // Өмнөх locations array-г энд хуулах
    ];
    displayLocations();
}

// Province tabs шинэчлэх
function updateProvinceTabs() {
    // Хэрэв provinces ирсэн бол tabs-ийг шинэчлэх
}

// Газруудыг харуулах функц
function displayLocations() {
    let filteredLocations = allLocations;
    
    // Провинцээр шүүх
    if (currentProvince !== 'all') {
        filteredLocations = allLocations.filter(loc => loc.ProvinceName === currentProvince);
    }
    
    if (filteredLocations.length === 0) {
        locationsContainer.innerHTML = `
            <div class="no-locations">
                <i class="fas fa-map-marked-alt"></i>
                <h3>Газар олдсонгүй</h3>
                <p>Энэ аймагт одоогоор бүртгэлтэй газар байхгүй байна.</p>
            </div>
        `;
        return;
    }
    
    // HTML үүсгэх
    let html = '';
    filteredLocations.forEach(loc => {
        const categoryIcon = loc.Category === 'history' ? 'fa-landmark' : 'fa-tree';
        const categoryName = loc.Category === 'history' ? 'Түүхэн дурсгал' : 'Байгалийн газар';
        
        html += `
            <div class="location-card">
                <div class="location-img" style="background-image: url('${loc.ImageUrl || 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9'}')">
                    <span class="location-badge"><i class="fas fa-map-pin"></i> ${loc.ProvinceName}</span>
                    <span class="location-category"><i class="fas ${categoryIcon}"></i> ${categoryName}</span>
                </div>
                <div class="location-content">
                    <div class="location-province">
                        <i class="fas fa-location-dot"></i> ${loc.ProvinceName} аймаг
                    </div>
                    <h3>${loc.Name}</h3>
                    <p class="location-description">${loc.Description}</p>
                    
                    <div class="location-actions">
                        <a href="location-detail.html?id=${loc.LocationID}" class="btn-location btn-primary-sm">
                            <i class="fas fa-info-circle"></i> Дэлгэрэнгүй
                        </a>
                        <a href="${loc.VrImageUrl || '#'}" class="btn-location btn-outline-sm" target="_blank">
                            <i class="fas fa-vr-cardboard"></i> 360° үзэх
                        </a>
                    </div>
                </div>
            </div>
        `;
    });
    
    locationsContainer.innerHTML = html;
}