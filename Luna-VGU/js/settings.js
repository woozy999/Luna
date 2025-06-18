// js/settings.js

/**
 * Settings script for the Luna Chrome Extension.
 * Manages user preferences for magnification, Luna title visibility,
 * advanced mode, and theme selection.
 * Also provides a "Reset All" functionality to clear all stored data.
 */

// Import utility functions (if needed, currently not directly used here but good practice)
// import { formatCurrencyDisplay } from './utils.js'; 

document.addEventListener('DOMContentLoaded', () => {
  // --- Element References ---
  // Header elements for global settings display
  const lunaTitle = document.getElementById('extensionTitle');

  // Settings controls
  const zoomSlider = document.getElementById('zoomSlider');
  const zoomValueDisplay = document.getElementById('zoomValueDisplay');
  const lunaTitleVisibleButton = document.getElementById('lunaTitleVisible');
  const lunaTitleHiddenButton = document.getElementById('lunaTitleHidden');
  const advancedModeEnabledBtn = document.getElementById('advancedModeEnabledBtn');
  const advancedModeDisabledBtn = document.getElementById('advancedModeDisabledBtn');
  const themeButtons = document.querySelectorAll('.theme-button');
  const resetAllButton = document.getElementById('resetAllButton');

  // --- Storage Keys ---
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel';
  const STORAGE_KEY_LUNA_TITLE_VISIBLE = 'lunaTitleVisible';
  const STORAGE_KEY_ADVANCED_MODE = 'lunaAdvancedModeEnabled';
  const STORAGE_KEY_THEME = 'lunaTheme';
  const STORAGE_KEY_INPUTS = 'lunaQuoteCalculatorInputs'; // To clear on reset
  const STORAGE_KEY_RECORDS = 'lunaQuoteRecords'; // To clear on reset
  const STORAGE_KEY_LAST_PAGE = 'lunaLastPage'; // To clear on reset

  // --- Default Values (for reset) ---
  const defaultZoomLevel = 1.0;
  const defaultLunaTitleVisible = true;
  const defaultAdvancedMode = false;
  const defaultTheme = 'purple';
  const defaultQuoteInputs = {
      companyName: '',
      erpLink: '',
      lastYearPrice: '',
      msrpTotal: '',
      integrationsSelected: 'no',
      discountIncreaseSelected: 'increase',
      discountPercentage: '0',
      increasePercentage: '5.00%',
      notes: ''
  };

  /**
   * Applies the specified zoom level to the document body and updates the display.
   * Also sends the new zoom level to the background script for persistence.
   * @param {number} zoomLevel - The zoom level to apply (e.g., 1.0 for 100%).
   * @param {boolean} [shouldSave=true] - Whether to save the setting to storage.
   */
  function applyZoom(zoomLevel, shouldSave = true) {
    document.body.style.zoom = zoomLevel;
    if (zoomValueDisplay) {
      zoomValueDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
    }
    if (shouldSave) {
      chrome.runtime.sendMessage({
        type: 'saveSetting',
        payload: { key: STORAGE_KEY_ZOOM, value: zoomLevel }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Settings: Error saving zoom level:', chrome.runtime.lastError.message);
        }
      });
    }
  }

  /**
   * Sets the visibility of the Luna title in the header and updates the UI buttons.
   * Sends the state to the background script for persistence.
   * @param {boolean} isVisible - True to show the title, false to hide it.
   * @param {boolean} [shouldSave=true] - Whether to save the setting to storage.
   */
  function setLunaTitleVisibility(isVisible, shouldSave = true) {
    // Apply to current page's header (if present)
    if (lunaTitle) {
      lunaTitle.classList.toggle('hidden-title', !isVisible);
    }

    // Update button visual state
    if (lunaTitleVisibleButton && lunaTitleHiddenButton) {
      if (isVisible) {
        lunaTitleVisibleButton.classList.add('selected');
        lunaTitleHiddenButton.classList.remove('selected');
      } else {
        lunaTitleVisibleButton.classList.remove('selected');
        lunaTitleHiddenButton.classList.add('selected');
      }
    }
    // Save to storage
    if (shouldSave) {
      chrome.runtime.sendMessage({
        type: 'saveSetting',
        payload: { key: STORAGE_KEY_LUNA_TITLE_VISIBLE, value: isVisible }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Settings: Error saving Luna title visibility:', chrome.runtime.lastError.message);
        }
      });
    }
  }

  /**
   * Sets the state of Advanced Mode and updates the UI buttons.
   * Sends the state to the background script for persistence.
   * @param {boolean} isEnabled - True to enable advanced mode, false to disable.
   * @param {boolean} [shouldSave=true] - Whether to save the setting to storage.
   */
  function setAdvancedMode(isEnabled, shouldSave = true) {
    // Update button visual state
    if (advancedModeEnabledBtn && advancedModeDisabledBtn) {
      if (isEnabled) {
        advancedModeEnabledBtn.classList.add('selected');
        advancedModeDisabledBtn.classList.remove('selected');
      } else {
        advancedModeEnabledBtn.classList.remove('selected');
        advancedModeDisabledBtn.classList.add('selected');
      }
    }
    // Save to storage
    if (shouldSave) {
      chrome.runtime.sendMessage({
        type: 'saveSetting',
        payload: { key: STORAGE_KEY_ADVANCED_MODE, value: isEnabled }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Settings: Error saving Advanced Mode state:', chrome.runtime.lastError.message);
        }
      });
    }
    // No direct UI impact on this page for advanced mode, but calculator.js will react to it
  }

  /**
   * Applies the selected theme to the document body and updates the theme buttons.
   * Sends the selected theme to the background script for persistence.
   * @param {string} themeName - The name of the theme (e.g., 'purple', 'blue').
   * @param {boolean} [shouldSave=true] - Whether to save the setting to storage.
   */
  function setTheme(themeName, shouldSave = true) {
    const body = document.body;
    // Remove all existing theme classes to ensure only one is active
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

    // Save to storage
    if (shouldSave) {
      chrome.runtime.sendMessage({
        type: 'saveSetting',
        payload: { key: STORAGE_KEY_THEME, value: themeName }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Settings: Error saving theme:', chrome.runtime.lastError.message);
        }
      });
    }
  }

  /**
   * Loads all settings from Chrome storage and applies them to the UI.
   * This function ensures that settings are loaded consistently on page load.
   */
  function loadSettings() {
    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_ADVANCED_MODE, STORAGE_KEY_THEME],
      (result) => {
        // Load and apply Zoom Level
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || defaultZoomLevel;
        if (zoomSlider) zoomSlider.value = zoom; // Update slider position
        applyZoom(zoom, false); // Apply zoom without saving again

        // Load and apply Luna Title Visibility
        const isTitleVisible = result[STORAGE_KEY_LUNA_TITLE_VISIBLE] !== false;
        setLunaTitleVisibility(isTitleVisible, false); // Apply without saving again

        // Load and apply Advanced Mode
        const isAdvanced = result[STORAGE_KEY_ADVANCED_MODE] === true;
        setAdvancedMode(isAdvanced, false); // Apply without saving again

        // Load and apply Theme
        const theme = result[STORAGE_KEY_THEME] || defaultTheme;
        setTheme(theme, false); // Apply without saving again
      }
    );
  }

  /**
   * Resets all extension data and settings to their default values.
   * Prompts for user confirmation before proceeding.
   */
  function resetAll() {
    if (!confirm('Are you sure you want to reset ALL data and settings to default? This cannot be undone.')) {
      return;
    }

    // List all storage keys that contain user data/settings
    const keysToClear = [
      STORAGE_KEY_INPUTS,
      STORAGE_KEY_LAST_PAGE, // Will reset to mainMenu on next load
      STORAGE_KEY_ZOOM,
      STORAGE_KEY_LUNA_TITLE_VISIBLE,
      STORAGE_KEY_THEME,
      STORAGE_KEY_ADVANCED_MODE,
      STORAGE_KEY_RECORDS
    ];

    chrome.storage.local.remove(keysToClear, () => {
      if (chrome.runtime.lastError) {
        console.error('Settings: Error clearing storage during reset:', chrome.runtime.lastError.message);
        alert('Failed to reset data. Please try again.');
      } else {
        console.log('Settings: All specified storage cleared. Reloading settings with defaults.');
        // After clearing, re-load settings to apply defaults to the UI
        loadSettings();
        alert('All settings and data have been reset to defaults.');
      }
    });
  }

  // --- Event Listeners ---

  // Magnification slider input event
  if (zoomSlider) {
    zoomSlider.addEventListener('input', (event) => {
      applyZoom(parseFloat(event.target.value));
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

  // Reset All button click
  if (resetAllButton) {
    resetAllButton.addEventListener('click', resetAll);
  }

  // --- Initial Setup on DOM Load ---
  loadSettings();
});