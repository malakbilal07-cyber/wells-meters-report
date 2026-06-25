// ===== GLOBALS =====
let currentUser = null;
let currentPage = 'overview';
let wellsData = [];
let metersData = [];
let map = null;
let mapMarkers = [];
let kmlMap = null;
let kmlMarkers = [];
let activeFilter = 'all';
let kmlFilter = 'all';
let wellChart = null, rehabChart = null, meterChart = null;

// ===== LOGIN =====
const users = {
    admin: 'advacon2024',
    manager: 'phase2@alula',
    field: 'oasis#field'
};

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    if (users[user] && users[user] === pass) {
        currentUser = user;
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        document.getElementById('sidebarUser').textContent = user;
        document.getElementById('topUser').textContent = user;
        initApp();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
});

document.getElementById('signOutBtn').addEventListener('click', function() {
    currentUser = null;
    document.getElementById('app').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('loginError').style.display = 'none';
});

// ===== SIDEBAR NAV =====
document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const page = this.dataset.page;
        navigateTo(page);
    });
});

function navigateTo(page) {
    currentPage = page;
    // Update sidebar
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    document.querySelector(`.sidebar-nav a[data-page="${page}"]`)?.classList.add('active');
    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');
    // Update title
    const titles = {
        overview: 'Project Overview',
        dashboard: 'Dashboard',
        map: 'Well & Meter Locations Map',
        kmlmap: 'KML Map',
        wells: 'Wells List',
        meters: 'Meters List',
        upload: 'Upload Excel'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;
    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    // Trigger page-specific init
    if (page === 'map') initMap();
    if (page === 'kmlmap') initKmlMap();
    if (page === 'dashboard') renderDashboard();
    if (page === 'wells') renderWells();
    if (page === 'meters') renderMeters();
    if (page === 'overview') renderOverview();
}

// ===== MOBILE MENU =====
document.getElementById('mobileMenuBtn').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('open');
});

// ===== INIT APP =====
function initApp() {
    loadData();
    renderOverview();
    renderDashboard();
    renderWells();
    renderMeters();
    navigateTo('overview');
    // Clock
    setInterval(() => {
        document.getElementById('sidebarTime').textContent = new Date().toLocaleTimeString();
    }, 1000);
}

// ===== LOAD DATA =====
function loadData() {
    wellsData = window.wellsData || [];
    metersData = window.metersData || [];
    // If no wellsData, generate from Excel data
    if (!wellsData.length && typeof EXCEL_DATA !== 'undefined') {
        wellsData = EXCEL_DATA.map((r, i) => ({
            id: r['Well ID'] || String(i+1).padStart(3,'0'),
            status: r['Well Status'] || 'Non-Active',
            rehab: r['Rehab'] || 'Not Required',
            maintained: r['Maintained'] || 'No',
            disconnection: r['Disconnection Reason'] || '-',
            lat: parseFloat(r['Latitude']) || 0,
            lng: parseFloat(r['Longitude']) || 0,
            owner: r['Owner'] || '-',
            notes: r['Notes'] || ''
        }));
    }
    // Generate meters from wells if none
    if (!metersData.length && wellsData.length) {
        metersData = wellsData.filter(w => w.status === 'Active').map((w, i) => ({
            id: `M${String(i+1).padStart(3,'0')}`,
            wellId: w.id,
            status: 'Working',
            voltage: '220V',
            amperes: '10A',
            lat: w.lat,
            lng: w.lng
        }));
    }
}

// ===== OVERVIEW =====
function renderOverview() {
    const total = wellsData.length;
    const active = wellsData.filter(w => w.status === 'Active').length;
    const meters = metersData.length;
    const rehab = wellsData.filter(w => w.rehab === 'Required').length;
    document.getElementById('ovTotal').textContent = total;
    document.getElementById('ovActive').textContent = active;
    document.getElementById('ovMeters').textContent = meters;
    document.getElementById('ovRehab').textContent = rehab;
}

