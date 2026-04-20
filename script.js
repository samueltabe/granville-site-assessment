
    const form = document.getElementById('siteAssessmentForm');
    const assessmentType = document.getElementById('assessmentType');
    const assessmentRef = document.getElementById('assessmentRef');
    const statusText = document.getElementById('statusText');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const navLinks = [...document.querySelectorAll('.nav-link')];
    const storageKey = 'masterSiteAssessmentDraft_v1';
    const endpointStorageKey = 'masterSiteAssessmentSubmitEndpoint_v1';
    const sections = [...document.querySelectorAll('form .section-card')];
    const wizardStepTitle = document.getElementById('wizardStepTitle');
    const prevButtons = [document.getElementById('prevSectionBtn'), document.getElementById('prevSectionBtnBottom')];
    const nextButtons = [document.getElementById('nextSectionBtn'), document.getElementById('nextSectionBtnBottom')];
    const submitButton = form.querySelector('button[type="submit"]');
    let currentSectionIndex = 0;

    const environmentFields = [
      'Salt Mist / Saline Atmosphere', 'High Humidity', 'Dust', 'Heavy Rain', 'Standing Water',
      'Wind Exposure', 'Vibration', 'Corrosive Industrial Atmosphere', 'High Temperature', 'Lightning Exposure'
    ];

    const environmentGrid = document.getElementById('environmentGrid');
    environmentFields.forEach((label, index) => {
      const safe = 'env_' + index;
      const wrapper = document.createElement('div');
      wrapper.className = 'field col-3';
      wrapper.innerHTML = `
        <label for="${safe}">${label} <span class="required-mark">*</span></label>
        <select id="${safe}" name="${safe}" required>
          <option value="">Select</option>
          <option>Yes</option>
          <option>No</option>
          <option>Unknown</option>
        </select>`;
      environmentGrid.appendChild(wrapper);
    });

    ['Recommended Mounting Material', 'Cable / Conduit Protection Needs', 'Enclosure IP Rating Considerations', 'BESS Environmental Protection Needs'].forEach((label, idx) => {
      const safe = 'env_text_' + idx;
      const wrapper = document.createElement('div');
      wrapper.className = 'field col-3';
      wrapper.innerHTML = `
        <label for="${safe}">${label} <span class="required-mark">*</span></label>
        <textarea id="${safe}" name="${safe}" required></textarea>`;
      environmentGrid.appendChild(wrapper);
    });

    const repeatMaps = {
      measurement: { list: document.getElementById('measurementsList'), template: 'measurementTemplate' },
      roof: { list: document.getElementById('roofList'), template: 'roofTemplate' },
      ground: { list: document.getElementById('groundList'), template: 'groundTemplate' },
      shade: { list: document.getElementById('shadingList'), template: 'shadeTemplate' }
    };
    document.querySelectorAll('input[name="electricitySource"]').forEach((field) => {
      field.required = false;
    });

    function generateRef() {
      const d = new Date();
      const y = d.getFullYear().toString().slice(-2);
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
      assessmentRef.value = `SA-${y}${m}${day}-${rand}`;
    }

    function addRepeat(type, data = {}) {
      const { list, template } = repeatMaps[type];
      const fragment = document.getElementById(template).content.cloneNode(true);
      const card = fragment.querySelector('.repeat-card');
      const index = list.children.length + 1;
      card.dataset.repeatType = type;
      card.querySelector('.repeat-head strong').textContent += ` ${index}`;
      card.querySelectorAll('[data-name]').forEach((el) => {
        const key = `${type}_${index}_${el.dataset.name}`;
        el.name = key;
        el.id = key;
        if (data[key] !== undefined) el.value = data[key];
      });
      list.appendChild(fragment);
      updateVisibility();
      updateProgress();
    }

    function ensureMinimumRepeats() {
      if (!document.getElementById('measurementsList').children.length) addRepeat('measurement');
      if (!document.getElementById('roofList').children.length) addRepeat('roof');
      if (!document.getElementById('shadingList').children.length) addRepeat('shade');
      const type = assessmentType.value;
      if ((type === 'Commercial' || type === 'Utility-Scale') && !document.getElementById('groundList').children.length) addRepeat('ground');
      if (type === 'Residential') document.getElementById('groundList').innerHTML = '';
    }

    function setSectorRequirement(selector, active) {
      document.querySelectorAll(selector).forEach((block) => {
        block.classList.toggle('hidden', !active);
        block.querySelectorAll('input, select, textarea').forEach((field) => {
          const isFile = field.type === 'file';
          if (active) {
            if (field.closest('.field, .repeat-card')) {
              field.dataset.wasSectorActive = 'true';
            }
            if (field.closest('.field') && field.previousElementSibling && field.previousElementSibling.innerText.includes('*') && !isFile) {
              field.required = true;
            }
          } else {
            field.required = false;
            if (!isFile) field.value = '';
          }
        });
      });
    }

    function updateVisibility() {
      const type = assessmentType.value;
      setSectorRequirement('.sector-residential', type === 'Residential');
      setSectorRequirement('.sector-commercial', type === 'Commercial');
      setSectorRequirement('.sector-utility', type === 'Utility-Scale');

      document.querySelectorAll('.rooftop-block').forEach(el => {
        const show = type === 'Residential' || type === 'Commercial';
        el.classList.toggle('hidden', !show);
        el.querySelectorAll('input, select, textarea').forEach(f => f.required = show);
      });

      document.querySelectorAll('.ground-block').forEach(el => {
        const show = type === 'Commercial' || type === 'Utility-Scale';
        el.classList.toggle('hidden', !show);
        el.querySelectorAll('input, select, textarea').forEach(f => f.required = show);
      });

      document.getElementById('measurementsBlockSection').classList.toggle('hidden', document.getElementById('measurementsTaken').value === 'No');
      document.querySelectorAll('#measurementsList input, #measurementsList select, #measurementsList textarea').forEach((f) => {
        f.required = document.getElementById('measurementsTaken').value !== 'No';
      });

      ensureMinimumRepeats();
      updateProgress();
    }

    function logicallyVisible(field) {
      if (field.disabled || field.type === 'hidden') return false;
      if (field.closest('.hidden')) return false;
      return true;
    }

    function visibleField(field) {
      return logicallyVisible(field);
    }

    function checkboxGroupSatisfied(name) {
      return [...document.querySelectorAll(`input[name="${name}"]`)].some(cb => cb.checked);
    }

    function getVisibleRequiredFields() {
      return [...form.querySelectorAll('input, select, textarea')].filter(field => visibleField(field) && field.required);
    }

    function getSectionRequiredFields(section) {
      return [...section.querySelectorAll('input, select, textarea')].filter(field => logicallyVisible(field) && field.required);
    }

    function validateSection(index, showMessage = true) {
      const section = sections[index];
      if (!section) return true;
      const fields = getSectionRequiredFields(section);
      let firstInvalid = null;
      let valid = true;

      if (section.id === 'section-1' && !checkboxGroupSatisfied('electricitySource')) {
        valid = false;
        firstInvalid = firstInvalid || document.querySelector('input[name="electricitySource"]');
      }

      fields.forEach(field => {
        if (field.type === 'checkbox') return;
        if (field.type === 'file') return;
        if (!field.checkValidity() || !String(field.value).trim()) {
          valid = false;
          if (!firstInvalid) firstInvalid = field;
        }
      });

      if (!valid && showMessage) {
        statusText.textContent = 'Please complete all required fields in this section before moving on.';
        statusText.style.color = 'var(--danger)';
        firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid?.focus();
      }

      updateProgress();
      return valid;
    }

    function renderWizard() {
      sections.forEach((section, index) => section.classList.toggle('wizard-hidden', index !== currentSectionIndex));
      navLinks.forEach((link, index) => link.classList.toggle('active', index === currentSectionIndex));
      const current = sections[currentSectionIndex];
      wizardStepTitle.textContent = `Section ${currentSectionIndex + 1} of ${sections.length} · ${current.querySelector('h3')?.textContent || ''}`;
      prevButtons.forEach(btn => btn.disabled = currentSectionIndex === 0);
      nextButtons.forEach(btn => {
        btn.disabled = currentSectionIndex === sections.length - 1;
        btn.textContent = currentSectionIndex === sections.length - 2 ? 'Review final step →' : 'Next →';
      });
      current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function goToSection(index, options = {}) {
      const bounded = Math.max(0, Math.min(index, sections.length - 1));
      currentSectionIndex = bounded;
      renderWizard();
      if (!options.silent) updateProgress();
    }

    function goNextSection() {
      if (!validateSection(currentSectionIndex, true)) return;
      goToSection(currentSectionIndex + 1);
    }

    function goPrevSection() {
      goToSection(currentSectionIndex - 1);
    }

    function updateProgress() {
      const fields = getVisibleRequiredFields();
      let complete = 0;
      fields.forEach(field => {
        if (field.type === 'checkbox') return;
        if (field.type === 'file') {
          if (field.files && field.files.length > 0) complete++;
        } else if (field.value && String(field.value).trim() !== '') {
          complete++;
        }
      });
      const checkboxBonus = checkboxGroupSatisfied('electricitySource') ? 1 : 0;
      const checkboxRequired = 1;
      const total = fields.filter(f => f.type !== 'checkbox').length + checkboxRequired;
      const done = complete + checkboxBonus;
      const percent = total ? Math.round((done / total) * 100) : 0;
      progressText.textContent = `${percent}%`;
      progressFill.style.width = `${percent}%`;
    }

    function validateForm(showMessage = true) {
      const fields = getVisibleRequiredFields();
      let firstInvalid = null;
      let valid = true;

      if (!checkboxGroupSatisfied('electricitySource')) {
        valid = false;
        firstInvalid = firstInvalid || document.querySelector('input[name="electricitySource"]');
      }

      fields.forEach(field => {
        if (field.type === 'checkbox') {
          return;
        }
        if (field.type === 'file') {
          return;
        }
        if (!field.checkValidity() || !String(field.value).trim()) {
          valid = false;
          if (!firstInvalid) firstInvalid = field;
        }
      });

      if (!valid && showMessage) {
        statusText.textContent = 'Please complete all required fields across all steps, then submit to the Laravel endpoint.';
        statusText.style.color = 'var(--danger)';
        firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid?.focus();
      } else if (valid && showMessage) {
        statusText.textContent = 'All required steps are complete. You can now submit to the Laravel endpoint.';
        statusText.style.color = 'var(--success)';
      }
      updateProgress();
      return valid;
    }

    function gatherData() {
      const data = {};
      const fd = new FormData(form);
      for (const [key, value] of fd.entries()) {
        if (value instanceof File && value.name === '') continue;
        if (data[key]) {
          if (!Array.isArray(data[key])) data[key] = [data[key]];
          data[key].push(value instanceof File ? value.name : value);
        } else {
          data[key] = value instanceof File ? value.name : value;
        }
      }
      data.electricitySource = [...document.querySelectorAll('input[name="electricitySource"]:checked')].map(el => el.value);
      return data;
    }

    function saveDraft() {
      localStorage.setItem(storageKey, JSON.stringify(gatherData()));
      statusText.textContent = 'Draft saved to this browser.';
      statusText.style.color = 'var(--success)';
    }

    function loadDraft() {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        statusText.textContent = 'No saved draft found in this browser.';
        statusText.style.color = 'var(--danger)';
        return;
      }
      const data = JSON.parse(raw);
      if (data.assessmentType) assessmentType.value = data.assessmentType;
      if (data.bills12_available === undefined && data.bills12 !== undefined && typeof data.bills12 === 'string') {
        const bills12Avail = document.getElementById('bills12_available');
        if (bills12Avail) bills12Avail.value = data.bills12;
      }
      updateVisibility();
      [...form.querySelectorAll('input, select, textarea')].forEach(field => {
        if (field.type === 'file' || field.type === 'checkbox' || !field.name) return;
        if (data[field.name] !== undefined) field.value = data[field.name];
      });
      document.querySelectorAll('input[name="electricitySource"]').forEach(cb => {
        cb.checked = Array.isArray(data.electricitySource) && data.electricitySource.includes(cb.value);
      });

      ['measurement', 'roof', 'ground', 'shade'].forEach(type => {
        repeatMaps[type].list.innerHTML = '';
        const groups = Object.keys(data).filter(key => key.startsWith(type + '_')).reduce((acc, key) => {
          const parts = key.split('_');
          const idx = parts[1];
          acc[idx] = acc[idx] || {};
          acc[idx][key] = data[key];
          return acc;
        }, {});
        const entries = Object.values(groups);
        if (entries.length) entries.forEach(item => addRepeat(type, item));
      });

      if (!document.getElementById('measurementsList').children.length) addRepeat('measurement');
      if (!document.getElementById('roofList').children.length) addRepeat('roof');
      if ((assessmentType.value === 'Commercial' || assessmentType.value === 'Utility-Scale') && !document.getElementById('groundList').children.length) addRepeat('ground');
      if (!document.getElementById('shadingList').children.length) addRepeat('shade');

      statusText.textContent = 'Draft loaded from this browser.';
      statusText.style.color = 'var(--success)';
      updateProgress();
    }

    function exportJson() {
      const blob = new Blob([JSON.stringify(gatherData(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assessmentRef.value || 'site-assessment'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      statusText.textContent = 'JSON export downloaded.';
      statusText.style.color = 'var(--success)';
    }

    function getCsrfToken() {
      return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    }

    function resolveSubmitEndpoint() {
      const fromDataset = (form.dataset.submitEndpoint || '').trim();
      const fromStorage = (localStorage.getItem(endpointStorageKey) || '').trim();
      const fromGlobal = (window.SITE_ASSESSMENT_API_URL || '').trim();
      return fromDataset || fromStorage || fromGlobal || '';
    }

    function saveSubmitEndpoint(url) {
      const normalized = (url || '').trim();
      if (!normalized) return;
      form.dataset.submitEndpoint = normalized;
      localStorage.setItem(endpointStorageKey, normalized);
    }

    function buildSubmissionFormData() {
      const payload = new FormData(form);
      payload.delete('electricitySource');
      [...document.querySelectorAll('input[name="electricitySource"]:checked')].forEach((field) => {
        payload.append('electricitySource[]', field.value);
      });
      payload.append('submittedAt', new Date().toISOString());
      return payload;
    }

    async function submitToLaravel() {
      let endpoint = resolveSubmitEndpoint();
      if (!endpoint) {
        const enteredUrl = window.prompt(
          'Enter your Laravel endpoint URL (example: https://api.your-domain.com/api/site-assessments):',
          'https://api.your-domain.com/api/site-assessments'
        );
        if (!enteredUrl || !enteredUrl.trim()) {
          statusText.textContent = 'Submission cancelled. No Laravel endpoint URL was provided.';
          statusText.style.color = 'var(--danger)';
          return false;
        }
        saveSubmitEndpoint(enteredUrl);
        endpoint = resolveSubmitEndpoint();
      }

      const previousLabel = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
      statusText.textContent = 'Submitting form data to Laravel endpoint...';
      statusText.style.color = 'var(--text)';

      try {
        const csrfToken = getCsrfToken();
        const headers = { Accept: 'application/json' };
        if (csrfToken) headers['X-CSRF-TOKEN'] = csrfToken;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: buildSubmissionFormData()
        });

        let responseData = null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const text = await response.text();
          responseData = text ? { message: text } : null;
        }

        if (!response.ok) {
          const fallbackMessage = `Submission failed with status ${response.status}.`;
          const errorMessage = responseData?.message || fallbackMessage;
          throw new Error(errorMessage);
        }

        statusText.textContent = responseData?.message || 'Submission successful. Data was sent to Laravel backend.';
        statusText.style.color = 'var(--success)';
        saveDraft();
        return true;
      } catch (error) {
        statusText.textContent = error.message || 'Submission failed. Check backend URL, CORS, and Laravel logs.';
        statusText.style.color = 'var(--danger)';
        return false;
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = previousLabel;
      }
    }

    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add-repeat]');
      if (addBtn) {
        addRepeat(addBtn.dataset.addRepeat);
      }
      const removeBtn = e.target.closest('[data-remove-repeat]');
      if (removeBtn) {
        removeBtn.closest('.repeat-card')?.remove();
        updateProgress();
      }
    });

    form.addEventListener('input', updateProgress);
    form.addEventListener('change', updateProgress);
    form.addEventListener('change', (e) => {
      if (e.target === assessmentType || e.target.id === 'measurementsTaken') updateVisibility();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (validateForm(true)) {
        await submitToLaravel();
      }
    });

    document.getElementById('saveDraftBtn').addEventListener('click', saveDraft);
    document.getElementById('loadDraftBtn').addEventListener('click', loadDraft);
    document.getElementById('exportJsonBtn').addEventListener('click', exportJson);
    document.getElementById('printBtn').addEventListener('click', () => window.print());
    document.getElementById('validateBtn').addEventListener('click', () => validateForm(true));
    prevButtons.forEach(btn => btn.addEventListener('click', goPrevSection));
    nextButtons.forEach(btn => btn.addEventListener('click', goNextSection));
    navLinks.forEach((link, index) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (index > currentSectionIndex && !validateSection(currentSectionIndex, true)) return;
        goToSection(index);
      });
    });

    generateRef();
    const restoredEndpoint = (localStorage.getItem(endpointStorageKey) || '').trim();
    if (restoredEndpoint && !(form.dataset.submitEndpoint || '').trim()) {
      form.dataset.submitEndpoint = restoredEndpoint;
    }
    addRepeat('measurement');
    addRepeat('roof');
    addRepeat('shade');
    updateVisibility();
    goToSection(0, { silent: true });
    updateProgress();
  