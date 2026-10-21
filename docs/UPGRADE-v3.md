# Upgrade to template version 3

Template version 3 adds the links page: a minimal page of link buttons, made from a Markdown file with `skeleton: links`.

A site on version 1 must also do the steps in [UPGRADE-v2.md](./UPGRADE-v2.md). The `build.js` file in version 3 includes the version 2 features. The version 2 skeleton, license and `package.json` changes are still needed.

## What changes

| File | Change |
|---|---|
| `build.js` | Replace the file. |
| `create-page.js` | Replace the file. `npm run create-md -- links <path>` then writes two sample links. |
| `src/skeletons/links-skeleton.html` | Add the file. |
| `src/css/style.css` | Add the "Links Page" block. See "Add the CSS" below. |
| `package.json` | Change `templateVersion` to `3`. See step 6. |
| `test/links.test.js` | Optional. Copy the file to test the links page with `npm test`. |

Existing pages do not change. A site with no links page builds the same as before.

## Upgrade a site

1. Make a new branch in the site repository.
2. **Compare Copy `build.js` from the template into the site.
3. Copy `create-page.js` from the template into the site.
4. Copy `src/skeletons/links-skeleton.html` from the template into the site.
5. Add the CSS block from "Add the CSS" below to `src/css/style.css`.
6. In `package.json`, change the `vanillaGorilla` field:

   ```json
   "vanillaGorilla": { "templateVersion": 3 }
   ```

7. Run `npm run build`. The build also regenerates `src/css/style.min.css`.
8. Make sure the build shows `Build complete.`
9. Open some pages from `dist/` and make sure they look correct.
10. Merge the branch into `main`.
11. Make sure the GitHub Actions deploy is successful.

## Add the CSS

If you did not change `src/css/style.css`, copy the whole file from the template.

If you changed `style.css`, add this block before the first `@media` rule. Do not edit `src/css/style.min.css`. The build regenerates it.

```css
/* Links Page (skeleton: links) */
.links-page {
  --links-min-width: 360px;
  --links-max-width: 480px;
}

.links-page main.links-container {
  width: 100%;
  min-width: min(var(--links-min-width), 100%);
  max-width: var(--links-max-width);
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
  text-align: center;
}

.links-page .links-image {
  width: 100%;
  max-width: calc(var(--links-min-width) / 3);
  margin: 0 auto 1.25rem;
}

.links-page h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.links-page .entry-content {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.links-page .entry-content > :last-child {
  margin-bottom: 0;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.link-button {
  display: block;
  padding: 0.9rem 1.25rem;
  font-weight: 500;
  color: var(--text-light);
  background-color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow-wrap: anywhere;
  transition: var(--transition);
}

.link-button:hover {
  color: var(--text-light);
  background-color: var(--color-primary-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.link-button:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}
```

The block uses the custom properties of the default theme (`--color-primary`, `--text-light`, `--radius-md` and others). If your theme uses other names, change them in the block.

## Links pages

A links page is a Markdown file with `skeleton: links`. Put it at `src/links/index.md` or at any other path under `src/`:

```yaml
---
title: My Links
description: Find me around the web.
skeleton: links
image: ./images/me.png
image_alt: A portrait of me
sitemap: true
css: |
  .links-page { --color-primary: #c98263; }
links:
  - url: https://example.com
    text: My Website
  - url: mailto:me@example.com
    text: Send me an email
---

Text above the links.
```

| Key | Required | What it does |
|---|---|---|
| `title` | Yes | The H1 and the document title. |
| `skeleton` | Yes | Must be `links`. |
| `links` | No | The list of link buttons. Each entry needs `url` and `text`. |
| `image` | No | A picture above the title. Use a path from `src/` that starts with `./`, or a full URL. The build uses a root-relative path (`/images/me.png`) as written. It does not work when the site is in a sub-path, for example on GitHub Pages. |
| `image_alt` | No | The alt text of the image. The default is an empty alt. |
| `css` | No | CSS for this page only. It goes in a `<style>` block after the main stylesheet. |
| `description` | No | The meta description. |
| `sitemap` | No | Set `true` to add the page to `sitemap.xml`. The default is `false`. |
| `draft` | No | Set `true` to not publish the page. |

