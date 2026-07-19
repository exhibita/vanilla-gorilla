---
name: design-apply
description: Automates design-to-code transformation by analyzing static designs and applying them to Vanilla Gorilla's templates, CSS, and HTML structure while preserving the build contract.
---

# Skill: Design Apply

Use this skill when a user provides a design they want to apply to their Vanilla Gorilla site. The skill supports three input formats (screenshot/mockup, HTML reference site, or Figma design), analyzes the design using a hybrid visual + structural approach, proposes changes iteratively, builds and verifies the result, and commits changes to git.

This skill is designed for both end users (who want to redesign their site) and AI agents (who are building Vanilla Gorilla sites and need design automation).

## Input Formats Supported

The skill accepts three types of design inputs:

**1. Screenshot / Mockup Image**
- User uploads an image file or provides a URL to a screenshot
- Agent analyzes visual properties: colors, typography, spacing, layout, imagery

**2. Static HTML Reference Site / Website URL**
- User provides `file:///` path to local HTML or `https://` URL to a website
- Agent analyzes both visually AND structurally: extracts visual properties + HTML semantic organization, nav position, content hierarchy, footer structure

**3. Figma Design Link**
- User provides a Figma file share link
- Agent analyzes visually (preview image) and attempts to parse design tokens, component names, and semantic metadata from Figma's structure

## Workflow

### Phase 1: Analyze Design Input

1. **Accept user input** in one of the three formats above. Ask clarifying questions if the format is ambiguous.
2. **Perform input-specific analysis:**
   - **Screenshot**: Extract colors (hex/RGB), typography (font families, sizes, weights), spacing rhythm, imagery placement
   - **HTML/URL**: Render visually AND parse DOM to understand semantic structure (nav position, content hierarchy, footer layout, component patterns)
   - **Figma**: Fetch design preview and parse design tokens, component names, and layer annotations
3. **Generate Design Brief** document containing:
   - Visual properties: color palette, typography, spacing scale, imagery, effects
   - Semantic intent: layout philosophy, component patterns, brand tone, accessibility notes
   - Asset inventory: required assets with status ("Already in project" or "**You'll need to source this**")
   - Extraction notes: what was clear vs. inferred, confidence levels
4. **Save Design Brief** to `docs/design-applied/YYYY-MM-DD-design-brief.md`

### Phase 2: Map Changes & Generate Proposal

1. **Read current Vanilla Gorilla state:**
   - `src/css/style.css` (extract current CSS variables, theme structure)
   - `src/templates/header.html`, `footer.html` (layout and structure)
   - `src/skeletons/*-skeleton.html` (content injection points)
   - `src/index.html` (homepage layout)
   - Current images, fonts, asset references

2. **Compare Design Brief against current state** and identify:
   - **CSS variables to update**: Which `:root` variables need new values (colors, fonts, spacing)
   - **HTML structure changes**: Which templates need semantic/layout restructuring, nav positioning, footer changes
   - **Asset changes**: Images/icons/fonts needed, flagged as "Already in project" or "**You'll need to source this**"
   - **Build contract validation**: Confirm all required CSS selectors from THEMING.md remain present

3. **Generate detailed proposal** showing:
   - Files affected (count and list)
   - CSS variable updates (old → new values, in table format)
   - HTML structure changes (conceptual, human-readable descriptions)
   - Asset inventory with missing asset flags
   - Confidence summary (HIGH/MEDIUM/LOW for visual extraction, semantic intent, asset sourcing)

4. **Present proposal to user** for review.

### Phase 3: Iterative Refinement (Optional)

1. **User reviews proposal** and can:
   - **Approve**: "Apply these changes" → proceed to Phase 4
   - **Refine**: Provide feedback for iteration (e.g., "Make primary color darker", "Move nav to left sidebar", "Use a different serif font")
   - **Reject**: Discard and start over with a new design input

2. **If refinement feedback given:**
   - Re-analyze original design input in context of the feedback
   - Generate delta proposal showing only changes from previous proposal
   - Present refined proposal to user
   - Maintain context across iterations (feedback compounds; 1st: "darker primary" + 2nd: "move nav left" applies both)

3. **Handle contradictions:** If feedback conflicts with original design intent, ask for clarification: "Your design shows earthy tones, but you're asking for neon colors—did you change design direction?"

4. **Iteration limit:** After 5-7 iterations, ask if user wants to start fresh with a different design input.

### Phase 4: Apply Changes & Build

1. **Apply approved changes** to disk:
   - Update `src/css/style.css` (CSS variables + structural CSS)
   - Modify `src/templates/header.html`, `footer.html` (if layout changes)
   - Rework `src/skeletons/*.html` (if structure changes)
   - Modify `src/index.html` (if homepage layout changes)
   - Copy/reference new assets into `src/images/`

2. **Run build:** Execute `npm run build`
   - Capture console output
   - Check for errors/warnings (missing selectors, broken includes, syntax errors)
   - Validate build contract: Confirm all required CSS selectors are present
   - If build fails: Report the error and ask user to debug or rollback

