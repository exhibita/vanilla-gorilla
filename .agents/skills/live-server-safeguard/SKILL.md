---
name: live-server-safeguard
description: Prevents hardcoded URLs and safeguards against VS Code Live Server background script leakages.
---

# Skill: Live Server Safeguard

Use this skill whenever reading, editing, or validating HTML and CSS files to verify that local development references do not leak into the source code or compilation outputs.

## Instructions

1.  **Relative Links Only**: Check all `href`, `src`, and CSS `url()` assets. They must be relative. Never write absolute paths pointing to `http://127.0.0.1:5500` or local ports.
2.  **Live Server Injection Block**: The VS Code Live Server extension automatically injects a script block at the end of the `<body>` element during development.
    - **Detection**: Look for `<!-- Code injected by live-server -->`.
    - **Action**: Always ensure this block is **removed** before saving source code, building, or committing files. It must never leak into version control or S3/GitHub Pages releases.
3.  **Path Adjustments**: The compiler automatically rewrites relative links depending on nesting depth. Verify that links in templates or skeletons start with `./` so they are correctly parsed.
