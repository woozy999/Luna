// state.js
import { setIntegrationSelection, setDiscountIncreaseSelection } from './calculator.js';
import { setZoomSelection, setLunaTitleVisibility, setAdvancedMode, setTheme } from './settings.js';

export const STORAGE_KEY_INPUTS = 'lunaQuoteCalculatorInputs';
export const STORAGE_KEY_PAGE = 'lunaLastPage';
export const STORAGE_KEY_ZOOM = 'lunaZoomLevel';
export const STORAGE_KEY_LUNA_TITLE_VISIBLE = 'lunaTitleVisible';
export const STORAGE_KEY_THEME = 'lunaTheme';
export const STORAGE_KEY_ADVANCED_MODE = 'lunaAdvancedModeEnabled';
export const STORAGE_KEY_RECORDS = 'lunaQuoteRecords';

export const defaultZoomLevel = 1.0;
export const defaultLunaTitleVisible = true;
export const defaultTheme = 'purple';
export const defaultAdvancedMode = false;
export const fixedIntegrationsRate = 20.00;

export const defaultQuoteInputs = {
  companyName: '',
  erpLink: '',
  lastYearPrice: '',
  msrpTotal: '',
  integrationsSelected: 'no',
  discountIncreaseSelected: 'none',
  discountPercentage: '0',
  increasePercentage: '5.00%',
  notes: ''
};

export function getCurrentPageId() {
  const mainMenuPage = document.getElementById('mainMenuPage');
  const quoteCalculatorPage = document.getElementById('quoteCalculatorPage');
  const settingsPage = document.getElementById('settingsPage');
  const recordLogPage = document.getElementById('recordLogPage');
  if (mainMenuPage && !mainMenuPage.classList.contains('hidden')) return 'mainMenuPage';
  if (quoteCalculatorPage && !quoteCalculatorPage.classList.contains('hidden')) return 'quoteCalculatorPage';
  if (settingsPage && !settingsPage.classList.contains('hidden')) return 'settingsPage';
  if (recordLogPage && !recordLogPage.classList.contains('hidden')) return 'recordLogPage';
  return 'mainMenuPage';
}

export function showPage(pageId) {
  const mainMenuPage = document.getElementById('mainMenuPage');
  const quoteCalculatorPage = document.getElementById('quoteCalculatorPage');
  const settingsPage = document.getElementById('settingsPage');
  const recordLogPage = document.getElementById('recordLogPage');
  const calculatorFooter = document.getElementById('calculatorFooter');
  const recordLogFooter = document.getElementById('recordLogFooter');

  if (mainMenuPage) mainMenuPage.classList.add('hidden');
  if (quoteCalculatorPage) quoteCalculatorPage.classList.add('hidden');
  if (settingsPage) settingsPage.classList.add('hidden');
  if (recordLogPage) recordLogPage.classList.add('hidden');

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.remove('hidden');
  } else {
    console.error(`Attempted to show non-existent page: ${pageId}`);
    if (mainMenuPage) mainMenuPage.classList.remove('hidden');
    return;
  }

  if (calculatorFooter) {
    calculatorFooter.classList.toggle('hidden', pageId !== 'quoteCalculatorPage');
  }
  if (recordLogFooter) {
    recordLogFooter.classList.toggle('hidden', pageId !== 'recordLogPage');
  }

  if (pageId === 'recordLogPage') {
    import('./calculator.js').then(mod => mod.renderRecordLog());
  }

  saveAppState();
}

export function getCalculatorInputsState() {
  const companyNameInput = document.getElementById('companyNameInput');
  const erpLinkInput = document.getElementById('erpLinkInput');
  const lastYearPriceInput = document.getElementById('lastYearPrice');
  const msrpTotalInput = document.getElementById('msrpTotal');
  const integrationsYesButton = document.getElementById('integrationsYes');
  const discountBtn = document.getElementById('discountBtn');
  const increaseBtn = document.getElementById('increaseBtn');
  const discountPercentageInput = document.getElementById('discountPercentage');
  const increasePercentageInput = document.getElementById('increasePercentage');
  const notesInput = document.getElementById('notesInput');
  return {
    companyName: companyNameInput ? companyNameInput.value : '',
    erpLink: erpLinkInput ? erpLinkInput.value : '',
    lastYearPrice: lastYearPriceInput ? lastYearPriceInput.value : '',
    msrpTotal: msrpTotalInput ? msrpTotalInput.value : '',
    integrationsSelected: integrationsYesButton ? (integrationsYesButton.classList.contains('selected') ? 'yes' : 'no') : 'no',
    discountIncreaseSelected: discountBtn ? (discountBtn.classList.contains('selected') ? 'discount' : increaseBtn && increaseBtn.classList.contains('selected') ? 'increase' : 'none') : 'none',
    discountPercentage: discountPercentageInput ? discountPercentageInput.value : '0',
    increasePercentage: increasePercentageInput ? increasePercentageInput.value : '5.00%',
    notes: notesInput ? notesInput.value : ''
  };
}

