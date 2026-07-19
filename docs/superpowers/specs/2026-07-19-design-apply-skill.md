# Design Apply Skill — Specification

**Date:** 2026-07-19  
**Skill Name:** `.agents:design-apply`  
**Purpose:** Enable end users and AI agents to upload a static design and have the agent propose, review, and apply design-to-code transformations while preserving Vanilla Gorilla's required HTML structure and build contract.

---

## 1. Overview

The Design Apply skill (`design-apply`) automates the process of converting a design (from a screenshot, HTML reference site, or Figma file) into Vanilla Gorilla code by:

1. Analyzing the design using a **Progressive Enhancement approach** (visual + structural parsing)
2. Extracting a **Design Brief** documenting visual and semantic intent
3. **Proposing changes** to CSS variables, HTML templates, skeletons, and assets while preserving the build contract
4. **Iterating** with the user (refinement feedback → re-proposal)
5. **Building and verifying** the result
6. **Committing and pushing** changes to git

### End Users

- Vanilla Gorilla site owners wanting to redesign their site
- AI agents (Claude, Copilot, etc.) building Vanilla Gorilla sites and needing design automation
- Both equally supported

### Key Constraints

- **Preserve CSS variable structure** from THEMING.md (`:root` variables for colors, fonts, spacing)
- **Preserve required CSS selectors** from the build contract (by name, not by value)
- **Preserve required HTML elements** (`.entry-title`, `.entry-content`, `time.entry-date`, etc.)
- **Flag all missing assets** ("You'll need to source this")
- **Maintain SSI include architecture** (`<!--#include file="..." -->`)

---

## 2. Input Formats

The skill accepts three input types, each with a tailored analysis path:

### 2.1 Screenshot / Mockup Image
**Input:** User uploads an image file or provides a URL to a screenshot.

