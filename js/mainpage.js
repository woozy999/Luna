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
  const integrationsRateGroup = document.getElementById('integrationsRateGroup'); // NEW
  const integrationsRateInput = document.getElementById('integrationsRateInput'); // NEW
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
  const defaultIntegrationsRate = 20.00; // NEW default for integrations rate
  const defaultQuoteInputs = {
      companyName: '',
      erpLink: '',
      integrationsRate: defaultIntegrationsRate, // NEW default for integrations rate
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
    // companyNameGroup is always visible now.
    if (erpLinkGroup) erpLinkGroup.classList.toggle('hidden', !isEnabled);
    if (integrationsRateGroup) integrationsRateGroup.classList.toggle('hidden', !isEnabled); // NEW

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

  // --- Theme Selection Functions ---
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
      return 'mainMenuPage'; // Default fallback
  }

  function showPage(pageId) {
    // Only attempt to hide/show if the element actually exists
    if (mainMenuPage) mainMenuPage.classList.add('hidden');
    if (quoteCalculatorPage) quoteCalculatorPage.classList.add('hidden');
    if (settingsPage) settingsPage.classList.add('hidden');
    if (recordLogPage) recordLogPage.classList.add('hidden');

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    } else {
        console.error(`Attempted to show non-existent page: ${pageId}`);
        if (mainMenuPage) mainMenuPage.classList.remove('hidden'); // Fallback
        return;
    }

    // Manage footers visibility based on current page
    if (calculatorFooter) {
        calculatorFooter.classList.toggle('hidden', pageId !== 'quoteCalculatorPage');
    }
    if (recordLogFooter) {
        recordLogFooter.classList.toggle('hidden', pageId !== 'recordLogPage');
    }

    // Specific actions when showing a page
    if (pageId === 'recordLogPage') {
        renderRecordLog(); // Render log when going to record log page
    }

    // Trigger save after page change
    saveAppState();
  }

  // --- Calculation Logic & Display Updates ---
  function calculateTotalAndUpdateDisplay() {
    // Read input values (parsed from formatted strings where applicable)
    const lastYearPrice = parseCurrencyInput(lastYearPriceInput ? lastYearPriceInput.value : '') || 0;
    const msrpTotal = parseCurrencyInput(msrpTotalInput ? msrpTotalInput.value : '') || 0;
    const integrationsActive = integrationsYesButton ? integrationsYesButton.classList.contains('selected') : false;
    const discountActive = discountBtn ? discountBtn.classList.contains('selected') : false;
    const increaseActive = increaseBtn ? increaseBtn.classList.contains('selected') : false;
    const increasePercentage = parsePercentageInput(increasePercentageInput ? increasePercentageInput.value : '') || 0;

    // Determine integrations rate based on Advanced Mode
    let currentIntegrationsRate = defaultIntegrationsRate / 100; // Default to 0.20
    if (isAdvancedModeEnabled && integrationsRateInput) {
        const parsedRate = parsePercentageInput(integrationsRateInput.value);
        if (parsedRate !== null) {
            currentIntegrationsRate = parsedRate / 100;
        }
    }


    // Basic validation/clamping for internal calculation use
    const validatedLastYearPrice = Math.max(0, lastYearPrice);
    const validatedMsrpTotal = Math.max(0, msrpTotal);
    const validatedIncreasePercentage = Math.min(1000, Math.max(0, increasePercentage));

    // --- Conditional Display Logic ---
    let displayIntegrationsCost = false;
    let displayDiscountForErp = false;
    let displayTotalEndPrice = false;

    // Show integrations cost if integrations is 'Yes' AND increase is selected
    if (integrationsActive && increaseActive) {
      displayIntegrationsCost = true;
    }

    // Show Discount for ERP and Total End Price if Increase is selected AND Discount is NOT selected
    if (increaseActive && !discountActive) {
      displayDiscountForErp = true;
      displayTotalEndPrice = true;
    }

    // Apply visibility (ensure elements exist before toggling classes)
    if(integrationsCostDisplay) integrationsCostDisplay.classList.toggle('hidden', !displayIntegrationsCost);
    if(discountForErpDisplay) discountForErpDisplay.classList.toggle('hidden', !displayDiscountForErp);
    if(totalEndPriceDisplay) totalEndPriceDisplay.classList.toggle('hidden', !displayTotalEndPrice);

    // --- Perform Calculations ---

    // 2a. Integrations Cost (uses currentIntegrationsRate)
    let integrationsCost = 0;
    if (integrationsActive) {
      integrationsCost = validatedMsrpTotal * currentIntegrationsRate;
    }
    if(integrationsCostValue) integrationsCostValue.textContent = formatCurrencyDisplay(integrationsCost);


    // 2b. Discount for ERP
    let discountForErp = 0;
    // Only calculate if increase is active and discount is NOT active
    if (increaseActive && !discountActive) {
        const LYP_with_increase = validatedLastYearPrice * (1 + (validatedIncreasePercentage / 100));

        if (integrationsActive) {
            const denominator = validatedMsrpTotal * (1 + currentIntegrationsRate); // Uses currentIntegrationsRate
            if (denominator !== 0) {
                discountForErp = (LYP_with_increase / denominator - 1) * 100;
            } else {
                discountForErp = 0;
            }
        } else {
            const denominator = validatedMsrpTotal;
            if (denominator !== 0) {
                discountForErp = (LYP_with_increase / denominator - 1) * 100;
            } else {
                discountForErp = 0;
            }
        }
    }
    if(discountForErpValue) discountForErpValue.textContent = formatPercentageDisplay(discountForErp);

    // Total End Price calculation
    let totalEndPrice = 0;
    // Only calculate if increase is active and discount is NOT active
    if (increaseActive && !discountActive) {
        totalEndPrice = validatedLastYearPrice * (1 + (validatedIncreasePercentage / 100));
    }
    if(totalEndPriceValue) totalEndPriceValue.textContent = formatCurrencyDisplay(totalEndPrice);

    return { integrationsCost, discountForErp, totalEndPrice }; // Return derived values
  }

  // --- Data Persistence (via Background Script) ---

  // Consolidated function to get all current calculator input state
  function getCalculatorInputsState() {
    return {
      companyName: companyNameInput ? companyNameInput.value : '',
      erpLink: erpLinkInput ? erpLinkInput.value : '',
      integrationsRate: integrationsRateInput ? integrationsRateInput.value : String(defaultIntegrationsRate), // NEW
      lastYearPrice: lastYearPriceInput ? lastYearPriceInput.value : '',
      msrpTotal: msrpTotalInput ? msrpTotalInput.value : '',
      integrationsSelected: integrationsYesButton ? (integrationsYesButton.classList.contains('selected') ? 'yes' : 'no') : 'no',
      discountIncreaseSelected: discountBtn ? (discountBtn.classList.contains('selected') ? 'discount' :
                                increaseBtn && increaseBtn.classList.contains('selected') ? 'increase' : 'none') : 'none',
      discountPercentage: discountPercentageInput ? discountPercentageInput.value : '0',
      increasePercentage: increasePercentageInput ? increasePercentageInput.value : '5.00%'
    };
  }

  // Master function to save ALL app state (inputs, page) to background script
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
      [STORAGE_KEY_INPUTS, STORAGE_KEY_PAGE, STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_THEME, STORAGE_KEY_ADVANCED_MODE],
      (result) => {
        const savedInputs = useDefaults ? defaultQuoteInputs : (result[STORAGE_KEY_INPUTS] || defaultQuoteInputs);

        // Restore calculator inputs
        if(companyNameInput) companyNameInput.value = savedInputs.companyName;
        if(erpLinkInput) erpLinkInput.value = savedInputs.erpLink;
        if(integrationsRateInput) integrationsRateInput.value = String(savedInputs.integrationsRate); // NEW
        if(lastYearPriceInput) lastYearPriceInput.value = formatCurrencyDisplay(savedInputs.lastYearPrice);
        if(msrpTotalInput) msrpTotalInput.value = formatCurrencyDisplay(savedInputs.msrpTotal);
        if(discountPercentageInput) discountPercentageInput.value = savedInputs.discountPercentage;
        if(increasePercentageInput) increasePercentageInput.value = savedInputs.increasePercentage;

        setIntegrationSelection(savedInputs.integrationsSelected, false);
        setDiscountIncreaseSelection(savedInputs.discountIncreaseSelected, false);

        // Restore zoom level and apply it immediately
        const savedZoom = useDefaults ? defaultZoomLevel : (parseFloat(result[STORAGE_KEY_ZOOM]) || defaultZoomLevel);
        applyZoom(savedZoom);
        if (zoomSlider) zoomSlider.value = savedZoom; // Ensure slider position is set correctly on load

        // Restore Luna title visibility
        const lunaTitleIsVisible = useDefaults ? defaultLunaTitleVisible : (result[STORAGE_KEY_LUNA_TITLE_VISIBLE] !== false);
        setLunaTitleVisibility(lunaTitleIsVisible, false);

        // Restore Advanced Mode (this will also toggle visibility of ERP Link and Integrations Rate)
        const advancedModeIsCurrentlyEnabled = useDefaults ? defaultAdvancedMode : (result[STORAGE_KEY_ADVANCED_MODE] === true);
        setAdvancedMode(advancedModeIsCurrentlyEnabled, false);

        // Restore Theme
        const savedTheme = useDefaults ? defaultTheme : (result[STORAGE_KEY_THEME] || defaultTheme);
        setTheme(savedTheme, false);

        // Determine the page to show based on saved state, default to mainMenuPage
        const lastPage = useDefaults ? 'mainMenuPage' : (result[STORAGE_KEY_PAGE] || 'mainMenuPage');
        showPage(lastPage); // This will also handle footer visibility based on pageId

        calculateTotalAndUpdateDisplay(); // Perform initial calculations and display updates
      }
    );
  }

  // --- Integrations Buttons Logic ---
  function setIntegrationSelection(selection, shouldSave = true) {
    if (integrationsYesButton && integrationsNoButton) { // Ensure buttons exist
      if (selection === 'yes') {
        integrationsYesButton.classList.add('selected');
        integrationsNoButton.classList.remove('selected');
      } else {
        integrationsYesButton.classList.remove('selected');
        integrationsNoButton.classList.add('selected');
      }
    }
    if (shouldSave) saveAppState();
    calculateTotalAndUpdateDisplay();
  }

  // --- Discount/Increase Buttons Logic ---
  function setDiscountIncreaseSelection(selection, shouldSave = true) {
    if (discountBtn && increaseBtn && discountFields && increaseFields && integrationsCostDisplay && discountForErpDisplay && totalEndPriceDisplay) {
      discountBtn.classList.remove('selected');
      increaseBtn.classList.remove('selected');
      discountFields.classList.add('hidden');
      increaseFields.classList.add('hidden');

      // Also hide calculated display fields when changing selection
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

  // --- Clear All Function ---
  // Added optional parameter `skipConfirmation`
  function clearAllInputs(showConfirmation = true) {
      if (showConfirmation && !confirm("Are you sure you want to clear all text on this page? This cannot be undone.")) {
          return; // Stop if user cancels
      }

      // Reset fields to default empty/initial values
      if (companyNameInput) companyNameInput.value = '';
      if (erpLinkInput) erpLinkInput.value = '';
      if (integrationsRateInput) integrationsRateInput.value = String(defaultIntegrationsRate); // NEW
      if (lastYearPriceInput) lastYearPriceInput.value = '';
      if (msrpTotalInput) msrpTotalInput.value = '';
      if (discountPercentageInput) discountPercentageInput.value = '0';
      if (increasePercentageInput) increasePercentageInput.value = '5.00%';

      setIntegrationSelection('no');
      setDiscountIncreaseSelection('none');
  }

  // --- Generate Timestamp for filename and display ---
  function generateTimestamp(forFilename = true) {
      const now = new Date();
      if (forFilename) {
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const seconds = String(now.getSeconds()).padStart(2, '0');
          return `${year}${month}${day}_${hours}${minutes}${seconds}`;
      } else {
          return now.toLocaleString(); // More readable format for display
      }
  }

  // --- Complete Quote Function (save to log) ---
  function completeQuote() {
      // NO CONFIRMATION FOR COMPLETE ACTION.
      const currentInputs = getCalculatorInputsState();
      const calculatedOutputs = calculateTotalAndUpdateDisplay(); // Ensure latest outputs are calculated

      const record = {
          id: Date.now(), // Unique ID for each record
          timestamp: generateTimestamp(false), // Readable timestamp for display
          filenameTimestamp: generateTimestamp(true), // Timestamp for filename
          inputs: currentInputs,
          outputs: calculatedOutputs
      };

      chrome.storage.local.get(STORAGE_KEY_RECORDS, (result) => {
          const records = result[STORAGE_KEY_RECORDS] || [];
          records.unshift(record); // Add new record to the beginning of the list
          chrome.storage.local.set({ [STORAGE_KEY_RECORDS]: records }, () => {
              if (chrome.runtime.lastError) {
                  console.error('Error saving record:', chrome.runtime.lastError.message);
              } else {
                  console.log('Record saved successfully:', record);
                  clearAllInputs(false); // Clear current inputs AFTER saving, explicitly WITHOUT confirmation
                  // Optionally, add a visual confirmation like a temporary "Saved!" message
              }
          });
      });
  }

  // --- Render Record Log ---
  function renderRecordLog() {
      if (!recordLogList) return;

      recordLogList.innerHTML = ''; // Clear existing list

      chrome.storage.local.get(STORAGE_KEY_RECORDS, (result) => {
          const records = result[STORAGE_KEY_RECORDS] || [];

          if (records.length === 0) {
              recordLogList.innerHTML = '<p class="empty-log-message">No records saved yet.</p>';
              return;
          }

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
              deleteButton.innerHTML = '🗑️'; // Trashcan emoji
              deleteButton.title = 'Delete Record';
              deleteButton.addEventListener('click', (e) => {
                  e.stopPropagation();
                  deleteRecord(record.id); // Pass record ID to delete
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

  // Helper to format record data for display in the log
  function formatRecordDetailsForDisplay(record) {
      let content = '';

      // Only add advanced mode fields if they had content or if they are just parameters
      // For records, we display what was saved, so we don't need to re-check `isAdvancedModeEnabled`
      if (record.inputs.erpLink || record.inputs.integrationsRate !== String(defaultIntegrationsRate)) {
          content += `--- Advanced Mode Fields ---\n`;
          content += `ERP Link: ${record.inputs.erpLink || 'N/A'}\n`;
          content += `Integrations Rate: ${record.inputs.integrationsRate}% \n\n`; // NEW
      }


      content += `--- Core Quote Fields ---\n`;
      content += `Company Name: ${record.inputs.companyName || 'N/A'}\n`; // Now always present
      content += `Last Year Price: ${record.inputs.lastYearPrice || '$0.00'}\n`;
      content += `MSRP Total: ${record.inputs.msrpTotal || '$0.00'}\n`;
      content += `Integrations: ${record.inputs.integrationsSelected === 'yes' ? 'Yes' : 'No'}\n`;
      content += `Discount/Increase Mode: ${record.inputs.discountIncreaseSelected}\n`;
      if (record.inputs.discountIncreaseSelected === 'discount') {
          content += `Discount Percentage: ${record.inputs.discountPercentage || '0.00%'}\n`;
      } else if (record.inputs.discountIncreaseSelected === 'increase') {
          content += `Increase Percentage: ${record.inputs.increasePercentage || '0.00%'}\n`;
      }
      content += '\n';

      content += `--- Calculated Values ---\n`;
      const integrationsActive = record.inputs.integrationsSelected === 'yes';
      const increaseActive = record.inputs.discountIncreaseSelected === 'increase';
      const discountActive = record.inputs.discountIncreaseSelected === 'discount';

      if (integrationsActive && increaseActive) {
          content += `Integrations Cost: ${formatCurrencyDisplay(record.outputs.integrationsCost)}\n`;
      }
      if (increaseActive && !discountActive) {
          content += `Discount for ERP: ${formatPercentageDisplay(record.outputs.discountForErp)}\n`;
          content += `Total End Price: ${formatCurrencyDisplay(record.outputs.totalEndPrice)}\n`;
      }

      return content.trim();
  }

  // --- Download Specific Record to TXT ---
  function downloadRecord(record) {
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

  // --- Copy Specific Record to Calculator ---
  function copyRecordToCalculator(record) {
      if (!confirm("This action will copy all this entry's data into the quote calculator and override any existing data. Would you like to proceed?")) {
          return;
      }

      // Populate input fields
      if (companyNameInput) companyNameInput.value = record.inputs.companyName || '';
      if (erpLinkInput) erpLinkInput.value = record.inputs.erpLink || '';
      if (integrationsRateInput) integrationsRateInput.value = String(record.inputs.integrationsRate || defaultIntegrationsRate); // NEW
      if (lastYearPriceInput) lastYearPriceInput.value = record.inputs.lastYearPrice || '';
      if (msrpTotalInput) msrpTotalInput.value = record.inputs.msrpTotal || '';
      if (discountPercentageInput) discountPercentageInput.value = record.inputs.discountPercentage || '0';
      if (increasePercentageInput) increasePercentageInput.value = record.inputs.increasePercentage || '5.00%';

      // Set button selections (this will also trigger saveAppState and recalculate)
      setIntegrationSelection(record.inputs.integrationsSelected || 'no');
      setDiscountIncreaseSelection(record.inputs.discountIncreaseSelected || 'none');

      // Go to the calculator page
      showPage('quoteCalculatorPage');
  }

  // --- Delete Record from Log ---
  function deleteRecord(recordIdToDelete) {
      if (!confirm("Are you sure you want to delete this record? This cannot be undone.")) {
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
                      renderRecordLog(); // Re-render the list after deletion
                  }
              });
          }
      });
  }

  // --- Download All Records from Log ---
  function downloadAllRecordsFromLog() {
      chrome.storage.local.get(STORAGE_KEY_RECORDS, (result) => {
          const records = result[STORAGE_KEY_RECORDS] || [];

          if (records.length === 0) {
              alert("There are no records to download.");
              return;
          }

          let combinedContent = `Luna All Records Export\nExport Date: ${generateTimestamp(false)}\n\n`;
          records.forEach((record, index) => {
              combinedContent += `===== RECORD ${index + 1} (${record.timestamp}) =====\n`;
              combinedContent += formatRecordDetailsForDisplay(record);
              combinedContent += `\n===================================\n\n`; // Separator
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
          console.log("All records downloaded.");
      });
  }


  // --- Reset All Function ---
  function resetAll() {
      if (!confirm("Are you sure you want to reset ALL data and settings to default? This cannot be undone.")) {
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

  // Main menu navigation buttons
  if (openQuoteCalculatorButton) {
    openQuoteCalculatorButton.addEventListener('click', () => {
      showPage('quoteCalculatorPage');
    });
  }
  if (openSettingsButton) {
    openSettingsButton.addEventListener('click', () => {
      showPage('settingsPage');
      const currentZoom = parseFloat(document.body.style.zoom) || 1.0;
      setZoomSelection(currentZoom);
    });
  }
  // Open Record Log button
  if (openRecordLogButton) {
      openRecordLogButton.addEventListener('click', () => {
          showPage('recordLogPage');
      });
  }

  // Back buttons
  if (backToMenuButton) {
    backToMenuButton.addEventListener('click', () => {
      showPage('mainMenuPage');
    });
  }
  if (backToMenuFromSettingsButton) {
    backToMenuFromSettingsButton.addEventListener('click', () => {
      showPage('mainMenuPage');
    });
  }
  // Back from Record Log button
  if (backToMenuFromRecordLogButton) {
      backToMenuFromRecordLogButton.addEventListener('click', () => {
          showPage('mainMenuPage');
      });
  }

  // Input changes trigger calculation and saving (includes new advanced mode inputs)
  let inputSaveTimeout;
  const debounceDelay = 300;

  const debounceSave = (event) => {
    if (event.target.id === 'lastYearPrice' || event.target.id === 'msrpTotal') {
        calculateTotalAndUpdateDisplay();
        saveAppState();
    } else {
        clearTimeout(inputSaveTimeout);
        inputSaveTimeout = setTimeout(() => {
            calculateTotalAndUpdateDisplay();
            saveAppState();
        }, debounceDelay);
    }
  };

  if(companyNameInput) companyNameInput.addEventListener('input', debounceSave);
  if(erpLinkInput) erpLinkInput.addEventListener('input', debounceSave);
  if(integrationsRateInput) integrationsRateInput.addEventListener('input', debounceSave); // NEW
  if(lastYearPriceInput) lastYearPriceInput.addEventListener('input', debounceSave);
  if(msrpTotalInput) msrpTotalInput.addEventListener('input', debounceSave);
  if(discountPercentageInput) discountPercentageInput.addEventListener('input', debounceSave);
  if(increasePercentageInput) increasePercentageInput.addEventListener('input', debounceSave);

  // Currency Input Formatting (on blur)
  if(lastYearPriceInput) {
    lastYearPriceInput.addEventListener('blur', (event) => {
      if (event.target.value !== '') {
          event.target.value = formatCurrencyDisplay(event.target.value);
      }
      calculateTotalAndUpdateDisplay();
      saveAppState();
    });
  }
  if(msrpTotalInput) {
    msrpTotalInput.addEventListener('blur', (event) => {
      if (event.target.value !== '') {
          event.target.value = formatCurrencyDisplay(event.target.value);
      }
      calculateTotalAndUpdateDisplay();
      saveAppState();
    });
  }

  // Increase Percentage Input Formatting (on blur)
  if(increasePercentageInput) {
    increasePercentageInput.addEventListener('blur', (event) => {
      if (event.target.value !== '') {
          event.target.value = formatPercentageDisplay(event.target.value);
      }
      calculateTotalAndUpdateDisplay();
      saveAppState();
    });
  }

  // Integrations button clicks
  if(integrationsYesButton) integrationsYesButton.addEventListener('click', () => setIntegrationSelection('yes'));
  if(integrationsNoButton) integrationsNoButton.addEventListener('click', () => setIntegrationSelection('no'));

  // Discount/Increase button clicks
  if(discountBtn) discountBtn.addEventListener('click', () => setDiscountIncreaseSelection('discount'));
  if(increaseBtn) increaseBtn.addEventListener('click', () => setDiscountIncreaseSelection('increase'));

  // Magnification slider
  if (zoomSlider) {
    zoomSlider.addEventListener('input', (event) => {
      const zoomLevel = parseFloat(event.target.value);
      setZoomSelection(zoomLevel);
    });
  }

  // Luna Title Visibility button clicks
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
      downloadAllRecordsBtn.addEventListener('click', downloadAllRecordsFromLog);
  }


  // --- Initial Setup on DOM Load ---
  loadAppState();
});