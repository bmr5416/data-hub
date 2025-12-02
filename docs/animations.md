# Comprehensive Responsive UX Animation System
1. Interaction Feedback Layer (Hover, Focus, Active States)
Hover States

Timing: 150–200ms for enter, 100–150ms for leave (asymmetric feels more responsive)
Easing: cubic-bezier(0.4, 0, 0.2, 1) (Material Design standard) or cubic-bezier(0.22, 1, 0.36, 1) (snappier, more modern)
Properties to animate: transform, opacity, box-shadow, background-color (GPU-accelerated where possible)
Anti-patterns to avoid: Animating width, height, top, left (triggers layout thrashing)
Subtle enhancements: Slight translateY(-2px) lift, soft shadow expansion, background luminosity shift

Focus States

Visible focus rings with outline-offset animation (2px → 4px)
Never remove focus indicators—transform them aesthetically
Use :focus-visible to distinguish keyboard from mouse focus

Active/Pressed States

Immediate response: transform: scale(0.97) with 50ms duration
Subtle depression shadow inversion


2. Page Transition Choreography
Exit Sequence (Pre-Navigation)
1. Disable pointer events immediately (prevent double-clicks)
2. Staggered fade-out of content elements (20–40ms stagger, 150ms duration each)
   - Use `opacity: 0` + `transform: translateY(-8px)` 
   - Reverse DOM order or center-out pattern
3. Once content is visually cleared, trigger navigation/loading state
Loading/Transition Interstitial
1. Skeleton screens > spinners (maintain spatial layout)
2. Shimmer animation: `background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`
   animated via `background-position` at 1.5s infinite
3. Progress indicators for known-duration operations
4. Optimistic UI: Show expected result immediately, reconcile on response
Enter Sequence (Post-Navigation)
1. Content enters with staggered fade-in (30–50ms stagger, 200–300ms duration)
   - `opacity: 0 → 1` + `transform: translateY(12px) → translateY(0)`
   - Easing: `cubic-bezier(0.0, 0.0, 0.2, 1)` (deceleration curve)
2. Above-the-fold content animates first
3. Intersection Observer triggers below-fold animations on scroll-into-view
4. Hero elements can use slightly longer durations (400–500ms) for emphasis

3. Seamless Transition Stitching
Critical Timing Relationships
Exit duration + Loading minimum ≤ Perceived wait threshold (~300ms)
Enter animation begins 0–50ms before loading indicator completes
Overlap creates "morph" effect rather than discrete states
Shared Element Transitions (FLIP Technique)
1. First: Record initial position/size of shared element
2. Last: Apply final state, record new position/size  
3. Invert: Apply transform to make element appear in original position
4. Play: Animate transform to identity (0,0) with spring/ease-out curve
View Transitions API (Progressive Enhancement)
css::view-transition-old(root) { animation: fade-out 200ms ease-out; }
::view-transition-new(root) { animation: fade-in 300ms ease-in; }
```

---

### 4. Loading State Taxonomy

| State | Pattern | Duration Threshold |
|-------|---------|-------------------|
| Instantaneous | No indicator | < 100ms |
| Brief | Subtle opacity pulse on trigger element | 100–300ms |
| Short | Skeleton screen, inline spinner | 300ms–1s |
| Medium | Progress bar, contextual messaging | 1–5s |
| Long | Percentage, time estimate, cancellation option | > 5s |

**Progressive Loading Waterfall**
```
1. Shell/chrome renders immediately (cached)
2. Critical content skeleton appears (< 50ms)
3. Above-fold data populates (staggered fade-in)
4. Below-fold content lazy-loads on intersection
5. Enhancement assets (images, embeds) load progressively with blur-up

5. Micro-Interaction Catalog
State Change Confirmations

Toggle switches: Thumb slides with slight overshoot (spring(1, 80, 10))
Checkboxes: SVG path draw animation (stroke-dashoffset)
Buttons: Ripple effect from click origin point

Data Mutations

Item added: Scale from 0.8 → 1 + fade in, push siblings with spring physics
Item removed: Collapse height with easing, fade out simultaneously
Item reordered: FLIP animation to new position (300ms)

Form Feedback

Validation errors: Shake animation (translateX keyframes: 0 → -6px → 6px → -3px → 3px → 0) at 400ms
Success: Brief green flash or checkmark draw-in
Field focus: Label float animation, border color transition


6. Animation Performance Contract
GPU-Accelerated Properties Only
css/* ALWAYS animate these */
transform, opacity, filter

/* NEVER animate these directly */
width, height, top, left, margin, padding, border-width
/* Instead, use transform: scale() or clip-path */
Optimization Directives
css.animated-element {
  will-change: transform, opacity; /* Hint compositor */
  contain: layout style paint; /* Isolation for repaint */
  transform: translateZ(0); /* Force GPU layer (use sparingly) */
}
Reduced Motion Compliance
css@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

7. Timing & Easing Reference
Use CaseDurationEasingHover feedback150msease-outMicro-interactions200mscubic-bezier(0.4, 0, 0.2, 1)Content fade-in250–300mscubic-bezier(0.0, 0, 0.2, 1)Page transitions300–400mscubic-bezier(0.4, 0, 0, 1)Emphasis/hero400–600mscubic-bezier(0.22, 1, 0.36, 1)Spring physicsVariablespring(mass, stiffness, damping)

8. Implementation Architecture
CSS Custom Properties for Consistency
css:root {
  --transition-fast: 150ms;
  --transition-base: 250ms;
  --transition-slow: 400ms;
  --ease-out: cubic-bezier(0.0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
}
React/Component Patterns

<AnimatePresence> wrapper for exit animations (Framer Motion)
useTransition for staggered list orchestration
useReducedMotion() hook for accessibility
Intersection Observer hook for scroll-triggered entrances