---
name: safe-deploy
description: Manages the build, verification, and deployment process for GitHub Pages.
---

# Skill: Safe Deploy

Use this skill when the user requests a deployment or when you are ready to push changes to the repository. This serves as the DevOps validation layer before updates are pushed to the live website.

## Workflow

1.  **Run Compilation**: Run `npm run build` to verify there are no syntax, markdown, or pathing errors in the compilation console.
2.  **Verify Outputs**:
    - Ensure `dist/` contains all the generated directories and index.html files.
    - Check that style minification was completed without errors.
    - Verify that no Live Server scripts were leaked.
3.  **Run Invalidation (If Applicable)**:
    - If the user uses a CloudFront CDN in front of GitHub Pages or S3, run `npm run invalidate -- dryrun all` to preview invalidations before creating them.
4.  **Git Sequence**:
    - Run `git status` to verify modified files.
    - Run `git add .`
    - Run `git commit -m "<type>: <description>"` (Use conventional commit messages e.g., `feat:`, `fix:`, `chore:`, `docs:`).
    - Run `git push origin main`.
5.  **Post-Push Notification**: Notify the user that GitHub Actions is now deploying the static artifacts, and the updates will be visible on GitHub Pages within a couple of minutes.
