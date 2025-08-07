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

import { hexToRgba } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- Element References ---
  const lunaTitle = document.getElementById('extensionTitle');
  const toolsToggleBtn = document.getElementById('toolsToggleBtn');
  const logsToggleBtn = document.getElementById('logsToggleBtn');
  const toolsSection = document.getElementById('toolsSection');
  const logsSection = document.getElementById('logsSection');

  // --- Storage Keys ---
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel';
  const STORAGE_KEY_THEME_MODE = 'lunaThemeMode';
  const STORAGE_KEY_ACCENT_COLOR = 'lunaAccentColor';
  const STORAGE_KEY_MAIN_MENU_VIEW = 'lunaMainMenuLastView'; // New storage key
  const STORAGE_KEY_LAST_PAGE = 'lunaLastPage'; 
  const STORAGE_KEY_BRANDING_MODE = 'lunaBrandingMode';

  // --- Default Values ---
  const defaultZoomLevel = 1.0;
  const defaultThemeMode = 'dark';
  const defaultAccentColor = '#3B82F6';
  const defaultMainMenuLastView = 'tools'; // Default view for the main menu
  const defaultLastPage = '/html/mainMenu.html';
  const defaultBrandingMode = 'luna';

  /**
   * Applies the saved zoom level to the document by changing the root font size.
   * @param {number} zoomLevel - The zoom level to apply (e.g., 1.0 for 100%).
   */
  function applyZoom(zoomLevel) {
    const baseFontSize = 14; // Base font size in pixels.
    document.documentElement.style.fontSize = `${baseFontSize * zoomLevel}px`;
  }

  /**
   * Applies the selected theme mode and colors to the document.
   * @param {string} mode - 'dark' or 'light'.
   * @param {string} accentColor - The hex code for the accent color.
   */
  function applyTheme(mode, accentColor) {
    const body = document.body;
    const root = document.documentElement;

    body.classList.toggle('theme-dark', mode === 'dark');
    body.classList.toggle('theme-light', mode === 'light');

    root.style.setProperty('--primary-accent', accentColor);
    root.style.setProperty('--primary-accent-shadow', hexToRgba(accentColor, 0.2));
  }

  /**
   * Sets the branding mode (Luna or TeamViewer) and updates UI elements.
   * @param {string} brandingMode - 'luna' or 'teamviewer'.
   * @param {string} themeMode - 'dark' or 'light'.
   */
  function setBrandingMode(brandingMode, themeMode) {
    const extensionIcon = document.querySelector('.extensionIcon');
    const extensionTitle = document.getElementById('extensionTitle');

    if (extensionIcon) {
      extensionIcon.src = brandingMode === 'luna' ? '../icons/logo.png' : '../icons/tvicon.png';
      extensionIcon.classList.toggle('inverted', brandingMode === 'teamviewer' && themeMode === 'dark');
    }
    if (extensionTitle) {
      extensionTitle.classList.toggle('hidden-title', brandingMode === 'teamviewer');
    }
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
   * Saves the current page to storage.
   * This function should be called by other pages when they load.
   */
  function saveCurrentPage(pagePath) {
    chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: 'lunaLastPage', value: pagePath } });
  }

  /**
   * Loads all relevant settings from Chrome storage and applies them to the UI.
   * This function runs on every page load to ensure consistency.
   */
  function loadGlobalSettings() {
    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_MAIN_MENU_VIEW, STORAGE_KEY_LAST_PAGE, STORAGE_KEY_BRANDING_MODE],
      (result) => {
        // Check for 'fromBack' parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const cameFromBackButton = urlParams.get('fromBack') === 'true';

        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || defaultZoomLevel;
        applyZoom(zoom);

        const mode = result[STORAGE_KEY_THEME_MODE] || defaultThemeMode;
        const accent = result[STORAGE_KEY_ACCENT_COLOR] || defaultAccentColor;
        applyTheme(mode, accent);

        const brandingMode = result[STORAGE_KEY_BRANDING_MODE] || defaultBrandingMode;
        setBrandingMode(brandingMode, mode);

        const lastView = result[STORAGE_KEY_MAIN_MENU_VIEW] || defaultMainMenuLastView;
        setMainMenuView(lastView, false);

        // Logic for Last Page Redirection
        const lastPage = result[STORAGE_KEY_LAST_PAGE] || defaultLastPage;

        if (cameFromBackButton || lastPage === '/html/mainMenu.html') {
          saveCurrentPage('/html/mainMenu.html'); 
        } else if (window.location.pathname.endsWith('/mainMenu.html') && lastPage !== '/html/mainMenu.html') {
          console.log(`MainMenu: Redirecting to last visited page: ${lastPage}`);
          window.location.href = lastPage;
        }
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