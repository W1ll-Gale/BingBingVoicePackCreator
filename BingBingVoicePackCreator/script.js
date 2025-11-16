const AUDIO_ENTRIES_CONTAINER = document.getElementById('audioEntries');
const MOD_OPTIONS_DIV = document.getElementById('modOptions');
const JSON_OUTPUT = document.getElementById('jsonOutput');
const JSON_ERROR_MSG = document.getElementById('jsonError');
const MOD_PACKAGE_BUTTON = document.getElementById('modPackageButton');
const DOWNLOAD_CONFIG_BUTTON = document.getElementById('downloadConfigButton'); 
const COPY_JSON_BUTTON = document.getElementById('copyJsonButton');
const COPY_BUTTON_TEXT = document.getElementById('copyButtonText');
const ADD_ENTRY_BUTTON = document.getElementById('addEntryButton');

const MOD_PACKAGE_TOOLTIP = document.getElementById('modPackageTooltip');
const DOWNLOAD_CONFIG_TOOLTIP = document.getElementById('downloadConfigTooltip');
const ADD_ENTRY_TOOLTIP = document.getElementById('addEntryTooltip');

const messageModal = document.getElementById('messageModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalCancelButton = document.getElementById('modalCancelButton');
const modalConfirmButton = document.getElementById('modalConfirmButton');

const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.aiff', '.aif', '.xm', '.mod', '.it', '.s3m', '.m4a'];

const LOCAL_STORAGE_KEY = 'bingBongPackState';
const DEFAULT_DEPENDENCY_STRING = 'MrBytesized-BingBongVoiceLineAPI-1.2.0';

let audioEntryCount = 0;
let copyTimeout = null; 

let isUpdatingFromJson = false;

let audioFileCache = new Map();

let dllFileStore = new Map();

let iconFileCache = null;

let currentPlayingAudio = null; 
let currentPlayButton = null;

function autoExpandTextarea(element) {
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
}

modalCancelButton.onclick = () => messageModal.classList.add('hidden');

function showModal(title, message, options = {}) {
    const { isError = false, confirmCallback = null } = options;

    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    
    modalTitle.classList.toggle('text-red-600', isError);
    modalTitle.classList.toggle('text-gray-900', !isError);
    modalTitle.classList.toggle('dark:text-red-400', isError);
    modalTitle.classList.toggle('dark:text-white', !isError);


    if (confirmCallback) {
        modalConfirmButton.classList.remove('hidden');
        modalCancelButton.textContent = 'Cancel';
        
        modalConfirmButton.onclick = () => {
            messageModal.classList.add('hidden');
            confirmCallback();
        };
    } else {
        modalConfirmButton.classList.add('hidden');
        modalCancelButton.textContent = 'Close';
    }

    messageModal.classList.remove('hidden');
}

async function copyJsonContents() {
    const textarea = document.getElementById('jsonOutput');
    const textToCopy = textarea.value;
    if (COPY_JSON_BUTTON.getAttribute('data-disabled') === 'true' || !textToCopy) return;

    if (copyTimeout) clearTimeout(copyTimeout);

    try {
        await navigator.clipboard.writeText(textToCopy);
        
        COPY_BUTTON_TEXT.textContent = 'Copied!';
        COPY_JSON_BUTTON.querySelector('svg').classList.add('hidden'); 

        copyTimeout = setTimeout(() => {
            COPY_BUTTON_TEXT.textContent = 'Copy Contents';
            COPY_JSON_BUTTON.querySelector('svg').classList.remove('hidden');
        }, 1500);

    } catch (err) {
        console.warn('Failed to use navigator.clipboard.writeText. Falling back to execCommand.', err);
        
        try {
            textarea.select();
            document.execCommand('copy');
            
            COPY_BUTTON_TEXT.textContent = 'Copied! (Fallback)';
            COPY_JSON_BUTTON.querySelector('svg').classList.add('hidden');

            copyTimeout = setTimeout(() => {
                COPY_BUTTON_TEXT.textContent = 'Copy Contents';
                COPY_JSON_BUTTON.querySelector('svg').classList.remove('hidden');
            }, 1500);

        } catch (fallbackErr) {
            console.error('Failed to copy text with fallback: ', fallbackErr);
            showModal("Copy Failed", "Failed to copy text. Please select the text manually.", { isError: true });
        }
    }
}

function previewIcon(input) {
    const file = input.files[0];
    if (file) {
        setIconFile(file); 
    } else {
        clearIconFile(); 
    }
    updateUIState();
}

function setIconFile(file) {
    const preview = document.getElementById('iconPreview');
    const removeButton = document.getElementById('iconRemoveButton'); 
    
    if (!file || !file.name.toLowerCase().endsWith('.png')) {
        if(file && !file.type.startsWith('image/')) {
            clearIconFile();
            return;
        }
    }
    
    iconFileCache = file; 
    
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.src = e.target.result;
        preview.classList.remove('hidden');
        removeButton.classList.remove('hidden'); 
    };
    reader.readAsDataURL(file);
    
    document.getElementById('iconFile').value = null;
}

function clearIconFile() {
    const preview = document.getElementById('iconPreview');
    const removeButton = document.getElementById('iconRemoveButton'); 
    
    preview.classList.add('hidden');
    preview.src = '';
    removeButton.classList.add('hidden'); 
    
    iconFileCache = null; 
    document.getElementById('iconFile').value = null; 
}



function getManifestData() {
    const isModPackage = document.getElementById('isModPackage').checked;
    if (!isModPackage) return null;

    const modName = document.getElementById('modName').value.trim().replace(/\s+/g, '_');
    const version = document.getElementById('version').value.trim() || "1.0.0";
    const author = document.getElementById('author').value.trim();
    const description = document.getElementById('description').value.trim();
    const websiteUrl = document.getElementById('websiteUrl').value.trim(); 

    const dependencies = [];
    document.querySelectorAll('#dependencyEntries .dependency-input').forEach(input => {
        const depString = input.value.trim();
        if (depString) {
            dependencies.push(depString);
        }
    });

    return {
        name: modName,
        version_number: version,
        description: description,
        website_url: websiteUrl, 
        dependencies: dependencies 
    };
}

