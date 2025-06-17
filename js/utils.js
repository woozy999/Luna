  // Formats a number to currency string ($123,456.78)
  function formatCurrencyDisplay(value) {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const cleanNumString = String(value).replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanNumString);
    if (isNaN(num)) {
      return '';
    }
    return `$${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  // Parses a formatted currency string back to a number
  function parseCurrencyInput(formattedValue) {
    if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
      return null;
    }
    const cleanValue = String(formattedValue).replace(/[$,]/g, '');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? null : num;
  }

  // Formats a percentage number to string (5.52%)
  function formatPercentageDisplay(value) {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    if (isNaN(num)) {
      return '';
    }
    return `${num.toFixed(2)}%`;
  }

  // Parses a percentage string back to a number
  function parsePercentageInput(formattedValue) {
    if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
      return null;
    }
    const cleanValue = String(formattedValue).replace(/%/g, '');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? null : num;
  }
  // --- Generate Timestamp for filename and display ---
  function generateTimestamp(forFilename = true) {
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
          return now.toLocaleString(); // More readable format for display
      }
  }