// ===== DASHBOARD =====
function renderDashboard() {
    const total = wellsData.length;
    const active = wellsData.filter(w => w.status === 'Active').length;
    const nonActive = total - active;
    const maintained = wellsData.filter(w => w.maintained === 'Yes').length;
    const notMaintained = total - maintained;
    const workingMeters = metersData.filter(m => m.status === 'Working').length;
    const faultyMeters = metersData.length - workingMeters;

    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><div class="num">${total}</div><div class="label">Total Wells</div></div>
        <div class="stat-card" style="border-left-color:#27ae60;"><div class="num">${active}</div><div class="label">Active</div></div>
        <div class="stat-card" style="border-left-color:#e67e22;"><div class="num">${nonActive}</div><div class="label">Non-Active</div></div>
        <div class="stat-card" style="border-left-color:#2980b9;"><div class="num">${maintained}</div><div class="label">Maintained</div></div>
        <div class="stat-card" style="border-left-color:#c0392b;"><div class="num">${notMaintained}</div><div class="label">Not Maintained</div></div>
        <div class="stat-card" style="border-left-color:#27ae60;"><div class="num">${workingMeters}</div><div class="label">Working Meters</div></div>
        <div class="stat-card" style="border-left-color:#c0392b;"><div class="num">${faultyMeters}</div><div class="label">Faulty Meters</div></div>
        <div class="stat-card" style="border-left-color:#8e44ad;"><div class="num">${wellsData.filter(w=>w.rehab==='Required').length}</div><div class="label">Rehab Required</div></div>
    `;

    // Summary table
    const maintGroups = {};
    wellsData.forEach(w => {
        const key = w.maintained || 'No';
        if (!maintGroups[key]) maintGroups[key] = { active: 0, nonActive: 0 };
        if (w.status === 'Active') maintGroups[key].active++;
        else maintGroups[key].nonActive++;
    });
    let html = '';
    for (const [key, val] of Object.entries(maintGroups)) {
        html += `<tr><td>${key}</td><td>${val.active}</td><td>${val.nonActive}</td><td>${val.active + val.nonActive}</td></tr>`;
    }
    document.getElementById('summaryTable').innerHTML = html;

    // Charts
    const statusCounts = { Active: 0, 'Non-Active': 0 };
    wellsData.forEach(w => { if (w.status === 'Active') statusCounts.Active++; else statusCounts['Non-Active']++; });
    const rehabCounts = { Required: 0, 'Not Required': 0 };
    wellsData.forEach(w => { if (w.rehab === 'Required') rehabCounts.Required++; else rehabCounts['Not Required']++; });
    const meterCounts = { Working: 0, Faulty: 0 };
    metersData.forEach(m => { if (m.status === 'Working') meterCounts.Working++; else meterCounts.Faulty++; });

    createChart('chartWellStatus', ['Active', 'Non-Active'], [statusCounts.Active, statusCounts['Non-Active']], ['#27ae60', '#e67e22']);
    createChart('chartRehab', ['Required', 'Not Required'], [rehabCounts.Required, rehabCounts['Not Required']], ['#c0392b', '#2980b9']);
    createChart('chartMeter', ['Working', 'Faulty'], [meterCounts.Working, meterCounts.Faulty], ['#27ae60', '#c0392b']);
}

function createChart(id, labels, data, colors) {
    const ctx = document.getElementById(id)?.getContext('2d');
    if (!ctx) return;
    // Destroy existing
    if (id === 'chartWellStatus' && wellChart) { wellChart.destroy(); }
    if (id === 'chartRehab' && rehabChart) { rehabChart.destroy(); }
    if (id === 'chartMeter' && meterChart) { meterChart.destroy(); }
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }
    });
    if (id === 'chartWellStatus') wellChart = chart;
    if (id === 'chartRehab') rehabChart = chart;
    if (id === 'chartMeter') meterChart = chart;
}

// ===== MAP =====
function initMap() {
    if (map) { map.remove(); map = null; }
    map = L.map('mapContainer').setView([26.6, 37.9], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    mapMarkers = [];
    renderMapMarkers('all');
    // Filter buttons
    const container = document.getElementById('mapContainer');
    let filterDiv = container.querySelector('.map-filters');
    if (!filterDiv) {
        filterDiv = document.createElement('div');
        filterDiv.className = 'map-filters';
        container.appendChild(filterDiv);
    }
    filterDiv.innerHTML = `
        <button class="active" data-filter="all">All</button>
        <button class="active-green" data-filter="active">Active</button>
        <button class="active-amber" data-filter="nonactive">Non-Active</button>
        <button class="active-blue" data-filter="meters">KML Layer</button>
        <button class="active-red" data-filter="rehab">Rehab Required</button>
        <button data-filter="outscope">Out of Scope</button>
    `;
    filterDiv.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function() {
            filterDiv.querySelectorAll('button').forEach(b => b.classList.remove('active', 'active-green', 'active-amber', 'active-blue', 'active-red'));
            this.classList.add('active');
            activeFilter = this.dataset.filter;
            renderMapMarkers(activeFilter);
        });
    });
    setTimeout(() => map.invalidateSize(), 300);
}

function renderMapMarkers(filter) {
    // Clear markers
    mapMarkers.forEach(m => map.removeLayer(m));
    mapMarkers = [];
    // Get data
    let wells = wellsData.filter(w => w.lat && w.lng);
    let kmlPoints = window.kmlData || [];
    // Filter wells
    if (filter === 'active') wells = wells.filter(w => w.status === 'Active');
    else if (filter === 'nonactive') wells = wells.filter(w => w.status === 'Non-Active');
    else if (filter === 'rehab') wells = wells.filter(w => w.rehab === 'Required');
    else if (filter === 'outscope') wells = wells.filter(w => w.status === 'Out of Scope');
    // Wells
    wells.forEach(w => {
        const color = w.status === 'Active' ? '#27ae60' : (w.status === 'Non-Active' ? '#e67e22' : '#95a5a6');
        const icon = L.divIcon({
            html: `<div style="background:${color};color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${w.id}</div>`,
            className: '', iconSize: [28, 28], iconAnchor: [14, 14]
        });
        const marker = L.marker([w.lat, w.lng], { icon }).addTo(map);
        marker.bindPopup(`
            <b>Well #${w.id}</b><br>
            Status: ${w.status}<br>
            Rehab: ${w.rehab}<br>
            Maintained: ${w.maintained || 'No'}<br>
            Owner: ${w.owner || '-'}<br>
            <a href="https://www.google.com/maps?q=${w.lat},${w.lng}" target="_blank">📍 Open in Maps</a>
        `);
        mapMarkers.push(marker);
    });
    // KML meters layer (if filter is 'meters' or 'all')
    if (filter === 'meters' || filter === 'all') {
        kmlPoints.forEach(p => {
            if (!p.lat || !p.lng) return;
            const icon = L.divIcon({
                html: `<div style="background:#2980b9;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">⚡</div>`,
                className: '', iconSize: [20, 20], iconAnchor: [10, 10]
            });
            const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
            marker.bindPopup(`
                <b>${p.name || 'Meter'}</b><br>
                Voltage: ${p.voltage || '-'}<br>
                Amperes: ${p.amperes || '-'}<br>
                <a href="https://www.google.com/maps?q=${p.lat},${p.lng}" target="_blank">📍 Open in Maps</a>
            `);
            mapMarkers.push(marker);
        });
    }
}

