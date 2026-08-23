# CanvasKit — Design System & UX Specification

**Version:** 0.1.0  
**Status:** Design Direction  
**Product:** CanvasKit  
**Design Goal:** Create a premium, developer-focused visual editor experience that feels precise, calm, fast, and production-grade.

---

## 1. Design Vision

CanvasKit should feel like a combination of:

- a professional developer tool
- a modern design application
- a high-performance graph editor
- an elegant desktop application

The interface must stay visually quiet while the canvas remains the dominant workspace.

### Core design principle

> **The UI should disappear when the user is working.**

The canvas is the product. Toolbars, panels, menus, and controls should support the canvas rather than compete with it.

---

# 2. Visual Personality

CanvasKit should communicate:

- Technical
- Precise
- Minimal
- Premium
- Modern
- Developer-oriented
- Highly responsive
- Trustworthy

Avoid:

- Excessive gradients
- Heavy glassmorphism
- Large decorative illustrations
- Overly rounded SaaS cards
- Excessive shadows
- Bright saturated UI colors
- Visual noise

The aesthetic should be closer to a **professional developer application** than a marketing SaaS dashboard.

---

# 3. Color System

Use a neutral-first palette. Color should communicate state and hierarchy rather than decoration.

## 3.1 Light Theme

```text
Background        #F7F8FA
Canvas             #FFFFFF
Surface            #FFFFFF
Surface Muted      #F1F3F5
Border             #E2E5E9
Border Strong      #C9CED6
Text Primary       #17191D
Text Secondary     #5F6672
Text Muted         #8A919D
Accent             #5B5CE2
Accent Hover       #4D4ECC
Focus              #7C7FF0
Success            #16A34A
Warning            #D97706
Danger             #DC2626
Info               #2563EB
```

## 3.2 Dark Theme

Dark mode should be the primary visual showcase because the product targets developers.

```text
Background        #0B0D10
Canvas             #101318
Surface            #151922
Surface Elevated   #1B202A
Border             #292F39
Border Strong      #3A414D
Text Primary       #F4F6F8
Text Secondary     #A8AFBA
Text Muted         #737B88
Accent             #7C7FF2
Accent Hover       #9294FF
Focus              #9B9DFF
Success            #34D399
Warning            #FBBF24
Danger             #F87171
Info               #60A5FA
```

## 3.3 Semantic Color Rules

- Accent: active tool, selected controls, primary actions.
- Success: successful operations and connection states.
- Warning: potentially destructive or attention-required states.
- Danger: deletion and destructive actions.
- Info: contextual information.

Never use semantic colors as decoration.

---

# 4. Typography

Use a highly readable modern sans-serif for the application UI.

Recommended:

- Inter
- Geist Sans
- system-ui fallback

For code, node metadata, JSON, coordinates, and technical values:

- Geist Mono
- JetBrains Mono
- ui-monospace fallback

## Type Scale

```text
Display       28px / 34px / 700
Heading       20px / 28px / 650
Subheading    16px / 24px / 600
Body          14px / 20px / 400
Small         13px / 18px / 400
Caption       12px / 16px / 400
Code          12px / 18px / 400
```

The editor should primarily use 12–14px text.

---

# 5. Spacing System

Use a 4px base grid.

```text
4   — xs
8   — sm
12  — md
16  — lg
20  — xl
24  — 2xl
32  — 3xl
40  — 4xl
48  — 5xl
64  — 6xl
```

Default component spacing should use 8px and 12px increments.

---

# 6. Radius System

CanvasKit should use moderate radii rather than extreme rounded corners.

```text
2px   — tiny controls
4px   — inputs / small surfaces
6px   — buttons / menu items
8px   — panels / cards
10px  — floating panels
12px  — dialogs
```

The canvas itself should not visually look like a rounded card.

---

# 7. Elevation

Use subtle elevation.

