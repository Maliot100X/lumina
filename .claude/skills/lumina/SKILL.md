```markdown
# lumina Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill introduces you to the core development patterns of the **lumina** repository, a TypeScript-based Next.js project focused on delivering premium, interactive 3D hero visuals. You'll learn the project's coding conventions, how to contribute new or enhanced 3D features, and the typical workflows used by contributors.

## Coding Conventions

### File Naming
- Use **PascalCase** for all file names, especially for components.
  - Example: `FloatingOrb.tsx`, `LuminaVideoFrame.tsx`

### Import Style
- Use **absolute imports** for referencing modules.
  - Example:
    ```typescript
    import FloatingOrb from 'components/canvas/FloatingOrb';
    ```

### Export Style
- Use **default exports** for modules and components.
  - Example:
    ```typescript
    const FloatingOrb = () => { /* ... */ };
    export default FloatingOrb;
    ```

### Commit Messages
- Follow the **conventional commit** format.
- Use the `feat` prefix for new features.
  - Example:
    ```
    feat: add animated floating orb to hero section for enhanced visuals
    ```

## Workflows

### Add or Enhance 3D Hero Visuals
**Trigger:** When you want to introduce or improve 3D visuals (such as orbs, video frames, or backgrounds) in the hero section.  
**Command:** `/add-3d-hero-visual`

1. **Edit or enhance the main hero section:**
   - Modify `app/page.tsx` to integrate new or updated 3D visual components.
   - Example:
     ```tsx
     import FloatingOrb from 'components/canvas/FloatingOrb';

     export default function HeroPage() {
       return (
         <section>
           <FloatingOrb />
           {/* Other hero content */}
         </section>
       );
     }
     ```
2. **Create or modify 3D components:**
   - Work within `components/canvas/`, such as `FloatingOrb.tsx`, `Stars.tsx`, or `LuminaVideoFrame.tsx`.
   - Example:
     ```tsx
     // components/canvas/FloatingOrb.tsx
     const FloatingOrb = () => {
       // 3D rendering logic here
       return <mesh>{/* ... */}</mesh>;
     };
     export default FloatingOrb;
     ```
3. **Update dependencies if needed:**
   - If your 3D feature requires new libraries, update `package.json` and `package-lock.json`.
   - Example:
     ```json
     {
       "dependencies": {
         "three": "^0.150.0"
       }
     }
     ```
4. **Test the hero section:**
   - Ensure new visuals render and interact correctly in the browser.
   - Manually verify or add/update test files as appropriate.

## Testing Patterns

- **Test File Naming:** Use the pattern `*.test.*` (e.g., `FloatingOrb.test.tsx`).
- **Testing Framework:** Not explicitly detected; check the repository for specifics.
- **Example Test File:**
  ```typescript
  // components/canvas/FloatingOrb.test.tsx
  import { render } from '@testing-library/react';
  import FloatingOrb from './FloatingOrb';

  test('renders FloatingOrb without crashing', () => {
    render(<FloatingOrb />);
  });
  ```

## Commands

| Command              | Purpose                                                      |
|----------------------|--------------------------------------------------------------|
| /add-3d-hero-visual  | Add or enhance interactive 3D visuals in the hero section    |
```
