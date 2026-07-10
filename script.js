document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements Cache ---
  const qrTextInput = document.getElementById('qrText');
  const fgColorInput = document.getElementById('fgColor');
  const fgColorTextInput = document.getElementById('fgColorText');
  const bgColorInput = document.getElementById('bgColor');
  const bgColorTextInput = document.getElementById('bgColorText');
  
  const enableLogoCheckbox = document.getElementById('enableLogo');
  const logoUploadSection = document.getElementById('logoUploadSection');
  const logoFileInput = document.getElementById('logoFile');
  const dropZone = document.getElementById('dropZone');
  const logoPreviewContainer = document.getElementById('logoPreviewContainer');
  const logoPreview = document.getElementById('logoPreview');
  const removeLogoBtn = document.getElementById('removeLogo');
  const logoFileNameSpan = document.getElementById('logoFileName');
  const logoFileSizeSpan = document.getElementById('logoFileSize');
  const logoSizeInput = document.getElementById('logoSize');
  const logoSizeValSpan = document.getElementById('logoSizeVal');
  
  const qrSizeInput = document.getElementById('qrSize');
  const qrSizeValSpan = document.getElementById('qrSizeVal');
  const errorCorrectionSelect = document.getElementById('errorCorrection');
  
  const qrBox = document.getElementById('qrBox');
  const qrPlaceholder = document.getElementById('qrPlaceholder');
  const downloadPngBtn = document.getElementById('downloadPng');
  const downloadJpegBtn = document.getElementById('downloadJpeg');
  const copyImageBtn = document.getElementById('copyImage');
  const copyLinkBtn = document.getElementById('copyLink');
  
  const themeToggleBtn = document.getElementById('themeToggle');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const historyGrid = document.getElementById('historyGrid');
  const historyCountBadge = document.getElementById('historyCount');
  const historyEmptyDiv = document.getElementById('historyEmpty');
  
  const toast = document.getElementById('toast');
  const toastMsgSpan = document.getElementById('toastMsg');
  const toastIcon = toast.querySelector('.toast-icon');

  // Mode Selection Elements
  const btnBasicMode = document.getElementById('btnBasicMode');
  const btnAdvanceMode = document.getElementById('btnAdvanceMode');
  const advancedOptions = document.getElementById('advancedOptions');

  // --- State Variables ---
  let logoImage = null;
  let logoFileObject = null;
  let debounceTimeout = null;
  let historySaveTimeout = null;
  let currentCanvas = null;
  let historyList = [];
  let currentMode = 'basic';

  // Initialize Lucide Icons
  lucide.createIcons();

  // --- Theme Toggle Handler ---
  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function updateThemeIcon(theme) {
    // Redundant check, but let's let Lucide handle standard icon rendering
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'light') {
      themeToggleBtn.innerHTML = '<i data-lucide="sun"></i>';
    } else {
      themeToggleBtn.innerHTML = '<i data-lucide="moon"></i>';
    }
    lucide.createIcons({ attrs: { class: theme === 'light' ? 'light-icon' : 'dark-icon' } });
  }

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });

  initTheme();

  // --- Mode Selection Handler ---
  btnBasicMode.addEventListener('click', () => {
    if (currentMode === 'basic') return;
    currentMode = 'basic';
    btnBasicMode.classList.add('active');
    btnAdvanceMode.classList.remove('active');
    advancedOptions.classList.add('hidden');
    generateQR();
  });

  btnAdvanceMode.addEventListener('click', () => {
    if (currentMode === 'advance') return;
    currentMode = 'advance';
    btnAdvanceMode.classList.add('active');
    btnBasicMode.classList.remove('active');
    advancedOptions.classList.remove('hidden');
    generateQR();
  });

  // --- Accordion Handler ---
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.parentElement;
      const isActive = item.classList.contains('active');
      
      // Close all items
      document.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
      });
      
      // Open current if it wasn't active
      if (!isActive) {
        item.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // --- Color Sync Handlers ---
  function syncColorInput(picker, textInput) {
    picker.value = textInput.value;
  }

  function isValidHex(hex) {
    return /^#[0-9A-F]{6}$/i.test(hex);
  }

  fgColorInput.addEventListener('input', (e) => {
    fgColorTextInput.value = e.target.value.toUpperCase();
    generateQR();
  });

  bgColorInput.addEventListener('input', (e) => {
    bgColorTextInput.value = e.target.value.toUpperCase();
    generateQR();
  });

  fgColorTextInput.addEventListener('input', (e) => {
    let val = e.target.value;
    if (!val.startsWith('#') && val.length > 0) {
      val = '#' + val;
      fgColorTextInput.value = val;
    }
    if (isValidHex(val)) {
      fgColorInput.value = val;
      generateQR();
    }
  });

  bgColorTextInput.addEventListener('input', (e) => {
    let val = e.target.value;
    if (!val.startsWith('#') && val.length > 0) {
      val = '#' + val;
      bgColorTextInput.value = val;
    }
    if (isValidHex(val)) {
      bgColorInput.value = val;
      generateQR();
    }
  });

  // --- Siders & Option Handlers ---
  qrSizeInput.addEventListener('input', (e) => {
    qrSizeValSpan.textContent = `${e.target.value} px`;
    generateQR();
  });

  logoSizeInput.addEventListener('input', (e) => {
    logoSizeValSpan.textContent = `${e.target.value}%`;
    generateQR();
  });

  errorCorrectionSelect.addEventListener('change', () => {
    generateQR();
  });

  // --- Logo Overlay Handlers ---
  enableLogoCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      logoUploadSection.classList.remove('disabled-opacity');
    } else {
      logoUploadSection.classList.add('disabled-opacity');
    }
    generateQR();
  });

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleLogoFile(files[0]);
    }
  });

  logoFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleLogoFile(e.target.files[0]);
    }
  });

  removeLogoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetLogo();
    generateQR();
  });

  function handleLogoFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file.', 'error');
      return;
    }
    if (file.size > 1024 * 1024) { // 1MB limit
      showToast('Image size exceeds 1MB.', 'error');
      return;
    }

    logoFileObject = file;
    logoFileNameSpan.textContent = file.name;
    
    // Format size
    const sizeKb = (file.size / 1024).toFixed(1);
    logoFileSizeSpan.textContent = `${sizeKb} KB`;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        logoImage = img;
        logoPreview.src = e.target.result;
        logoPreviewContainer.classList.remove('hidden');
        generateQR();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function resetLogo() {
    logoImage = null;
    logoFileObject = null;
    logoFileInput.value = '';
    logoPreview.src = '';
    logoPreviewContainer.classList.add('hidden');
  }

  // --- QR Generation Logic ---
  qrTextInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      generateQR();
    }, 250);
  });

  function generateQR() {
    const text = qrTextInput.value.trim();
    if (!text) {
      // Revert to placeholder
      qrBox.innerHTML = '';
      qrBox.appendChild(qrPlaceholder);
      qrBox.classList.remove('active', 'has-qr');
      
      // Disable buttons
      downloadPngBtn.disabled = true;
      downloadJpegBtn.disabled = true;
      copyImageBtn.disabled = true;
      copyLinkBtn.disabled = true;
      return;
    }

    // Set configuration based on mode
    let size, fgColor, bgColor, errorLevel, drawLogo;

    if (currentMode === 'basic') {
      size = 512;
      fgColor = '#0f172a';
      bgColor = '#ffffff';
      errorLevel = 'M';
      drawLogo = false;
    } else {
      size = parseInt(qrSizeInput.value, 10);
      fgColor = fgColorInput.value;
      bgColor = bgColorInput.value;
      errorLevel = errorCorrectionSelect.value;
      drawLogo = enableLogoCheckbox.checked && logoImage;
    }
    
    // Create temporary canvas at high res for drawing
    const canvas = document.createElement('canvas');
    
    const qrOptions = {
      width: size,
      margin: 2,
      errorCorrectionLevel: errorLevel,
      color: {
        dark: fgColor,
        light: bgColor
      }
    };

    QRCode.toCanvas(canvas, text, qrOptions, (error) => {
      if (error) {
        console.error(error);
        showToast('Error generating QR code.', 'error');
        return;
      }

      // Draw logo overlay if enabled in advanced mode
      if (drawLogo) {
        drawLogoOverlay(canvas, fgColor, bgColor);
      }

      // Render to DOM
      qrBox.innerHTML = '';
      qrBox.appendChild(canvas);
      qrBox.classList.add('active', 'has-qr');
      currentCanvas = canvas;

      // Enable actions
      downloadPngBtn.disabled = false;
      downloadJpegBtn.disabled = false;
      copyImageBtn.disabled = false;
      copyLinkBtn.disabled = false;

      // Queue adding to history
      queueHistorySave(text, canvas, fgColor, bgColor);
    });
  }

  // Custom rounded rectangle drawer
  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function drawLogoOverlay(canvas, fgColor, bgColor) {
    const ctx = canvas.getContext('2d');
    const qrWidth = canvas.width;
    
    // Logo width based on input percentage
    const logoPercentage = parseInt(logoSizeInput.value, 10) / 100;
    const logoWidth = qrWidth * logoPercentage;
    const logoHeight = qrWidth * logoPercentage;
    
    // Logo background card size (includes padding)
    const cardSize = logoWidth + (qrWidth * 0.04);
    const cardX = (qrWidth - cardSize) / 2;
    const cardY = (qrWidth - cardSize) / 2;
    const cardRadius = cardSize * 0.15; // responsive radius
    
    // Draw background card (use QR background color for seamlessness)
    ctx.fillStyle = bgColor;
    drawRoundedRect(ctx, cardX, cardY, cardSize, cardSize, cardRadius);
    ctx.fill();

    // Draw solid inner stroke to prevent merging
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = qrWidth * 0.008;
    ctx.stroke();

    // Draw nice light glow/border if background matches foreground or needs separation
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = qrWidth * 0.005;
    ctx.stroke();

    // Draw Image
    const logoX = (qrWidth - logoWidth) / 2;
    const logoY = (qrWidth - logoHeight) / 2;
    
    // Clip logo inside smooth circle/rect
    ctx.save();
    const clipRadius = logoWidth * 0.12;
    drawRoundedRect(ctx, logoX, logoY, logoWidth, logoHeight, clipRadius);
    ctx.clip();
    
    ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
    ctx.restore();
  }

  // --- Downloader & Action Logic ---
  downloadPngBtn.addEventListener('click', () => {
    downloadImage('png');
  });

  downloadJpegBtn.addEventListener('click', () => {
    downloadImage('jpeg');
  });

  function downloadImage(format) {
    if (!currentCanvas) return;
    
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'jpeg' ? 'jpg' : 'png';
    
    // For JPEG, we need to ensure the canvas doesn't have transparency issues
    // QRCode.js takes care of coloring, but just in case we export directly.
    const url = currentCanvas.toDataURL(mimeType, 1.0);
    
    const domain = getDomainName(qrTextInput.value);
    const filename = `qr-spark-${domain}.${extension}`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Downloaded as ${format.toUpperCase()}!`, 'success');
  }

  copyLinkBtn.addEventListener('click', () => {
    const text = qrTextInput.value.trim();
    if (!text) return;
    
    navigator.clipboard.writeText(text)
      .then(() => {
        showToast('Text copied to clipboard!', 'success');
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to copy text.', 'error');
      });
  });

  copyImageBtn.addEventListener('click', () => {
    if (!currentCanvas) return;

    try {
      currentCanvas.toBlob((blob) => {
        if (!blob) {
          showToast('Failed to generate image blob.', 'error');
          return;
        }

        const data = [new ClipboardItem({ 'image/png': blob })];
        navigator.clipboard.write(data)
          .then(() => {
            showToast('QR Code image copied to clipboard!', 'success');
          })
          .catch((err) => {
            console.error('Clipboard write error:', err);
            // Fallback for browsers with restricted clipboard write support
            showToast('Failed to copy image automatically. Try right-clicking the preview and copy.', 'error');
          });
      }, 'image/png');
    } catch (e) {
      console.error(e);
      showToast('Clipboard copy not supported in this browser.', 'error');
    }
  });

  function getDomainName(url) {
    try {
      // Add protocol if missing for URL parsing
      let testUrl = url;
      if (!/^https?:\/\//i.test(url)) {
        testUrl = 'http://' + url;
      }
      const parsed = new URL(testUrl);
      return parsed.hostname.replace('www.', '') || 'content';
    } catch (e) {
      // Fallback if not a valid URL
      return 'content';
    }
  }

  // --- Toast Manager ---
  function showToast(message, type = 'success') {
    toastMsgSpan.textContent = message;
    
    // Set theme
    if (type === 'error') {
      toastIcon.style.color = 'var(--danger-color)';
      toastIcon.setAttribute('data-lucide', 'alert-circle');
    } else {
      toastIcon.style.color = 'var(--success-color)';
      toastIcon.setAttribute('data-lucide', 'check-circle');
    }
    
    lucide.createIcons();
    
    toast.classList.remove('hidden');
    // Force reflow
    toast.offsetHeight;
    
    // Add active animation class if needed or just remove hidden
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  // --- History Manager ---
  function queueHistorySave(text, canvas, fgColor, bgColor) {
    clearTimeout(historySaveTimeout);
    historySaveTimeout = setTimeout(() => {
      saveToHistory(text, canvas, fgColor, bgColor);
    }, 1500); // Wait until stable for 1.5s
  }

  function saveToHistory(text, canvas, fgColor, bgColor) {
    // Generate small thumbnail data url (approx 80px)
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 120;
    thumbCanvas.height = 120;
    const thumbCtx = thumbCanvas.getContext('2d');
    
    // Draw current canvas scaled down
    thumbCtx.drawImage(canvas, 0, 0, 120, 120);
    const thumbDataUrl = thumbCanvas.toDataURL('image/png');

    const historyItem = {
      id: Date.now().toString(),
      text: text,
      thumbnail: thumbDataUrl,
      fgColor: fgColor,
      bgColor: bgColor,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      qrSize: currentMode === 'basic' ? '512' : qrSizeInput.value,
      logoSize: currentMode === 'basic' ? '20' : logoSizeInput.value,
      enableLogo: currentMode === 'basic' ? false : enableLogoCheckbox.checked,
      logoData: currentMode === 'basic' ? null : (logoPreview.src || null),
      logoName: currentMode === 'basic' ? '' : (logoFileNameSpan.textContent || 'logo.png'),
      logoSizeText: currentMode === 'basic' ? '' : (logoFileSizeSpan.textContent || ''),
      errorCorrection: currentMode === 'basic' ? 'M' : errorCorrectionSelect.value
    };

    // Remove duplicates
    historyList = historyList.filter(item => item.text !== text);
    
    // Insert at front
    historyList.unshift(historyItem);
    
    // Max 9 items
    if (historyList.length > 9) {
      historyList.pop();
    }

    localStorage.setItem('qr_spark_history', JSON.stringify(historyList));
    renderHistory();
  }

  function loadHistory() {
    const saved = localStorage.getItem('qr_spark_history');
    if (saved) {
      try {
        historyList = JSON.parse(saved);
      } catch (e) {
        historyList = [];
      }
    }
    renderHistory();
  }

  function renderHistory() {
    historyGrid.innerHTML = '';
    
    if (historyList.length === 0) {
      historyGrid.appendChild(historyEmptyDiv);
      clearHistoryBtn.classList.add('hidden');
      historyCountBadge.textContent = '0';
      return;
    }

    clearHistoryBtn.classList.remove('hidden');
    historyCountBadge.textContent = historyList.length;

    historyList.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-item';
      
      // We will add download & delete actions
      card.innerHTML = `
        <div class="history-img-wrapper">
          <img src="${item.thumbnail}" alt="QR Thumbnail">
        </div>
        <div class="history-details">
          <span class="history-text" title="${escapeHtml(item.text)}">${escapeHtml(item.text)}</span>
          <span class="history-meta">${item.date} • ${item.timestamp}</span>
        </div>
        <div class="history-actions">
          <button class="history-btn download-history" title="Download QR">
            <i data-lucide="download"></i>
          </button>
          <button class="history-btn delete-btn" title="Delete">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;

      // Event listener for loading item back to generator
      card.addEventListener('click', (e) => {
        // Prevent if clicking action buttons
        if (e.target.closest('.history-btn')) return;
        
        loadHistoryItem(item);
      });

      // Download button event
      card.querySelector('.download-history').addEventListener('click', (e) => {
        e.stopPropagation();
        downloadHistoryItem(item);
      });

      // Delete button event
      card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteHistoryItem(item.id);
      });

      historyGrid.appendChild(card);
    });

    lucide.createIcons();
  }

  function loadHistoryItem(item) {
    qrTextInput.value = item.text;
    
    fgColorInput.value = item.fgColor;
    fgColorTextInput.value = item.fgColor.toUpperCase();
    
    bgColorInput.value = item.bgColor;
    bgColorTextInput.value = item.bgColor.toUpperCase();

    qrSizeInput.value = item.qrSize;
    qrSizeValSpan.textContent = `${item.qrSize} px`;

    logoSizeInput.value = item.logoSize || '20';
    logoSizeValSpan.textContent = `${item.logoSize || 20}%`;

    errorCorrectionSelect.value = item.errorCorrection || 'H';

    // Switch mode based on history item customization
    const hasCustomColors = item.fgColor !== '#0f172a' || item.bgColor !== '#ffffff';
    const hasLogoEnabled = !!item.enableLogo;
    
    if (hasCustomColors || hasLogoEnabled || item.qrSize !== '512' || item.errorCorrection !== 'M') {
      currentMode = 'advance';
      btnAdvanceMode.classList.add('active');
      btnBasicMode.classList.remove('active');
      advancedOptions.classList.remove('hidden');
    } else {
      currentMode = 'basic';
      btnBasicMode.classList.add('active');
      btnAdvanceMode.classList.remove('active');
      advancedOptions.classList.add('hidden');
    }

    if (item.enableLogo && item.logoData) {
      enableLogoCheckbox.checked = true;
      logoUploadSection.classList.remove('disabled-opacity');
      logoPreview.src = item.logoData;
      logoFileNameSpan.textContent = item.logoName || 'logo.png';
      logoFileSizeSpan.textContent = item.logoSizeText || '';
      logoPreviewContainer.classList.remove('hidden');
      
      // Load Image object
      const img = new Image();
      img.onload = () => {
        logoImage = img;
        generateQR();
      };
      img.src = item.logoData;
    } else {
      enableLogoCheckbox.checked = false;
      logoUploadSection.classList.add('disabled-opacity');
      resetLogo();
      generateQR();
    }

    showToast('Loaded settings from history!', 'success');
  }

  function downloadHistoryItem(item) {
    // Generate new canvas at its full size to export
    const canvas = document.createElement('canvas');
    const size = parseInt(item.qrSize || '512', 10);
    canvas.width = size;
    canvas.height = size;

    const qrOptions = {
      width: size,
      margin: 2,
      errorCorrectionLevel: item.errorCorrection || 'H',
      color: {
        dark: item.fgColor,
        light: item.bgColor
      }
    };

    QRCode.toCanvas(canvas, item.text, qrOptions, (error) => {
      if (error) {
        console.error(error);
        showToast('Error downloading QR.', 'error');
        return;
      }

      if (item.enableLogo && item.logoData) {
        const logoImg = new Image();
        logoImg.onload = () => {
          // Draw logo overlay
          const ctx = canvas.getContext('2d');
          const logoPercentage = parseInt(item.logoSize || '20', 10) / 100;
          const logoWidth = size * logoPercentage;
          const logoHeight = size * logoPercentage;
          
          const cardSize = logoWidth + (size * 0.04);
          const cardX = (size - cardSize) / 2;
          const cardY = (size - cardSize) / 2;
          const cardRadius = cardSize * 0.15;
          
          ctx.fillStyle = item.bgColor;
          drawRoundedRect(ctx, cardX, cardY, cardSize, cardSize, cardRadius);
          ctx.fill();

          ctx.strokeStyle = item.bgColor;
          ctx.lineWidth = size * 0.008;
          ctx.stroke();

          ctx.strokeStyle = item.fgColor;
          ctx.lineWidth = size * 0.005;
          ctx.stroke();

          const logoX = (size - logoWidth) / 2;
          const logoY = (size - logoHeight) / 2;
          
          ctx.save();
          const clipRadius = logoWidth * 0.12;
          drawRoundedRect(ctx, logoX, logoY, logoWidth, logoHeight, clipRadius);
          ctx.clip();
          ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
          ctx.restore();

          // Trigger download
          triggerDownload(canvas, item.text);
        };
        logoImg.src = item.logoData;
      } else {
        triggerDownload(canvas, item.text);
      }
    });
  }

  function triggerDownload(canvas, text) {
    const url = canvas.toDataURL('image/png', 1.0);
    const domain = getDomainName(text);
    const filename = `qr-spark-${domain}.png`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Downloaded history QR code!', 'success');
  }

  function deleteHistoryItem(id) {
    historyList = historyList.filter(item => item.id !== id);
    localStorage.setItem('qr_spark_history', JSON.stringify(historyList));
    renderHistory();
    showToast('Removed from history.', 'success');
  }

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your generation history?')) {
      historyList = [];
      localStorage.removeItem('qr_spark_history');
      renderHistory();
      showToast('Cleared all history.', 'success');
    }
  });

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- Initial Operations ---
  loadHistory();
});