function fitMap() {
    if (!map) return;
    const bounds = [];
    mapMarkers.forEach(m => bounds.push(m.getLatLng()));
    if (bounds.length) map.fitBounds(bounds, { padding: [50, 50] });
}

// ===== KML MAP =====
function initKmlMap() {
    if (kmlMap) { kmlMap.remove(); kmlMap = null; }
    kmlMap = L.map('kmlMapContainer').setView([26.6, 37.9], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(kmlMap);
    kmlMarkers = [];
    renderKmlMarkers('all');
    const container = document.getElementById('kmlMapContainer');
    let filterDiv = container.querySelector('.kml-filters');
    if (!filterDiv) {
        filterDiv = document.createElement('div');
        filterDiv.className = 'kml-filters';
        container.appendChild(filterDiv);
    }
    filterDiv.innerHTML = `
        <button class="active" data-filter="all">All (${(window.kmlData||[]).length})</button>
        <button class="active-green" data-filter="active">Active (${(window.kmlData||[]).filter(p=>p.category==='Active').length})</button>
        <button class="active-amber" data-filter="nonactive">Non-Active (${(window.kmlData||[]).filter(p=>p.category==='Non-Active').length})</button>
        <button class="active-blue" data-filter="meters">Meters (${(window.kmlData||[]).filter(p=>p.category==='Meter').length})</button>
        <button class="active-red" data-filter="rehab">Rehab (${(window.kmlData||[]).filter(p=>p.category==='Rehab').length})</button>
        <button data-filter="outscope">Out of Scope (${(window.kmlData||[]).filter(p=>p.category==='Out of Scope').length})</button>
    `;
    filterDiv.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function() {
            filterDiv.querySelectorAll('button').forEach(b => b.classList.remove('active', 'active-green', 'active-amber', 'active-blue', 'active-red'));
            this.classList.add('active');
            kmlFilter = this.dataset.filter;
            renderKmlMarkers(kmlFilter);
        });
    });
    setTimeout(() => kmlMap.invalidateSize(), 300);
}

