let currentSection = 0;
const totalSections = 13;
const draftKey = 'ge_draft';
const endpointKey = 'ge_submit_endpoint';
let measureCount = 0;
let loadCount = 0;
let roofCount = 0;
let groundCount = 0;
let shadingCount = 0;
let extraPhotoCount = 0;
let autoAdvanceLock = false;

function getForm() { return document.getElementById('siteAssessmentForm'); }

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function getFieldLabelText(el) {
  const field = el.closest('.field');
  const label = field?.querySelector('label');
  if (!label) return '';
  const cloned = label.cloneNode(true);
  cloned.querySelectorAll('.req').forEach((req) => req.remove());
  return cloned.textContent.replace(/\s+/g, ' ').trim();
}

function ensureFieldIdentifiers(scope = document) {
  const root = scope === document ? getForm() || document : scope;
  const sections = root.querySelectorAll('.form-section');
  const targets = sections.length ? [...sections] : [root];

  targets.forEach((section, sectionIndex) => {
    const sectionKey = section.id || `sec_${sectionIndex}`;
    const seen = new Map();
    const fields = section.querySelectorAll('input, select, textarea');

    fields.forEach((el, fieldIndex) => {
      const labelKey = slugify(getFieldLabelText(el)) || `${el.tagName.toLowerCase()}_${fieldIndex + 1}`;
      const countKey = `${sectionKey}__${labelKey}`;
      const count = (seen.get(countKey) || 0) + 1;
      seen.set(countKey, count);
      const suffix = count > 1 ? `_${count}` : '';
      const base = `${sectionKey}__${labelKey}${suffix}`;

      if (el.type === 'checkbox' || el.type === 'radio') {
        const group = el.closest('.check-group');
        const groupLabel = slugify(group?.parentElement?.querySelector('label')?.textContent || getFieldLabelText(el)) || labelKey;
        const groupName = `${sectionKey}__${groupLabel}[]`;
        if (!el.name) el.name = groupName;

        const pillText = slugify(el.parentElement?.textContent || '') || `option_${count}`;
        if (!el.value || el.value === 'on') el.value = pillText;
      } else if (!el.name) {
        el.name = el.multiple || el.type === 'file' ? `${base}[]` : base;
      }

      if (!el.id) {
        if (el.type === 'checkbox' || el.type === 'radio') {
          const valueKey = slugify(el.value) || `choice_${count}`;
          el.id = `${el.name.replace(/\[\]$/, '')}__${valueKey}`;
        } else {
          el.id = base;
        }
      }
    });
  });
}