function populateDefaultMarkdown() {
    const modName = document.getElementById('modName').value.trim() || "Mod Name";
    const currentDate = new Date().toISOString().slice(0, 10); 
    
    const readmePlaceholder = `## ${modName}\n\nA fun, custom voice pack for BingBong!&#10;&#10;### Installation&#10;1. Ensure the required dependency, BingBongVoiceLineAPI, is installed.&#10;2. Install this mod package using your mod manager.`;
    const changelogPlaceholder = `## [1.0.0] - ${currentDate}\n### Added&#10;- Initial release of custom voice lines.`;

    const readmeTextarea = document.getElementById('readmeContent');
    const changelogTextarea = document.getElementById('changelogContent');

    if (!readmeTextarea.value || readmeTextarea.value === readmeTextarea.placeholder) {
        readmeTextarea.placeholder = readmePlaceholder;
    }
    if (!changelogTextarea.value || changelogTextarea.value === changelogTextarea.placeholder) {
        changelogTextarea.placeholder = changelogPlaceholder;
    }

    const descriptionTextarea = document.getElementById('description');
    if (!descriptionTextarea.value) {
         descriptionTextarea.placeholder = `Custom voice pack for ${modName}`;
    }
}

function toggleMarkdownEditor(fileType, isChecked) {
    const contentEl = document.getElementById(fileType + 'Content');
    const previewEl = document.getElementById(fileType + 'Preview');
    const previewButton = document.getElementById(fileType + 'PreviewButton');

    contentEl.classList.toggle('hidden', !isChecked);
    previewButton.classList.toggle('hidden', !isChecked);
    
    if (!isChecked) {
        previewEl.classList.add('hidden');
        previewButton.textContent = 'Preview';
    }
    
    if (isChecked) {
        populateDefaultMarkdown();
        autoExpandTextarea(contentEl); 
    }
    updateUIState();
}

function toggleMarkdownPreview(type, button) {
    const contentEl = document.getElementById(type + 'Content');
    const previewEl = document.getElementById(type + 'Preview');

    const isPreviewing = !previewEl.classList.contains('hidden');

    if (isPreviewing) {
        previewEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
        button.textContent = 'Preview';
    } else {
        const content = contentEl.value.trim() || contentEl.placeholder;
        previewEl.innerHTML = marked.parse(content); 
        
        contentEl.classList.add('hidden');
        previewEl.classList.remove('hidden');
        button.textContent = 'Edit';
    }
}

/**
 * Sets the theme and saves it to localStorage.
 * @param {'light' | 'dark'} theme - The theme to set.
 */
function setTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
    }
}

/**
 * Initializes the theme toggle switch and adds its event listener.
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    if (document.documentElement.classList.contains('dark')) {
        themeToggle.checked = true;
    }

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    });
}

function toggleJsonEditor(button) {
    const container = document.getElementById('jsonEditorContainer');
    const arrow = button.querySelector('svg');
    
    container.classList.toggle('hidden');
    
    if (container.classList.contains('hidden')) {
        arrow.style.transform = 'rotate(-90deg)';
    } else {
        arrow.style.transform = 'rotate(0deg)';
        autoExpandTextarea(document.getElementById('jsonOutput'));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
    
    if (!loadFormState()) {
         AUDIO_ENTRIES_CONTAINER.appendChild(createAudioEntryElement());
         addDependencyEntry(DEFAULT_DEPENDENCY_STRING); 
    } else {
        updateUIState();
    }
    
    AUDIO_ENTRIES_CONTAINER.addEventListener('change', handleEntryChange);
    AUDIO_ENTRIES_CONTAINER.addEventListener('input', handleEntryInput);
    
    document.getElementById('modName').addEventListener('input', updateUIState);
    
    document.getElementById('version').addEventListener('input', updateUIState); 
    document.getElementById('author').addEventListener('input', updateUIState); 
    
    JSON_OUTPUT.addEventListener('keydown', function(e) {
        
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'y')) {
            return; 
        }

        const charMap = {'{': '}', '[': ']', '"': '"'};
        if (e.key in charMap) {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const openChar = e.key;
            const closeChar = charMap[e.key];
            const selectedText = this.value.substring(start, end);

            if (start !== end) { 
                document.execCommand('insertText', false, openChar + selectedText + closeChar);
                this.selectionStart = start + 1;
                this.selectionEnd = end + 1;
            } else { 
                document.execCommand('insertText', false, openChar + closeChar);
                this.selectionStart = this.selectionEnd = start + 1; 
            }
            this.dispatchEvent(new Event('input', { bubbles: true }));
            autoExpandTextarea(this);
            return; 
        }

        if (e.key === 'Tab') {
            e.preventDefault(); 
            
            document.execCommand('insertText', false, "  ");
            
            this.dispatchEvent(new Event('input', { bubbles: true }));
            
            autoExpandTextarea(this);
        }
        
        if (e.key === 'Enter') {
            e.preventDefault();

            const start = this.selectionStart;
            const end = this.selectionEnd;
            const value = this.value;
            const indentUnit = '  ';

            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const linePrefix = value.substring(lineStart, start);
            const match = linePrefix.match(/^\s*/);
            const indentation = match ? match[0] : '';

            const charBefore = value.substring(start - 1, start);
            const charAfter = value.substring(start, start + 1);

            let textToInsert = '\n' + indentation;
            let newCursorPos = start + 1 + indentation.length;

            if (charBefore === '{' || charBefore === '[') {
                textToInsert += indentUnit;
                newCursorPos += indentUnit.length;

                if ((charBefore === '{' && charAfter === '}') || (charBefore === '[' && charAfter === ']')) {
                    textToInsert += '\n' + indentation;
                }
            }

            document.execCommand('insertText', false, textToInsert);
            
            this.selectionStart = this.selectionEnd = newCursorPos;
            
            this.dispatchEvent(new Event('input', { bubbles: true }));
            autoExpandTextarea(this);
        }
    });
    
    setupDragDrop('audioDropzone', handleAudioDrop);
    setupDragDrop('dllDropzone', handleOptionalFilesDrop);
    setupDragDrop('importDropzone', handleImportDrop); 
});

