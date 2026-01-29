# Classify

Classify is a productivity hub for students. It combines class grade tracking, a Kanban/Task board and a due-date calendar. Everything runs in the browser and is stored locally, so your data stays on your device.

## What it does

### Dashboard (Classes)
- Create, view, and delete class cards.
- Each class shows a live average that is color-coded (red - <50, orange - 50 to 80, green >= 80) .
- Class view lets you manage assignments.
- Class averages update instantly as you add or remove assignments.

### Class grade tracking
- Add assignments with name, grade %, and weight %.
- Computes weighted averages.

### Task Board (Kanban)
- Create custom lists and reorder them with drag and drop.
- Add, remove, and move cards between lists.
- Each card can have a due date, set with a built-in date picker.
- Due dates are coloured as urgent (red - due today or tomorrow), soon (orange - due within 2-7 days), or normal (grey - due after 7 days).

### Calendar
- Monthly view with dots for due tasks.
- Select a day to see tasks due on that date.
- Quick navigation: previous month, next month, and jump to today.

## How it works

- All data is persisted in `localStorage`, so classes and tasks are restored on reload.
- The class dashboard and class view are connected through a shared state, which keeps averages and gauges in sync.
- The Kanban board updates the calendar in real time, so due date changes immediately reflect on the calendar view.

## Project structure

- `classify-react/`: Vite + React version.
- `OLD/`: Original static implementation (HTML/CSS/JS).
