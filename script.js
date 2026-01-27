lucide.createIcons();

let currentStep = 1;
const totalSteps = 3;

function movePage(delta) {
    // 1. Logic to handle the final submission
    if (currentStep === totalSteps && delta === 1) {
        submitToHubSpot();
        return;
    }

    // Hide Current
    document.getElementById(`p${currentStep}`).classList.remove('active');
    document.getElementById(`s${currentStep}`).classList.remove('active');

    currentStep += delta;

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

function submitToHubSpot() {
    const form = document.getElementById('assessmentForm');
    const emailValue = form.querySelector('input[name="email"]').value;

    if (!emailValue) {
        alert("Please provide a client email before submitting.");
        // Jump back to page 1 if email is missing
        movePage(-(totalSteps - 1));
        return;
    }

    // 2. Identify the user for HubSpot Tracker
    var _hsq = window._hsq = window._hsq || [];
    _hsq.push(["identify", {
        email: emailValue
    }]);

    // 3. Trigger the submission
    // We dispatch a 'submit' event so the HubSpot tracker "hears" it
    const event = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);

    alert("Granville Energy: Site Assessment Submitted Successfully.");
    
    // Give HubSpot a second to capture before reloading
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// Keep your existing option-card toggle logic here...