---
name: add-or-enhance-3d-hero-visuals
description: Workflow command scaffold for add-or-enhance-3d-hero-visuals in lumina.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /add-or-enhance-3d-hero-visuals

Use this workflow when working on **add-or-enhance-3d-hero-visuals** in `lumina`.

## Goal

Add or update interactive 3D elements in the hero section for a premium visual experience.

## Common Files

- `app/page.tsx`
- `components/canvas/*.tsx`
- `package.json`
- `package-lock.json`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit or enhance app/page.tsx to integrate new or updated 3D visual components.
- Create or modify components in components/canvas/ (e.g., FloatingOrb.tsx, Stars.tsx, LuminaVideoFrame.tsx) to implement the 3D feature.
- Update package.json and package-lock.json if new dependencies are required for 3D rendering or animation.
- Test the hero section to ensure new visuals render and interact correctly.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.