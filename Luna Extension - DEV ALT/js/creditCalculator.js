// js/creditCalculator.js

/**
 * Credit Calculator script for the Luna Chrome Extension.
 * Calculates remaining credit based on an amount and purchase date.
 */

import { formatCurrencyDisplay, parseCurrencyInput } from './utils.js';

// ADDED: Utility function to save the current page to storage
function saveCurrentPage(pagePath) {
    chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: 'lunaLastPage', value: pagePath } });
}

document.addEventListener('DOMContentLoaded', () => {
  saveCurrentPage('/html/creditCalculator.html');

  console.log('[DEBUG] 1. DOM Content Loaded. Initializing script.');

  // --- Element References ---
  const lunaTitle = document.getElementById('extensionTitle');
  const amountInput = document.getElementById('creditAmountInput');
  const dateInput = document.getElementById('purchaseDateInput');
  const durationButtons = document.querySelectorAll('#duration1yr, #duration2yr, #duration3yr');
  
  const calcFromTodayBtn = document.getElementById('calcFromTodayBtn');
  const calcFromCustomBtn = document.getElementById('calcFromCustomBtn');
  const todaysDateDisplay = document.getElementById('todaysDateDisplay');
  const customDateGroup = document.getElementById('customDateGroup');
  const calculationDateInput = document.getElementById('calculationDateInput');
  const todaysDateValue = document.getElementById('todaysDateValue');

  const expirationDateValue = document.getElementById('expirationDateValue');
  const daysRemainingValue = document.getElementById('daysRemainingValue');
  const creditPerDayDisplay = document.getElementById('creditPerDayDisplay');
  const creditPerDayValue = document.getElementById('creditPerDayValue');
  const totalCreditValue = document.getElementById('totalCreditValue');
  
  const clearAllBtn = document.getElementById('clearAllBtn');
  const copyCreditBtn = document.getElementById('copyCreditBtn');

  // NEW: Upgrade section elements
  const newLicenseCostInput = document.getElementById('newLicenseCostInput');
  const whatTheyOweValue = document.getElementById('whatTheyOweValue');
  const copyOwedBtn = document.getElementById('copyOwedBtn');


  // --- Storage Keys ---
  const STORAGE_KEY_INPUTS = 'lunaCreditCalculatorInputs';
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel';
  const STORAGE_KEY_LUNA_TITLE_VISIBLE = 'lunaTitleVisible';
  const STORAGE_KEY_THEME_MODE = 'lunaThemeMode';
  const STORAGE_KEY_ACCENT_COLOR = 'lunaAccentColor';
  const STORAGE_KEY_TEXT_COLOR = 'lunaTextColor';
  const STORAGE_KEY_ADVANCED_MODE = 'lunaAdvancedModeEnabled';
  const STORAGE_KEY_BRANDING_MODE = 'lunaBrandingMode';

  // --- Global State ---
  let isAdvancedModeEnabled = false;

  const defaultInputs = {
    amount: '',
    purchaseDate: '',
    duration: 1,
    calculationType: 'today',
    calculationDate: '',
    newLicenseCost: '' // NEW
  };

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
   * Sets the branding mode (Luna or TeamViewer) and updates UI elements.
   * This function is needed on every page to ensure consistent branding.
   * @param {string} brandingMode - 'luna' or 'teamviewer'.
   * @param {string} themeMode - 'dark' or 'light'.
   * @param {boolean} [shouldSave=false] - Whether to save the setting to storage (only settings page saves).
   */
  function setBrandingMode(brandingMode, themeMode, shouldSave = false) {
    const extensionIcon = document.querySelector('.extensionIcon');
    const extensionTitle = document.getElementById('extensionTitle'); // 'Luna' text

    if (extensionIcon) {
      extensionIcon.src = brandingMode === 'luna' ? '../icons/logo.png' : '../icons/tvicon.png';
      extensionIcon.classList.toggle('inverted', brandingMode === 'teamviewer' && themeMode === 'dark');
    }
    if (extensionTitle) {
      extensionTitle.classList.toggle('hidden-title', brandingMode === 'teamviewer');
    }

    if (shouldSave && typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: STORAGE_KEY_BRANDING_MODE, value: brandingMode } });
    }
  }

  /**
   * Sets advanced mode state AND triggers a recalculation.
   */
  function setAdvancedMode(isEnabled) {
    console.log(`[DEBUG] 4. setAdvancedMode called with: ${isEnabled}`);
    isAdvancedModeEnabled = isEnabled;
    calculateAndDisplay();
  }
  
  /**
   * Sets the type of date to use for calculation ('today' or 'custom') and updates the UI.
   * @param {string} type - The calculation date type to set.
   * @param {boolean} [shouldSaveAndCalc=true] - Whether to save and recalculate.
   */
  function setCalculationDateType(type, shouldSaveAndCalc = true) {
    const isToday = type === 'today';
    
    calcFromTodayBtn.classList.toggle('selected', isToday);
    calcFromCustomBtn.classList.toggle('selected', !isToday);
    
    todaysDateDisplay.classList.toggle('hidden', !isToday);
    customDateGroup.classList.toggle('hidden', isToday);
    
    todaysDateDisplay.classList.toggle('calculation-date-active', isToday);
    customDateGroup.classList.toggle('calculation-date-active', !isToday);

    if (shouldSaveAndCalc) {
      calculateAndDisplay();
      saveInputs();
    }
  }

  function loadGlobalSettings() {
    console.log('[DEBUG] 2a. Starting to load global settings from storage...');
    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_TEXT_COLOR, STORAGE_KEY_ADVANCED_MODE, STORAGE_KEY_BRANDING_MODE],
      (result) => {
        const advancedMode = result[STORAGE_KEY_ADVANCED_MODE] === true;
        console.log(`[DEBUG] 3a. Global settings LOADED. Advanced Mode is: ${advancedMode}`);
        
        applyTheme(result[STORAGE_KEY_THEME_MODE] || 'dark', result[STORAGE_KEY_ACCENT_COLOR] || '#51a3f9', result[STORAGE_KEY_TEXT_COLOR] || '#ed5653');
        document.body.style.zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || 1.0;
        
        const brandingMode = result[STORAGE_KEY_BRANDING_MODE] || 'luna';
        const mode = result[STORAGE_KEY_THEME_MODE] || 'dark';
        setBrandingMode(brandingMode, mode);

        if (lunaTitle) {
          const hideBasedOnSetting = result[STORAGE_KEY_LUNA_TITLE_VISIBLE] === false;
          const hideBasedOnBranding = brandingMode === 'teamviewer';
          lunaTitle.classList.toggle('hidden-title', hideBasedOnSetting || hideBasedOnBranding);
        }

        setAdvancedMode(advancedMode);
      }
    );
  }

  /**
   * NEW: Validates required fields and adds/removes an error class.
   */
  function validateRequiredFields() {
    amountInput.classList.toggle('input-error', !amountInput.value.trim());
    dateInput.classList.toggle('input-error', !dateInput.value.trim());
  }

  function calculateAndDisplay() {
    console.log(`[DEBUG] 5. calculateAndDisplay running. Advanced mode is currently: ${isAdvancedModeEnabled}`);
    
    if (creditPerDayDisplay) {
      creditPerDayDisplay.classList.toggle('hidden', !isAdvancedModeEnabled);
    } else {
      console.error("[DEBUG] 'creditPerDayDisplay' element not found!");
    }
      
    const amount = parseCurrencyInput(amountInput.value) || 0;
    const purchaseDateStr = dateInput.value;
    const selectedDuration = parseInt(document.querySelector('.toggle-button.selected[data-years]').dataset.years, 10);
    const purchaseDate = new Date(purchaseDateStr);

    const isCustomDateMode = calcFromCustomBtn.classList.contains('selected');
    const customDate = new Date(calculationDateInput.value);

    // Reset upgrade section if main calculation is invalid
    if (amount <= 0 || !purchaseDateStr || isNaN(purchaseDate.getTime()) || (isCustomDateMode && isNaN(customDate.getTime()))) {
      expirationDateValue.textContent = 'N/A';
      daysRemainingValue.textContent = 'N/A';
      creditPerDayValue.textContent = formatCurrencyDisplay(0);
      totalCreditValue.textContent = formatCurrencyDisplay(0);
      whatTheyOweValue.textContent = formatCurrencyDisplay(0); // Also reset this
      return;
    }
    
    const calculationStartDate = isCustomDateMode ? customDate : new Date();

    const msPerDay = 1000 * 60 * 60 * 24;
    const expirationDate = new Date(purchaseDate.getTime());
    expirationDate.setDate(expirationDate.getDate() + (selectedDuration * 365));
    expirationDateValue.textContent = expirationDate.toLocaleDateString();
    
    calculationStartDate.setHours(0, 0, 0, 0); 
    const expirationDayOnly = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
    const daysRemaining = Math.max(0, Math.round((expirationDayOnly - calculationStartDate) / msPerDay));
    daysRemainingValue.textContent = daysRemaining;
    
    const totalDaysInTerm = selectedDuration * 365;
    const creditPerDay = totalDaysInTerm > 0 ? amount / totalDaysInTerm : 0;
    creditPerDayValue.textContent = formatCurrencyDisplay(creditPerDay);

    const totalCredit = creditPerDay * daysRemaining;
    totalCreditValue.textContent = formatCurrencyDisplay(totalCredit);

    // --- NEW: Upgrade Calculation ---
    const newLicenseCost = parseCurrencyInput(newLicenseCostInput.value) || 0;
    let whatTheyOwe = 0;
    if (newLicenseCost > 0) {
        whatTheyOwe = Math.max(0, newLicenseCost - totalCredit);
    }
    whatTheyOweValue.textContent = formatCurrencyDisplay(whatTheyOwe);
  }

  function saveInputs() {
    const inputs = {
      amount: amountInput.value,
      purchaseDate: dateInput.value,
      duration: parseInt(document.querySelector('.toggle-button.selected[data-years]').dataset.years, 10),
      calculationType: calcFromTodayBtn.classList.contains('selected') ? 'today' : 'custom',
      calculationDate: calculationDateInput.value,
      newLicenseCost: newLicenseCostInput.value // NEW
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
      
      calculationDateInput.value = saved.calculationDate || '';
      setCalculationDateType(saved.calculationType || 'today', false);
      
      newLicenseCostInput.value = formatCurrencyDisplay(saved.newLicenseCost); // NEW

      durationButtons.forEach(button => {
        const isSelected = parseInt(button.dataset.years, 10) === saved.duration;
        button.classList.toggle('selected', isSelected);
      });
      
      calculateAndDisplay();
    });
  }

  function clearAll() {
    amountInput.value = '';
    dateInput.value = '';
    calculationDateInput.value = '';
    newLicenseCostInput.value = ''; // NEW
    durationButtons.forEach(button => button.classList.toggle('selected', button.dataset.years === '1'));
    
    setCalculationDateType('today');
    validateRequiredFields(); // Re-apply red border after clearing
  }

  function copyCreditAmount() {
    const formattedAmount = totalCreditValue.textContent;
    if (!formattedAmount || formattedAmount === '$0.00') return;

    const rawNumber = parseCurrencyInput(formattedAmount);
    const plainTextAmount = String(rawNumber);

    navigator.clipboard.writeText(plainTextAmount).then(() => {
        const originalText = copyCreditBtn.innerHTML;
        copyCreditBtn.innerHTML = '✅';
        copyCreditBtn.title = 'Copied!';
        setTimeout(() => {
          copyCreditBtn.innerHTML = originalText;
          copyCreditBtn.title = 'Copy Amount';
        }, 1500);
      }).catch(err => {
        console.error('Could not copy text: ', err);
      });
  }
  
  // NEW: Function to copy the "What They Owe" amount
  function copyOwedAmount() {
    const formattedAmount = whatTheyOweValue.textContent;
    if (!formattedAmount || formattedAmount === '$0.00') return;

    const rawNumber = parseCurrencyInput(formattedAmount);
    const plainTextAmount = String(rawNumber);

    navigator.clipboard.writeText(plainTextAmount).then(() => {
        const originalText = copyOwedBtn.innerHTML;
        copyOwedBtn.innerHTML = '✅';
        copyOwedBtn.title = 'Copied!';
        setTimeout(() => {
          copyOwedBtn.innerHTML = originalText;
          copyOwedBtn.title = 'Copy Amount';
        }, 1500);
      }).catch(err => {
        console.error('Could not copy text: ', err);
      });
  }


  // --- Event Listeners ---
  [amountInput, dateInput, calculationDateInput, newLicenseCostInput].forEach(input => input.addEventListener('input', () => {
    validateRequiredFields(); // Validate on every input change
    calculateAndDisplay();
    saveInputs();
  }));
  
  [amountInput, newLicenseCostInput].forEach(input => {
    input.addEventListener('blur', () => { 
      input.value = formatCurrencyDisplay(input.value); 
      saveInputs(); 
    });
  });
  
  durationButtons.forEach(button => button.addEventListener('click', (event) => {
    durationButtons.forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    calculateAndDisplay();
    saveInputs();
  }));

  if (calcFromTodayBtn) calcFromTodayBtn.addEventListener('click', () => setCalculationDateType('today'));
  if (calcFromCustomBtn) calcFromCustomBtn.addEventListener('click', () => setCalculationDateType('custom'));

  if (clearAllBtn) clearAllBtn.addEventListener('click', clearAll);
  if (copyCreditBtn) copyCreditBtn.addEventListener('click', copyCreditAmount);
  if (copyOwedBtn) copyOwedBtn.addEventListener('click', copyOwedAmount); // NEW

  // --- Initial Setup ---
  todaysDateValue.textContent = new Date().toLocaleDateString();
  loadGlobalSettings();
  loadInputs();
  validateRequiredFields(); // Set initial state of required fields on load
});