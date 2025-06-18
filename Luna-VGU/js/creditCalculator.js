// js/creditCalculator.js

/**
 * Credit Calculator script for the Luna Chrome Extension.
 * Calculates remaining credit based on an amount and purchase date.
 */

import { formatCurrencyDisplay, parseCurrencyInput } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- Element References ---
  const lunaTitle = document.getElementById('extensionTitle');
  const amountInput = document.getElementById('creditAmountInput');
  const dateInput = document.getElementById('purchaseDateInput');
  const durationButtons = document.querySelectorAll('#duration1yr, #duration2yr, #duration3yr');
  
  const expirationDateValue = document.getElementById('expirationDateValue');
  const daysRemainingValue = document.getElementById('daysRemainingValue');
  const creditPerDayDisplay = document.getElementById('creditPerDayDisplay'); // Advanced display
  const creditPerDayValue = document.getElementById('creditPerDayValue');
  const totalCreditValue = document.getElementById('totalCreditValue');
  
  const clearAllBtn = document.getElementById('clearAllBtn');

  // --- Storage Keys ---
  const STORAGE_KEY_INPUTS = 'lunaCreditCalculatorInputs';
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel';
  const STORAGE_KEY_LUNA_TITLE_VISIBLE = 'lunaTitleVisible';
  const STORAGE_KEY_THEME_MODE = 'lunaThemeMode';
  const STORAGE_KEY_ACCENT_COLOR = 'lunaAccentColor';
  const STORAGE_KEY_TEXT_COLOR = 'lunaTextColor';
  const STORAGE_KEY_ADVANCED_MODE = 'lunaAdvancedModeEnabled';

  // --- Global State ---
  let isAdvancedModeEnabled = false;

  const defaultInputs = {
    amount: '',
    purchaseDate: '',
    duration: 1
  };

  /**
   * Applies the selected theme mode and colors to the document.
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
   * Toggles the visibility of elements based on Advanced Mode status.
   */
  function setAdvancedMode(isEnabled) {
    isAdvancedModeEnabled = isEnabled;
    if (creditPerDayDisplay) {
        creditPerDayDisplay.classList.toggle('hidden', !isEnabled);
    }
  }

  /**
   * Applies global settings (theme, zoom, title, advanced mode) to the page.
   */
  function loadGlobalSettings() {
    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_TEXT_COLOR, STORAGE_KEY_ADVANCED_MODE],
      (result) => {
        // Apply Theme (Fixes background color bug)
        const mode = result[STORAGE_KEY_THEME_MODE] || 'dark';
        const accent = result[STORAGE_KEY_ACCENT_COLOR] || '#8e44ad';
        const text = result[STORAGE_KEY_TEXT_COLOR] || '#a0c4ff';
        applyTheme(mode, accent, text);
        
        // Apply Zoom
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || 1.0;
        document.body.style.zoom = zoom;

        // Apply Title Visibility
        const isTitleVisible = result[STORAGE_KEY_LUNA_TITLE_VISIBLE] !== false;
        if (lunaTitle) lunaTitle.classList.toggle('hidden-title', !isVisible);

        // Apply Advanced Mode
        const advancedMode = result[STORAGE_KEY_ADVANCED_MODE] === true;
        setAdvancedMode(advancedMode);
      }
    );
  }

  /**
   * Performs all calculations and updates the display fields.
   */
  function calculateAndDisplay() {
    const amount = parseCurrencyInput(amountInput.value) || 0;
    const purchaseDateStr = dateInput.value;
    const selectedDuration = parseInt(document.querySelector('.toggle-button.selected[data-years]').dataset.years, 10);

    const purchaseDate = new Date(purchaseDateStr);

    // Validate inputs
    if (amount <= 0 || !purchaseDateStr || isNaN(purchaseDate.getTime())) {
      expirationDateValue.textContent = 'N/A';
      daysRemainingValue.textContent = 'N/A';
      creditPerDayValue.textContent = formatCurrencyDisplay(0);
      totalCreditValue.textContent = formatCurrencyDisplay(0);
      return;
    }

    const msPerDay = 1000 * 60 * 60 * 24;

    // --- FORMULA CORRECTIONS BASED ON SPREADSHEET ---

    // 1. Calculate Expiration Date: Purchase Date + (Duration * 365) days
    const expirationDate = new Date(purchaseDate.getTime()); // Create a new instance
    expirationDate.setDate(expirationDate.getDate() + (selectedDuration * 365));
    expirationDateValue.textContent = expirationDate.toLocaleDateString();
    
    // 2. Calculate Days Remaining: Expiration Date - Today
    const today = new Date();
    // Normalize both dates to midnight to prevent time-of-day errors.
    today.setHours(0, 0, 0, 0); 
    const expirationDayOnly = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
    
    // Use Math.floor to get the number of full days between the dates, which matches Excel's behavior.
    const daysRemaining = Math.max(0, Math.floor((expirationDayOnly - today) / msPerDay));
    daysRemainingValue.textContent = daysRemaining;
    
    // 3. Calculate Credit per Day (for advanced display)
    const totalDaysInTerm = selectedDuration * 365;
    const creditPerDay = totalDaysInTerm > 0 ? amount / totalDaysInTerm : 0;
    creditPerDayValue.textContent = formatCurrencyDisplay(creditPerDay);

    // 4. Calculate Total Credit Remaining (Corrected Formula)
    const totalCredit = creditPerDay * daysRemaining;
    totalCreditValue.textContent = formatCurrencyDisplay(totalCredit);
  }

  /**
   * Saves the current input state to storage.
   */
  function saveInputs() {
    const inputs = {
      amount: amountInput.value,
      purchaseDate: dateInput.value,
      duration: parseInt(document.querySelector('.toggle-button.selected[data-years]').dataset.years, 10)
    };
    chrome.storage.local.set({ [STORAGE_KEY_INPUTS]: inputs });
  }

  /**
   * Loads saved inputs from storage and populates the UI.
   */
  function loadInputs() {
    chrome.storage.local.get([STORAGE_KEY_INPUTS], (result) => {
      const saved = result[STORAGE_KEY_INPUTS] || defaultInputs;
      amountInput.value = formatCurrencyDisplay(saved.amount);
      dateInput.value = saved.purchaseDate;
      
      durationButtons.forEach(button => {
        const isSelected = parseInt(button.dataset.years, 10) === saved.duration;
        button.classList.toggle('selected', isSelected);
      });
      
      calculateAndDisplay();
    });
  }

  /**
   * Clears all input fields and resets the calculator.
   */
  function clearAll() {
    amountInput.value = '';
    dateInput.value = '';
    
    durationButtons.forEach(button => {
        button.classList.toggle('selected', button.dataset.years === '1');
    });

    calculateAndDisplay();
    saveInputs(); // Save the cleared state
  }

  // --- Event Listeners ---
  [amountInput, dateInput].forEach(input => {
    input.addEventListener('input', () => {
      calculateAndDisplay();
      saveInputs();
    });
  });

  amountInput.addEventListener('blur', () => {
    amountInput.value = formatCurrencyDisplay(amountInput.value);
    saveInputs();
  });

  durationButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      durationButtons.forEach(btn => btn.classList.remove('selected'));
      event.target.classList.add('selected');
      calculateAndDisplay();
      saveInputs();
    });
  });

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAll);
  }

  // --- Initial Setup ---
  loadGlobalSettings();
  loadInputs();
});