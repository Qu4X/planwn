# AGENTS.md — Plan WN

Dokument dla agentów AI pracujących w tym repozytorium.
Przeczytaj przed pierwszą zmianą w kodzie.

---

## Architektura (skrót)

```
scrapper.py          Pobiera HTML z arktur.umg.edu.pl, parsuje, generuje JSON i ICS
build_static.py      Punkt wejścia buildu — wywołuje scrapper, zapisuje do dist/
web/app.js           Frontend PWA (vanilla JS, 2290 linii) — czyta wygenerowane JSONy
academic_calendar.json  Jedyne źródło prawdy o dniach wolnych, zamianach i przerwach
CONTEXT.md           Słownik pojęć domenowych — przeczytaj przed zmianą nazewnictwa
tests.py             Regresja Pythona (16 testów)
test_calendar.js     TDD logiki spotkań w JS
```

Pełna architektura i słownik → [`CONTEXT.md`](CONTEXT.md)

---

## Testy — uruchom przed i po każdej zmianie

```powershell
.venv\Scripts\python.exe tests.py   # Windows
node test_calendar.js
```

Oba muszą przejść. Jeśli jeden czerwony — napraw przed commitem.

---

## Wymagania testowe

**Bug fix bez testu regresyjnego = niekompletna zmiana.**

Dodaj test do `tests.py` (Python) lub `test_calendar.js` (JS) który:
1. Przed fixem jest czerwony.
2. Po fixie jest zielony.

Nowe funkcje: test opcjonalny, ale mile widziany.

---

## Format commitów — Conventional Commits

```
feat(scope):   nowa funkcjonalność
fix(scope):    naprawa błędu
perf(scope):   optymalizacja bez zmiany działania
docs(scope):   tylko dokumentacja
refactor(scope): zmiana struktury bez zmiany działania
test(scope):   testy bez zmian produkcyjnych
ci(scope):     pipeline i deployment
```

Scope = moduł lub obszar (np. `calendar`, `pwa`, `parser`, `ics`, `web`).

Dobry: `fix(ics): use UTC-aware datetime for DTSTAMP`
Zły: `fixed stuff`

---

## Krytyczne kontrakty Python ↔ JS

Dwa miejsca, gdzie Python i JS muszą być zawsze zsynchronizowane.
**Zmiana jednego bez drugiego = cichy błąd produkcyjny.**

### Kontrakt 1 — sanityzacja nazwy grupy (nazwy plików)

Python (`build_static.py`) tworzy nazwy plików:
```python
safe_grupa = re.sub(r'[^\w-]', '_', grupa)
# Przykład: "GR. 1" → "GR__1"
```

JS (`app.js`) musi budować URL fetcha tą samą regułą:
```js
const safeGroup = group.replace(/[^\w-]/g, '_');
// Przykład: "GR. 1" → "GR__1"
```

Gdy zmieniasz jedno, zmień drugie. Sprawdź w `tests.py` sekcja "Filename sanitisation".

### Kontrakt 2 — logika kalendarza akademickiego

`academic_calendar.json` jest parsowany niezależnie przez:
- `scrapper.py` — przy generowaniu ICS (build time)
- `web/app.js` — przy wyświetlaniu spotkań (runtime)

Gdy zmieniasz reguły interpretacji dat (holidays, breaks, daySwaps) w jednym miejscu,
sprawdź czy drugie zachowuje się tak samo dla tego samego tygodnia.

---

## Strefy chronione — nie refaktoruj bez wyraźnej instrukcji

### `_wspolny_parser_html` w `scrapper.py`

~200 linii logiki parsowania HTML ze strony arktur.umg.edu.pl.
Parsuje komórki `<td id="td_...">`, chunki zajęć, kolory fontów, dane AJAX.
Wrażliwa na zmiany struktury HTML uczelni. Poprawki błędów: OK. Refaktor strukturalny: zapytaj.

### `getLessonMeetingInfo` w `web/app.js`

Liczy spotkania z uwzględnieniem daySwaps, holidays i przerw.
Ma pokrycie TDD w `test_calendar.js`. Pętla zawiera guard na `"Inny"` (nieznany dzień)
i twardy cap 200 iteracji — nie usuwaj tych zabezpieczeń.

---

## Nowe zależności — zawsze zapytaj użytkownika

Nie dodawaj pakietów do `requirements.txt` bez zgody właściciela.
Projekt celowo ma trzy zależności: `requests`, `beautifulsoup4`, `icalendar`.

Jeśli nowa zależność jest potrzebna: zaproponuj ją i poczekaj na odpowiedź.

---

## Pliki konfiguracyjne — tylko za zgodą właściciela

Nie edytuj samodzielnie:

| Plik | Dlaczego |
|------|---------|
| `academic_calendar.json` | Dane rektorskie — muszą być sprawdzone z oficjalnym kalendarzem UMG |
| `subjects_manual.json` | Aliasy nazw przedmiotów — mogą wpłynąć na ICS i cross-reference |
| `TODO.md` | Backlog projektu |

Zaproponuj zmianę, poczekaj na potwierdzenie.

---

## Domenowe słownictwo — użyj właściwych terminów

Projekt ma polskie słownictwo domenowe. Użyj tych terminów w komentarzach i komunikatach:

| Termin | Znaczenie | Unikaj |
|--------|-----------|--------|
| **Spotkanie** | Jeden blok zajęć w jednym dniu | zjazd, lekcja, tydzień |
| **Dzień bazowy planu** | Dzień tygodnia przypisany w siatce planu | dzień zajęć |
| **Zamiana dnia** | Zarządzenie rektorskie zmieniające dzień realizacji | odrobienie, przesunięcie |
| **Przerwa dydaktyczna** | Wielodniowy okres bez zajęć | wakacje, ferie |

Pełny słownik → [`CONTEXT.md`](CONTEXT.md)


---

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues (Qu4X/planwn). See docs/agents/issue-tracker.md.

### Triage labels

Canonical 5-role triage vocabulary. See docs/agents/triage-labels.md.

### Domain docs

Single-context (CONTEXT.md and docs/adr/ at repo root). See docs/agents/domain.md.
