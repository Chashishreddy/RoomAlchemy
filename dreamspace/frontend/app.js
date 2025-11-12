const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const statusEl = document.getElementById('status');
const styleSelector = document.getElementById('style-selector');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn');
const resultsCard = document.getElementById('results-card');
const originalImage = document.getElementById('original-image');
const redesignedImage = document.getElementById('redesigned-image');
const comparisonSlider = document.getElementById('comparison-slider');
const afterOverlay = document.getElementById('after-overlay');

let selectedStyle = 'Minimalist';
let selectedFile = null;
let redesignedBlob = null;
let redesignedUrl = null;

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxSizeBytes = 8 * 1024 * 1024;

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
};

const clearRedesignedPreview = () => {
  redesignedBlob = null;
  if (redesignedUrl) {
    URL.revokeObjectURL(redesignedUrl);
    redesignedUrl = null;
  }
  downloadBtn.disabled = true;
};

const showPreview = (file) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    originalImage.src = event.target.result;
    originalImage.removeAttribute('hidden');
    resultsCard.hidden = false;
  };
  reader.readAsDataURL(file);
};

const validateFile = (file) => {
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Unsupported file type. Please upload JPEG, PNG, or WEBP images.');
  }
  if (file.size > maxSizeBytes) {
    throw new Error('File too large. Please upload an image smaller than 8MB.');
  }
};

const handleFiles = (files) => {
  const file = files[0];
  if (!file) return;

  try {
    validateFile(file);
    selectedFile = file;
    showPreview(file);
    clearRedesignedPreview();
    setStatus(`Selected: ${file.name}`);
  } catch (error) {
    setStatus(error.message, true);
    selectedFile = null;
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  const files = event.dataTransfer.files;
  handleFiles(files);
};

const handleDragOver = (event) => {
  event.preventDefault();
  dropZone.classList.add('dragover');
};

const handleDragLeave = () => {
  dropZone.classList.remove('dragover');
};

const updateStyleSelection = (button) => {
  styleSelector.querySelectorAll('.style-button').forEach((btn) => {
    btn.classList.toggle('active', btn === button);
    btn.setAttribute('aria-selected', btn === button ? 'true' : 'false');
  });
  selectedStyle = button.dataset.style;
};

const applySliderPosition = (value) => {
  const percentage = `${value}%`;
  afterOverlay.style.clipPath = `inset(0 0 0 ${percentage})`;
};

const sendRedesignRequest = async () => {
  if (!selectedFile) {
    setStatus('Please upload a room photo before generating.', true);
    return;
  }

  setStatus('Sending to DreamSpace AI… this may take up to a minute.');
  generateBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('style', selectedStyle);

    const response = await fetch('/api/redesign', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Redesign failed: ${response.status} ${errorText}`);
    }

    const blob = await response.blob();
    redesignedBlob = blob;
    redesignedUrl = URL.createObjectURL(blob);
    redesignedImage.src = redesignedUrl;
    afterOverlay.style.clipPath = 'inset(0 0 0 50%)';
    comparisonSlider.value = 50;
    resultsCard.hidden = false;
    downloadBtn.disabled = false;
    setStatus('Success! Use the slider to compare your new DreamSpace.');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Something went wrong while generating.', true);
  } finally {
    generateBtn.disabled = false;
  }
};

const downloadImage = () => {
  if (!redesignedBlob) return;
  const url = redesignedUrl || URL.createObjectURL(redesignedBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dreamspace-${selectedStyle.replace(/\s+/g, '-').toLowerCase()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', (event) => handleFiles(event.target.files));

styleSelector.addEventListener('click', (event) => {
  if (event.target.matches('.style-button')) {
    updateStyleSelection(event.target);
  }
});

generateBtn.addEventListener('click', sendRedesignRequest);
downloadBtn.addEventListener('click', downloadImage);
comparisonSlider.addEventListener('input', (event) => applySliderPosition(event.target.value));

applySliderPosition(comparisonSlider.value);

window.addEventListener('beforeunload', () => {
  if (redesignedUrl) {
    URL.revokeObjectURL(redesignedUrl);
  }
});