function renderKmlMarkers(filter) {
    kmlMarkers.forEach(m => kmlMap.removeLayer(m));
    kmlMarkers = [];
    const points = window.kmlData || [];
    let filtered = points;
    if (filter === 'active') filtered = points.filter(p => p.category === 'Active');
    else if (filter === 'nonactive') filtered = points.filter(p => p.category === 'Non-Active');
    else if (filter === 'meters') filtered = points.filter(p => p.category === 'Meter');
    else if (filter === 'rehab') filtered = points.filter(p => p.category === 'Rehab');
    else if (filter === 'outscope') filtered = points.filter(p => p.category === 'Out of Scope');
    const colors = {
        'Active': '#27ae60',
        'Non-Active': '#e67e22',
        'Meter': '#2980b9',
        'Rehab': '#c0392b',
        'Out of Scope': '#95a5a6'
    };
    const labels = {
        'Active': '🟢',
        'Non-Active': '🟡',
        'Meter': '🔵',
        'Rehab': '🔴',
        'Out of Scope': '⚫'
    };
    filtered.forEach(p => {
        if (!p.lat || !p.lng) return;
        const color = colors[p.category] || '#95a5a6';
        const icon = L.divIcon({
            html: `<div style="background:${color};color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${labels[p.category]||'●'}</div>`,
            className: '', iconSize: [26, 26], iconAnchor: [13, 13]
        });
        const marker = L.marker([p.lat, p.lng], { icon }).addTo(kmlMap);
        marker.bindPopup(`
            <b>${p.name || 'Unnamed'}</b><br>
            Category: ${p.category || '-'}<br>
            Voltage: ${p.voltage || '-'}<br>
            Amperes: ${p.amperes || '-'}<br>
            <a href="https://www.google.com/maps?q=${p.lat},${p.lng}" target="_blank">📍 Open in Maps</a>
        `);
        kmlMarkers.push(marker);
    });
}

function fitKmlMap() {
    if (!kmlMap) return;
    const bounds = [];
    kmlMarkers.forEach(m => bounds.push(m.getLatLng()));
    if (bounds.length) kmlMap.fitBounds(bounds, { padding: [50, 50] });
}

// ===== KML UPLOAD =====
document.getElementById('kmlFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const text = ev.target.result;
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');
            const coords = [];
            const placemarks = xml.getElementsByTagName('Placemark');
            for (let pm of placemarks) {
                const name = pm.getElementsByTagName('name')[0]?.textContent || '';
                const point = pm.getElementsByTagName('Point')[0];
                if (point) {
                    const coordText = point.getElementsByTagName('coordinates')[0]?.textContent?.trim();
                    if (coordText) {
                        const parts = coordText.split(',').map(Number);
                        if (parts.length >= 2) {
                            coords.push({ name, lat: parts[1], lng: parts[0], category: 'Out of Scope' });
                        }
                    }
                }
            }
            if (coords.length) {
                window.kmlData = coords;
                localStorage.setItem('kmlData', JSON.stringify(coords));
                alert(`✅ Loaded ${coords.length} KML points. Reloading map...`);
                initKmlMap();
            }
        } catch(err) {
            alert('Error reading KML file: ' + err.message);
        }
    };
    reader.readAsText(file);
});

