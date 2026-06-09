let currentSection = 0;
let totalSections = 0;
let isSubmitting = false;
let submitProgressTimer = null;
const draftKey = 'ge_draft';
const endpointKey = 'ge_submit_endpoint';
const themeKey = 'ge_theme';

function getForm() { return document.getElementById('siteAssessmentForm'); }

function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function themeToggleMoonSvg() {
  return `<svg class="theme-toggle-icon theme-toggle-moon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
}

function themeToggleSunSvg() {
  return `<svg class="theme-toggle-icon theme-toggle-sun" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`;
}

function applyTheme(theme) {
  const mode = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem(themeKey, mode);
  const logo = document.getElementById('headerLogo');
  if (logo) {
    logo.src = mode === 'dark' ? './img/logowhite.png' : './img/logoblack.png';
  }
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.innerHTML = mode === 'dark' ? themeToggleSunSvg() : themeToggleMoonSvg();
    btn.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function toggleTheme() {
  applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  const saved = localStorage.getItem(themeKey);
  applyTheme(saved === 'dark' ? 'dark' : 'light');
}

let toastTimer = null;

function showToast(message, duration = 4500, variant = 'default') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('toast-success', 'toast-error');
  if (variant === 'success') toast.classList.add('toast-success');
  if (variant === 'error') toast.classList.add('toast-error');
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.remove('toast-success', 'toast-error');
  }, duration);
}

function hideSubmitSuccess() {
  document.getElementById('submitSuccess')?.classList.add('hidden');
}

function setSubmitLoadingProgress(value) {
  const bar = document.getElementById('submitLoadingBar');
  const text = document.getElementById('submitLoadingText');
  const progress = Math.max(0, Math.min(100, Math.round(value)));
  if (bar) bar.style.width = `${progress}%`;
  if (text) text.textContent = `${progress}%`;
}

function showSubmitLoading() {
  const overlay = document.getElementById('submitLoading');
  if (!overlay) return;

  clearInterval(submitProgressTimer);
  setSubmitLoadingProgress(0);
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');

  let progress = 0;
  submitProgressTimer = setInterval(() => {
    if (progress < 88) {
      progress += Math.random() * 7 + 1.5;
      setSubmitLoadingProgress(Math.min(88, progress));
    }
  }, 220);

  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
  }
}

function hideSubmitLoading(complete = false) {
  clearInterval(submitProgressTimer);
  submitProgressTimer = null;

  const overlay = document.getElementById('submitLoading');
  if (complete) setSubmitLoadingProgress(100);

  const finish = () => {
    overlay?.classList.add('hidden');
    overlay?.setAttribute('aria-hidden', 'true');
    setSubmitLoadingProgress(0);

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.defaultLabel || 'Submit Assessment';
    }
  };

  if (complete) {
    setTimeout(finish, 320);
  } else {
    finish();
  }
}

function showSubmitSuccess(message, meta = '') {
  const overlay = document.getElementById('submitSuccess');
  const messageEl = document.getElementById('submitSuccessMessage');
  const metaEl = document.getElementById('submitSuccessMeta');
  if (!overlay || !messageEl) {
    showToast(message, 8000, 'success');
    return;
  }

  messageEl.textContent = message;
  if (metaEl) {
    if (meta) {
      metaEl.textContent = meta;
      metaEl.classList.remove('hidden');
    } else {
      metaEl.textContent = '';
      metaEl.classList.add('hidden');
    }
  }

  overlay.classList.remove('hidden');
  showToast(message, 6000, 'success');

  const lastSection = Math.max(0, totalSections - 1);
  if (typeof window.goToFormSection === 'function') window.goToFormSection(lastSection);

  document.getElementById('submitSuccessDismiss')?.focus();
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
  if (label) {
    const cloned = label.cloneNode(true);
    cloned.querySelectorAll('.req, .required').forEach((req) => req.remove());
    return cloned.textContent.replace(/\s+/g, ' ').trim();
  }
  const photoSlot = el.closest('[data-photo-slot]');
  if (photoSlot) return photoSlot.dataset.photoSlot || '';
  return '';
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
      const labelKey = slugify(getFieldLabelText(el) || el.dataset.photoInput || '') || `${el.tagName.toLowerCase()}_${fieldIndex + 1}`;
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
  if (typeof window.goToFormSection === 'function') {
    window.goToFormSection(index);
  } else {
    document.querySelectorAll('.form-section').forEach((s, i) => s.classList.toggle('active', i === index));
    document.querySelectorAll('.step-link').forEach((n, i) => n.classList.toggle('active', i === index));
  }
  currentSection = index;
  updateProgress();
}

function fieldVisible(el) {
  return !el.closest('.hidden');
}

function isFieldRequired(field) {
  if (!field) return false;
  if (field.required || field.dataset.required === 'true') return true;
  const fieldWrapper = field.closest('.field');
  const label = fieldWrapper?.querySelector('label');
  return Boolean(label?.querySelector('.req, .required'));
}

function getValidationLabel(field) {
  const txt = getFieldLabelText(field);
  if (txt) return txt;
  if (field.name) return field.name.replace(/\[\]$/, '').replace(/_/g, ' ');
  return 'This field';
}

function findSectionValidationError(section) {
  if (!section) return null;

  const requiredCheckGroups = [...section.querySelectorAll('[data-check-group="true"][data-required="true"]')].filter(fieldVisible);
  for (const group of requiredCheckGroups) {
    if (!group.querySelector('input:checked')) {
      const labelEl = group.closest('.field')?.querySelector('label');
      const label = labelEl ? getFieldLabelText(group.querySelector('input') || group) : 'This field';
      const firstInput = group.querySelector('input');
      return {
        field: firstInput || group,
        label,
        message: `Please select at least one option for "${label}".`
      };
    }
  }

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

    if (field.tagName === 'SELECT') {
      const val = String(field.value || '').trim();
      if (!val || /^select\b/i.test(val)) {
        return {
          field,
          label: getValidationLabel(field),
          message: `Please fill "${getValidationLabel(field)}".`
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

function sectionHasAnyUserInput(section) {
  if (!section) return false;
  const fields = [...section.querySelectorAll('input, select, textarea')].filter(fieldVisible);
  return fields.some((field) => {
    if (field.readOnly || field.disabled) return false;
    if (field.type === 'checkbox' || field.type === 'radio') return field.checked;
    if (field.type === 'file') return Boolean(field.files && field.files.length);
    return Boolean(String(field.value || '').trim());
  });
}

function getSectionTitle(section, index) {
  const navTitle = document.querySelector(`.step-link[data-step="${index}"] .step-title`);
  if (navTitle) return navTitle.textContent.trim();
  const heading = section?.querySelector('.section-head h2, h2');
  return heading?.textContent.trim() || `Section ${index + 1}`;
}

function findAllValidationErrors() {
  const errors = [];
  for (let i = 0; i < totalSections; i++) {
    const section = document.getElementById(`sec${i}`);
    const error = findSectionValidationError(section);
    if (error) {
      errors.push({
        ...error,
        sectionIndex: i,
        sectionTitle: getSectionTitle(section, i)
      });
    }
  }
  return errors;
}

function findMissingRequiredPhotos() {
  return [...document.querySelectorAll('[data-required-photo="true"]')]
    .filter((slot) => fieldVisible(slot) && !slot.classList.contains('complete'))
    .map((slot) => {
      const section = slot.closest('.form-section');
      const sectionIndex = Number(section?.dataset.section ?? section?.id?.replace('sec', '') ?? 0);
      return {
        field: slot.querySelector('[data-photo-input]') || slot.querySelector('input[type="file"]'),
        label: slot.dataset.photoSlot || 'Photo',
        sectionIndex,
        sectionTitle: getSectionTitle(section, sectionIndex),
        message: `Please upload: "${slot.dataset.photoSlot || 'Photo'}".`
      };
    });
}

function clearValidationHighlights() {
  document.querySelectorAll('.field-invalid, .photo-slot-invalid, .subsection-invalid').forEach((el) => {
    el.classList.remove('field-invalid', 'photo-slot-invalid', 'subsection-invalid');
  });
  document.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'));
}

function highlightValidationError(error) {
  clearValidationHighlights();
  const field = error?.field;
  if (!field) return;

  const wrapper =
    field.closest('.field') ||
    field.closest('.photo-slot') ||
    field.closest('.repeat-item') ||
    field.closest('.subsection');
  if (wrapper) {
    wrapper.classList.add(wrapper.classList.contains('photo-slot') ? 'photo-slot-invalid' : 'field-invalid');
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  field.setAttribute('aria-invalid', 'true');
  setTimeout(() => {
    if (typeof field.focus === 'function' && field.type !== 'hidden') {
      field.focus({ preventScroll: true });
    }
    if (typeof field.select === 'function' && (field.type === 'text' || field.tagName === 'TEXTAREA')) {
      field.select();
    }
  }, 120);
}

function focusValidationError(error) {
  highlightValidationError(error);
}

function goToValidationIssue(issue) {
  if (!issue) return;
  goTo(issue.sectionIndex);
  setTimeout(() => highlightValidationError(issue), 180);
}

function getFormValidationIssues() {
  return {
    fields: findAllValidationErrors(),
    photos: findMissingRequiredPhotos()
  };
}

function formatIssueList(issues, max = 3) {
  const slice = issues.slice(0, max);
  const labels = slice.map((i) => `“${i.label}” (${i.sectionTitle})`).join(', ');
  const extra = issues.length > max ? ` (+${issues.length - max} more)` : '';
  return `${labels}${extra}`;
}

function sectionIsComplete(section) {
  return !findSectionValidationError(section);
}

function updateNavChecks() {
  document.querySelectorAll('.form-section').forEach((section, i) => {
    const nav = document.querySelectorAll('.step-link')[i];
    if (!nav) return;
    const hasInput = sectionHasAnyUserInput(section);
    const done = hasInput && sectionIsComplete(section);
    nav.classList.toggle('done', done);
  });
}

function updateProgress() {
  if (typeof window.updateFormProgress === 'function') window.updateFormProgress();
  updateNavChecks();
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
  const ref = document.getElementById('refId');
  if (!ref || String(ref.value || '').trim()) return;
  const now = new Date();
  const code = now.getFullYear().toString().slice(-2) + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  ref.value = `GE-SAR-${code}-${rand}`;
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
  if (isSubmitting) return;

  clearValidationHighlights();
  const { fields, photos } = getFormValidationIssues();
  const blocking = [...fields, ...photos];

  if (blocking.length) {
    goToValidationIssue(blocking[0]);
    showToast(blocking[0].message || `Please complete ${formatIssueList(blocking)}`);
    if (typeof window.buildFormWarnings === 'function') window.buildFormWarnings(true);
    return;
  }

  if (typeof window.buildFormWarnings === 'function') window.buildFormWarnings(true);

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

  isSubmitting = true;
  showSubmitLoading();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: buildSubmissionFormData()
    });

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (parseError) {
        data = null;
      }
    }
    if (!response.ok) {
      hideSubmitLoading(false);
      showToast(data?.message || `Submission failed (${response.status})`, 7000, 'error');
      return;
    }

    hideSubmitLoading(true);

    const successMessage =
      data?.message ||
      data?.data?.message ||
      'Your site assessment was submitted successfully. The Granville Energy team can now review it.';

    const reference =
      data?.reference_id ||
      data?.referenceId ||
      data?.data?.reference_id ||
      data?.data?.id ||
      data?.id;

    const meta = reference ? `Reference: ${reference}` : '';
    showSubmitSuccess(successMessage, meta);
    localStorage.setItem(draftKey, JSON.stringify(collectDraftData()));
  } catch (error) {
    hideSubmitLoading(false);
    showToast(error.message || 'Submission failed', 7000, 'error');
  } finally {
    isSubmitting = false;
  }
}

function pageWasReloaded() {
  const navEntries = performance.getEntriesByType?.('navigation') || [];
  if (navEntries.length && navEntries[0].type === 'reload') return true;
  return performance.navigation && performance.navigation.type === 1;
}

function clearFormData(form) {
  if (!form) return;
  form.reset();
  localStorage.removeItem(draftKey);
  document.querySelectorAll('.check-pill input[type="checkbox"], .check-pill input[type="radio"]').forEach((input) => {
    input.checked = false;
    input.parentElement?.classList.remove('checked');
  });
  document.querySelectorAll('.photo-preview').forEach((img) => {
    img.removeAttribute('src');
    img.style.display = 'none';
  });
}

window.ensureFieldIdentifiers = ensureFieldIdentifiers;
window.submitForm = submitForm;
window.goTo = goTo;
window.updateProgress = updateProgress;
window.getFormValidationIssues = getFormValidationIssues;
window.goToValidationIssue = goToValidationIssue;
window.fieldVisible = fieldVisible;

function initSiteAssessmentApp() {
  initTheme();
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  totalSections = typeof window.getFormSectionCount === 'function' ? window.getFormSectionCount() : 0;

  const form = getForm();
  if (!form) return;
  if (pageWasReloaded()) clearFormData(form);
  document.querySelectorAll('button:not([type])').forEach((btn) => { btn.type = 'button'; });
  ensureFieldIdentifiers();
  loadDraft();
  generateRef();
  if (typeof window.applyFormConditions === 'function') window.applyFormConditions();
  currentSection = 0;
  updateProgress();

  const restored = localStorage.getItem(endpointKey);
  if (restored && !form.dataset.submitEndpoint) form.dataset.submitEndpoint = restored;

  const dateField = document.getElementById('assessDate');
  const today = new Date().toISOString().split('T')[0];
  if (dateField && !dateField.value) dateField.value = today;

  document.getElementById('warnings')?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-goto-issue]');
    if (!btn) return;
    const index = Number(btn.dataset.gotoIssue);
    const { fields, photos } = getFormValidationIssues();
    const issue = [...fields, ...photos][index];
    if (issue) goToValidationIssue(issue);
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('input, select, textarea')) clearValidationHighlights();
  });
  document.addEventListener('change', (event) => {
    if (event.target.matches('input, select, textarea')) clearValidationHighlights();
  });

  form.addEventListener('click', (event) => {
    const submitBtn = event.target.closest('#submitBtn');
    if (!submitBtn) return;
    event.preventDefault();
    event.stopPropagation();
    submitForm();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitForm();
  });

  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn && !submitBtn.dataset.defaultLabel) {
    submitBtn.dataset.defaultLabel = submitBtn.textContent.trim();
  }

  document.getElementById('submitSuccessDismiss')?.addEventListener('click', hideSubmitSuccess);
  document.getElementById('submitSuccess')?.addEventListener('click', (event) => {
    if (event.target.id === 'submitSuccess') hideSubmitSuccess();
  });
}

window.initSiteAssessmentApp = initSiteAssessmentApp;
