# Gap Categories

Framework for identifying and categorizing product gaps against mission pillars.

---

## Gap Types

### 1. Feature Gap

> **Missing functionality that users expect at the current maturity phase.**

| Severity | Definition |
|----------|------------|
| **Critical** | Blocks core workflow; user cannot complete task |
| **Important** | Workaround exists but painful; user friction |
| **Nice-to-Have** | Would improve experience but not blocking |

#### Examples

| Gap | Severity | Pillar Impact | Remediation |
|-----|----------|---------------|-------------|
| No onboarding flow | Critical | Accessibility | Build guided first-run experience |
| No global search | Important | Clarity | Add search across all entities |
| No client templates | Nice-to-Have | Automation | Add clone/template system |
| No visual lineage graph | Important | Clarity | Implement D3.js dependency visualization |
| No SMTP config UI | Critical | Automation | Build admin settings panel |

#### Detection Patterns

```
Look for:
- "TODO: implement" comments
- Empty pages with no content
- Features mentioned in CLAUDE.md but not in codebase
- Routes defined but components missing
- API endpoints without UI
```

---

### 2. Polish Gap

> **UX rough edges that undermine the mission pillars, even if functionality works.**

| Severity | Definition |
|----------|------------|
| **Critical** | Users get stuck; unclear what went wrong |
| **Important** | Confusing but user can proceed |
| **Nice-to-Have** | Minor annoyance; doesn't block |

#### Examples

| Gap | Severity | Pillar Impact | Remediation |
|-----|----------|---------------|-------------|
| Error shows "undefined" | Critical | Accessibility | Add human-readable error messages |
| No loading skeleton | Important | Delight | Replace spinner with content skeleton |
| Button has no hover state | Nice-to-Have | Delight | Add `:hover` styles |
| Form validation only on submit | Important | Accessibility | Add inline validation |
| No confirmation before delete | Critical | Accessibility | Add confirmation dialog |
| Success action has no feedback | Important | Delight | Add toast/notification |

#### Detection Patterns

```
Look for:
- catch blocks with generic error messages
- Loading states that are just spinners
- Buttons without :hover/:active states
- Forms without validation feedback
- Destructive actions without confirmation
- Async operations without success feedback
```

---

### 3. Consistency Gap

> **Deviations from established patterns that create cognitive load.**

| Severity | Definition |
|----------|------------|
| **Critical** | Same action behaves differently in different places |
| **Important** | UI looks different but behaves same |
| **Nice-to-Have** | Minor visual inconsistency |

#### Examples

| Gap | Severity | Pillar Impact | Remediation |
|-----|----------|---------------|-------------|
| Modal closes differently | Critical | Accessibility | Standardize: click outside + Esc + X |
| Form spacing varies | Important | Delight | Apply form spacing hierarchy |
| Button styles inconsistent | Important | Delight | Use Button component everywhere |
| Table pagination differs | Important | Accessibility | Use DataTable component |
| Wizard navigation varies | Critical | Accessibility | Use Wizard component pattern |

#### Detection Patterns

```
Look for:
- Inline styles instead of CSS modules
- Hardcoded values instead of tokens
- Direct DOM manipulation
- Components not using common/ components
- Different modal implementations
- Varying form field patterns
```

#### Win98 Dungeon Consistency Checks

```css
/* Every component should have: */
border-radius: 0;                    /* NEVER rounded */
border: 2px solid;                   /* ALWAYS 2px */
border-color: var(--win98-*-border); /* Semantic tokens */
font-family: var(--font-*);          /* Token fonts */
```

---

### 4. Delight Gap

> **Missed opportunities to inject personality and make the experience enjoyable.**

| Severity | Definition |
|----------|------------|
| **Critical** | N/A (delight is never blocking) |
| **Important** | Major missed opportunity for character |
| **Nice-to-Have** | Small opportunity to add charm |

#### Examples

| Gap | Severity | Pillar Impact | Location | Remediation |
|-----|----------|---------------|----------|-------------|
| Generic loading message | Important | Delight | LoadingAnimation | Add fun mode messages |
| No Imp tip on page | Nice-to-Have | Delight | Any page | Add contextual tip |
| No PSX sprite for status | Nice-to-Have | Delight | StatusBadge | Use hearts/tubes |
| Boring empty state | Important | Delight | List views | Add character + guidance |
| No sound effects | Nice-to-Have | Delight | Actions | Add optional audio |
| Standard scrollbar | Nice-to-Have | Delight | Global | Style Win98 scrollbar |

