// js/creditCalculator.js

/**
 * Credit Calculator script for the Luna Chrome Extension.
 * Calculates remaining credit based on an amount and purchase date.
 */

import { formatCurrencyDisplay, parseCurrencyInput } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('[DEBUG] 1. DOM Content Loaded. Initializing script.');

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

  function applyTheme(mode, accentColor, textColor) {
    const body = document.body;
    const root = document.documentElement;
    body.classList.toggle('theme-dark', mode === 'dark');
    body.classList.toggle('theme-light', mode === 'light');
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--text-highlight-color', textColor);
  }

  /**
   * Sets advanced mode state AND triggers a recalculation.
   * This now perfectly mirrors the working quoteCalculator.js logic.
   */
  function setAdvancedMode(isEnabled) {
    console.log(`[DEBUG] 4. setAdvancedMode called with: ${isEnabled}`);
    isAdvancedModeEnabled = isEnabled;
    calculateAndDisplay(); // Recalculate whenever the mode changes.
  }

  function loadGlobalSettings() {
    console.log('[DEBUG] 2a. Starting to load global settings from storage...');
    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_TEXT_COLOR, STORAGE_KEY_ADVANCED_MODE],
      (result) => {
        const advancedMode = result[STORAGE_KEY_ADVANCED_MODE] === true;
        console.log(`[DEBUG] 3a. Global settings LOADED. Advanced Mode is: ${advancedMode}`);
        
        // Apply other settings
        applyTheme(result[STORAGE_KEY_THEME_MODE] || 'dark', result[STORAGE_KEY_ACCENT_COLOR] || '#8e44ad', result[STORAGE_KEY_TEXT_COLOR] || '#a0c4ff');
        document.body.style.zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || 1.0;
        if (lunaTitle) lunaTitle.classList.toggle('hidden-title', result[STORAGE_KEY_LUNA_TITLE_VISIBLE] === false);

        // Set the mode, which will trigger the first calculation
        setAdvancedMode(advancedMode);
      }
    );
  }

  function calculateAndDisplay() {
    console.log(`[DEBUG] 5. calculateAndDisplay running. Advanced mode is currently: ${isAdvancedModeEnabled}`);
    
    // This is the core logic: toggle visibility based on the current state.
    if (creditPerDayDisplay) {
      creditPerDayDisplay.classList.toggle('hidden', !isAdvancedModeEnabled);
      console.log(`[DEBUG] 6. 'creditPerDayDisplay' visibility set. Is it hidden? ${creditPerDayDisplay.classList.contains('hidden')}`);
    } else {
      console.error("[DEBUG] 'creditPerDayDisplay' element not found!");
    }
      
    const amount = parseCurrencyInput(amountInput.value) || 0;
    const purchaseDateStr = dateInput.value;
    const selectedDuration = parseInt(document.querySelector('.toggle-button.selected[data-years]').dataset.years, 10);
    const purchaseDate = new Date(purchaseDateStr);

    if (amount <= 0 || !purchaseDateStr || isNaN(purchaseDate.getTime())) {
      expirationDateValue.textContent = 'N/A';
      daysRemainingValue.textContent = 'N/A';
      creditPerDayValue.textContent = formatCurrencyDisplay(0);
      totalCreditValue.textContent = formatCurrencyDisplay(0);
      return;
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const expirationDate = new Date(purchaseDate.getTime());
    expirationDate.setDate(expirationDate.getDate() + (selectedDuration * 365));
    expirationDateValue.textContent = expirationDate.toLocaleDateString();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const expirationDayOnly = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
    const daysRemaining = Math.max(0, Math.floor((expirationDayOnly - today) / msPerDay));
    daysRemainingValue.textContent = daysRemaining;
    
    const totalDaysInTerm = selectedDuration * 365;
    const creditPerDay = totalDaysInTerm > 0 ? amount / totalDaysInTerm : 0;
    creditPerDayValue.textContent = formatCurrencyDisplay(creditPerDay);

    const totalCredit = creditPerDay * daysRemaining;
    totalCreditValue.textContent = formatCurrencyDisplay(totalCredit);
  }

  function saveInputs() {
    const inputs = {
      amount: amountInput.value,
      purchaseDate: dateInput.value,
      duration: parseInt(document.querySelector('.toggle-button.selected[data-years]').dataset.years, 10)
    };
    chrome.storage.local.set({ [STORAGE_KEY_INPUTS]: inputs });
  }

  function loadInputs() {
    console.log('[DEBUG] 2b. Starting to load calculator inputs from storage...');
    chrome.storage.local.get([STORAGE_KEY_INPUTS], (result) => {
      console.log('[DEBUG] 3b. Calculator inputs LOADED.');
      const saved = result[STORAGE_KEY_INPUTS] || defaultInputs;
      amountInput.value = formatCurrencyDisplay(saved.amount);
      dateInput.value = saved.purchaseDate;
      
      durationButtons.forEach(button => {
        const isSelected = parseInt(button.dataset.years, 10) === saved.duration;
        button.classList.toggle('selected', isSelected);
      });
      
      // Trigger a second calculation after inputs are loaded
      calculateAndDisplay();
    });
  }

  function clearAll() {
    amountInput.value = '';
    dateInput.value = '';
    durationButtons.forEach(button => button.classList.toggle('selected', button.dataset.years === '1'));
    calculateAndDisplay();
    saveInputs();
  }

  // --- Event Listeners ---
  [amountInput, dateInput].forEach(input => input.addEventListener('input', () => { calculateAndDisplay(); saveInputs(); }));
  amountInput.addEventListener('blur', () => { amountInput.value = formatCurrencyDisplay(amountInput.value); saveInputs(); });
  durationButtons.forEach(button => button.addEventListener('click', (event) => {
    durationButtons.forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    calculateAndDisplay();
    saveInputs();
  }));
  if (clearAllBtn) clearAllBtn.addEventListener('click', clearAll);

  // --- Initial Setup ---
  loadGlobalSettings();
  loadInputs();
});