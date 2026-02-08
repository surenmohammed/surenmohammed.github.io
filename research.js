const researchTarget = document.querySelector('#research-content');

const createParagraph = (className, label, text) => {
    const p = document.createElement('p');
    p.className = className;
    if (label) {
        const strong = document.createElement('strong');
        strong.textContent = label;
        p.append(strong, ' ');
    }
    p.append(text);
    return p;
};

const renderResearch = (data) => {
    if (!researchTarget) {
        return;
    }

    researchTarget.innerHTML = '';

    if (!data || !Array.isArray(data.sections) || data.sections.length === 0) {
        researchTarget.innerHTML = '<section class="research-section"><div class="container"><p>Research content is coming soon.</p></div></section>';
        return;
    }

    data.sections.forEach((section) => {
        const sectionEl = document.createElement('section');
        sectionEl.className = `research-section${section.altBg ? ' alt-bg' : ''}`;

        const container = document.createElement('div');
        container.className = 'container';

        const heading = document.createElement('h2');
        heading.textContent = section.title;
        container.append(heading);

        const items = Array.isArray(section.items) ? section.items : [];

        items.forEach((item) => {
            const publication = document.createElement('div');
            publication.className = 'publication';

            const title = document.createElement('h3');
            title.className = 'pub-title';
            title.textContent = item.title;
            publication.append(title);

            if (item.status) {
                const status = document.createElement('p');
                status.className = 'pub-status';
                status.textContent = item.status;
                publication.append(status);
            }

            if (item.committee) {
                const committee = document.createElement('p');
                committee.className = 'committee';
                const strong = document.createElement('strong');
                strong.textContent = 'Committee:';
                committee.append(strong, ` ${item.committee}`);
                publication.append(committee);
            }

            if (item.abstract) {
                const abstractClass = item.type === 'dissertation' ? 'diss-abstract' : 'pub-abstract';
                const abstract = createParagraph(abstractClass, 'Abstract.', item.abstract);
                publication.append(abstract);
            }

            if (Array.isArray(item.links) && item.links.length > 0) {
                const links = document.createElement('div');
                links.className = 'pub-links';
                item.links.forEach((link) => {
                    if (!link.url) {
                        return;
                    }
                    const anchor = document.createElement('a');
                    anchor.className = 'pub-link';
                    anchor.href = link.url;
                    anchor.target = '_blank';
                    anchor.rel = 'noopener';
                    anchor.textContent = link.label || 'Link';
                    links.append(anchor);
                });
                publication.append(links);
            }

            container.append(publication);
        });

        sectionEl.append(container);
        researchTarget.append(sectionEl);
    });
};

const readLocalDraft = () => {
    try {
        const draft = localStorage.getItem('researchDraft');
        if (!draft) {
            return null;
        }
        const parsed = JSON.parse(draft);
        if (!parsed || !Array.isArray(parsed.sections)) {
            return null;
        }
        return parsed;
    } catch (error) {
        return null;
    }
};

const showFallback = () => {
    const draft = readLocalDraft();
    if (draft) {
        renderResearch(draft);
        return;
    }

    if (window.RESEARCH_DATA) {
        renderResearch(window.RESEARCH_DATA);
        return;
    }

    if (researchTarget) {
        researchTarget.innerHTML = '<section class="research-section"><div class="container"><p>Research content is coming soon.</p></div></section>';
    }
};

const loadResearch = () => {
    if (location.protocol === 'file:') {
        showFallback();
        return;
    }

    fetch('research.json')
        .then((response) => {
            if (!response.ok) {
                throw new Error('Unable to load research content.');
            }
            return response.json();
        })
        .then(renderResearch)
        .catch(showFallback);
};

loadResearch();