3. **Generate Verification Report** to `docs/design-applied/YYYY-MM-DD-application-report.md` containing:
   - Summary: Files changed, build status, errors/warnings
   - Detailed changes (CSS variables, HTML structure, file list)
   - **Missing Assets Report** with "You'll need to source this" flags
   - Optional diffs (available on user request)

4. **Present report to user** for review. Offer options:
   - View detailed diffs
   - Start live preview (`npm run watch`)
   - Approve and proceed to commit
   - Rollback and start over

### Phase 5: Commit & Push

1. **Generate commit message:**
   ```
   design: apply [design-source] theme to Vanilla Gorilla
   
   - Updated CSS variables: [count] changes (colors, typography, spacing)
   - Modified templates: [list of changes]
   - Files changed: [count]
   - Build status: ✓ SUCCESS
   
   Missing assets flagged in docs/design-applied/ for manual sourcing.
   ```

2. **User can edit the message** before committing.

3. **Commit changes:** `git add [staged files]` → `git commit`

4. **Offer to push:**
   - Check current branch and remote status
   - If pushing to `main`, warn: "You're pushing directly to main. Confirm?"
   - Execute `git push origin [branch]`
   - Report push status

5. **Save completion summary** to `docs/design-applied/YYYY-MM-DD-completion-summary.md` containing:
   - Design brief snapshot
   - Changes made
   - Missing assets
   - Next steps (source assets, test responsiveness, iterate further)

6. **Provide user with references** to all generated documents in `docs/design-applied/`

## Build Contract Constraints

The skill MUST preserve these CSS selectors and HTML elements (from THEMING.md §1):

| Selector | Location | Purpose |
|----------|----------|---------|
| `<title>` | Any skeleton | Page title injection |
| `.entry-title` | Skeleton | Post/page title |
| `.entry-content` | Skeleton | Body content injection |
| `time.entry-date` | Skeleton | Date/timestamp |
| `.entry-footer` | Skeleton | Post footer (removed on non-blog pages) |
| `meta[name="description"]` | Skeleton `<head>` | Meta description |
| `#post-nav-placeholder` | `blog-skeleton.html` | Prev/next post links |
| `#blog-post-list` | `templates/blog-index.html` | Blog listing injection |
| `#gallery-list` | `templates/gallery-index.html` | Gallery listing injection |

**Validation:** After applying changes, verify all selectors are present (by name) in updated files. Build fails if any are missing.

## Key Principles

- **Preserve CSS variable structure** from THEMING.md (update values, not the variable names)
- **Preserve required CSS selectors** by name from the build contract
- **Preserve SSI include architecture** (`<!--#include file="..." -->`)
- **Flag all missing assets** with "You'll need to source this"
- **Validate build after every change** before proceeding to commit
- **Maintain iterative context** across refinement feedback (changes compound)
- **Generate permanent records** (Design Brief, Application Report, Completion Summary) for reference

## Error Handling

- **Build failures:** Report the error and offer to debug or rollback
- **Missing assets:** Flag clearly; don't fail the build (images can be added later)
- **Semantic conflicts:** Ask for clarification if feedback contradicts design intent
- **Iteration overload:** After 5-7 iterations, suggest starting fresh with a new design input

## Success Criteria

1. ✓ Design Brief extracted and saved as markdown
2. ✓ Proposal generated with CSS changes, HTML structure changes, and missing assets flagged
3. ✓ User can iterate with refinement feedback
4. ✓ Changes applied to files
5. ✓ Build succeeds (0 errors; warnings acceptable)
6. ✓ All build contract selectors preserved by name
7. ✓ All missing assets documented
8. ✓ Changes committed with descriptive message
9. ✓ Changes pushed to remote (with user approval)
10. ✓ All artifacts saved to `docs/design-applied/`

## Artifacts Generated

```
docs/design-applied/
├── YYYY-MM-DD-design-brief.md          # Extracted design intent
├── YYYY-MM-DD-application-report.md    # Verification & changes
└── YYYY-MM-DD-completion-summary.md    # Final state & next steps
```

Modified source files (as needed):
```
src/
├── css/style.css              # Updated CSS variables
├── templates/
│   ├── header.html            # Layout changes (if any)
│   └── footer.html            # Layout changes (if any)
├── skeletons/
│   └── *-skeleton.html        # Structure changes (if any)
├── index.html                 # Homepage layout (if any)
└── images/                    # New assets (if sourced)
```

## Example Workflow

**User:** "I have a Figma design I want to implement"

1. User invokes skill with Figma link
2. Agent fetches design, extracts visual + token properties
3. Agent saves Design Brief to `docs/design-applied/2026-07-19-design-brief.md`
4. Agent generates proposal: CSS variables (9 updates), template changes, missing assets (2)
5. User refines: "Make primary color more saturated"
6. Agent re-proposes with updated color
7. User approves
8. Agent applies changes, runs build (success)
9. Agent generates Application Report, flags 2 missing assets
10. User reviews, approves
11. Agent commits: "design: apply Modern Minimalist (Figma) theme to Vanilla Gorilla"
12. Agent pushes to origin/main (with user confirmation)
13. Done—all artifacts saved, user receives next steps (source missing assets, test)