export function saveAppState() {
  const appState = {
    calculatorInputs: getCalculatorInputsState(),
    currentPage: getCurrentPageId()
  };
  chrome.runtime.sendMessage({ type: 'saveAppState', payload: appState }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error sending app state to background:', chrome.runtime.lastError.message);
    }
  });
}

export function loadAppState(useDefaults = false) {
  chrome.storage.local.get(
    [STORAGE_KEY_INPUTS, STORAGE_KEY_PAGE, STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_THEME, STORAGE_KEY_ADVANCED_MODE],
    (result) => {
      const savedInputs = useDefaults ? defaultQuoteInputs : (result[STORAGE_KEY_INPUTS] || defaultQuoteInputs);
      const companyNameInput = document.getElementById('companyNameInput');
      const erpLinkInput = document.getElementById('erpLinkInput');
      const lastYearPriceInput = document.getElementById('lastYearPrice');
      const msrpTotalInput = document.getElementById('msrpTotal');
      const discountPercentageInput = document.getElementById('discountPercentage');
      const increasePercentageInput = document.getElementById('increasePercentage');
      const notesInput = document.getElementById('notesInput');
      if (companyNameInput) companyNameInput.value = savedInputs.companyName;
      if (erpLinkInput) erpLinkInput.value = savedInputs.erpLink;
      if (lastYearPriceInput) lastYearPriceInput.value = savedInputs.lastYearPrice;
      if (msrpTotalInput) msrpTotalInput.value = savedInputs.msrpTotal;
      if (discountPercentageInput) discountPercentageInput.value = savedInputs.discountPercentage;
      if (increasePercentageInput) increasePercentageInput.value = savedInputs.increasePercentage;
      if (notesInput) notesInput.value = savedInputs.notes || '';
      setIntegrationSelection(savedInputs.integrationsSelected, false);
      setDiscountIncreaseSelection(savedInputs.discountIncreaseSelected, false);
      const savedZoom = useDefaults ? defaultZoomLevel : (parseFloat(result[STORAGE_KEY_ZOOM]) || defaultZoomLevel);
      setZoomSelection(savedZoom);
      const lunaTitleIsVisible = useDefaults ? defaultLunaTitleVisible : (result[STORAGE_KEY_LUNA_TITLE_VISIBLE] !== false);
      setLunaTitleVisibility(lunaTitleIsVisible, false);
      const advancedModeIsCurrentlyEnabled = useDefaults ? defaultAdvancedMode : (result[STORAGE_KEY_ADVANCED_MODE] === true);
      setAdvancedMode(advancedModeIsCurrentlyEnabled, false);
      const savedTheme = useDefaults ? defaultTheme : (result[STORAGE_KEY_THEME] || defaultTheme);
      setTheme(savedTheme, false);
      const lastPage = useDefaults ? 'mainMenuPage' : (result[STORAGE_KEY_PAGE] || 'mainMenuPage');
      showPage(lastPage);
      calculateTotalAndUpdateDisplay();
    }
  );
}

export function resetAll() {
  if (!confirm('Are you sure you want to reset ALL data and settings to default? This cannot be undone.')) {
    return;
  }
  const keysToClear = [
    STORAGE_KEY_INPUTS,
    STORAGE_KEY_PAGE,
    STORAGE_KEY_ZOOM,
    STORAGE_KEY_LUNA_TITLE_VISIBLE,
    STORAGE_KEY_THEME,
    STORAGE_KEY_ADVANCED_MODE,
    STORAGE_KEY_RECORDS
  ];
  chrome.storage.local.remove(keysToClear, () => {
    if (chrome.runtime.lastError) {
      console.error('Error clearing storage:', chrome.runtime.lastError.message);
    } else {
      console.log('All specified storage cleared. Reloading app with defaults.');
      loadAppState(true);
      showPage('mainMenuPage');
    }
  });
}
