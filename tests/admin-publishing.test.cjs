const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

// Exercise the real standalone admin publishing code with an isolated browser
// environment. No test sends credentials or writes to GitHub.
const source = readFileSync(join(__dirname, '..', 'admin.js'), 'utf8');
const publishingCode = source.slice(source.indexOf('    var ghOwner ='), source.indexOf('    function download('));

function editor(fetch) {
    const elements = {};
    const storage = new Map([['siteDraft', 'saved draft']]);
    const context = {
        state: { profile: { name: 'Suren — محمد' } },
        published: { profile: { name: 'Previous name' } },
        DRAFT_KEY: 'siteDraft', GH_KEY: 'adminGhSettings',
        clone: value => JSON.parse(JSON.stringify(value)),
        normalize: value => value,
        setStatus() {}, TextEncoder, btoa, TypeError, fetch,
        localStorage: {
            getItem: key => storage.get(key) || null,
            setItem: (key, value) => storage.set(key, value),
            removeItem: key => storage.delete(key)
        },
        document: {
            getElementById(id) {
                return elements[id] ||= {
                    value: '', checked: false, disabled: false, textContent: '',
                    classList: { toggle() {} }, addEventListener() {}
                };
            }
        }
    };
    vm.createContext(context);
    vm.runInContext(publishingCode, context);
    elements.ghOwner.value = 'surenmohammed';
    elements.ghRepo.value = 'surenmohammed.github.io';
    elements.ghBranch.value = 'main';
    elements.ghToken.value = 'test-credential';
    return { context, elements, storage };
}

const fileResponse = () => new Response(JSON.stringify({ type: 'file', sha: 'current-sha' }));

test('connection check reads the chosen branch without writing or remembering a token', async () => {
    const calls = [];
    const { context, elements, storage } = editor(async (url, options) => {
        calls.push({ url, options });
        return fileResponse();
    });
    elements.ghBranch.value = 'draft/update';
    await context.checkConnection();
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\?ref=draft%2Fupdate$/);
    assert.equal(calls[0].options.method, undefined);
    assert.equal(calls[0].options.cache, 'no-store');
    assert.match(elements.publishStatus.textContent, /Publish will confirm write permission/);
    assert.equal(JSON.parse(storage.get('adminGhSettings')).token, '');
    assert.equal(storage.get('siteDraft'), 'saved draft');
});

test('publishing sends UTF-8 content and the existing SHA, then clears only the saved draft', async () => {
    const calls = [];
    const { context, elements, storage } = editor(async (url, options) => {
        calls.push({ url, options });
        return options.method === 'PUT' ? new Response('{}') : fileResponse();
    });
    await context.publish();
    assert.equal(calls.length, 2);
    const body = JSON.parse(calls[1].options.body);
    assert.equal(body.sha, 'current-sha');
    assert.equal(body.branch, 'main');
    assert.match(Buffer.from(body.content, 'base64').toString('utf8'), /Suren — محمد/);
    assert.equal(context.published.profile.name, context.state.profile.name);
    assert.equal(storage.has('siteDraft'), false);
    assert.match(elements.publishStatus.textContent, /Allow a few minutes/);
    assert.equal(elements.publishButton.disabled, false);
    assert.equal(elements.checkConnectionButton.disabled, false);
});

test('edits during publishing remain a draft and are excluded from the request', async () => {
    let finishRead;
    let savedBody;
    const { context, elements, storage } = editor((url, options) => {
        if (options.method === 'PUT') {
            savedBody = JSON.parse(options.body);
            return Promise.resolve(new Response('{}'));
        }
        return new Promise(resolve => { finishRead = resolve; });
    });
    const pending = context.publish();
    context.state.profile.name = 'Edited while publishing';
    finishRead(fileResponse());
    await pending;
    assert.match(Buffer.from(savedBody.content, 'base64').toString('utf8'), /Suren — محمد/);
    assert.equal(context.published.profile.name, 'Suren — محمد');
    assert.equal(context.state.profile.name, 'Edited while publishing');
    assert.equal(storage.get('siteDraft'), 'saved draft');
    assert.match(elements.publishStatus.textContent, /still a draft/);
});

for (const [status, message] of [[401, /invalid or expired/], [403, /denied access/], [404, /not found/]]) {
    test(`a ${status} response stops publishing and keeps the draft`, async () => {
        let calls = 0;
        const { context, elements, storage } = editor(async () => {
            calls++;
            return new Response('{}', { status });
        });
        await context.publish();
        assert.equal(calls, 1);
        assert.match(elements.publishStatus.textContent, message);
        assert.equal(storage.get('siteDraft'), 'saved draft');
        assert.equal(context.published.profile.name, 'Previous name');
        assert.equal(elements.publishButton.disabled, false);
    });
}

test('write rejection preserves the draft and published content', async () => {
    const { context, elements, storage } = editor(async (url, options) =>
        options.method === 'PUT' ? new Response('{}', { status: 409 }) : fileResponse());
    await context.publish();
    assert.match(elements.publishStatus.textContent, /repository changed/);
    assert.equal(context.published.profile.name, 'Previous name');
    assert.equal(storage.get('siteDraft'), 'saved draft');
});

test('network failures give a useful error and unlock both buttons', async () => {
    const { context, elements } = editor(async () => { throw new TypeError('Failed to fetch'); });
    await context.checkConnection();
    assert.match(elements.publishStatus.textContent, /internet connection/);
    assert.equal(elements.publishButton.disabled, false);
    assert.equal(elements.checkConnectionButton.disabled, false);
});

test('missing credentials stop before any request', async () => {
    let calls = 0;
    const { context, elements } = editor(async () => { calls++; });
    elements.ghToken.value = '';
    await context.publish();
    assert.equal(calls, 0);
    assert.match(elements.publishStatus.textContent, /access token/);
});

test('an invalid repository response cannot cause a write', async () => {
    let calls = 0;
    const { context, elements } = editor(async () => {
        calls++;
        return new Response('[]');
    });
    await context.publish();
    assert.equal(calls, 1);
    assert.match(elements.publishStatus.textContent, /did not return site-data.js/);
});
