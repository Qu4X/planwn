# Plan WN

An unofficial schedule viewer for students of the University of Maritime in Gdynia (UMG). It reads schedule data from the university's official system and displays it in a fast, mobile-friendly progressive web app (PWA).

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Local Setup](#local-setup)
- [Configuration](#configuration)
- [Testing](#testing)
- [Data Source](#data-source)

---

## Features

- View the schedule for any group at UMG.
- Navigate by day: workdays, active days, or all days.
- See the meeting number and total for each class (for example, meeting 3 of 7).
- Rector day swaps, holidays, and teaching breaks appear in the schedule view.
- Subscribe to a group calendar via `webcal://` or import an `.ics` file.
- Click a teacher or room to see their full weekly schedule (cross-reference).
- Find free rooms at a given time.
- Install the app on Android, iOS, and desktop as a PWA.

---

## Architecture

```
scrapper.py        Fetches all plans from arktur.umg.edu.pl, parses HTML, and generates
                   structured JSON and iCalendar (.ics) files.

build_static.py    Build entry point. Calls the scraper for every group and writes output to dist/.

web/               Vanilla JS PWA frontend (no framework). Reads pre-built JSON files.

dist/              Build output: web assets, data/schedules/*.json, and calendars/*.ics.

.github/workflows/ GitHub Actions runs the build daily at 04:00 UTC and deploys dist/ to GitHub Pages.

academic_calendar.json   Single source of truth for rector day swaps, holidays, and teaching periods.

tests.py           Python regression suite.
test_calendar.js   JavaScript TDD suite for meeting-counting logic.
```

---

## Requirements

- Python 3.11 or later
- Node.js (required only for `test_calendar.js`)

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Dependencies: `requests`, `beautifulsoup4`, `icalendar`.

---

## Local Setup

1. Create and activate a virtual environment.

   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS / Linux
   source .venv/bin/activate
   ```

2. Install dependencies.

   ```bash
   pip install -r requirements.txt
   ```

3. Run a test build (3 plans only).

   ```bash
   python build_static.py --limit 3
   ```

4. Serve the output directory.

   ```bash
   python -m http.server 8080 --directory dist
   ```

5. Open `http://localhost:8080` in a browser.

For a full build of all plans, run `python build_static.py` without the `--limit` flag. The full build takes several minutes because it scrapes every plan from the university server.

---

## Configuration

| File | Purpose |
|------|---------|
| `academic_calendar.json` | Add rector day swaps, holidays, or break periods. |
| `subjects_manual.json` | Override a raw subject abbreviation with a full name. |
| `wn_subjects_catalog.json` | Official WN subject catalog for subject name enrichment. |

### Adding a rector day swap

Open `academic_calendar.json` and add an entry to `daySwaps`:

```json
"2027-04-01": { "replaceWith": "SR", "note": "Thursday 01.04 - Wednesday classes" }
```

The key is the calendar date. `replaceWith` is the base schedule day that the university runs on that date.

---

## Testing

Run the Python regression suite:

```bash
.venv\Scripts\python.exe tests.py   # Windows
python tests.py                     # macOS / Linux
```

Run the JavaScript meeting-counting suite:

```bash
node test_calendar.js
```

---

## Data Source

Schedule data comes from [arktur.umg.edu.pl](https://arktur.umg.edu.pl/planyzaj/strpza5.php). This project is not affiliated with UMG. The data belongs to the University of Maritime in Gdynia.