function goTo(index) {
  document.querySelectorAll('.form-section').forEach((s, i) => s.classList.toggle('active', i === index));
  document.querySelectorAll('.nav-item').forEach((n, i) => n.classList.toggle('active', i === index));
  currentSection = index;
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fieldVisible(el) {
  return el.offsetParent !== null || el.closest('.conditional-block.show');
}

function isFieldRequired(field) {
  if (!field) return false;
  if (field.required) return true;
  const fieldWrapper = field.closest('.field');
  const label = fieldWrapper?.querySelector('label');
  return Boolean(label?.querySelector('.req'));
}

function getValidationLabel(field) {
  const txt = getFieldLabelText(field);
  if (txt) return txt;
  if (field.name) return field.name.replace(/\[\]$/, '').replace(/_/g, ' ');
  return 'This field';
}

function findSectionValidationError(section) {
  if (!section) return null;
  const fields = [...section.querySelectorAll('input, select, textarea')].filter(fieldVisible);
  if (!fields.length) return null;

  const requiredFields = fields.filter(isFieldRequired);
  if (!requiredFields.length) return null;

  const checkedGroups = new Set();

  for (const field of requiredFields) {
    if (field.readOnly || field.disabled) continue;

    if (field.type === 'checkbox' || field.type === 'radio') {
      const groupName = field.name || field.id;
      if (!groupName || checkedGroups.has(groupName)) continue;
      checkedGroups.add(groupName);
      const group = requiredFields.filter((f) => (f.type === field.type) && (f.name || f.id) === groupName);
      if (!group.some((f) => f.checked)) {
        return {
          field,
          label: getValidationLabel(field),
          message: `Please select at least one option for "${getValidationLabel(field)}".`
        };
      }
      continue;
    }

    if (field.type === 'file') {
      if (!field.files || field.files.length === 0) {
        return {
          field,
          label: getValidationLabel(field),
          message: `Please upload a file for "${getValidationLabel(field)}".`
        };
      }
      continue;
    }

    if (!String(field.value || '').trim()) {
      return {
        field,
        label: getValidationLabel(field),
        message: `Please fill "${getValidationLabel(field)}".`
      };
    }
  }

  return null;
}

function sectionHasRequiredFields(section) {
  if (!section) return false;
  const fields = [...section.querySelectorAll('input, select, textarea')].filter(fieldVisible);
  return fields.some(isFieldRequired);
}

function focusValidationError(error) {
  if (!error?.field) return;
  error.field.setAttribute('aria-invalid', 'true');
  setTimeout(() => {
    error.field.focus({ preventScroll: false });
    if (typeof error.field.select === 'function' && (error.field.type === 'text' || error.field.tagName === 'TEXTAREA')) {
      error.field.select();
    }
  }, 80);
}

function sectionIsComplete(section) {
  return !findSectionValidationError(section);
}

function updateNavChecks() {
  document.querySelectorAll('.form-section').forEach((section, i) => {
    const nav = document.querySelectorAll('.nav-item')[i];
    if (!nav) return;
    const done = sectionIsComplete(section);
    nav.classList.toggle('done', done);
    const check = nav.querySelector('.nav-check');
    if (check) check.textContent = done ? '✓' : '';
  });
}

function updateProgress() {
  const form = getForm();
  if (!form) return;
  const fields = [...form.querySelectorAll('input:not([type="file"]):not([readonly]), select, textarea')];
  let filled = 0;
  for (const field of fields) {
    if (field.type === 'checkbox' || field.type === 'radio') {
      if (field.checked) filled++;
    } else if (String(field.value || '').trim()) {
      filled++;
    }
  }
  const pct = fields.length ? Math.min(100, Math.round((filled / fields.length) * 100)) : 0;
  const pctDisplay = document.getElementById('pctDisplay');
  if (pctDisplay) pctDisplay.textContent = `${pct}%`;
  updateNavChecks();
}

function maybeAutoAdvance() {
  return;
}

function collectDraftData() {
  const form = getForm();
  const data = {};
  if (!form) return data;
  const fields = [...form.querySelectorAll('input:not([type="file"]), select, textarea')];
  for (const field of fields) {
    if (!field.name) continue;
    if (field.type === 'checkbox') {
      if (!Array.isArray(data[field.name])) data[field.name] = [];
      if (field.checked) data[field.name].push(field.value || 'on');
      continue;
    }
    if (field.type === 'radio') {
      if (field.checked) data[field.name] = field.value;
      continue;
    }
    data[field.name] = field.value;
  }
  return data;
}

function saveDraft() {
  localStorage.setItem(draftKey, JSON.stringify(collectDraftData()));
  showToast('Draft saved ✓');
}

function loadDraft() {
  const raw = localStorage.getItem(draftKey);
  if (!raw) return;
  const data = JSON.parse(raw);
  const form = getForm();
  if (!form) return;
  const fields = [...form.querySelectorAll('input:not([type="file"]), select, textarea')];
  for (const field of fields) {
    if (!field.name || data[field.name] === undefined) continue;
    if (field.type === 'checkbox') {
      field.checked = Array.isArray(data[field.name]) && data[field.name].includes(field.value || 'on');
      field.parentElement?.classList.toggle('checked', field.checked);
    } else if (field.type === 'radio') {
      field.checked = data[field.name] === field.value;
    } else {
      field.value = data[field.name];
    }
  }
}

function generateRef() {
  const now = new Date();
  const code = now.getFullYear().toString().slice(-2) + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const ref = document.getElementById('refId');
  if (ref) ref.value = `GE-SAR-${code}-${rand}`;
}

function resolveSubmitEndpoint() {
  const form = getForm();
  if (!form) return '';
  return (form.dataset.submitEndpoint || '').trim() || (localStorage.getItem(endpointKey) || '').trim();
}

function saveSubmitEndpoint(url) {
  const clean = String(url || '').trim();
  if (!clean) return;
  const form = getForm();
  if (form) form.dataset.submitEndpoint = clean;
  localStorage.setItem(endpointKey, clean);
}

function buildSubmissionFormData() {
  const form = getForm();
  if (!form) return new FormData();
  ensureFieldIdentifiers();
  const payload = new FormData(form);
  payload.append('submittedAt', new Date().toISOString());
  return payload;
}

async function submitForm() {
  for (let i = 0; i < totalSections; i++) {
    const section = document.getElementById(`sec${i}`);
    const error = findSectionValidationError(section);
    if (error) {
      goTo(i);
      showToast(error.message);
      focusValidationError(error);
      return;
    }
  }

  let endpoint = resolveSubmitEndpoint();
  if (!endpoint) {
    const entered = window.prompt('Enter Laravel endpoint URL:', 'http://127.0.0.1:8000/api/site-assessments');
    if (!entered || !entered.trim()) {
      showToast('Submission cancelled');
      return;
    }
    saveSubmitEndpoint(entered);
    endpoint = resolveSubmitEndpoint();
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: buildSubmissionFormData()
    });

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) data = await response.json();
    if (!response.ok) {
      showToast(data?.message || `Submission failed (${response.status})`);
      return;
    }
    showToast('Data sent successfully');
    localStorage.setItem(draftKey, JSON.stringify(collectDraftData()));
  } catch (error) {
    showToast(error.message || 'Submission failed');
  }
}

