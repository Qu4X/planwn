# CONTRIBUTING.md — Plan WN

Dziękujemy za chęć współtworzenia projektu! Plan WN to hobbystyczna, niezależna aplikacja PWA tworzona dla studentów Wydziału Nawigacyjnego Uniwersytetu Morskiego w Gdyni.

---

## Zasady ogólne

1. **Brak frameworków frontendowych**: Frontend opiera się wyłącznie na czystym HTML5, CSS3 i Vanilla JavaScript (bez bundlerów, npm build, Reacta itp.). Pliki z `web/` są kopiowane do `dist/` przez skrypt Pythona.
2. **Minimalizm zależności**: Backend korzysta z minimalnego zestawu bibliotek (`requests`, `beautifulsoup4`, `icalendar`, `pdfplumber`). Nie dodawaj nowych zależności bez wcześniejszej dyskusji w Issue.
3. **Konwencja commitów**: Stosujemy [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat(scope): ...`
   - `fix(scope): ...`
   - `docs(scope): ...`
   - `test(scope): ...`
   - `refactor(scope): ...`

---

## Środowisko lokalne

1. Klonowanie repozytorium:
   ```bash
   git clone https://github.com/Qu4X/planwn.git
   cd planwn
   ```
2. Przygotowanie środowiska Python:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux/macOS:
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. Uruchomienie testów:
   ```bash
   # Testy Pythona (backend, parser, ICS):
   python tests/test_backend.py
   # Testy JavaScript (silnik planu, kalendarz, modale):
   npm test
   ```
4. Szybki build lokalny (pierwsze 3 plany):
   ```bash
   python build_static.py --limit 3
   python -m http.server 8080 --directory dist
   ```

---

## Wymagania wobec Pull Requestów

- **Testy regresyjne**: Każda naprawa błędu (`fix`) musi zawierać test w `tests/test_backend.py` lub w odpowiednim pliku `tests/*.js`, który bez poprawki byłby czerwony.
- **Krytyczne kontrakty**: Pamiętaj o synchronizacji logiki sanityzacji nazw plików (`build_static.py` ↔ `web/app.js`) oraz interpretacji kalendarza akademickiego (`ics_export.py` ↔ `web/js/schedule-engine.js`). Szczegóły znajdziesz w [AGENTS.md](AGENTS.md).
- **Słownictwo domenowe**: W kodzie i komentarzach stosujemy ujednolicone pojęcia opisane w [CONTEXT.md](CONTEXT.md) (*Spotkanie*, *Dzień bazowy planu*, *Zamiana dnia*, *Przerwa dydaktyczna*).
