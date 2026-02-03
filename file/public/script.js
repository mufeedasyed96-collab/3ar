document.addEventListener('DOMContentLoaded', () => {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const processingIndicator = document.getElementById('processingIndicator');
    const uploadSection = document.getElementById('uploadSection');
    const resultsSection = document.getElementById('resultsSection');
    const resetBtn = document.getElementById('resetBtn');

    const fullNameValue = document.getElementById('fullNameValue');
    const givenNamesValue = document.getElementById('givenNamesValue');
    const surnameValue = document.getElementById('surnameValue');
    const nationalityValue = document.getElementById('nationalityValue');
    const nationalityCodeValue = document.getElementById('nationalityCodeValue');
    const sourceBadge = document.getElementById('sourceBadge');
    const warningsSection = document.getElementById('warningsSection');
    const warningsList = document.getElementById('warningsList');

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.remove('dragover');
        });
    });

    uploadZone.addEventListener('drop', handleDrop);
    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    function handleDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }

    async function processFile(file) {
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a PDF, JPG, or PNG file.');
            return;
        }

        // Show processing indicator
        processingIndicator.classList.add('active');
        uploadZone.classList.add('hidden');

        try {
            const formData = new FormData();
            formData.append('passport', file);

            const response = await fetch('/api/process', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            // Display results
            displayResults(result);
        } catch (error) {
            alert('Error processing document: ' + error.message);
            resetView();
        }
    }

    function displayResults(result) {
        // ❗ Always display normalized full_name, never raw MRZ
        fullNameValue.textContent = result.full_name || 'Not detected';
        givenNamesValue.textContent = result.given_names || '--';
        surnameValue.textContent = result.surname || '--';
        nationalityValue.textContent = result.nationality || 'Not detected';
        nationalityCodeValue.textContent = result.nationality_code || '--';
        sourceBadge.textContent = result.data_source || 'Unknown';

        // Handle warnings
        if (result.warnings && result.warnings.length > 0) {
            warningsSection.classList.add('active');
            warningsList.textContent = result.warnings.join(', ');
        } else {
            warningsSection.classList.remove('active');
        }

        // Show results
        uploadSection.classList.add('hidden');
        resultsSection.classList.add('active');
    }

    function resetView() {
        processingIndicator.classList.remove('active');
        uploadZone.classList.remove('hidden');
        uploadSection.classList.remove('hidden');
        resultsSection.classList.remove('active');
        warningsSection.classList.remove('active');
        fileInput.value = '';
    }

    resetBtn.addEventListener('click', resetView);
});
