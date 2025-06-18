// js/quoteRecordLog.js

/**
 * Record Log script for the Luna Chrome Extension.
 * Manages the display, interaction (copy, delete), and export (download)
 * of saved quote records.
 */

// Import utility functions for formatting
import { formatCurrencyDisplay, formatPercentageDisplay, generateTimestamp } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- Element References ---
  // Header elements for global settings display
  const lunaTitle = document.getElementById('extensionTitle');

  const recordLogList = document.getElementById('recordLogList');
  const downloadAllRecordsBtn = document.getElementById('downloadAllRecordsBtn');

  // --- Storage Keys ---
  const STORAGE_KEY_RECORDS = 'lunaQuoteRecords'; // Key for saved records
  const STORAGE_KEY_INPUTS = 'lunaQuoteCalculatorInputs'; // To copy data back to calculator
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel'; // Global settings
  const STORAGE_KEY_LUNA_TITLE_VISIBLE = 'lunaTitleVisible'; // Global settings
  const STORAGE_KEY_THEME = 'lunaTheme'; // Global settings

  // --- Default Values for Global Settings ---
  const defaultZoomLevel = 1.0;
  const defaultLunaTitleVisible = true;
  const defaultTheme = 'purple';

  /**
   * Applies the saved zoom level to the document body.
   * @param {number} zoomLevel - The zoom level to apply (e.g., 1.0 for 100%).
   */
  function applyZoom(zoomLevel) {
    document.body.style.zoom = zoomLevel;
  }

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
   * Applies the selected theme to the document body.
   * @param {string} themeName - The name of the theme (e.g., 'purple', 'blue').
   */
  function setTheme(themeName) {
    const body = document.body;
    ['purple', 'blue', 'green', 'pink', 'orange', 'red', 'yellow', 'white'].forEach(theme => {
      body.classList.remove(`theme-${theme}`);
    });
    body.classList.add(`theme-${themeName}`);
  }

  /**
   * Loads all global settings (zoom, title visibility, theme)
   * from Chrome storage and applies them to the UI.
   */
  function loadGlobalSettings() {
    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_THEME],
      (result) => {
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || defaultZoomLevel;
        applyZoom(zoom);

        const isTitleVisible = result[STORAGE_KEY_LUNA_TITLE_VISIBLE] !== false;
        setLunaTitleVisibility(isTitleVisible);

        const theme = result[STORAGE_KEY_THEME] || defaultTheme;
        setTheme(theme);
      }
    );
  }

  /**
   * Renders the list of saved records in the record log UI.
   * Clears existing entries and dynamically creates new ones.
   */
  function renderRecordLog() {
    if (!recordLogList) return;

    recordLogList.innerHTML = ''; // Clear previous records

    chrome.storage.local.get([STORAGE_KEY_RECORDS], (result) => {
      const records = result[STORAGE_KEY_RECORDS] || [];

      if (records.length === 0) {
        const noRecords = document.createElement('p');
        noRecords.classList.add('empty-log-message');
        noRecords.textContent = 'No records saved yet.';
        recordLogList.appendChild(noRecords);
        return;
      }

      // Sort records by timestamp in descending order (newest first)
      records.sort((a, b) => b.id - a.id);

      records.forEach((record) => {
        const item = document.createElement('div');
        item.className = 'record-item';

        const header = document.createElement('div');
        header.className = 'record-item-header';

        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'record-timestamp';
        timestampSpan.textContent = record.timestamp || 'N/A Date'; // Use stored timestamp or fallback

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'record-actions';

        const downloadButton = document.createElement('button');
        downloadButton.className = 'record-action-button';
        downloadButton.innerHTML = '⬇️';
        downloadButton.title = 'Download as TXT';
        downloadButton.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent potential parent click effects
          downloadRecord(record);
        });

        const copyButton = document.createElement('button');
        copyButton.className = 'record-action-button';
        copyButton.innerHTML = '📋';
        copyButton.title = 'Copy to Calculator';
        copyButton.addEventListener('click', (e) => {
          e.stopPropagation();
          copyRecordToCalculator(record);
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'record-action-button delete-record-button';
        deleteButton.innerHTML = '🗑️';
        deleteButton.title = 'Delete Record';
        deleteButton.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteRecord(record.id); // Use the unique ID for deletion
        });

        actionsDiv.appendChild(downloadButton);
        actionsDiv.appendChild(copyButton);
        actionsDiv.appendChild(deleteButton);

        header.appendChild(timestampSpan);
        header.appendChild(actionsDiv);

        const contentPre = document.createElement('pre');
        contentPre.className = 'record-item-details';
        contentPre.textContent = formatRecordDetailsForDisplay(record);

        item.appendChild(header);
        item.appendChild(contentPre);
        recordLogList.appendChild(item);
      });
    });
  }

  /**
   * Formats a single record's details into a human-readable string for display and export.
   * Handles missing properties gracefully using optional chaining and fallbacks.
   *
   * @param {object} record - The record object to format.
   * @returns {string} The formatted string representation of the record.
   */
  function formatRecordDetailsForDisplay(record) {
    const inputs = record.inputs || {};
    const outputs = record.outputs || {};
    const fixedIntegrationsRate = 20.00; // Define locally or import if truly constant across files

    let content = '';

    content += `Company Name: ${inputs.companyName || 'N/A'}\n`;
    if (inputs.erpLink) {
      content += `ERP Link: ${inputs.erpLink}\n`;
    }
    content += `Last Year Price: ${inputs.lastYearPrice || '$0.00'}\n`;
    content += `MSRP Total: ${inputs.msrpTotal || '$0.00'}\n`;
    content += `Integrations Selected: ${inputs.integrationsSelected === 'yes' ? 'Yes' : 'No'}\n`;
    content += `Discount/Increase Selected: ${inputs.discountIncreaseSelected || 'None'}\n`;

    if (inputs.discountIncreaseSelected === 'discount') {
      content += `Discount Percentage: ${inputs.discountPercentage || '0.00%'}\n`;
    } else if (inputs.discountIncreaseSelected === 'increase') {
      content += `Increase Percentage: ${inputs.increasePercentage || '0.00%'}\n`;
    }

    content += '\n--- Calculated Values ---\n';

    const savedIntegrationsActive = inputs.integrationsSelected === 'yes';
    const savedIncreaseActive = inputs.discountIncreaseSelected === 'increase';

    // Integrations cost is displayed if integrations are active AND increase is selected.
    if (savedIntegrationsActive && savedIncreaseActive) {
      content += `Integrations Cost: ${formatCurrencyDisplay(outputs.integrationsCost)}\n`;
    }

    // Calculated Discount for ERP and Total End Price are displayed if increase is selected.
    if (savedIncreaseActive) {
      content += `Calculated Discount for ERP: ${formatPercentageDisplay(outputs.discountForErp)}\n`;
      content += `Calculated Total End Price: ${formatCurrencyDisplay(outputs.totalEndPrice)}\n`;
    } else {
        // If 'discount' was selected, these outputs might not have been calculated in the same way.
        // For now, they'd be N/A or rely on future discount logic.
        // As discount is currently disabled, this block handles the 'increase' mode.
    }

    content += `Notes: ${inputs.notes || 'N/A'}\n`;

    return content.trim();
  }

  /**
   * Downloads a specific record as a TXT file.
   * @param {object} record - The record object to download.
   */
  function downloadRecord(record) {
    const textContent = formatRecordDetailsForDisplay(record);
    const filename = `Luna_Quote_Data_${record.filenameTimestamp || generateTimestamp(true)}.txt`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); // Required for 'a.click()' to work in some browsers
    a.click();
    document.body.removeChild(a); // Clean up
    URL.revokeObjectURL(url); // Release the object URL
  }

  /**
   * Copies the data of a selected record into the Quote Calculator's input fields.
   * Prompts for user confirmation before overwriting current calculator data.
   * @param {object} record - The record object whose data should be copied.
   */
  function copyRecordToCalculator(record) {
    if (!confirm("This action will copy all this entry's data into the quote calculator and override any existing data. Would you like to proceed?")) {
      return;
    }

    // Extract inputs from the record, with fallbacks for older formats
    const inputs = record.inputs || {};

    // Prepare inputs to be saved back to STORAGE_KEY_INPUTS for the calculator page
    const inputsToSave = {
      companyName: inputs.companyName || '',
      erpLink: inputs.erpLink || '',
      lastYearPrice: inputs.lastYearPrice || '',
      msrpTotal: inputs.msrpTotal || '',
      integrationsSelected: inputs.integrationsSelected || 'no',
      discountIncreaseSelected: inputs.discountIncreaseSelected || 'increase', // Default to increase if old record
      discountPercentage: inputs.discountPercentage || '0',
      increasePercentage: inputs.increasePercentage || '5.00%',
      notes: inputs.notes || ''
    };

    chrome.storage.local.set({ [STORAGE_KEY_INPUTS]: inputsToSave }, () => {
      if (chrome.runtime.lastError) {
        console.error('Record Log: Error copying record to calculator storage:', chrome.runtime.lastError.message);
        alert('Failed to copy record. Please try again.');
      } else {
        console.log('Record Log: Record data saved for calculator. Navigating to calculator page.');
        // Navigate to the calculator page
        window.location.href = '../html/quoteCalculator.html';
      }
    });
  }

  /**
   * Deletes a record from the log based on its unique ID.
   * Prompts for user confirmation.
   * @param {number} recordIdToDelete - The unique ID of the record to delete.
   */
  function deleteRecord(recordIdToDelete) {
    if (!confirm("Are you sure you want to delete this record? This cannot be undone.")) {
      return;
    }

    chrome.storage.local.get([STORAGE_KEY_RECORDS], (result) => {
      let records = result[STORAGE_KEY_RECORDS] || [];
      const initialLength = records.length;
      // Filter out the record with the matching ID
      records = records.filter(record => record.id !== recordIdToDelete);

      if (records.length < initialLength) { // Check if a record was actually removed
        chrome.storage.local.set({ [STORAGE_KEY_RECORDS]: records }, () => {
          if (chrome.runtime.lastError) {
            console.error('Record Log: Error deleting record:', chrome.runtime.lastError.message);
            alert('Failed to delete record. Please try again.');
          } else {
            console.log('Record Log: Record deleted successfully. Re-rendering log.');
            renderRecordLog(); // Re-render the list to reflect the deletion
          }
        });
      }
    });
  }

  /**
   * Downloads all saved records as a single TXT file.
   * Prompts if no records are available.
   */
  function downloadAllRecordsFromLog() {
    chrome.storage.local.get([STORAGE_KEY_RECORDS], (result) => {
      const records = result[STORAGE_KEY_RECORDS] || [];

      if (records.length === 0) {
        alert("There are no records to download.");
        return;
      }

      // Sort records by timestamp (newest first) for consistent export order
      records.sort((a, b) => b.id - a.id);

      let combinedContent = `Luna All Records Export\nExport Date: ${generateTimestamp(false)}\n\n`;
      records.forEach((record, index) => {
        combinedContent += `===== RECORD ${index + 1} (${record.timestamp || 'N/A'}) =====\n`;
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
      console.log("Record Log: All records downloaded.");
    });
  }

  // --- Event Listeners ---
  if (downloadAllRecordsBtn) {
    downloadAllRecordsBtn.addEventListener('click', downloadAllRecordsFromLog);
  }

  // --- Initial Setup on DOM Load ---
  // Load global settings (zoom, title visibility, theme)
  loadGlobalSettings();
  // Render the record log when the page loads
  renderRecordLog();
});