```text
Level 0 — canvas
Level 1 — toolbar / panels
Level 2 — dropdowns / popovers
Level 3 — dialogs / command palette
Level 4 — temporary overlays
```

Avoid large blurred shadows. Borders should provide most of the separation.

---

# 8. Application Layout

The primary editor layout should follow this structure:

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Bar                                                     │
├───────┬─────────────────────────────────────────────┬───────┤
│       │                                             │       │
│ Tool  │                                             │ Insp. │
│ Rail  │                  CANVAS                     │ Panel │
│       │                                             │       │
│       │                                             │       │
├───────┴─────────────────────────────────────────────┴───────┤
│ Status Bar / Canvas Information                             │
└─────────────────────────────────────────────────────────────┘
```

The canvas must always receive the majority of available space.

---

# 9. Top Bar

The top bar should be compact.

### Left

- CanvasKit logo
- Current document name
- Unsaved indicator

### Center

Optional contextual information:

- Zoom level
- Selection information
- Collaboration state in future versions

### Right

- Undo
- Redo
- Share/export
- Settings
- User menu

Recommended height: **48px**.

---

# 10. Left Tool Rail

The left toolbar is the primary tool switcher.

Recommended width: **52px**.

Tools:

```text
Select
Hand / Pan
Frame
Rectangle
Circle
Text
Pen
Arrow
Connector
Comment (future)
```

Each tool should have:

- 36px hit area
- Tooltip
- Active state
- Keyboard shortcut
- Disabled state

Use icons rather than text labels.

---

# 11. Right Inspector Panel

The inspector is contextual.

When nothing is selected:

```text
Canvas
────────────────
Background
Grid
Snap
Zoom
Viewport
```

When a node is selected:

```text
Rectangle
────────────────
Position
X     120
Y     240

Size
W     180
H      80

Appearance
Fill
Border
Radius
Opacity

Transform
Rotation
```

When multiple nodes are selected, only shared properties should be displayed.

Panel width:

```text
280px – 340px
```

---

# 12. Bottom Status Bar

The status bar should be subtle and information-dense.

Example:

```text
Ready     125 nodes     12 edges          100%     x: 240 y: 180
```

Possible future information:

- Rendering FPS
- Selected object count
- Collaboration status
- Sync status

Performance metrics should be hidden by default and available in a developer/debug mode.

---

# 13. Canvas

The canvas is the most important visual surface.

### Background

Use a very subtle neutral background.

Dark theme:

```text
#101318
```

Light theme:

```text
#F7F8FA
```

### Grid

The grid should be extremely subtle.

Support:

- Dot grid
- Line grid
- No grid

Recommended default: dot grid.

Grid opacity should remain low enough that it does not compete with nodes.

---

# 14. Infinite Canvas Navigation

Navigation must feel immediate and fluid.

### Mouse

- Wheel → zoom
- Middle mouse drag → pan
- Space + drag → pan
- Wheel + modifier → optional alternate zoom behavior

### Trackpad

- Pinch → zoom
- Two-finger movement → pan

### Keyboard

```text
Space + Drag     Pan
+ / -            Zoom
0                Reset zoom
1                Fit selection
2                Fit canvas
```

Zoom should preserve the point under the cursor whenever possible.

---

# 15. Node Design

Nodes should be visually simple and highly customizable.

Example:

```text
┌──────────────────────────────┐
│ Database                     │
├──────────────────────────────┤
│                              │
│ PostgreSQL                   │
│                              │
│ 12 tables                    │
└──────────────────────────────┘
```

Default node styling:

- 1px border
- 8px radius
- Subtle background
- Minimal shadow
- Clear title hierarchy

Selected node:

- Accent border
- Subtle accent glow/outline
- Resize handles
- Optional rotation handle

Do not rely only on color to communicate selection.

---

# 16. Node Handles

Resize handles should be small but easy to target.

Recommended:

- Visual size: 6–8px
- Hit area: at least 16px

Corner handles:

```text
●──────────────●
│              │
│              │
│              │
●──────────────●
```

Rotation handle should appear above the node when rotation is supported.

---

# 17. Edge Design

Edges should remain visually secondary to nodes.

Default:

- 1.5px line
- Neutral stroke
- Clear arrowhead

Selected edge:

- Accent stroke
- Increased visual weight

Hover state:

- Slight stroke increase

Edge routing should be clean and avoid unnecessary intersections.

---

# 18. Selection System UX

Selection should feel extremely responsive.

### Single Selection

A selected object gets an accent outline.

### Multi-selection

Use one outer selection frame rather than many competing frames when appropriate.

### Rectangle Selection

Selection rectangle:

- Semi-transparent accent fill
- Thin accent border

It should never obscure the canvas.

---

# 19. Context Menu

Right-click should open a compact context menu.

Example:

```text
Cut
Copy
Paste
Duplicate
────────────
Group
Ungroup
────────────
Bring Forward
Send Backward
────────────
Delete
```

Menus should support keyboard navigation.

---

# 20. Command Palette

CanvasKit should have a command palette similar to professional developer tools.

Shortcut:

```text
⌘K / Ctrl+K
```

Example:

```text
┌─────────────────────────────────────────┐
│ Search commands...                      │
├─────────────────────────────────────────┤
│ Create Rectangle                  R      │
│ Create Text                      T       │
│ Zoom to Fit                     ⇧1       │
│ Toggle Grid                     G        │
│ Export                           E       │
│ Undo                             ⌘Z      │
└─────────────────────────────────────────┘
```

The command system should be extensible through plugins.

---

# 21. Floating Toolbar

When an object is selected, an optional contextual toolbar may appear near it.

Example:

```text
        ┌───────────────────────────┐
        │ B  I  Link  Align  •••   │
        └───────────────────────────┘
                  ↓
          ┌──────────────┐
          │    Node      │
          └──────────────┘
