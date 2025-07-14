// js/needFormater.js

/**
 * Need Formatter script for the Luna Chrome Extension.
 * Formats user-entered customer need details into a structured output.
 */

// Import utility functions (for general use like saveSetting, if needed)
// Note: formatCurrencyDisplay/parseCurrencyInput are not needed here, but utils.js is generally imported.
import { generateTimestamp } from './utils.js'; 

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
  const STORAGE_KEY_LUNA_TITLE_VISIBLE = 'lunaTitleVisible';
  const STORAGE_KEY_THEME_MODE = 'lunaThemeMode';
  const STORAGE_KEY_ACCENT_COLOR = 'lunaAccentColor';
  const STORAGE_KEY_TEXT_COLOR = 'lunaTextColor';
  const STORAGE_KEY_ADVANCED_MODE = 'lunaAdvancedModeEnabled'; // Though not directly used, useful for global settings load
  const STORAGE_KEY_BRANDING_MODE = 'lunaBrandingMode'; // ADDED: New storage key
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
  const defaultBrandingMode = 'luna'; // ADDED: Default branding mode

  /**
   * Applies the selected theme mode and colors to the document.
   * @param {string} mode - 'dark' or 'light'.
   * @param {string} accentColor - The hex code for the accent color.
   * @param {string} textColor - The hex code for the highlight text color.
   */
  function applyTheme(mode, accentColor, textColor) {
    const body = document.body;
    const root = document.documentElement;

    body.classList.toggle('theme-dark', mode === 'dark');
    body.classList.toggle('theme-light', mode === 'light');

    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--text-highlight-color', textColor);
  }

  /**
   * Applies the saved zoom level to the document body.
   * @param {number} zoomLevel - The zoom level to apply (e.g., 1.0 for 100%).
   */
  function applyZoom(zoomLevel) {
    document.body.style.zoom = zoomLevel;
  }

  /**
   * Sets the visibility of the Luna title in the header.
   * @param {boolean} isVisible - True to show the title, false to hide it.
   */
  function setLunaTitleVisibility(isVisible) {
    if (lunaTitle) {
      lunaTitle.classList.toggle('hidden-title', !isVisible);
    }
  }

  /**
   * Sets the branding mode (Luna or TeamViewer) and updates UI elements.
   * This function is needed on every page to ensure consistent branding.
   * @param {string} brandingMode - 'luna' or 'teamviewer'.
   * @param {string} themeMode - 'dark' or 'light'. // ADDED: themeMode parameter
   * @param {boolean} [shouldSave=false] - Whether to save the setting to storage (only settings page saves).
   */
  function setBrandingMode(brandingMode, themeMode, shouldSave = false) { // MODIFIED: Added themeMode param, default shouldSave
    const extensionIcon = document.querySelector('.extensionIcon');
    const extensionTitle = document.getElementById('extensionTitle'); // 'Luna' text

    if (extensionIcon) {
      extensionIcon.src = brandingMode === 'luna' ? '../icons/logo.png' : '../icons/tvicon.png';
      // Apply invert filter ONLY if TeamViewer branding AND Dark Mode
      extensionIcon.classList.toggle('inverted', brandingMode === 'teamviewer' && themeMode === 'dark'); // MODIFIED: Apply/remove 'inverted' class
    }
    if (extensionTitle) {
      extensionTitle.classList.toggle('hidden-title', brandingMode === 'teamviewer');
    }

    // Save to storage
    if (shouldSave && typeof chrome !== 'undefined' && chrome.runtime) { // MODIFIED: Added check for chrome.runtime in case of isolated testing
      chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: STORAGE_KEY_BRANDING_MODE, value: brandingMode } });
    }
  }

  /**
   * Loads global settings (theme, zoom, title visibility) from storage.
   */
  function loadGlobalSettings() {
    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_TEXT_COLOR, STORAGE_KEY_BRANDING_MODE], // MODIFIED: Added STORAGE_KEY_BRANDING_MODE
      (result) => {
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || 1.0;
        applyZoom(zoom);

        // Apply Luna Title Visibility (initial setting, branding will override if TeamViewer)
        const isTitleVisible = result[STORAGE_KEY_LUNA_TITLE_VISIBLE] !== false;
        // setLunaTitleVisibility(isTitleVisible); // Commented out as branding mode will control visual hiding

        const mode = result[STORAGE_KEY_THEME_MODE] || 'dark';
        const accent = result[STORAGE_KEY_ACCENT_COLOR] || '#51a3f9';
        const text = result[STORAGE_KEY_TEXT_COLOR] || '#ed5653';
        applyTheme(mode, accent, text);

        // Apply Branding Mode
        const brandingMode = result[STORAGE_KEY_BRANDING_MODE] || defaultBrandingMode; // Default to 'luna'
        setBrandingMode(brandingMode, mode); // MODIFIED: Call setBrandingMode, passing theme 'mode'

        // Apply Luna Title Visibility based on settings AND branding
        if (lunaTitle) {
          const hideBasedOnSetting = result[STORAGE_KEY_LUNA_TITLE_VISIBLE] === false;
          const hideBasedOnBranding = brandingMode === 'teamviewer';
          lunaTitle.classList.toggle('hidden-title', hideBasedOnSetting || hideBasedOnBranding);
        }
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