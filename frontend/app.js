const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseLink = document.getElementById('browse-link');
const styleButtons = Array.from(document.querySelectorAll('.style'));
const redesignBtn = document.getElementById('redesign-btn');
const statusEl = document.getElementById('status');
const progressEl = document.getElementById('progress');
const resultSection = document.querySelector('.result');
const beforeImg = document.getElementById('before-img');
const afterImg = document.getElementById('after-img');
const sliderInput = document.getElementById('slider-input');
const sliderAfter = document.querySelector('.slider__image--after');
const downloadBtn = document.getElementById('download-btn');

let selectedFile = null;
let selectedStyle = null;
let resultBlobUrl = null;

const STATUS_MESSAGES = {
  ready: 'Ready to redesign! Hit the button when you are happy with your selection.',
  idle: 'Select a photo and style to begin.',
  uploading: 'Uploading your room securely…',
  rendering: 'Generating your redesign. This takes a moment.',
  success: 'Success! Scroll to preview and download your redesigned room.',
  quota: 'Guest quota reached. Sign in to continue redesigning rooms.',
  rateLimit: 'Too many requests. Please wait a minute and try again.',
  unauthorized: 'You need to log in with appropriate permissions.',
  error: 'Something went wrong. Please try again later.'
};

const updateStatus = (messageKey, detail) => {
  const base = STATUS_MESSAGES[messageKey] || STATUS_MESSAGES.error;
  statusEl.textContent = detail ? `${base} ${detail}` : base;
};

const toggleProgress = (show) => {
  progressEl.hidden = !show;
  progressEl.setAttribute('aria-hidden', show ? 'false' : 'true');
};

const resetResult = () => {
  resultSection.hidden = true;
  afterImg.src = '';
  downloadBtn.disabled = true;
  if (resultBlobUrl) {
    URL.revokeObjectURL(resultBlobUrl);
    resultBlobUrl = null;
  }
};

const enableButtonIfReady = () => {
  redesignBtn.disabled = !(selectedFile && selectedStyle);
  if (redesignBtn.disabled) {
    updateStatus('idle');
  } else {
    updateStatus('ready');
  }
};

const setSelectedStyle = (style) => {
  selectedStyle = style;
  styleButtons.forEach((button) => {
    const isActive = button.dataset.style === style;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-checked', isActive ? 'true' : 'false');
  });
  enableButtonIfReady();
};

styleButtons.forEach((button) => {
  button.addEventListener('click', () => setSelectedStyle(button.dataset.style));
  button.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedStyle(button.dataset.style);
    }
  });
});

const handleFileSelection = (file) => {
  if (!file) return;
  resetResult();
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    beforeImg.src = reader.result;
  };
  reader.readAsDataURL(file);
  resultSection.hidden = false;
  enableButtonIfReady();
};

browseLink.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  handleFileSelection(file);
});

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  handleFileSelection(file);
});

sliderInput.addEventListener('input', (event) => {
  const value = Number(event.target.value);
  sliderAfter.style.clipPath = `inset(0 0 0 ${value}%)`;
});

const humanReadableError = async (response) => {
  let detail = '';
  try {
    const data = await response.json();
    detail = data?.message ? `(${data.message})` : '';
  } catch (error) {
    // ignore parsing errors
  }
  switch (response.status) {
    case 400:
      updateStatus('error', detail || 'Please verify your image and style selection.');
      break;
    case 401:
      updateStatus('unauthorized', detail);
      break;
    case 403:
      updateStatus('quota', detail);
      break;
    case 429:
      updateStatus('rateLimit', detail);
      break;
    case 502:
      updateStatus('error', detail || 'Upstream rendering service unavailable.');
      break;
    default:
      updateStatus('error', detail);
  }
};

const submitRedesign = async () => {
  if (!selectedFile || !selectedStyle) return;

  redesignBtn.disabled = true;
  toggleProgress(true);
  updateStatus('uploading');

  const formData = new FormData();
  formData.append('image', selectedFile);
  formData.append('style', selectedStyle);

  try {
    const response = await fetch('/api/redesign', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      await humanReadableError(response);
      return;
    }

    updateStatus('rendering');
    const blob = await response.blob();
    if (resultBlobUrl) {
      URL.revokeObjectURL(resultBlobUrl);
    }
    resultBlobUrl = URL.createObjectURL(blob);
    afterImg.src = resultBlobUrl;
    sliderInput.value = 50;
    sliderAfter.style.clipPath = 'inset(0 0 0 50%)';
    downloadBtn.disabled = false;
    downloadBtn.dataset.url = resultBlobUrl;
    updateStatus('success');
  } catch (error) {
    console.error('Redesign failed', error);
    updateStatus('error', error.message ? `(${error.message})` : '');
  } finally {
    toggleProgress(false);
    redesignBtn.disabled = !(selectedFile && selectedStyle);
  }
};

redesignBtn.addEventListener('click', submitRedesign);

downloadBtn.addEventListener('click', () => {
  if (!resultBlobUrl) return;
  const link = document.createElement('a');
  link.href = resultBlobUrl;
  link.download = 'roomalchemy-redesign.png';
  document.body.appendChild(link);
  link.click();
  requestAnimationFrame(() => document.body.removeChild(link));
});

enableButtonIfReady();
