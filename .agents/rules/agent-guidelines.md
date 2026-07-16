# Agent Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

## 1. Think Before Coding
* State your assumptions explicitly. If uncertain, ask.
* If multiple interpretations exist, present them - don't pick silently.
* If a simpler approach exists, say so. Push back when warranted.
* If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First
* Minimum code that solves the problem. Nothing speculative.
* No features beyond what was asked.
* No abstractions for single-use code.
* No "flexibility" or "configurability" that wasn't requested.

## 3. Surgical Changes
* Touch only what you must. Clean up only your own mess.
* Match existing style, even if you'd do it differently.
* Remove imports/variables/functions that YOUR changes made unused.

## 4. Goal-Driven Execution
* Transform tasks into verifiable goals.
* Run `npm run build` to verify compilation before finishing.
* Test depth-adjusted relative links.

## 5. Fail Loud Rule
* Do not default to "completed" if uncertainty exists.
* List exactly which edge cases have been verified.
