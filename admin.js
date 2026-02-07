const sectionList = document.getElementById('sectionList');
const sectionForm = document.getElementById('sectionForm');
const itemForm = document.getElementById('itemForm');
const itemSectionSelect = document.getElementById('itemSection');
const itemTypeSelect = document.getElementById('itemType');
const itemTitleInput = document.getElementById('itemTitle');
const itemStatusInput = document.getElementById('itemStatus');
const itemCommitteeInput = document.getElementById('itemCommittee');
const itemAbstractInput = document.getElementById('itemAbstract');
const itemLinksInput = document.getElementById('itemLinks');
const editSectionIndexInput = document.getElementById('editSectionIndex');
const editItemIndexInput = document.getElementById('editItemIndex');
const saveItemButton = document.getElementById('saveItemButton');
const resetItemButton = document.getElementById('resetItemButton');
const downloadJsonButton = document.getElementById('downloadJson');
const downloadJsButton = document.getElementById('downloadJs');
const copyJsonButton = document.getElementById('copyJson');
const importJsonInput = document.getElementById('importJson');
const reloadJsonButton = document.getElementById('reloadJson');
const adminStatus = document.getElementById('adminStatus');

let state = { sections: [] };

const persistDraft = () => {
    try {
        localStorage.setItem('researchDraft', JSON.stringify(state));
    } catch (error) {
        // Ignore storage errors (private mode, quota, etc.).
    }
};

const setStatus = (message) => {
    adminStatus.textContent = message;
    if (message) {
        setTimeout(() => {
            adminStatus.textContent = '';
        }, 4000);
    }
};

const parseLinks = (raw) => {
    if (!raw) {
        return [];
    }

    return raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const parts = line.split('|').map((part) => part.trim());
            return {
                label: parts[0] || 'Link',
                url: parts[1] || ''
            };
        })
        .filter((link) => link.url);
};

const linksToText = (links) => {
    if (!Array.isArray(links) || links.length === 0) {
        return '';
    }

    return links
        .map((link) => `${link.label || 'Link'} | ${link.url || ''}`)
        .join('\n');
};

const refreshSectionOptions = () => {
    itemSectionSelect.innerHTML = '';
    state.sections.forEach((section, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = section.title || `Section ${index + 1}`;
        itemSectionSelect.append(option);
    });
};

const resetItemForm = () => {
    editSectionIndexInput.value = '';
    editItemIndexInput.value = '';
    itemTypeSelect.value = 'publication';
    itemTitleInput.value = '';
    itemStatusInput.value = '';
    itemCommitteeInput.value = '';
    itemAbstractInput.value = '';
    itemLinksInput.value = '';
    saveItemButton.textContent = 'Add item';
};

const renderSections = () => {
    sectionList.innerHTML = '';

    state.sections.forEach((section, sectionIndex) => {
        const sectionCard = document.createElement('div');
        sectionCard.className = 'section-card';

        const header = document.createElement('div');
        header.className = 'section-header';

        const titleInput = document.createElement('input');
        titleInput.className = 'section-title-input';
        titleInput.value = section.title || '';
        titleInput.addEventListener('change', () => {
            const nextTitle = titleInput.value.trim();
            state.sections[sectionIndex].title = nextTitle || `Section ${sectionIndex + 1}`;
            refreshSectionOptions();
            persistDraft();
        });

        const altWrapper = document.createElement('label');
        altWrapper.className = 'checkbox-row';
        const altInput = document.createElement('input');
        altInput.type = 'checkbox';
        altInput.checked = Boolean(section.altBg);
        altInput.addEventListener('change', () => {
            state.sections[sectionIndex].altBg = altInput.checked;
            persistDraft();
        });
        const altLabel = document.createElement('span');
        altLabel.textContent = 'Alt background';
        altWrapper.append(altInput, altLabel);

        const deleteSectionButton = document.createElement('button');
        deleteSectionButton.type = 'button';
        deleteSectionButton.className = 'admin-link danger';
        deleteSectionButton.textContent = 'Delete section';
        deleteSectionButton.addEventListener('click', () => {
            state.sections.splice(sectionIndex, 1);
            refreshSectionOptions();
            renderSections();
            persistDraft();
        });

        header.append(titleInput, altWrapper, deleteSectionButton);
        sectionCard.append(header);

        const itemList = document.createElement('div');
        itemList.className = 'item-list';

        if (!Array.isArray(section.items) || section.items.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'item-empty';
            empty.textContent = 'No items yet.';
            itemList.append(empty);
        } else {
            section.items.forEach((item, itemIndex) => {
                const itemCard = document.createElement('div');
                itemCard.className = 'item-card';

                const itemInfo = document.createElement('div');
                const itemTitle = document.createElement('strong');
                itemTitle.textContent = item.title;
                itemInfo.append(itemTitle);

                if (item.status) {
                    const itemMeta = document.createElement('p');
                    itemMeta.className = 'item-meta';
                    itemMeta.textContent = item.status;
                    itemInfo.append(itemMeta);
                }

                const actions = document.createElement('div');
                actions.className = 'item-actions';

                const editButton = document.createElement('button');
                editButton.type = 'button';
                editButton.className = 'admin-link';
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', () => {
                    itemSectionSelect.value = String(sectionIndex);
                    itemTypeSelect.value = item.type || 'publication';
                    itemTitleInput.value = item.title || '';
                    itemStatusInput.value = item.status || '';
                    itemCommitteeInput.value = item.committee || '';
                    itemAbstractInput.value = item.abstract || '';
                    itemLinksInput.value = linksToText(item.links);
                    editSectionIndexInput.value = String(sectionIndex);
                    editItemIndexInput.value = String(itemIndex);
                    saveItemButton.textContent = 'Update item';
                    itemTitleInput.focus();
                });

                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.className = 'admin-link danger';
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => {
                    state.sections[sectionIndex].items.splice(itemIndex, 1);
                    renderSections();
                    persistDraft();
                });

                actions.append(editButton, deleteButton);
                itemCard.append(itemInfo, actions);
                itemList.append(itemCard);
            });
        }

        sectionCard.append(itemList);
        sectionList.append(sectionCard);
    });
};

