// background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // On installation, set default zoom level to 1.0 (100%) if not already set
  chrome.storage.local.get('lunaZoomLevel', (result) => {
    if (result.lunaZoomLevel === undefined) {
      chrome.storage.local.set({ lunaZoomLevel: 1.0 });
    }
  });
});

// Listener for messages from the side panel script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'saveAppState') { // For calculator inputs and page state
    const { calculatorInputs, currentPage } = request.payload;

    chrome.storage.local.set({
      lunaQuoteCalculatorInputs: calculatorInputs,
      lunaLastPage: currentPage
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Background: Error saving calculator/page state:', chrome.runtime.lastError.message);
        sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
      } else {
        // console.log('Background: Calculator/Page state successfully saved.', { calculatorInputs, currentPage });
        sendResponse({ status: 'success' }); // Respond that save was successful
      }
    });
    return true; // Indicates asynchronous response
  } else if (request.type === 'saveZoomLevel') { // Handles zoom level changes
    const zoomLevel = request.zoomLevel;
    chrome.storage.local.set({ lunaZoomLevel: zoomLevel }, () => {
      if (chrome.runtime.lastError) {
        console.error('Background: Error saving zoom level:', chrome.runtime.lastError.message);
        sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
      } else {
        // console.log('Background: Zoom level successfully saved:', zoomLevel);
        sendResponse({ status: 'success' }); // Respond that save was successful
      }
    });
    return true; // Indicates asynchronous response
  }
});

// onStartup will run when the browser starts.
chrome.runtime.onStartup.addListener(() => {
  console.log('Background: Extension started up.');
  // The side panel's JS will handle loading its own zoom level on DOMContentLoaded.
});