**Analysis:**
- Extract visual design: colors (primary, secondary, accent, text), typography (font families, sizes, weights), spacing/layout rhythm, imagery placement
- No semantic structure parsing (screenshots don't contain it)
- Output: Visual properties only

**Use case:** "Here's my Photoshop mockup—make the site match it"

### 2.2 Static HTML Reference Site / Website URL
**Input:** User provides `file:///` path to local HTML or `https://` URL to an existing website.

**Analysis:**
- **Visual parsing**: Render the site and extract colors, typography, spacing, layout (as with screenshots)
- **Structural parsing**: Parse the HTML to understand semantic organization (nav position, content hierarchy, footer structure, component patterns)
- **CSS inspection**: Check for intentional hooks or design-system patterns (existing class/ID conventions)
- Output: Visual + structural semantic intent (more robust than screenshots)

**Use case:** "I have an existing website at `example.com` or a local copy—port its design to Vanilla Gorilla"

### 2.3 Figma Design Link
**Input:** User provides a Figma file share link or file ID.

**Analysis:**
- **Visual extraction**: Fetch a high-res preview of key frames/pages and analyze visually (colors, typography, spacing)
- **Design metadata**: Attempt to parse design tokens, component names, layer structure, and semantic annotations from Figma's API (if accessible)
- **Component mapping**: Map Figma components to Vanilla Gorilla component types (header, footer, post card, etc.)
- Output: Visual + design-system intent from Figma tokens

**Use case:** "I designed this in Figma—implement it in Vanilla Gorilla"

### Convergence
All three paths produce a **Design Brief Object** (Section 3) containing unified properties.

---

## 3. Design Brief Object

After input analysis, the skill generates a **Design Brief** document (saved as `docs/design-applied/YYYY-MM-DD-design-brief.md`) containing:

### 3.1 Visual Properties
- **Color palette**: Primary, secondary, accent, text colors (hex/RGB with semantic names)
- **Typography**: Font families, sizes, weights for headings, body, code
- **Spacing scale**: Padding/margin units, breakpoints, max-width
- **Imagery**: Logo, hero image, accent graphics (locations, dimensions, alt text needed)
- **Effects**: Shadows, borders, border-radius patterns

### 3.2 Semantic Intent
- **Layout philosophy**: Multi-column vs. single-column, nav position (top, side, footer), footer structure
- **Component patterns**: Repeating elements (blog post cards, gallery thumbnails) and their visual structure
- **Accessibility notes**: Contrast ratios, semantic HTML structure implied by design
- **Brand/tone**: Formal vs. casual, earthy vs. modern, minimalist vs. ornate

### 3.3 Asset Inventory
- Required assets: logos, hero images, icons, fonts
- Asset status: "Already in project" vs. "You'll need to source this"

### 3.4 Extraction Notes
- What was clear from the design vs. what the agent inferred
- Confidence levels for ambiguous decisions
- Questions for the user if semantic intent was unclear

**Example:**

```markdown
# Design Brief: Modern Minimalist (Figma)
**Date:** 2026-07-19  
**Source:** Figma file "Modern Redesign" by user@example.com

## Visual Properties
- Primary: #1a1a1a (near-black)
- Accent: #ff6b35 (vibrant orange)
- Text: #2a2a2a (dark gray)
- Font: Inter (sans-serif), Lora (serif)
- Max-width: 1200px
- Spacing scale: 4px, 8px, 16px, 32px

## Semantic Intent
- Layout: Full-width header, 2-column content + sidebar
- Nav: Sticky header with horizontal menu
- Brand: Modern tech company (minimal, clean, approachable)

## Asset Inventory
- Logo: Custom SVG (sketch provided in Figma)
- Hero image: Full-width banner (You'll need to source this)
- Icons: System icons from Figma community pack (Already available)
```

---

## 4. Proposal Generation & Change Mapping

### 4.1 Current State Analysis
The skill reads:
- `src/css/style.css` (extracts current CSS variables, theme structure)
- `src/templates/header.html`, `footer.html` (layout and structure)
- `src/skeletons/*-skeleton.html` (content injection points)
- `src/index.html` (homepage layout)
- Current images, fonts, asset references in `src/images/`

### 4.2 Comparison & Mapping
The skill compares the Design Brief against the current state and identifies:

**CSS Variables to Update:**
- Which `:root` variables need new values (colors, fonts, spacing scale)
- Which variables are unused by the current design and can be removed or deprecated

**HTML Structure Changes:**
- Which templates need semantic or layout restructuring
- Where nav/footer/sidebar positioning changes
- New component skeletons needed (if the design introduces new content types)

**Asset Changes:**
- Images/icons/fonts that need to be sourced and added to `src/images/`
- Each asset flagged as "Already in project" or "**You'll need to source this**"

**Build Contract Validation:**
- All CSS selector names from THEMING.md §1 remain present
- All required HTML elements (`.entry-title`, `.entry-content`, `time.entry-date`, etc.) remain intact
- SSI include directives preserved

### 4.3 Proposal Output
The skill generates a **human-readable proposal** showing:

```
## Proposal: Design Apply — Modern Minimalist

**Files to be changed:** 6
- src/css/style.css (CSS variables + theme updates)
- src/templates/header.html (layout restructure: nav → sticky horizontal)
- src/templates/footer.html (footer structure change)
- src/skeletons/blog-skeleton.html (spacing adjustments)
- src/index.html (homepage layout)
- src/images/ (new assets)

### CSS Variables (9 changes)
- --bg-primary: #f8f6f2 → #ffffff (lighter background)
- --text-main: #2b2927 → #2a2a2a (adjust text color)
- --color-primary: #596e57 → #1a1a1a (new primary)
- --color-accent: (new) #ff6b35 (new accent color)
- ... (more variables)

### HTML Structure Changes
- Header: Div layout → Flex sticky nav with horizontal menu
- Footer: 2-column → Single column with centered content
- New: Sidebar component for blog layout
- Preserved: All build contract selectors (.entry-title, .entry-content, etc.)

### Asset Changes
- Logo: Current logo.png → (You'll need to source this)
- Hero image: (new) /hero.jpg → (You'll need to source this)
- Fonts: Add "Inter" family to CSS imports → (You'll need to source the font file)
- Icons: Use Figma community icons → (You'll need to source this)

### Confidence Summary
- Visual extraction: HIGH
- Semantic intent: MEDIUM (inferred from Figma layer structure)
- Asset sourcing: LOW (user must provide images)

### Next Steps
- Review proposal
- Request refinements (e.g., "Adjust primary color tone")
- Approve to proceed to build phase
```

---

## 5. Iterative Refinement Loop

### 5.1 User Options After Proposal
After reviewing the proposal, the user can:

1. **Approve**: "Apply these changes" → Build Phase (Section 6)
2. **Refine**: Provide feedback to iterate
3. **Reject**: Discard proposal and start over with a new design input

### 5.2 Refinement Feedback
Users can refine with natural language feedback, examples:
- Color adjustments: "Make the primary color darker", "Increase contrast on text"
- Layout changes: "Move navigation to left sidebar", "Make the layout single-column"
- Spacing: "Add more padding to cards", "Tighten the spacing overall"
- Typography: "Use a different serif font", "Make headers bold"
- Assets: "Use this logo instead" (with file upload)

### 5.3 Re-Analysis & Re-Proposal
When refinement feedback is given:

- Agent **re-analyzes** the original design input in the context of the feedback
- Applies the feedback as a modifier: "Given the original design + this refinement, what's the new proposal?"
- Generates a **delta proposal** highlighting only changes from the previous proposal
- User sees refined proposal and can approve, refine further, or reject

### 5.4 Iteration Context
The agent maintains full context across iterations:
- Feedback compounds (1st: "darker primary", 2nd: "move nav left" applies both cumulatively)
- Contradictions are caught: If feedback conflicts with the original design, the agent asks for clarification
- Change history is tracked (for the completion report)

### 5.5 Iteration Limits
- Reasonable max iterations: 5-7 before asking "Should we start fresh with a different design input?"
- If user gives contradictory feedback, agent asks: "Your design shows earthy tones, but you're now asking for neon colors—did you want to change the design direction?"

---

## 6. Build & Verification Phase

### 6.1 Apply Changes
Once the user approves a proposal:

- Write updated files to disk:
  - `src/css/style.css` (CSS variables + structural CSS)
  - `src/templates/header.html`, `footer.html` (layout changes)
  - `src/skeletons/*.html` (structure changes)
  - `src/index.html` (homepage layout)
  - Copy/reference new assets into `src/images/`

### 6.2 Run Build
- Execute `npm run build`
- Capture console output
- Check for errors/warnings (missing selectors, broken includes, etc.)
- Validate build contract: Confirm all required CSS selectors are present
- If build fails:
  - Report the specific error
  - Ask user to debug or rollback changes
  - Do not proceed to completion

### 6.3 Generate Verification Report
Create a comprehensive report (`docs/design-applied/YYYY-MM-DD-application-report.md`):

```markdown
# Design Application Report
**Date:** 2026-07-19  
**Design Source:** Modern Minimalist (Figma)  
**Build Status:** ✓ SUCCESS

## Summary
Applied design changes to 6 files. All required CSS selectors preserved. Build successful with 0 errors, 0 warnings.

## Files Changed
- src/css/style.css (9 CSS variables updated)
- src/templates/header.html (layout restructure)
- src/templates/footer.html (footer update)
- src/skeletons/blog-skeleton.html (spacing adjustments)
- src/index.html (homepage layout)
- src/images/ (2 new asset references added)

## CSS Variables Updated
[Table of old → new values]

## Build Output
[Clean build output, no errors]

## Missing Assets (IMPORTANT)
- Logo: You'll need to source this
- Hero image: You'll need to source this
- Font files: You'll need to add Inter font family

## Changes Summary (Optional Diffs)
[Detailed file-by-file diffs available on request]

## Next Steps
1. Source missing assets (see above)
2. Test responsive breakpoints
3. Verify visual fidelity in browser
4. Commit changes
5. Deploy to production
```

### 6.4 User Options
After verification report:
- **View detailed diffs**: Show file-by-file diffs
- **Preview changes**: (Optional) Start `npm run watch` for live preview
- **Approve & commit**: Proceed to Completion Phase
- **Rollback**: Discard changes and start over

---

## 7. Completion Phase (Commit & Push)

### 7.1 Commit
If user approves the report:

- **Generate commit message:**
  ```
  design: apply [design-source] theme to Vanilla Gorilla
  
  - Updated CSS variables: colors, typography, spacing
  - Restructured templates: header, footer, navigation
  - Modified skeletons: spacing and layout adjustments
  - Files changed: 6
  - Build status: ✓ SUCCESS
  
  Missing assets flagged in docs/design-applied/ for manual sourcing.
  ```

- **User can edit the message** before commit
- **Execute:** `git add [staged files]` + `git commit`

### 7.2 Push
After commit:

- Check current branch and remote status
- If pushing to `main`, warn: "You're pushing directly to main. Confirm?"
- Execute `git push origin [branch]`
- Report push status

### 7.3 Cleanup & Documentation
- Save **completion summary** to `docs/design-applied/YYYY-MM-DD-completion-summary.md`
  - Design brief snapshot
  - Changes made
  - Missing assets
  - Next steps
- Provide user with quick reference to all generated documents
- Suggest next actions: source assets, test on different devices, iterate further

---

## 8. Preserved Constraints (Build Contract)

The skill MUST preserve these CSS selectors and HTML elements (from THEMING.md §1):

| Selector | Location | Constraint |
|----------|----------|-----------|
| `<title>` | Any skeleton | Required for page title injection |
| `.entry-title` | Skeleton | Required for post/page title |
| `.entry-content` | Skeleton | Required for body content injection |
| `time.entry-date` | Skeleton | Required for date/timestamp |
| `.entry-footer` | Skeleton | Required for post footer (removed on non-blog pages) |
| `meta[name="description"]` | Skeleton `<head>` | Required for meta description |
| `#post-nav-placeholder` | `blog-skeleton.html` | Required for prev/next post links |
| `#blog-post-list` | `templates/blog-index.html` | Required for blog listing injection |
| `#gallery-list` | `templates/gallery-index.html` | Required for gallery listing injection |

**Validation:** After applying changes, the skill verifies all selectors are present (by name) in the updated files. If any are missing, the build phase fails with a clear error.

---

## 9. File Locations & Artifacts

### Skill Location
`.agents/skills/design-apply/SKILL.md` (this skill's instructions)

### Generated Documents
```
docs/design-applied/
├── YYYY-MM-DD-design-brief.md          # Extracted design intent
├── YYYY-MM-DD-application-report.md    # Verification & changes
└── YYYY-MM-DD-completion-summary.md    # Final state & next steps
```

### Modified Source Files
```
src/
├── css/style.css              # Updated CSS variables
├── templates/
│   ├── header.html            # Layout changes (if needed)
│   └── footer.html            # Layout changes (if needed)
├── skeletons/
│   └── *-skeleton.html        # Structure changes (if needed)
├── index.html                 # Homepage layout (if needed)
└── images/                    # New assets (if sourced)
```

---

## 10. Error Handling & Rollback

### Build Failures
If `npm run build` fails:
- Report the specific error (missing selector, broken include, CSS syntax, etc.)
- Offer to debug or rollback
- Do not proceed to commit without user confirmation

### Asset Sourcing
- All missing assets are flagged with "You'll need to source this"
- Build does not fail if assets are missing (CSS variables reference them but images can be added later)
- Completion report lists all missing assets for user action

### Semantic Conflicts
- If design brief extraction is ambiguous, agent asks for clarification
- If user feedback contradicts the design, agent flags it and asks for confirmation

---

## 11. Success Criteria

The skill is successful when:

1. ✓ Design Brief is extracted and saved as a markdown document
2. ✓ Proposal is generated showing all CSS changes, HTML structure changes, and missing assets
3. ✓ User can iterate with refinement feedback (5-7 iterations possible)
4. ✓ Changes are applied to files
5. ✓ Build succeeds with 0 errors (warnings acceptable)
6. ✓ All build contract selectors are preserved
7. ✓ All missing assets are flagged and documented
8. ✓ Changes are committed to git with descriptive message
9. ✓ Changes are pushed to remote (with user approval)
10. ✓ All artifacts (brief, report, summary) are saved to `docs/design-applied/`

---

## 12. Testing & Verification Strategy

### Unit Tests
- CSS variable parsing: Extract variables from current style.css
- HTML selector validation: Confirm all build contract selectors are present after changes
- Asset detection: Identify missing assets correctly

### Integration Tests
- End-to-end flow: Screenshot → Design Brief → Proposal → Approval → Build → Commit
- Iteration loop: Proposal → Refinement → Re-proposal → Approval
- Build validation: Changes don't break the build system

### User Testing
- Test with real design inputs (screenshot, HTML site, Figma)
- Verify proposals are clear and actionable
- Test refinement feedback handling
- Verify commit messages are descriptive

---

## 13. Future Enhancements

Out of scope for initial release, but noted for future work:

- **Asset sourcing automation**: Fetch images from Unsplash, icons from Icon8, fonts from Google Fonts based on design intent
- **Responsive breakpoint adaptation**: Automatically generate mobile/tablet variants of the design
- **A/B preview**: Show before/after visual comparison (requires live preview server)
- **Design tokens export**: Generate a reusable design token file (JSON/CSS) for future projects
- **Accessibility audit**: Check contrast ratios and semantic HTML compliance against WCAG

---

## Appendix A: Example Workflow

**User:** "I have a Figma design I want to implement"

**Step 1:** User invokes skill with Figma link
```
/design-apply https://www.figma.com/file/xxx/My-Design
```

**Step 2:** Agent extracts design:
- Fetches Figma preview
- Parses visual properties (colors, fonts, spacing)
- Extracts design tokens from Figma metadata
- Generates Design Brief, saves to `docs/design-applied/2026-07-19-design-brief.md`

**Step 3:** Agent generates proposal:
- Compares Figma design to current Vanilla Gorilla structure
- Maps CSS variable updates (9 color/font/spacing changes)
- Identifies missing assets (logo, hero image)
- Shows proposal to user

**Step 4:** User refines:
- "Make the primary color more saturated"
- Agent re-analyzes Figma in context of feedback
- Re-proposes with updated color value

**Step 5:** User approves:
- "Good, let's go with this"

**Step 6:** Agent applies changes:
- Updates CSS variables
- Modifies templates as needed
- Runs `npm run build`
- Generates verification report

**Step 7:** User reviews report:
- Sees 6 files changed, build successful
- Notes 2 missing assets (logo, hero image)
- Approves proceeding

**Step 8:** Agent commits:
- Commits with message "design: apply Modern Minimalist (Figma) theme to Vanilla Gorilla"

**Step 9:** Agent pushes:
- Pushes to origin/main (with user confirmation)

**Step 10:** Done:
- All artifacts saved to `docs/design-applied/`
- User receives summary of next steps (source missing assets, test)

