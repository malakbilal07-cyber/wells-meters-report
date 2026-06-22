/* Wells & Meters Field Report — app logic
   Data model:
   - BASE_WELLS / BASE_METERS (from data.js) = the original spreadsheet, never mutated.
   - "edits" = field overrides keyed by ID/Serial, applied on top of base rows.
   - "deletes" = list of base IDs/Serials hidden from view.
   - "added" = brand new rows created via the Add New tab (can be edited/removed directly).
   Everything beyond the base data lives in localStorage, so it persists in this browser. */

(function () {
  "use strict";

  const LS = {
    addedWells: "wam_added_wells",
    addedMeters: "wam_added_meters",
    wellEdits: "wam_well_edits",
    meterEdits: "wam_meter_edits",
    wellDeletes: "wam_well_deletes",
    meterDeletes: "wam_meter_deletes",
  };

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function safeSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  let addedWells = safeGet(LS.addedWells, []);
  let addedMeters = safeGet(LS.addedMeters, []);
  let wellEdits = safeGet(LS.wellEdits, {});     // { [ID]: {field: value, ...} }
  let meterEdits = safeGet(LS.meterEdits, {});   // { [Serial]: {field: value, ...} }
  let wellDeletes = new Set(safeGet(LS.wellDeletes, []));
  let meterDeletes = new Set(safeGet(LS.meterDeletes, []));

  function persistWells() { safeSet(LS.addedWells, addedWells); }
  function persistMeters() { safeSet(LS.addedMeters, addedMeters); }
  function persistWellEdits() { safeSet(LS.wellEdits, wellEdits); }
  function persistMeterEdits() { safeSet(LS.meterEdits, meterEdits); }
  function persistWellDeletes() { safeSet(LS.wellDeletes, Array.from(wellDeletes)); }
  function persistMeterDeletes() { safeSet(LS.meterDeletes, Array.from(meterDeletes)); }

  function norm(s) { return (s || "").toString().trim().toLowerCase(); }
  function pad3(id) {
    const s = String(id);
    return /^\d+$/.test(s) ? s.padStart(3, "0") : s;
  }

  // Effective datasets: base (with edits applied, deletes removed) + added rows
  function effectiveWells() {
    const base = BASE_WELLS
      .filter(w => !wellDeletes.has(String(w.ID)))
      .map(w => wellEdits[String(w.ID)] ? Object.assign({}, w, wellEdits[String(w.ID)]) : w);
    return base.concat(addedWells);
  }
  function effectiveMeters() {
    const base = BASE_METERS
      .filter(m => !meterDeletes.has(m.Serial))
      .map(m => meterEdits[m.Serial] ? Object.assign({}, m, meterEdits[m.Serial]) : m);
    return base.concat(addedMeters);
  }
  function isAddedWell(id) { return addedWells.some(w => String(w.ID) === String(id)); }
  function isAddedMeter(serial) { return addedMeters.some(m => m.Serial === serial); }

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
    const wells = effectiveWells();
    const meters = effectiveMeters();
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
    effectiveWells().forEach(w => {
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

  // ---------------- Field definitions (shared by Add form + Edit modal) ----------------
  const WELL_FIELDS = [
    { name: "ID", label: "Well ID", type: "text" },
    { name: "Lat", label: "Latitude", type: "number" },
    { name: "Lng", label: "Longitude", type: "number" },
    { name: "Status", label: "Well Status", type: "select", options: ["Active", "Non-Active"] },
    { name: "Rehab", label: "Rehabilitation Status", type: "select", options: ["Maintained", "Not Maintained"] },
    { name: "DistToMeter", label: "Distance to Meter (m)", type: "number" },
    { name: "TotalDepth", label: "Total Depth (m)", type: "number" },
    { name: "AmountWater", label: "Amount of Water (m)", type: "number" },
    { name: "DisconnectReason", label: "Disconnect Reason", type: "text" },
    { name: "ConnectedMeter", label: "Connected Meter Serial", type: "text" },
  ];
  const METER_FIELDS = [
    { name: "Serial", label: "Meter Serial Number", type: "text" },
    { name: "Status", label: "Status", type: "select", options: ["Working", "Not working"] },
    { name: "InputV", label: "Input Voltage", type: "number" },
    { name: "OutputV", label: "Output Voltage", type: "number" },
    { name: "Amperes", label: "Amperes", type: "number" },
    { name: "Breaker", label: "Breaker Capacity", type: "number" },
    { name: "ConnectedWell", label: "Connected Well No.", type: "text" },
    { name: "DisconnectReason", label: "Disconnect Reason", type: "text" },
  ];
  const WELL_NUMERIC = ["Lat", "Lng", "DistToMeter", "TotalDepth", "AmountWater"];
  const METER_NUMERIC = ["InputV", "OutputV", "Amperes", "Breaker"];

  // ---------------- Wells table ----------------
  function wellRowHtml(w) {
    const added = isAddedWell(w.ID);
    const active = norm(w.Status) === "active";
    const maintained = norm(w.Rehab) === "maintained";
    return `<tr class="${added ? "new-row" : ""}" data-id="${w.ID}">
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
      <td class="row-actions">
        <button class="btn edit" data-edit-well="${w.ID}">Edit</button>
        <button class="btn danger" data-del-well="${w.ID}">Remove</button>
      </td>
    </tr>`;
  }

  function renderWells() {
    const q = norm(document.getElementById("wellSearch").value);
    const statusF = document.getElementById("wellStatusFilter").value;
    const rehabF = document.getElementById("wellRehabFilter").value;

    let rows = effectiveWells().filter(w => {
      if (statusF && w.Status !== statusF) return false;
      if (rehabF && w.Rehab !== rehabF) return false;
      if (q && !(norm(pad3(w.ID)).includes(q) || norm(w.ConnectedMeter).includes(q))) return false;
      return true;
    });

    document.getElementById("wellsBody").innerHTML = rows.map(wellRowHtml).join("") ||
      `<tr><td colspan="11" class="muted" style="text-align:center;padding:24px;">No wells match these filters.</td></tr>`;
    document.getElementById("wellCount").textContent = `${rows.length} / ${effectiveWells().length} wells`;
  }

  document.getElementById("wellSearch").addEventListener("input", renderWells);
  document.getElementById("wellStatusFilter").addEventListener("change", renderWells);
  document.getElementById("wellRehabFilter").addEventListener("change", renderWells);

  document.getElementById("wellsBody").addEventListener("click", e => {
    const delBtn = e.target.closest("[data-del-well]");
    if (delBtn) {
      const id = delBtn.dataset.delWell;
      if (!confirm(`Remove well ${pad3(id)}? This can't be undone (but isn't billed against the spreadsheet — you can re-add it).`)) return;
      if (isAddedWell(id)) { addedWells = addedWells.filter(w => String(w.ID) !== String(id)); persistWells(); }
      else { wellDeletes.add(String(id)); persistWellDeletes(); }
      renderWells(); renderStats(); renderMap();
      toast("Well removed.");
      return;
    }
    const editBtn = e.target.closest("[data-edit-well]");
    if (editBtn) openEditModal("well", editBtn.dataset.editWell);
  });

  // ---------------- Meters table ----------------
  function meterRowHtml(m) {
    const added = isAddedMeter(m.Serial);
    const working = norm(m.Status).startsWith("working");
    return `<tr class="${added ? "new-row" : ""}" data-serial="${m.Serial}">
      <td class="mono">${m.Serial}</td>
      <td><span class="badge ${working ? "on" : "off"}">${(m.Status || "—").trim()}</span></td>
      <td>${m.InputV ?? "—"}</td>
      <td>${m.OutputV ?? "—"}</td>
      <td>${m.Amperes ?? "—"}</td>
      <td>${m.Breaker ?? "—"}</td>
      <td class="mono">${m.ConnectedWell ?? "—"}</td>
      <td>${m.DisconnectReason ?? "—"}</td>
      <td class="row-actions">
        <button class="btn edit" data-edit-meter="${m.Serial}">Edit</button>
        <button class="btn danger" data-del-meter="${m.Serial}">Remove</button>
      </td>
    </tr>`;
  }

  function renderMeters() {
    const q = norm(document.getElementById("meterSearch").value);
    const statusF = norm(document.getElementById("meterStatusFilter").value);

    let rows = effectiveMeters().filter(m => {
      if (statusF && !norm(m.Status).startsWith(statusF)) return false;
      if (q && !(norm(m.Serial).includes(q) || norm(m.ConnectedWell).includes(q))) return false;
      return true;
    });

    document.getElementById("metersBody").innerHTML = rows.map(meterRowHtml).join("") ||
      `<tr><td colspan="9" class="muted" style="text-align:center;padding:24px;">No meters match these filters.</td></tr>`;
    document.getElementById("meterCount").textContent = `${rows.length} / ${effectiveMeters().length} meters`;
  }

  document.getElementById("meterSearch").addEventListener("input", renderMeters);
  document.getElementById("meterStatusFilter").addEventListener("change", renderMeters);

  document.getElementById("metersBody").addEventListener("click", e => {
    const delBtn = e.target.closest("[data-del-meter]");
    if (delBtn) {
      const serial = delBtn.dataset.delMeter;
      if (!confirm(`Remove meter ${serial}? This can't be undone.`)) return;
      if (isAddedMeter(serial)) { addedMeters = addedMeters.filter(m => m.Serial !== serial); persistMeters(); }
      else { meterDeletes.add(serial); persistMeterDeletes(); }
      renderMeters(); renderStats();
      toast("Meter removed.");
      return;
    }
    const editBtn = e.target.closest("[data-edit-meter]");
    if (editBtn) openEditModal("meter", editBtn.dataset.editMeter);
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
    const obj = formToObject(e.target, WELL_NUMERIC);
    if (!obj.ID) { toast("Well ID is required."); return; }
    const exists = effectiveWells().some(w => String(w.ID) === String(obj.ID));
    if (exists) { document.getElementById("wellFormMsg").textContent = "A well with that ID already exists."; return; }
    addedWells.push(obj);
    persistWells();
    e.target.reset();
    document.getElementById("wellFormMsg").textContent = "";
    renderWells(); renderStats(); renderMap();
    toast(`Well ${pad3(obj.ID)} saved.`);
  });

  document.getElementById("meterForm").addEventListener("submit", e => {
    e.preventDefault();
    const obj = formToObject(e.target, METER_NUMERIC);
    if (!obj.Serial) { toast("Meter serial number is required."); return; }
    const exists = effectiveMeters().some(m => m.Serial === obj.Serial);
    if (exists) { document.getElementById("meterFormMsg").textContent = "A meter with that serial already exists."; return; }
    addedMeters.push(obj);
    persistMeters();
    e.target.reset();
    document.getElementById("meterFormMsg").textContent = "";
    renderMeters(); renderStats();
    toast(`Meter ${obj.Serial} saved.`);
  });

  // ---------------- Edit modal ----------------
  const editOverlay = document.getElementById("editModalOverlay");
  const editFormGrid = document.getElementById("editFormGrid");
  const editForm = document.getElementById("editForm");
  let editContext = null; // { type: 'well'|'meter', key: ID or Serial, isAdded: bool }

  function buildFieldHtml(f, value) {
    const val = value === null || value === undefined ? "" : value;
    if (f.type === "select") {
      const opts = f.options.map(o => `<option ${norm(o) === norm(val) ? "selected" : ""}>${o}</option>`).join("");
      return `<div class="field"><label>${f.label}</label><select name="${f.name}">${opts}</select></div>`;
    }
    return `<div class="field"><label>${f.label}</label>
      <input type="${f.type}" ${f.type === "number" ? 'step="any"' : ""} name="${f.name}" value="${String(val).replace(/"/g, "&quot;")}"></div>`;
  }

  function openEditModal(type, key) {
    const isWell = type === "well";
    const fields = isWell ? WELL_FIELDS : METER_FIELDS;
    const dataset = isWell ? effectiveWells() : effectiveMeters();
    const matchKey = isWell ? "ID" : "Serial";
    const record = dataset.find(r => String(r[matchKey]) === String(key));
    if (!record) return;

    const added = isWell ? isAddedWell(key) : isAddedMeter(key);
    editContext = { type, key, isAdded: added };

    document.getElementById("editModalTitle").textContent = isWell ? `Edit Well ${pad3(key)}` : `Edit Meter ${key}`;
    document.getElementById("editModalNote").textContent = added
      ? "This is a record you added — changes update it directly."
      : "This is from the original spreadsheet — your changes are saved as an override in this browser, the original data.js stays untouched.";

    editFormGrid.innerHTML = fields.map(f => buildFieldHtml(f, record[f.name])).join("");
    editOverlay.classList.add("show");
  }

  function closeEditModal() {
    editOverlay.classList.remove("show");
    editContext = null;
  }
  document.getElementById("editModalClose").addEventListener("click", closeEditModal);
  document.getElementById("editModalCancel").addEventListener("click", closeEditModal);
  editOverlay.addEventListener("click", e => { if (e.target === editOverlay) closeEditModal(); });

  editForm.addEventListener("submit", e => {
    e.preventDefault();
    if (!editContext) return;
    const isWell = editContext.type === "well";
    const numeric = isWell ? WELL_NUMERIC : METER_NUMERIC;
    const updated = formToObject(editForm, numeric);

    if (isWell) {
      if (editContext.isAdded) {
        const idx = addedWells.findIndex(w => String(w.ID) === String(editContext.key));
        if (idx > -1) { addedWells[idx] = Object.assign({}, addedWells[idx], updated); persistWells(); }
      } else {
        wellEdits[String(editContext.key)] = updated;
        persistWellEdits();
      }
      renderWells(); renderStats(); renderMap();
      toast(`Well ${pad3(editContext.key)} updated.`);
    } else {
      if (editContext.isAdded) {
        const idx = addedMeters.findIndex(m => m.Serial === editContext.key);
        if (idx > -1) { addedMeters[idx] = Object.assign({}, addedMeters[idx], updated); persistMeters(); }
      } else {
        meterEdits[editContext.key] = updated;
        persistMeterEdits();
      }
      renderMeters(); renderStats();
      toast(`Meter ${editContext.key} updated.`);
    }
    closeEditModal();
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
    download("wells_export.csv", toCsv(effectiveWells(),
      ["ID", "Lat", "Lng", "Status", "Rehab", "DistToMeter", "TotalDepth", "AmountWater", "DisconnectReason", "ConnectedMeter"]));
  });
  document.getElementById("exportMetersCsv").addEventListener("click", () => {
    download("meters_export.csv", toCsv(effectiveMeters(),
      ["Serial", "Status", "InputV", "OutputV", "Amperes", "Breaker", "ConnectedWell", "DisconnectReason"]));
  });

  // ---------------- Init ----------------
  renderStats();
  renderWells();
  renderMeters();
  initMap();
})();
