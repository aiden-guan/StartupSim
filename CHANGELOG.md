# Changelog

Notable project changes are recorded here. Entries describe repository work and are not software release announcements unless a version is explicitly tagged.

---

## [Unreleased] — 2026-10-07

### Summary

Rework the repository landing page into a visual, code-grounded introduction to Compounding and document this presentation pass.

### Architectural & Functional Highlights

| Area | Improvement | Reader benefit |
| --- | --- | --- |
| **README** | Pair real game captures with a gameplay overview, controls, and architecture map. | Visitors can see the game and understand its core loop before installing it. |
| **Engineering notes** | Explain derived office visuals, ordered IndexedDB autosaves, and shared market-preview rules. | Technical claims point to the systems that implement them. |

### Detailed Changes

#### Added

- **Changelog**: Start a structured, dated record of repository presentation updates.

#### Changed / Refactored

- **README**: Replace the short overview with a product walkthrough, paired captures, source-linked system map, setup steps, configuration notes, and a curated repository guide.

#### Documentation & Presentation

- **Project status**: Disclose that the browser-build link was not verified in this pass, remote leaderboard storage requires server configuration, and no reuse license is present.

### Verification Proof

- `validate_readme.py README.md --strict` passed with zero errors and warnings.
- `npm test` passed: 53 test files and 364 tests.
- `npm run build` passed TypeScript checking and Vite bundling. Vite emitted its large-chunk advisory; the test run emitted the Three.js CommonJS deprecation notice.
- `git diff --check` passed.
