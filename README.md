# 🦍 Vanilla Gorilla

Vanilla Gorilla is a minimalist, lightning-fast static site compiler built on pure **Vanilla HTML, CSS, and client-side JavaScript**. It handles the heavy technical lifting of compiling templates, markdown content, and styling so that you can focus on building beautiful sites and content.

The repository is pre-optimized for **agentic workflows**—it includes native `.agents` instructions and skills so your AI assistant can construct pages, write blog posts, and manage style guides on your command.

---
## Demo Site
The official demo is located at <a href="https://vg.exhibita.com" target="_blank">https://vg.exhibita.com</a>.
Other sites include:
- <a href="https://exhibita.com" target="_blank">https://exhibita.com</a> - This is written on the pre-cursor to the Vanilla Gorilla framework and will eventually be moved over to a full implementation of the Vanilla Gorilla framework.
- <a href="https://breezy.camp" target="_blank">https://breezy.camp</a> - COMING SOON: A simple website built for my travelling companion Breezy using the framework.

## ⚡ Quickstart Commands

### 1. Install Dependencies
Install development dependencies (`cheerio` for templates, `chokidar` for watching, `gray-matter` for frontmatter, and `marked` for markdown rendering):
```bash
npm install
```

### 2. Compile the Site
Run a full build. This cleans the `/dist` directory, minifies the stylesheets, compiles all source HTML and Markdown pages, builds sitemaps and RSS feeds, and writes them to `/dist`:
```bash
npm run build
```

### 3. Watch for Changes (Local Development)
Start the watch compiler. It monitors the `/src` folder, recompiling outputs instantly as you edit:
```bash
npm run watch
```

### 4. Create a Prettified Page (Pretty URLs)
To maintain beautiful directory-style URLs (e.g. `/blog/my-post/` instead of `/blog/my-post.html`), Vanilla Gorilla compiles every slug target as `index.html` inside a subfolder named after the slug.

To scaffold a new page or blog post with appropriate relative path nesting:
- **Markdown page (recommended for articles)**:
  ```bash
  npm run create-md -- blog blog/my-new-post
  ```
- **HTML page (for custom layouts)**:
  ```bash
  npm run create-page -- gallery gallery/travel-photos
  ```

---

## 📁 Directory Structure

```
├── .agents/                    # AI Agent workflow configurations and instructions
│   ├── skills/                 # Custom skills equiping AI agents to build pages/styles
│   └── agents.md               # Main instructions defining development team roles
├── .github/
│   └── workflows/
│       └── pages.yml           # GitHub Actions workflow for automatic Pages deployment
├── src/                        # Active Development Source Code
│   ├── css/                    # Custom styling stylesheets (style.css minifies to style.min.css)
│   ├── skeletons/              # Page layouts (blog, gallery) used during scaffolding
│   ├── templates/              # Reusable template components (header.html, footer.html)
│   ├── blog/                   # Blog articles and generated blog listing
│   ├── gallery/                # Image gallery with built-in Lightshow Lightbox
│   └── index.html              # Homepage template
├── dist/                       # Compiled static production-ready output (Git-ignored)
├── build.js                    # Compiler execution script
├── minify.js                   # CSS compression script
├── create-page.js              # Page and article generator scaffolding tool
├── invalidate.js               # CDN cache purger for CloudFront invalidations
├── package.json                # Project script config and dependencies
└── README.md                   # This documentation file
```

---

## 🎨 Design and Layout Features

### Harmonious Earthy Design
The stylesheet `src/css/style.css` provides a simple, light-background organic style built using CSS variables:
*   **Linen background** (`#f8f6f2`) for comfortable reading.
*   **Bark Charcoal** (`#2b2927`) for deep semantic text contrast.
*   **Sage Green** (`#596e57`), **Terracotta Clay** (`#c98263`), and **Ochre Gold** (`#cca05a`) accents.
*   Elegant pairing of `Outfit` (sans-serif) and `Playfair Display` (serif) typography.

### CSS-Only Lightshow Lightbox
The gallery skeleton (`src/skeletons/gallery-skeleton.html`) features a pure-CSS interactive Lightshow lightbox. By targeting elements via the CSS `:target` selector, clicking an image triggers a modal overlay without using a single line of client-side JavaScript. This preserves lightning-fast load times.

### Building Your Own Theme
Want to replace the default look, or port an existing website into Vanilla Gorilla? See [docs/THEMING.md](docs/THEMING.md) for a full guide to the template/skeleton system and a step-by-step conversion walkthrough.

---

## 🤖 AI Agent Workflow

If you are using an agentic IDE (like Antigravity IDE), the AI assistant is configured to understand your framework layout and rules automatically. You can command your agent to:
*   *“Create a new blog post about vanilla coding.”*
*   *“Generate a new photography gallery page from the gallery skeleton.”*
*   *“Refactor the earthy styling to add a new button component.”*
*   *“Compile and commit the changes to the main branch.”*

## 📄 License

This project is licensed under the GNU Affero General Public License v3 (AGPLv3). See the [LICENSE](file:///./vanilla-gorilla/LICENSE) file for more details.

