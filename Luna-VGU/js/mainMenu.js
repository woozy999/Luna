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

  // --- Storage Keys ---
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel';
  const STORAGE_KEY_LUNA_TITLE_VISIBLE = 'lunaTitleVisible';
  const STORAGE_KEY_THEME = 'lunaTheme';

  // --- Default Values ---
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
    // Remove all existing theme classes to ensure only one is active
    ['purple', 'blue', 'green', 'pink', 'orange', 'red', 'yellow', 'white'].forEach(theme => {
      body.classList.remove(`theme-${theme}`);
    });
    // Add the selected theme class
    body.classList.add(`theme-${themeName}`);
  }

  /**
   * Loads all relevant settings from Chrome storage and applies them to the UI.
   * This function runs on every page load to ensure consistency.
   */
  function loadGlobalSettings() {
    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_THEME],
      (result) => {
        // Apply Zoom Level
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || defaultZoomLevel;
        applyZoom(zoom);

        // Apply Luna Title Visibility
        const isTitleVisible = result[STORAGE_KEY_LUNA_TITLE_VISIBLE] !== false; // Default to true if undefined
        setLunaTitleVisibility(isTitleVisible);

        // Apply Theme
        const theme = result[STORAGE_KEY_THEME] || defaultTheme;
        setTheme(theme);
      }
    );
  }

  // --- Initial Setup on DOM Load ---
  // Load global settings (zoom, title visibility, theme) when the main menu page loads.
  loadGlobalSettings();

  // No specific event listeners are needed for menu navigation as it uses direct `<a>` tags.
  // The global settings are loaded here to apply to the main menu itself.
});