// ===== WELLS LIST =====
function renderWells() {
    const search = (document.getElementById('wellSearch')?.value || '').toLowerCase();
    let filtered = wellsData.filter(w => w.id.toLowerCase().includes(search) || (w.owner||'').toLowerCase().includes(search));
    let html = `<table><thead><tr><th>ID</th><th>Status</th><th>Rehab</th><th>Maintained</th><th>Owner</th><th>Actions</th></tr></thead><tbody>`;
    filtered.slice(0, 100).forEach(w => {
        html += `<tr>
            <td><strong>#${w.id}</strong></td>
            <td><span class="badge ${w.status==='Active'?'badge-green':'badge-amber'}">${w.status}</span></td>
            <td><span class="badge ${w.rehab==='Required'?'badge-red':'badge-blue'}">${w.rehab}</span></td>
            <td>${w.maintained || 'No'}</td>
            <td>${w.owner || '-'}</td>
            <td><button class="btn-primary" style="padding:4px 12px;font-size:11px;" onclick="editWell('${w.id}')"><i class="fas fa-edit"></i></button> <button class="btn-danger" style="padding:4px 12px;font-size:11px;" onclick="removeWell('${w.id}')"><i class="fas fa-trash"></i></button></td>
        </tr>`;
    });
    html += `</tbody></table><div style="padding:12px;font-size:13px;color:#6a8a9a;">Showing ${filtered.length} wells</div>`;
    document.getElementById('wellsTableWrap').innerHTML = html;
}

document.getElementById('wellSearch')?.addEventListener('input', renderWells);

function openAddWell() {
    const id = prompt('Enter new Well ID (e.g., 208):');
    if (!id) return;
    const status = confirm('Is this well Active? Click OK for Active, Cancel for Non-Active') ? 'Active' : 'Non-Active';
    const rehab = confirm('Rehab Required? Click OK for Required, Cancel for Not Required') ? 'Required' : 'Not Required';
    wellsData.push({ id, status, rehab, maintained: 'No', owner: '-', lat: 0, lng: 0, notes: '' });
    saveData();
    renderWells();
    renderDashboard();
    renderOverview();
    alert(`✅ Well #${id} added!`);
}

function editWell(id) {
    const w = wellsData.find(x => x.id === id);
    if (!w) return;
    const newStatus = prompt(`Status (Active/Non-Active) for #${id}:`, w.status);
    if (newStatus) w.status = newStatus;
    const newRehab = prompt(`Rehab (Required/Not Required) for #${id}:`, w.rehab);
    if (newRehab) w.rehab = newRehab;
    saveData();
    renderWells();
    renderDashboard();
    renderOverview();
}

function removeWell(id) {
    if (!confirm(`Remove well #${id}?`)) return;
    wellsData = wellsData.filter(w => w.id !== id);
    saveData();
    renderWells();
    renderDashboard();
    renderOverview();
}

// ===== METERS LIST =====
function renderMeters() {
    const search = (document.getElementById('meterSearch')?.value || '').toLowerCase();
    let filtered = metersData.filter(m => m.id.toLowerCase().includes(search) || (m.wellId||'').toLowerCase().includes(search));
    let html = `<table><thead><tr><th>Meter ID</th><th>Well ID</th><th>Status</th><th>Voltage</th><th>Amperes</th><th>Actions</th></tr></thead><tbody>`;
    filtered.slice(0, 100).forEach(m => {
        html += `<tr>
            <td><strong>${m.id}</strong></td>
            <td>#${m.wellId || '-'}</td>
            <td><span class="badge ${m.status==='Working'?'badge-green':'badge-red'}">${m.status}</span></td>
            <td>${m.voltage || '-'}</td>
            <td>${m.amperes || '-'}</td>
            <td><button class="btn-primary" style="padding:4px 12px;font-size:11px;" onclick="editMeter('${m.id}')"><i class="fas fa-edit"></i></button> <button class="btn-danger" style="padding:4px 12px;font-size:11px;" onclick="removeMeter('${m.id}')"><i class="fas fa-trash"></i></button></td>
        </tr>`;
    });
    html += `</tbody></table><div style="padding:12px;font-size:13px;color:#6a8a9a;">Showing ${filtered.length} meters</div>`;
    document.getElementById('metersTableWrap').innerHTML = html;
}

document.getElementById('meterSearch')?.addEventListener('input', renderMeters);

