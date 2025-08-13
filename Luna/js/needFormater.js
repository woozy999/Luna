// js/needFormater.js

/**
 * Need Formatter script for the Luna Chrome Extension.
 * Formats user-entered customer need details into a structured output.
 * Also includes a response template generator.
 */

import { generateTimestamp, hexToRgba } from './utils.js'; 

// ADDED: Utility function to save the current page to storage (for "remember last page")
function saveCurrentPage(pagePath) {
    chrome.runtime.sendMessage({ type: 'saveSetting', payload: { key: 'lunaLastPage', value: pagePath } });
}

document.addEventListener('DOMContentLoaded', () => {
  saveCurrentPage('/html/needFormater.html'); // Save this page as the last visited (corrected to absolute path)

  // --- Element References ---
  const lunaTitle = document.getElementById('extensionTitle');

  // View Toggling
  const needFormatterToggleBtn = document.getElementById('needFormatterToggleBtn');
  const responseToggleBtn = document.getElementById('responseToggleBtn');
  const needFormatterViewContainer = document.getElementById('needFormatterViewContainer');
  const responseViewContainer = document.getElementById('responseViewContainer');
  const calculatorFooter = document.getElementById('calculatorFooter');

  // Original Formatter Elements
  const ticketNumberInput = document.getElementById('ticketNumberInput');
  const statusPaidBtn = document.getElementById('statusPaid');
  const statusPostedBtn = document.getElementById('statusPosted');
  const customerRequestInput = document.getElementById('customerRequestInput');
  const customerEmailInput = document.getElementById('customerEmailInput');
  const customerPhoneNumberInput = document.getElementById('customerPhoneNumberInput');
  const additionalCommentsInput = document.getElementById('additionalCommentsInput');
  const formattedOutput = document.getElementById('formattedOutput');
  const copyOutputBtn = document.getElementById('copyOutputBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  
  // New Response Template Elements
  const newTemplateBtn = document.getElementById('newTemplateBtn');
  const newFolderBtn = document.getElementById('newFolderBtn');
  const templateBrowser = document.getElementById('templateBrowser');
  const templateNameInput = document.getElementById('templateNameInput');
  const templateFolderSelect = document.getElementById('templateFolderSelect');
  const templateBodyInput = document.getElementById('templateBodyInput');
  const saveTemplateBtn = document.getElementById('saveTemplateBtn');
  const deleteTemplateBtn = document.getElementById('deleteTemplateBtn');
  const importTemplatesBtn = document.getElementById('importTemplatesBtn');
  const exportTemplatesBtn = document.getElementById('exportTemplatesBtn');
  const templateFileInput = document.getElementById('templateFileInput');
  const dynamicInputsContainer = document.getElementById('dynamicInputsContainer');
  const responseOutput = document.getElementById('responseOutput');
  const copyResponseBtn = document.getElementById('copyResponseBtn');
  
  // --- Storage Keys ---
  const STORAGE_KEY_INPUTS = 'lunaNeedFormatterInputs'; // For original formatter
  const STORAGE_KEY_RESPONSE_STATE = 'lunaResponseState'; // For response tab state
  const STORAGE_KEY_TEMPLATES = 'lunaResponseTemplates'; // For saving templates
  const STORAGE_KEY_FOLDERS = 'lunaResponseFolders'; // For permanent folders
  const STORAGE_KEY_ACTIVE_VIEW = 'lunaNeedFormatterActiveView'; // To remember the active tab
  const STORAGE_KEY_ZOOM = 'lunaZoomLevel';
  const STORAGE_KEY_THEME_MODE = 'lunaThemeMode';
  const STORAGE_KEY_ACCENT_COLOR = 'lunaAccentColor';
  const STORAGE_KEY_BRANDING_MODE = 'lunaBrandingMode';
  const STORAGE_KEY_CARD_STATES = 'lunaNeedCardStates'; // For collapsible cards

  // --- Global State ---
  let templates = [];
  let folders = [];
  let selectedTemplateId = null;

  // --- Default Values ---
  const defaultNeedFormatterInputs = {
    ticketNumber: '', invoiceStatus: 'Paid', customerRequest: '',
    customerEmail: '', customerPhoneNumber: '', additionalComments: ''
  };
  const defaultResponseState = {
    selectedTemplateId: null,
    dynamicInputs: {}
  };
  const defaultBrandingMode = 'luna';
  const defaultThemeMode = 'dark';
  const defaultAccentColor = '#3B82F6';

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
   * Applies the saved zoom level to the document by changing the root font size.
   * @param {number} zoomLevel - The zoom level to apply (e.g., 1.0 for 100%).
   */
  function applyZoom(zoomLevel) {
    const baseFontSize = 14; // Base font size in pixels.
    document.documentElement.style.fontSize = `${baseFontSize * zoomLevel}px`;
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
   * Loads global settings (theme, zoom, title visibility) from storage.
   */
  function loadGlobalSettings() {
    chrome.storage.local.get(
      [STORAGE_KEY_ZOOM, STORAGE_KEY_THEME_MODE, STORAGE_KEY_ACCENT_COLOR, STORAGE_KEY_BRANDING_MODE],
      (result) => {
        const zoom = parseFloat(result[STORAGE_KEY_ZOOM]) || 1.0;
        applyZoom(zoom);
        const mode = result[STORAGE_KEY_THEME_MODE] || defaultThemeMode;
        const accent = result[STORAGE_KEY_ACCENT_COLOR] || defaultAccentColor;
        applyTheme(mode, accent);
        const brandingMode = result[STORAGE_KEY_BRANDING_MODE] || defaultBrandingMode;
        setBrandingMode(brandingMode, mode);
      }
    );
  }

  // --- View Management ---
  function setView(viewName) {
    const isFormatter = viewName === 'formatter';
    needFormatterToggleBtn.classList.toggle('selected', isFormatter);
    responseToggleBtn.classList.toggle('selected', !isFormatter);
    needFormatterViewContainer.classList.toggle('hidden', !isFormatter);
    responseViewContainer.classList.toggle('hidden', isFormatter);
    chrome.storage.local.set({ [STORAGE_KEY_ACTIVE_VIEW]: viewName });
  }

  // =================================================================
  // ORIGINAL NEED FORMATTER LOGIC
  // =================================================================

  function getFormatterInputsState() {
    return {
      ticketNumber: ticketNumberInput ? ticketNumberInput.value.trim() : '',
      invoiceStatus: statusPaidBtn && statusPaidBtn.classList.contains('selected') ? 'Paid' : 'Posted',
      customerRequest: customerRequestInput ? customerRequestInput.value.trim() : '',
      customerEmail: customerEmailInput ? customerEmailInput.value.trim() : '',
      customerPhoneNumber: customerPhoneNumberInput ? customerPhoneNumberInput.value.trim() : '',
      additionalComments: additionalCommentsInput ? additionalCommentsInput.value.trim() : ''
    };
  }

  function saveFormatterInputs() {
    const inputs = getFormatterInputsState();
    chrome.runtime.sendMessage({
      type: 'saveSetting',
      payload: { key: STORAGE_KEY_INPUTS, value: inputs }
    });
  }

  function loadFormatterInputs() {
    chrome.storage.local.get([STORAGE_KEY_INPUTS], (result) => {
      const savedInputs = result[STORAGE_KEY_INPUTS] || defaultNeedFormatterInputs;
      if (ticketNumberInput) ticketNumberInput.value = savedInputs.ticketNumber;
      if (statusPaidBtn && statusPostedBtn) {
        if (savedInputs.invoiceStatus === 'Paid') {
          statusPaidBtn.classList.add('selected');
          statusPostedBtn.classList.remove('selected');
        } else {
          statusPaidBtn.classList.remove('selected');
          statusPostedBtn.classList.add('selected');
        }
      }
      if (customerRequestInput) customerRequestInput.value = savedInputs.customerRequest;
      if (customerEmailInput) customerEmailInput.value = savedInputs.customerEmail;
      if (customerPhoneNumberInput) customerPhoneNumberInput.value = savedInputs.customerPhoneNumber;
      if (additionalCommentsInput) additionalCommentsInput.value = savedInputs.additionalComments;
      updateFormattedOutput();
    });
  }

  function updateFormattedOutput() {
    const inputs = getFormatterInputsState();
    let outputParts = [];
    if (inputs.ticketNumber) outputParts.push(`Ticket: ${inputs.ticketNumber}`);
    if (inputs.invoiceStatus) outputParts.push(`Invoice Status: ${inputs.invoiceStatus}`);
    if (inputs.customerRequest) outputParts.push(`Customer Need: ${inputs.customerRequest}`);
    if (inputs.customerEmail) outputParts.push(`Email: ${inputs.customerEmail}`);
    if (inputs.customerPhoneNumber) outputParts.push(`Phone Number: ${inputs.customerPhoneNumber}`);
    if (inputs.additionalComments) outputParts.push(`Additional Comments: ${inputs.additionalComments}`);
    if (formattedOutput) formattedOutput.textContent = outputParts.join('\n\n').trim();
  }

  function clearFormatterInputs() {
    if (ticketNumberInput) ticketNumberInput.value = defaultNeedFormatterInputs.ticketNumber;
    if (statusPaidBtn && statusPostedBtn) {
      statusPaidBtn.classList.add('selected');
      statusPostedBtn.classList.remove('selected');
    }
    if (customerRequestInput) customerRequestInput.value = defaultNeedFormatterInputs.customerRequest;
    if (customerEmailInput) customerEmailInput.value = defaultNeedFormatterInputs.customerEmail;
    if (customerPhoneNumberInput) customerPhoneNumberInput.value = defaultNeedFormatterInputs.customerPhoneNumber;
    if (additionalCommentsInput) additionalCommentsInput.value = defaultNeedFormatterInputs.additionalComments;
    saveFormatterInputs();
    updateFormattedOutput();
  }

  async function copyRichTextToClipboard(text, html, button, originalText) {
    try {
        const htmlBlob = new Blob([html], { type: 'text/html' });
        const textBlob = new Blob([text], { type: 'text/plain' });
        const clipboardItem = new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
        });
        await navigator.clipboard.write([clipboardItem]);
        button.textContent = 'Copied!';
        setTimeout(() => { button.textContent = originalText; }, 1500);
    } catch (err) {
        console.error('Could not copy rich text: ', err);
        navigator.clipboard.writeText(text).then(() => {
            button.textContent = 'Copied (plain)!';
            setTimeout(() => { button.textContent = originalText; }, 1500);
        }).catch(fallbackErr => {
            alert('Failed to copy. Please try manually.');
            console.error('Fallback copy failed: ', fallbackErr);
        });
    }
  }


  // =================================================================
  // NEW RESPONSE TEMPLATE LOGIC
  // =================================================================
  
  function getPlaceholders(text) {
      const regex = /{{\s*([a-zA-Z0-9_]+)(?::([^}]+))?\s*}}/g;
      const placeholders = [];
      let match;
      while ((match = regex.exec(text)) !== null) {
          const name = match[1];
          const options = match[2];
          if (!placeholders.some(p => p.name === name)) {
              placeholders.push({
                  name: name,
                  type: options ? 'dropdown' : 'simple',
                  options: options ? options.split('|').map(o => o.trim()) : []
              });
          }
      }
      return placeholders;
  }

  function renderDynamicInputs(templateId) {
      const template = templates.find(t => t.id == templateId);
      dynamicInputsContainer.innerHTML = '';
      if (!template) {
          dynamicInputsContainer.innerHTML = '<p class="text-secondary">Select a template to see its fields.</p>';
          updateResponseOutput();
          return;
      }
      const placeholders = getPlaceholders(template.body);
      if (placeholders.length === 0) {
          dynamicInputsContainer.innerHTML = '<p class="text-secondary">This template has no fillable fields.</p>';
          updateResponseOutput();
          return;
      }
      
      chrome.storage.local.get([STORAGE_KEY_RESPONSE_STATE], (result) => {
        const state = result[STORAGE_KEY_RESPONSE_STATE] || defaultResponseState;
        placeholders.forEach(p => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'input-group';
            const label = document.createElement('label');
            label.textContent = p.name.replace(/_/g, ' ');
            
            let inputElement;
            if (p.type === 'dropdown') {
                inputElement = document.createElement('select');
                p.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    inputElement.appendChild(option);
                });
            } else {
                inputElement = document.createElement('input');
                inputElement.type = 'text';
            }

            inputElement.id = `dyn-input-${p.name}`;
            inputElement.dataset.placeholder = p.name;
            inputElement.value = state.dynamicInputs[p.name] || (p.type === 'dropdown' ? p.options[0] : '');
            
            inputElement.addEventListener('input', () => {
                updateResponseOutput();
                saveResponseState();
            });

            inputGroup.appendChild(label);
            inputGroup.appendChild(inputElement);
            dynamicInputsContainer.appendChild(inputGroup);
        });
        updateResponseOutput();
      });
  }

  function updateResponseOutput() {
      const template = templates.find(t => t.id == selectedTemplateId);
      if (!template) {
          responseOutput.innerHTML = '';
          return;
      }
      let outputHtml = template.body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      outputHtml = outputHtml.replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>')
                             .replace(/&lt;i&gt;/g, '<i>').replace(/&lt;\/i&gt;/g, '</i>')
                             .replace(/&lt;u&gt;/g, '<u>').replace(/&lt;\/u&gt;/g, '</u>');

      const placeholders = getPlaceholders(template.body);
      
      placeholders.forEach(p => {
          const input = document.getElementById(`dyn-input-${p.name}`);
          let value = input ? input.value : '';
          value = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

          const regex = new RegExp(`{{\\s*${p.name}(?::[^}]+)?\\s*}}`, 'g');
          outputHtml = outputHtml.replace(regex, value);
      });
      
      responseOutput.innerHTML = outputHtml;
  }
  
  function saveResponseState() {
      const dynamicInputs = {};
      document.querySelectorAll('#dynamicInputsContainer input, #dynamicInputsContainer select').forEach(input => {
          dynamicInputs[input.dataset.placeholder] = input.value;
      });
      const state = { selectedTemplateId, dynamicInputs };
      chrome.storage.local.set({ [STORAGE_KEY_RESPONSE_STATE]: state });
  }

  function renderTemplateBrowser() {
      const templateFolders = [...new Set(templates.map(t => t.folder).filter(Boolean))];
      const allFolderNames = [...new Set([...folders, ...templateFolders])];

      const grouped = templates.reduce((acc, t) => {
          const folder = t.folder || 'Uncategorized';
          if (!acc[folder]) acc[folder] = [];
          acc[folder].push(t);
          return acc;
      }, {});

      // Ensure all permanent folders are present, even if empty
      allFolderNames.forEach(name => {
          if (!grouped[name]) grouped[name] = [];
      });

      templateBrowser.innerHTML = '';
      const sortedFolders = Object.keys(grouped).sort((a, b) => a.localeCompare(b, undefined, { caseFirst: 'upper' }));
      if (sortedFolders.includes('Uncategorized')) {
          sortedFolders.push(sortedFolders.splice(sortedFolders.indexOf('Uncategorized'), 1)[0]);
      }
      
      sortedFolders.forEach(folderName => {
          const folderLi = document.createElement('li');
          folderLi.className = 'folder-item';

          const folderHeader = document.createElement('div');
          folderHeader.className = 'folder-header';
          
          const folderNameDiv = document.createElement('div');
          folderNameDiv.className = 'folder-name';
          folderNameDiv.textContent = folderName;
          
          const folderActions = document.createElement('div');
          folderActions.className = 'folder-actions';

          if (folderName !== 'Uncategorized') {
              const editBtn = document.createElement('button');
              editBtn.innerHTML = '✏️';
              editBtn.title = 'Rename Folder';
              editBtn.className = 'folder-action-icon edit-icon';
              editBtn.onclick = (e) => { e.stopPropagation(); handleRenameFolder(folderName); };
              folderActions.appendChild(editBtn);

              const deleteBtn = document.createElement('button');
              deleteBtn.innerHTML = '🗑️';
              deleteBtn.title = 'Delete Folder';
              deleteBtn.className = 'folder-action-icon delete-icon';
              deleteBtn.onclick = (e) => { e.stopPropagation(); handleDeleteFolder(folderName); };
              folderActions.appendChild(deleteBtn);
          }

          folderHeader.appendChild(folderNameDiv);
          folderHeader.appendChild(folderActions);
          folderHeader.onclick = () => {
              folderNameDiv.classList.toggle('open');
              templateList.classList.toggle('hidden');
          };
          
          const templateList = document.createElement('ul');
          templateList.className = 'template-list hidden';
          
          grouped[folderName].sort((a,b) => a.name.localeCompare(b.name)).forEach(t => {
              const itemLi = document.createElement('li');
              itemLi.className = 'template-item';
              itemLi.textContent = t.name;
              itemLi.dataset.templateId = t.id;
              if (t.id === selectedTemplateId) {
                  itemLi.classList.add('selected');
                  templateList.classList.remove('hidden');
                  folderNameDiv.classList.add('open');
              }
              itemLi.addEventListener('click', (e) => {
                  e.stopPropagation();
                  selectedTemplateId = selectedTemplateId === t.id ? null : t.id;
                  renderTemplateBrowser();
                  populateTemplateEditor(selectedTemplateId);
                  renderDynamicInputs(selectedTemplateId);
                  saveResponseState();
              });
              templateList.appendChild(itemLi);
          });
          
          folderLi.appendChild(folderHeader);
          folderLi.appendChild(templateList);
          templateBrowser.appendChild(folderLi);
      });
  }

  function loadData() {
    chrome.storage.local.get([STORAGE_KEY_TEMPLATES, STORAGE_KEY_FOLDERS, STORAGE_KEY_RESPONSE_STATE], (result) => {
        templates = result[STORAGE_KEY_TEMPLATES] || [];
        folders = result[STORAGE_KEY_FOLDERS] || [];
        const state = result[STORAGE_KEY_RESPONSE_STATE] || defaultResponseState;

        if (state.selectedTemplateId && templates.some(t => t.id == state.selectedTemplateId)) {
            selectedTemplateId = state.selectedTemplateId;
        }

        renderTemplateBrowser();
        populateTemplateEditor(selectedTemplateId);
        renderDynamicInputs(selectedTemplateId);
    });
  }
  
  function populateFolderDropdown() {
      const templateFolders = [...new Set(templates.map(t => t.folder).filter(Boolean))];
      const allFolderNames = [...new Set([...folders, ...templateFolders])];
      templateFolderSelect.innerHTML = '<option value="">Uncategorized</option>';
      allFolderNames.sort().forEach(name => {
          const option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          templateFolderSelect.appendChild(option);
      });
  }

  function populateTemplateEditor(templateId) {
      populateFolderDropdown();
      const template = templates.find(t => t.id == templateId);
      if (template) {
          templateNameInput.value = template.name;
          templateFolderSelect.value = template.folder || '';
          templateBodyInput.value = template.body;
      } else {
          templateNameInput.value = '';
          templateFolderSelect.value = '';
          templateBodyInput.value = '';
      }
  }

  function saveTemplate() {
    const name = templateNameInput.value.trim();
    const body = templateBodyInput.value.trim();
    const folder = templateFolderSelect.value || null;
    if (!name || !body) {
        alert('Template name and body cannot be empty.');
        return;
    }
    
    if (selectedTemplateId) {
        const templateIndex = templates.findIndex(t => t.id == selectedTemplateId);
        if (templateIndex > -1) {
            templates[templateIndex] = { ...templates[templateIndex], name, body, folder };
        }
    } else {
        const newTemplate = { id: Date.now(), name, body, folder };
        templates.push(newTemplate);
        selectedTemplateId = newTemplate.id; // Auto-select the new template
    }
    
    chrome.storage.local.set({ [STORAGE_KEY_TEMPLATES]: templates }, () => {
        alert('Template saved!');
        loadData();
    });
  }

  function deleteTemplate() {
    if (!selectedTemplateId) {
        alert('Please select a template to delete.');
        return;
    }
    if (confirm('Are you sure you want to delete this template?')) {
        templates = templates.filter(t => t.id != selectedTemplateId);
        selectedTemplateId = null;
        chrome.storage.local.set({ [STORAGE_KEY_TEMPLATES]: templates }, () => {
            alert('Template deleted.');
            populateTemplateEditor(null);
            loadData();
        });
    }
  }
  
  function handleNewTemplateClick() {
      selectedTemplateId = null;
      populateTemplateEditor(null);
      renderTemplateBrowser();
      renderDynamicInputs(null);
      templateNameInput.focus();
  }

  function handleNewFolderClick() {
      const newFolderName = prompt('Enter a name for the new folder:');
      const trimmedName = newFolderName ? newFolderName.trim() : null;
      if (trimmedName) {
          const allFolderNames = [...new Set([...folders, ...templates.map(t => t.folder).filter(Boolean)])];
          if (allFolderNames.includes(trimmedName)) {
              alert('A folder with this name already exists.');
          } else {
              folders.push(trimmedName);
              chrome.storage.local.set({ [STORAGE_KEY_FOLDERS]: folders }, () => {
                  alert(`Folder "${trimmedName}" created.`);
                  loadData();
              });
          }
      }
  }

  function handleRenameFolder(oldFolderName) {
      const newFolderName = prompt(`Rename folder "${oldFolderName}" to:`, oldFolderName);
      const trimmedName = newFolderName ? newFolderName.trim() : null;
      if (trimmedName && trimmedName !== oldFolderName) {
          templates.forEach(t => {
              if (t.folder === oldFolderName) t.folder = trimmedName;
          });
          folders = folders.map(f => f === oldFolderName ? trimmedName : f);
          chrome.storage.local.set({ [STORAGE_KEY_TEMPLATES]: templates, [STORAGE_KEY_FOLDERS]: folders }, () => {
              alert('Folder renamed successfully.');
              loadData();
          });
      }
  }

  function handleDeleteFolder(folderNameToDelete) {
      if (confirm(`Are you sure you want to delete the folder "${folderNameToDelete}"?\n\nAll templates inside will be moved to "Uncategorized".`)) {
          templates.forEach(t => {
              if (t.folder === folderNameToDelete) t.folder = null;
          });
          folders = folders.filter(f => f !== folderNameToDelete);
          chrome.storage.local.set({ [STORAGE_KEY_TEMPLATES]: templates, [STORAGE_KEY_FOLDERS]: folders }, () => {
              alert('Folder deleted and templates moved.');
              loadData();
          });
      }
  }

  function exportTemplates() {
      if (templates.length === 0 && folders.length === 0) {
          alert('Nothing to export.');
          return;
      }
      const exportData = { folders, templates };
      const fileHeader = `// Luna Response Templates Export\n// This file contains your custom templates and folders in JSON format.\n\n`;
      const dataStr = fileHeader + JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luna_templates_export_${generateTimestamp(true)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
  }

  function importTemplates() {
    templateFileInput.click();
  }

  function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result.replace(/\/\/.*\n/g, '');
            const importedData = JSON.parse(content);
            if (typeof importedData !== 'object' || (!importedData.templates && !importedData.folders)) throw new Error('Invalid format');
            
            const importedTemplates = importedData.templates || [];
            const importedFolders = importedData.folders || [];

            const existingIds = new Set(templates.map(t => t.id));
            const newTemplates = importedTemplates.filter(t => t.id && t.name && t.body && !existingIds.has(t.id));
            
            const existingFolders = new Set(folders);
            const newFolders = importedFolders.filter(f => !existingFolders.has(f));

            if (newTemplates.length > 0 || newFolders.length > 0) {
                templates = [...templates, ...newTemplates];
                folders = [...folders, ...newFolders];
                chrome.storage.local.set({ [STORAGE_KEY_TEMPLATES]: templates, [STORAGE_KEY_FOLDERS]: folders }, () => {
                    alert(`Import successful:\n- ${newTemplates.length} new templates\n- ${newFolders.length} new folders`);
                    loadData();
                });
            } else {
                alert('No new templates or folders to import.');
            }
        } catch (error) {
            alert('Failed to import templates. The file may be corrupted or in the wrong format.');
            console.error('Template import error:', error);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  }

  function clearAll() {
    const currentView = needFormatterToggleBtn.classList.contains('selected') ? 'formatter' : 'response';
    if(currentView === 'formatter') {
        clearFormatterInputs();
    } else {
        selectedTemplateId = null;
        populateTemplateEditor(null);
        renderTemplateBrowser();
        renderDynamicInputs(null);
        saveResponseState();
    }
  }

  function initializeCollapsibleCards() {
    chrome.storage.local.get([STORAGE_KEY_CARD_STATES], (result) => {
        const cardStates = result[STORAGE_KEY_CARD_STATES] || {};
        document.querySelectorAll('.card').forEach(card => {
            const cardId = card.id;
            if (!cardId) return;
            const toggle = card.querySelector('.collapse-toggle');
            if (!toggle) return;
            if (cardStates[cardId] === true) card.classList.add('collapsed');
            toggle.addEventListener('click', () => {
                const isCollapsed = card.classList.toggle('collapsed');
                cardStates[cardId] = isCollapsed;
                chrome.storage.local.set({ [STORAGE_KEY_CARD_STATES]: cardStates });
            });
        });
    });
  }

  // --- Event Listeners ---
  needFormatterToggleBtn.addEventListener('click', () => setView('formatter'));
  responseToggleBtn.addEventListener('click', () => setView('response'));

  [ticketNumberInput, customerRequestInput, customerEmailInput, customerPhoneNumberInput, additionalCommentsInput].forEach(input => {
    if (input) input.addEventListener('input', () => { updateFormattedOutput(); saveFormatterInputs(); });
  });
  if (ticketNumberInput) {
    ticketNumberInput.addEventListener('input', () => {
      if (ticketNumberInput.value.length > 8) ticketNumberInput.value = ticketNumberInput.value.slice(0, 8);
      updateFormattedOutput(); saveFormatterInputs();
    });
  }
  if (statusPaidBtn) {
    statusPaidBtn.addEventListener('click', () => {
      statusPaidBtn.classList.add('selected'); statusPostedBtn.classList.remove('selected');
      updateFormattedOutput(); saveFormatterInputs();
    });
  }
  if (statusPostedBtn) {
    statusPostedBtn.addEventListener('click', () => {
      statusPaidBtn.classList.remove('selected'); statusPostedBtn.classList.add('selected');
      updateFormattedOutput(); saveFormatterInputs();
    });
  }
  if (copyOutputBtn) {
      copyOutputBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(formattedOutput.textContent).then(() => {
              copyOutputBtn.textContent = 'Copied!';
              setTimeout(() => { copyOutputBtn.textContent = '📋 Copy to Clipboard'; }, 1500);
          });
      });
  }
  if (clearAllBtn) clearAllBtn.addEventListener('click', clearAll);

  // --- New Response Template Listeners ---
  newTemplateBtn.addEventListener('click', handleNewTemplateClick);
  newFolderBtn.addEventListener('click', handleNewFolderClick);
  saveTemplateBtn.addEventListener('click', saveTemplate);
  deleteTemplateBtn.addEventListener('click', deleteTemplate);
  exportTemplatesBtn.addEventListener('click', exportTemplates);
  importTemplatesBtn.addEventListener('click', importTemplates);
  templateFileInput.addEventListener('change', handleFileImport);
  if (copyResponseBtn) {
    copyResponseBtn.addEventListener('click', () => {
        if (!selectedTemplateId || !responseOutput.innerHTML) return;
        copyRichTextToClipboard(responseOutput.textContent, responseOutput.innerHTML, copyResponseBtn, '📋 Copy Response');
    });
  }

  // --- Initial Setup ---
  loadGlobalSettings();
  loadFormatterInputs();
  loadData();
  initializeCollapsibleCards();
  chrome.storage.local.get([STORAGE_KEY_ACTIVE_VIEW], (result) => {
    setView(result[STORAGE_KEY_ACTIVE_VIEW] || 'formatter');
  });
});