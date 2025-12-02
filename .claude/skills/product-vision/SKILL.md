---
name: product-vision
description: Product mission and maturity phases for Data Hub. Use when reviewing features, planning work, or evaluating UX against product goals.
---

# Product Vision Skill

Data Hub's mission, maturity phases, and gap identification framework.

## Mission Summary

> **"Bring clarity to chaos."**

Data Hub is the all-in-one marketing data platform—warehouse, ETL, BI, and delivery unified.

## What Data Hub IS

| Capability | Implementation |
|------------|----------------|
| **Data Warehouse** | Platform-specific tables with normalized schemas |
| **ETL** | CSV ingestion → transformation → blended data |
| **BI / Visualization** | KPI cards, charts via Recharts |
| **Report Delivery** | Scheduled PDF/CSV via email |
| **Alerting** | Threshold, trend, freshness monitoring |
| **Lineage** | Source → warehouse → report tracking |

## Mission Pillars

| Pillar | Description | Measures |
|--------|-------------|----------|
| **Clarity** | Every data flow is documented and traceable | Lineage answers in <30s |
| **Automation** | Reduce manual reporting overhead | Scheduled delivery, alerts |
| **Accessibility** | Non-technical users can navigate | Wizards, visual UI |
| **Delight** | Operational work should have personality | Win98 theme, PSX sprites |

## Current Phase

```
[x] Phase 0: MVP (Current)
[ ] Phase 1: MMP (Minimum Marketable Product) ← TARGET
[ ] Phase 2: MLP (Minimum Lovable Product)
[ ] Phase 3: MAP (Minimum Awesome Product)
```

## Gap Categories

| Type | Description |
|------|-------------|
| **Feature** | Missing functionality expected at phase |
| **Polish** | Rough UX edges that undermine mission |
| **Consistency** | Deviates from established patterns |
| **Delight** | Missed opportunity for personality |

## Skill Files

| File | Purpose |
|------|---------|
| [MISSION.md](./MISSION.md) | Full mission statement, pillars, personas |
| [MATURITY-PHASES.md](./MATURITY-PHASES.md) | Phase definitions and checklists |
| [GAP-CATEGORIES.md](./GAP-CATEGORIES.md) | Gap types and severity criteria |

## Quick Reference

### Phase 1 (MMP) Key Requirements

- [ ] Onboarding flow for new users
- [ ] SMTP configuration UI
- [ ] Consistent modal/form UX
- [ ] Error messages with recovery actions
- [ ] Loading skeletons

### North Star Metric

> Any team member can answer: "If [source X] breaks, what reports fail?" in under 30 seconds.

## Usage

This skill informs the `product-vision-reviewer` agent and should be referenced when:
- Planning new features
- Reviewing pull requests for UX impact
- Prioritizing bug fixes vs. enhancements
- Evaluating readiness for next maturity phase
