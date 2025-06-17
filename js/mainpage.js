import {
  calculateTotalAndUpdateDisplay,
  setIntegrationSelection,
  setDiscountIncreaseSelection,
  clearAllInputs,
  completeQuote,
  formatCurrencyDisplay,
  formatPercentageDisplay,
  downloadAllRecordsFromLog
} from './calculator.js';
import {
  setZoomSelection,
  setLunaTitleVisibility,
  setAdvancedMode,
  setTheme
} from './settings.js';
import {
  saveAppState,
  loadAppState,
  showPage,
  resetAll
} from './state.js';

document.addEventListener('DOMContentLoaded', () => {
  const openQuoteCalculatorButton = document.getElementById('openQuoteCalculator');
  const openSettingsButton = document.getElementById('openSettingsButton');
  const openRecordLogButton = document.getElementById('openRecordLogButton');
  const backToMenuButton = document.getElementById('backToMenu');
  const backToMenuFromSettingsButton = document.getElementById('backToMenuFromSettings');
  const backToMenuFromRecordLogButton = document.getElementById('backToMenuFromRecordLog');
  const discountBtn = document.getElementById('discountBtn');
  const increaseBtn = document.getElementById('increaseBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const completeBtn = document.getElementById('completeBtn');
  const resetAllButton = document.getElementById('resetAllButton');
  const downloadAllRecordsBtn = document.getElementById('downloadAllRecordsBtn');
  const integrationsYesButton = document.getElementById('integrationsYes');
  const integrationsNoButton = document.getElementById('integrationsNo');
  const zoomSlider = document.getElementById('zoomSlider');
  const lunaTitleVisibleButton = document.getElementById('lunaTitleVisible');
  const lunaTitleHiddenButton = document.getElementById('lunaTitleHidden');
  const advancedModeEnabledBtn = document.getElementById('advancedModeEnabledBtn');
  const advancedModeDisabledBtn = document.getElementById('advancedModeDisabledBtn');
  const themeButtons = document.querySelectorAll('.theme-button');
  const companyNameInput = document.getElementById('companyNameInput');
  const erpLinkInput = document.getElementById('erpLinkInput');
  const lastYearPriceInput = document.getElementById('lastYearPrice');
  const msrpTotalInput = document.getElementById('msrpTotal');
  const discountPercentageInput = document.getElementById('discountPercentage');
  const increasePercentageInput = document.getElementById('increasePercentage');
  const notesInput = document.getElementById('notesInput');

  if (openQuoteCalculatorButton) {
    openQuoteCalculatorButton.addEventListener('click', () => showPage('quoteCalculatorPage'));
  }
  if (openSettingsButton) {
    openSettingsButton.addEventListener('click', () => {
      showPage('settingsPage');
      const currentZoom = parseFloat(document.body.style.zoom) || 1.0;
      setZoomSelection(currentZoom);
    });
  }
  if (openRecordLogButton) {
    openRecordLogButton.addEventListener('click', () => showPage('recordLogPage'));
  }
  if (backToMenuButton) {
    backToMenuButton.addEventListener('click', () => showPage('mainMenuPage'));
  }
  if (backToMenuFromSettingsButton) {
    backToMenuFromSettingsButton.addEventListener('click', () => showPage('mainMenuPage'));
  }
  if (backToMenuFromRecordLogButton) {
    backToMenuFromRecordLogButton.addEventListener('click', () => showPage('mainMenuPage'));
  }
  if (integrationsYesButton) integrationsYesButton.addEventListener('click', () => setIntegrationSelection('yes'));
  if (integrationsNoButton) integrationsNoButton.addEventListener('click', () => setIntegrationSelection('no'));
  if (discountBtn) discountBtn.addEventListener('click', () => setDiscountIncreaseSelection('discount'));
  if (increaseBtn) increaseBtn.addEventListener('click', () => setDiscountIncreaseSelection('increase'));
  if (zoomSlider) {
    zoomSlider.addEventListener('input', (e) => setZoomSelection(parseFloat(e.target.value)));
  }
  if (lunaTitleVisibleButton) lunaTitleVisibleButton.addEventListener('click', () => setLunaTitleVisibility(true));
  if (lunaTitleHiddenButton) lunaTitleHiddenButton.addEventListener('click', () => setLunaTitleVisibility(false));
  if (advancedModeEnabledBtn) advancedModeEnabledBtn.addEventListener('click', () => setAdvancedMode(true));
  if (advancedModeDisabledBtn) advancedModeDisabledBtn.addEventListener('click', () => setAdvancedMode(false));
  if (themeButtons) {
    themeButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const selectedTheme = event.target.dataset.theme;
        if (selectedTheme) {
          setTheme(selectedTheme);
        }
      });
    });
  }
  if (clearAllBtn) clearAllBtn.addEventListener('click', () => clearAllInputs(true));
  if (completeBtn) completeBtn.addEventListener('click', completeQuote);
  if (resetAllButton) resetAllButton.addEventListener('click', resetAll);
  if (downloadAllRecordsBtn) downloadAllRecordsBtn.addEventListener('click', downloadAllRecordsFromLog);

  if (companyNameInput) companyNameInput.addEventListener('input', saveAppState);
  if (erpLinkInput) erpLinkInput.addEventListener('input', saveAppState);

  const numericInputHandler = (event) => {
    calculateTotalAndUpdateDisplay();
    saveAppState();
  };
  if (lastYearPriceInput) lastYearPriceInput.addEventListener('input', numericInputHandler);
  if (msrpTotalInput) msrpTotalInput.addEventListener('input', numericInputHandler);
  if (discountPercentageInput) discountPercentageInput.addEventListener('input', numericInputHandler);
  if (increasePercentageInput) increasePercentageInput.addEventListener('input', numericInputHandler);
  if (notesInput) notesInput.addEventListener('input', saveAppState);

  if (lastYearPriceInput) {
    lastYearPriceInput.addEventListener('blur', (e) => {
      if (e.target.value !== '') e.target.value = formatCurrencyDisplay(e.target.value);
      calculateTotalAndUpdateDisplay();
      saveAppState();
    });
  }
  if (msrpTotalInput) {
    msrpTotalInput.addEventListener('blur', (e) => {
      if (e.target.value !== '') e.target.value = formatCurrencyDisplay(e.target.value);
      calculateTotalAndUpdateDisplay();
      saveAppState();
    });
  }
  if (increasePercentageInput) {
    increasePercentageInput.addEventListener('blur', (e) => {
      if (e.target.value !== '') e.target.value = formatPercentageDisplay(e.target.value);
      calculateTotalAndUpdateDisplay();
      saveAppState();
    });
  }

  loadAppState();
});
