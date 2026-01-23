
    lucide.createIcons();

    let currentStep = 1;
    const totalSteps = 3;
    const form = document.getElementById('assessmentForm');

    // 4. Update the logic to handle the transition between steps and actual submission
    function handleNextClick() {
        if (currentStep < totalSteps) {
            movePage(1);
        } else {
            // This triggers the Formspree submission
            form.submit();
        }
    }

    function movePage(delta) {
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
            nextBtn.innerHTML = 'Finish & Submit <i data-lucide="send"></i>';
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