```

The toolbar should never block the selected object unnecessarily.

---

# 22. Minimap

The minimap should be positioned in the bottom-right corner.

Recommended size:

```text
180 × 120px
```

Style:

- Low contrast
- Small nodes
- Viewport rectangle
- Optional collapse button

The minimap should not distract from the primary canvas.

---

# 23. Grid & Snap Controls

Grid controls belong in the inspector or command palette rather than permanent UI.

Options:

```text
Grid
  ○ Off
  ○ Dots
  ○ Lines

Snap
  □ Snap to grid
  □ Snap to objects
  □ Snap to guides
```

---

# 24. Toasts and Notifications

Use toasts only for asynchronous or system-level feedback.

Examples:

- Export completed
- Project imported
- Unsupported file
- Auto-save completed

Toasts should appear in the bottom-right and disappear automatically.

Do not use toasts for ordinary editor interactions.

---

# 25. Dialogs

Dialogs should be rare.

Use for:

- Export configuration
- Import project
- Keyboard shortcut settings
- Application preferences
- Destructive confirmation

Dialog width:

```text
400–560px
```

Dialogs should trap focus and support Escape.

---

# 26. Empty State

The initial empty canvas should be minimal.

Example:

```text
                 Start building

      Press K to open the command palette
      or choose a tool from the left toolbar.
