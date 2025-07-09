// js/background.js

/**
 * Service Worker for the Luna Chrome Extension.
 * Handles initial setup, side panel behavior, and persistent storage interactions
 * for various extension settings and user data.
 */

/**
 * Listens for the extension to be installed or updated.
 * Sets the default side panel behavior to open on action click.
 * Initializes default settings in chrome.storage.local if they don't exist.
 */
chrome.runtime.onInstalled.addListener(() => {
  // Ensure the side panel opens when the extension action (icon) is clicked.
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Define default values for various settings.
  const defaultSettings = {
    lunaZoomLevel: 1.0,
    lunaTitleVisible: true,
    lunaAdvancedModeEnabled: false,
    lunaThemeMode: 'dark',
    lunaAccentColor: '#51a3f9',
    lunaTextColor: '#ed5653',
    lunaMainMenuLastView: 'tools',
    lunaQuoteCalculatorInputs: {
      companyName: '',
      erpLink: '',
      lastYearPrice: '',
      msrpTotal: '',
      integrationsSelected: 'no',
      discountIncreaseSelected: 'increase', // Default to increase as discount is disabled
      discountPercentage: '0',
      increasePercentage: '5.00%',
      notes: ''
    },
    lunaCreditCalculatorInputs: {
        amount: '',
        purchaseDate: '',
        duration: 1
    },
    lunaQuoteRecords: [], // Initialize records as an empty array
    lunaLastPage: '/html/mainMenu.html' // MODIFIED: Add leading slash
  };

  // Retrieve current settings and merge with defaults, saving only missing ones.
  chrome.storage.local.get(Object.keys(defaultSettings), (result) => {
    const settingsToSet = {};
    for (const key in defaultSettings) {
      if (result[key] === undefined) {
        settingsToSet[key] = defaultSettings[key];
      }
    }

    if (Object.keys(settingsToSet).length > 0) {
      chrome.storage.local.set(settingsToSet, () => {
        if (chrome.runtime.lastError) {
          console.error('Background: Error setting default initial settings:', chrome.runtime.lastError.message);
        } else {
          console.log('Background: Default settings initialized/ensured.');
        }
      });
    }
  });
});

/**
 * Listens for messages from other parts of the extension (e.g., content scripts, popups, side panels).
 * Used for saving various state data to local storage.
 *
 * @param {object} request - The message payload.
 * @param {object} sender - Details about the sender of the message.
 * @param {Function} sendResponse - Function to send a response back to the sender.
 * @returns {boolean} True if the response will be sent asynchronously.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handles saving the entire application state (calculator inputs and last viewed page).
  if (request.type === 'saveAppState') {
    const { calculatorInputs, currentPage } = request.payload;
    chrome.storage.local.set({
      lunaQuoteCalculatorInputs: calculatorInputs,
      lunaLastPage: currentPage
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Background: Error saving calculator/page state:', chrome.runtime.lastError.message);
        sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
      } else {
        // console.log('Background: Calculator/Page state successfully saved.');
        sendResponse({ status: 'success' });
      }
    });
    return true;
  }
  // Handles saving individual settings that might be updated across different pages.
  else if (request.type === 'saveSetting') {
    const { key, value } = request.payload;
    const setting = {};
    setting[key] = value;
    chrome.storage.local.set(setting, () => {
      if (chrome.runtime.lastError) {
        console.error(`Background: Error saving setting "${key}":`, chrome.runtime.lastError.message);
        sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
      } else {
        // console.log(`Background: Setting "${key}" successfully saved:`, value);
        sendResponse({ status: 'success' });
      }
    });
    return true;
  }
});

/**
 * Listens for the browser startup event.
 * Useful for debugging or initial logging when the browser launches.
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('Background: Luna Extension started up.');
});