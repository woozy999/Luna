// js/needFormater.js

/**
 * Need Formatter script for the Luna Chrome Extension.
 * Formats user-entered customer need details into a structured output.
 */

import { generateTimestamp, hexToRgba } from './utils.js'; 

// ADDED: Utility function to save the current page to storage (for "remember last page")
function saveCurrentPage(pagePath) {
    chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: 'lunaLastPage', value: pagePath } });
}

document.addEventListener('DOMContentLoaded', () => {
  saveCurrentPage('/html/needFormater.html'); // Save this page as the last visited (corrected to absolute path)

  // --- Element References ---
  const lunaTitle = document.getElementById('extensionTitle');

  const ticketNumberInput = document.getElementById('ticketNumberInput');
  const statusPaidBtn = document.getElementById('statusPaid');
  const statusPostedBtn = document.getElementById('statusPosted');
  const customerRequestInput = document.getElementById('customerRequestInput');
  const customerEmailInput = document.getElementById('customerEmailInput');
  const customerPhoneNumberInput = document.getElementById('customerPhoneNumberInput');
  const additionalCommentsInput = document.getElementById('additionalCommentsInput');

  const formattedOutput = document.getElementById('formattedOutput');
  const copyOutputBtn = document.getElementById('copyOutputBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');

  // --- Storage Keys ---
  const STORAGE_KEY_INPUTS = 'lunaNeedFormatterInputs'; // New storage key for this tool's inputs
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel';
  const STORAGE_KEY_THEME_MODE = 'lunaThemeMode';
  const STORAGE_KEY_ACCENT_COLOR = 'lunaAccentColor';
  const STORAGE_KEY_BRANDING_MODE = 'lunaBrandingMode';
  const STORAGE_KEY_CARD_STATES = 'lunaNeedCardStates'; // For collapsible cards

  // --- Default Values for Need Formatter Inputs ---
  const defaultNeedFormatterInputs = {
    ticketNumber: '',
    invoiceStatus: 'Paid', // Default to Paid
    customerRequest: '',
    customerEmail: '',
    customerPhoneNumber: '',
    additionalComments: ''
  };
  const defaultBrandingMode = 'luna';
  const defaultThemeMode = 'dark';
  const defaultAccentColor = '#3B82F6';

  /**
   * Applies the selected theme mode and colors to the document.
   * @param {string} mode - 'dark' or 'light'.
   * @param {string} accentColor - The hex code for the accent color.
   */
  function applyTheme(mode, accentColor) {
    const body = document.body;
    const root = document.documentElement;

    body.classList.toggle('theme-dark', mode === 'dark');
    body.classList.toggle('theme-light', mode === 'light');

    root.style.setProperty('--primary-accent', accentColor);
    root.style.setProperty('--primary-accent-shadow', hexToRgba(accentColor, 0.2));
  }

  /**
   * Applies the saved zoom level to the document by changing the root font size.
   * @param {number} zoomLevel - The zoom level to apply (e.g., 1.0 for 100%).
   */
  function applyZoom(zoomLevel) {
    const baseFontSize = 14; // Base font size in pixels.
    document.documentElement.style.fontSize = `${baseFontSize * zoomLevel}px`;
  }

  /**
   * Sets the branding mode (Luna or TeamViewer) and updates UI elements.
   * @param {string} brandingMode - 'luna' or 'teamviewer'.
   * @param {string} themeMode - 'dark' or 'light'.
   */
  function setBrandingMode(brandingMode, themeMode) {
    const extensionIcon = document.querySelector('.extensionIcon');
    const extensionTitle = document.getElementById('extensionTitle');

    if (extensionIcon) {
      extensionIcon.src = brandingMode === 'luna' ? '../icons/logo.png' : '../icons/tvicon.png';
      extensionIcon.classList.toggle('inverted', brandingMode === 'teamviewer' && themeMode === 'dark');
    }
    if (extensionTitle) {
      extensionTitle.classList.toggle('hidden-title', brandingMode === 'teamviewer');
    }
  }

  /**
   * Loads global settings (theme, zoom, title visibility) from storage.
   */
  function loadGlobalSettings() {
    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_BRANDING_MODE],
      (result) => {
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || 1.0;
        applyZoom(zoom);

        const mode = result[STORAGE_KEY_THEME_MODE] || defaultThemeMode;
        const accent = result[STORAGE_KEY_ACCENT_COLOR] || defaultAccentColor;
        applyTheme(mode, accent);

        const brandingMode = result[STORAGE_KEY_BRANDING_MODE] || defaultBrandingMode;
        setBrandingMode(brandingMode, mode);
      }
    );
  }

  /**
   * Gets the current state of all input fields for the formatter.
   * @returns {object} An object containing the current input values.
   */
  function getFormatterInputsState() {
    return {
      ticketNumber: ticketNumberInput ? ticketNumberInput.value.trim() : '',
      invoiceStatus: statusPaidBtn && statusPaidBtn.classList.contains('selected') ? 'Paid' : 'Posted',
      customerRequest: customerRequestInput ? customerRequestInput.value.trim() : '',
      customerEmail: customerEmailInput ? customerEmailInput.value.trim() : '',
      customerPhoneNumber: customerPhoneNumberInput ? customerPhoneNumberInput.value.trim() : '',
      additionalComments: additionalCommentsInput ? additionalCommentsInput.value.trim() : ''
    };
  }

  /**
   * Saves the current state of formatter inputs to Chrome local storage.
   */
  function saveFormatterInputs() {
    const inputs = getFormatterInputsState();
    chrome.runtime.sendMessage({
      type: 'saveSetting',
      payload: { key: STORAGE_KEY_INPUTS, value: inputs }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Need Formatter: Error saving inputs:', chrome.runtime.lastError.message);
      }
    });
  }

  /**
   * Loads saved formatter inputs from Chrome local storage and populates the UI.
   */
  function loadFormatterInputs() {
    chrome.storage.local.get([STORAGE_KEY_INPUTS], (result) => {
      const savedInputs = result[STORAGE_KEY_INPUTS] || defaultNeedFormatterInputs;

      if (ticketNumberInput) ticketNumberInput.value = savedInputs.ticketNumber;
      // Set invoice status button
      if (statusPaidBtn && statusPostedBtn) {
        if (savedInputs.invoiceStatus === 'Paid') {
          statusPaidBtn.classList.add('selected');
          statusPostedBtn.classList.remove('selected');
        } else {
          statusPaidBtn.classList.remove('selected');
          statusPostedBtn.classList.add('selected');
        }
      }
      if (customerRequestInput) customerRequestInput.value = savedInputs.customerRequest;
      if (customerEmailInput) customerEmailInput.value = savedInputs.customerEmail;
      if (customerPhoneNumberInput) customerPhoneNumberInput.value = savedInputs.customerPhoneNumber;
      if (additionalCommentsInput) additionalCommentsInput.value = savedInputs.additionalComments;

      updateFormattedOutput(); // Update display after loading inputs
    });
  }

  /**
   * Updates the formatted output string based on current input values.
   */
  function updateFormattedOutput() {
    const inputs = getFormatterInputsState();
    let outputParts = []; // Use an array to collect parts

    // Required fields
    if (inputs.ticketNumber) {
      outputParts.push(`Ticket: ${inputs.ticketNumber}`);
    }
    if (inputs.invoiceStatus) {
      outputParts.push(`Invoice Status: ${inputs.invoiceStatus}`);
    }
    if (inputs.customerRequest) {
      outputParts.push(`Customer Need: ${inputs.customerRequest}`);
    }
    if (inputs.customerEmail) {
      outputParts.push(`Email: ${inputs.customerEmail}`);
    }
    if (inputs.customerPhoneNumber) {
      outputParts.push(`Phone Number: ${inputs.customerPhoneNumber}`);
    }

    // Optional additional comments
    if (inputs.additionalComments) {
      outputParts.push(`Additional Comments: ${inputs.additionalComments}`);
    }

    // Join all parts with two newlines for the spacing
    if (formattedOutput) {
      formattedOutput.textContent = outputParts.join('\n\n').trim(); // Join and then trim
    }
  }

  /**
   * Clears all input fields and resets selections.
   */
  function clearAll() {
    // Confirmation removed as per request.
    
    if (ticketNumberInput) ticketNumberInput.value = defaultNeedFormatterInputs.ticketNumber;
    if (statusPaidBtn && statusPostedBtn) {
      statusPaidBtn.classList.add('selected');
      statusPostedBtn.classList.remove('selected');
    }
    if (customerRequestInput) customerRequestInput.value = defaultNeedFormatterInputs.customerRequest;
    if (customerEmailInput) customerEmailInput.value = defaultNeedFormatterInputs.customerEmail;
    if (customerPhoneNumberInput) customerPhoneNumberInput.value = defaultNeedFormatterInputs.customerPhoneNumber;
    if (additionalCommentsInput) additionalCommentsInput.value = defaultNeedFormatterInputs.additionalComments;

    saveFormatterInputs(); // Save cleared state
    updateFormattedOutput(); // Update output display
  }

  /**
   * Copies the formatted output to the clipboard.
   */
  function copyOutputToClipboard() {
    if (formattedOutput && formattedOutput.textContent) {
      navigator.clipboard.writeText(formattedOutput.textContent).then(() => {
        // Optional: Provide visual feedback to the user
        const originalText = copyOutputBtn.textContent;
        copyOutputBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyOutputBtn.textContent = originalText;
        }, 1500);
      }).catch(err => {
        console.error('Could not copy text: ', err);
        alert('Failed to copy. Please try manually.');
      });
    }
  }

  /**
   * Initializes all collapsible cards on the page.
   */
  function initializeCollapsibleCards() {
    chrome.storage.local.get([STORAGE_KEY_CARD_STATES], (result) => {
        const cardStates = result[STORAGE_KEY_CARD_STATES] || {};
        
        document.querySelectorAll('.card').forEach(card => {
            const cardId = card.id;
            if (!cardId) return;

            const toggle = card.querySelector('.collapse-toggle');
            if (!toggle) return;

            // Set initial state from storage
            if (cardStates[cardId] === true) { // if true, it's collapsed
                card.classList.add('collapsed');
            }

            // Add click listener
            toggle.addEventListener('click', () => {
                const isCollapsed = card.classList.toggle('collapsed');
                cardStates[cardId] = isCollapsed;
                chrome.storage.local.set({ [STORAGE_KEY_CARD_STATES]: cardStates });
            });
        });
    });
  }

  // --- Event Listeners ---
  [ticketNumberInput, customerRequestInput, customerEmailInput, customerPhoneNumberInput, additionalCommentsInput].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        updateFormattedOutput();
        saveFormatterInputs();
      });
    }
  });

  // Specific listener for ticket number to enforce maxlength visually/programmatically
  if (ticketNumberInput) {
    ticketNumberInput.addEventListener('input', () => {
      if (ticketNumberInput.value.length > 8) {
        ticketNumberInput.value = ticketNumberInput.value.slice(0, 8);
      }
      updateFormattedOutput();
      saveFormatterInputs();
    });
  }

  if (statusPaidBtn) {
    statusPaidBtn.addEventListener('click', () => {
      statusPaidBtn.classList.add('selected');
      statusPostedBtn.classList.remove('selected');
      updateFormattedOutput();
      saveFormatterInputs();
    });
  }

  if (statusPostedBtn) {
    statusPostedBtn.addEventListener('click', () => {
      statusPaidBtn.classList.remove('selected');
      statusPostedBtn.classList.add('selected'); // Corrected to add 'selected' to statusPostedBtn
      updateFormattedOutput();
      saveFormatterInputs();
    });
  }

  if (copyOutputBtn) {
    copyOutputBtn.addEventListener('click', copyOutputToClipboard);
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAll);
  }

  // --- Initial Setup ---
  loadGlobalSettings();
  loadFormatterInputs(); // Load saved data for this tool
  initializeCollapsibleCards();
});