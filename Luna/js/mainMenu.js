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
  const STORAGE_KEY_LAST_PAGE = 'lunaLastPage'; 
  const STORAGE_KEY_BRANDING_MODE = 'lunaBrandingMode'; // ADDED: New storage key

  // --- Default Values ---
  const defaultZoomLevel = 1.0;
  const defaultLunaTitleVisible = true;
  const defaultThemeMode = 'dark';
  const defaultAccentColor = '#51a3f9';
  const defaultTextColor = '#ed5653';
  const defaultMainMenuLastView = 'tools'; // Default view for the main menu
  const defaultLastPage = '/html/mainMenu.html';
  const defaultBrandingMode = 'luna'; // ADDED: Default branding mode

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
   * Sets the branding mode (Luna or TeamViewer) and updates UI elements.
   * This function is needed on every page to ensure consistent branding.
   * @param {string} brandingMode - 'luna' or 'teamviewer'.
   * @param {string} themeMode - 'dark' or 'light'. // ADDED: themeMode parameter
   * @param {boolean} [shouldSave=false] - Whether to save the setting to storage (only settings page saves).
   */
  function setBrandingMode(brandingMode, themeMode, shouldSave = false) { // MODIFIED: Added themeMode param, default shouldSave
    const extensionIcon = document.querySelector('.extensionIcon');
    const extensionTitle = document.getElementById('extensionTitle'); // 'Luna' text

    if (extensionIcon) {
      extensionIcon.src = brandingMode === 'luna' ? '../icons/logo.png' : '../icons/tvicon.png';
      // Apply invert filter ONLY if TeamViewer branding AND Dark Mode
      extensionIcon.classList.toggle('inverted', brandingMode === 'teamviewer' && themeMode === 'dark'); // MODIFIED: Apply/remove 'inverted' class
    }
    if (extensionTitle) {
      extensionTitle.classList.toggle('hidden-title', brandingMode === 'teamviewer');
    }

    // Save to storage
    if (shouldSave && typeof chrome !== 'undefined' && chrome.runtime) { // MODIFIED: Added check for chrome.runtime in case of isolated testing
      chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: STORAGE_KEY_BRANDING_MODE, value: brandingMode } });
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
      [STORAGE_KEY_ZOOM, STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_TEXT_COLOR, STORAGE_KEY_MAIN_MENU_VIEW, STORAGE_KEY_LAST_PAGE, STORAGE_KEY_BRANDING_MODE], // MODIFIED: Added STORAGE_KEY_BRANDING_MODE
      (result) => {
        // Check for 'fromBack' parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const cameFromBackButton = urlParams.get('fromBack') === 'true';

        // Apply Zoom Level
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || defaultZoomLevel;
        applyZoom(zoom);

        // Apply Luna Title Visibility
        const isTitleVisible = result[STORAGE_KEY_LUNA_TITLE_VISIBLE] !== false;
        // setLunaTitleVisibility(isTitleVisible); // Commented out as branding mode will control visual hiding

        // Apply Theme
        const mode = result[STORAGE_KEY_THEME_MODE] || defaultThemeMode;
        const accent = result[STORAGE_KEY_ACCENT_COLOR] || defaultAccentColor;
        const text = result[STORAGE_KEY_TEXT_COLOR] || defaultTextColor;
        applyTheme(mode, accent, text);

        // Apply Branding Mode
        const brandingMode = result[STORAGE_KEY_BRANDING_MODE] || defaultBrandingMode;
        setBrandingMode(brandingMode, mode); // MODIFIED: Call setBrandingMode, passing theme 'mode'

        // Apply Luna Title Visibility based on settings AND branding
        if (lunaTitle) {
          const hideBasedOnSetting = result[STORAGE_KEY_LUNA_TITLE_VISIBLE] === false;
          const hideBasedOnBranding = brandingMode === 'teamviewer';
          lunaTitle.classList.toggle('hidden-title', hideBasedOnSetting || hideBasedOnBranding);
        }


        // Apply Main Menu View
        const lastView = result[STORAGE_KEY_MAIN_MENU_VIEW] || defaultMainMenuLastView;
        setMainMenuView(lastView, false);

        // Logic for Last Page Redirection
        const lastPage = result[STORAGE_KEY_LAST_PAGE] || defaultLastPage;

        // If we came from a back button, or if the last saved page was specifically the main menu,
        // then stay on the main menu and update the stored last page.
        // Otherwise, if the current page is mainMenu.html and there's a different lastPage, redirect.
        if (cameFromBackButton || lastPage === '/html/mainMenu.html') {
          saveCurrentPage('/html/mainMenu.html'); 
        } else if (window.location.pathname.endsWith('/mainMenu.html') && lastPage !== '/html/mainMenu.html') {
          // This means we just landed on mainMenu.html, but the last page should be a sub-page
          console.log(`MainMenu: Redirecting to last visited page: ${lastPage}`);
          window.location.href = lastPage;
        }
        // If we are already on a sub-page (because we were redirected earlier or opened directly to it),
        // no action needed here, as the sub-page's script already saved its path.
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