function handleMethod() {
  const value = document.getElementById('assessMethod')?.value || '';
  document.getElementById('remoteBlock')?.classList.toggle('show', value === 'Remote / Desktop' || value === 'Hybrid');
}
function handleAssessType() {}
function toggleTx() { document.getElementById('txBlock')?.classList.toggle('show', document.getElementById('txPresent')?.value === 'Yes'); }
function toggleBess() { document.getElementById('bessBlock')?.classList.toggle('show', document.getElementById('bessRequired')?.value === 'yes'); }
function handleConsumData() {
  const v = document.getElementById('consumDataType')?.value || '';
  document.getElementById('billsBlock')?.classList.toggle('show', v === 'bills');
  document.getElementById('intervalBlock')?.classList.toggle('show', v === 'interval');
  document.getElementById('newBuildBlock')?.classList.toggle('show', v === 'new');
  document.getElementById('pendingBlock')?.classList.toggle('show', v === 'pending');
}
function togglePill(input) { input.parentElement.classList.toggle('checked', input.checked); updateProgress(); }

function addMeasurement() { measureCount++; appendCard('measureList', `Measurement #${measureCount}`); }
function addLoad() { loadCount++; appendCard('loadList', `Load Item #${loadCount}`); }
function addRoof() { roofCount++; appendCard('roofList', `Roof Area #${roofCount}`); }
function addGround() { groundCount++; appendCard('groundList', `Ground Area #${groundCount}`); }
function addShading() { shadingCount++; appendCard('shadingList', `Shading #${shadingCount}`); }

