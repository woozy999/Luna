// js/quoteCalculator.js

/**
 * Quote Calculator script for the Luna Chrome Extension.
 * Manages all user interactions, calculations, and data persistence
 * for the quote generation tool.
 */

// Import utility functions for formatting and parsing
import { formatCurrencyDisplay, parseCurrencyInput, formatPercentageDisplay, parsePercentageInput, generateTimestamp } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
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
  const integrationsNoButton = document.getElementById('integrationsNo');

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

  // Footer buttons
  const clearAllBtn = document.getElementById('clearAllBtn');
  const completeBtn = document.getElementById('completeBtn');

  // --- Storage Keys ---
  const STORAGE_KEY_INPUTS = 'lunaQuoteCalculatorInputs';
  const STORAGE_KEY_RECORDS = 'lunaQuoteRecords'; // For saving completed quotes
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel'; // Global settings
  const STORAGE_KEY_LUNA_TITLE_VISIBLE = 'lunaTitleVisible'; // Global settings
  const STORAGE_KEY_THEME_MODE = 'lunaThemeMode';
  const STORAGE_KEY_ACCENT_COLOR = 'lunaAccentColor';
  const STORAGE_KEY_TEXT_COLOR = 'lunaTextColor';
  const STORAGE_KEY_ADVANCED_MODE = 'lunaAdvancedModeEnabled'; // Global settings

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
   * Toggles the visibility of elements based on Advanced Mode status.
   * Also updates the internal `isAdvancedModeEnabled` state.
   * @param {boolean} isEnabled - True if advanced mode is enabled, false otherwise.
   * @param {boolean} [shouldSave=false] - Whether to save the setting to storage.
   */
  function setAdvancedMode(isEnabled) {
    isAdvancedModeEnabled = isEnabled; // Update global state
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
      [STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_TEXT_COLOR, STORAGE_KEY_ADVANCED_MODE],
      (result) => {
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || 1.0;
        applyZoom(zoom);

        const isTitleVisible = result[STORAGE_KEY_LUNA_TITLE_VISIBLE] !== false;
        setLunaTitleVisibility(isTitleVisible);

        const mode = result[STORAGE_KEY_THEME_MODE] || 'dark';
        const accent = result[STORAGE_KEY_ACCENT_COLOR] || '#8e44ad';
        const text = result[STORAGE_KEY_TEXT_COLOR] || '#a0c4ff';
        applyTheme(mode, accent, text);

        const advancedModeIsCurrentlyEnabled = result[STORAGE_KEY_ADVANCED_MODE] === true;
        setAdvancedMode(advancedModeIsCurrentlyEnabled); // This will call calculateTotalAndUpdateDisplay
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
      discountIncreaseSelected: discountBtn && discountBtn.classList.contains('selected') ? 'discount' :
                                increaseBtn && increaseBtn.classList.contains('selected') ? 'increase' : 'none',
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
      type: 'saveSetting', // Using a generic saveSetting type
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
      // Format currency inputs on load
      if (lastYearPriceInput) lastYearPriceInput.value = formatCurrencyDisplay(savedInputs.lastYearPrice);
      if (msrpTotalInput) msrpTotalInput.value = formatCurrencyDisplay(savedInputs.msrpTotal);
      if (discountPercentageInput) discountPercentageInput.value = savedInputs.discountPercentage;
      // Format percentage input on load
      if (increasePercentageInput) increasePercentageInput.value = formatPercentageDisplay(savedInputs.increasePercentage);
      if (notesInput) notesInput.value = savedInputs.notes;

      // Set button selections based on loaded state
      setIntegrationSelection(savedInputs.integrationsSelected, false); // false to avoid recursive saving
      setDiscountIncreaseSelection(savedInputs.discountIncreaseSelected, false); // false to avoid recursive saving

      calculateTotalAndUpdateDisplay(); // Ensure display is updated after loading inputs
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
   * @param {string} selection - 'discount', 'increase', or 'none'.
   * @param {boolean} [shouldSave=true] - Whether to trigger a save of app state after selection.
   */
  function setDiscountIncreaseSelection(selection, shouldSave = true) {
    if (discountBtn && increaseBtn && discountFields && increaseFields) {
      // Clear all selected states and hide all conditional fields first
      discountBtn.classList.remove('selected');
      increaseBtn.classList.remove('selected');
      discountFields.classList.add('hidden');
      increaseFields.classList.add('hidden');

      // Hide all calculated display fields when changing selection mode
      if (integrationsCostDisplay) integrationsCostDisplay.classList.add('hidden');
      if (discountForErpDisplay) discountForErpDisplay.classList.add('hidden');
      if (totalEndPriceDisplay) totalEndPriceDisplay.classList.add('hidden');

      // Apply selected state and show relevant fields
      if (selection === 'discount') {
        discountBtn.classList.add('selected');
        discountFields.classList.remove('hidden');
      } else if (selection === 'increase') {
        increaseBtn.classList.add('selected');
        increaseFields.classList.remove('hidden');
      }
    }
    if (shouldSave) saveCalculatorInputs();
    calculateTotalAndUpdateDisplay(); // Always recalculate after selection changes
  }

  /**
   * Performs all calculations for the quote and updates the display fields.
   * Handles visibility of display fields based on active selections.
   * @returns {object} An object containing the calculated integrationsCost, discountForErp, and totalEndPrice.
   */
  function calculateTotalAndUpdateDisplay() {
    // Read and parse input values using utility functions
    const lastYearPrice = parseCurrencyInput(lastYearPriceInput ? lastYearPriceInput.value : '') || 0;
    const msrpTotal = parseCurrencyInput(msrpTotalInput ? msrpTotalInput.value : '') || 0;
    const integrationsActive = integrationsYesButton ? integrationsYesButton.classList.contains('selected') : false;
    // const discountActive = discountBtn ? discountBtn.classList.contains('selected') : false; // Discount is disabled
    const increaseActive = increaseBtn ? increaseBtn.classList.contains('selected') : false;
    const increasePercentage = parsePercentageInput(increasePercentageInput ? increasePercentageInput.value : '') || 0;

    // Use validated inputs for calculations (clamping values)
    const validatedLastYearPrice = Math.max(0, lastYearPrice);
    const validatedMsrpTotal = Math.max(0, msrpTotal);
    const validatedIncreasePercentage = Math.min(1000, Math.max(0, increasePercentage));

    // --- Conditional Display Logic for Output Fields ---
    let showIntegrationsCost = false;
    let showDiscountForErp = false;
    let showTotalEndPrice = false;

    // Integrations Cost is shown if 'Integrations: Yes' AND 'Increase' is selected.
    if (integrationsActive && increaseActive) {
      showIntegrationsCost = true;
    }

    // Discount for ERP and Total End Price are shown if 'Increase' is selected (and not 'Discount').
    // Since Discount is disabled, this simplifies to just checking 'Increase'.
    if (increaseActive) {
      showDiscountForErp = true;
      showTotalEndPrice = true;
    }

    // Apply visibility to display elements
    if (integrationsCostDisplay) integrationsCostDisplay.classList.toggle('hidden', !showIntegrationsCost);
    if (discountForErpDisplay) discountForErpDisplay.classList.toggle('hidden', !showDiscountForErp);
    if (totalEndPriceDisplay) totalEndPriceDisplay.classList.toggle('hidden', !showTotalEndPrice);

    // --- Perform Calculations ---
    let integrationsCost = 0;
    if (integrationsActive) {
      integrationsCost = validatedMsrpTotal * (fixedIntegrationsRate / 100);
    }
    if (integrationsCostValue) integrationsCostValue.textContent = formatCurrencyDisplay(integrationsCost);

    let discountForErp = 0;
    let totalEndPrice = 0;
    let priceChangeAmount = 0; // New variable for advanced display

    // Calculations are only performed if 'Increase' is the selected mode.
    if (increaseActive) {
      // New: Calculate the dollar amount of the increase
      priceChangeAmount = validatedLastYearPrice * (validatedIncreasePercentage / 100);

      // Total End Price calculation: Last Year Price increased by Increase Percentage
      totalEndPrice = validatedLastYearPrice + priceChangeAmount;

      // Discount for ERP calculation
      let numerator = totalEndPrice;
      let denominator = validatedMsrpTotal;
      if (integrationsActive) {
        denominator = validatedMsrpTotal * (1 + (fixedIntegrationsRate / 100));
      }

      if (denominator !== 0) {
        discountForErp = ((numerator / denominator) - 1) * 100;
      } else {
        discountForErp = 0; // Avoid division by zero
      }
    }

    // --- Advanced Mode Display Updates ---
    if (isAdvancedModeEnabled) {
      if (integrationsPercentageValue) {
        integrationsPercentageValue.textContent = formatPercentageDisplay(fixedIntegrationsRate);
      }
      if (priceChangeValueValue) {
        priceChangeValueValue.textContent = formatCurrencyDisplay(priceChangeAmount);
      }
    }

    // Update display values using utility functions
    if (discountForErpValue) discountForErpValue.textContent = formatPercentageDisplay(discountForErp);
    if (totalEndPriceValue) totalEndPriceValue.textContent = formatCurrencyDisplay(totalEndPrice);

    return { integrationsCost, discountForErp, totalEndPrice }; // Return calculated values
  }

  /**
   * Clears all input fields and resets selections on the calculator page.
   * Includes an optional confirmation prompt.
   * @param {boolean} [showConfirmation=true] - Whether to show a confirmation dialog.
   */
  function clearAllInputs(showConfirmation = true) {
    if (showConfirmation && !confirm('Are you sure you want to clear all text on this page? This cannot be undone.')) {
      return; // Stop if user cancels
    }

    // Reset all input elements to their default empty or initial values
    if (companyNameInput) companyNameInput.value = '';
    if (erpLinkInput) erpLinkInput.value = '';
    if (lastYearPriceInput) lastYearPriceInput.value = ''; // Will be formatted to $0.00 on blur
    if (msrpTotalInput) msrpTotalInput.value = ''; // Will be formatted to $0.00 on blur
    if (discountPercentageInput) discountPercentageInput.value = '0';
    if (increasePercentageInput) increasePercentageInput.value = '5.00%'; // Will be formatted to 5.00% on blur
    if (notesInput) notesInput.value = '';

    // Reset button selections (this also triggers recalculation and saves state)
    setIntegrationSelection('no');
    setDiscountIncreaseSelection('increase'); // Default to increase since discount is disabled
  }

  /**
   * Saves the current calculator inputs and calculated outputs as a new record
   * to the record log in Chrome local storage.
   */
  function completeQuote() {
    const currentInputs = getCalculatorInputsState();
    const calculatedOutputs = calculateTotalAndUpdateDisplay(); // Ensure latest outputs are captured

    const record = {
      id: Date.now(), // Unique ID for the record (timestamp based)
      timestamp: generateTimestamp(false), // Human-readable timestamp
      filenameTimestamp: generateTimestamp(true), // Timestamp for filename
      inputs: currentInputs,
      outputs: calculatedOutputs
    };

    chrome.storage.local.get([STORAGE_KEY_RECORDS], (result) => {
      const records = result[STORAGE_KEY_RECORDS] || [];
      records.unshift(record); // Add new record to the beginning of the array

      chrome.storage.local.set({ [STORAGE_KEY_RECORDS]: records }, () => {
        if (chrome.runtime.lastError) {
          console.error('Calculator: Error saving record to log:', chrome.runtime.lastError.message);
          alert('Failed to save quote. Please try again.');
        } else {
          console.log('Calculator: Quote saved successfully:', record);
          // Clear inputs after successful save without asking for confirmation
          clearAllInputs(false);
          alert('Quote saved to record log!'); // Provide visual feedback
        }
      });
    });
  }

  // --- Event Listeners ---

  // Input fields - using blur for formatting and change for saving/calculation
  // companyNameInput and notesInput save immediately on input
  if (companyNameInput) companyNameInput.addEventListener('input', saveCalculatorInputs);
  if (erpLinkInput) erpLinkInput.addEventListener('input', saveCalculatorInputs);
  if (notesInput) notesInput.addEventListener('input', saveCalculatorInputs);

  // Numeric inputs (Last Year Price, MSRP Total, Discount/Increase Percentage)
  // Use 'input' for live calculation updates and 'blur' for formatting and final save.
  const numericInputs = [lastYearPriceInput, msrpTotalInput, discountPercentageInput, increasePercentageInput];
  numericInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        // Debounce saving/recalculation slightly for rapid typing
        clearTimeout(input.saveTimeout);
        input.saveTimeout = setTimeout(() => {
          calculateTotalAndUpdateDisplay();
          saveCalculatorInputs();
        }, 150); // Small debounce
      });

      input.addEventListener('blur', (event) => {
        // Apply specific formatting on blur
        if (event.target.id === 'lastYearPrice' || event.target.id === 'msrpTotal') {
          if (event.target.value !== '') {
            event.target.value = formatCurrencyDisplay(event.target.value);
          }
        } else if (event.target.id === 'increasePercentage') {
          if (event.target.value !== '') {
            event.target.value = formatPercentageDisplay(event.target.value);
          }
        }
        calculateTotalAndUpdateDisplay(); // Ensure final calculation after formatting
        saveCalculatorInputs(); // Final save after blur
      });
    }
  });


  // Integrations button clicks
  if (integrationsYesButton) integrationsYesButton.addEventListener('click', () => setIntegrationSelection('yes'));
  if (integrationsNoButton) integrationsNoButton.addEventListener('click', () => setIntegrationSelection('no'));

  // Discount/Increase button clicks
  // Note: discountBtn is disabled in HTML as per comment in previous files, but event listener is kept for future
  if (discountBtn) discountBtn.addEventListener('click', () => setDiscountIncreaseSelection('discount'));
  if (increaseBtn) increaseBtn.addEventListener('click', () => setDiscountIncreaseSelection('increase'));

  // Footer button listeners
  if (clearAllBtn) clearAllBtn.addEventListener('click', () => clearAllInputs(true)); // Pass true for confirmation
  if (completeBtn) completeBtn.addEventListener('click', completeQuote);

  // --- Initial Setup on DOM Load ---
  // Load global settings (zoom, title visibility, theme, advanced mode)
  loadGlobalSettings();
  // Load calculator inputs and set initial UI state
  loadCalculatorInputs();
});