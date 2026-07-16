---
name: page-creator
description: Automates the creation and content generation of new pages using existing project skeletons.
---

# Skill: Page Creator

Use this skill when the user commands you to create a new page, blog post, or article. This skill ensures that pages are created with correct directory layout, pretty URLs, and depth-adjusted path references.

## Workflow

1.  **Determine Page Type**: Identify if the page should be a Markdown-based post (preferred for articles/blog posts) or a skeleton-based HTML page.
2.  **Verify Pretty URLs**: Ensure the page ends with `/index.md` or `/index.html` (e.g. `src/blog/my-new-post/index.md`) so that standard static servers serve it via a pretty directory URL (`/blog/my-new-post/`).
3.  **Execute Creation Script**:
    - **For Markdown**: Run `npm run create-md -- <skeleton-type> <path>`
      *Example: `npm run create-md -- blog blog/my-new-post`*
    - **For HTML**: Run `npm run create-page -- <skeleton-type> <path>`
      *Example: `npm run create-page -- gallery gallery/travel-photos`*
4.  **Generate Content**:
    - Open the newly generated file (e.g., `src/blog/my-new-post/index.md`).
    - Populate high-quality, professional, and SEO-friendly content based on the user's instructions.
    - Keep the frontmatter header intact. Fill in `title`, `date` (format YYYY-MM-DD), and `description` (for SEO and RSS).
5.  **Build & Verify**:
    - Run `npm run build` to compile the page into the `dist/` directory.
    - Inspect the compiled page (e.g., `dist/blog/my-new-post/index.html`) to ensure SSI includes and relative paths resolved correctly.

## Constraints
- **Relative Paths**: Always use relative paths for images and internal page links.
- **Markdown First**: Default to Markdown (`create-md`) for content pages unless a custom skeleton is required.