function appendCard(targetId, title) {
  const card = document.createElement('div');
  card.className = 'card';
  if (targetId === 'measureList') {
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${title}</div>
        <button type="button" class="btn-remove" onclick="this.closest('.card').remove(); updateProgress();">Remove</button>
      </div>
      <div class="field-grid cols-3">
        <div class="field">
          <label>Parameter</label>
          <select><option value="">Select</option><option>Voltage</option><option>Current</option><option>Frequency</option><option>Power</option><option>Demand</option><option>Temperature</option><option>Other</option></select>
        </div>
        <div class="field">
          <label>Measured Value</label>
          <input type="text" placeholder="Value + unit">
        </div>
        <div class="field">
          <label>Time of Measurement</label>
          <input type="time">
        </div>
        <div class="field">
          <label>Instrument Used</label>
          <input type="text" placeholder="e.g. Fluke 175">
        </div>
        <div class="field span-2">
          <label>Notes</label>
          <input type="text" placeholder="">
        </div>
      </div>`;
  } else if (targetId === 'loadList') {
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${title}</div>
        <button type="button" class="btn-remove" onclick="this.closest('.card').remove(); updateProgress();">Remove</button>
      </div>
      <div class="field-grid cols-3">
        <div class="field">
          <label>Appliance / Load Description</label>
          <input type="text" placeholder="e.g. Air conditioning, lighting, pump">
        </div>
        <div class="field">
          <label>Quantity</label>
          <input type="number" placeholder="">
        </div>
        <div class="field">
          <label>Rated Power (kW each)</label>
          <input type="number" placeholder="">
        </div>
        <div class="field">
          <label>Hours / Day</label>
          <input type="number" placeholder="">
        </div>
        <div class="field">
          <label>Critical Load? (backup needed)</label>
          <select><option>Yes</option><option>No</option></select>
        </div>
        <div class="field">
          <label>Notes</label>
          <input type="text" placeholder="">
        </div>
      </div>`;
  } else if (targetId === 'roofList') {
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${title}</div>
        <button type="button" class="btn-remove" onclick="this.closest('.card').remove(); updateProgress();">Remove</button>
      </div>
      <div class="field-grid">
        <div class="field">
          <label>Roof Type / Material</label>
          <select><option value="">Select</option><option>IBR / Corrugated Steel</option><option>Klip-Lok / Standing Seam</option><option>Flat Concrete / RC Slab</option><option>Tiled — Clay or Concrete</option><option>Single-Ply Membrane</option><option>Metal Deck</option><option>Thatch / Organic</option><option>Other</option></select>
        </div>
        <div class="field">
          <label>Roof Geometry</label>
          <select><option value="">Select</option><option>Flat</option><option>Pitched</option><option>Curved</option><option>Multi-level</option></select>
        </div>
        <div class="field">
          <label>Estimated Usable Area (m²)</label>
          <input type="number" placeholder="">
        </div>
        <div class="field">
          <label>Approximate Dimensions (m)</label>
          <input type="text" placeholder="e.g. 20m × 15m">
        </div>
        <div class="field">
          <label>Orientation / Azimuth</label>
          <input type="text" placeholder="e.g. North, 15°">
        </div>
        <div class="field">
          <label>Tilt / Pitch (degrees)</label>
          <input type="number" placeholder="e.g. 20">
        </div>
        <div class="field">
          <label>Roof Condition (visual)</label>
          <select><option value="">Select</option><option>Excellent</option><option>Good</option><option>Fair — monitor</option><option>Poor — repair before install</option></select>
        </div>
        <div class="field">
          <label>Approximate Roof Age (years)</label>
          <input type="number" placeholder="">
        </div>
        <div class="field">
          <label>Obstructions Present</label>
          <input type="text" placeholder="Vents, HVAC, skylights, pipes">
        </div>
        <div class="field">
          <label>Photo References</label>
          <select><option>Cellphone images taken</option><option>Drone images taken</option><option>Both</option><option>No images taken</option></select>
        </div>
      </div>`;
  } else if (targetId === 'groundList') {
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${title}</div>
        <button type="button" class="btn-remove" onclick="this.closest('.card').remove(); updateProgress();">Remove</button>
      </div>
      <div class="field-grid">
        <div class="field">
          <label>Area Name / Reference</label>
          <input type="text" placeholder="">
        </div>
        <div class="field">
          <label>Estimated Usable Area (m²)</label>
          <input type="number" placeholder="">
        </div>
        <div class="field">
          <label>Surface Condition</label>
          <select><option value="">Select</option><option>Concrete</option><option>Gravel</option><option>Compacted soil</option><option>Paved</option><option>Mixed</option><option>Other</option></select>
        </div>
        <div class="field">
          <label>Ground Slope</label>
          <select><option value="">Select</option><option>Flat</option><option>Slight</option><option>Moderate</option><option>Severe</option></select>
        </div>
        <div class="field">
          <label>Drainage Condition</label>
          <select><option value="">Select</option><option>Good</option><option>Moderate</option><option>Poor</option></select>
        </div>
        <div class="field">
          <label>Flooding Risk</label>
          <select><option value="">Select</option><option>None</option><option>Low</option><option>Moderate</option><option>High</option></select>
        </div>
        <div class="field">
          <label>Underground Services Likely?</label>
          <select><option value="">Select</option><option>Yes</option><option>No</option><option>Unknown</option></select>
        </div>
        <div class="field">
          <label>Geotechnical Verification Needed?</label>
          <select><option value="">Select</option><option>Yes</option><option>No</option><option>To be confirmed</option></select>
        </div>
        <div class="field">
          <label>Vehicle / Crane Access</label>
          <select><option value="">Select</option><option>Good — direct access</option><option>Limited</option><option>No access</option></select>
        </div>
        <div class="field">
          <label>Nearby Shading Sources</label>
          <input type="text" placeholder="Trees, buildings, structures">
        </div>
      </div>`;
  } else if (targetId === 'shadingList') {
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${title}</div>
        <button type="button" class="btn-remove" onclick="this.closest('.card').remove(); updateProgress();">Remove</button>
      </div>
      <div class="field-grid">
        <div class="field">
          <label>Main Shade Sources</label>
          <input type="text" placeholder="e.g. Large tree to east, neighbouring building">
        </div>
        <div class="field">
          <label>Time of Observation</label>
          <input type="time">
        </div>
        <div class="field">
          <label>Hours Affected (estimated)</label>
          <input type="text" placeholder="e.g. 08:00–11:00">
        </div>
        <div class="field">
          <label>Severity</label>
          <select><option value="">Select</option><option>Low — partial / edge shading</option><option>Medium — significant but not full</option><option>High — full shading during peak hours</option><option>Exclusion area</option></select>
        </div>
        <div class="field">
          <label>Seasonal Concern</label>
          <input type="text" placeholder="e.g. Worse in winter (lower sun angle)">
        </div>
        <div class="field">
          <label>Notes</label>
          <input type="text" placeholder="">
        </div>
      </div>`;
  } else {
    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${title}</div>
        <button type="button" class="btn-remove" onclick="this.closest('.card').remove(); updateProgress();">Remove</button>
      </div>
      <div class="field-grid">
        <div class="field"><label>Name</label><input type="text"></div>
        <div class="field"><label>Value</label><input type="text"></div>
      </div>`;
  }
  document.getElementById(targetId)?.appendChild(card);
  ensureFieldIdentifiers(card);
}

