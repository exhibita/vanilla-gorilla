# Vanilla Gorilla

This project is a pure static HTML/CSS/JS site. Vanilla Gorilla (Node.js, cheerio, marked, gray-matter) compiles `src/` to `dist/`. A push to `main` deploys `dist/` to GitHub Pages.

## Commands

* `npm run build`: minify CSS, then compile all pages to `dist/`.
* `npm run watch`: build, then rebuild on file changes.
* `npm run create-page`: create an HTML page.
* `npm run create-md`: create a Markdown page.
* `npm run invalidate`: run `invalidate.js`.
* `npm test`: run `node --test test/*.test.js`.

## Writing style

Write in the spirit of ASD STE100. Use direct sentences. Limit each procedural step to one action. Do not use unnecessary synonyms.

## Rules

* **No placeholders**: Write complete code. Do not use abbreviated snippets or placeholders such as `<!-- rest of code here -->`.
* **Static output only**: Do not add server-side frameworks (Express, Python, and similar) to the site. The Node.js build tooling is the only exception. The output is static client-side files in `dist/`.
* **Pretty URLs**: Each page compiles to `index.html` in a folder named for its slug. Example: `src/blog/my-post/index.md` compiles to `dist/blog/my-post/index.html`. Keep the trailing-slash convention.
* **Relative links**: Use relative paths (`./`, `../`) so links work locally and in production. Never write absolute paths that reference `localhost`.
* **Live Server**: Never modify, remove, or break the inject scripts that Live Server uses.
* **Markdown**: Do not use horizontal rules (`---`) between sections or around headings in `.md` files. Use blank lines.
* **CSS**: Write vanilla CSS and modern JavaScript. Follow the Earthy Light-Themed design system in `src/css/style.css`. Edit only `src/css/style.css`. Never edit `src/css/style.min.css`. The build regenerates it.

## Workspace

* `src/` holds all source. `dist/` holds compiled output and is gitignored.
* Pages with invalid front matter are skipped by the build.
* Use conventional commit messages (`feat: add contact form`, `fix: escape cover src`). A push to `main` deploys live.

## Before you finish

1. Run `npm run build`. Run it before you stage, commit, or push.
2. Run `npm test` if you changed build code.
3. Check that new HTML and CSS pass basic validation.
4. Test relative links at each page depth.
5. List the edge cases you verified. Do not report a task as complete if any uncertainty remains.

## Working style

* State your assumptions. If a request is unclear or has several interpretations, ask. Do not pick one silently.
* Write the minimum code that solves the problem. Add no unrequested features, abstractions, or configuration.
* Make surgical changes. Match the existing style. Remove only the imports, variables, and functions that your changes made unused.
* Turn each task into a verifiable goal.

## Skills

Project skills are in `.agents/skills/`. Read the matching skill before you start:

* `page-creator`: create new pages.
* `design-system` and `design-apply`: the design system and how to apply it.
* `live-server-safeguard`: protect Live Server inject scripts.
* `safe-deploy`: deployment checks.

The source guidance is in `.agents/agents.md` and `.agents/rules/agent-guidelines.md`.
