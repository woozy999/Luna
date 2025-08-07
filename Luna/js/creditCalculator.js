// js/creditCalculator.js

/**
 * Credit Calculator script for the Luna Chrome Extension.
 * Calculates remaining credit based on an amount and purchase date.
 * Supports both a single line and multi-line calculation mode.
 */

import { formatCurrencyDisplay, parseCurrencyInput, hexToRgba } from './utils.js';

function saveCurrentPage(pagePath) {
    chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: 'lunaLastPage', value: pagePath } });
}

document.addEventListener('DOMContentLoaded', () => {
  saveCurrentPage('/html/creditCalculator.html');

  // --- Element References ---
  const lunaTitle = document.getElementById('extensionTitle');
  const clearAllBtn = document.getElementById('clearAllBtn');

  // View Toggling
  const singleLineToggleBtn = document.getElementById('singleLineToggleBtn');
  const multiLineToggleBtn = document.getElementById('multiLineToggleBtn');
  const singleLineContainer = document.getElementById('singleLineContainer');
  const multiLineContainer = document.getElementById('multiLineContainer');
  const singleLineDurationSection = document.getElementById('singleLineDurationSection');

  // Single Line Inputs
  const amountInput = document.getElementById('creditAmountInput');
  const dateInput = document.getElementById('purchaseDateInput');
  const durationButtons = document.querySelectorAll('#duration1yr, #duration2yr, #duration3yr');

  // Multi Line Inputs & Template
  const lineItemsContainer = document.getElementById('lineItemsContainer');
  const addLineBtn = document.getElementById('addLineBtn');
  const lineItemTemplate = document.getElementById('lineItemTemplate');
  
  // Global Calculation Options
  const calcFromTodayBtn = document.getElementById('calcFromTodayBtn');
  const calcFromCustomBtn = document.getElementById('calcFromCustomBtn');
  const todaysDateDisplay = document.getElementById('todaysDateDisplay');
  const customDateGroup = document.getElementById('customDateGroup');
  const calculationDateInput = document.getElementById('calculationDateInput');
  const todaysDateValue = document.getElementById('todaysDateValue');

  // Results & Upgrade
  const expirationDateDisplay = document.getElementById('expirationDateDisplay');
  const daysRemainingDisplay = document.getElementById('daysRemainingDisplay');
  const expirationDateValue = document.getElementById('expirationDateValue');
  const daysRemainingValue = document.getElementById('daysRemainingValue');
  const creditPerDayDisplay = document.getElementById('creditPerDayDisplay');
  const creditPerDayValue = document.getElementById('creditPerDayValue');
  const totalCreditValue = document.getElementById('totalCreditValue');
  const copyCreditBtn = document.getElementById('copyCreditBtn');
  const newLicenseCostInput = document.getElementById('newLicenseCostInput');
  const whatTheyOweValue = document.getElementById('whatTheyOweValue');
  const copyOwedBtn = document.getElementById('copyOwedBtn');

  // --- Storage Keys ---
  const STORAGE_KEY_INPUTS = 'lunaCreditCalculatorInputs';
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel';
  const STORAGE_KEY_THEME_MODE = 'lunaThemeMode';
  const STORAGE_KEY_ACCENT_COLOR = 'lunaAccentColor';
  const STORAGE_KEY_ADVANCED_MODE = 'lunaAdvancedModeEnabled';
  const STORAGE_KEY_BRANDING_MODE = 'lunaBrandingMode';
  const STORAGE_KEY_CARD_STATES = 'lunaCreditCardStates';

  // --- Global State ---
  let isAdvancedModeEnabled = false;

  const defaultInputs = {
    activeView: 'single',
    // Single line data
    amount: '',
    purchaseDate: '',
    duration: 1,
    // Multi line data
    multiLineItems: [],
    // Global data
    calculationType: 'today',
    calculationDate: '',
    newLicenseCost: ''
  };
  
  const defaultThemeMode = 'dark';
  const defaultAccentColor = '#3B82F6';
  const defaultBrandingMode = 'luna';

  // --- Global Settings Functions ---
  function applyTheme(mode, accentColor) {
    const body = document.body;
    const root = document.documentElement;
    body.classList.toggle('theme-dark', mode === 'dark');
    body.classList.toggle('theme-light', mode === 'light');
    root.style.setProperty('--primary-accent', accentColor);
    root.style.setProperty('--primary-accent-shadow', hexToRgba(accentColor, 0.2));
  }

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
  
  function applyZoom(zoomLevel) {
    document.body.style.zoom = zoomLevel;
  }

  function setAdvancedMode(isEnabled) {
    isAdvancedModeEnabled = isEnabled;
    document.body.classList.toggle('advanced-mode-on', isEnabled);
    calculateAndDisplay();
  }
  
  function loadGlobalSettings() {
    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_ADVANCED_MODE, STORAGE_KEY_BRANDING_MODE],
      (result) => {
        const mode = result[STORAGE_KEY_THEME_MODE] || defaultThemeMode;
        const accent = result[STORAGE_KEY_ACCENT_COLOR] || defaultAccentColor;
        applyTheme(mode, accent);
        
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || 1.0;
        applyZoom(zoom);
        
        const brandingMode = result[STORAGE_KEY_BRANDING_MODE] || defaultBrandingMode;
        setBrandingMode(brandingMode, mode);
        
        const advancedMode = result[STORAGE_KEY_ADVANCED_MODE] === true;
        setAdvancedMode(advancedMode);
      }
    );
  }

  // --- View Management ---
  function setView(viewName, shouldSave = true) {
    const isSingle = viewName === 'single';

    singleLineToggleBtn.classList.toggle('selected', isSingle);
    multiLineToggleBtn.classList.toggle('selected', !isSingle);

    singleLineContainer.classList.toggle('hidden', !isSingle);
    multiLineContainer.classList.toggle('hidden', isSingle);
    
    // Show/hide fields that are only relevant to single line view
    expirationDateDisplay.classList.toggle('hidden', !isSingle);
    daysRemainingDisplay.classList.toggle('hidden', !isSingle);
    
    if (shouldSave) {
        saveInputs();
    }
    calculateAndDisplay();
  }

  // --- Multi-Line Item Functions ---
  function addNewLine(data = { name: '', amount: '', startDate: '', duration: 1, endDate: '' }) {
    const fragment = lineItemTemplate.content.cloneNode(true);
    const lineItem = fragment.querySelector('.line-item');
    
    const nameInput = lineItem.querySelector('.line-name');
    const amountInput = lineItem.querySelector('.line-amount');
    const startDateInput = lineItem.querySelector('.line-start-date');
    const durationSelect = lineItem.querySelector('.line-duration');
    const endDateInput = lineItem.querySelector('.line-end-date');
    const deleteBtn = lineItem.querySelector('.delete-line-btn');

    nameInput.value = data.name;
    amountInput.value = formatCurrencyDisplay(data.amount);
    startDateInput.value = data.startDate;
    durationSelect.value = data.duration;
    endDateInput.value = data.endDate;

    // Add event listeners
    [nameInput, startDateInput, endDateInput].forEach(input => {
        input.addEventListener('input', () => { calculateAndDisplay(); saveInputs(); });
    });
    amountInput.addEventListener('input', () => { calculateAndDisplay(); saveInputs(); });
    amountInput.addEventListener('blur', () => { amountInput.value = formatCurrencyDisplay(amountInput.value); });
    durationSelect.addEventListener('change', () => { calculateAndDisplay(); saveInputs(); });
    
    deleteBtn.addEventListener('click', () => {
        lineItem.remove();
        calculateAndDisplay();
        saveInputs();
    });

    lineItemsContainer.appendChild(lineItem);
  }


  // --- Calculation Logic ---
  function calculateAndDisplay() {
    creditPerDayDisplay.classList.toggle('hidden', !isAdvancedModeEnabled);

    const activeView = singleLineToggleBtn.classList.contains('selected') ? 'single' : 'multi';
    const calculationStartDate = getCalculationStartDate();
    let totalCredit = 0;
    
    if (activeView === 'single') {
        totalCredit = calculateSingleLine(calculationStartDate);
    } else {
        totalCredit = calculateMultiLine(calculationStartDate);
    }

    totalCreditValue.textContent = formatCurrencyDisplay(totalCredit);
    calculateUpgrade(totalCredit);
  }

  function getCalculationStartDate() {
    const isCustomDateMode = calcFromCustomBtn.classList.contains('selected');
    const customDate = new Date(calculationDateInput.value);
    const calculationDate = (isCustomDateMode && !isNaN(customDate.getTime())) ? customDate : new Date();
    calculationDate.setHours(0, 0, 0, 0); 
    return calculationDate;
  }
  
  function calculateSingleLine(calculationStartDate) {
    // Re-added validation for single line inputs
    amountInput.classList.toggle('input-error', !amountInput.value.trim());
    dateInput.classList.toggle('input-error', !dateInput.value.trim());

    const amount = parseCurrencyInput(amountInput.value) || 0;
    const purchaseDateStr = dateInput.value;
    const selectedDuration = parseInt(document.querySelector('#singleLineDurationSection .toggle-button.selected[data-years]').dataset.years, 10);
    const purchaseDate = new Date(purchaseDateStr);

    if (amount <= 0 || !purchaseDateStr || isNaN(purchaseDate.getTime())) {
      expirationDateValue.textContent = 'N/A';
      daysRemainingValue.textContent = 'N/A';
      creditPerDayValue.textContent = formatCurrencyDisplay(0);
      return 0;
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const expirationDate = new Date(purchaseDate.getTime());
    expirationDate.setFullYear(expirationDate.getFullYear() + selectedDuration);
    expirationDateValue.textContent = expirationDate.toLocaleDateString();
    
    const expirationDayOnly = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
    const daysRemaining = Math.max(0, Math.round((expirationDayOnly - calculationStartDate) / msPerDay));
    daysRemainingValue.textContent = daysRemaining;
    
    const totalDaysInTerm = selectedDuration * 365;
    const creditPerDay = totalDaysInTerm > 0 ? amount / totalDaysInTerm : 0;
    creditPerDayValue.textContent = formatCurrencyDisplay(creditPerDay);

    return creditPerDay * daysRemaining;
  }

  function calculateMultiLine(calculationStartDate) {
      let grandTotalCredit = 0;
      const lineItems = lineItemsContainer.querySelectorAll('.line-item');

      lineItems.forEach(item => {
          const amountInput = item.querySelector('.line-amount');
          const startDateInput = item.querySelector('.line-start-date');
          const durationSelect = item.querySelector('.line-duration');
          const endDateInput = item.querySelector('.line-end-date');
          const creditDisplay = item.querySelector('.line-credit-display');

          const amount = parseCurrencyInput(amountInput.value) || 0;
          const startDate = new Date(startDateInput.value);
          const duration = parseInt(durationSelect.value, 10);

          // Auto-calculate end date if start and duration are valid
          if (!isNaN(startDate.getTime())) {
              const calculatedEndDate = new Date(startDate);
              calculatedEndDate.setFullYear(calculatedEndDate.getFullYear() + duration);
              // Only update if the user hasn't typed in it
              if (!endDateInput.value) {
                endDateInput.placeholder = calculatedEndDate.toLocaleDateString();
              }
          }

          const endDate = new Date(endDateInput.value || endDateInput.placeholder);
          
          amountInput.classList.toggle('input-error', amount <= 0);
          startDateInput.classList.toggle('input-error', isNaN(startDate.getTime()));

          if (amount <= 0 || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              creditDisplay.textContent = formatCurrencyDisplay(0);
              return;
          }
          
          const msPerDay = 1000 * 60 * 60 * 24;
          const totalDaysInTerm = Math.round((endDate - startDate) / msPerDay);
          const creditPerDay = totalDaysInTerm > 0 ? amount / totalDaysInTerm : 0;
          
          const daysRemaining = Math.max(0, Math.round((endDate - calculationStartDate) / msPerDay));
          
          const lineCredit = creditPerDay * daysRemaining;
          grandTotalCredit += lineCredit;
          creditDisplay.textContent = formatCurrencyDisplay(lineCredit);
      });

      return grandTotalCredit;
  }

  function calculateUpgrade(totalCredit) {
    const newLicenseCost = parseCurrencyInput(newLicenseCostInput.value) || 0;
    const whatTheyOwe = Math.max(0, newLicenseCost - totalCredit);
    whatTheyOweValue.textContent = formatCurrencyDisplay(whatTheyOwe);
  }

  // --- Data Persistence ---
  function saveInputs() {
    let multiLineItems = [];
    document.querySelectorAll('#lineItemsContainer .line-item').forEach(item => {
        multiLineItems.push({
            name: item.querySelector('.line-name').value,
            amount: item.querySelector('.line-amount').value,
            startDate: item.querySelector('.line-start-date').value,
            duration: item.querySelector('.line-duration').value,
            endDate: item.querySelector('.line-end-date').value,
        });
    });

    const inputsToSave = {
      activeView: singleLineToggleBtn.classList.contains('selected') ? 'single' : 'multi',
      amount: amountInput.value,
      purchaseDate: dateInput.value,
      duration: parseInt(document.querySelector('#singleLineDurationSection .toggle-button.selected[data-years]').dataset.years, 10),
      multiLineItems: multiLineItems,
      calculationType: calcFromTodayBtn.classList.contains('selected') ? 'today' : 'custom',
      calculationDate: calculationDateInput.value,
      newLicenseCost: newLicenseCostInput.value
    };
    chrome.storage.local.set({ [STORAGE_KEY_INPUTS]: inputsToSave });
  }

  function loadInputs() {
    chrome.storage.local.get([STORAGE_KEY_INPUTS], (result) => {
      const saved = result[STORAGE_KEY_INPUTS] || defaultInputs;
      
      // Load single line
      amountInput.value = formatCurrencyDisplay(saved.amount);
      dateInput.value = saved.purchaseDate;
      durationButtons.forEach(button => {
        button.classList.toggle('selected', parseInt(button.dataset.years, 10) === saved.duration);
      });
      
      // Load multi-line
      lineItemsContainer.innerHTML = ''; // Clear existing
      if (saved.multiLineItems && saved.multiLineItems.length > 0) {
          saved.multiLineItems.forEach(itemData => addNewLine(itemData));
      } else {
          addNewLine(); // Add one empty line if none are saved
      }

      // Load global
      calculationDateInput.value = saved.calculationDate || '';
      setCalculationDateType(saved.calculationType || 'today', false);
      newLicenseCostInput.value = formatCurrencyDisplay(saved.newLicenseCost);

      // Set view and calculate
      setView(saved.activeView || 'single', false);
    });
  }

  function clearAll() {
    // Clear single line
    amountInput.value = '';
    dateInput.value = '';
    durationButtons.forEach(button => button.classList.toggle('selected', button.dataset.years === '1'));
    
    // Clear multi-line
    lineItemsContainer.innerHTML = '';
    addNewLine(); // Add back one fresh line

    // Clear global
    setCalculationDateType('today');
    newLicenseCostInput.value = '';

    calculateAndDisplay();
    saveInputs();
  }

  // --- Helper/Utility Functions ---
  function setCalculationDateType(type, shouldSaveAndCalc = true) {
    const isToday = type === 'today';
    calcFromTodayBtn.classList.toggle('selected', isToday);
    calcFromCustomBtn.classList.toggle('selected', !isToday);
    todaysDateDisplay.classList.toggle('hidden', !isToday);
    customDateGroup.classList.toggle('hidden', isToday);
    if (shouldSaveAndCalc) {
      calculateAndDisplay();
      saveInputs();
    }
  }

  function copyToClipboard(element, button) {
      const formattedAmount = element.textContent;
      if (!formattedAmount || formattedAmount === '$0.00') return;

      const rawNumber = parseCurrencyInput(formattedAmount);
      const plainTextAmount = String(rawNumber);

      navigator.clipboard.writeText(plainTextAmount).then(() => {
          const originalText = button.innerHTML;
          button.innerHTML = '✅';
          button.title = 'Copied!';
          setTimeout(() => {
            button.innerHTML = originalText;
            button.title = 'Copy Amount';
          }, 1500);
        }).catch(err => {
          console.error('Could not copy text: ', err);
        });
  }

  function initializeCollapsibleCards() {
    chrome.storage.local.get([STORAGE_KEY_CARD_STATES], (result) => {
        const cardStates = result[STORAGE_KEY_CARD_STATES] || {};
        document.querySelectorAll('.card').forEach(card => {
            const cardId = card.id;
            if (!cardId) return;
            const toggle = card.querySelector('.collapse-toggle');
            if (!toggle) return;
            if (cardStates[cardId] === true) {
                card.classList.add('collapsed');
            }
            toggle.addEventListener('click', () => {
                const isCollapsed = card.classList.toggle('collapsed');
                cardStates[cardId] = isCollapsed;
                chrome.storage.local.set({ [STORAGE_KEY_CARD_STATES]: cardStates });
            });
        });
    });
  }

  // --- Event Listeners ---
  singleLineToggleBtn.addEventListener('click', () => setView('single'));
  multiLineToggleBtn.addEventListener('click', () => setView('multi'));
  addLineBtn.addEventListener('click', () => { addNewLine(); calculateAndDisplay(); });
  
  // Single Line Inputs
  [amountInput, dateInput].forEach(input => input.addEventListener('input', () => { calculateAndDisplay(); saveInputs(); }));
  amountInput.addEventListener('blur', () => { amountInput.value = formatCurrencyDisplay(amountInput.value); });
  durationButtons.forEach(button => button.addEventListener('click', (event) => {
    durationButtons.forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    calculateAndDisplay();
    saveInputs();
  }));
  
  // Global Inputs
  calcFromTodayBtn.addEventListener('click', () => setCalculationDateType('today'));
  calcFromCustomBtn.addEventListener('click', () => setCalculationDateType('custom'));
  calculationDateInput.addEventListener('input', () => { calculateAndDisplay(); saveInputs(); });
  newLicenseCostInput.addEventListener('input', () => { calculateAndDisplay(); saveInputs(); });
  newLicenseCostInput.addEventListener('blur', () => { newLicenseCostInput.value = formatCurrencyDisplay(newLicenseCostInput.value); });

  // Buttons
  clearAllBtn.addEventListener('click', clearAll);
  copyCreditBtn.addEventListener('click', () => copyToClipboard(totalCreditValue, copyCreditBtn));
  copyOwedBtn.addEventListener('click', () => copyToClipboard(whatTheyOweValue, copyOwedBtn));

  // --- Initial Setup ---
  todaysDateValue.textContent = new Date().toLocaleDateString();
  loadGlobalSettings();
  loadInputs();
  initializeCollapsibleCards();
});