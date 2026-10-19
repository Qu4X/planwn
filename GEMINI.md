# GEMINI.md — Plan WN

Instrukcje dla modeli Gemini / Antigravity pracujących w tym repozytorium.

Głównym, kanonicznym źródłem zasad i architektury jest **[AGENTS.md](AGENTS.md)**.
Przed rozpoczęciem pracy przeczytaj:
1. **[AGENTS.md](AGENTS.md)** — zasady commitowania, krytyczne kontrakty Python ↔ JS, strefy chronione i wymagania testowe.
2. **[CONTEXT.md](CONTEXT.md)** — słownik pojęć domenowych (Spotkanie, Zamiana dnia, Dzień bazowy, Przerwa dydaktyczna).

---

## Najważniejsze zasady w skrócie
- **Testy**: Uruchamiaj `.venv\Scripts\python.exe tests/test_backend.py` oraz `npm test` przed i po każdej zmianie. Oba muszą być zielone.
- **Brak nowych zależności**: Nie dodawaj bibliotek do `requirements.txt` ani `package.json` bez wyraźnej zgody właściciela.
- **Pliki konfiguracyjne**: Nie modyfikuj samodzielnie `data/academic_calendar.json`, `data/subjects_manual.json` ani `TODO.md`.
- **Styl**: Dokumentacja po polsku, identyfikatory i commity po angielsku (Conventional Commits).
