---
title: Welcome to Vanilla Gorilla
date: 2026-07-15
description: Introducing Vanilla Gorilla, a static site generator designed for agentic workflows.
skeleton: blog
---

We are excited to introduce **Vanilla Gorilla**! 🦍

Vanilla Gorilla is a minimalist static site compiler that helps you construct high-performance websites without any complex framework overhead. The design philosophy is simple:

1. **"Vanilla" is the Product**: The generated output is pure, standard, highly-optimized HTML, CSS, and client-side JavaScript. There are no runtime frameworks, hydrations, or virtual DOMs.
2. **"Gorilla" is the Agent**: You concentrate on the ideas and content, while your AI coding assistants (like Antigravity IDE) handle the heavy lifting of styling, compilation setup, and page structuring.

---

### How It Works

Vanilla Gorilla parses layout files using simple Server-Side-Includes (SSI) templates:
```html
<!--#include file="templates/header.html" -->
```

During the pre-deployment compilation phase, the Node.js compiler:
- Flattens template blocks.
- Computes folder directory nesting depth.
- Re-writes relative URLs dynamically so page links resolve correctly regardless of directory depth.
- Compiles Markdown files containing frontmatter into full HTML pages.
- Auto-generates an RSS feed, xml sitemap, and blog listing indexes.

---

### Getting Started

You can run the compiler using standard NPM scripts:

*   **Install packages**: `npm install`
*   **Single compile**: `npm run build`
*   **Watch mode**: `npm run watch`

Welcome to simple, lightning-fast static compiling!
