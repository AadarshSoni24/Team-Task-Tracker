---
name: figma-ui-craft
description: Unified Linear-grade UI craft skill combining anti-slop visual design, component architecture, design tokens, typography, and interaction standards for Figma Make and modern web interfaces.
---

# Figma UI Craft: Linear-Grade Task Tracker Design System

This skill is a unified, battle-tested design and frontend specification distilled from `taste-skill`, `ui-craft`, `better-ui`, `better-typography`, `better-colors`, `better-layout`, and `emil-design-eng`. 

Use this skill whenever designing screens, drafting component briefs, or prompting UI in Figma Make and frontend applications for the Team Task Tracker.

---

## 1. Visual Taste & Anti-Slop Principles

* **Strictly Eliminate AI Clichés**:
  * ❌ NO arbitrary purple/pink floating gradient blobs.
  * ❌ NO heavy, blurry drop-shadows on flat white backgrounds.
  * ❌ NO massive rounded corners (`rounded-3xl` on simple cards).
  * ❌ NO low-contrast light grey text on white backgrounds.
* **Embrace Linear-Style Craft**:
  * Solid, deliberate surfaces with **1px crisp borders** (`border-border`).
  * Optical hierarchy created through **font-weight and color opacity**, not exaggerated font sizes.
  * Micro-elevation: Subtle layered shadows (`0 1px 2px rgba(0, 0, 0, 0.05)` or subtle inner highlight).
  * High information density with generous, disciplined whitespace (compact, purposeful table rows and cards).

---

## 2. Color Palette & Semantic Design Tokens

### Dark Mode (Primary Recommendation for Linear Style)
* **Canvas / Background**: `#090A0F` (Deep Neutral Zinc)
* **Surface / Card Background**: `#12131A` (Layer 1)
* **Surface Elevated / Popover**: `#181924` (Layer 2)
* **Border Subdued**: `rgba(255, 255, 255, 0.08)` (1px hairline)
* **Border Focus / Active**: `rgba(255, 255, 255, 0.22)`
* **Text Primary**: `#F4F4F6` (High contrast, readable)
* **Text Muted / Timestamps**: `#8C8D99` (Neutral secondary)
* **Text Subdued / Placeholders**: `#565761`

### Light Mode (Clean Executive Palette)
* **Canvas / Background**: `#F8FAFC`
* **Surface / Card Background**: `#FFFFFF`
* **Border Subdued**: `#E2E8F0`
* **Text Primary**: `#0F172A`
* **Text Muted**: `#64748B`

### Status Tokens (Exact Semantic Badges)
| Status | Background | Text Color | Dot / Icon Indicator |
|---|---|---|---|
| **Pending** | `rgba(245, 158, 11, 0.12)` (Warm Amber) | `#F59E0B` | Solid Amber Dot |
| **In Progress** | `rgba(59, 130, 246, 0.12)` (Electric Blue) | `#3B82F6` | Half-filled Circle |
| **Done** | `rgba(16, 185, 129, 0.12)` (Emerald Green) | `#10B981` | Checkmark in Circle |

### Role Badges
* **Admin**: `bg-purple-500/10 text-purple-400 border border-purple-500/20`
* **Member**: `bg-zinc-500/10 text-zinc-400 border border-zinc-500/20`

---

## 3. Typography & Hierarchy (Geist / Inter Pairing)

* **Font Family**: `Inter`, `Geist Sans`, or system `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`.
* **Scale**:
  * **Page Title**: `20px` / `line-height 28px` / `font-weight 600`
  * **Section Header / Modal Title**: `16px` / `line-height 24px` / `font-weight 600`
  * **Body Text / Task Titles**: `14px` / `line-height 20px` / `font-weight 500`
  * **Metadata / Timestamps / Labels**: `12px` / `line-height 16px` / `font-weight 400`
  * **Badges / Status Pills**: `11px` / `font-weight 600` / `uppercase tracking-wider`
* **Rules**:
  * Do not make headers larger than 24px on desktop dashboard layouts.
  * Always use tabular figures (`font-variant-numeric: tabular-nums`) for timestamps, dates, and counts.

---

## 4. Layout Architecture (3-Zone Productivity Layout)

