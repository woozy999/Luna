// js/quoteCalculator.js

/**
 * Quote Calculator script for the Luna Chrome Extension.
 * Manages all user interactions, calculations, and data persistence
 * for the quote generation tool.
 */

// Import utility functions for formatting and parsing
import { formatCurrencyDisplay, parseCurrencyInput, formatPercentageDisplay, parsePercentageInput, generateTimestamp, hexToRgba } from './utils.js';

// Utility function to save the current page to storage
function saveCurrentPage(pagePath) {
    chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: 'lunaLastPage', value: pagePath } });
}

document.addEventListener('DOMContentLoaded', () => {
  saveCurrentPage('/html/quoteCalculator.html'); // Save this page as the last visited

  // --- Element References ---
  // Header elements for global settings display
  const lunaTitle = document.getElementById('extensionTitle');

  // Input fields
  const companyNameInput = document.getElementById('companyNameInput');
  const erpLinkGroup = document.getElementById('erpLinkGroup'); // Group for ERP Link (for advanced mode toggle)
  const erpLinkInput = document.getElementById('erpLinkInput');
  const lastYearPriceInput = document.getElementById('lastYearPrice');
  const msrpTotalInput = document.getElementById('msrpTotal');
  const notesInput = document.getElementById('notesInput'); // New notes input

  // Integration buttons
  const integrationsYesButton = document.getElementById('integrationsYes');
  const integrationsNoButton = document.getElementById('integrationsNo'); // Corrected typo: was document = document.getElementById

  // Discount/Increase section elements
  const discountBtn = document.getElementById('discountBtn');
  const increaseBtn = document.getElementById('increaseBtn');
  const discountFields = document.getElementById('discountFields');
  const increaseFields = document.getElementById('increaseFields');
  const discountPercentageInput = document.getElementById('discountPercentage');
  const increasePercentageInput = document.getElementById('increasePercentage');

  // Display fields for calculated values
  const integrationsCostDisplay = document.getElementById('integrationsCostDisplay');
  const integrationsCostValue = document.getElementById('integrationsCostValue');
  const discountForErpDisplay = document.getElementById('discountForErpDisplay');
  const discountForErpValue = document.getElementById('discountForErpValue');
  const totalEndPriceDisplay = document.getElementById('totalEndPriceDisplay');
  const totalEndPriceValue = document.getElementById('totalEndPriceValue');
  const integrationsPercentageDisplay = document.getElementById('integrationsPercentageDisplay');
  const integrationsPercentageValue = document.getElementById('integrationsPercentageValue');
  const priceChangeValueDisplay = document.getElementById('priceChangeValueDisplay');
  const priceChangeValueValue = document.getElementById('priceChangeValueValue');
  
  // NEW: Copy button for ERP discount
  const copyErpDiscountBtn = document.getElementById('copyErpDiscountBtn');

  // Footer buttons
  const clearAllBtn = document.getElementById('clearAllBtn');
  const completeBtn = document.getElementById('completeBtn');

  // --- Storage Keys ---
  const STORAGE_KEY_INPUTS = 'lunaQuoteCalculatorInputs';
  const STORAGE_KEY_RECORDS = 'lunaQuoteRecords'; // For saving completed quotes
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel'; // Global settings
  const STORAGE_KEY_THEME_MODE = 'lunaThemeMode';
  const STORAGE_KEY_ACCENT_COLOR = 'lunaAccentColor';
  const STORAGE_KEY_ADVANCED_MODE = 'lunaAdvancedModeEnabled'; // Global settings
  const STORAGE_KEY_BRANDING_MODE = 'lunaBrandingMode';
  const STORAGE_KEY_CARD_STATES = 'lunaQuoteCardStates'; // For collapsible cards

  // --- Global State Variables ---
  let isAdvancedModeEnabled = false; // Tracks the current state of advanced mode

  // --- Fixed Constants ---
  const fixedIntegrationsRate = 20.00; // Fixed integrations rate as per spec

  // --- Default Values for Quote Inputs (for reset and initial load) ---
  const defaultQuoteInputs = {
    companyName: '',
    erpLink: '',
    lastYearPrice: '',
    msrpTotal: '',
    integrationsSelected: 'no',
    discountIncreaseSelected: 'increase',
    discountPercentage: '0',
    increasePercentage: '5.00%',
    notes: ''
  };

  const defaultThemeMode = 'dark';
  const defaultAccentColor = '#3B82F6';
  const defaultBrandingMode = 'luna';

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
   * Sets the branding mode (Luna or TeamViewer) and updates UI elements.
   * This function is needed on every page to ensure consistent branding.
   * @param {string} brandingMode - 'luna' or 'teamviewer'.
   * @param {string} themeMode - 'dark' or 'light'.
   */
  function setBrandingMode(brandingMode, themeMode) {
    const extensionIcon = document.querySelector('.extensionIcon');
    const extensionTitle = document.getElementById('extensionTitle'); // 'Luna' text

    if (extensionIcon) {
      extensionIcon.src = brandingMode === 'luna' ? '../icons/logo.png' : '../icons/tvicon.png';
      // Apply invert filter ONLY if TeamViewer branding AND Dark Mode
      extensionIcon.classList.toggle('inverted', brandingMode === 'teamviewer' && themeMode === 'dark');
    }
    if (extensionTitle) {
      extensionTitle.classList.toggle('hidden-title', brandingMode === 'teamviewer');
    }
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
   * Toggles the visibility of elements based on Advanced Mode status.
   * Also updates the internal `isAdvancedModeEnabled` state.
   * @param {boolean} isEnabled - True if advanced mode is enabled, false otherwise.
   */
  function setAdvancedMode(isEnabled) {
    isAdvancedModeEnabled = isEnabled; // Update global state
    
    // Toggle body class for CSS styling
    document.body.classList.toggle('advanced-mode-on', isEnabled);

    // ERP Link group is visible only if advanced mode is enabled
    if (erpLinkGroup) erpLinkGroup.classList.toggle('hidden', !isEnabled);
    // Toggle visibility of advanced display boxes
    if (integrationsPercentageDisplay) integrationsPercentageDisplay.classList.toggle('hidden', !isEnabled);
    if (priceChangeValueDisplay) priceChangeValueDisplay.classList.toggle('hidden', !isEnabled);

    calculateTotalAndUpdateDisplay(); // Recalculate if Advanced Mode changes (impacts what's shown)
  }

  /**
   * Loads all global settings (zoom, title visibility, theme, advanced mode)
   * from Chrome storage and applies them to the UI.
   */
  function loadGlobalSettings() {
    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_ADVANCED_MODE, STORAGE_KEY_BRANDING_MODE],
      (result) => {
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || 1.0;
        applyZoom(zoom);

        // Apply Theme
        const mode = result[STORAGE_KEY_THEME_MODE] || defaultThemeMode;
        const accent = result[STORAGE_KEY_ACCENT_COLOR] || defaultAccentColor;
        applyTheme(mode, accent);

        // Apply Branding Mode
        const brandingMode = result[STORAGE_KEY_BRANDING_MODE] || defaultBrandingMode;
        setBrandingMode(brandingMode, mode);

        const advancedModeIsCurrentlyEnabled = result[STORAGE_KEY_ADVANCED_MODE] === true;
        setAdvancedMode(advancedModeIsCurrentlyEnabled);
      }
    );
  }

  /**
   * Retrieves the current state of all calculator input fields.
   * @returns {object} An object containing the current input values.
   */
  function getCalculatorInputsState() {
    return {
      companyName: companyNameInput ? companyNameInput.value.trim() : '',
      erpLink: erpLinkInput ? erpLinkInput.value.trim() : '',
      lastYearPrice: lastYearPriceInput ? lastYearPriceInput.value.trim() : '',
      msrpTotal: msrpTotalInput ? msrpTotalInput.value.trim() : '',
      integrationsSelected: integrationsYesButton && integrationsYesButton.classList.contains('selected') ? 'yes' : 'no',
      discountIncreaseSelected: 'increase',
      discountPercentage: discountPercentageInput ? discountPercentageInput.value.trim() : '0',
      increasePercentage: increasePercentageInput ? increasePercentageInput.value.trim() : '5.00%',
      notes: notesInput ? notesInput.value.trim() : ''
    };
  }

  /**
   * Saves the current state of calculator inputs to Chrome local storage.
   * Uses `chrome.runtime.sendMessage` to communicate with the background script for persistence.
   */
  function saveCalculatorInputs() {
    const inputs = getCalculatorInputsState();
    chrome.runtime.sendMessage({
      type: 'saveSetting',
      payload: { key: STORAGE_KEY_INPUTS, value: inputs }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Calculator: Error saving inputs:', chrome.runtime.lastError.message);
      }
    });
  }

  /**
   * Loads saved calculator inputs from Chrome local storage and populates the UI.
   * Applies default values if no saved data is found.
   */
  function loadCalculatorInputs() {
    chrome.storage.local.get([STORAGE_KEY_INPUTS], (result) => {
      const savedInputs = result[STORAGE_KEY_INPUTS] || defaultQuoteInputs;

      if (companyNameInput) companyNameInput.value = savedInputs.companyName;
      if (erpLinkInput) erpLinkInput.value = savedInputs.erpLink;
      if (lastYearPriceInput) lastYearPriceInput.value = formatCurrencyDisplay(savedInputs.lastYearPrice);
      if (msrpTotalInput) msrpTotalInput.value = formatCurrencyDisplay(savedInputs.msrpTotal);
      if (discountPercentageInput) discountPercentageInput.value = savedInputs.discountPercentage;
      if (increasePercentageInput) increasePercentageInput.value = formatPercentageDisplay(savedInputs.increasePercentage);
      if (notesInput) notesInput.value = savedInputs.notes;

      setIntegrationSelection(savedInputs.integrationsSelected, false);
      setDiscountIncreaseSelection('increase', false);

      calculateTotalAndUpdateDisplay();
    });
  }

  /**
   * Toggles the selected state of the Integration buttons (Yes/No).
   * @param {string} selection - 'yes' or 'no'.
   * @param {boolean} [shouldSave=true] - Whether to trigger a save of app state after selection.
   */
  function setIntegrationSelection(selection, shouldSave = true) {
    if (integrationsYesButton && integrationsNoButton) {
      if (selection === 'yes') {
        integrationsYesButton.classList.add('selected');
        integrationsNoButton.classList.remove('selected');
      } else {
        integrationsYesButton.classList.remove('selected');
        integrationsNoButton.classList.add('selected');
      }
    }
    if (shouldSave) saveCalculatorInputs();
    calculateTotalAndUpdateDisplay();
  }

  /**
   * Toggles the selected state of the Discount/Increase buttons and their respective fields.
   * @param {string} selection - 'discount', 'increase', or 'none'. (Ignored internally, forced to 'increase')
   * @param {boolean} [shouldSave=true] - Whether to trigger a save of app state after selection.
   */
  function setDiscountIncreaseSelection(selection, shouldSave = true) {
    if (discountBtn && increaseBtn && increaseFields) {
      increaseBtn.classList.add('selected');
      increaseFields.classList.remove('hidden');
    }
    if (shouldSave) saveCalculatorInputs();
    calculateTotalAndUpdateDisplay();
  }

  /**
   * Performs all calculations for the quote and updates the display fields.
   * Handles visibility of display fields based on active selections.
   * @returns {object} An object containing the calculated integrationsCost, discountForErp, and totalEndPrice.
   */
  function calculateTotalAndUpdateDisplay() {
    const lastYearPrice = parseCurrencyInput(lastYearPriceInput ? lastYearPriceInput.value : '') || 0;
    const msrpTotal = parseCurrencyInput(msrpTotalInput ? msrpTotalInput.value : '') || 0;
    const integrationsActive = integrationsYesButton ? integrationsYesButton.classList.contains('selected') : false;
    const increaseActive = true;

    const increasePercentage = parsePercentageInput(increasePercentageInput ? increasePercentageInput.value : '') || 0;

    const validatedLastYearPrice = Math.max(0, lastYearPrice);
    const validatedMsrpTotal = Math.max(0, msrpTotal);
    const validatedIncreasePercentage = Math.min(1000, Math.max(0, increasePercentage));

    let showIntegrationsCost = integrationsActive && increaseActive;
    let showDiscountForErp = increaseActive;
    let showTotalEndPrice = increaseActive;

    if (integrationsCostDisplay) integrationsCostDisplay.classList.toggle('hidden', !showIntegrationsCost);
    if (discountForErpDisplay) discountForErpDisplay.classList.toggle('hidden', !showDiscountForErp);
    if (totalEndPriceDisplay) totalEndPriceDisplay.classList.toggle('hidden', !showTotalEndPrice);

    let integrationsCost = 0;
    if (integrationsActive) {
      integrationsCost = validatedMsrpTotal * (fixedIntegrationsRate / 100);
    }
    if (integrationsCostValue) integrationsCostValue.textContent = formatCurrencyDisplay(integrationsCost);

    let discountForErp = 0;
    let totalEndPrice = 0;
    let priceChangeAmount = 0;

    if (increaseActive) {
      priceChangeAmount = validatedLastYearPrice * (validatedIncreasePercentage / 100);
      totalEndPrice = validatedLastYearPrice + priceChangeAmount;
      let numerator = totalEndPrice;
      let denominator = validatedMsrpTotal;
      if (integrationsActive) {
        denominator = validatedMsrpTotal * (1 + (fixedIntegrationsRate / 100));
      }
      if (denominator !== 0) {
        discountForErp = ((numerator / denominator) - 1) * 100;
      } else {
        discountForErp = 0;
      }
    }

    if (isAdvancedModeEnabled) {
      if (integrationsPercentageValue) {
        integrationsPercentageValue.textContent = formatPercentageDisplay(fixedIntegrationsRate);
      }
      if (priceChangeValueValue) {
        priceChangeValueValue.textContent = formatCurrencyDisplay(priceChangeAmount);
      }
    }

    if (discountForErpValue) discountForErpValue.textContent = formatPercentageDisplay(discountForErp);
    if (totalEndPriceValue) totalEndPriceValue.textContent = formatCurrencyDisplay(totalEndPrice);

    return { integrationsCost, discountForErp, totalEndPrice };
  }

  /**
   * Clears all input fields and resets selections on the calculator page.
   * Includes an optional confirmation prompt.
   * @param {boolean} [showConfirmation=true] - Whether to show a confirmation dialog.
   */
  function clearAllInputs(showConfirmation = true) {
    if (showConfirmation && !confirm('Are you sure you want to clear all text on this page? This cannot be undone.')) {
      return;
    }
    if (companyNameInput) companyNameInput.value = '';
    if (erpLinkInput) erpLinkInput.value = '';
    if (lastYearPriceInput) lastYearPriceInput.value = '';
    if (msrpTotalInput) msrpTotalInput.value = '';
    if (discountPercentageInput) discountPercentageInput.value = '0';
    if (increasePercentageInput) increasePercentageInput.value = '5.00%';
    if (notesInput) notesInput.value = '';
    setIntegrationSelection('no');
    setDiscountIncreaseSelection('increase');
  }

  /**
   * Saves the current calculator inputs and calculated outputs as a new record
   * to the record log in Chrome local storage.
   */
  function completeQuote() {
    const currentInputs = getCalculatorInputsState();
    const calculatedOutputs = calculateTotalAndUpdateDisplay();
    const record = {
      id: Date.now(),
      timestamp: generateTimestamp(false),
      filenameTimestamp: generateTimestamp(true),
      inputs: currentInputs,
      outputs: calculatedOutputs
    };

    chrome.storage.local.get([STORAGE_KEY_RECORDS], (result) => {
      const records = result[STORAGE_KEY_RECORDS] || [];
      records.unshift(record);
      chrome.storage.local.set({ [STORAGE_KEY_RECORDS]: records }, () => {
        if (chrome.runtime.lastError) {
          console.error('Calculator: Error saving record to log:', chrome.runtime.lastError.message);
          alert('Failed to save quote. Please try again.');
        } else {
          console.log('Calculator: Quote saved successfully:', record);
          clearAllInputs(false);
          alert('Quote saved to record log!');
        }
      });
    });
  }
  
  /**
   * NEW: Copies the raw percentage value of the ERP discount to the clipboard.
   */
  function copyErpDiscount() {
    const formattedPercentage = discountForErpValue.textContent;
    if (!formattedPercentage) return;

    const rawNumber = parsePercentageInput(formattedPercentage);
    if (rawNumber === null) return;

    const plainTextPercentage = String(rawNumber);

    navigator.clipboard.writeText(plainTextPercentage).then(() => {
        const originalText = copyErpDiscountBtn.innerHTML;
        copyErpDiscountBtn.innerHTML = '✅';
        copyErpDiscountBtn.title = 'Copied!';
        setTimeout(() => {
            copyErpDiscountBtn.innerHTML = '📋';
            copyErpDiscountBtn.title = 'Copy Percentage';
        }, 1500);
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
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
  if (companyNameInput) companyNameInput.addEventListener('input', saveCalculatorInputs);
  if (erpLinkInput) erpLinkInput.addEventListener('input', saveCalculatorInputs);
  if (notesInput) notesInput.addEventListener('input', saveCalculatorInputs);
  const numericInputs = [lastYearPriceInput, msrpTotalInput, discountPercentageInput, increasePercentageInput];
  numericInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        clearTimeout(input.saveTimeout);
        input.saveTimeout = setTimeout(() => {
          calculateTotalAndUpdateDisplay();
          saveCalculatorInputs();
        }, 150);
      });
      input.addEventListener('blur', (event) => {
        if (event.target.id === 'lastYearPrice' || event.target.id === 'msrpTotal') {
          if (event.target.value !== '') event.target.value = formatCurrencyDisplay(event.target.value);
        } else if (event.target.id === 'increasePercentage') {
          if (event.target.value !== '') event.target.value = formatPercentageDisplay(event.target.value);
        }
        calculateTotalAndUpdateDisplay();
        saveCalculatorInputs();
      });
    }
  });
  if (integrationsYesButton) integrationsYesButton.addEventListener('click', () => setIntegrationSelection('yes'));
  if (integrationsNoButton) integrationsNoButton.addEventListener('click', () => setIntegrationSelection('no'));
  if (discountBtn) discountBtn.addEventListener('click', () => setDiscountIncreaseSelection('discount'));
  if (increaseBtn) increaseBtn.addEventListener('click', () => setDiscountIncreaseSelection('increase'));
  if (clearAllBtn) clearAllBtn.addEventListener('click', () => clearAllInputs(true));
  if (completeBtn) completeBtn.addEventListener('click', completeQuote);
  if (copyErpDiscountBtn) copyErpDiscountBtn.addEventListener('click', copyErpDiscount); // NEW Event listener

  // --- Initial Setup on DOM Load ---
  loadGlobalSettings();
  loadCalculatorInputs();
  initializeCollapsibleCards();
});