document.addEventListener('DOMContentLoaded', () => {
  // --- Element References ---
  const mainMenuPage = document.getElementById('mainMenuPage');
  const lunaTitle = document.getElementById('lunaTitle');
  const openQuoteCalculatorButton = document.getElementById('openQuoteCalculator');
  const openSettingsButton = document.getElementById('openSettingsButton');
  const openRecordLogButton = document.getElementById('openRecordLogButton');

  const quoteCalculatorPage = document.getElementById('quoteCalculatorPage');
  const backToMenuButton = document.getElementById('backToMenu');
  const companyNameGroup = document.getElementById('companyNameGroup');
  const companyNameInput = document.getElementById('companyNameInput');
  const erpLinkGroup = document.getElementById('erpLinkGroup');
  const erpLinkInput = document.getElementById('erpLinkInput');
  // const integrationsRateGroup = document.getElementById('integrationsRateGroup'); // REMOVED
  // const integrationsRateInput = document.getElementById('integrationsRateInput'); // REMOVED
  const lastYearPriceInput = document.getElementById('lastYearPrice');
  const msrpTotalInput = document.getElementById('msrpTotal');
  const integrationsYesButton = document.getElementById('integrationsYes');
  const integrationsNoButton = document.getElementById('integrationsNo');

  const discountBtn = document.getElementById('discountBtn');
  const increaseBtn = document.getElementById('increaseBtn');
  const discountFields = document.getElementById('discountFields');
  const increaseFields = document.getElementById('increaseFields');
  const discountPercentageInput = document.getElementById('discountPercentage');
  const increasePercentageInput = document.getElementById('increasePercentage');

  const integrationsCostDisplay = document.getElementById('integrationsCostDisplay');
  const integrationsCostValue = document.getElementById('integrationsCostValue');
  const discountForErpDisplay = document.getElementById('discountForErpDisplay');
  const discountForErpValue = document.getElementById('discountForErpValue');
  const totalEndPriceDisplay = document.getElementById('totalEndPriceDisplay');
  const totalEndPriceValue = document.getElementById('totalEndPriceValue');

  const settingsPage = document.getElementById('settingsPage');
  const backToMenuFromSettingsButton = document.getElementById('backToMenuFromSettings');
  const zoomSlider = document.getElementById('zoomSlider');
  const zoomValueDisplay = document.getElementById('zoomValueDisplay');
  const resetAllButton = document.getElementById('resetAllButton');

  const lunaTitleVisibleButton = document.getElementById('lunaTitleVisible');
  const lunaTitleHiddenButton = document.getElementById('lunaTitleHidden');
  const advancedModeEnabledBtn = document.getElementById('advancedModeEnabledBtn');
  const advancedModeDisabledBtn = document.getElementById('advancedModeDisabledBtn');
  const themeButtons = document.querySelectorAll('.theme-button');

  const recordLogPage = document.getElementById('recordLogPage');
  const backToMenuFromRecordLogButton = document.getElementById('backToMenuFromRecordLog');
  const recordLogList = document.getElementById('recordLogList');
  const downloadAllRecordsBtn = document.getElementById('downloadAllRecordsBtn');

  const calculatorFooter = document.getElementById('calculatorFooter');
  const recordLogFooter = document.getElementById('recordLogFooter');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const completeBtn = document.getElementById('completeBtn');

  // --- Storage Keys ---
  const STORAGE_KEY_INPUTS = 'lunaQuoteCalculatorInputs';
  const STORAGE_KEY_PAGE = 'lunaLastPage';
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel';
  const STORAGE_KEY_LUNA_TITLE_VISIBLE = 'lunaTitleVisible';
  const STORAGE_KEY_THEME = 'lunaTheme';
  const STORAGE_KEY_ADVANCED_MODE = 'lunaAdvancedModeEnabled';
  const STORAGE_KEY_RECORDS = 'lunaQuoteRecords';

  // --- Global State Variables ---
  let isAdvancedModeEnabled = false;

  // --- Default Values for Reset All ---
  const defaultZoomLevel = 1.0;
  const defaultLunaTitleVisible = true;
  const defaultTheme = 'purple';
  const defaultAdvancedMode = false;
  // const defaultIntegrationsRate = 20.00; // REMOVED
  const defaultQuoteInputs = {
      companyName: '',
      erpLink: '',
      // integrationsRate: defaultIntegrationsRate, // REMOVED
      lastYearPrice: '',
      msrpTotal: '',
      integrationsSelected: 'no',
      discountIncreaseSelected: 'none',
      discountPercentage: '0',
      increasePercentage: '5.00%'
  };

  // --- Utility Functions ---

  // Formats a number to currency string ($123,456.78)
  function formatCurrencyDisplay(value) {
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

  // Parses a formatted currency string back to a number
  function parseCurrencyInput(formattedValue) {
    if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
      return null;
    }
    const cleanValue = String(formattedValue).replace(/[$,]/g, '');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? null : num;
  }

  // Formats a percentage number to string (5.52%)
  function formatPercentageDisplay(value) {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    if (isNaN(num)) {
      return '';
    }
    return `${num.toFixed(2)}%`;
  }

  // Parses a percentage string back to a number
  function parsePercentageInput(formattedValue) {
    if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
      return null;
    }
    const cleanValue = String(formattedValue).replace(/%/g, '');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? null : num;
  }

  // --- Zoom/Magnification Functions ---
  function applyZoom(zoomLevel) {
    document.body.style.zoom = zoomLevel;
  }

  function setZoomSelection(selectedZoomLevel) {
    if (zoomSlider) {
      zoomSlider.value = selectedZoomLevel; // Set slider position
    }
    if (zoomValueDisplay) {
      zoomValueDisplay.textContent = `${Math.round(selectedZoomLevel * 100)}%`; // Update display text
    }
    applyZoom(selectedZoomLevel);

    setTimeout(() => {
        chrome.runtime.sendMessage({ type: 'saveZoomLevel', zoomLevel: selectedZoomLevel }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error sending zoom level to background (after timeout):', chrome.runtime.lastError.message);
            }
        });
    }, 50);
  }

  // --- Luna Title Visibility Functions ---
  function setLunaTitleVisibility(isVisible, shouldSave = true) {
    if (lunaTitle) {
      lunaTitle.classList.toggle('hidden-title', !isVisible);
    }
    if (lunaTitleVisibleButton && lunaTitleHiddenButton) {
      if (isVisible) {
        lunaTitleVisibleButton.classList.add('selected');
        lunaTitleHiddenButton.classList.remove('selected');
      } else {
        lunaTitleVisibleButton.classList.remove('selected');
        lunaTitleHiddenButton.classList.add('selected');
      }
    }
    if (shouldSave) {
      chrome.storage.local.set({ [STORAGE_KEY_LUNA_TITLE_VISIBLE]: isVisible }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving Luna title visibility:', chrome.runtime.lastError.message);
        }
      });
    }
  }

  // --- Advanced Mode Toggle Functions ---
  function setAdvancedMode(isEnabled, shouldSave = true) {
    isAdvancedModeEnabled = isEnabled; // Update global state

    // ERP Link visibility based on advanced mode
    if (erpLinkGroup) erpLinkGroup.classList.toggle('hidden', !isEnabled);

    // Apply/remove advanced-mode-active-box class to only advanced-mode-item elements that are still present
    const advancedModeItems = document.querySelectorAll('.advanced-mode-item');
    advancedModeItems.forEach(item => {
        item.classList.toggle('advanced-mode-active-box', isEnabled);
    });

    if (advancedModeEnabledBtn && advancedModeDisabledBtn) {
      if (isEnabled) {
        advancedModeEnabledBtn.classList.add('selected');
        advancedModeDisabledBtn.classList.remove('selected');
      } else {
        advancedModeEnabledBtn.classList.remove('selected');
        advancedModeDisabledBtn.classList.add('selected');
      }
    }

    if (shouldSave) {
      chrome.storage.local.set({ [STORAGE_KEY_ADVANCED_MODE]: isEnabled }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving Advanced Mode state:', chrome.runtime.lastError.message);
        }
      });
    }
    calculateTotalAndUpdateDisplay(); // Recalculate if Advanced Mode changes
  }

  // --- Theme Management Functions ---
  function setTheme(themeName, shouldSave = true) {
    const body = document.body;
    // Remove all existing theme classes
    ['purple', 'blue', 'green', 'pink', 'orange', 'red', 'yellow', 'white'].forEach(theme => {
      body.classList.remove(`theme-${theme}`);
    });
    // Add the selected theme class
    body.classList.add(`theme-${themeName}`);

    // Update selected state of theme buttons
    themeButtons.forEach(button => {
      if (button.dataset.theme === themeName) {
        button.classList.add('selected');
      } else {
        button.classList.remove('selected');
      }
    });

    if (shouldSave) {
      chrome.storage.local.set({ [STORAGE_KEY_THEME]: themeName }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving theme:', chrome.runtime.lastError.message);
        }
      });
    }
  }

  // --- Page / View Management Functions ---
  function getCurrentPageId() {
    if (mainMenuPage && !mainMenuPage.classList.contains('hidden')) return 'mainMenuPage';
    if (quoteCalculatorPage && !quoteCalculatorPage.classList.contains('hidden')) return 'quoteCalculatorPage';
    if (settingsPage && !settingsPage.classList.contains('hidden')) return 'settingsPage';
    if (recordLogPage && !recordLogPage.classList.contains('hidden')) return 'recordLogPage';
    return 'mainMenuPage'; // Default to main menu if none is visible
  }

  function showPage(pageId) {
    const pages = [mainMenuPage, quoteCalculatorPage, settingsPage, recordLogPage];
    pages.forEach(page => {
      if (page) page.classList.add('hidden');
    });

    const footerToHide = [calculatorFooter, recordLogFooter];
    footerToHide.forEach(footer => {
      if (footer) footer.classList.add('hidden');
    });

    if (pageId === 'mainMenuPage' && mainMenuPage) {
      mainMenuPage.classList.remove('hidden');
    } else if (pageId === 'quoteCalculatorPage' && quoteCalculatorPage) {
      quoteCalculatorPage.classList.remove('hidden');
      if (calculatorFooter) calculatorFooter.classList.remove('hidden');
    } else if (pageId === 'settingsPage' && settingsPage) {
      settingsPage.classList.remove('hidden');
    } else if (pageId === 'recordLogPage' && recordLogPage) {
      recordLogPage.classList.remove('hidden');
      loadQuoteRecords(); // Load records when navigating to the log page
      if (recordLogFooter) recordLogFooter.classList.remove('hidden');
    }
    saveAppState(); // Save the current page state
  }

  // --- Calculator Logic Functions ---

  function calculateTotalAndUpdateDisplay() {
    const validatedLastYearPrice = parseCurrencyInput(lastYearPriceInput ? lastYearPriceInput.value : '') || 0;
    const validatedMsrpTotal = parseCurrencyInput(msrpTotalInput ? msrpTotalInput.value : '') || 0;

    // Integrations rate is now fixed at 20% (0.20)
    const integrationsRate = 0.20;

    // Determine if integrations is active
    const integrationsActive = integrationsYesButton && integrationsYesButton.classList.contains('selected');

    // Determine if discount or increase is active
    const discountActive = discountBtn && discountBtn.classList.contains('selected');
    const increaseActive = increaseBtn && increaseBtn.classList.contains('selected');

    const discountPercentage = parsePercentageInput(discountPercentageInput ? discountPercentageInput.value : '0') / 100 || 0;
    const increasePercentage = parsePercentageInput(increasePercentageInput ? increasePercentageInput.value : '0') / 100 || 0;

    let integrationsCost = 0;
    let discountForErp = 0;
    let totalEndPrice = validatedMsrpTotal;

    // --- Visibility Flags ---
    let displayIntegrationsCost = false;
    let displayDiscountForErp = false;
    let displayTotalEndPrice = false;

    // 2a. Integrations Cost (uses fixed integrationsRate)
    if (integrationsActive) {
      integrationsCost = validatedMsrpTotal * integrationsRate;
      totalEndPrice += integrationsCost;
      displayIntegrationsCost = true;
    }

    // 2b. Discount or Increase Calculation
    if (discountActive) {
      discountForErp = validatedMsrpTotal * discountPercentage;
      totalEndPrice -= discountForErp;
      displayDiscountForErp = true;
    } else if (increaseActive) {
      discountForErp = validatedMsrpTotal * increasePercentage; // This is actually an *increase* amount
      totalEndPrice += discountForErp; // Add for increase
      displayDiscountForErp = true; // Still use this display for the increase amount
    }

    // Always display total end price if any calculation is performed or if advanced mode is on
    if (integrationsActive || discountActive || increaseActive || isAdvancedModeEnabled) {
      displayTotalEndPrice = true;
    }


    // Apply visibility based on calculation status or Advanced Mode (only ERP Link is affected by Advanced Mode)
    if(integrationsCostDisplay) {
        integrationsCostDisplay.classList.toggle('hidden', !displayIntegrationsCost);
    }

    if(discountForErpDisplay) {
        discountForErpDisplay.classList.toggle('hidden', !displayDiscountForErp);
    }

    if(totalEndPriceDisplay) {
        totalEndPriceDisplay.classList.toggle('hidden', !displayTotalEndPrice);
    }

    // --- Update Display Values ---
    if(integrationsCostValue) integrationsCostValue.textContent = formatCurrencyDisplay(integrationsCost);
    if(discountForErpValue) discountForErpValue.textContent = formatCurrencyDisplay(discountForErp); // Use discountForErpValue for increase too
    if(totalEndPriceValue) totalEndPriceValue.textContent = formatCurrencyDisplay(totalEndPrice);

    saveAppState(); // Save inputs after calculation
  }

  function getCalculatorInputsState() {
    return {
      companyName: companyNameInput ? companyNameInput.value : '',
      erpLink: erpLinkInput ? erpLinkInput.value : '',
      // integrationsRate: defaultIntegrationsRate, // REMOVED
      lastYearPrice: lastYearPriceInput ? lastYearPriceInput.value : '',
      msrpTotal: msrpTotalInput ? msrpTotalInput.value : '',
      integrationsSelected: integrationsYesButton && integrationsYesButton.classList.contains('selected') ? 'yes' : 'no',
      discountIncreaseSelected: (discountBtn && discountBtn.classList.contains('selected')) ? 'discount' :
                               (increaseBtn && increaseBtn.classList.contains('selected')) ? 'increase' : 'none',
      discountPercentage: discountPercentageInput ? discountPercentageInput.value : '0',
      increasePercentage: increasePercentageInput ? increasePercentageInput.value : '5.00%'
    };
  }

  function setIntegrationSelection(selection, shouldSave = true) {
    if (integrationsYesButton) integrationsYesButton.classList.remove('selected');
    if (integrationsNoButton) integrationsNoButton.classList.remove('selected');

    if (selection === 'yes') {
      if (integrationsYesButton) integrationsYesButton.classList.add('selected');
    } else if (selection === 'no') {
      if (integrationsNoButton) integrationsNoButton.classList.add('selected');
    }
    if (shouldSave) saveAppState();
    calculateTotalAndUpdateDisplay();
  }

  function setDiscountIncreaseSelection(selection, shouldSave = true) {
    if (discountBtn) discountBtn.classList.remove('selected');
    if (increaseBtn) increaseBtn.classList.remove('selected');
    const noneBtn = document.getElementById('noneBtn');
    if (noneBtn) noneBtn.classList.remove('selected');

    if (discountFields) discountFields.classList.add('hidden');
    if (increaseFields) increaseFields.classList.add('hidden');

    if (selection === 'discount') {
      if (discountBtn) discountBtn.classList.add('selected');
      if (discountFields) discountFields.classList.remove('hidden');
    } else if (selection === 'increase') {
      if (increaseBtn) increaseBtn.classList.add('selected');
      if (increaseFields) increaseFields.classList.remove('hidden');
    } else if (selection === 'none') {
        if (noneBtn) noneBtn.classList.add('selected');
    }

    if (shouldSave) saveAppState();
    calculateTotalAndUpdateDisplay();
  }

  // --- Clear All Function ---
  // Added optional parameter `skipConfirmation`
  function clearAllInputs(showConfirmation = true) {
    if (showConfirmation && !confirm("Are you sure you want to clear all text on this page? This cannot be undone.")) {
      return; // Stop if user cancels
    }

    // Reset fields to default empty/initial values
    if (companyNameInput) companyNameInput.value = '';
    if (erpLinkInput) erpLinkInput.value = '';
    // if (integrationsRateInput) integrationsRateInput.value = String(defaultIntegrationsRate); // REMOVED
    if (lastYearPriceInput) lastYearPriceInput.value = '';
    if (msrpTotalInput) msrpTotalInput.value = '';
    if (discountPercentageInput) discountPercentageInput.value = '0';
    if (increasePercentageInput) increasePercentageInput.value = '5.00%';
    setIntegrationSelection('no', false); // false to avoid saving state multiple times
    setDiscountIncreaseSelection('none', false); // false to avoid saving state multiple times
    if (document.getElementById('notesInput')) document.getElementById('notesInput').value = '';

    // Recalculate and save after clearing
    calculateTotalAndUpdateDisplay();
    saveAppState();
  }

  // --- Complete Quote Function ---
  function completeQuote() {
    const currentInputs = getCalculatorInputsState();
    const timestamp = new Date().toLocaleString(); // Current date and time

    // Get current calculated values from display elements
    const integrationsCost = integrationsCostValue ? integrationsCostValue.textContent : '$0.00';
    const discountForErp = discountForErpValue ? discountForErpValue.textContent : '$0.00';
    const totalEndPrice = totalEndPriceValue ? totalEndPriceValue.textContent : '$0.00';
    const notes = document.getElementById('notesInput') ? document.getElementById('notesInput').value : '';

    const newRecord = {
      timestamp: timestamp,
      inputs: currentInputs,
      calculated: {
        integrationsCost: integrationsCost,
        discountForErp: discountForErp,
        totalEndPrice: totalEndPrice
      },
      notes: notes
    };

    chrome.storage.local.get(STORAGE_KEY_RECORDS, (result) => {
      const records = result[STORAGE_KEY_RECORDS] || [];
      records.push(newRecord);
      chrome.storage.local.set({ [STORAGE_KEY_RECORDS]: records }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving quote record:', chrome.runtime.lastError.message);
          alert('Failed to save quote record.');
        } else {
          alert('Quote saved successfully!');
          clearAllInputs(false); // Clear inputs after saving, no confirmation needed
          loadQuoteRecords(); // Refresh the record log
        }
      });
    });
  }

  // --- Record Log Functions ---
  function loadQuoteRecords() {
    if (!recordLogList) return;

    chrome.storage.local.get(STORAGE_KEY_RECORDS, (result) => {
      const records = result[STORAGE_KEY_RECORDS] || [];
      recordLogList.innerHTML = ''; // Clear existing records

      if (records.length === 0) {
        recordLogList.innerHTML = '<p class="empty-log-message">No records saved yet.</p>';
        return;
      }

      records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first

      records.forEach((record, index) => {
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
        downloadButton.innerHTML = '⬇️'; // Download emoji
        downloadButton.title = 'Download as TXT';
        downloadButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent parent click handler if any
          downloadRecord(record);
        });

        const copyButton = document.createElement('button');
        copyButton.classList.add('record-action-button');
        copyButton.innerHTML = '📋'; // Copy emoji
        copyButton.title = 'Copy to Calculator';
        copyButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent parent click handler if any
          copyRecordToCalculator(record);
        });

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('record-action-button', 'delete-record-button');
        deleteButton.innerHTML = '🗑️'; // Delete emoji
        deleteButton.title = 'Delete Record';
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent parent click handler if any
          if (confirm('Are you sure you want to delete this record?')) {
            deleteRecord(index); // Delete by index
          }
        });

        recordActions.appendChild(downloadButton);
        recordActions.appendChild(copyButton);
        recordActions.appendChild(deleteButton);
        recordHeader.appendChild(timestampSpan);
        recordHeader.appendChild(recordActions);
        recordItem.appendChild(recordHeader);

        const recordDetails = document.createElement('div');
        recordDetails.classList.add('record-details');
        recordDetails.innerHTML = `
          <p><strong>Company Name:</strong> ${record.inputs.companyName || 'N/A'}</p>
          <p><strong>ERP Link:</strong> ${record.inputs.erpLink || 'N/A'}</p>
          <p><strong>Last Year Price:</strong> ${formatCurrencyDisplay(record.inputs.lastYearPrice) || 'N/A'}</p>
          <p><strong>MSRP Total:</strong> ${formatCurrencyDisplay(record.inputs.msrpTotal) || 'N/A'}</p>
          <p><strong>Integrations Selected:</strong> ${record.inputs.integrationsSelected || 'N/A'}</p>
          <p><strong>Discount/Increase Selected:</strong> ${record.inputs.discountIncreaseSelected || 'N/A'}</p>
          <p><strong>Discount Percentage:</strong> ${formatPercentageDisplay(record.inputs.discountPercentage) || 'N/A'}</p>
          <p><strong>Increase Percentage:</strong> ${formatPercentageDisplay(record.inputs.increasePercentage) || 'N/A'}</p>
          <p><strong>Calculated Integrations Cost:</strong> ${record.calculated.integrationsCost || 'N/A'}</p>
          <p><strong>Calculated Discount for ERP:</strong> ${record.calculated.discountForErp || 'N/A'}</p>
          <p><strong>Calculated Total End Price:</strong> ${record.calculated.totalEndPrice || 'N/A'}</p>
          <p><strong>Notes:</strong> ${record.notes || 'N/A'}</p>
        `;
        recordItem.appendChild(recordDetails);
        recordLogList.appendChild(recordItem);
      });
    });
  }

  function deleteRecord(indexToDelete) {
    chrome.storage.local.get(STORAGE_KEY_RECORDS, (result) => {
      let records = result[STORAGE_KEY_RECORDS] || [];
      if (indexToDelete >= 0 && indexToDelete < records.length) {
        records.splice(indexToDelete, 1); // Remove the record
        chrome.storage.local.set({ [STORAGE_KEY_RECORDS]: records }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error deleting record:', chrome.runtime.lastError.message);
            alert('Failed to delete record.');
          } else {
            loadQuoteRecords(); // Reload the list after deletion
          }
        });
      }
    });
  }

  // --- Download Specific Record as TXT ---
  function downloadRecord(record) {
    const filename = `Quote_${record.inputs.companyName || 'Unknown'}_${record.timestamp.replace(/[:/\s,]/g, '-')}.txt`;
    const content = `
Quote Record - ${record.timestamp}

Company Name: ${record.inputs.companyName || 'N/A'}
ERP Link: ${record.inputs.erpLink || 'N/A'}
Last Year Price: ${formatCurrencyDisplay(record.inputs.lastYearPrice) || 'N/A'}
MSRP Total: ${formatCurrencyDisplay(record.inputs.msrpTotal) || 'N/A'}
Integrations Selected: ${record.inputs.integrationsSelected || 'N/A'}
Discount/Increase Selected: ${record.inputs.discountIncreaseSelected || 'N/A'}
Discount Percentage: ${formatPercentageDisplay(record.inputs.discountPercentage) || 'N/A'}
Increase Percentage: ${formatPercentageDisplay(record.inputs.increasePercentage) || 'N/A'}

--- Calculated Values ---
Integrations Cost: ${record.calculated.integrationsCost || 'N/A'}
Discount for ERP: ${record.calculated.discountForErp || 'N/A'}
Total End Price: ${record.calculated.totalEndPrice || 'N/A'}

Notes:
${record.notes || 'N/A'}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // --- Copy Specific Record to Calculator ---
  function copyRecordToCalculator(record) {
    if (!confirm("This action will copy all this entry's data into the quote calculator and override any existing data. Would you like to proceed?")) {
      return;
    }

    // Populate input fields
    if (companyNameInput) companyNameInput.value = record.inputs.companyName || '';
    if (erpLinkInput) erpLinkInput.value = record.inputs.erpLink || '';
    // if (integrationsRateInput) integrationsRateInput.value = String(record.inputs.integrationsRate || defaultIntegrationsRate); // REMOVED
    if (lastYearPriceInput) lastYearPriceInput.value = record.inputs.lastYearPrice || '';
    if (msrpTotalInput) msrpTotalInput.value = record.inputs.msrpTotal || '';
    if (discountPercentageInput) discountPercentageInput.value = record.inputs.discountPercentage || '0';
    if (increasePercentageInput) increasePercentageInput.value = record.inputs.increasePercentage || '5.00%';
    if (document.getElementById('notesInput')) document.getElementById('notesInput').value = record.notes || '';

    // Set toggle button selections
    setIntegrationSelection(record.inputs.integrationsSelected, false); // Pass false to avoid immediate save
    setDiscountIncreaseSelection(record.inputs.discountIncreaseSelected, false); // Pass false to avoid immediate save

    // Show calculator page and update display
    showPage('quoteCalculatorPage');
    calculateTotalAndUpdateDisplay(); // Recalculate after setting all values
    saveAppState(); // Save the state after copying
    alert('Record copied to calculator!');
  }

  // --- Download All Records as TXT ---
  function downloadAllRecords() {
    chrome.storage.local.get(STORAGE_KEY_RECORDS, (result) => {
      const records = result[STORAGE_KEY_RECORDS] || [];
      if (records.length === 0) {
        alert('No records to download.');
        return;
      }

      const allRecordsContent = records.map((record, index) => {
        return `
--- Record ${index + 1} ---
Timestamp: ${record.timestamp}
Company Name: ${record.inputs.companyName || 'N/A'}
ERP Link: ${record.inputs.erpLink || 'N/A'}
Last Year Price: ${formatCurrencyDisplay(record.inputs.lastYearPrice) || 'N/A'}
MSRP Total: ${formatCurrencyDisplay(record.inputs.msrpTotal) || 'N/A'}
Integrations Selected: ${record.inputs.integrationsSelected || 'N/A'}
Discount/Increase Selected: ${record.inputs.discountIncreaseSelected || 'N/A'}
Discount Percentage: ${formatPercentageDisplay(record.inputs.discountPercentage) || 'N/A'}
Increase Percentage: ${formatPercentageDisplay(record.inputs.increasePercentage) || 'N/A'}
Calculated Integrations Cost: ${record.calculated.integrationsCost || 'N/A'}
Calculated Discount for ERP: ${record.calculated.discountForErp || 'N/A'}
Calculated Total End Price: ${record.calculated.totalEndPrice || 'N/A'}
Notes: ${record.notes || 'N/A'}
        `.trim();
      }).join('\n\n' + '='.repeat(50) + '\n\n'); // Separator between records

      const filename = `Luna_All_Records_${new Date().toISOString().slice(0, 10)}.txt`;
      const blob = new Blob([allRecordsContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert(`All ${records.length} records downloaded successfully!`);
    });
  }


  // --- State Saving & Loading ---

  // Function to save current app state (calculator inputs and current page) to background script
  function saveAppState() {
    const appState = {
      calculatorInputs: getCalculatorInputsState(),
      currentPage: getCurrentPageId()
    };
    chrome.runtime.sendMessage({ type: 'saveAppState', payload: appState }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending app state to background:', chrome.runtime.lastError.message);
      }
    });
  }

  // Function to load all state (inputs, page, zoom, Luna title, theme, advanced mode) from storage
  // The `useDefaults` parameter is added to allow forced default loading for Reset All
  function loadAppState(useDefaults = false) {
    chrome.storage.local.get(
      [STORAGE_KEY_INPUTS, STORAGE_KEY_PAGE, STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_THEME, STORAGE_KEY_ADVANCED_MODE, STORAGE_KEY_RECORDS],
      (result) => {
        const savedInputs = useDefaults ? defaultQuoteInputs : (result[STORAGE_KEY_INPUTS] || defaultQuoteInputs);

        // Restore calculator inputs
        if(companyNameInput) companyNameInput.value = savedInputs.companyName || '';
        if(erpLinkInput) erpLinkInput.value = savedInputs.erpLink || '';
        // if(integrationsRateInput) integrationsRateInput.value = String(savedInputs.integrationsRate || defaultIntegrationsRate); // REMOVED
        if(lastYearPriceInput) lastYearPriceInput.value = savedInputs.lastYearPrice || '';
        if(msrpTotalInput) msrpTotalInput.value = savedInputs.msrpTotal || '';
        if(discountPercentageInput) discountPercentageInput.value = savedInputs.discountPercentage || '0';
        if(increasePercentageInput) increasePercentageInput.value = savedInputs.increasePercentage || '5.00%';

        // Restore selections (pass false for shouldSave to prevent redundant saves during load)
        setIntegrationSelection(savedInputs.integrationsSelected, false);
        setDiscountIncreaseSelection(savedInputs.discountIncreaseSelected, false);

        // Restore page
        const savedPage = useDefaults ? 'mainMenuPage' : (result[STORAGE_KEY_PAGE] || 'mainMenuPage');
        showPage(savedPage);

        // Restore zoom level
        const savedZoomLevel = useDefaults ? defaultZoomLevel : (result[STORAGE_KEY_ZOOM] || defaultZoomLevel);
        setZoomSelection(savedZoomLevel);

        // Restore Luna Title Visibility
        const savedLunaTitleVisible = useDefaults ? defaultLunaTitleVisible : (result[STORAGE_KEY_LUNA_TITLE_VISIBLE] !== undefined ? result[STORAGE_KEY_LUNA_TITLE_VISIBLE] : defaultLunaTitleVisible);
        setLunaTitleVisibility(savedLunaTitleVisible, false);

        // Restore Theme
        const savedTheme = useDefaults ? defaultTheme : (result[STORAGE_KEY_THEME] || defaultTheme);
        setTheme(savedTheme, false);

        // Restore Advanced Mode
        const savedAdvancedMode = useDefaults ? defaultAdvancedMode : (result[STORAGE_KEY_ADVANCED_MODE] !== undefined ? result[STORAGE_KEY_ADVANCED_MODE] : defaultAdvancedMode);
        setAdvancedMode(savedAdvancedMode, false);

        // Calculate and update display after all inputs are restored
        calculateTotalAndUpdateDisplay();
      }
    );
  }

  // --- Reset All Function ---
  function resetAll() {
    if (!confirm("Are you sure you want to reset all settings and clear all saved data? This cannot be undone.")) {
      return;
    }
    // List all storage keys that contain user data/settings
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
        // Force load defaults for all UI elements
        loadAppState(true);
        // Ensure we are on the main menu after reset
        showPage('mainMenuPage');
      }
    });
  }


  // --- Event Listeners ---

  // Page navigation
  if (openQuoteCalculatorButton) {
    openQuoteCalculatorButton.addEventListener('click', () => showPage('quoteCalculatorPage'));
  }
  if (backToMenuButton) {
    backToMenuButton.addEventListener('click', () => showPage('mainMenuPage'));
  }
  if (openSettingsButton) {
    openSettingsButton.addEventListener('click', () => showPage('settingsPage'));
  }
  if (backToMenuFromSettingsButton) {
    backToMenuFromSettingsButton.addEventListener('click', () => showPage('mainMenuPage'));
  }
  if (openRecordLogButton) {
    openRecordLogButton.addEventListener('click', () => showPage('recordLogPage'));
  }
  if (backToMenuFromRecordLogButton) {
    backToMenuFromRecordLogButton.addEventListener('click', () => showPage('mainMenuPage'));
  }


  // Input change listeners for calculator
  const calculatorInputs = [
    companyNameInput, erpLinkInput, lastYearPriceInput, // integrationsRateInput REMOVED
    msrpTotalInput, discountPercentageInput, increasePercentageInput,
    document.getElementById('notesInput') // Add notes input
  ];

  calculatorInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', calculateTotalAndUpdateDisplay);
    }
  });

  // Specific listeners for radio-like toggle buttons
  if (integrationsYesButton) {
    integrationsYesButton.addEventListener('click', () => setIntegrationSelection('yes'));
  }
  if (integrationsNoButton) {
    integrationsNoButton.addEventListener('click', () => setIntegrationSelection('no'));
  }

  if (discountBtn) {
    discountBtn.addEventListener('click', () => setDiscountIncreaseSelection('discount'));
  }
  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => setDiscountIncreaseSelection('increase'));
  }
  const noneBtn = document.getElementById('noneBtn');
  if (noneBtn) {
      noneBtn.addEventListener('click', () => setDiscountIncreaseSelection('none'));
  }

  // Zoom slider listener
  if (zoomSlider) {
    zoomSlider.addEventListener('input', (event) => {
      setZoomSelection(parseFloat(event.target.value));
    });
  }

  // Luna Title visibility button clicks
  if (lunaTitleVisibleButton) {
    lunaTitleVisibleButton.addEventListener('click', () => setLunaTitleVisibility(true));
  }
  if (lunaTitleHiddenButton) {
    lunaTitleHiddenButton.addEventListener('click', () => setLunaTitleVisibility(false));
  }

  // Advanced Mode button clicks
  if (advancedModeEnabledBtn) {
    advancedModeEnabledBtn.addEventListener('click', () => setAdvancedMode(true));
  }
  if (advancedModeDisabledBtn) {
    advancedModeDisabledBtn.addEventListener('click', () => setAdvancedMode(false));
  }

  // Theme selector button clicks
  if (themeButtons && themeButtons.length > 0) {
    themeButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const selectedTheme = event.target.dataset.theme;
        if (selectedTheme) {
          setTheme(selectedTheme);
        }
      });
    });
  }

  // Clear All button click
  if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => clearAllInputs(true)); // Pass true to show confirmation
  }

  // Complete button click
  if (completeBtn) {
      completeBtn.addEventListener('click', completeQuote); // No confirmation needed here
  }

  // Reset All button click
  if (resetAllButton) {
      resetAllButton.addEventListener('click', resetAll);
  }

  // Download All Records button click
  if (downloadAllRecordsBtn) {
      downloadAllRecordsBtn.addEventListener('click', downloadAllRecords);
  }

  // Initial load of app state when the DOM is fully loaded
  loadAppState();
});