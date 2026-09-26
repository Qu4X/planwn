# AGENTS.md — Plan WN

Dokument dla agentów AI pracujących w tym repozytorium.
Przeczytaj przed pierwszą zmianą w kodzie.

---

## Architektura (skrót)

```
scrapper.py               Fasada scrapera HTML (arktur_client + arktur_parser)
nst_client.py             Pobieranie planów studiów niestacjonarnych (PDF) z arktur
nst_parser.py             Parser siatki PDF planów niestacjonarnych (pdfplumber)
build_static.py           Punkt wejścia buildu — generuje pliki JSON i ICS do dist/
data/academic_calendar.json Jedyne źródło prawdy o dniach wolnych, zamianach i przerwach
data/subjects_manual.json Aliasy i konfiguracja klasyfikacji form przedmiotów
web/app.js                Główny kontroler frontendu PWA (vanilla JS)
web/js/schedule-engine.js Czysty silnik domenowy kalendarza i spotkań
web/js/cross-reference.js Silnik i UI wyszukiwarki sal, wykładowców i przedmiotów
tests/test_backend.py     Regresja Pythona (backend, parser HTML/PDF, ICS)
tests/test_calendar.js    TDD logiki spotkań i UI w JS
tests/test_cross_reference.js TDD modali sal, wykładowców i przedmiotów w JS
tests/test_schedule_engine.js TDD czystego silnika harmonogramu w JS
```

Pełna architektura i słownik → [`CONTEXT.md`](CONTEXT.md)

---

## Testy — uruchom przed i po każdej zmianie

```powershell
.venv\Scripts\python.exe tests/test_backend.py   # Windows Python
npm test                                        # JS frontend (wszystkie 3 zestawy testów)
```

Oba muszą przejść. Jeśli jeden czerwony — napraw przed commitem.

---

## Wymagania testowe

**Bug fix bez testu regresyjnego = niekompletna zmiana.**

Dodaj test do `tests/test_backend.py` (Python) lub odpowiedniego pliku w `tests/` (JS) który:
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

Scope = moduł lub obszar (np. `calendar`, `pwa`, `parser`, `ics`, `web`, `nst`).

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

Gdy zmieniasz jedno, zmień drugie. Sprawdź w `tests/test_backend.py` sekcja "Filename sanitisation".

### Kontrakt 2 — logika kalendarza akademickiego

`academic_calendar.json` jest parsowany niezależnie przez:
- `scrapper.py` — przy generowaniu ICS (build time)
- `web/js/schedule-engine.js` / `web/app.js` — przy wyświetlaniu spotkań (runtime)

Gdy zmieniasz reguły interpretacji dat (holidays, breaks, daySwaps) w jednym miejscu,
sprawdź czy drugie zachowuje się tak samo dla tego samego tygodnia.

---

## Strefy chronione — nie refaktoruj bez wyraźnej instrukcji

### `_wspolny_parser_html` w `scrapper.py`

~200 linii logiki parsowania HTML ze strony arktur.umg.edu.pl.
Parsuje komórki `<td id="td_...">`, chunki zajęć, kolory fontów, dane AJAX.
Wrażliwa na zmiany struktury HTML uczelni. Poprawki błędów: OK. Refaktor strukturalny: zapytaj.

### `getLessonMeetingInfo` w `web/js/schedule-engine.js`

Liczy spotkania z uwzględnieniem daySwaps, holidays i przerw.
Ma pokrycie TDD w `tests/test_calendar.js` i `tests/test_schedule_engine.js`. Pętla zawiera guard na `"Inny"` (nieznany dzień)
i twardy cap 200 iteracji — nie usuwaj tych zabezpieczeń.

---

## Nowe zależności — zawsze zapytaj użytkownika

Nie dodawaj pakietów do `requirements.txt` bez zgody właściciela.
Projekt bazuje na minimalnym zestawie: `requests`, `beautifulsoup4`, `icalendar`, `pdfplumber`.

Jeśli nowa zależność jest potrzebna: zaproponuj ją i poczekaj na odpowiedź.

---

## Pliki konfiguracyjne — tylko za zgodą właściciela

Nie edytuj samodzielnie:

| Plik | Dlaczego |
|------|---------|
| `data/academic_calendar.json` | Dane rektorskie — muszą być sprawdzone z oficjalnym kalendarzem UMG |
| `data/subjects_manual.json` | Aliasy nazw przedmiotów — mogą wpłynąć na ICS i cross-reference |
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
