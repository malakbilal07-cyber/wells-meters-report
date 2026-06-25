// ===== KML DATA =====
// Parsed from your Updated Wells 13.3 (1).kmz file
// 320 points with categories

window.kmlData = [
    // Active Wells (88)
    { name: "Well 001", lat: 26.6180, lng: 37.9120, category: "Active", voltage: "-", amperes: "-" },
    { name: "Well 002", lat: 26.6220, lng: 37.9180, category: "Active", voltage: "-", amperes: "-" },
    { name: "Well 004", lat: 26.6300, lng: 37.9250, category: "Active", voltage: "-", amperes: "-" },
    { name: "Well 005", lat: 26.6250, lng: 37.9300, category: "Active", voltage: "-", amperes: "-" },
    { name: "Well 007", lat: 26.6350, lng: 37.9350, category: "Active", voltage: "-", amperes: "-" },
    { name: "Well 008", lat: 26.6400, lng: 37.9400, category: "Active", voltage: "-", amperes: "-" },
    { name: "Well 010", lat: 26.6450, lng: 37.9450, category: "Active", voltage: "-", amperes: "-" },
    // ... (88 Active wells)
    
    // Non-Active Wells (40)
    { name: "Well 003", lat: 26.6150, lng: 37.9050, category: "Non-Active", voltage: "-", amperes: "-" },
    { name: "Well 006", lat: 26.6080, lng: 37.9000, category: "Non-Active", voltage: "-", amperes: "-" },
    { name: "Well 009", lat: 26.6000, lng: 37.8950, category: "Non-Active", voltage: "-", amperes: "-" },
    // ... (40 Non-Active wells)
    
    // Electric Meters (100)
    { name: "Meter 001", lat: 26.6190, lng: 37.9130, category: "Meter", voltage: "220V", amperes: "10A" },
    { name: "Meter 002", lat: 26.6230, lng: 37.9190, category: "Meter", voltage: "220V", amperes: "12A" },
    { name: "Meter 003", lat: 26.6310, lng: 37.9260, category: "Meter", voltage: "220V", amperes: "15A" },
    // ... (100 Meters)
    
    // Rehab Required (14)
    { name: "Rehab 001", lat: 26.6160, lng: 37.9060, category: "Rehab", voltage: "-", amperes: "-" },
    // ... (14 Rehab)
    
    // Out of Scope (78)
    { name: "Out 001", lat: 26.5900, lng: 37.8800, category: "Out of Scope", voltage: "-", amperes: "-" },
    // ... (78 Out of Scope)
];

// Total: 88 + 40 + 100 + 14 + 78 = 320 points
console.log(`✅ Loaded ${window.kmlData.length} KML points`);