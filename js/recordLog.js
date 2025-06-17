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
              // Add the "No records saved yet." message if the list is empty
              const emptyMessage = document.createElement('p');
              emptyMessage.classList.add('empty-log-message');
              emptyMessage.textContent = 'No records saved yet.';
              recordLogList.appendChild(emptyMessage);
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

  // Helper to format record data for display in the log (Updated Order and using Optional Chaining)
  function formatRecordDetailsForDisplay(record) {
      let content = '';

      // Use optional chaining (?.) when accessing properties that might be missing
      // This is especially important for records saved before these fields were tracked
      const inputs = record.inputs || {};
      const outputs = record.outputs || {};

      // 1. Company Name (Always present in newer records, fallback for old)
      content += `Company Name: ${inputs.companyName || 'N/A'}\n`;

      // 2. ERP Link (Conditional based on saved value)
      if (inputs.erpLink) {
           content += `ERP Link: ${inputs.erpLink}\n`;
      }

      // 3. Last Year Price
      content += `Last Year Price: ${inputs.lastYearPrice || '$0.00'}\n`;

      // 4. MSRP Total
      content += `MSRP Total: ${inputs.msrpTotal || '$0.00'}\n`;

      // 5. Integrations selected?
      content += `Integrations Selected: ${inputs.integrationsSelected === 'yes' ? 'yes' : 'no'}\n`;

      // 6. Discount or Increase Selected?
      content += `Discount/Increase Selected: ${inputs.discountIncreaseSelected || 'none'}\n`;

      // 7. Discount percentage (if discount was selected)
      if (inputs.discountIncreaseSelected === 'discount') {
          content += `Discount Percentage: ${inputs.discountPercentage || '0.00%'}\n`;
      }

      // 8. Increase percentage (if increase is selected)
      if (inputs.discountIncreaseSelected === 'increase') {
          content += `Increase Percentage: ${inputs.increasePercentage || '0.00%'}\n`;
      }

      content += '\n--- Calculated Values ---\n';

      // Check conditions based on saved inputs
      const savedIntegrationsActive = inputs.integrationsSelected === 'yes';
      const savedIncreaseActive = inputs.discountIncreaseSelected === 'increase';

      // 9. Integrations cost (if integrations is set to yes AND increase is selected)
      // Access using optional chaining
      if (savedIntegrationsActive && savedIncreaseActive) {
           content += `Integrations Cost: ${formatCurrencyDisplay(outputs.integrationsCost)}\n`;
      }

      // 10. Calculated Discount for ERP (if increase is selected AND discount is NOT selected)
      // Access using optional chaining
      if (savedIncreaseActive && inputs.discountIncreaseSelected !== 'discount') {
          content += `Calculated Discount for ERP: ${formatPercentageDisplay(outputs.discountForErp)}\n`;
      }

      // 11. Calculated Total End Price (if increase is selected AND discount is NOT selected)
      // Access using optional chaining
       if (savedIncreaseActive && inputs.discountIncreaseSelected !== 'discount') {
          content += `Calculated Total End Price: ${formatCurrencyDisplay(outputs.totalEndPrice)}\n`;
      }

      // 12. Notes (Added - will be N/A for older records)
      content += `Notes: ${inputs.notes || 'N/A'}\n`;


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
      // Need to append to body to make click work in some browsers
      document.body.appendChild(a);
      a.click();
      // Clean up the temporary link
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  }

  // --- Copy Specific Record to Calculator ---
  function copyRecordToCalculator(record) {
      if (!confirm("This action will copy all this entry's data into the quote calculator and override any existing data. Would you like to proceed?")) {
          return;
      }

      const inputs = record.inputs || {}; // Use optional chaining when accessing inputs

      // Populate input fields
      if (companyNameInput) companyNameInput.value = inputs.companyName || '';
      if (erpLinkInput) erpLinkInput.value = inputs.erpLink || '';
      // REMOVED: integrationsRateInput (Use the fixed default internally)
      if (lastYearPriceInput) lastYearPriceInput.value = inputs.lastYearPrice || '';
      if (msrpTotalInput) msrpTotalInput.value = inputs.msrpTotal || '';
      if (discountPercentageInput) discountPercentageInput.value = inputs.discountPercentage || '0';
      if (increasePercentageInput) increasePercentageInput.value = inputs.increasePercentage || '5.00%';
      if (notesInput) notesInput.value = inputs.notes || ''; // NEW: Copy notes

      // Set button selections (this will also trigger saveAppState and recalculate)
      setIntegrationSelection(inputs.integrationsSelected || 'no');
      setDiscountIncreaseSelection(inputs.discountIncreaseSelected || 'none');

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
              combinedContent += formatRecordDetailsForDisplay(record); // This function is now more robust
              combinedContent += `\n===================================\n\n`; // Separator
          });

          const filename = `Luna_All_Records_Export_${generateTimestamp(true)}.txt`;

          const blob = new Blob([combinedContent], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          // Append to body is standard for cross-browser compatibility with click()
          document.body.appendChild(a);
          a.click();
          // Clean up the temporary link
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log("All records downloaded.");
      });
  }
