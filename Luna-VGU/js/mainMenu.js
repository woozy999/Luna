// js/mainMenu.js

/**
 * Main Menu script for the Luna Chrome Extension.
 * Handles the display of the Luna title based on user settings and
 * loads/applies the user's selected theme and zoom level on page load.
 *
 * This script serves as the primary entry point for the side panel,
 * directing users to other functional pages (Quote Calculator, Record Log, Settings)
 * via direct HTML links.
 */

// Import utility functions (if needed in the future, currently not directly used here)
// import { formatCurrencyDisplay } from './utils.js'; 

document.addEventListener('DOMContentLoaded', () => {
  // --- Element References ---
  const lunaTitle = document.getElementById('extensionTitle');
  const toolsToggleBtn = document.getElementById('toolsToggleBtn');
  const logsToggleBtn = document.getElementById('logsToggleBtn');
  const toolsSection = document.getElementById('toolsSection');
  const logsSection = document.getElementById('logsSection');

  // --- Storage Keys ---
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel';
  const STORAGE_KEY_LUNA_TITLE_VISIBLE = 'lunaTitleVisible';
  const STORAGE_KEY_THEME_MODE = 'lunaThemeMode';
  const STORAGE_KEY_ACCENT_COLOR = 'lunaAccentColor';
  const STORAGE_KEY_TEXT_COLOR = 'lunaTextColor';
  const STORAGE_KEY_MAIN_MENU_VIEW = 'lunaMainMenuLastView'; // New storage key

  // --- Default Values ---
  const defaultZoomLevel = 1.0;
  const defaultLunaTitleVisible = true;
  const defaultThemeMode = 'dark';
  const defaultAccentColor = '#8e44ad';
  const defaultTextColor = '#a0c4ff';
  const defaultMainMenuLastView = 'tools'; // Default view for the main menu

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
   * Applies the selected theme mode and colors to the document.
   * @param {string} mode - 'dark' or 'light'.
   * @param {string} accentColor - The hex code for the accent color.
   * @param {string} textColor - The hex code for the highlight text color.
   */
  function applyTheme(mode, accentColor, textColor) {
    const body = document.body;
    const root = document.documentElement;

    body.classList.toggle('theme-dark', mode === 'dark');
    body.classList.toggle('theme-light', mode === 'light');

    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--text-highlight-color', textColor);
  }

  /**
   * Toggles the visibility of the Tools and Logs sections in the main menu.
   * @param {string} viewName - 'tools' or 'logs'.
   * @param {boolean} [shouldSave=true] - Whether to save the setting to storage.
   */
  function setMainMenuView(viewName, shouldSave = true) {
    // Update button visual state
    toolsToggleBtn.classList.toggle('selected', viewName === 'tools');
    logsToggleBtn.classList.toggle('selected', viewName === 'logs');

    // Update section visibility
    toolsSection.classList.toggle('hidden', viewName !== 'tools');
    logsSection.classList.toggle('hidden', viewName !== 'logs');

    // Save to storage
    if (shouldSave) {
      chrome.runtime.sendMessage({
        type: 'saveSetting',
        payload: { key: STORAGE_KEY_MAIN_MENU_VIEW, value: viewName }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('MainMenu: Error saving main menu view:', chrome.runtime.lastError.message);
        }
      });
    }
  }

  /**
   * Loads all relevant settings from Chrome storage and applies them to the UI.
   * This function runs on every page load to ensure consistency.
   */
  function loadGlobalSettings() {
    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_TEXT_COLOR, STORAGE_KEY_MAIN_MENU_VIEW],
      (result) => {
        // Apply Zoom Level
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || defaultZoomLevel;
        applyZoom(zoom);

        // Apply Luna Title Visibility
        const isTitleVisible = result[STORAGE_KEY_LUNA_TITLE_VISIBLE] !== false; // Default to true if undefined
        setLunaTitleVisibility(isTitleVisible);

        // Apply Theme
        const mode = result[STORAGE_KEY_THEME_MODE] || defaultThemeMode;
        const accent = result[STORAGE_KEY_ACCENT_COLOR] || defaultAccentColor;
        const text = result[STORAGE_KEY_TEXT_COLOR] || defaultTextColor;
        applyTheme(mode, accent, text);

        // Apply Main Menu View
        const lastView = result[STORAGE_KEY_MAIN_MENU_VIEW] || defaultMainMenuLastView;
        setMainMenuView(lastView, false); // Apply without saving again
      }
    );
  }

  // --- Event Listeners ---
  if (toolsToggleBtn) {
    toolsToggleBtn.addEventListener('click', () => setMainMenuView('tools'));
  }
  if (logsToggleBtn) {
    logsToggleBtn.addEventListener('click', () => setMainMenuView('logs'));
  }

  // --- Initial Setup on DOM Load ---
  loadGlobalSettings();
});