function openAddMeter() {
    const id = prompt('Enter new Meter ID (e.g., M101):');
    if (!id) return;
    const wellId = prompt('Associated Well ID:');
    const status = confirm('Is this meter Working? Click OK for Working, Cancel for Faulty') ? 'Working' : 'Faulty';
    metersData.push({ id, wellId, status, voltage: '220V', amperes: '10A', lat: 0, lng: 0 });
    saveData();
    renderMeters();
    renderDashboard();
    alert(`✅ Meter ${id} added!`);
}

function editMeter(id) {
    const m = metersData.find(x => x.id === id);
    if (!m) return;
    const newStatus = prompt(`Status (Working/Faulty) for ${id}:`, m.status);
    if (newStatus) m.status = newStatus;
    saveData();
    renderMeters();
    renderDashboard();
}

function removeMeter(id) {
    if (!confirm(`Remove meter ${id}?`)) return;
    metersData = metersData.filter(m => m.id !== id);
    saveData();
    renderMeters();
    renderDashboard();
}

// ===== EXCEL UPLOAD =====
document.getElementById('excelFileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        try {
            const data = new Uint8Array(ev.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet);
            if (json.length) {
                wellsData = json.map((r, i) => ({
                    id: String(r['Well ID'] || r['WellID'] || i+1).padStart(3,'0'),
                    status: r['Well Status'] || r['Status'] || 'Non-Active',
                    rehab: r['Rehab'] || 'Not Required',
                    maintained: r['Maintained'] || 'No',
                    disconnection: r['Disconnection Reason'] || '-',
                    lat: parseFloat(r['Latitude'] || r['Lat'] || 0),
                    lng: parseFloat(r['Longitude'] || r['Lng'] || 0),
                    owner: r['Owner'] || '-',
                    notes: r['Notes'] || ''
                }));
                saveData();
                renderAll();
                document.getElementById('uploadStatus').style.display = 'block';
                document.getElementById('uploadStatus').innerHTML = `<div style="background:#d4edda;padding:16px;border-radius:8px;color:#155724;">✅ Loaded ${wellsData.length} wells from Excel!</div>`;
                alert(`✅ Successfully loaded ${wellsData.length} wells!`);
            }
        } catch(err) {
            document.getElementById('uploadStatus').style.display = 'block';
            document.getElementById('uploadStatus').innerHTML = `<div style="background:#f8d7da;padding:16px;border-radius:8px;color:#721c24;">❌ Error: ${err.message}</div>`;
        }
    };
    reader.readAsArrayBuffer(file);
});

// ===== SAVE DATA =====
function saveData() {
    try {
        localStorage.setItem('wellsData', JSON.stringify(wellsData));
        localStorage.setItem('metersData', JSON.stringify(metersData));
    } catch(e) {}
}

function renderAll() {
    renderOverview();
    renderDashboard();
    renderWells();
    renderMeters();
    if (map) renderMapMarkers(activeFilter);
}

// ===== EXPORT PDF =====
function exportPDF() {
    alert('PDF export: In production, this would generate a styled PDF report. For now, use Ctrl+P to print.');
}

// ===== EXPORT CSV =====
function exportCSV() {
    let csv = 'Well ID,Status,Rehab,Maintained,Owner\n';
    wellsData.forEach(w => {
        csv += `${w.id},${w.status},${w.rehab},${w.maintained||'No'},${w.owner||'-'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wells_data.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// ===== RESIZE MAP ON TAB SWITCH =====
document.addEventListener('DOMContentLoaded', function() {
    // Add resize observer for map containers
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) {
        const observer = new ResizeObserver(() => { if (map) map.invalidateSize(); });
        observer.observe(mapContainer);
    }
    const kmlContainer = document.getElementById('kmlMapContainer');
    if (kmlContainer) {
        const observer = new ResizeObserver(() => { if (kmlMap) kmlMap.invalidateSize(); });
        observer.observe(kmlContainer);
    }
});

// ===== INITIAL LOAD =====
// Try loading from localStorage
try {
    const savedWells = localStorage.getItem('wellsData');
    const savedMeters = localStorage.getItem('metersData');
    if (savedWells) wellsData = JSON.parse(savedWells);
    if (savedMeters) metersData = JSON.parse(savedMeters);
} catch(e) {}

// Auto-login for demo (remove in production)
if (window.location.hash === '#demo') {
    document.getElementById('loginUser').value = 'admin';
    document.getElementById('loginPass').value = 'advacon2024';
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
}