```
+-----------------------------------------------------------------------------------------+
|                                    Top Navigation Bar                                    |
| [Logo: TaskTracker]     [Team Switcher: Core Product v]     [+ Invite]   [User Profile]  |
+-------------------+---------------------------------------------+-----------------------+
|   Sidebar (240px) |            Main Workspace Stage             |  Timeline / Drawer    |
|                   |                                             |  (360px collapsible)  |
| - All Teams       |  Header: Team Name + Members Avatar Stack   |                       |
| - Core Product    |  Filter Pills: [All] [Pending] [In Prog] [v]|  Activity Feed        |
| - DevOps Squad    |  [+ New Task Button]                        |  (Newest First)       |
|                   |                                             |                       |
| Filters:          |  +---------------------------------------+  |  - Riya commented on  |
| - My Tasks        |  | Task Item 1  [Pending]   [Assignee]  |  |    "Design API..."    |
| - In Progress     |  | Task Item 2  [In Prog]   [Assignee]  |  |    5m ago             |
| - Completed       |  | Task Item 3  [Done]      [Assignee]  |  |                       |
|                   |  +---------------------------------------+  |  - Sam changed status |
|                   |                                             |    12m ago            |
+-------------------+---------------------------------------------+-----------------------+
```

### Component Breakdown
1. **Team View & Status Filter**:
   * Header displays team name, description, and avatar group stack with an `+ Invite Member` button.
   * Filter Tabs: `All (5)`, `Pending (1)`, `In Progress (2)`, `Done (2)`.
   * Task List Rows: 1px hairline divider, hover state (`bg-white/[0.02]`), title in `font-medium`, status pill, assignee avatar, and updated timestamp.
2. **Task Detail (Linear Slide-Over Drawer)**:
   * Opens smoothly from the right (380px–440px width) when clicking a task.
   * Top bar: Close button (`Esc`), task ID (`#6ae6...`), and status dropdown.
   * Editable Title and Description input.
   * Meta sidebar/row: Assignee dropdown, Created Date, Team.
   * **Discussion Thread**:
     * Comments list ordered **oldest to newest**.
     * Actor avatar, name, timestamp (`relative: "10m ago"`), and comment text.
     * Bottom sticky comment bar: Text input + `Send (Cmd+Enter)`.
3. **Activity Timeline Feed**:
   * Vertical connected hairline rule with circular node icons.
   * Actions styled distinctly:
     * `task_created`: Plus icon / blue tint.
     * `status_changed`: Arrow icon / amber or green tint.
     * `commented`: Chat bubble icon / zinc tint.
     * `member_added`: User plus icon / purple tint.
   * Real-time polling indicator: Subtle pulse dot showing live sync every 5 seconds.

---

## 5. Micro-Interactions & State Specifications

* **Buttons**:
  * Default: `px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150`
  * Primary: High-contrast white text on dark surface (`bg-white text-black hover:bg-zinc-200 active:scale-[0.98]`).
  * Ghost / Secondary: `bg-transparent hover:bg-white/5 border border-white/10 active:scale-[0.98]`.
* **Inputs & Modals**:
  * Background: Slightly recessed `bg-black/40` with `1px border-white/10`.
  * Focus: `ring-1 ring-white/20 border-white/20 outline-none`.
  * Transitions: Fast and snappy `150ms-200ms cubic-bezier(0.16, 1, 0.3, 1)`.

---

## 6. How to Prompt Figma Make with This Skill

When prompting Figma Make or any AI UI builder, include this instruction block:

> "Design a dark-themed, Linear-style Team Task Tracker web application dashboard matching the `figma-ui-craft` design system:
> 1. Use deep slate/zinc backgrounds (`#090A0F` canvas, `#12131A` cards, 1px `#ffffff14` borders, no gradients or heavy drop-shadows).
> 2. Layout: Collapsible left sidebar for Teams & Navigation, center stage for Tasks with status filter pills (`All`, `Pending`, `In Progress`, `Done`), and right slide-over drawer for Task Detail + Discussion comments.
> 3. Dedicated Activity Timeline component displaying chronological events (e.g. 'Riya Sharma changed status to In Progress') ordered newest first with vertical connection nodes.
> 4. Exact API data binding matches `docs/API.md` with JWT auth state, status badges, and team member avatars."