const renderAll = () => {
    refreshSectionOptions();
    renderSections();
    persistDraft();
};

const addOrUpdateItem = () => {
    const sectionIndex = Number(itemSectionSelect.value);
    if (!Number.isFinite(sectionIndex) || !state.sections[sectionIndex]) {
        setStatus('Pick a section first.');
        return;
    }

    const item = {
        title: itemTitleInput.value.trim(),
        abstract: itemAbstractInput.value.trim()
    };

    if (!item.title || !item.abstract) {
        setStatus('Title and abstract are required.');
        return;
    }

    const status = itemStatusInput.value.trim();
    if (status) {
        item.status = status;
    }

    const committee = itemCommitteeInput.value.trim();
    if (committee) {
        item.committee = committee;
    }

    const links = parseLinks(itemLinksInput.value);
    if (links.length > 0) {
        item.links = links;
    }

    if (itemTypeSelect.value === 'dissertation') {
        item.type = 'dissertation';
    }

    const editSectionIndex = editSectionIndexInput.value;
    const editItemIndex = editItemIndexInput.value;

    if (editSectionIndex !== '' && editItemIndex !== '') {
        state.sections[Number(editSectionIndex)].items[Number(editItemIndex)] = item;
        setStatus('Item updated.');
    } else {
        state.sections[sectionIndex].items.push(item);
        setStatus('Item added.');
    }

    resetItemForm();
    renderSections();
    persistDraft();
};

const downloadJson = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'research.json';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus('Downloaded research.json');
};

const downloadJs = () => {
    const data = `window.RESEARCH_DATA = ${JSON.stringify(state, null, 2)};\\n`;
    const blob = new Blob([data], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'research-data.js';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus('Downloaded research-data.js');
};

const copyJson = () => {
    const data = JSON.stringify(state, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(data)
            .then(() => setStatus('JSON copied to clipboard.'))
            .catch(() => setStatus('Unable to copy JSON.'));
    } else {
        setStatus('Clipboard not available.');
    }
};

const importJson = (file) => {
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result);
            if (!parsed || !Array.isArray(parsed.sections)) {
                throw new Error('Invalid JSON format.');
            }
            state = parsed;
            renderAll();
            resetItemForm();
            setStatus('JSON imported.');
        } catch (error) {
            setStatus('Invalid JSON file.');
        }
    };
    reader.readAsText(file);
};

const loadFromSite = () => {
    fetch('research.json')
        .then((response) => {
            if (!response.ok) {
                throw new Error('Load failed');
            }
            return response.json();
        })
        .then((data) => {
            state = data;
            renderAll();
            resetItemForm();
            setStatus('Loaded from research.json');
        })
        .catch(() => setStatus('Unable to load research.json'));
};

sectionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const titleInput = document.getElementById('sectionTitle');
    const altInput = document.getElementById('sectionAltBg');
    const title = titleInput.value.trim();
    if (!title) {
        return;
    }
    state.sections.push({ title, altBg: altInput.checked, items: [] });
    titleInput.value = '';
    altInput.checked = false;
    renderAll();
    setStatus('Section added.');
});

itemForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addOrUpdateItem();
});

resetItemButton.addEventListener('click', () => {
    resetItemForm();
});

downloadJsonButton.addEventListener('click', downloadJson);
downloadJsButton.addEventListener('click', downloadJs);
copyJsonButton.addEventListener('click', copyJson);
importJsonInput.addEventListener('change', (event) => {
    importJson(event.target.files[0]);
    importJsonInput.value = '';
});
reloadJsonButton.addEventListener('click', loadFromSite);

loadFromSite();
