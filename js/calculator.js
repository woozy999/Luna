// calculator.js
import { STORAGE_KEY_RECORDS, fixedIntegrationsRate } from './state.js';
import { saveAppState, getCalculatorInputsState } from './state.js';
import { setIntegrationSelection, setDiscountIncreaseSelection, showPage } from './state.js';
// Utility functions
export function formatCurrencyDisplay(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const cleanNumString = String(value).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanNumString);
  if (isNaN(num)) {
    return '';
  }
  return `$${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function parseCurrencyInput(formattedValue) {
  if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
    return null;
  }
  const cleanValue = String(formattedValue).replace(/[$,]/g, '');
  const num = parseFloat(cleanValue);
  return isNaN(num) ? null : num;
}

export function formatPercentageDisplay(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) {
    return '';
  }
  return `${num.toFixed(2)}%`;
}

export function parsePercentageInput(formattedValue) {
  if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
    return null;
  }
  const cleanValue = String(formattedValue).replace(/%/g, '');
  const num = parseFloat(cleanValue);
  return isNaN(num) ? null : num;
}

// Calculation and related display updates
export function calculateTotalAndUpdateDisplay() {
  const lastYearPriceInput = document.getElementById('lastYearPrice');
  const msrpTotalInput = document.getElementById('msrpTotal');
  const integrationsYesButton = document.getElementById('integrationsYes');
  const discountBtn = document.getElementById('discountBtn');
  const increaseBtn = document.getElementById('increaseBtn');
  const increasePercentageInput = document.getElementById('increasePercentage');
  const integrationsCostDisplay = document.getElementById('integrationsCostDisplay');
  const integrationsCostValue = document.getElementById('integrationsCostValue');
  const discountForErpDisplay = document.getElementById('discountForErpDisplay');
  const discountForErpValue = document.getElementById('discountForErpValue');
  const totalEndPriceDisplay = document.getElementById('totalEndPriceDisplay');
  const totalEndPriceValue = document.getElementById('totalEndPriceValue');

  const lastYearPrice = parseCurrencyInput(lastYearPriceInput ? lastYearPriceInput.value : '') || 0;
  const msrpTotal = parseCurrencyInput(msrpTotalInput ? msrpTotalInput.value : '') || 0;
  const integrationsActive = integrationsYesButton ? integrationsYesButton.classList.contains('selected') : false;
  const discountActive = discountBtn ? discountBtn.classList.contains('selected') : false;
  const increaseActive = increaseBtn ? increaseBtn.classList.contains('selected') : false;
  const increasePercentage = parsePercentageInput(increasePercentageInput ? increasePercentageInput.value : '') || 0;

  const currentIntegrationsRate = fixedIntegrationsRate / 100;

  const validatedLastYearPrice = Math.max(0, lastYearPrice);
  const validatedMsrpTotal = Math.max(0, msrpTotal);
  const validatedIncreasePercentage = Math.min(1000, Math.max(0, increasePercentage));

  let displayIntegrationsCost = false;
  let displayDiscountForErp = false;
  let displayTotalEndPrice = false;

  if (integrationsActive && increaseActive) {
    displayIntegrationsCost = true;
  }
  if (increaseActive && !discountActive) {
    displayDiscountForErp = true;
    displayTotalEndPrice = true;
  }

  if (integrationsCostDisplay) integrationsCostDisplay.classList.toggle('hidden', !displayIntegrationsCost);
  if (discountForErpDisplay) discountForErpDisplay.classList.toggle('hidden', !displayDiscountForErp);
  if (totalEndPriceDisplay) totalEndPriceDisplay.classList.toggle('hidden', !displayTotalEndPrice);

  let integrationsCost = 0;
  if (integrationsActive) {
    integrationsCost = validatedMsrpTotal * currentIntegrationsRate;
  }
  if (integrationsCostValue) integrationsCostValue.textContent = formatCurrencyDisplay(integrationsCost);

  let discountForErp = 0;
  if (increaseActive && !discountActive) {
    const LYP_with_increase = validatedLastYearPrice * (1 + (validatedIncreasePercentage / 100));
    if (integrationsActive) {
      const denominator = validatedMsrpTotal * (1 + currentIntegrationsRate);
      discountForErp = denominator !== 0 ? (LYP_with_increase / denominator - 1) * 100 : 0;
    } else {
      const denominator = validatedMsrpTotal;
      discountForErp = denominator !== 0 ? (LYP_with_increase / denominator - 1) * 100 : 0;
    }
  }
  if (discountForErpValue) discountForErpValue.textContent = formatPercentageDisplay(discountForErp);

  let totalEndPrice = 0;
  if (increaseActive && !discountActive) {
    totalEndPrice = validatedLastYearPrice * (1 + (validatedIncreasePercentage / 100));
  }
  if (totalEndPriceValue) totalEndPriceValue.textContent = formatCurrencyDisplay(totalEndPrice);

  return { integrationsCost, discountForErp, totalEndPrice };
}

export function setIntegrationSelection(selection, shouldSave = true) {
  const yesBtn = document.getElementById('integrationsYes');
  const noBtn = document.getElementById('integrationsNo');
  if (yesBtn && noBtn) {
    if (selection === 'yes') {
      yesBtn.classList.add('selected');
      noBtn.classList.remove('selected');
    } else {
      yesBtn.classList.remove('selected');
      noBtn.classList.add('selected');
    }
  }
  if (shouldSave) saveAppState();
  calculateTotalAndUpdateDisplay();
}

export function setDiscountIncreaseSelection(selection, shouldSave = true) {
  const discountBtn = document.getElementById('discountBtn');
  const increaseBtn = document.getElementById('increaseBtn');
  const discountFields = document.getElementById('discountFields');
  const increaseFields = document.getElementById('increaseFields');
  const integrationsCostDisplay = document.getElementById('integrationsCostDisplay');
  const discountForErpDisplay = document.getElementById('discountForErpDisplay');
  const totalEndPriceDisplay = document.getElementById('totalEndPriceDisplay');

  if (discountBtn && increaseBtn && discountFields && increaseFields && integrationsCostDisplay && discountForErpDisplay && totalEndPriceDisplay) {
    discountBtn.classList.remove('selected');
    increaseBtn.classList.remove('selected');
    discountFields.classList.add('hidden');
    increaseFields.classList.add('hidden');
    integrationsCostDisplay.classList.add('hidden');
    discountForErpDisplay.classList.add('hidden');
    totalEndPriceDisplay.classList.add('hidden');
    if (selection === 'discount') {
      discountBtn.classList.add('selected');
      discountFields.classList.remove('hidden');
    } else if (selection === 'increase') {
      increaseBtn.classList.add('selected');
      increaseFields.classList.remove('hidden');
    }
  }
  if (shouldSave) saveAppState();
  calculateTotalAndUpdateDisplay();
}

export function clearAllInputs(showConfirmation = true) {
  if (showConfirmation && !confirm('Are you sure you want to clear all text on this page? This cannot be undone.')) {
    return;
  }
  const companyNameInput = document.getElementById('companyNameInput');
  const erpLinkInput = document.getElementById('erpLinkInput');
  const lastYearPriceInput = document.getElementById('lastYearPrice');
  const msrpTotalInput = document.getElementById('msrpTotal');
  const discountPercentageInput = document.getElementById('discountPercentage');
  const increasePercentageInput = document.getElementById('increasePercentage');
  const notesInput = document.getElementById('notesInput');

  if (companyNameInput) companyNameInput.value = '';
  if (erpLinkInput) erpLinkInput.value = '';
  if (lastYearPriceInput) lastYearPriceInput.value = '';
  if (msrpTotalInput) msrpTotalInput.value = '';
  if (discountPercentageInput) discountPercentageInput.value = '0';
  if (increasePercentageInput) increasePercentageInput.value = '5.00%';
  if (notesInput) notesInput.value = '';
  setIntegrationSelection('no');
  setDiscountIncreaseSelection('none');
}

export function generateTimestamp(forFilename = true) {
  const now = new Date();
  if (forFilename) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }
  return now.toLocaleString();
}

export function completeQuote() {
  const record = {
    id: Date.now(),
    timestamp: generateTimestamp(false),
    filenameTimestamp: generateTimestamp(true),
    inputs: getCalculatorInputsState(),
    outputs: calculateTotalAndUpdateDisplay()
  };
  chrome.storage.local.get(STORAGE_KEY_RECORDS, (result) => {
    const records = result[STORAGE_KEY_RECORDS] || [];
    records.unshift(record);
    chrome.storage.local.set({ [STORAGE_KEY_RECORDS]: records }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving record:', chrome.runtime.lastError.message);
      } else {
        console.log('Record saved successfully:', record);
        clearAllInputs(false);
      }
    });
  });
}

export function renderRecordLog() {
  const recordLogList = document.getElementById('recordLogList');
  if (!recordLogList) return;
  recordLogList.innerHTML = '';
  chrome.storage.local.get(STORAGE_KEY_RECORDS, (result) => {
    const records = result[STORAGE_KEY_RECORDS] || [];
    if (records.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.classList.add('empty-log-message');
      emptyMessage.textContent = 'No records saved yet.';
      recordLogList.appendChild(emptyMessage);
      return;
    }
    records.forEach((record) => {
      const recordItem = document.createElement('div');
      recordItem.classList.add('record-item');
      const recordHeader = document.createElement('div');
      recordHeader.classList.add('record-item-header');
      const timestampSpan = document.createElement('span');
      timestampSpan.classList.add('record-timestamp');
      timestampSpan.textContent = record.timestamp;
      const recordActions = document.createElement('div');
      recordActions.classList.add('record-actions');
      const downloadButton = document.createElement('button');
      downloadButton.classList.add('record-action-button');
      downloadButton.innerHTML = '⬇️';
      downloadButton.title = 'Download as TXT';
      downloadButton.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadRecord(record);
      });
      const copyButton = document.createElement('button');
      copyButton.classList.add('record-action-button');
      copyButton.innerHTML = '📋';
      copyButton.title = 'Copy to Calculator';
      copyButton.addEventListener('click', (e) => {
        e.stopPropagation();
        copyRecordToCalculator(record);
      });
      const deleteButton = document.createElement('button');
      deleteButton.classList.add('record-action-button', 'delete-record-button');
      deleteButton.innerHTML = '🗑️';
      deleteButton.title = 'Delete Record';
      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteRecord(record.id);
      });
      recordActions.appendChild(downloadButton);
      recordActions.appendChild(copyButton);
      recordActions.appendChild(deleteButton);
      recordHeader.appendChild(timestampSpan);
      recordHeader.appendChild(recordActions);
      const detailsPre = document.createElement('pre');
      detailsPre.classList.add('record-item-details');
      detailsPre.textContent = formatRecordDetailsForDisplay(record);
      recordItem.appendChild(recordHeader);
      recordItem.appendChild(detailsPre);
      recordLogList.appendChild(recordItem);
    });
  });
}

export function formatRecordDetailsForDisplay(record) {
  const inputs = record.inputs || {};
  const outputs = record.outputs || {};
  let content = '';
  content += `Company Name: ${inputs.companyName || 'N/A'}\n`;
  if (inputs.erpLink) {
    content += `ERP Link: ${inputs.erpLink}\n`;
  }
  content += `Last Year Price: ${inputs.lastYearPrice || '$0.00'}\n`;
  content += `MSRP Total: ${inputs.msrpTotal || '$0.00'}\n`;
  content += `Integrations Selected: ${inputs.integrationsSelected === 'yes' ? 'yes' : 'no'}\n`;
  content += `Discount/Increase Selected: ${inputs.discountIncreaseSelected || 'none'}\n`;
  if (inputs.discountIncreaseSelected === 'discount') {
    content += `Discount Percentage: ${inputs.discountPercentage || '0.00%'}\n`;
  }
  if (inputs.discountIncreaseSelected === 'increase') {
    content += `Increase Percentage: ${inputs.increasePercentage || '0.00%'}\n`;
  }
  content += '\n--- Calculated Values ---\n';
  const savedIntegrationsActive = inputs.integrationsSelected === 'yes';
  const savedIncreaseActive = inputs.discountIncreaseSelected === 'increase';
  if (savedIntegrationsActive && savedIncreaseActive) {
    content += `Integrations Cost: ${formatCurrencyDisplay(outputs.integrationsCost)}\n`;
  }
  if (savedIncreaseActive && inputs.discountIncreaseSelected !== 'discount') {
    content += `Calculated Discount for ERP: ${formatPercentageDisplay(outputs.discountForErp)}\n`;
  }
  if (savedIncreaseActive && inputs.discountIncreaseSelected !== 'discount') {
    content += `Calculated Total End Price: ${formatCurrencyDisplay(outputs.totalEndPrice)}\n`;
  }
  content += `Notes: ${inputs.notes || 'N/A'}\n`;
  return content.trim();
}

export function downloadRecord(record) {
  const textContent = formatRecordDetailsForDisplay(record);
  const filename = `Luna_Quote_Data_${record.filenameTimestamp}.txt`;
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyRecordToCalculator(record) {
  if (!confirm("This action will copy all this entry's data into the quote calculator and override any existing data. Would you like to proceed?")) {
    return;
  }
  const inputs = record.inputs || {};
  const companyNameInput = document.getElementById('companyNameInput');
  const erpLinkInput = document.getElementById('erpLinkInput');
  const lastYearPriceInput = document.getElementById('lastYearPrice');
  const msrpTotalInput = document.getElementById('msrpTotal');
  const discountPercentageInput = document.getElementById('discountPercentage');
  const increasePercentageInput = document.getElementById('increasePercentage');
  const notesInput = document.getElementById('notesInput');

  if (companyNameInput) companyNameInput.value = inputs.companyName || '';
  if (erpLinkInput) erpLinkInput.value = inputs.erpLink || '';
  if (lastYearPriceInput) lastYearPriceInput.value = inputs.lastYearPrice || '';
  if (msrpTotalInput) msrpTotalInput.value = inputs.msrpTotal || '';
  if (discountPercentageInput) discountPercentageInput.value = inputs.discountPercentage || '0';
  if (increasePercentageInput) increasePercentageInput.value = inputs.increasePercentage || '5.00%';
  if (notesInput) notesInput.value = inputs.notes || '';
  setIntegrationSelection(inputs.integrationsSelected || 'no');
  setDiscountIncreaseSelection(inputs.discountIncreaseSelected || 'none');
  showPage('quoteCalculatorPage');
}

export function deleteRecord(recordIdToDelete) {
  if (!confirm('Are you sure you want to delete this record? This cannot be undone.')) {
    return;
  }
  chrome.storage.local.get(STORAGE_KEY_RECORDS, (result) => {
    let records = result[STORAGE_KEY_RECORDS] || [];
    const initialLength = records.length;
    records = records.filter(record => record.id !== recordIdToDelete);
    if (records.length < initialLength) {
      chrome.storage.local.set({ [STORAGE_KEY_RECORDS]: records }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error deleting record:', chrome.runtime.lastError.message);
        } else {
          console.log('Record deleted successfully. Re-rendering log.');
          renderRecordLog();
        }
      });
    }
  });
}

export function downloadAllRecordsFromLog() {
  chrome.storage.local.get(STORAGE_KEY_RECORDS, (result) => {
    const records = result[STORAGE_KEY_RECORDS] || [];
    if (records.length === 0) {
      alert('There are no records to download.');
      return;
    }
    let combinedContent = `Luna All Records Export\nExport Date: ${generateTimestamp(false)}\n\n`;
    records.forEach((record, index) => {
      combinedContent += `===== RECORD ${index + 1} (${record.timestamp}) =====\n`;
      combinedContent += formatRecordDetailsForDisplay(record);
      combinedContent += `\n===================================\n\n`;
    });
    const filename = `Luna_All_Records_Export_${generateTimestamp(true)}.txt`;
    const blob = new Blob([combinedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('All records downloaded.');
  });
}