function handleEntryChange(e) {
    const target = e.target;
    const entryDiv = target.closest('.entry-container');
    if (!entryDiv) return;

    if (target.classList.contains('subtitle-toggle')) {
        const subtitleInput = entryDiv.querySelector('.subtitle-input');
        
        subtitleInput.disabled = !target.checked;
        
        subtitleInput.classList.toggle('bg-gray-50', !target.checked);
        subtitleInput.classList.toggle('bg-white', target.checked);
        subtitleInput.classList.toggle('dark:bg-gray-800', !target.checked);
        subtitleInput.classList.toggle('dark:bg-gray-600', target.checked);
        if (!target.checked) subtitleInput.value = '';
    }
    updateUIState();
}

function handleEntryInput(e) {
    if (e.target.classList.contains('subtitle-input') || e.target.classList.contains('filename-input')) {
        if (!isUpdatingFromJson) {
            updateUIState();
        }
    }
}

function handleFileUpload(fileInput) {
    const entryDiv = fileInput.closest('.entry-container');
    const file = fileInput.files[0];
    if (!file) return; 
    
    const fileNameInput = entryDiv.querySelector('.filename-input');
    const fileStatus = entryDiv.querySelector('.file-status');
    const uploadButton = entryDiv.querySelector('.upload-button');
    const errorElement = entryDiv.querySelector('.audio-file-error');
    const playButton = entryDiv.querySelector('.play-button'); 

    errorElement.classList.add('opacity-0');
    errorElement.textContent = '';
    
    const oldFilename = fileNameInput.value;
    if (oldFilename && audioFileCache.has(oldFilename)) {
        audioFileCache.delete(oldFilename);
    }

    fileNameInput.value = file.name;
    fileStatus.textContent = `File attached: ${file.name}`;
    fileStatus.classList.remove('hidden', 'text-red-500', 'text-yellow-600');
    fileStatus.classList.add('text-green-600');
    fileStatus.classList.add('dark:text-green-400'); 
    uploadButton.textContent = 'Change File';
    playButton.classList.remove('hidden'); 
    
    audioFileCache.set(file.name, file);
    
    updateUIState();
}

function createAudioEntryElement(data = null) {
    audioEntryCount++;
    const template = document.getElementById('audioEntryTemplate');
    const clone = template.content.cloneNode(true);
    const entryDiv = clone.querySelector('.entry-container');
    entryDiv.dataset.id = audioEntryCount;
    
    const fileNameInput = entryDiv.querySelector('.filename-input');
    const fileStatus = entryDiv.querySelector('.file-status');
    const playButton = entryDiv.querySelector('.play-button');
    
    if (data) {
        fileNameInput.value = data.filename;
        const toggle = entryDiv.querySelector('.subtitle-toggle');
        const input = entryDiv.querySelector('.subtitle-input');
        
        if (data.subtitleEnabled) {
            toggle.checked = true;
            input.value = data.subtitle;
            input.disabled = false;
            input.classList.toggle('bg-gray-50', false);
            input.classList.toggle('bg-white', true);
            input.classList.toggle('dark:bg-gray-800', false);
            input.classList.toggle('dark:bg-gray-600', true); 
        }
        
        if (audioFileCache.has(data.filename)) {
            fileStatus.textContent = `File attached: ${data.filename}`;
            fileStatus.classList.remove('hidden', 'text-red-500', 'text-yellow-600');
            fileStatus.classList.add('text-green-600');
            fileStatus.classList.add('dark:text-green-400'); 
            playButton.classList.remove('hidden');
        }
        else if (data.fileWasAttached) {
            fileStatus.textContent = 'Re-upload required';
            fileStatus.classList.remove('hidden', 'text-green-600');
            fileStatus.classList.add('text-yellow-600');
            fileStatus.classList.add('dark:text-yellow-400'); 
            entryDiv.dataset.fileAttached = 'true';
        }

    } else {
         entryDiv.dataset.fileAttached = 'false';
    }

    return entryDiv; 
}


function removeAudioEntry(button) {
    const entryDiv = button.closest('.entry-container');
    const filename = entryDiv.querySelector('.filename-input').value;
    if (filename) {
        audioFileCache.delete(filename);
    }
    
    entryDiv.remove();
    updateUIState();
}

function addDependencyEntry(dependencyString = "") {
    const template = document.getElementById('dependencyEntryTemplate');
    const clone = template.content.cloneNode(true);
    const input = clone.querySelector('.dependency-input');
    input.value = dependencyString;
    
    if (dependencyString === DEFAULT_DEPENDENCY_STRING) {
        input.disabled = true;
        input.classList.add('bg-gray-100', 'text-gray-500', 'cursor-not-allowed');
        input.classList.add('dark:bg-gray-800', 'dark:text-gray-500');
    } else {
        input.addEventListener('input', updateUIState);
    }
    
    document.getElementById('dependencyEntries').appendChild(clone);
}

function removeDependencyEntry(button) {
    const entryDiv = button.closest('.dependency-entry');
    const input = entryDiv.querySelector('.dependency-input');
    const dependencyString = input.value.trim();

    if (dependencyString === DEFAULT_DEPENDENCY_STRING) {
        showModal("Required Dependency", 
                  `The dependency "${DEFAULT_DEPENDENCY_STRING}" is required for the BingBong API to function and cannot be removed.`, 
                  { isError: true }); 
    } else {
        entryDiv.remove();
        updateUIState(); 
    }
}

