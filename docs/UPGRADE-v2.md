# Upgrade to template version 2

Template version 2 adds drafts and galleries from a list of images. Gorilla To Go needs version 2.

## What changes

| File | Change |
|---|---|
| `build.js` | Replace the file. |
| `src/skeletons/gallery-skeleton.html` | Replace the file. If you changed it, see "Custom gallery skeleton" below. |
| `package.json` | Add two fields. See step 4. |
| `test/` | Optional. Copy the folder to run `npm test`. |

Hand-built HTML pages and HTML galleries do not change.

If the front matter of a Markdown page is not valid YAML, the build skips that page and shows a warning. The other pages build and deploy. (Before version 2.1 of `build.js`, one bad page stopped the whole build.)

## Upgrade a site

1. Make a new branch in the site repository.
2. Copy `build.js` from the template into the site.
3. Copy `src/skeletons/gallery-skeleton.html` from the template into the site.
4. In `package.json`, add these two fields:

   ```json
   "license": "AGPL-3.0-or-later",
   "vanillaGorilla": { "templateVersion": 2 }
   ```

5. Run `npm install --package-lock-only`.
6. Run `npm run build`.
7. Make sure the build shows `Build complete.`
8. Open some pages from `dist/` and make sure they look correct.
9. Merge the branch into `main`.
10. Make sure the GitHub Actions deploy is successful.

## Drafts

Add `draft: true` to the front matter of a Markdown page:

```yaml
---
title: My next post
date: 2026-10-17
draft: true
---
```

The build does not publish the page. The page is not in the blog index, the RSS feed, the sitemap or the gallery index. To publish the page, remove the `draft` line.

Note: images in `src/images/` are always copied to the site, also for a draft page.

## Galleries

A gallery is a Markdown file at `src/gallery/<slug>/index.md` with `skeleton: gallery` and an `images:` list:

```yaml
---
title: Beach trip
date: 2026-10-17
description: Photos from the beach.
skeleton: gallery
images:
  - path: ./images/gallery/beach-trip/waves.jpg
    alt: Waves on the sand
    caption: Morning waves
---

Text above the photos.
```

- `path`: the image path from `src/`. Start it with `./`. Put the images in `src/images/gallery/<slug>/`.
- `alt`: the text for screen readers. If there is no `alt`, the build uses the caption.
- `caption`: optional. It shows on the image and in the lightbox.

The first image is the cover on the gallery index. To use a different cover, add `cover: ./images/...`.

If `src/gallery/index.html` exists, the generated gallery index replaces it in `dist/` when the site has a gallery at `gallery/<slug>/`.

## Custom gallery skeleton

If you changed `gallery-skeleton.html`, keep your design and make sure the file has these elements:

| Selector | What the build puts in it |
|---|---|
| `.entry-title` | The title |
| `.entry-content` | The Markdown text |
| `#gallery` | The image grid |
| `#gallery-lightboxes` | The lightbox for each image |

Remove the hard-coded images and lightboxes from the file.
