# Cover Photo Selection

## Problem
When multiple photos are uploaded for the same date, the calendar cell shows only one — the cover. Today the cover is chosen automatically (most recently uploaded; on delete, the next-newest is promoted). There is no way for the user to pick which photo represents the date on the calendar.

## Goal
Let the calendar owner choose which of that date's photos is the cover shown on the month grid.

## Requirements

1. On the date detail page (`/date/[date]`), the calendar owner can mark any photo for that date as the cover. The action is surfaced as a hover control on the photo card (alongside the existing delete button); it is not shown inside the lightbox.
2. Exactly one photo per (user, date) is the cover at any time. Selecting a new cover unsets the previous one.
3. The currently selected cover is visually indicated (existing "Cover" badge is sufficient).
4. The action is only available to the owner of the calendar. Viewers of a shared calendar cannot change the cover.
5. After selection, the calendar month view reflects the new cover on next load. Real-time propagation to shared viewers is not required.
6. Existing automatic behavior is preserved as a fallback:
   - On upload: the newly uploaded photo becomes the cover.
   - On delete of the current cover: the most recent remaining photo is promoted.
   - Manual user selection overrides these defaults until the user chooses again or the selected photo is deleted.
7. If the user selects a photo that is already the cover, it is a no-op (no error).

## Non-goals
- No support for multiple covers, cover ordering, or a "no cover" state.
- No bulk cover-selection flow across multiple dates.
- No separate cover image distinct from the uploaded photos (cover is always one of the existing photos for that date).