function playAudio(button) {
    const entryDiv = button.closest('.entry-container');
    const filename = entryDiv.querySelector('.filename-input').value;
    const file = audioFileCache.get(filename);

    if (!file) {
         showModal("Audio Error", "File not found. Please (re-)upload the file to play it.", { isError: true });
         return;
    }
    
    if (currentPlayingAudio && currentPlayButton === button) {
        currentPlayingAudio.pause();
        currentPlayingAudio = null;
        currentPlayButton = null;
        button.querySelector('.play-icon').classList.remove('hidden');
        button.querySelector('.pause-icon').classList.add('hidden');
    } else {
        if (currentPlayingAudio) {
            currentPlayingAudio.pause();
            currentPlayButton.querySelector('.play-icon').classList.remove('hidden');
            currentPlayButton.querySelector('.pause-icon').classList.add('hidden');
        }

        const audioURL = URL.createObjectURL(file);
        currentPlayingAudio = new Audio(audioURL);
        currentPlayButton = button;
        
        button.querySelector('.play-icon').classList.add('hidden');
        button.querySelector('.pause-icon').classList.remove('hidden');

        currentPlayingAudio.play();
        
        currentPlayingAudio.onended = () => {
            button.querySelector('.play-icon').classList.remove('hidden');
            button.querySelector('.pause-icon').classList.add('hidden');
            currentPlayingAudio = null;
            currentPlayButton = null;
        };
        
        currentPlayingAudio.onerror = () => {
             showModal("Audio Error", "Failed to play audio file.", { isError: true });
             button.querySelector('.play-icon').classList.remove('hidden');
            button.querySelector('.pause-icon').classList.add('hidden');
            currentPlayingAudio = null;
            currentPlayButton = null;
        };
    }
}

function updateDllFileList() {
    const list = document.getElementById('dllFileList');
    list.innerHTML = ''; 
    if (dllFileStore.size > 0) {
        for (const filename of dllFileStore.keys()) {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between group';
            
            const span = document.createElement('span');
            span.textContent = filename;
            li.appendChild(span);
            
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity dark:text-red-400 dark:hover:text-red-300';
            removeBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
            removeBtn.onclick = () => removeDllFile(filename);
            li.appendChild(removeBtn);
            
            list.appendChild(li);
        }
    }
}

function addFilesToDllStore(fileList) {
    let added = false;
    for (const file of fileList) {
        if (file.name.endsWith('.dll') && !dllFileStore.has(file.name)) {
            dllFileStore.set(file.name, file);
            added = true;
        }
    }
    if (added) {
        updateDllFileList();
        updateUIState();
    }
    return added; 
}

function removeDllFile(filename) {
    dllFileStore.delete(filename);
    updateDllFileList();
    updateUIState();
}

function setupDragDrop(zoneId, dropHandler) {
    const dropzone = document.getElementById(zoneId);
    if (!dropzone) return;

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dropzone-active');
    });

    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dropzone-active');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dropzone-active');
        dropHandler(e.dataTransfer.files);
    });
}

function handleAudioDrop(fileList) {
    let filesAdded = false;
    for (const file of fileList) {
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) {
            continue; 
        }
        
        if (audioFileCache.has(file.name) || document.querySelector(`.filename-input[value="${file.name}"]`)) {
            continue; 
        }

        audioFileCache.set(file.name, file);
        
        const entryData = {
            filename: file.name,
            subtitle: '',
            subtitleEnabled: false,
            fileWasAttached: true 
        };
        AUDIO_ENTRIES_CONTAINER.appendChild(createAudioEntryElement(entryData));
        filesAdded = true;
    }
    
    if (filesAdded) {
        updateUIState();
    } else {
        showModal("No Files Added", "All dropped audio files were duplicates or had unsupported formats.", { isError: true });
    }
}

function handleOptionalFilesDrop(fileList) {
    let dllsAdded = false;
    let iconSet = false;
    let iconFile = null;

    for (const file of fileList) {
        const lcName = file.name.toLowerCase();
        if (lcName.endsWith('.dll')) {
            if (!dllFileStore.has(file.name)) {
                dllFileStore.set(file.name, file);
                dllsAdded = true;
            }
        }
        else if ((lcName.endsWith('.png') || file.type === 'image/png') && !iconFile) {
            iconFile = file;
        }
    }

    if (dllsAdded) {
        updateDllFileList();
    }

    if (iconFile) {
        setIconFile(iconFile); 
        iconSet = true;
    }
    
    if (dllsAdded || iconSet) {
        updateUIState();
    } else {
        showModal("No Files Added", "All dropped files were duplicates or had unsupported formats (.png or .dll only).", { isError: true });
    }
}

function handleImportDrop(fileList) {
    if (fileList.length > 0) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(fileList[0]); 
        
        const input = document.getElementById('importZipInput');
        input.files = dataTransfer.files;
        
        handleImport(input);
    }
}


function validateExtension(filename) {
    if (!filename) return false;
    const lastDotIndex = filename.lastIndexOf('.');
    
    if (lastDotIndex === -1 || lastDotIndex === 0 || lastDotIndex === filename.length - 1) {
        return false;
    }

    const ext = filename.substring(lastDotIndex).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
}

function validateAllEntries() {
    let allValid = true;
    let filesMissing = false;
    
    const entryElements = AUDIO_ENTRIES_CONTAINER.querySelectorAll('.entry-container');

    if (entryElements.length === 0) {
        return { allValid: false, filesMissing: true, hasData: false };
    }
    
    entryElements.forEach(entry => {
        const fileNameInput = entry.querySelector('.filename-input');
        const errorElement = entry.querySelector('.audio-file-error');
        
        const filename = fileNameInput.value.trim();
        const fileInCache = audioFileCache.has(filename);

        let errorMessage = null;

        if (filename === "") {
            errorMessage = 'Filename required.';
        }
        else if (!validateExtension(filename)) {
            errorMessage = `Invalid extension. Must be one of: ${SUPPORTED_EXTENSIONS.join(', ')}.`;
        }
        
        errorElement.textContent = errorMessage || ''; 

        if (errorMessage) {
            errorElement.classList.remove('opacity-0'); 
            allValid = false;
        } else {
            errorElement.classList.add('opacity-0'); 
        }
        
        if (document.getElementById('isModPackage').checked && !fileInCache) {
             filesMissing = true;
        }
    });

    const hasData = entryElements.length > 0;
    
    return { allValid: allValid, filesMissing, hasData };
}

function updateTooltip(tooltipElement, text, isVisible) {
    tooltipElement.textContent = text;
    tooltipElement.setAttribute('data-visible', isVisible ? 'true' : 'false');
}

