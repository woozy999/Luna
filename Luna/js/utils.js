// js/utils.js

/**
 * Utility functions used across multiple parts of the Luna extension.
 * This script provides common formatting, parsing, and timestamp generation.
 */

/**
 * Formats a number to a currency string (e.g., $123,456.78).
 * Handles null, undefined, and empty string inputs gracefully.
 *
 * @param {string|number|null|undefined} value The value to format.
 * @returns {string} The formatted currency string or an empty string if invalid input.
 */
export function formatCurrencyDisplay(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  // Clean the input: remove non-numeric characters except for the decimal point
  const cleanNumString = String(value).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanNumString);

  if (isNaN(num)) {
    return '';
  }
  // Use toFixed(2) for two decimal places and add comma separators for thousands
  return `$${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Parses a formatted currency string back to a raw number.
 * Removes currency symbols and commas.
 *
 * @param {string|null|undefined} formattedValue The currency string to parse.
 * @returns {number|null} The parsed number, or null if the input is invalid.
 */
export function parseCurrencyInput(formattedValue) {
  if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
    return null;
  }
  // Remove '$' and ',' characters before parsing
  const cleanValue = String(formattedValue).replace(/[$,]/g, '');
  const num = parseFloat(cleanValue);
  return isNaN(num) ? null : num;
}

/**
 * Formats a number to a percentage string (e.g., 5.52%).
 * Handles null, undefined, and empty string inputs gracefully.
 *
 * @param {string|number|null|undefined} value The value to format.
 * @returns {string} The formatted percentage string or an empty string if invalid input.
 */
export function formatPercentageDisplay(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  // Clean the input: remove non-numeric characters except for the decimal point
  const cleanNumString = String(value).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanNumString);

  if (isNaN(num)) {
    return '';
  }
  // Use toFixed(2) for two decimal places
  return `${num.toFixed(2)}%`;
}

/**
 * Parses a percentage string back to a raw number.
 * Removes the '%' symbol.
 *
 * @param {string|null|undefined} formattedValue The percentage string to parse.
 * @returns {number|null} The parsed number, or null if the input is invalid.
 */
export function parsePercentageInput(formattedValue) {
  if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
    return null;
  }
  // Remove '%' character before parsing
  const cleanValue = String(formattedValue).replace(/%/g, '');
  const num = parseFloat(cleanValue);
  return isNaN(num) ? null : num;
}

/**
 * Generates a timestamp string.
 * Can be formatted for filenames (YYYYMMDD_HHMMSS) or for human-readable display (toLocaleString).
 *
 * @param {boolean} forFilename If true, returns YYYYMMDD_HHMMSS. Otherwise, returns locale-specific date/time.
 * @returns {string} The formatted timestamp.
 */
export function generateTimestamp(forFilename = true) {
  const now = new Date();
  if (forFilename) {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  } else {
    // Returns a locale-specific date and time string (e.g., "1/2/2023, 3:04:05 PM")
    return now.toLocaleString();
  }
}

/**
 * Converts a hex color string to an RGBA string.
 * @param {string} hex - The hex color code (e.g., "#RRGGBB").
 * @param {number} alpha - The alpha transparency (0.0 to 1.0).
 * @returns {string} The RGBA color string.
 */
export function hexToRgba(hex, alpha) {
    // If hex is invalid, return a default color
    if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        return `rgba(59, 130, 246, ${alpha})`; 
    }
    let c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return `rgba(${(c >> 16) & 255}, ${(c >> 8) & 255}, ${c & 255}, ${alpha})`;
}