
    lucide.createIcons();

    let currentStep = 1;
    const totalSteps = 3;

    function collectFormData() {
        const form = document.getElementById('assessmentForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Collect checkboxes and radio buttons
        form.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            if (!data[checkbox.name]) {
                data[checkbox.name] = [];
            }
            if (Array.isArray(data[checkbox.name])) {
                data[checkbox.name].push(checkbox.parentElement.textContent.trim());
            }
        });
        
        // Get selected radio value
        const selectedRadio = form.querySelector('input[type="radio"]:checked');
        if (selectedRadio) {
            data.primary_objective = selectedRadio.parentElement.textContent.trim();
        }
        
        return data;
    }

    function submitToHubSpot(formData) {
        // HubSpot form submission endpoint
        const hubspotPortalId = '8605810'; // Your HubSpot Portal ID
        const hubspotFormId = '8f0d7e8b-8c3f-4b9f-8c3f-4b9f8c3f4b9f'; // You'll need to get this from HubSpot
        
        // Map form fields to HubSpot fields
        const hubspotPayload = {
            fields: [
                { name: 'firstname', value: formData.lead_engineer || '' },
                { name: 'hs_lead_status', value: 'NEW' },
                { name: 'company', value: formData.client_company_name || '' },
                { name: 'address', value: formData.site_address || '' },
                { name: 'assessment_date', value: formData.assessment_date || '' },
                { name: 'supply_configuration', value: formData.supply_configuration || '' },
                { name: 'meter_type', value: formData.meter_type || '' },
                { name: 'avg_monthly_kwh', value: formData.avg_monthly_kwh || '' },
                { name: 'avg_monthly_spend', value: formData.avg_monthly_spend || '' },
                { name: 'primary_objective', value: formData.primary_objective || '' },
                { name: 'roof_material', value: formData.roof_material || '' },
                { name: 'roof_orientation', value: formData.roof_orientation || '' },
                { name: 'main_breaker_amps', value: formData.main_breaker_amps || '' },
                { name: 'cable_distance_m', value: formData.cable_distance_m || '' },
                { name: 'engineering_notes', value: formData.engineering_notes || '' }
            ]
        };
        
        // Send to HubSpot via their API
        fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${hubspotPortalId}/${hubspotFormId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(hubspotPayload)
        })
        .then(response => {
            if (response.ok) {
                alert("Granville Energy: Site Assessment Submitted Successfully.");
                location.reload();
            } else {
                console.error('HubSpot submission error:', response);
                alert("Assessment submitted locally. There was an issue with HubSpot integration.");
                location.reload();
            }
        })
        .catch(error => {
            console.error('Error submitting to HubSpot:', error);
            alert("Assessment submitted locally. There was an issue with HubSpot integration.");
            location.reload();
        });
    }

    function movePage(delta) {
        // Validation Check (Optional)
        
        // Hide Current
        document.getElementById(`p${currentStep}`).classList.remove('active');
        document.getElementById(`s${currentStep}`).classList.remove('active');

        currentStep += delta;

        // Finish Logic
        if (currentStep > totalSteps) {
            const formData = collectFormData();
            submitToHubSpot(formData);
            return;
        }

        // Show New
        document.getElementById(`p${currentStep}`).classList.add('active');
        document.getElementById(`s${currentStep}`).classList.add('active');

        // UI Controls
        document.getElementById('prevBtn').classList.toggle('hidden', currentStep === 1);
        
        const nextBtn = document.getElementById('nextBtn');
        if (currentStep === totalSteps) {
            nextBtn.innerHTML = 'Finish Assessment <i data-lucide="check"></i>';
        } else {
            nextBtn.innerHTML = 'Next Step <i data-lucide="chevron-right"></i>';
        }

        lucide.createIcons();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Toggle styling for selected options
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('change', () => {
            if (card.querySelector('input').type === 'radio') {
                card.closest('.option-grid').querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
            }
            if (card.querySelector('input').checked) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    });