function updateUIState() {
    if (isUpdatingFromJson) {
        return;
    }

    const { allValid, filesMissing, hasData } = validateAllEntries();
    const modPackageEnabled = document.getElementById('isModPackage').checked;

    let downloadDisabled = !hasData || !allValid; 
    let downloadTooltipText = '';
    
    if (!hasData) {
         downloadTooltipText = 'Add at least one audio entry.';
    } else if (!allValid) {
        downloadTooltipText = 'Fix file/name errors in Section 2 first.';
    }
    
    DOWNLOAD_CONFIG_BUTTON.setAttribute('data-disabled', downloadDisabled ? 'true' : 'false');
    updateTooltip(DOWNLOAD_CONFIG_TOOLTIP, downloadTooltipText, downloadDisabled);
    COPY_JSON_BUTTON.setAttribute('data-disabled', downloadDisabled ? 'true' : 'false');

    let packageDisabled = false;
    let packageTooltipText = "Generate Mod Package (ZIP)";
    
    if (!hasData) {
         packageDisabled = true;
         packageTooltipText = 'Add at least one audio entry.';
    } else if (!allValid) {
        packageDisabled = true;
        packageTooltipText = 'Fix file/name errors in Section 2 first.';
    } else if (!modPackageEnabled) {
        packageDisabled = true;
        packageTooltipText = 'Check box 3 to enable mod package options.';
    } else if (modPackageEnabled && filesMissing) {
        packageDisabled = true;
        packageTooltipText = 'Mod creation requires uploading/re-uploading all audio files.';
    }

    MOD_PACKAGE_BUTTON.setAttribute('data-disabled', packageDisabled ? 'true' : 'false');
    updateTooltip(MOD_PACKAGE_TOOLTIP, packageTooltipText, packageDisabled);
    
    let addDisabled = !allValid && hasData; 
    let addTooltipText = '';

    if (addDisabled) {
        addTooltipText = 'Fix errors in existing entries before adding a new one.';
    }
    
    ADD_ENTRY_BUTTON.setAttribute('data-disabled', addDisabled ? 'true' : 'false');
    updateTooltip(ADD_ENTRY_TOOLTIP, addTooltipText, addDisabled);
    
    if (document.activeElement !== JSON_OUTPUT) {
        updateConfigPreview();
    }
    
    populateDefaultMarkdown();
    
    saveFormState();
}

function toggleModOptions(isChecked) {
    MOD_OPTIONS_DIV.classList.toggle('hidden', !isChecked);
    updateUIState();
}

function getAudioData(includeFiles = false, skipValidation = false) {
    const modName = document.getElementById('modName').value.trim();
    const entries = [];
    const files = [];
    
    const result = skipValidation ? {allValid: true, filesMissing: false} : validateAllEntries();
    const entryElements = AUDIO_ENTRIES_CONTAINER.querySelectorAll('.entry-container');
    
    if (!result.allValid && !skipValidation) {
         return { isValid: false, entries: [] };
    }
    
    let hasAtLeastOneValidEntry = false;

    entryElements.forEach(entry => {
        const fileNameInput = entry.querySelector('.filename-input');
        const subtitleInput = entry.querySelector('.subtitle-input');
        
        const filename = fileNameInput.value.trim();

        if (filename) {
            if (!validateExtension(filename)) {
                return; 
            }

            hasAtLeastOneValidEntry = true;
            const entryObject = { file: filename };

            if (subtitleInput.value.trim()) {
                entryObject.subtitle = subtitleInput.value.trim();
            }
            
            entries.push(entryObject);
            
            if (includeFiles) {
                const file = audioFileCache.get(filename);
                if (file) {
                     files.push({ file: file, filename: filename });
                }
            }
        }
    });

    if (!hasAtLeastOneValidEntry) {
         return { isValid: false, entries: [] };
    }

    const responsePack = {
        name: modName,
        entries: entries
    };
    
    const { filesMissing } = validateAllEntries();

    return { isValid: true, responsePack, files, filesMissing: filesMissing, entries };
}

function updateConfigPreview() {
    const result = getAudioData(false, true); 
    const modName = document.getElementById('modName').value.trim();
    
    if (modName === "" || !result.isValid || result.entries.length === 0) {
         JSON_OUTPUT.value = ''; 
         JSON_ERROR_MSG.textContent = 'Add a valid Mod Name and at least one audio entry.';
         return;
    }
    
    JSON_ERROR_MSG.textContent = ''; 
    
    const responsePack = {
        name: modName,
        entries: result.entries 
    };

    JSON_OUTPUT.value = JSON.stringify(responsePack, null, 2);
    autoExpandTextarea(JSON_OUTPUT);
}

function handleJsonInput(textarea) {
    isUpdatingFromJson = true; 
	
    autoExpandTextarea(textarea);
    
    const jsonString = textarea.value;
    if (jsonString.trim() === '') {
        JSON_ERROR_MSG.textContent = 'JSON is empty.';
        isUpdatingFromJson = false; 
	
        return;
    }

    try {
        const data = JSON.parse(jsonString);
        
        if (!data || !data.name || !Array.isArray(data.entries)) {
            throw new Error("Invalid JSON structure. Must have 'name' (string) and 'entries' (array).");
        }
        
        document.getElementById('modName').value = data.name;

        const fragment = document.createDocumentFragment();
        const newEntries = data.entries;
        
        if (newEntries.length > 0) {
            newEntries.forEach(entry => {
                if (!entry || typeof entry.file !== 'string') {
                    console.warn("Skipping invalid entry:", entry);
                    return;
                }
                
                const entryData = {
                    filename: entry.file,
                    subtitle: entry.subtitle || '',
                    subtitleEnabled: !!entry.subtitle,
                    fileWasAttached: false 
                };
                fragment.appendChild(createAudioEntryElement(entryData));
            });
        }
        
        AUDIO_ENTRIES_CONTAINER.innerHTML = '';
        AUDIO_ENTRIES_CONTAINER.appendChild(fragment);
        
        if (AUDIO_ENTRIES_CONTAINER.children.length === 0) {
            AUDIO_ENTRIES_CONTAINER.appendChild(createAudioEntryElement());
        }

        JSON_ERROR_MSG.textContent = ''; 
        autoExpandTextarea(textarea);

    } catch (e) {
        JSON_ERROR_MSG.textContent = e.message;

        isUpdatingFromJson = false;
        return; 
    }
    
    isUpdatingFromJson = false; 
	
    updateUIState();
}

