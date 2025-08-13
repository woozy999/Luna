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
  const importTemplatesBtn = document.getElementById('importBtn');
  const exportTemplatesBtn = document.getElementById('exportAllBtn');
  const exportSingleTemplateBtn = document.getElementById('exportSelectedBtn');
  const templateFileInput = document.getElementById('templateFileInput');
  const dynamicInputsContainer = document.getElementById('dynamicInputsContainer');
  const responseOutput = document.getElementById('responseOutput');
  const copyResponseBtn = document.getElementById('copyResponseBtn');

  // Rich Text Editor Toolbar Buttons
  const toolbarBold = document.getElementById('toolbar-bold');
  const toolbarItalic = document.getElementById('toolbar-italic');
  const toolbarUnderline = document.getElementById('toolbar-underline');
  
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
      // Convert newlines to <br> for HTML rendering, then selectively un-escape formatting tags.
      outputHtml = outputHtml.replace(/\n/g, '<br>');
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

  /**
   * Builds an in-memory tree structure from the flat folder and template lists.
   * @param {string[]} folders - A flat list of folder paths (e.g., ['A', 'A/B']).
   * @param {object[]} templates - The list of all templates.
   * @returns {object} A map of nodes where `nodeMap.root` is the root of the tree.
   */
  function buildTree(folders, templates) {
    const tree = { name: 'root', path: null, children: [], templates: [] };
    const nodeMap = { root: tree };

    const allFolderPaths = [...new Set([...folders, ...templates.map(t => t.folder).filter(Boolean)])];

    allFolderPaths.sort().forEach(path => {
        const parts = path.split('/');
        let currentPath = '';
        let parentNode = tree;

        parts.forEach((part) => {
            const oldPath = currentPath;
            currentPath = oldPath ? `${oldPath}/${part}` : part;
            
            if (!nodeMap[currentPath]) {
                const newNode = { name: part, path: currentPath, children: [], templates: [] };
                nodeMap[currentPath] = newNode;
                parentNode.children.push(newNode);
            }
            parentNode = nodeMap[currentPath];
        });
    });

    templates.forEach(template => {
        const parentNode = template.folder ? nodeMap[template.folder] : null;
        if (parentNode) {
            parentNode.templates.push(template);
        }
    });
    
    const uncategorizedTemplates = templates.filter(t => !t.folder);
    if (uncategorizedTemplates.length > 0) {
        nodeMap['Uncategorized'] = { name: 'Uncategorized', path: null, children: [], templates: uncategorizedTemplates };
    }
    
    const favoriteTemplates = templates.filter(t => t.isFavorite);
    if (favoriteTemplates.length > 0) {
        nodeMap['Favorites'] = { name: '★ Favorites', path: null, children: [], templates: favoriteTemplates };
    }

    const sortNodes = (node) => {
        node.children.sort((a, b) => a.name.localeCompare(b.name));
        node.children.forEach(sortNodes);
    };
    sortNodes(tree);

    return nodeMap;
  }

  /**
   * Renders the template browser using a recursive tree-based approach.
   * @param {object} nodeMap - The map of all nodes generated by `buildTree`.
   */
  function renderTemplateBrowser() {
    templateBrowser.innerHTML = '';
    const nodeMap = buildTree(folders, templates);

    const renderFolderNode = (node, container, isRoot = false) => {
        const folderLi = document.createElement('li');
        folderLi.className = 'folder-item';

        const folderHeader = document.createElement('div');
        folderHeader.className = 'folder-header';
        
        const folderNameDiv = document.createElement('div');
        folderNameDiv.className = 'folder-name';
        folderNameDiv.textContent = node.name;
        
        const folderActions = document.createElement('div');
        folderActions.className = 'folder-actions';

        if (!isRoot && node.name !== '★ Favorites' && node.name !== 'Uncategorized') {
            const currentDepth = node.path ? node.path.split('/').length : 0;
            if (currentDepth < 5) {
                const addSubfolderBtn = document.createElement('button');
                addSubfolderBtn.innerHTML = '➕';
                addSubfolderBtn.title = 'New Subfolder';
                addSubfolderBtn.className = 'folder-action-icon';
                addSubfolderBtn.onclick = (e) => { e.stopPropagation(); handleNewFolderClick(node.path); };
                folderActions.appendChild(addSubfolderBtn);
            }
            
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '✏️';
            editBtn.title = 'Rename Folder';
            editBtn.className = 'folder-action-icon edit-icon';
            editBtn.onclick = (e) => { e.stopPropagation(); handleRenameFolder(node.path); };
            folderActions.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Delete Folder';
            deleteBtn.className = 'folder-action-icon delete-icon';
            deleteBtn.onclick = (e) => { e.stopPropagation(); handleDeleteFolder(node.path); };
            folderActions.appendChild(deleteBtn);
        }

        folderHeader.appendChild(folderNameDiv);
        folderHeader.appendChild(folderActions);
        
        const templateList = document.createElement('ul');
        templateList.className = 'template-list hidden';
        
        folderHeader.onclick = () => {
            folderNameDiv.classList.toggle('open');
            templateList.classList.toggle('hidden');
        };

        node.children.forEach(childNode => renderFolderNode(childNode, templateList));
        
        node.templates
          .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0) || a.name.localeCompare(b.name))
          .forEach(t => {
            const itemLi = document.createElement('li');
            itemLi.className = 'template-item';

            const itemName = document.createElement('span');
            itemName.textContent = t.name;

            const favButton = document.createElement('button');
            favButton.className = 'favorite-toggle';
            favButton.classList.toggle('favorited', !!t.isFavorite);
            favButton.textContent = t.isFavorite ? '★' : '☆';
            favButton.title = t.isFavorite ? 'Unfavorite' : 'Favorite';
            favButton.onclick = (e) => {
                e.stopPropagation();
                toggleFavorite(t.id);
            };

            itemLi.appendChild(itemName);
            itemLi.appendChild(favButton);
            
            itemLi.dataset.templateId = t.id;
            if (t.id === selectedTemplateId) {
                itemLi.classList.add('selected');
                if (!templateList.classList.contains('open')) {
                    templateList.classList.remove('hidden');
                    folderNameDiv.classList.add('open');
                }
            }
            itemLi.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedTemplateId = selectedTemplateId === t.id ? null : t.id;
                loadData();
            });
            templateList.appendChild(itemLi);
        });
        
        // Always render the folder structure, even if it's empty
        folderLi.appendChild(folderHeader);
        folderLi.appendChild(templateList);
        container.appendChild(folderLi);
    };
    
    // Render Favorites first if it exists
    if (nodeMap['Favorites']) {
        renderFolderNode(nodeMap['Favorites'], templateBrowser);
    }
    
    const rootNode = nodeMap.root;
    rootNode.children.forEach(child => renderFolderNode(child, templateBrowser));
    if (nodeMap['Uncategorized']) {
        renderFolderNode(nodeMap['Uncategorized'], templateBrowser);
    }
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
      templateFolderSelect.innerHTML = '<option value="">Uncategorized</option>';
      const nodeMap = buildTree(folders, templates);

      const renderOptionsRecursive = (node, depth) => {
          if (node.path) {
              const option = document.createElement('option');
              option.value = node.path;
              option.textContent = `${'  '.repeat(depth)} ${node.name}`;
              templateFolderSelect.appendChild(option);
          }
          node.children.forEach(child => renderOptionsRecursive(child, depth + 1));
      };

      nodeMap.root.children.forEach(child => renderOptionsRecursive(child, 0));
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
    const body = templateBodyInput.value; // Keep whitespace for line breaks
    const folderPath = templateFolderSelect.value || null;
    if (!name || !body) {
        alert('Template name and body cannot be empty.');
        return;
    }
    
    if (selectedTemplateId) {
        const templateIndex = templates.findIndex(t => t.id == selectedTemplateId);
        if (templateIndex > -1) {
            templates[templateIndex] = { ...templates[templateIndex], name, body, folder: folderPath };
        }
    } else {
        const newTemplate = { id: Date.now(), name, body, folder: folderPath, isFavorite: false };
        templates.push(newTemplate);
        selectedTemplateId = newTemplate.id;
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

  function handleNewFolderClick(parentPath = null) {
      const currentDepth = parentPath ? parentPath.split('/').length : 0;
      if (currentDepth >= 5) {
          alert("You have reached the maximum subfolder depth of 5.");
          return;
      }

      const promptMessage = parentPath 
          ? `Enter name for new subfolder in "${parentPath}":` 
          : 'Enter a name for the new top-level folder:';
      
      const newFolderName = prompt(promptMessage);
      const trimmedName = newFolderName ? newFolderName.trim().replace(/\//g, '-') : null;
      
      if (trimmedName) {
          const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;
          const allFolderPaths = [...new Set([...folders, ...templates.map(t => t.folder).filter(Boolean)])];
          
          if (allFolderPaths.includes(newPath)) {
              alert('A folder with this name already exists at this level.');
          } else {
              folders.push(newPath);
              chrome.storage.local.set({ [STORAGE_KEY_FOLDERS]: folders }, () => {
                  alert(`Folder "${trimmedName}" created.`);
                  loadData();
              });
          }
      }
  }

  function handleRenameFolder(oldPath) {
      const pathParts = oldPath.split('/');
      const oldName = pathParts.pop();
      const parentPath = pathParts.join('/');

      const newName = prompt(`Rename folder "${oldName}" to:`, oldName);
      const trimmedNewName = newName ? newName.trim().replace(/\//g, '-') : null;

      if (trimmedNewName && trimmedNewName !== oldName) {
          const newPath = parentPath ? `${parentPath}/${trimmedNewName}` : trimmedNewName;
          
          folders = folders.map(f => (f === oldPath ? newPath : (f.startsWith(oldPath + '/') ? f.replace(oldPath, newPath) : f)));
          
          templates.forEach(t => {
              if (t.folder && t.folder.startsWith(oldPath)) {
                  t.folder = t.folder.replace(oldPath, newPath);
              }
          });

          chrome.storage.local.set({ [STORAGE_KEY_TEMPLATES]: templates, [STORAGE_KEY_FOLDERS]: folders }, () => {
              alert('Folder renamed successfully.');
              loadData();
          });
      }
  }

  function handleDeleteFolder(pathToDelete) {
      if (confirm(`Are you sure you want to delete the folder "${pathToDelete}" and all its subfolders?\n\nTemplates inside will be moved to "Uncategorized". This cannot be undone.`)) {
          templates.forEach(t => {
              if (t.folder && (t.folder === pathToDelete || t.folder.startsWith(pathToDelete + '/'))) {
                  t.folder = null;
              }
          });
          
          folders = folders.filter(f => f !== pathToDelete && !f.startsWith(pathToDelete + '/'));

          chrome.storage.local.set({ [STORAGE_KEY_TEMPLATES]: templates, [STORAGE_KEY_FOLDERS]: folders }, () => {
              alert('Folder and subfolders deleted. Templates moved to Uncategorized.');
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

  function exportSingleTemplate() {
    if (!selectedTemplateId) {
        alert('Please select a template to export.');
        return;
    }
    
    const templateToExport = templates.find(t => t.id == selectedTemplateId);
    if (!templateToExport) {
        alert('Selected template not found.');
        return;
    }

    const relatedFolder = templateToExport.folder ? [templateToExport.folder] : [];
    const exportData = { folders: relatedFolder, templates: [templateToExport] };

    const fileHeader = `// Luna Response Template Export\n// This file contains a single template in JSON format.\n\n`;
    const dataStr = fileHeader + JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeFilename = templateToExport.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `luna_template_${safeFilename}.txt`;
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
            
            const importedTemplates = (importedData.templates || []).map(t => ({...t, isFavorite: !!t.isFavorite}));
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

    function wrapTextInTag(tag) {
        const start = templateBodyInput.selectionStart;
        const end = templateBodyInput.selectionEnd;
        const text = templateBodyInput.value;
        const selectedText = text.substring(start, end);
        const newText = `${text.substring(0, start)}<${tag}>${selectedText}</${tag}>${text.substring(end)}`;
        
        templateBodyInput.value = newText;
        templateBodyInput.focus();
        templateBodyInput.selectionEnd = end + (tag.length * 2) + 5; // position cursor after closing tag
    }
    
    function toggleFavorite(templateId) {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            template.isFavorite = !template.isFavorite;
            chrome.storage.local.set({ [STORAGE_KEY_TEMPLATES]: templates }, () => {
                loadData();
            });
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
  newFolderBtn.addEventListener('click', () => handleNewFolderClick(null));
  saveTemplateBtn.addEventListener('click', saveTemplate);
  deleteTemplateBtn.addEventListener('click', deleteTemplate);
  exportTemplatesBtn.addEventListener('click', exportTemplates);
  exportSingleTemplateBtn.addEventListener('click', exportSingleTemplate);
  importTemplatesBtn.addEventListener('click', importTemplates);
  templateFileInput.addEventListener('change', handleFileImport);
  if (copyResponseBtn) {
    copyResponseBtn.addEventListener('click', () => {
        if (!selectedTemplateId || !responseOutput.innerHTML) return;
        copyRichTextToClipboard(responseOutput.textContent, responseOutput.innerHTML, copyResponseBtn, '📋 Copy Response');
    });
  }

  // Toolbar Listeners
  toolbarBold.addEventListener('click', () => wrapTextInTag('b'));
  toolbarItalic.addEventListener('click', () => wrapTextInTag('i'));
  toolbarUnderline.addEventListener('click', () => wrapTextInTag('u'));


  // --- Initial Setup ---
  loadGlobalSettings();
  loadFormatterInputs();
  loadData();
  initializeCollapsibleCards();
  chrome.storage.local.get([STORAGE_KEY_ACTIVE_VIEW], (result) => {
    setView(result[STORAGE_KEY_ACTIVE_VIEW] || 'formatter');
  });
});