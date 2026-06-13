// Admin editor for the whole site. Edits a draft of SITE_DATA in
// localStorage; "Publish" commits site-data.js to GitHub via the API.
(function () {
    'use strict';

    var DRAFT_KEY = 'siteDraft';
    var GH_KEY = 'adminGhSettings';

    /* ---------------------------------------------------------------- */
    /* State                                                              */
    /* ---------------------------------------------------------------- */

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function normalize(data) {
        data = data && typeof data === 'object' ? data : {};
        data.profile = data.profile || {};
        data.profile.links = Array.isArray(data.profile.links) ? data.profile.links : [];
        data.profile.interests = Array.isArray(data.profile.interests) ? data.profile.interests : [];
        data.profile.bio = Array.isArray(data.profile.bio) ? data.profile.bio : [];
        data.research = data.research || {};
        data.research.sections = Array.isArray(data.research.sections) ? data.research.sections : [];
        data.teaching = data.teaching || {};
        data.teaching.entries = Array.isArray(data.teaching.entries) ? data.teaching.entries : [];
        data.cv = data.cv || {};
        data.cv.sections = Array.isArray(data.cv.sections) ? data.cv.sections : [];
        return data;
    }

    function readDraft() {
        try {
            var raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) { return null; }
            var parsed = JSON.parse(raw);
            return parsed && parsed.profile ? parsed : null;
        } catch (e) {
            return null;
        }
    }

    var published = normalize(clone(window.SITE_DATA || {}));
    var state = normalize(readDraft() || clone(published));

    function persist() {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
        } catch (e) {
            setStatus('Could not save draft (browser storage unavailable).', true);
        }
    }

    /* ---------------------------------------------------------------- */
    /* Small helpers                                                      */
    /* ---------------------------------------------------------------- */

    var statusEl = document.getElementById('adminStatus');
    var statusTimer = null;

    function setStatus(message, isError) {
        statusEl.textContent = message;
        statusEl.classList.toggle('error', Boolean(isError));
        clearTimeout(statusTimer);
        if (message) {
            statusTimer = setTimeout(function () { statusEl.textContent = ''; }, 4000);
        }
    }

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) { node.className = className; }
        if (text !== undefined && text !== null) { node.textContent = text; }
        return node;
    }

    function getPath(obj, path) {
        return path.split('.').reduce(function (acc, key) {
            return acc == null ? acc : acc[key];
        }, obj);
    }

    function setPath(obj, path, value) {
        var keys = path.split('.');
        var last = keys.pop();
        var target = keys.reduce(function (acc, key) {
            if (acc[key] == null || typeof acc[key] !== 'object') { acc[key] = {}; }
            return acc[key];
        }, obj);
        target[last] = value;
    }

    function move(list, from, to) {
        if (to < 0 || to >= list.length) { return; }
        var item = list.splice(from, 1)[0];
        list.splice(to, 0, item);
    }

    function parseLinks(raw) {
        return (raw || '')
            .split('\n')
            .map(function (line) { return line.trim(); })
            .filter(Boolean)
            .map(function (line) {
                var parts = line.split('|').map(function (part) { return part.trim(); });
                return { label: parts[0] || 'Link', url: parts[1] || '' };
            })
            .filter(function (link) { return link.url; });
    }

    function linksToText(links) {
        return (links || [])
            .map(function (link) { return (link.label || 'Link') + ' | ' + (link.url || ''); })
            .join('\n');
    }

    function field(labelText, value, onChange, opts) {
        opts = opts || {};
        var wrap = el('div', 'field');
        var label = el('label', null, labelText);
        var input = el(opts.textarea ? 'textarea' : 'input');
        if (!opts.textarea) { input.type = 'text'; }
        if (opts.minHeight) { input.style.minHeight = opts.minHeight; }
        input.value = value || '';
        input.addEventListener('input', function () {
            onChange(input.value);
            persist();
        });
        wrap.append(label, input);
        return wrap;
    }

    // A "Visible / Hidden" pill that flips target.hidden. When hidden, the
    // section/item stays in your data but is left off the published site.
    function visToggle(target, onToggle) {
        var btn = el('button', 'admin-link vis-toggle');
        btn.type = 'button';
        btn.title = 'Show or hide this on the live site';
        function sync() {
            btn.textContent = target.hidden ? 'Hidden' : 'Visible';
            btn.classList.toggle('is-off', Boolean(target.hidden));
        }
        sync();
        btn.addEventListener('click', function () {
            target.hidden = !target.hidden;
            onToggle();
            persist();
        });
        return btn;
    }

    function toolbarButtons(onUp, onDown, onDelete, target, onToggle) {
        var bar = el('div', 'entry-card-toolbar');
        var up = el('button', 'admin-link', '↑');
        up.type = 'button';
        up.title = 'Move up';
        up.addEventListener('click', onUp);
        var down = el('button', 'admin-link', '↓');
        down.type = 'button';
        down.title = 'Move down';
        down.addEventListener('click', onDown);
        var del = el('button', 'admin-link danger', 'Delete');
        del.type = 'button';
        del.addEventListener('click', onDelete);
        if (target) { bar.append(visToggle(target, onToggle)); }
        bar.append(up, down, del);
        return bar;
    }

    /* ---------------------------------------------------------------- */
    /* Tabs                                                               */
    /* ---------------------------------------------------------------- */

    var tabs = document.querySelectorAll('.admin-tab');
    var panels = document.querySelectorAll('.tab-panel');

    function activateTab(name) {
        tabs.forEach(function (tab) {
            tab.classList.toggle('active', tab.dataset.tab === name);
        });
        panels.forEach(function (panel) {
            panel.classList.toggle('active', panel.id === 'tab-' + name);
        });
    }

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () { activateTab(tab.dataset.tab); });
    });

    document.getElementById('goPublish').addEventListener('click', function () {
        activateTab('publish');
    });

    /* ---------------------------------------------------------------- */
    /* Profile tab                                                        */
    /* ---------------------------------------------------------------- */

    function bindProfileFields() {
        document.querySelectorAll('[data-path]').forEach(function (input) {
            input.value = getPath(state, input.dataset.path) || '';
            input.oninput = function () {
                setPath(state, input.dataset.path, input.value);
                persist();
            };
        });

        document.querySelectorAll('[data-list]').forEach(function (input) {
            var path = input.dataset.list;
            var sep = input.dataset.sep;
            var list = getPath(state, path) || [];
            input.value = sep === 'paragraph' ? list.join('\n\n') : list.join(', ');
            input.oninput = function () {
                var items;
                if (sep === 'paragraph') {
                    items = input.value.split(/\n\s*\n/);
                } else {
                    items = input.value.split(sep);
                }
                items = items.map(function (item) { return item.trim(); }).filter(Boolean);
                setPath(state, path, items);
                persist();
            };
        });

        var linksInput = document.getElementById('pfLinks');
        linksInput.value = linksToText(state.profile.links);
        linksInput.oninput = function () {
            state.profile.links = parseLinks(linksInput.value);
            persist();
        };
    }

    /* ---------------------------------------------------------------- */
    /* Research tab                                                       */
    /* ---------------------------------------------------------------- */

    var sectionList = document.getElementById('sectionList');
    var sectionForm = document.getElementById('sectionForm');
    var itemForm = document.getElementById('itemForm');
    var itemSectionSelect = document.getElementById('itemSection');
    var itemTypeSelect = document.getElementById('itemType');
    var itemTitleInput = document.getElementById('itemTitle');
    var itemStatusInput = document.getElementById('itemStatus');
    var itemCommitteeInput = document.getElementById('itemCommittee');
    var itemAbstractInput = document.getElementById('itemAbstract');
    var itemLinksInput = document.getElementById('itemLinks');
    var editSectionIndexInput = document.getElementById('editSectionIndex');
    var editItemIndexInput = document.getElementById('editItemIndex');
    var saveItemButton = document.getElementById('saveItemButton');
    var itemFormTitle = document.getElementById('itemFormTitle');

    function researchSections() {
        return state.research.sections;
    }

    function refreshSectionOptions() {
        itemSectionSelect.innerHTML = '';
        researchSections().forEach(function (section, index) {
            var option = document.createElement('option');
            option.value = String(index);
            option.textContent = section.title || 'Section ' + (index + 1);
            itemSectionSelect.append(option);
        });
    }

    function resetItemForm() {
        editSectionIndexInput.value = '';
        editItemIndexInput.value = '';
        itemTypeSelect.value = 'publication';
        itemTitleInput.value = '';
        itemStatusInput.value = '';
        itemCommitteeInput.value = '';
        itemAbstractInput.value = '';
        itemLinksInput.value = '';
        saveItemButton.textContent = 'Add item';
        itemFormTitle.textContent = 'Add item';
    }

    function renderResearchAdmin() {
        refreshSectionOptions();
        sectionList.innerHTML = '';

        researchSections().forEach(function (section, sectionIndex) {
            var card = el('div', 'section-card');
            card.classList.toggle('is-hidden', Boolean(section.hidden));

            var header = el('div', 'section-header');
            var titleInput = el('input', 'section-title-input');
            titleInput.value = section.title || '';
            titleInput.addEventListener('input', function () {
                section.title = titleInput.value;
                refreshSectionOptions();
                persist();
            });

            var up = el('button', 'admin-link', '↑');
            up.type = 'button';
            up.title = 'Move up';
            up.addEventListener('click', function () {
                move(researchSections(), sectionIndex, sectionIndex - 1);
                renderResearchAdmin();
                persist();
            });

            var down = el('button', 'admin-link', '↓');
            down.type = 'button';
            down.title = 'Move down';
            down.addEventListener('click', function () {
                move(researchSections(), sectionIndex, sectionIndex + 1);
                renderResearchAdmin();
                persist();
            });

            var del = el('button', 'admin-link danger', 'Delete');
            del.type = 'button';
            del.addEventListener('click', function () {
                var count = (section.items || []).length;
                if (count && !confirm('Delete "' + (section.title || 'this section') + '" and its ' + count + ' item(s)?')) {
                    return;
                }
                researchSections().splice(sectionIndex, 1);
                renderResearchAdmin();
                persist();
            });

            header.append(titleInput, visToggle(section, renderResearchAdmin), up, down, del);
            card.append(header);

            var itemList = el('div', 'item-list');
            var items = Array.isArray(section.items) ? section.items : (section.items = []);

            if (!items.length) {
                itemList.append(el('p', 'item-empty', 'No items yet.'));
            }

            items.forEach(function (item, itemIndex) {
                var itemCard = el('div', 'item-card');
                itemCard.classList.toggle('is-hidden', Boolean(item.hidden));

                var info = el('div');
                var title = el('strong', null, item.title || '(untitled)');
                info.append(title);
                if (item.status) {
                    info.append(el('p', 'item-meta', item.status));
                }

                var actions = el('div', 'item-actions');
                actions.append(visToggle(item, renderResearchAdmin));

                var itemUp = el('button', 'admin-link', '↑');
                itemUp.type = 'button';
                itemUp.addEventListener('click', function () {
                    move(items, itemIndex, itemIndex - 1);
                    renderResearchAdmin();
                    persist();
                });

                var itemDown = el('button', 'admin-link', '↓');
                itemDown.type = 'button';
                itemDown.addEventListener('click', function () {
                    move(items, itemIndex, itemIndex + 1);
                    renderResearchAdmin();
                    persist();
                });

                var edit = el('button', 'admin-link', 'Edit');
                edit.type = 'button';
                edit.addEventListener('click', function () {
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
                    itemFormTitle.textContent = 'Edit item';
                    itemTitleInput.focus();
                });

                var itemDel = el('button', 'admin-link danger', 'Delete');
                itemDel.type = 'button';
                itemDel.addEventListener('click', function () {
                    if (!confirm('Delete this item?')) { return; }
                    items.splice(itemIndex, 1);
                    renderResearchAdmin();
                    persist();
                });

                actions.append(itemUp, itemDown, edit, itemDel);
                itemCard.append(info, actions);
                itemList.append(itemCard);
            });

            card.append(itemList);
            sectionList.append(card);
        });
    }

    sectionForm.addEventListener('submit', function (event) {
        event.preventDefault();
        var titleInput = document.getElementById('sectionTitle');
        var title = titleInput.value.trim();
        if (!title) { return; }
        researchSections().push({ title: title, items: [] });
        titleInput.value = '';
        renderResearchAdmin();
        persist();
        setStatus('Section added.');
    });

    itemForm.addEventListener('submit', function (event) {
        event.preventDefault();

        var sectionIndex = Number(itemSectionSelect.value);
        if (!Number.isFinite(sectionIndex) || !researchSections()[sectionIndex]) {
            setStatus('Add a section first.', true);
            return;
        }

        var item = { title: itemTitleInput.value.trim() };
        if (!item.title) {
            setStatus('A title is required.', true);
            return;
        }
        if (itemTypeSelect.value === 'dissertation') { item.type = 'dissertation'; }
        if (itemStatusInput.value.trim()) { item.status = itemStatusInput.value.trim(); }
        if (itemCommitteeInput.value.trim()) { item.committee = itemCommitteeInput.value.trim(); }
        if (itemAbstractInput.value.trim()) { item.abstract = itemAbstractInput.value.trim(); }
        var links = parseLinks(itemLinksInput.value);
        if (links.length) { item.links = links; }

        var editSection = editSectionIndexInput.value;
        var editItem = editItemIndexInput.value;

        if (editSection !== '' && editItem !== '') {
            var sourceItems = researchSections()[Number(editSection)].items;
            if (Number(editSection) === sectionIndex) {
                sourceItems[Number(editItem)] = item;
            } else {
                sourceItems.splice(Number(editItem), 1);
                researchSections()[sectionIndex].items.push(item);
            }
            setStatus('Item updated.');
        } else {
            researchSections()[sectionIndex].items.push(item);
            setStatus('Item added.');
        }

        resetItemForm();
        renderResearchAdmin();
        persist();
    });

    document.getElementById('resetItemButton').addEventListener('click', resetItemForm);

    /* ---------------------------------------------------------------- */
    /* Teaching tab                                                       */
    /* ---------------------------------------------------------------- */

    var teachingList = document.getElementById('teachingList');

    function renderTeachingAdmin() {
        teachingList.innerHTML = '';
        var entries = state.teaching.entries;

        if (!entries.length) {
            teachingList.append(el('p', 'item-empty', 'No entries yet.'));
        }

        entries.forEach(function (entry, index) {
            var card = el('div', 'entry-card');
            card.classList.toggle('is-hidden', Boolean(entry.hidden));

            card.append(toolbarButtons(
                function () { move(entries, index, index - 1); renderTeachingAdmin(); persist(); },
                function () { move(entries, index, index + 1); renderTeachingAdmin(); persist(); },
                function () {
                    if (!confirm('Delete "' + (entry.role || 'this entry') + '"?')) { return; }
                    entries.splice(index, 1);
                    renderTeachingAdmin();
                    persist();
                },
                entry,
                renderTeachingAdmin
            ));

            var row1 = el('div', 'field-row');
            row1.append(
                field('Role / position', entry.role, function (v) { entry.role = v; }),
                field('Period', entry.period, function (v) { entry.period = v; })
            );
            card.append(row1);
            card.append(field('Organization / department', entry.org, function (v) { entry.org = v; }));
            card.append(field('Description (optional)', entry.description, function (v) { entry.description = v; }, { textarea: true, minHeight: '70px' }));
            card.append(field('Courses (one per line, shown as tags)', (entry.courses || []).join('\n'), function (v) {
                entry.courses = v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
            }, { textarea: true, minHeight: '60px' }));

            teachingList.append(card);
        });
    }

    document.getElementById('addTeaching').addEventListener('click', function () {
        state.teaching.entries.push({ role: '', org: '', period: '', description: '', courses: [] });
        renderTeachingAdmin();
        persist();
    });

    /* ---------------------------------------------------------------- */
    /* CV tab                                                             */
    /* ---------------------------------------------------------------- */

    var cvList = document.getElementById('cvList');

    function renderCvAdmin() {
        cvList.innerHTML = '';
        var sections = state.cv.sections;

        var cvFileName = document.getElementById('cvFileName');
        if (cvFileName) { cvFileName.textContent = state.profile.cvFile || 'your CV PDF'; }

        if (!sections.length) {
            cvList.append(el('p', 'item-empty', 'No CV sections yet.'));
        }

        sections.forEach(function (section, sectionIndex) {
            var card = el('div', 'section-card');
            card.classList.toggle('is-hidden', Boolean(section.hidden));

            var header = el('div', 'section-header');
            var titleInput = el('input', 'section-title-input');
            titleInput.value = section.title || '';
            titleInput.placeholder = 'Section title';
            titleInput.addEventListener('input', function () {
                section.title = titleInput.value;
                persist();
            });

            var up = el('button', 'admin-link', '↑');
            up.type = 'button';
            up.addEventListener('click', function () {
                move(sections, sectionIndex, sectionIndex - 1);
                renderCvAdmin();
                persist();
            });

            var down = el('button', 'admin-link', '↓');
            down.type = 'button';
            down.addEventListener('click', function () {
                move(sections, sectionIndex, sectionIndex + 1);
                renderCvAdmin();
                persist();
            });

            var del = el('button', 'admin-link danger', 'Delete section');
            del.type = 'button';
            del.addEventListener('click', function () {
                if (!confirm('Delete CV section "' + (section.title || 'untitled') + '"?')) { return; }
                sections.splice(sectionIndex, 1);
                renderCvAdmin();
                persist();
            });

            header.append(titleInput, visToggle(section, renderCvAdmin), up, down, del);
            card.append(header);

            var entries = Array.isArray(section.entries) ? section.entries : (section.entries = []);

            entries.forEach(function (entry, entryIndex) {
                var entryCard = el('div', 'entry-card');
                entryCard.classList.toggle('is-hidden', Boolean(entry.hidden));

                entryCard.append(toolbarButtons(
                    function () { move(entries, entryIndex, entryIndex - 1); renderCvAdmin(); persist(); },
                    function () { move(entries, entryIndex, entryIndex + 1); renderCvAdmin(); persist(); },
                    function () { entries.splice(entryIndex, 1); renderCvAdmin(); persist(); },
                    entry,
                    renderCvAdmin
                ));

                var row = el('div', 'field-row');
                row.append(
                    field('Title (bold line)', entry.title, function (v) { entry.title = v; }),
                    field('Date (right-aligned)', entry.date, function (v) { entry.date = v; })
                );
                entryCard.append(row);
                entryCard.append(field('Detail (secondary line)', entry.detail, function (v) { entry.detail = v; }, { textarea: true, minHeight: '54px' }));
                entryCard.append(field('Bullets (one per line)', (entry.bullets || []).join('\n'), function (v) {
                    entry.bullets = v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
                }, { textarea: true, minHeight: '54px' }));

                card.append(entryCard);
            });

            var addEntry = el('button', 'admin-link', '+ Add entry');
            addEntry.type = 'button';
            addEntry.addEventListener('click', function () {
                entries.push({ title: '', detail: '', date: '', bullets: [] });
                renderCvAdmin();
                persist();
            });
            card.append(addEntry);

            cvList.append(card);
        });
    }

    document.getElementById('addCvSection').addEventListener('click', function () {
        state.cv.sections.push({ title: '', entries: [] });
        renderCvAdmin();
        persist();
    });

    // Whole-page on/off switch (CV, Research, Teaching all share this).
    function makePageVisibility(opts) {
        var btn = document.getElementById(opts.button);
        var stateEl = document.getElementById(opts.state);
        var panel = opts.panel ? document.getElementById(opts.panel) : null;
        if (!btn) { return function () {}; }

        function sync() {
            var hidden = Boolean(state[opts.key].hidden);
            btn.textContent = hidden ? opts.showLabel : opts.hideLabel;
            btn.classList.toggle('highlight', hidden);
            stateEl.textContent = hidden ? opts.hiddenMsg : opts.visibleMsg;
            if (panel) { panel.classList.toggle('is-hidden', hidden); }
        }

        btn.addEventListener('click', function () {
            state[opts.key].hidden = !state[opts.key].hidden;
            persist();
            sync();
            setStatus(state[opts.key].hidden ? opts.hiddenToast : opts.visibleToast);
        });

        return sync;
    }

    var syncCvVisibility = makePageVisibility({
        key: 'cv', button: 'toggleCvHidden', state: 'cvVisibilityState', panel: 'cvSectionsPanel',
        hideLabel: 'Hide entire CV', showLabel: 'Show CV on site',
        hiddenMsg: 'The CV is hidden — it will not appear on the live site.',
        visibleMsg: 'The CV is visible on the live site.',
        hiddenToast: 'CV hidden from the site.', visibleToast: 'CV will be shown on the site.'
    });

    var syncResearchVisibility = makePageVisibility({
        key: 'research', button: 'toggleResearchHidden', state: 'researchVisibilityState', panel: 'researchEditor',
        hideLabel: 'Hide entire Research page', showLabel: 'Show Research page on site',
        hiddenMsg: 'The Research page is hidden — it will not appear on the live site.',
        visibleMsg: 'The Research page is visible on the live site.',
        hiddenToast: 'Research page hidden.', visibleToast: 'Research page will be shown.'
    });

    var syncTeachingVisibility = makePageVisibility({
        key: 'teaching', button: 'toggleTeachingHidden', state: 'teachingVisibilityState', panel: 'teachingEditor',
        hideLabel: 'Hide entire Teaching page', showLabel: 'Show Teaching page on site',
        hiddenMsg: 'The Teaching page is hidden — it will not appear on the live site.',
        visibleMsg: 'The Teaching page is visible on the live site.',
        hiddenToast: 'Teaching page hidden.', visibleToast: 'Teaching page will be shown.'
    });

    /* ---------------------------------------------------------------- */
    /* Toolbar: preview / discard                                         */
    /* ---------------------------------------------------------------- */

    document.getElementById('previewButton').addEventListener('click', function () {
        persist();
        window.open('index.html?preview=1', '_blank');
    });

    document.getElementById('discardButton').addEventListener('click', function () {
        if (!confirm('Discard the draft and reset everything to the published site content?')) { return; }
        state = normalize(clone(published));
        try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
        renderEverything();
        setStatus('Draft discarded — back to published content.');
    });

    /* ---------------------------------------------------------------- */
    /* Publish & export                                                   */
    /* ---------------------------------------------------------------- */

    var ghOwner = document.getElementById('ghOwner');
    var ghRepo = document.getElementById('ghRepo');
    var ghBranch = document.getElementById('ghBranch');
    var ghToken = document.getElementById('ghToken');
    var ghRemember = document.getElementById('ghRemember');
    var publishButton = document.getElementById('publishButton');
    var publishStatus = document.getElementById('publishStatus');

    function setPublishStatus(message, isError) {
        publishStatus.textContent = message;
        publishStatus.classList.toggle('error', Boolean(isError));
    }

    function loadGhSettings() {
        try {
            var saved = JSON.parse(localStorage.getItem(GH_KEY) || '{}');
            if (saved.owner) { ghOwner.value = saved.owner; }
            if (saved.repo) { ghRepo.value = saved.repo; }
            if (saved.branch) { ghBranch.value = saved.branch; }
            if (saved.token) {
                ghToken.value = saved.token;
                ghRemember.checked = true;
            }
        } catch (e) { /* ignore */ }
    }

    function saveGhSettings() {
        try {
            localStorage.setItem(GH_KEY, JSON.stringify({
                owner: ghOwner.value.trim(),
                repo: ghRepo.value.trim(),
                branch: ghBranch.value.trim(),
                token: ghRemember.checked ? ghToken.value.trim() : ''
            }));
        } catch (e) { /* ignore */ }
    }

    [ghOwner, ghRepo, ghBranch, ghToken, ghRemember].forEach(function (input) {
        input.addEventListener('change', saveGhSettings);
    });

    function serializeSiteData() {
        return '// All site content lives here. Edit it from admin.html, then publish\n' +
            '// (or download this file and commit it to GitHub).\n' +
            'window.SITE_DATA = ' + JSON.stringify(state, null, 2) + ';\n';
    }

    function toBase64(str) {
        var bytes = new TextEncoder().encode(str);
        var binary = '';
        var chunkSize = 0x8000;
        for (var i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary);
    }

    function publish() {
        var owner = ghOwner.value.trim();
        var repo = ghRepo.value.trim();
        var branch = ghBranch.value.trim() || 'main';
        var token = ghToken.value.trim();

        if (!owner || !repo || !token) {
            setPublishStatus('Owner, repository, and token are required.', true);
            return;
        }

        saveGhSettings();
        publishButton.disabled = true;
        setPublishStatus('Publishing…');

        var api = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/site-data.js';
        var headers = {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/vnd.github+json'
        };

        fetch(api + '?ref=' + encodeURIComponent(branch), { headers: headers })
            .then(function (response) {
                if (response.status === 404) { return null; }
                if (response.status === 401 || response.status === 403) {
                    throw new Error('GitHub rejected the token. Check that it has Contents read & write access to this repository.');
                }
                if (!response.ok) { throw new Error('Could not reach the repository (HTTP ' + response.status + ').'); }
                return response.json();
            })
            .then(function (existing) {
                var body = {
                    message: 'Update site content via admin page',
                    content: toBase64(serializeSiteData()),
                    branch: branch
                };
                if (existing && existing.sha) { body.sha = existing.sha; }
                return fetch(api, {
                    method: 'PUT',
                    headers: headers,
                    body: JSON.stringify(body)
                });
            })
            .then(function (response) {
                if (!response.ok) {
                    return response.json().catch(function () { return {}; }).then(function (err) {
                        throw new Error(err.message || 'Publish failed (HTTP ' + response.status + ').');
                    });
                }
                published = normalize(clone(state));
                setPublishStatus('Published! The live site updates within a minute or two.');
                setStatus('Published to GitHub.');
            })
            .catch(function (error) {
                setPublishStatus(error.message || 'Publish failed.', true);
            })
            .finally(function () {
                publishButton.disabled = false;
            });
    }

    publishButton.addEventListener('click', publish);

    function download(filename, content, type) {
        var blob = new Blob([content], { type: type });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.append(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    document.getElementById('downloadJs').addEventListener('click', function () {
        download('site-data.js', serializeSiteData(), 'text/javascript');
        setStatus('Downloaded site-data.js — commit it to the repository.');
    });

    document.getElementById('downloadJson').addEventListener('click', function () {
        download('site-data-backup.json', JSON.stringify(state, null, 2), 'application/json');
        setStatus('Downloaded backup.');
    });

    document.getElementById('copyJson').addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(JSON.stringify(state, null, 2))
                .then(function () { setStatus('JSON copied to clipboard.'); })
                .catch(function () { setStatus('Unable to copy.', true); });
        } else {
            setStatus('Clipboard not available.', true);
        }
    });

    document.getElementById('importJson').addEventListener('change', function (event) {
        var file = event.target.files[0];
        event.target.value = '';
        if (!file) { return; }
        var reader = new FileReader();
        reader.onload = function () {
            try {
                var parsed = JSON.parse(reader.result);
                if (!parsed || !parsed.profile) { throw new Error('bad format'); }
                state = normalize(parsed);
                persist();
                renderEverything();
                setStatus('Backup imported into the draft.');
            } catch (e) {
                setStatus('That file is not a valid site backup.', true);
            }
        };
        reader.readAsText(file);
    });

    /* ---------------------------------------------------------------- */
    /* Boot                                                               */
    /* ---------------------------------------------------------------- */

    function renderEverything() {
        bindProfileFields();
        renderResearchAdmin();
        resetItemForm();
        renderTeachingAdmin();
        renderCvAdmin();
        syncCvVisibility();
        syncResearchVisibility();
        syncTeachingVisibility();
    }

    function bindNavToggle() {
        var navToggle = document.querySelector('.nav-toggle');
        var navMenu = document.querySelector('.nav-menu');
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', function () {
                var open = navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
                navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        }
        var year = document.getElementById('footerYear');
        if (year) { year.textContent = String(new Date().getFullYear()); }
    }

    loadGhSettings();
    bindNavToggle();
    renderEverything();

    if (readDraft()) {
        setStatus('Loaded unpublished draft from this browser.');
    }
})();
