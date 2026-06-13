# Your Website — Owner's Guide

A complete, plain-English manual for running **https://surenmohammed.github.io**.
You never need to touch code or the command line — everything is done from the
**admin page** in your browser.

---

## Table of contents

1. [How the website works (the 30-second version)](#1-how-the-website-works)
2. [The golden workflow: Edit → Preview → Publish](#2-the-golden-workflow)
3. [One-time setup: your publish token](#3-one-time-setup-your-publish-token)
4. [Editing each part of the site](#4-editing-each-part-of-the-site)
   - [Profile & About](#profile--about)
   - [Research](#research)
   - [Teaching](#teaching)
   - [CV](#cv)
5. [Hiding & showing things](#5-hiding--showing-things)
6. [Updating your CV PDF and your photo](#6-updating-your-cv-pdf-and-your-photo)
7. [Backups](#7-backups)
8. [Troubleshooting](#8-troubleshooting)
9. [Quick reference](#9-quick-reference)

---

## 1. How the website works

Your whole site is **plain files** hosted free by **GitHub Pages**. There is no
server and no database. All of your *content* (your name, bio, publications,
teaching, CV — everything) lives in **one file** called `site-data.js`. Every
page reads from that one file, so you only ever edit content in one place.

You edit that content through the **admin page**:

> **https://surenmohammed.github.io/admin.html**

When you click **Publish**, the admin page saves your changes back to GitHub, and
your live website updates about a minute later. That's it.

---

## 2. The golden workflow

Every change you ever make follows the same three steps:

1. **Edit** — open the admin page and change whatever you want. Your edits are
   saved automatically as a **draft** in your browser. Nothing is live yet, so
   you can't break anything.
2. **Preview** — click **Preview draft** (top of the admin page). This opens your
   real site showing your unpublished changes, with an orange banner reminding you
   it's a draft. Click around, make sure it looks right.
3. **Publish** — click **Publish…**, then **Publish to live site**. Wait ~1 minute,
   refresh https://surenmohammed.github.io, and your changes are live for the world.

**Key idea:** *Preview* is private (only you see it). *Publish* is public.
Your draft stays in your browser until you publish it.

> 💡 Your draft lives in the specific browser/computer you're using. If you edit on
> your laptop, those unpublished edits won't appear on your phone until you publish.
> (See [Backups](#7-backups) if you ever need to move a draft between devices.)

---

## 3. One-time setup: your publish token

The **Publish** button saves changes to GitHub on your behalf, so the first time
you use it (on each computer) you give it a **personal access token** — a kind of
password that only allows editing this one repository. You already created one;
here's how to do it again if it ever expires or you switch computers.

1. Go to **https://github.com/settings/personal-access-tokens/new**
2. **Token name:** `website-admin` (any name)
3. **Expiration:** 90 days, or **No expiration** if you'd rather not redo this.
4. **Repository access:** choose **Only select repositories** →
   select **`surenmohammed.github.io`**.
5. **Permissions** → **Repository permissions** → **Contents** → **Read and write**.
   *(Leave everything else at "No access" — Contents is the only one needed.)*
6. Click **Generate token** and **copy** the `github_pat_…` value (shown only once).
7. In the admin page, open the **Publish & Export** tab, paste the token into
   **Access token**, tick **Remember token in this browser**, and you're set.

> 🔒 The token lives **only in your browser**. It is never saved into the website or
> the repository. Anyone visiting your site cannot publish anything.

---

## 4. Editing each part of the site

Open the admin page and use the tabs near the top. Changes in every tab auto-save
to your draft as you type.

### Profile & About

Controls your home page.

- **Display name / Full name** — your name as shown in the header and page titles.
- **Role / title**, **Institution** — the two lines under your name.
- **Email** — used for the "Email me" button and the footer.
- **Photo file** — the filename of your profile picture (see
  [Updating your photo](#6-updating-your-cv-pdf-and-your-photo)).
- **CV PDF file** — the filename of your downloadable CV.
- **Research interests** — type them separated by commas; each becomes a tag.
- **About paragraphs** — your bio. Separate paragraphs with a **blank line**.
- **Links** — one per line as `Label | URL`, e.g. `GitHub | https://github.com/surenmohammed`.
  These appear as buttons on the home page and in the footer.

### Research

Your publications, working papers, and dissertation.

- **Sections** (left): the headings like "Peer-Reviewed Publications". You can
  **add** a section (bottom of the panel), **rename** it (click the title),
  **reorder** it (↑ ↓), hide it ([Visible/Hidden](#5-hiding--showing-things)), or
  **delete** it.
- **Add / Edit item** (right): to add a paper, fill in the form and click
  **Add item**. Choose the **Section** it belongs to and the **Item type**
  (a normal Publication, or the special Dissertation style). Add a **Status**
  (e.g. "Expected Submission: Spring 2026"), an **Abstract**, and **Links**
  (one per line as `Label | URL`).
- To **edit** an existing paper, click **Edit** on it — the form fills in; change
  it and click **Update item**.
- Each paper can be reordered, hidden, or deleted from its row.

### Teaching

Your positions and courses.

- **Intro paragraph** — the short text at the top of the Teaching page.
- **Entries** — click **+ Add entry**. Each has a **Role**, **Period**,
  **Organization**, an optional **Description**, and **Courses** (one per line,
  shown as tags). Reorder, hide, or delete each entry.

### CV

The CV shown **on the website** (this is separate from your downloadable PDF — see
[below](#6-updating-your-cv-pdf-and-your-photo)).

- **Sections** — like "Education", "Fellowships", "Awards". Add, rename, reorder,
  hide, or delete them.
- **Entries** inside each section — each has a **Title** (bold line), a **Date**
  (right-aligned), a **Detail** line, and **Bullets** (one per line). Use
  **+ Add entry** inside a section to add one.

---

## 5. Hiding & showing things

You can take **anything** offline without deleting it. Hidden things stay in your
editor (shown dimmed) so you can bring them back anytime — they're just left off
the public site until you show them again.

- **A single item or entry** — click its **Visible / Hidden** pill.
- **A whole section** — click the **Visible / Hidden** pill in the section header.
- **An entire page** (Research, Teaching, or CV) — each of those tabs has a
  **Hide entire … page** button at the top. When a page is hidden, its link
  disappears from the site's menu and the page shows a short "not available" notice.

After hiding/showing, **Publish** to make it take effect on the live site.

> Example — taking your CV offline to revise it: CV tab → **Hide entire CV** →
> **Publish**. Make your edits over the next few days. When ready: **Show CV on
> site** → **Publish**.

---

## 6. Updating your CV PDF and your photo

These are actual image/PDF **files**, so they're updated slightly differently than
text. Two easy steps:

**A) Upload the new file to GitHub:**

1. Go to **https://github.com/surenmohammed/surenmohammed.github.io**
2. Click **Add file → Upload files**.
3. Drag in your new file. To **replace** the current CV, name it exactly
   `Mohammed_CV.pdf` (same name overwrites the old one). For a photo, give it a
   clear name like `suren-2026.jpg`.
4. Scroll down and click **Commit changes**.

**B) Point the site at it (only needed if you used a new filename):**

- In the admin page → **Profile & About** → set **CV PDF file** or **Photo file**
  to the new filename → **Publish**.
- If you reused the exact same filename (e.g. `Mohammed_CV.pdf`), you don't even
  need step B — it just works.

> 📸 Photos look best roughly **square** (the site crops them to a circle).

---

## 7. Backups

Everything is already safe in GitHub's history, but the **Publish & Export** tab
gives you extra options:

- **Download site-data.js** — the live content file. (Also your manual-publish
  route: upload this file to the repo yourself instead of using the Publish button.)
- **Download backup (.json)** — a plain copy of all your content. Keep one
  somewhere safe before big changes.
- **Copy JSON** — same, to your clipboard.
- **Import backup** — load a `.json` backup back into your draft. This is also how
  you'd move an in-progress draft from one computer to another (export on one,
  import on the other).

---

## 8. Troubleshooting

**"GitHub rejected the token" / "Resource not accessible by personal access token"**
Your token is missing write access. Open
https://github.com/settings/personal-access-tokens, click your token, and confirm:
**Repository access** includes `surenmohammed.github.io`, and **Contents** is set to
**Read and write**. Save, then Publish again. If the token expired, just make a new
one ([section 3](#3-one-time-setup-your-publish-token)).

**I published but the site looks the same**
- Wait 1–2 minutes — GitHub needs a moment to rebuild.
- Hard-refresh your browser: **Cmd/Ctrl + Shift + R** (clears the cached page).
- Make sure you clicked **Publish to live site**, not just **Preview draft**.

**My edits disappeared**
Drafts are stored per-browser. If you cleared your browser data or switched
computers/browsers, the draft won't be there. Whatever is **published** is always
safe on GitHub — reopen the admin and it loads the published content.

**I want to undo a publish**
Every publish is a saved version on GitHub. Tell your developer/assistant the
approximate date, or in the repo's **commits** list you can revert to an earlier
version. For small fixes it's usually faster to just edit and publish again.

**Something looks broken / I'm stuck**
Use **Discard draft** (top of admin) to throw away unpublished changes and return
to exactly what's live. This never affects the published site.

---

## 9. Quick reference

| I want to… | Do this |
|---|---|
| Change any text | Admin page → the matching tab → edit → **Publish** |
| See changes before they go live | **Preview draft** |
| Put a paper / section / page offline | Click its **Visible / Hidden** pill (or **Hide entire … page**) → **Publish** |
| Add a publication | **Research** tab → fill the "Add / Edit item" form → **Add item** → **Publish** |
| Replace my CV PDF | Upload `Mohammed_CV.pdf` to the repo (Add file → Upload files) |
| Change my photo | Upload the image to the repo, set **Photo file** in admin → **Publish** |
| Undo unpublished edits | **Discard draft** |
| Back up my content | **Publish & Export → Download backup (.json)** |

**Important addresses**

- Your live site: https://surenmohammed.github.io
- Your admin page: https://surenmohammed.github.io/admin.html
- Your repository: https://github.com/surenmohammed/surenmohammed.github.io
- Create a token: https://github.com/settings/personal-access-tokens/new

---

*Keep this guide handy. When in doubt, remember the one rule:*
**Edit → Preview → Publish.**
