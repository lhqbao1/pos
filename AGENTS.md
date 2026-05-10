# Agent Rules

## UI Color Rules
- Text/icon displayed on `bg-primary` must use `secondary` color.
- Prefer `text-primary-foreground` for text on primary backgrounds.
- In this project, `--primary-foreground` is mapped to `--secondary` in `app/globals.css`.
- Avoid hardcoded `text-white` on primary backgrounds unless explicitly requested.
- Text/icon displayed on `bg-secondary` must use white (`text-white` or `text-secondary-foreground`).

## API Loading Rules
- Any UI rendering data from API must include a loading state.
- Loading must cover both initial load and re-fetch cases (filter/search/sort/pagination/reload).
- Prefer skeleton for first load without cached data, and a non-blocking loading indicator/overlay for background fetch.

## Implementation Hint
- When creating new components with a primary background, use either:
  - `bg-primary text-primary-foreground`, or
  - `bg-primary` with icon/text classes set to `text-secondary`.