Rules for the `links` list:

- Each link opens in a new tab (`target="_blank"` with `rel="noopener noreferrer"`).
- `url` must be a full URL with a protocol. A relative URL, a root-relative URL (`/page/`) and a protocol-relative URL (`//example.com`) are not valid.
- The build accepts only these protocols: `http:`, `https:`, `mailto:`, `tel:` and `sms:`. To accept more, add them to `ALLOWED_LINK_PROTOCOLS` in `build.js`.
- The build skips an entry that is not valid, and shows a warning. The other entries build.
- The Markdown text after the front matter shows above the buttons.

A links page is not in the blog index, the RSS feed or the gallery index. This is also true for a links page under `src/blog/` or `src/gallery/`. The page has no navigation, because the skeleton does not include `header.html` and `footer.html`.

The template has a sample links page at `src/links/index.md`. It is a draft, so the build does not publish it. Remove the `draft: true` line to publish it, or delete the file.

To create a links page with two sample links:

```bash
npm run create-md -- links links
```

## Custom links skeleton

If you changed `links-skeleton.html`, keep your design and make sure the file has these elements:

| Selector | What the build puts in it |
|---|---|
| `.entry-title` | The title |
| `.entry-content` | The Markdown text |
| `#links` | The link buttons |
| `#links-image` | The `<img>` for the `image` key. The build removes the element when the page has no `image`. |

The skeleton is a full HTML document. It does not include `header.html` and `footer.html`. Keep the `<link rel="stylesheet" href="./css/style.min.css">` in the `<head>`, and keep the `class="links-page"` on the `<body>`. The build adds the `css` overrides at the end of the `<head>`.

Remove the hard-coded links from the file.

For the classes and the theming options, see [THEMING.md](./THEMING.md#4-theming-a-links-page).

## Suggested Prompt for AI assisted upgrade:

If your site has already been upgraded to v2 template, you can try the following prompt to let your favorite AI agent perform your upgrade to Template version 3:

>Upgrade this site to Vanilla Gorilla template 3.
>
>Sources
>- Template repo: ../vanilla-gorilla. Read docs/UPGRADE-v3.md. Use `git log` there to find the v3 commits.
>- Site: this repo. Read CLAUDE.md first.
>
>Method
>1. Compare the site's build.js, create-page.js, skeletons and style.css with the template's previous version. Ignore line endings.
>2. If a file is customized, do not replace it. Take the template's v3 diff and apply it as a patch.
>3. If a file is not customized, copy it from the template.
>4. The site's CSS uses its own variable names. Map the template's links CSS to the site's tokens.

>Decisions already made
>- Branch: create a new branch to work on for this work.
>- Add the sample `src/links/index.md` with `draft: true`, using the site's real logo and social, phone and email links.
>- Design: use the site's brand colors, fonts and logo.
>- Sitemap: `sitemap: false` is the default.
>- Add `test/links.test.js`. Update `template.test.js` to expect version 3.
>- Add or Update CLAUDE.md as part of this job.
>
>Verify before you commit
>- `npm run build` passes on a clean `dist/`. If a local server holds `dist/`, stop it first.
>- `npm test` passes.
>- Build `main` and this branch in a worktree and diff the `dist/` folders. Only CSS may differ.
>- With the draft flag off, check the links page in a browser at phone width. Restore the draft flag afterward.
>
>Deliver
>- Commit with conventional messages and the co-author trailer.
>- Push the branch and open a PR. Do not push to `main`.
>- In the PR body, list what you verified and what I should check locally.
>
>Ask me only if you find something these instructions don't cover.