```

Avoid large illustrations.

---

# 27. Loading State

The application should avoid blocking loading screens wherever possible.

Use:

- Skeletons for panels
- Small inline progress indicators
- Immediate canvas initialization

The canvas should appear as early as possible.

---

# 28. Error State

Errors should be actionable.

Bad:

> Something went wrong.

Good:

> This project could not be imported because the scene format is unsupported.
>
> Version detected: 0
> Expected: 1+

Provide:

- What happened
- Why it happened when known
- What the user can do next

---

# 29. Keyboard Shortcuts

Core shortcuts:

```text
V                Select
H                Pan
R                Rectangle
C                Circle
T                Text
P                Pen
A                Arrow
Delete           Delete selection
⌘/Ctrl + Z       Undo
⌘/Ctrl + Shift Z Redo
⌘/Ctrl + C       Copy
⌘/Ctrl + V       Paste
⌘/Ctrl + D       Duplicate
⌘/Ctrl + A       Select all
⌘/Ctrl + K       Command palette
Space            Temporary pan
```

Users should be able to customize shortcuts in a future settings screen.

---

# 30. Motion Design

Animations should be subtle.

### Interaction

Use immediate movement for:

- Dragging
- Panning
- Zooming
- Resizing

Do NOT animate these.

### UI transitions

Use approximately:

```text
100–150ms — micro interactions
150–200ms — popovers
200–250ms — panels/dialogs
```

Prefer ease-out transitions.

Respect `prefers-reduced-motion`.

---

# 31. Micro-interactions

Useful micro-interactions:

- Toolbar button hover
- Selected tool indicator
- Node hover outline
- Snap indicator
- Connection preview
- Drag insertion indicator
- Successful export feedback

Avoid decorative animation.

---

# 32. Connection UX

When creating an edge:

1. Hover node.
2. Connection handles appear.
3. Drag from handle.
4. Valid targets highlight.
5. Invalid targets remain neutral.
6. Release to create edge.

During connection:

```text
Source ●───────────────→ ● Target
```

The preview line should follow the pointer smoothly.

---

# 33. Snap UX

Snapping must be visible but subtle.

When snapping:

- Show guide line briefly.
- Show small alignment indicator.
- Avoid persistent overlays.

Example:

```text
        │
        │ alignment
────────┼────────
        │
      [ NODE ]
