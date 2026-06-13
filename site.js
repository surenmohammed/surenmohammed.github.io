// Renders every public page from window.SITE_DATA (site-data.js).
// When opened with ?preview=1, renders the unpublished draft saved by admin.html.
(function () {
    'use strict';

    var DRAFT_KEY = 'siteDraft';
    var previewMode = new URLSearchParams(location.search).get('preview') === '1';

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

    var data = (previewMode && readDraft()) || window.SITE_DATA || {};
    var profile = data.profile || {};
    var pageHidden = {
        research: Boolean(data.research && data.research.hidden),
        teaching: Boolean(data.teaching && data.teaching.hidden),
        cv: Boolean(data.cv && data.cv.hidden)
    };
    var cvHidden = pageHidden.cv;

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) { node.className = className; }
        if (text !== undefined && text !== null && text !== '') { node.textContent = text; }
        return node;
    }

    // A full-width "this page is offline" notice used when a whole page is hidden.
    function noticeBlock(sectionClass) {
        var section = el('section', sectionClass);
        var container = el('div', 'container');
        container.append(el('p', 'item-empty', 'This page is not currently available.'));
        section.append(container);
        return section;
    }

    /* ---------------------------------------------------------------- */

    function showPreviewBanner() {
        var banner = el('div', 'preview-banner');
        banner.append('Previewing unpublished draft — ');
        var link = el('a', null, 'back to admin');
        link.href = 'admin.html';
        banner.append(link);
        document.body.prepend(banner);

        // Keep preview mode while navigating between pages.
        document.querySelectorAll('a[href$=".html"]').forEach(function (a) {
            var href = a.getAttribute('href');
            if (href && !href.startsWith('http') && href !== 'admin.html') {
                a.setAttribute('href', href + '?preview=1');
            }
        });
    }

    function renderHome() {
        var name = document.getElementById('profileName');
        if (name) { name.textContent = profile.name || ''; }

        var role = document.getElementById('profileRole');
        if (role) { role.textContent = profile.role || ''; }

        var org = document.getElementById('profileOrg');
        if (org) { org.textContent = profile.institution || ''; }

        var photo = document.getElementById('profilePhoto');
        if (photo && profile.photo) {
            photo.src = profile.photo;
            photo.alt = profile.fullName || profile.name || 'Profile photo';
        }

        var actions = document.getElementById('profileActions');
        if (actions) {
            actions.innerHTML = '';
            if (profile.email) {
                var email = el('a', 'profile-btn primary', 'Email me');
                email.href = 'mailto:' + profile.email;
                actions.append(email);
            }
            if (profile.cvFile && !cvHidden) {
                var cv = el('a', 'profile-btn secondary', 'Download CV');
                cv.href = profile.cvFile;
                cv.target = '_blank';
                cv.rel = 'noopener';
                actions.append(cv);
            }
            (profile.links || []).forEach(function (link) {
                if (!link.url) { return; }
                var a = el('a', 'profile-btn secondary', link.label || 'Link');
                a.href = link.url;
                a.target = '_blank';
                a.rel = 'noopener';
                actions.append(a);
            });
        }

        var bio = document.getElementById('bioContainer');
        if (bio) {
            bio.innerHTML = '';
            (profile.bio || []).forEach(function (paragraph) {
                bio.append(el('p', null, paragraph));
            });
        }

        var chipsWrap = document.getElementById('interestsWrap');
        var chips = document.getElementById('interestChips');
        if (chips) {
            chips.innerHTML = '';
            var interests = profile.interests || [];
            if (chipsWrap) { chipsWrap.style.display = interests.length ? '' : 'none'; }
            interests.forEach(function (interest) {
                chips.append(el('span', 'chip', interest));
            });
        }
    }

    /* ---------------------------------------------------------------- */

    function renderResearch() {
        var target = document.getElementById('research-content');
        if (!target) { return; }
        target.innerHTML = '';

        if (pageHidden.research) {
            target.append(noticeBlock('research-section'));
            return;
        }

        var sections = ((data.research && data.research.sections) || [])
            .filter(function (section) { return !section.hidden; });
        if (!sections.length) {
            var emptySection = el('section', 'research-section');
            var emptyContainer = el('div', 'container');
            emptyContainer.append(el('p', null, 'Research content is coming soon.'));
            emptySection.append(emptyContainer);
            target.append(emptySection);
            return;
        }

        sections.forEach(function (section, index) {
            var sectionEl = el('section', 'research-section' + (index % 2 === 1 ? ' alt-bg' : ''));
            var container = el('div', 'container');

            var items = (Array.isArray(section.items) ? section.items : [])
                .filter(function (item) { return !item.hidden; });
            var heading = el('h2', null, section.title);
            heading.append(el('span', 'section-count', String(items.length)));
            container.append(heading);

            items.forEach(function (item) {
                var pub = el('div', 'publication reveal');

                pub.append(el('h3', 'pub-title', item.title));

                if (item.status) {
                    pub.append(el('p', 'pub-status', item.status));
                }

                if (item.committee) {
                    var committee = el('p', 'committee');
                    var label = el('strong', null, 'Committee:');
                    committee.append(label, ' ' + item.committee);
                    pub.append(committee);
                }

                if (item.abstract) {
                    var details = el('details', 'pub-abstract');
                    details.append(el('summary', null, 'Abstract'));
                    details.append(el('p', null, item.abstract));
                    pub.append(details);
                }

                if (Array.isArray(item.links) && item.links.length) {
                    var links = el('div', 'pub-links');
                    item.links.forEach(function (link) {
                        if (!link.url) { return; }
                        var a = el('a', 'pub-link', link.label || 'Link');
                        a.href = link.url;
                        a.target = '_blank';
                        a.rel = 'noopener';
                        links.append(a);
                    });
                    pub.append(links);
                }

                container.append(pub);
            });

            sectionEl.append(container);
            target.append(sectionEl);
        });
    }

    /* ---------------------------------------------------------------- */

    function renderTeaching() {
        var target = document.getElementById('teaching-content');
        if (!target) { return; }
        target.innerHTML = '';

        if (pageHidden.teaching) {
            target.append(noticeBlock('teaching-section'));
            return;
        }

        var teaching = data.teaching || {};
        var container = el('div', 'container');

        if (teaching.intro) {
            container.append(el('p', 'teaching-intro', teaching.intro));
        }

        var entries = (teaching.entries || []).filter(function (entry) { return !entry.hidden; });
        if (!entries.length) {
            container.append(el('p', 'item-empty', 'Teaching content is coming soon.'));
        }

        entries.forEach(function (entry) {
            var card = el('div', 'teaching-entry reveal');
            card.append(el('h2', 'teaching-role', entry.role || ''));
            if (entry.period) { card.append(el('span', 'teaching-period', entry.period)); }
            if (entry.org) { card.append(el('p', 'teaching-org', entry.org)); }
            if (entry.description) { card.append(el('p', 'teaching-desc', entry.description)); }
            if (Array.isArray(entry.courses) && entry.courses.length) {
                var courses = el('div', 'teaching-courses');
                entry.courses.forEach(function (course) {
                    courses.append(el('span', 'chip', course));
                });
                card.append(courses);
            }
            container.append(card);
        });

        var section = el('section', 'teaching-section');
        section.append(container);
        target.append(section);
    }

    /* ---------------------------------------------------------------- */

    function renderCv() {
        var target = document.getElementById('cv-content');
        if (!target) { return; }
        target.innerHTML = '';

        if (cvHidden) {
            var downloadBtn = document.getElementById('cvDownload');
            if (downloadBtn) { downloadBtn.style.display = 'none'; }
            var notice = el('p', 'item-empty', 'The CV is not currently available.');
            target.append(notice);
            return;
        }

        var dl = document.getElementById('cvDownload');
        if (dl) {
            if (profile.cvFile) {
                dl.href = profile.cvFile;
                dl.style.display = '';
            } else {
                // No CV PDF on file — don't show a dead download button.
                dl.style.display = 'none';
            }
        }

        var sections = ((data.cv && data.cv.sections) || [])
            .filter(function (section) { return !section.hidden; });
        sections.forEach(function (section) {
            var sectionEl = el('div', 'cv-section reveal');
            sectionEl.append(el('h2', null, section.title));

            (section.entries || [])
                .filter(function (entry) { return !entry.hidden; })
                .forEach(function (entry) {
                var entryEl = el('div', 'cv-entry');

                if (entry.title || entry.date) {
                    var head = el('div', 'cv-entry-head');
                    head.append(el('span', 'cv-entry-title', entry.title || ''));
                    if (entry.date) { head.append(el('span', 'cv-entry-date', entry.date)); }
                    entryEl.append(head);
                }

                if (entry.detail) {
                    var detail = el('p', 'cv-entry-detail', entry.detail);
                    if (!entry.title && entry.date) {
                        var head2 = el('div', 'cv-entry-head');
                        head2.append(detail);
                        head2.append(el('span', 'cv-entry-date', entry.date));
                        entryEl.append(head2);
                    } else {
                        entryEl.append(detail);
                    }
                }

                if (Array.isArray(entry.bullets) && entry.bullets.length) {
                    var list = el('ul');
                    entry.bullets.forEach(function (bullet) {
                        list.append(el('li', null, bullet));
                    });
                    entryEl.append(list);
                }

                sectionEl.append(entryEl);
            });

            target.append(sectionEl);
        });
    }

    /* ---------------------------------------------------------------- */

    function setupNav() {
        var navToggle = document.querySelector('.nav-toggle');
        var navMenu = document.querySelector('.nav-menu');
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', function () {
                var open = navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
                navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        }

        var logo = document.querySelector('.nav-logo');
        if (logo && profile.name) { logo.textContent = profile.name; }

        // Drop the nav link for any page that is hidden from the live site.
        Object.keys(pageHidden).forEach(function (pageName) {
            if (!pageHidden[pageName]) { return; }
            document.querySelectorAll('.nav-menu a').forEach(function (a) {
                var href = (a.getAttribute('href') || '').split('?')[0];
                if (href === pageName + '.html') {
                    var li = a.closest('li');
                    (li || a).remove();
                }
            });
        });
    }

    function setupFooter() {
        var year = document.getElementById('footerYear');
        if (year) { year.textContent = String(new Date().getFullYear()); }

        var footerName = document.getElementById('footerName');
        if (footerName && profile.name) { footerName.textContent = profile.name; }

        var footerLinks = document.getElementById('footerLinks');
        if (footerLinks) {
            footerLinks.innerHTML = '';
            if (profile.email) {
                var email = el('a', null, profile.email);
                email.href = 'mailto:' + profile.email;
                footerLinks.append(email);
            }
            (profile.links || []).forEach(function (link) {
                if (!link.url) { return; }
                var a = el('a', null, link.label || 'Link');
                a.href = link.url;
                a.target = '_blank';
                a.rel = 'noopener';
                footerLinks.append(a);
            });
        }
    }

    function setupReveal() {
        var nodes = document.querySelectorAll('.reveal');
        if (!('IntersectionObserver' in window)) {
            nodes.forEach(function (node) { node.classList.add('visible'); });
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });
        nodes.forEach(function (node) { observer.observe(node); });
    }

    /* ---------------------------------------------------------------- */

    var page = document.body.dataset.page;
    if (page === 'home') { renderHome(); }
    if (page === 'research') { renderResearch(); }
    if (page === 'teaching') { renderTeaching(); }
    if (page === 'cv') { renderCv(); }

    setupNav();
    setupFooter();
    if (previewMode && readDraft()) { showPreviewBanner(); }
    setupReveal();
})();
