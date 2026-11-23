# Upgrade to template version 4

Template version 4 adds two optional front matter keys for blog posts: `image` and `badge`. The blog index and the recent posts list show them.

A site on version 1 or 2 must also do the steps in [UPGRADE-v2.md](./UPGRADE-v2.md) and [UPGRADE-v3.md](./UPGRADE-v3.md). The `build.js` file in version 4 includes the earlier features.

## What changes

| File | Change |
|---|---|
| `build.js` | Replace the file. |
| `src/css/style.css` | Add the "Post image and badge" block. See "Add the CSS" below. |
| `package.json` | Change `templateVersion` to `4`. See step 4. |
| `test/post-image.test.js` | Optional. Copy the file to test the feature with `npm test`. |

Existing pages do not change. A post with no `image` and no `badge` builds the same as before.

## Use the keys

```yaml
---
title: Summer hair care
date: 2026-05-15
description: Keep your colour bright in the sun.
image: ./images/blog/summer.png
badge: Hair Care
---
```

- `image` is a path from `src/`, with or without `./` at the start, or a full URL. The build fixes a path for the depth of each page that shows it.
- `badge` is a short label, for example a category.
- The build does not use an image from the body of the post. Only the `image` key sets the post image.
- An HTML blog post sets the same values with `<meta property="og:image" content="...">` and `<meta property="article:section" content="...">`.

## What the build generates

For a post with `image` or `badge`, each entry in the blog index gets these elements:

```html
<article class="post type-post status-publish format-standard hentry has-post-thumbnail">
    <a class="post-thumbnail" href="my-post/" tabindex="-1" aria-hidden="true"><img src="../images/blog/summer.png" alt="" loading="lazy"></a>
    <header class="entry-header">
        <span class="entry-badge">Hair Care</span>
        <h2 class="entry-title"><a href="my-post/">Summer hair care</a></h2>
        ...
```

The image link is hidden from assistive technology because the title link goes to the same page.

For the same post, the item in `templates/recent-posts.html` gets the image, the badge, the date and the summary:

```html
<li class="has-post-thumbnail">
    <a class="wp-block-latest-posts__featured-image" href="./blog/my-post/" tabindex="-1" aria-hidden="true"><img src="./images/blog/summer.png" alt="" loading="lazy"></a>
    <span class="wp-block-latest-posts__badge">Hair Care</span>
    <a class="wp-block-latest-posts__post-title" href="./blog/my-post/">Summer hair care</a>
    <time class="wp-block-latest-posts__post-date" datetime="2026-05-15">May 15, 2026</time>
    <div class="wp-block-latest-posts__post-excerpt">Keep your colour bright in the sun.</div>
</li>
```

## Upgrade a site

1. Make a new branch in the site repository.
2. Copy `build.js` from the template into the site. If the site has its own changes in `build.js`, do not replace the file: compare it with the template and add the version 4 changes.
3. Add the "Post image and badge" block from the template `src/css/style.css` to the site `src/css/style.css`.
4. In `package.json`, change the `vanillaGorilla` field to `{ "templateVersion": 4 }`.
5. Run `npm run build`.
6. Run `npm test`.

## A site that already has its own image cards

A site with a changed `build.js` that generates `blog-card` markup must change its CSS selectors to the selectors above before it replaces `build.js`.