```

---

# 34. Developer Mode

A developer/debug mode should expose engine internals.

Optional overlays:

- FPS
- Node count
- Edge count
- Render count
- Hit-test count
- Viewport bounds
- Spatial index visualization
- Dirty rectangles

Example:

```text
CanvasKit Debug
FPS       60
Nodes     10,432
Edges     12,201
Rendered  312
Viewport  1440×820
```

This feature is especially useful for demonstrating the engineering quality of the project.

---

# 35. Accessibility

UI controls must meet WCAG-oriented accessibility practices.

Requirements:

- Visible focus state
- Keyboard navigation
- Accessible labels
- Tooltip text for icon-only controls
- Sufficient contrast
- Reduced-motion support
- Logical tab order
- Screen-reader-friendly application controls

Canvas content should have an accessible alternative where practical.

---

# 36. Responsive Behavior

CanvasKit is primarily a desktop application.

### Desktop

Full experience:

```text
Toolbar + Canvas + Inspector
```

### Tablet

- Collapse inspector
- Reduce toolbar
- Keep canvas dominant

### Mobile

Mobile is not a primary target for V1.

If supported later:

- Bottom tool dock
- Floating inspector
- Touch gestures
- Larger hit targets

---

# 37. Responsive Breakpoints

```text
< 768px      Mobile
768–1024px   Tablet
1024–1440px  Desktop
> 1440px     Large Desktop
```

The editor should prioritize usable canvas area over preserving every panel.

---

# 38. Landing / Documentation Website

The documentation site should have a separate visual identity from the editor while sharing the same design tokens.

## Hero

Headline:

> Build visual editors without building the canvas from scratch.

Subheadline:

> An open-source, TypeScript-first engine for infinite canvas, nodes, edges, interactions, and high-performance visual applications.

Primary CTA:

> Get Started

Secondary CTA:

> View on GitHub

Hero visual:

A live interactive mini canvas, not a static screenshot.

---

# 39. Documentation Navigation

```text
CanvasKit
│
├── Introduction
├── Installation
├── Quick Start
├── Core Concepts
│   ├── Scene
│   ├── Nodes
│   ├── Edges
│   ├── Viewport
│   └── Coordinates
│
├── Guides
│   ├── Custom Nodes
│   ├── Plugins
│   ├── Rendering
│   └── Performance
│
├── Frameworks
│   ├── Vue
│   ├── Nuxt
│   └── React
│
├── Examples
└── API Reference
```

---

# 40. Documentation Visual Style

Documentation should use:

- Dark code blocks
- Generous whitespace
- Sticky navigation
- Interactive examples
- Copy buttons
- Clear API tables
- Version selector
- Search

Interactive examples should be embedded wherever an API affects visual behavior.

---

# 41. Component Design Rules

All UI components should follow these principles:

1. Clear hierarchy.
2. Small visual footprint.
3. Strong focus states.
4. Consistent spacing.
5. Consistent icon sizing.
6. Keyboard accessibility.
7. Dark/light theme support.
8. No unnecessary decoration.

---

# 42. Iconography

Use one consistent icon family.

Recommended:

- IconSax

Use IconSax's linear/outline icons for the primary application UI. Reserve bold variants for active tools or deliberately emphasized states, and do not mix IconSax with other icon families in the same interface.

Icon sizes:

```text
14px — compact controls
16px — standard controls
18px — toolbar
20px — prominent actions
24px — major navigation
```

Never mix multiple icon styles in the same interface.

---

# 43. Buttons

Primary:

- Accent background
- High contrast text
- 6px radius

Secondary:

- Surface background
- Border

Ghost:

- Transparent
- Hover surface

Icon button:

- 32–36px visual box
- Minimum 36px hit area

Destructive:

Use semantic danger only for destructive operations.

---

# 44. Inputs

Inputs should be compact.

Height:

```text
32–36px
```

States:

- Default
- Hover
- Focus
- Disabled
- Error

Use visible labels in inspector panels. Placeholder text should not replace labels.

---

# 45. Tooltips

Every icon-only control must have a tooltip.

Tooltip should show:

```text
Action name
Keyboard shortcut
```

Example:

> Rectangle — R

Tooltip delay:

Approximately 400ms.

---

# 46. Visual Hierarchy

Priority order:

```text
1. Canvas content
2. Selected objects
3. Active tool
4. Contextual controls
5. Navigation
6. Status information
```

If an element competes visually with the canvas, reduce its contrast.

---

# 47. Design Tokens

All visual values must be centralized.

Example:

```ts
const tokens = {
  colors: {},
  spacing: {},
  radii: {},
  typography: {},
  shadows: {},
  motion: {}
}
```

Do not scatter raw colors and spacing values throughout components.

---

# 48. Theming

Theming should be token-based.

Required themes:

- Dark
- Light

Future:

- High contrast
- Custom brand themes

Theme switching should not require rebuilding the application.

---

# 49. Design QA

Before each major release, verify:

- [ ] Dark theme
- [ ] Light theme
- [ ] Keyboard navigation
- [ ] Focus states
- [ ] Tooltips
- [ ] Hover states
- [ ] Selection states
- [ ] Empty states
- [ ] Error states
- [ ] Loading states
- [ ] Responsive behavior
- [ ] Reduced motion
- [ ] Contrast

---

# 50. Design Quality Bar

CanvasKit should feel closer to:

- Linear
- Raycast
- Figma
- Vercel
- GitHub Desktop
- VS Code

than to a generic admin dashboard.

The goal is **quiet sophistication**.

---

# 51. Final Design Direction

CanvasKit should be immediately recognizable as a serious developer tool.

The visual formula is:

```text
Minimal UI
    +
Strong typography
    +
Neutral surfaces
    +
Precise spacing
    +
Subtle borders
    +
Fast interactions
    +
Excellent keyboard support
    +
Powerful canvas
    =
Premium Developer Experience
```

The interface should never try to impress the user with decoration.

It should impress them with **precision, speed, clarity, and polish**.