function addExtraPhoto() {
  extraPhotoCount++;
  const id = `eps${extraPhotoCount}`;
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">Additional Photo #${extraPhotoCount}</div>
      <button type="button" class="btn-remove" onclick="this.closest('.card').remove(); updateProgress();">Remove</button>
    </div>
    <div class="field-grid">
      <div class="field">
        <label>Subject / Description</label>
        <input type="text" placeholder="What does this photo show?">
      </div>
      <div class="field">
        <label>Upload</label>
        <div class="photo-upload-btn">📁 Upload Photo<input type="file" accept="image/*" onchange="previewPhoto(this,'${id}')"></div>
        <img class="photo-preview" id="prev_${id}" style="margin-top:6px;">
      </div>
    </div>`;
  document.getElementById('extraPhotos')?.appendChild(card);
  ensureFieldIdentifiers(card);
}

function previewPhoto(input, slotId) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById(`prev_${slotId}`);
    if (!img) return;
    img.src = e.target.result;
    img.style.display = 'block';
  };
  reader.readAsDataURL(input.files[0]);
}

window.addEventListener('load', () => {
  const form = getForm();
  if (!form) return;
  document.querySelectorAll('button:not([type])').forEach((btn) => { btn.type = 'button'; });
  ensureFieldIdentifiers();
  generateRef();
  loadDraft();
  goTo(0);
  updateProgress();

  const restored = localStorage.getItem(endpointKey);
  if (restored && !form.dataset.submitEndpoint) form.dataset.submitEndpoint = restored;

  const dateField = document.getElementById('assessDate');
  const today = new Date().toISOString().split('T')[0];
  if (dateField && !dateField.value) dateField.value = today;

  document.addEventListener('change', () => { updateProgress(); });
  document.addEventListener('input', () => { updateProgress(); });
});
