// js/settings.js

/**
 * Settings script for the Luna Chrome Extension.
 * Manages user preferences for magnification, Luna title visibility,
 * advanced mode, and theme selection.
 * Also provides a "Reset All" functionality to clear all stored data.
 */

// Utility function to save the current page to storage
function saveCurrentPage(pagePath) {
    chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: 'lunaLastPage', value: pagePath } });
}

document.addEventListener('DOMContentLoaded', () => {
  saveCurrentPage('/html/settings.html'); // Save this page as the last visited

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
  const themeModeDarkBtn = document.getElementById('themeModeDarkBtn');
  const themeModeLightBtn = document.getElementById('themeModeLightBtn');
  const accentColorPicker = document.getElementById('accentColorPicker');
  const textColorPicker = document.getElementById('textColorPicker');
  const brandingLunaBtn = document.getElementById('brandingLunaBtn');
  const brandingTeamViewerBtn = document.getElementById('brandingTeamViewerBtn');
  const resetAllButton = document.getElementById('resetAllButton');
  const extensionVersion = document.getElementById('extensionVersion'); // NEW: Version span

  // --- Storage Keys ---
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel';
  const STORAGE_KEY_LUNA_TITLE_VISIBLE = 'lunaTitleVisible';
  const STORAGE_KEY_ADVANCED_MODE = 'lunaAdvancedModeEnabled';
  const STORAGE_KEY_THEME_MODE = 'lunaThemeMode';
  const STORAGE_KEY_ACCENT_COLOR = 'lunaAccentColor';
  const STORAGE_KEY_TEXT_COLOR = 'lunaTextColor';
  const STORAGE_KEY_INPUTS = 'lunaQuoteCalculatorInputs'; // To clear on reset
  const STORAGE_KEY_CREDIT_INPUTS = 'lunaCreditCalculatorInputs'; // To clear on reset
  const STORAGE_KEY_RECORDS = 'lunaQuoteRecords'; // To clear on reset
  const STORAGE_KEY_LAST_PAGE = 'lunaLastPage'; // To clear on reset
  const STORAGE_KEY_MAIN_MENU_VIEW = 'lunaMainMenuLastView';
  const STORAGE_KEY_BRANDING_MODE = 'lunaBrandingMode';

  // --- Default Values (for reset) ---
  const defaultZoomLevel = 1.0;
  const defaultLunaTitleVisible = true;
  const defaultAdvancedMode = false;
  const defaultThemeMode = 'dark';
  const defaultAccentColor = '#51a3f9';
  const defaultTextColor = '#ed5653';
  const defaultMainMenuLastView = 'tools';
  const defaultBrandingMode = 'luna';
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
    // Note: The branding mode will also control the visibility of the Luna title
    // so this function might become less critical for direct title control visually.
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
   * Applies the selected theme mode and colors to the document.
   * Sends the settings to the background script for persistence.
   * @param {string} mode - 'dark' or 'light'.
   * @param {string} accentColor - The hex code for the accent color.
   * @param {string} textColor - The hex code for the highlight text color.
   * @param {boolean} [shouldSave=true] - Whether to save the settings to storage.
   */
  function applyTheme(mode, accentColor, textColor, shouldSave = true) {
    const body = document.body;
    const root = document.documentElement;

    // 1. Set Mode
    body.classList.toggle('theme-dark', mode === 'dark');
    body.classList.toggle('theme-light', mode === 'light');
    if (themeModeDarkBtn) themeModeDarkBtn.classList.toggle('selected', mode === 'dark');
    if (themeModeLightBtn) themeModeLightBtn.classList.toggle('selected', mode === 'light');

    // 2. Set Colors
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--text-highlight-color', textColor);
    if (accentColorPicker) accentColorPicker.value = accentColor;
    if (textColorPicker) textColorPicker.value = textColor;

    // 3. Save to storage
    if (shouldSave) {
      chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: STORAGE_KEY_THEME_MODE, value: mode } });
      chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: STORAGE_KEY_ACCENT_COLOR, value: accentColor } });
      chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: STORAGE_KEY_TEXT_COLOR, value: textColor } });
    }
  }

  /**
   * Sets the branding mode (Luna or TeamViewer) and updates UI elements.
   * @param {string} brandingMode - 'luna' or 'teamviewer'.
   * @param {string} themeMode - 'dark' or 'light'.
   * @param {boolean} [shouldSave=false] - Whether to save the setting to storage.
   */
  function setBrandingMode(brandingMode, themeMode, shouldSave = false) {
    // Update button visual state
    if (brandingLunaBtn && brandingTeamViewerBtn) {
      brandingLunaBtn.classList.toggle('selected', brandingMode === 'luna');
      brandingTeamViewerBtn.classList.toggle('selected', brandingMode === 'teamviewer');
    }

    // Get common header elements (assuming they exist on all pages where this might be applied)
    const extensionIcon = document.querySelector('.extensionIcon');
    const extensionTitle = document.getElementById('extensionTitle'); // 'Luna' text

    if (extensionIcon) {
      extensionIcon.src = brandingMode === 'luna' ? '../icons/logo.png' : '../icons/tvicon.png';
      // Apply invert filter ONLY if TeamViewer branding AND Dark Mode
      extensionIcon.classList.toggle('inverted', brandingMode === 'teamviewer' && themeMode === 'dark');
    }
    if (extensionTitle) {
      extensionTitle.classList.toggle('hidden-title', brandingMode === 'teamviewer');
    }

    // Save to storage
    if (shouldSave && typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: STORAGE_KEY_BRANDING_MODE, value: brandingMode } });
    }
  }

  /**
   * Loads all settings from Chrome storage and applies them to the UI.
   * This function ensures that settings are loaded consistently on page load.
   */
  function loadSettings() {
    // NEW: Load manifest version
    if (extensionVersion) {
        const manifest = chrome.runtime.getManifest();
        extensionVersion.textContent = manifest.version;
    }

    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_ADVANCED_MODE, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_TEXT_COLOR, STORAGE_KEY_BRANDING_MODE],
      (result) => {
        // Load and apply Zoom Level
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || defaultZoomLevel;
        if (zoomSlider) zoomSlider.value = zoom; // Update slider position
        applyZoom(zoom, false); // Apply zoom without saving again

        // Load and apply Luna Title Visibility
        const isTitleVisible = result[STORAGE_KEY_LUNA_TITLE_VISIBLE] !== false;
        // setLunaTitleVisibility(isTitleVisible, false); // Commented out as branding mode will control visual hiding for Luna text

        // Load and apply Advanced Mode
        const isAdvanced = result[STORAGE_KEY_ADVANCED_MODE] === true;
        setAdvancedMode(isAdvanced, false); // MODIFIED: Call setAdvancedMode with 'isAdvanced' value and shouldSave=false

        // Load and apply Theme
        const mode = result[STORAGE_KEY_THEME_MODE] || defaultThemeMode;
        const accent = result[STORAGE_KEY_ACCENT_COLOR] || defaultAccentColor;
        const text = result[STORAGE_KEY_TEXT_COLOR] || defaultTextColor;
        applyTheme(mode, accent, text, false); // Apply without saving again

        // Load and apply Branding Mode
        const brandingMode = result[STORAGE_KEY_BRANDING_MODE] || defaultBrandingMode;
        setBrandingMode(brandingMode, mode, false); // MODIFIED: Call setBrandingMode, passing theme 'mode', and shouldSave=false

        // Apply Luna Title Visibility based on settings AND branding
        if (lunaTitle) {
          const hideBasedOnSetting = result[STORAGE_KEY_LUNA_TITLE_VISIBLE] === false;
          const hideBasedOnBranding = brandingMode === 'teamviewer';
          lunaTitle.classList.toggle('hidden-title', hideBasedOnSetting || hideBasedOnBranding);
        }
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
      STORAGE_KEY_CREDIT_INPUTS,
      STORAGE_KEY_LAST_PAGE,
      STORAGE_KEY_ZOOM,
      STORAGE_KEY_LUNA_TITLE_VISIBLE,
      STORAGE_KEY_ADVANCED_MODE,
      STORAGE_KEY_RECORDS,
      STORAGE_KEY_MAIN_MENU_VIEW,
      STORAGE_KEY_BRANDING_MODE,
      STORAGE_KEY_THEME_MODE,
      STORAGE_KEY_ACCENT_COLOR,
      STORAGE_KEY_TEXT_COLOR
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
    advancedModeEnabledBtn.addEventListener('click', () => setAdvancedMode(true, true)); // MODIFIED: Ensure shouldSave=true
  }
  if (advancedModeDisabledBtn) {
    advancedModeDisabledBtn.addEventListener('click', () => setAdvancedMode(false, true)); // MODIFIED: Ensure shouldSave=true
  }

  // Theme control listeners
  if (themeModeDarkBtn) {
    themeModeDarkBtn.addEventListener('click', () => {
      applyTheme('dark', accentColorPicker.value, textColorPicker.value);
      // When theme changes, re-apply branding to update icon color if TeamViewer
      const currentBrandingMode = brandingLunaBtn.classList.contains('selected') ? 'luna' : 'teamviewer';
      setBrandingMode(currentBrandingMode, 'dark', true);
    });
  }
  if (themeModeLightBtn) {
    themeModeLightBtn.addEventListener('click', () => {
      applyTheme('light', accentColorPicker.value, textColorPicker.value);
      // When theme changes, re-apply branding to update icon color if TeamViewer
      const currentBrandingMode = brandingLunaBtn.classList.contains('selected') ? 'luna' : 'teamviewer';
      setBrandingMode(currentBrandingMode, 'light', true);
    });
  }
  if (accentColorPicker) {
    accentColorPicker.addEventListener('input', () => {
      const currentMode = themeModeDarkBtn.classList.contains('selected') ? 'dark' : 'light';
      applyTheme(currentMode, accentColorPicker.value, textColorPicker.value);
    });
  }
  if (textColorPicker) {
    textColorPicker.addEventListener('input', () => {
      const currentMode = themeModeDarkBtn.classList.contains('selected') ? 'dark' : 'light';
      applyTheme(currentMode, accentColorPicker.value, textColorPicker.value);
    });
  }

  // Branding button listeners
  if (brandingLunaBtn) {
    brandingLunaBtn.addEventListener('click', () => setBrandingMode('luna', themeModeLightBtn.classList.contains('selected') ? 'light' : 'dark', true));
  }
  if (brandingTeamViewerBtn) {
    brandingTeamViewerBtn.addEventListener('click', () => setBrandingMode('teamviewer', themeModeLightBtn.classList.contains('selected') ? 'light' : 'dark', true));
  }
  // Reset All button click
  if (resetAllButton) {
    resetAllButton.addEventListener('click', resetAll);
  }

  // --- Initial Setup on DOM Load ---
  loadSettings();
});