async function downloadConfigOnly() {
    const result = getAudioData(false); 
    if (DOWNLOAD_CONFIG_BUTTON.getAttribute('data-disabled') === 'true' || !result.isValid) {
        return;
    }
    
    const configJson = JSON.stringify(result.responsePack, null, 2);

    const content = new Blob([configJson], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `response_sound_pack.json`; 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function generateModPackage() {
    if (MOD_PACKAGE_BUTTON.getAttribute('data-disabled') === 'true') {
        return;
    }
    
    const audioResult = getAudioData(true); 
    
    if (!audioResult.isValid) {
         showModal("Validation Error", "Please fix all errors in the audio entries before generating a package.", { isError: true });
         return;
    }
    
    if (audioResult.filesMissing) {
        showModal("Files Missing", "Mod package creation requires all audio files to be uploaded. Please attach all files.", { isError: true });
        return;
    }

    const modName = document.getElementById('modName').value.replace(/\s+/g, '_') || 'Custom_BingBong_Pack';
    const manifestData = getManifestData();
    if (!manifestData) {
        showModal("Error", "Manifest data could not be generated. Make sure 'Create Full Mod Package' is checked.", { isError: true });
        return; 
    }

    const button = document.getElementById('modPackageButton');
    document.getElementById('downloadIcon').classList.add('hidden');
    document.getElementById('loadingSpinner').classList.remove('hidden');
    button.style.pointerEvents = 'none';

    try {
        const zip = new JSZip();
        const configJson = JSON.stringify(audioResult.responsePack, null, 2);
        
        const finalZipName = `${manifestData.name}-${manifestData.version_number}.zip`;
        
        zip.file("manifest.json", JSON.stringify(manifestData, null, 2));
        
        if (document.getElementById('includeReadme').checked) {
            const readmeContent = document.getElementById('readmeContent').value.trim() || document.getElementById('readmeContent').placeholder;
            zip.file("README.md", readmeContent);
        }
        if (document.getElementById('includeChangelog').checked) {
            const changelogContent = document.getElementById('changelogContent').value.trim() || document.getElementById('changelogContent').placeholder;
            zip.file("CHANGELOG.md", changelogContent);
        }
        
        if (dllFileStore.size > 0) {
            for (const dllFile of dllFileStore.values()) {
                zip.file(dllFile.name, dllFile);
            }
        }

        const subFolder = zip.folder(modName);
        subFolder.file("response_sound_pack.json", configJson);
        
        const iconFile = iconFileCache;
        if (iconFile) {
            zip.file("icon.png", iconFile);
        }

        audioResult.files.forEach(item => {
            subFolder.file(item.filename, item.file);
        });
        
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = finalZipName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        showModal("Package Failed", "Failed to generate local zip file: " + error.message, { isError: true });
        console.error("Local Mod Package Generation Error:", error);
    } finally {
        document.getElementById('downloadIcon').classList.remove('hidden');
        document.getElementById('loadingSpinner').classList.add('hidden');
        button.style.pointerEvents = 'auto'; 
    }
}


/**
 * Clears the form caches and UI without clearing localStorage or showing a prompt.
 * Used right before importing a new ZIP.
 */
function resetFormForImport() {
    audioFileCache.clear();
    dllFileStore.clear();
    
    document.getElementById('modName').value = 'Custom_BingBong_Pack';
    document.getElementById('isModPackage').checked = false;
    document.getElementById('version').value = '1.0.0';
    document.getElementById('author').value = 'YourAuthorName';
    document.getElementById('description').value = '';
    document.getElementById('websiteUrl').value = '';
    
    clearIconFile();
    
    document.getElementById('dllFiles').value = null;
    updateDllFileList(); 
    
    document.getElementById('includeReadme').checked = false;
    document.getElementById('readmeContent').value = '';
    
    document.getElementById('includeChangelog').checked = false;
    document.getElementById('changelogContent').value = '';
    
    toggleModOptions(false);
    toggleMarkdownEditor('readme', false);
    toggleMarkdownEditor('changelog', false);
    
    document.getElementById('dependencyEntries').innerHTML = '';
    addDependencyEntry(DEFAULT_DEPENDENCY_STRING);

    AUDIO_ENTRIES_CONTAINER.innerHTML = ''; 
    AUDIO_ENTRIES_CONTAINER.appendChild(createAudioEntryElement());
    
    JSON_OUTPUT.value = '';
    JSON_ERROR_MSG.textContent = '';
    
    document.querySelectorAll('textarea').forEach(el => {
        el.style.height = 'auto';
        autoExpandTextarea(el);
    });
    
    populateDefaultMarkdown();
}

/**
 * NEW: Main import router.
 * @param {HTMLInputElement} input - The file input element.
 */
async function handleImport(input) {
    const file = input.files[0];
    if (!file) return;

    const spinner = document.getElementById('importSpinner');
    spinner.classList.remove('hidden');

    try {
        if (file.name.endsWith('.zip')) {
            await importZip(file);
        } else if (file.name === 'manifest.json') {
            await importManifest(file);
        } else if (file.name.endsWith('response_sound_pack.json')) { 
            await importConfig(file);
        } else {
            throw new Error("Invalid file type. Please upload a .zip, manifest.json, or response_sound_pack.json");
        }
    } catch (e) {
        showModal("Import Failed", e.message, { isError: true });
        console.error("Failed to import file:", e);
        loadFormState();
    } finally {
        spinner.classList.add('hidden');
        input.value = null; 
    }
}

/**
 * NEW: Imports a standalone manifest.json file.
 * @param {File} file - The manifest.json file.
 */
async function importManifest(file) {
    const manifestText = await file.text();
    const manifestData = JSON.parse(manifestText);
    
    resetFormForImport();
    
    document.getElementById('modName').value = manifestData.name || 'Custom_BingBong_Pack';
    document.getElementById('version').value = manifestData.version_number || '1.0.0';
    
    let authorName = 'YourAuthorName';
    if (manifestData.namespace) {
        authorName = manifestData.namespace;
    } else if (manifestData.name) {
        authorName = manifestData.name;
    }
    document.getElementById('author').value = authorName;
    
    document.getElementById('description').value = manifestData.description || '';
    document.getElementById('websiteUrl').value = manifestData.website_url || '';

    document.getElementById('isModPackage').checked = true;
    toggleModOptions(true); 

    document.getElementById('dependencyEntries').innerHTML = ''; 
    if (manifestData.dependencies && manifestData.dependencies.length > 0) {
        manifestData.dependencies.forEach(dep => addDependencyEntry(dep));
    } else {
        addDependencyEntry(DEFAULT_DEPENDENCY_STRING); 
    }
    
    document.querySelectorAll('textarea').forEach(autoExpandTextarea);
    updateUIState();
    showModal("Import Successful", "Loaded manifest.json. All other fields have been reset.");
}

/**
 * NEW: Imports a standalone response_sound_pack.json file.
 * @param {File} file - The response_sound_pack.json file.
 */
async function importConfig(file) {
    const configText = await file.text();
    const configData = JSON.parse(configText);

    resetFormForImport();
    
    if (!configData.name || !Array.isArray(configData.entries)) {
        throw new Error("Invalid response_sound_pack.json structure.");
    }
    
    document.getElementById('modName').value = configData.name || 'Custom_BingBong_Pack';
    
    JSON_OUTPUT.value = JSON.stringify(configData, null, 2);
    handleJsonInput(JSON_OUTPUT); 
    
    document.querySelectorAll('textarea').forEach(autoExpandTextarea);
    updateUIState(); 
    showModal("Import Successful", "Loaded response_sound_pack.json. Please re-upload all audio files.");
}

/**
 * Helper function to escape regex special characters.
 * @param {string} str - The string to escape.
 */
function escapeRegExp(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Imports and parses a full mod package ZIP file.
 * @param {File} file - The .zip file.
 */
async function importZip(file) {
    resetFormForImport();
    let audioSubFolder = ''; 
    let manifestFound = false;
    
    const zip = await JSZip.loadAsync(file);
    
    const manifestZipObjs = zip.file(/manifest\.json$/i); 
    if (manifestZipObjs.length > 0) {
        manifestFound = true;
        const manifestZipObj = manifestZipObjs[0];
        const manifestText = await manifestZipObj.async("string");
        const manifestData = JSON.parse(manifestText);
        
        document.getElementById('modName').value = manifestData.name || 'Custom_BingBong_Pack';
        document.getElementById('version').value = manifestData.version_number || '1.0.0';
        
        let authorName = 'YourAuthorName'; 
        const zipNameParts = file.name.replace('.zip', '').split('-');
        
        if (zipNameParts.length >= 3) { 
            authorName = zipNameParts[0]; 
        } else if (manifestData.namespace) {
            authorName = manifestData.namespace; 
        } else if (manifestData.name) {
            authorName = manifestData.name; 
        }
        document.getElementById('author').value = authorName;
    
        document.getElementById('description').value = manifestData.description || '';
        document.getElementById('websiteUrl').value = manifestData.website_url || '';

        document.getElementById('isModPackage').checked = true;
        toggleModOptions(true); 

        document.getElementById('dependencyEntries').innerHTML = ''; 
        if (manifestData.dependencies && manifestData.dependencies.length > 0) {
            manifestData.dependencies.forEach(dep => addDependencyEntry(dep));
        } else {
            addDependencyEntry(DEFAULT_DEPENDENCY_STRING); 
        }
    }
    
    const iconZipObjs = zip.file(/icon\.png$/i);
    let iconZipObj = null;
    if (iconZipObjs.length > 0) {

        iconZipObj = iconZipObjs.find(obj => !obj.name.includes('/') && !obj.name.includes('\\')) || iconZipObjs[0];
    }
    
    if (iconZipObj) {
        const iconBlob = await iconZipObj.async("blob");

        const iconName = iconZipObj.name.split('/').pop().split('\\').pop();
        const iconFile = new File([iconBlob], iconName, { type: iconBlob.type || 'image/png' });
        setIconFile(iconFile); 
    }
    
    const readmeZipObj = zip.file("README.md"); 
    if (readmeZipObj) {
        const readmeText = await readmeZipObj.async("string");
        document.getElementById('readmeContent').value = readmeText;
        document.getElementById('includeReadme').checked = true;
        toggleMarkdownEditor('readme', true);
    }
    
    const changelogZipObj = zip.file("CHANGELOG.md");
    if (changelogZipObj) {
        const changelogText = await changelogZipObj.async("string");
        document.getElementById('changelogContent').value = changelogText;
        document.getElementById('includeChangelog').checked = true;
        toggleMarkdownEditor('changelog', true);
    }
    
    const dllFiles = zip.file(/\.dll$/i); 
    for (const dllZipObj of dllFiles) {

        if (dllZipObj.name.includes('/') || dllZipObj.name.includes('\\')) continue; 
        
        const dllBlob = await dllZipObj.async("blob");
        const dllFile = new File([dllBlob], dllZipObj.name, { type: dllBlob.type });
        dllFileStore.set(dllFile.name, dllFile);
    }
    updateDllFileList(); 

    const missingAudioFiles = []; 
    
    const configZipObjs = zip.file(/response_sound_pack\.json$/i);
    if (configZipObjs.length > 0) {
        const configZipObj = configZipObjs[0];
        
        const fullPath = configZipObj.name;
        const lastSlash = fullPath.lastIndexOf('/');
        if (lastSlash !== -1) {
            audioSubFolder = fullPath.substring(0, lastSlash + 1); 
        }
        
        const configText = await configZipObj.async("string");
        const configData = JSON.parse(configText);
        
        if (!manifestFound) {
            document.getElementById('modName').value = configData.name || 'Custom_BingBong_Pack';
        }
        
        await Promise.all(configData.entries.map(async (entry) => {

            const escapedName = escapeRegExp(entry.file);
            const audioRegex = new RegExp(`^${escapeRegExp(audioSubFolder)}${escapedName}$`, 'i');
            const audioZipObjs = zip.file(audioRegex);
            
            if (audioZipObjs.length > 0) {
                const audioZipObj = audioZipObjs[0];
                const audioBlob = await audioZipObj.async("blob");
                const audioFile = new File([audioBlob], entry.file, { type: audioBlob.type || 'audio/mpeg' });
                audioFileCache.set(audioFile.name, audioFile); 
            } else {
                console.warn(`Audio file not found in zip: ${audioSubFolder}${entry.file}`);
                missingAudioFiles.push(entry.file); 
            }
        }));
        
        JSON_OUTPUT.value = JSON.stringify(configData, null, 2);
        handleJsonInput(JSON_OUTPUT); 
    }

    document.querySelectorAll('textarea').forEach(autoExpandTextarea);
    updateUIState(); 
    
    if (missingAudioFiles.length > 0) {

        const missingFilesList = missingAudioFiles.map(f => `&nbsp;&nbsp;- ${f}`).join('<br>');
        showModal("Import Warning", 
                  `Mod loaded, but ${missingAudioFiles.length} audio file(s) could not be found in the zip. They may be misspelled or missing:<br><div class="modal-pre">${missingFilesList}</div>`, 
                  { isError: true });
    } else {
        showModal("Import Successful", "Your mod package has been loaded and all files have been cached in memory, ready to edit.");
    }
}

function saveFormState() {
    try {
        const audioEntries = [];
        AUDIO_ENTRIES_CONTAINER.querySelectorAll('.entry-container').forEach(entry => {
            const filename = entry.querySelector('.filename-input').value;
            const subtitle = entry.querySelector('.subtitle-input').value;
            const subtitleEnabled = entry.querySelector('.subtitle-toggle').checked;
            const fileWasAttached = audioFileCache.has(filename);
            
            if (filename.trim()) {
                audioEntries.push({ filename, subtitle, subtitleEnabled, fileWasAttached });
            }
        });
        
        const dependencies = Array.from(document.querySelectorAll('#dependencyEntries .dependency-input')).map(input => input.value);

        const state = {
            modName: document.getElementById('modName').value,
            isModPackage: document.getElementById('isModPackage').checked,
            version: document.getElementById('version').value,
            author: document.getElementById('author').value,
            description: document.getElementById('description').value,
            websiteUrl: document.getElementById('websiteUrl').value, 
            includeReadme: document.getElementById('includeReadme').checked,
            readmeContent: document.getElementById('readmeContent').value,
            includeChangelog: document.getElementById('includeChangelog').checked,
            changelogContent: document.getElementById('changelogContent').value,
            dependencies: dependencies, 
            audioEntries: audioEntries

        };

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn("Failed to save state to localStorage. It might be full or disabled.", e);
    }
}

function loadFormState() {
    audioFileCache.clear();
    dllFileStore.clear();
    iconFileCache = null;
    
    const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!savedState) return false;

    try {
        const state = JSON.parse(savedState);
        
        document.getElementById('modName').value = state.modName || 'Custom_BingBong_Pack';
        document.getElementById('version').value = state.version || '1.0.0';
        document.getElementById('author').value = state.author || 'YourAuthorName';
        document.getElementById('description').value = state.description || '';
        document.getElementById('websiteUrl').value = state.websiteUrl || ''; 

        if (state.isModPackage) {
            document.getElementById('isModPackage').checked = true;
            toggleModOptions(true); 
        }
        
        if (state.includeReadme) {
            document.getElementById('includeReadme').checked = true;
            document.getElementById('readmeContent').value = state.readmeContent || '';
            toggleMarkdownEditor('readme', true);
        }

        if (state.includeChangelog) {
            document.getElementById('includeChangelog').checked = true;
            document.getElementById('changelogContent').value = state.changelogContent || '';
            toggleMarkdownEditor('changelog', true);
        }
        
        document.getElementById('dependencyEntries').innerHTML = ''; 
        if (state.dependencies && state.dependencies.length > 0) {
            state.dependencies.forEach(dep => addDependencyEntry(dep));
        } else {
            addDependencyEntry(DEFAULT_DEPENDENCY_STRING); 
        }
        
        AUDIO_ENTRIES_CONTAINER.innerHTML = ''; 
        
        if (state.audioEntries && state.audioEntries.length > 0) {
            state.audioEntries.forEach(entryData => AUDIO_ENTRIES_CONTAINER.appendChild(createAudioEntryElement(entryData)));
        } else {
             AUDIO_ENTRIES_CONTAINER.appendChild(createAudioEntryElement()); 
        }

        document.querySelectorAll('textarea').forEach(autoExpandTextarea);

        updateConfigPreview();
        
        console.log("Form state loaded from localStorage.");
        return true;
    } catch (e) {
        console.error("Failed to load saved state:", e);
localStorage.removeItem(LOCAL_STORAGE_KEY); 
        return false;
    }
}

function clearForm() {
    showModal("Clear Form?", "Are you sure you want to clear all data? This will reset the entire form and cannot be undone.", {
        isError: true, 
        confirmCallback: doClearForm 
    });
}

function doClearForm() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    audioFileCache.clear();
    dllFileStore.clear();
    
    document.getElementById('modName').value = 'Custom_BingBong_Pack';
    document.getElementById('isModPackage').checked = false;
    document.getElementById('version').value = '1.0.0';
    document.getElementById('author').value = 'YourAuthorName';
    document.getElementById('description').value = '';
    document.getElementById('websiteUrl').value = ''; 
    
    clearIconFile(); 
    
    document.getElementById('dllFiles').value = null;
    updateDllFileList(); 
	
    document.getElementById('includeReadme').checked = false;
    document.getElementById('readmeContent').value = '';
    
    document.getElementById('includeChangelog').checked = false;
    document.getElementById('changelogContent').value = '';
    
    toggleModOptions(false);
    toggleMarkdownEditor('readme', false);
    toggleMarkdownEditor('changelog', false);
    
    document.getElementById('dependencyEntries').innerHTML = '';
    addDependencyEntry(DEFAULT_DEPENDENCY_STRING); 

    AUDIO_ENTRIES_CONTAINER.innerHTML = ''; 
    
    AUDIO_ENTRIES_CONTAINER.appendChild(createAudioEntryElement());
    
    JSON_OUTPUT.value = '';
    JSON_ERROR_MSG.textContent = '';
    
    document.querySelectorAll('textarea').forEach(el => {
        el.style.height = 'auto'; 
        autoExpandTextarea(el);
    });
    
    updateUIState();
    
    populateDefaultMarkdown();
}