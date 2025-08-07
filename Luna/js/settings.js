// js/settings.js

/**
 * Settings script for the Luna Chrome Extension.
 * Manages user preferences for magnification, Luna title visibility,
 * advanced mode, and theme selection.
 * Also provides a "Reset All" functionality to clear all stored data.
 */

import { hexToRgba } from './utils.js';

// Utility function to save the current page to storage
function saveCurrentPage(pagePath) {
    chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: 'lunaLastPage', value: pagePath } });
}

document.addEventListener('DOMContentLoaded', () => {
  saveCurrentPage('/html/settings.html'); // Save this page as the last visited

  // --- Element References ---
  const lunaTitle = document.getElementById('extensionTitle');
  
  // Settings Tabs & Content
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.settings-content');
  const STORAGE_KEY_LAST_TAB = 'lunaSettingsLastTab';

  // Settings controls
  const zoomSlider = document.getElementById('zoomSlider');
  const zoomValueDisplay = document.getElementById('zoomValueDisplay');
  const advancedModeEnabledBtn = document.getElementById('advancedModeEnabledBtn');
  const advancedModeDisabledBtn = document.getElementById('advancedModeDisabledBtn');
  const themeModeDarkBtn = document.getElementById('themeModeDarkBtn');
  const themeModeLightBtn = document.getElementById('themeModeLightBtn');
  const accentColorPicker = document.getElementById('accentColorPicker');
  const brandingLunaBtn = document.getElementById('brandingLunaBtn');
  const brandingTeamViewerBtn = document.getElementById('brandingTeamViewerBtn');
  const resetAllButton = document.getElementById('resetAllButton');
  const extensionVersion = document.getElementById('extensionVersion');

  // --- Storage Keys ---
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel';
  const STORAGE_KEY_ADVANCED_MODE = 'lunaAdvancedModeEnabled';
  const STORAGE_KEY_THEME_MODE = 'lunaThemeMode';
  const STORAGE_KEY_ACCENT_COLOR = 'lunaAccentColor';
  const STORAGE_KEY_BRANDING_MODE = 'lunaBrandingMode';

  // --- Default Values (for reset) ---
  const defaultZoomLevel = 1.0;
  const defaultAdvancedMode = false;
  const defaultThemeMode = 'dark';
  const defaultAccentColor = '#3B82F6';
  const defaultBrandingMode = 'luna';

  /**
   * Applies zoom by changing the root font size. This method is better for
   * preventing content from being cut off on high zoom levels.
   * @param {number} zoomLevel - The zoom level to apply (e.g., 1.0 for 100%).
   * @param {boolean} [shouldSave=true] - Whether to save the setting to storage.
   */
  function applyZoom(zoomLevel, shouldSave = true) {
    const baseFontSize = 14; // Base font size in pixels.
    document.documentElement.style.fontSize = `${baseFontSize * zoomLevel}px`;
    
    if (zoomValueDisplay) {
      zoomValueDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
    }
    
    if (shouldSave) {
      chrome.runtime.sendMessage({
        type: 'saveSetting',
        payload: { key: STORAGE_KEY_ZOOM, value: zoomLevel }
      });
    }
  }

  /**
   * Shows the specified settings tab and hides others.
   * @param {string} tabIdToShow - The data-tab value of the tab to show.
   */
  function showTab(tabIdToShow) {
    contents.forEach(content => {
      const contentTabId = content.id.split('-')[0];
      content.classList.toggle('active', contentTabId === tabIdToShow);
    });
    tabs.forEach(tab => {
      tab.classList.toggle('selected', tab.dataset.tab === tabIdToShow);
    });
    // Save the active tab
    chrome.runtime.sendMessage({
      type: 'saveSetting',
      payload: { key: STORAGE_KEY_LAST_TAB, value: tabIdToShow }
    });
  }

  function setAdvancedMode(isEnabled, shouldSave = true) {
    document.body.classList.toggle('advanced-mode-on', isEnabled);
    if (advancedModeEnabledBtn && advancedModeDisabledBtn) {
      advancedModeEnabledBtn.classList.toggle('selected', isEnabled);
      advancedModeDisabledBtn.classList.toggle('selected', !isEnabled);
    }
    if (shouldSave) {
      chrome.runtime.sendMessage({
        type: 'saveSetting',
        payload: { key: STORAGE_KEY_ADVANCED_MODE, value: isEnabled }
      });
    }
  }

  function applyTheme(mode, accentColor, shouldSave = true) {
    const body = document.body;
    const root = document.documentElement;

    body.classList.toggle('theme-dark', mode === 'dark');
    body.classList.toggle('theme-light', mode === 'light');
    if (themeModeDarkBtn) themeModeDarkBtn.classList.toggle('selected', mode === 'dark');
    if (themeModeLightBtn) themeModeLightBtn.classList.toggle('selected', mode === 'light');

    root.style.setProperty('--primary-accent', accentColor);
    root.style.setProperty('--primary-accent-shadow', hexToRgba(accentColor, 0.2));
    if (accentColorPicker) accentColorPicker.value = accentColor;

    if (shouldSave) {
      chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: STORAGE_KEY_THEME_MODE, value: mode } });
      chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: STORAGE_KEY_ACCENT_COLOR, value: accentColor } });
    }
  }

  function setBrandingMode(brandingMode, themeMode, shouldSave = true) {
    if (brandingLunaBtn && brandingTeamViewerBtn) {
      brandingLunaBtn.classList.toggle('selected', brandingMode === 'luna');
      brandingTeamViewerBtn.classList.toggle('selected', brandingMode === 'teamviewer');
    }

    const extensionIcon = document.querySelector('.extensionIcon');
    const extensionTitle = document.getElementById('extensionTitle');

    if (extensionIcon) {
      extensionIcon.src = brandingMode === 'luna' ? '../icons/logo.png' : '../icons/tvicon.png';
      extensionIcon.classList.toggle('inverted', brandingMode === 'teamviewer' && themeMode === 'dark');
    }
    if (extensionTitle) {
      extensionTitle.classList.toggle('hidden-title', brandingMode === 'teamviewer');
    }

    if (shouldSave) {
      chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: STORAGE_KEY_BRANDING_MODE, value: brandingMode } });
    }
  }

  function loadSettings() {
    if (extensionVersion) {
      const manifest = chrome.runtime.getManifest();
      extensionVersion.textContent = manifest.version;
    }

    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_ADVANCED_MODE, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_BRANDING_MODE, STORAGE_KEY_LAST_TAB],
      (result) => {
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || defaultZoomLevel;
        if (zoomSlider) zoomSlider.value = zoom;
        applyZoom(zoom, false);

        const isAdvanced = result[STORAGE_KEY_ADVANCED_MODE] === true;
        setAdvancedMode(isAdvanced, false);

        const mode = result[STORAGE_KEY_THEME_MODE] || defaultThemeMode;
        const accent = result[STORAGE_KEY_ACCENT_COLOR] || defaultAccentColor;
        applyTheme(mode, accent, false);

        const brandingMode = result[STORAGE_KEY_BRANDING_MODE] || defaultBrandingMode;
        setBrandingMode(brandingMode, mode, false);
        
        const lastTabId = result[STORAGE_KEY_LAST_TAB] || 'visual';
        showTab(lastTabId);
      }
    );
  }

  function resetAll() {
    if (!confirm('Are you sure you want to reset ALL data and settings to default? This cannot be undone.')) {
      return;
    }
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        console.error('Settings: Error clearing storage during reset:', chrome.runtime.lastError.message);
      } else {
        console.log('Settings: All storage cleared. Reloading settings with defaults.');
        loadSettings();
        alert('All settings and data have been reset to defaults.');
      }
    });
  }

  // --- Event Listeners ---
  tabs.forEach(tab => {
    tab.addEventListener('click', () => showTab(tab.dataset.tab));
  });
  
  if (zoomSlider) {
    zoomSlider.addEventListener('input', (event) => {
      applyZoom(parseFloat(event.target.value));
    });
  }
  
  if (advancedModeEnabledBtn) {
    advancedModeEnabledBtn.addEventListener('click', () => setAdvancedMode(true));
  }
  if (advancedModeDisabledBtn) {
    advancedModeDisabledBtn.addEventListener('click', () => setAdvancedMode(false));
  }
  
  const currentTheme = () => document.body.classList.contains('theme-dark') ? 'dark' : 'light';

  if (themeModeDarkBtn) {
    themeModeDarkBtn.addEventListener('click', () => {
      applyTheme('dark', accentColorPicker.value);
      setBrandingMode(brandingLunaBtn.classList.contains('selected') ? 'luna' : 'teamviewer', 'dark', true);
    });
  }
  if (themeModeLightBtn) {
    themeModeLightBtn.addEventListener('click', () => {
      applyTheme('light', accentColorPicker.value);
      setBrandingMode(brandingLunaBtn.classList.contains('selected') ? 'luna' : 'teamviewer', 'light', true);
    });
  }
  
  if (accentColorPicker) {
    accentColorPicker.addEventListener('input', () => {
      applyTheme(currentTheme(), accentColorPicker.value);
    });
  }
  
  if (brandingLunaBtn) {
    brandingLunaBtn.addEventListener('click', () => setBrandingMode('luna', currentTheme(), true));
  }
  if (brandingTeamViewerBtn) {
    brandingTeamViewerBtn.addEventListener('click', () => setBrandingMode('teamviewer', currentTheme(), true));
  }
  
  if (resetAllButton) {
    resetAllButton.addEventListener('click', resetAll);
  }

  // --- Initial Setup on DOM Load ---
  loadSettings();
});