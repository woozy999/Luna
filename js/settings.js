// settings.js
import { STORAGE_KEY_LUNA_TITLE_VISIBLE, STORAGE_KEY_ADVANCED_MODE, STORAGE_KEY_THEME } from './state.js';

let isAdvancedModeEnabled = false;

export function applyZoom(zoomLevel) {
  document.body.style.zoom = zoomLevel;
}

export function setZoomSelection(selectedZoomLevel) {
  const zoomSlider = document.getElementById('zoomSlider');
  const zoomValueDisplay = document.getElementById('zoomValueDisplay');
  const roundedZoomLevel = Math.round(selectedZoomLevel * 20) / 20;
  if (zoomSlider) {
    zoomSlider.value = roundedZoomLevel;
  }
  if (zoomValueDisplay) {
    zoomValueDisplay.textContent = `${Math.round(roundedZoomLevel * 100)}%`;
  }
  applyZoom(roundedZoomLevel);
  setTimeout(() => {
    chrome.runtime.sendMessage({ type: 'saveZoomLevel', zoomLevel: roundedZoomLevel }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error sending zoom level to background (after timeout):', chrome.runtime.lastError.message);
      }
    });
  }, 50);
}

export function setLunaTitleVisibility(isVisible, shouldSave = true) {
  const lunaTitle = document.getElementById('lunaTitle');
  const visibleBtn = document.getElementById('lunaTitleVisible');
  const hiddenBtn = document.getElementById('lunaTitleHidden');
  if (lunaTitle) {
    lunaTitle.classList.toggle('hidden-title', !isVisible);
  }
  if (visibleBtn && hiddenBtn) {
    if (isVisible) {
      visibleBtn.classList.add('selected');
      hiddenBtn.classList.remove('selected');
    } else {
      visibleBtn.classList.remove('selected');
      hiddenBtn.classList.add('selected');
    }
  }
  if (shouldSave) {
    chrome.storage.local.set({ [STORAGE_KEY_LUNA_TITLE_VISIBLE]: isVisible }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving Luna title visibility:', chrome.runtime.lastError.message);
      }
    });
  }
}

export function setAdvancedMode(isEnabled, shouldSave = true) {
  const erpLinkGroup = document.getElementById('erpLinkGroup');
  const enabledBtn = document.getElementById('advancedModeEnabledBtn');
  const disabledBtn = document.getElementById('advancedModeDisabledBtn');
  isAdvancedModeEnabled = isEnabled;
  if (erpLinkGroup) erpLinkGroup.classList.toggle('hidden', !isEnabled);
  if (enabledBtn && disabledBtn) {
    if (isEnabled) {
      enabledBtn.classList.add('selected');
      disabledBtn.classList.remove('selected');
    } else {
      enabledBtn.classList.remove('selected');
      disabledBtn.classList.add('selected');
    }
  }
  if (shouldSave) {
    chrome.storage.local.set({ [STORAGE_KEY_ADVANCED_MODE]: isEnabled }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving Advanced Mode state:', chrome.runtime.lastError.message);
      }
    });
  }
}

export function setTheme(themeName, shouldSave = true) {
  const body = document.body;
  const themeButtons = document.querySelectorAll('.theme-button');
  ['purple', 'blue', 'green', 'pink', 'orange', 'red', 'yellow', 'white'].forEach(theme => {
    body.classList.remove(`theme-${theme}`);
  });
  body.classList.add(`theme-${themeName}`);
  themeButtons.forEach(button => {
    if (button.dataset.theme === themeName) {
      button.classList.add('selected');
    } else {
      button.classList.remove('selected');
    }
  });
  if (shouldSave) {
    chrome.storage.local.set({ [STORAGE_KEY_THEME]: themeName }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving theme:', chrome.runtime.lastError.message);
      }
    });
  }
}