#### Detection Patterns

```
Look for:
- Pages without Imp tips
- Status displays without PSX sprites
- Generic text that could have personality
- Loading states without fun messages
- Empty states with just "No items"
- Success states without celebration
```

---

## Severity Matrix

Cross-reference gap type with user impact:

| Impact | Feature | Polish | Consistency | Delight |
|--------|---------|--------|-------------|---------|
| **Blocks task** | Critical | Critical | Critical | — |
| **Friction/confusion** | Important | Important | Important | — |
| **Annoyance** | Nice-to-Have | Nice-to-Have | Nice-to-Have | Important |
| **Missed charm** | — | — | — | Nice-to-Have |

---

## Pillar Impact Mapping

Each gap affects one or more mission pillars:

| Gap Type | Clarity | Automation | Accessibility | Delight |
|----------|---------|------------|---------------|---------|
| Feature - Search | ★★★ | ★ | ★★ | ★ |
| Feature - Templates | ★ | ★★★ | ★★ | ★ |
| Feature - Lineage Graph | ★★★ | ★ | ★★★ | ★★ |
| Polish - Error Messages | ★★ | ★ | ★★★ | ★ |
| Polish - Loading States | ★ | ★ | ★★ | ★★★ |
| Consistency - Patterns | ★★ | ★ | ★★★ | ★★ |
| Delight - Imp Tips | ★ | ★ | ★★ | ★★★ |
| Delight - PSX Sprites | ★ | ★ | ★ | ★★★ |

---

## Prioritization Framework

### Priority Score Formula

```
Priority = (Severity × 3) + (Pillar Impact × 2) + (Effort Inverse × 1)

Where:
- Severity: Critical=3, Important=2, Nice-to-Have=1
- Pillar Impact: # of pillars affected (1-4)
- Effort Inverse: Quick=3, Medium=2, Large=1
```

### Example Prioritization

| Gap | Severity | Pillars | Effort | Score | Priority |
|-----|----------|---------|--------|-------|----------|
| Error messages | Critical (3) | 2 | Quick (3) | 16 | P0 |
| Onboarding flow | Critical (3) | 3 | Large (1) | 16 | P0 |
| Loading skeletons | Important (2) | 2 | Quick (3) | 13 | P1 |
| Global search | Important (2) | 2 | Medium (2) | 12 | P1 |
| PSX sprites consistency | Nice-to-Have (1) | 1 | Quick (3) | 8 | P2 |

---

## Gap Report Template

When documenting gaps, use this format:

```markdown
## Gap: [Short Description]

**Type:** Feature | Polish | Consistency | Delight
**Severity:** Critical | Important | Nice-to-Have
**Pillar Impact:** Clarity / Automation / Accessibility / Delight
**Phase:** 1 (MMP) | 2 (MLP) | 3 (MAP)

### Current State
[What exists now]

### Expected State
[What should exist per mission]

### User Impact
[How this affects the agency data strategy manager]

### Location
- File: `path/to/file.jsx:123`
- Component: ComponentName

### Remediation
[Specific fix recommendation]

### Effort
Quick (<1 day) | Medium (1-3 days) | Large (3+ days)
```

---

## Quick Reference: Common Gaps by Component

### Modals
- [ ] Close on Escape key
- [ ] Close on backdrop click
- [ ] Focus trap inside modal
- [ ] Loading state while processing
- [ ] Error state with recovery

### Forms
- [ ] Inline validation
- [ ] Character count for text fields
- [ ] Form spacing hierarchy (24px/16px/8px)
- [ ] Submit button loading state
- [ ] Success feedback

### Lists/Tables
- [ ] Empty state with guidance
- [ ] Loading skeleton
- [ ] Pagination or infinite scroll
- [ ] Sort indicators
- [ ] Search/filter capability

### Wizards
- [ ] Progress indicator
- [ ] Back navigation
- [ ] State persistence
- [ ] Validation before next
- [ ] Cancel confirmation

### Buttons
- [ ] :hover state
- [ ] :active (pressed) state
- [ ] :disabled state
- [ ] Loading spinner
- [ ] Icon + text alignment
