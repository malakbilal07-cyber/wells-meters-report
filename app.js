/* Wells & Meters Field Report — app logic
   Data model: BASE_WELLS / BASE_METERS come from data.js (the original spreadsheet).
   Anything added via the "Add New" form is merged in and saved to localStorage,
   so it's still there next time this site is opened in the same browser. */

(function () {
  "use strict";

  const LS_WELLS = "wam_added_wells";
  const LS_METERS = "wam_added_meters";

  function safeGet(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  let addedWells = safeGet(LS_WELLS);
  let addedMeters = safeGet(LS_METERS);

  function allWells() { return BASE_WELLS.concat(addedWells); }
  function allMeters() { return BASE_METERS.concat(addedMeters); }

  function pad3(id) {
    const s = String(id);
    return /^\d+$/.test(s) ? s.padStart(3, "0") : s;
  }

  function norm(s) { return (s || "").toString().trim().toLowerCase(); }

  // ---------------- Toast ----------------
  let toastTimer;
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  // ---------------- Tabs ----------------
  document.querySelectorAll("nav.tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("nav.tabs button").forEach(b => b.classList.remove("active"));
      document.querySelectorAll("section.view").forEach(s => s.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("view-" + btn.dataset.view).classList.add("active");
      if (btn.dataset.view === "dashboard") setTimeout(() => map && map.invalidateSize(), 50);
    });
  });

  // ---------------- Dashboard stats ----------------
  function renderStats() {
    const wells = allWells();
    const meters = allMeters();
    const activeWells = wells.filter(w => norm(w.Status) === "active").length;
    const nonActiveWells = wells.length - activeWells;
    const workingMeters = meters.filter(m => norm(m.Status).startsWith("working")).length;
    const notWorkingMeters = meters.length - workingMeters;

    const cards = [
      { num: wells.length, lbl: "Total Wells", cls: "neutral" },
      { num: activeWells, lbl: "Active Wells", cls: "good" },
      { num: nonActiveWells, lbl: "Non-Active Wells", cls: "bad" },
      { num: meters.length, lbl: "Total Meters", cls: "neutral" },
      { num: workingMeters, lbl: "Working Meters", cls: "good" },
      { num: notWorkingMeters, lbl: "Not Working Meters", cls: "bad" },
    ];
    document.getElementById("statRow").innerHTML = cards.map(c =>
      `<div class="stat-card ${c.cls}"><div class="num">${c.num}</div><div class="lbl">${c.lbl}</div></div>`
    ).join("");
  }

  // ---------------- Map ----------------
  let map, markerLayer;
  function initMap() {
    map = L.map("map", { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    renderMap();
  }

  function renderMap() {
    markerLayer.clearLayers();
    const pts = [];
    allWells().forEach(w => {
      const lat = parseFloat(w.Lat), lng = parseFloat(w.Lng);
      if (isNaN(lat) || isNaN(lng)) return;
      const active = norm(w.Status) === "active";
      const color = active ? "#557A4D" : "#C2682B";
      const marker = L.circleMarker([lat, lng], {
        radius: 6, color: color, weight: 1.5, fillColor: color, fillOpacity: 0.75
      });
      marker.bindPopup(
        `<strong>Well ${pad3(w.ID)}</strong><br>` +
        `Status: ${w.Status || "—"}<br>` +
        `Rehab: ${w.Rehab || "—"}<br>` +
        `Connected meter: ${w.ConnectedMeter || "—"}` +
        (w.DisconnectReason ? `<br>Disconnect: ${w.DisconnectReason}` : "")
      );
      marker.addTo(markerLayer);
      pts.push([lat, lng]);
    });
    if (pts.length) map.fitBounds(pts, { padding: [20, 20] });
    else map.setView([26.64, 37.91], 12);
  }

  // ---------------- Wells table ----------------
  function wellRowHtml(w, isAdded) {
    const active = norm(w.Status) === "active";
    const maintained = norm(w.Rehab) === "maintained";
    return `<tr class="${isAdded ? "new-row" : ""}" data-id="${w.ID}">
      <td class="mono">${pad3(w.ID)}</td>
      <td><span class="badge ${active ? "on" : "off"}">${w.Status || "—"}</span></td>
      <td><span class="badge ${maintained ? "on" : "amber"}">${w.Rehab || "—"}</span></td>
      <td class="mono">${w.Lat ?? "—"}</td>
      <td class="mono">${w.Lng ?? "—"}</td>
      <td>${w.DistToMeter ?? "—"}</td>
      <td>${w.TotalDepth ?? "—"}</td>
      <td>${w.AmountWater ?? "—"}</td>
      <td>${w.DisconnectReason ?? "—"}</td>
      <td class="mono">${w.ConnectedMeter ?? "—"}</td>
      <td>${isAdded ? `<button class="btn danger" data-del-well="${w.ID}">Remove</button>` : ""}</td>
    </tr>`;
  }

  function renderWells() {
    const q = norm(document.getElementById("wellSearch").value);
    const statusF = document.getElementById("wellStatusFilter").value;
    const rehabF = document.getElementById("wellRehabFilter").value;

    const addedIds = new Set(addedWells.map(w => String(w.ID)));
    let rows = allWells().filter(w => {
      if (statusF && w.Status !== statusF) return false;
      if (rehabF && w.Rehab !== rehabF) return false;
      if (q && !(norm(pad3(w.ID)).includes(q) || norm(w.ConnectedMeter).includes(q))) return false;
      return true;
    });

    document.getElementById("wellsBody").innerHTML = rows.map(w =>
      wellRowHtml(w, addedIds.has(String(w.ID)))
    ).join("") || `<tr><td colspan="11" class="muted" style="text-align:center;padding:24px;">No wells match these filters.</td></tr>`;
    document.getElementById("wellCount").textContent = `${rows.length} / ${allWells().length} wells`;
  }

  document.getElementById("wellSearch").addEventListener("input", renderWells);
  document.getElementById("wellStatusFilter").addEventListener("change", renderWells);
  document.getElementById("wellRehabFilter").addEventListener("change", renderWells);

  document.getElementById("wellsBody").addEventListener("click", e => {
    const btn = e.target.closest("[data-del-well]");
    if (!btn) return;
    const id = btn.dataset.delWell;
    addedWells = addedWells.filter(w => String(w.ID) !== id);
    safeSet(LS_WELLS, addedWells);
    renderWells(); renderStats(); renderMap();
    toast("Well removed.");
  });

  // ---------------- Meters table ----------------
  function meterRowHtml(m, isAdded) {
    const working = norm(m.Status).startsWith("working");
    return `<tr class="${isAdded ? "new-row" : ""}" data-serial="${m.Serial}">
      <td class="mono">${m.Serial}</td>
      <td><span class="badge ${working ? "on" : "off"}">${(m.Status || "—").trim()}</span></td>
      <td>${m.InputV ?? "—"}</td>
      <td>${m.OutputV ?? "—"}</td>
      <td>${m.Amperes ?? "—"}</td>
      <td>${m.Breaker ?? "—"}</td>
      <td class="mono">${m.ConnectedWell ?? "—"}</td>
      <td>${m.DisconnectReason ?? "—"}</td>
      <td>${isAdded ? `<button class="btn danger" data-del-meter="${m.Serial}">Remove</button>` : ""}</td>
    </tr>`;
  }

  function renderMeters() {
    const q = norm(document.getElementById("meterSearch").value);
    const statusF = norm(document.getElementById("meterStatusFilter").value);

    const addedSerials = new Set(addedMeters.map(m => m.Serial));
    let rows = allMeters().filter(m => {
      if (statusF && !norm(m.Status).startsWith(statusF)) return false;
      if (q && !(norm(m.Serial).includes(q) || norm(m.ConnectedWell).includes(q))) return false;
      return true;
    });

    document.getElementById("metersBody").innerHTML = rows.map(m =>
      meterRowHtml(m, addedSerials.has(m.Serial))
    ).join("") || `<tr><td colspan="9" class="muted" style="text-align:center;padding:24px;">No meters match these filters.</td></tr>`;
    document.getElementById("meterCount").textContent = `${rows.length} / ${allMeters().length} meters`;
  }

  document.getElementById("meterSearch").addEventListener("input", renderMeters);
  document.getElementById("meterStatusFilter").addEventListener("change", renderMeters);

  document.getElementById("metersBody").addEventListener("click", e => {
    const btn = e.target.closest("[data-del-meter]");
    if (!btn) return;
    const serial = btn.dataset.delMeter;
    addedMeters = addedMeters.filter(m => m.Serial !== serial);
    safeSet(LS_METERS, addedMeters);
    renderMeters(); renderStats();
    toast("Meter removed.");
  });

  // ---------------- Add New form ----------------
  document.querySelectorAll(".type-switch button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".type-switch button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("wellForm").style.display = btn.dataset.type === "well" ? "block" : "none";
      document.getElementById("meterForm").style.display = btn.dataset.type === "meter" ? "block" : "none";
    });
  });

  function formToObject(form, numericFields) {
    const data = {};
    new FormData(form).forEach((v, k) => {
      v = v.toString().trim();
      data[k] = v === "" ? null : (numericFields.includes(k) ? (isNaN(v) ? v : parseFloat(v)) : v);
    });
    return data;
  }

  document.getElementById("wellForm").addEventListener("submit", e => {
    e.preventDefault();
    const obj = formToObject(e.target, ["Lat", "Lng", "DistToMeter", "TotalDepth", "AmountWater"]);
    if (!obj.ID) { toast("Well ID is required."); return; }
    const exists = allWells().some(w => String(w.ID) === String(obj.ID));
    if (exists) { document.getElementById("wellFormMsg").textContent = "A well with that ID already exists."; return; }
    addedWells.push(obj);
    safeSet(LS_WELLS, addedWells);
    e.target.reset();
    document.getElementById("wellFormMsg").textContent = "";
    renderWells(); renderStats(); renderMap();
    toast(`Well ${pad3(obj.ID)} saved.`);
  });

  document.getElementById("meterForm").addEventListener("submit", e => {
    e.preventDefault();
    const obj = formToObject(e.target, ["InputV", "OutputV", "Amperes", "Breaker"]);
    if (!obj.Serial) { toast("Meter serial number is required."); return; }
    const exists = allMeters().some(m => m.Serial === obj.Serial);
    if (exists) { document.getElementById("meterFormMsg").textContent = "A meter with that serial already exists."; return; }
    addedMeters.push(obj);
    safeSet(LS_METERS, addedMeters);
    e.target.reset();
    document.getElementById("meterFormMsg").textContent = "";
    renderMeters(); renderStats();
    toast(`Meter ${obj.Serial} saved.`);
  });

  // ---------------- CSV export ----------------
  function toCsv(rows, columns) {
    const esc = v => {
      v = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    };
    const head = columns.join(",");
    const body = rows.map(r => columns.map(c => esc(r[c])).join(",")).join("\n");
    return head + "\n" + body;
  }
  function download(filename, text) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.getElementById("exportWellsCsv").addEventListener("click", () => {
    download("wells_export.csv", toCsv(allWells(),
      ["ID", "Lat", "Lng", "Status", "Rehab", "DistToMeter", "TotalDepth", "AmountWater", "DisconnectReason", "ConnectedMeter"]));
  });
  document.getElementById("exportMetersCsv").addEventListener("click", () => {
    download("meters_export.csv", toCsv(allMeters(),
      ["Serial", "Status", "InputV", "OutputV", "Amperes", "Breaker", "ConnectedWell", "DisconnectReason"]));
  });

  // ---------------- Init ----------------
  renderStats();
  renderWells();
  renderMeters();
  initMap();
})();
