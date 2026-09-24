# Spec: Cross-Reference Modals & Wyszukiwarka Wolnych Sal

> Status: `ready-for-implementation`  
> Data: 2026-09-24 (v4 — pełna synchronizacja z tofix.txt i schedule-engine-refactor.md)  
> Powiązane dokumenty: `docs/specs/schedule-engine-refactor.md`, `TODO.md`, `AGENTS.md`, `CONTEXT.md`

---

## Problem Statement

W `web/app.js` znajduje się kod odpowiedzialny za powiązania krzyżowe (Cross-Reference) oraz wyszukiwarkę wolnych sal:
1. **Duplikacja kodu widoków**: Modale planu wykładowcy (`openTeacherSchedule`), obłożenia sali (`openRoomSchedule`) oraz szczegółów przedmiotu (`openSubjectDetail`) budują niemal identyczne struktury HTML (`modal-day-group`, `modal-slot-item`, plakietki cykli, grupy).
2. **Ograniczenia wyszukiwarki wolnych sal**:
   - Sprawdzanie sal bazowało na wyliczaniu daty z bieżącego tygodnia (`state.weekOffset`), uniemożliwiając studentowi swobodny wybór dowolnego dnia semestru z kalendarza.
   - Brak szybkiego filtrowania sal po nazwie / typie (duża lista sal wymaga uciążliwego przewijania na telefonie).
3. **Monolityczność i sprzeczność odpowiedzialności w `app.js`**: Logika wyszukiwania w sidebarze (`onSearchInput`), zarządzania cache'em `cross_reference.json` w `localStorage` oraz orkiestracja modali zaciemniają główny cel `app.js`, którym jest nawigacja i siatka planu.

---

## Solution

Wyodrębnić powiązania krzyżowe i wyszukiwarkę sal do dedykowanego modułu `web/js/cross-reference.js`. Moduł jest zależny od ukończonego modułu `ScheduleEngine` (korzysta z jego publicznych metod: `isTeachingDay`, `resolveBaseDay`, `getRoomOccupancyAt`, `formatDateISO`, `getMonday`).

Moduł dzieli się na dwa poziomy:
1. **Czysta warstwa logiki i zapytań (`CrossRef.Engine`)**:
   - Wyszukiwanie pełnotekstowe z normalizacją polskich znaków diakrytycznych (`ą->a, ł->l, ś->s` itp.) i case-insensitive. Wymaga `>= 2` znaków, by nie generować nadmiarowych wyników.
   - Wyznaczanie dostępności sal (`findFreeRooms`) w oparciu o bazę planów UMG oraz instancję `ScheduleEngine`.
   - Zależność datowa oparta wyłącznie o `dateISO`. Rozwiązywanie dnia bazowego i zamian rektorskich następuje wyłącznie przez metodę `scheduleEngine.resolveBaseDay(dateISO)`.
   - Szybki filtr sal (`filterText`) działający od 1 znaku jako dopasowanie substringowe (obsługuje krótkie nazwy sal, np. "2", "P1", "P").
   - Wstrzykiwalny czas (`options.now`) z deterministycznym przeliczaniem na strefę `Europe/Warsaw` za pomocą `Intl.DateTimeFormat`.
2. **Warstwa widoku i zarządzania danymi (`CrossRef.UI`)**:
   - Centralne pobieranie i cache'owanie `cross_reference.json` z obsługą wersji schematu (`schemaVersion: 1`), znacznika czasu, cichą aktualizacją w tle oraz opcjonalnym powiadomieniem `onUpdate(freshData)`.
   - Wstrzykiwalne mocki `storage` i `fetchFn` dla hermetycznej testowalności w środowisku Node.js.
   - Uniwersalny, bezpieczny renderer kart zajęć `renderSlotCard` z rygorystycznym `escapeHtml` (zabezpieczonym przed konwersją liczby `0` na pusty ciąg).
   - Nowy interfejs wyszukiwarki wolnych sal z **selektorem daty (date picker / szybkie przyciski dni)** oraz **szybkim filtrem tekstowym sal**.
   - Dostępność (a11y): `role="dialog"`, `aria-modal="true"`, zamykanie klawiszem `Escape`, focus trap i przywracanie fokusu.

---

## User Stories

1. Jako student, chcę sprawdzić dostępność wolnych sal na dowolny wybrany dzień semestru, wybierając datę z natywnego date pickera lub szybkich przycisków (`Dziś`, `Jutro`).
2. Jako student, chcę móc wpisać fragment nazwy sali (np. "114", "aula", "P") w polu szybkiego filtra w modalu sal, aby natychmiast zawęzić listę bez przewijania (filtr substringowy działa od 1 znaku).
3. Jako student, chcę widzieć, która sala jest wolna „teraz” (bieżąca godzina w strefie polskiej) oraz do której godziny pozostaje wolna (następne zajęcia).
4. Jako student, chcę kliknąć salę w kafelku zajęć i natychmiast zobaczyć tygodniowy rozkład zajęć w tej sali.
5. Jako student, chcę kliknąć nazwisko prowadzącego i zobaczyć jego pełny tygodniowy plan zajęć ze wszystkimi grupami na UMG.
6. Jako student, chcę wpisać w wyszukiwarkę w menu bocznym nazwisko bez polskich znaków (np. "wawrzynska", "boniewicz") i otrzymać właściwe podpowiedzi ("Wawrzyńska Aleksandra", "Boniewicz-Szmyt Katarzyna") przy wpisaniu co najmniej 2 znaków.
7. Jako student, chcę, aby wyszukiwarka przedmiotów rozumiała warianty skrótowe i pełne nazwy z `raw_variants`.
8. Jako student w dzień wolny od zajęć (święto, przerwa, sesja egzaminacyjna, niedziela), chcę zobaczyć informację, że wszystkie sale są wolne przez cały dzień.
9. Jako programista, chcę, aby logika filtrowania i zapytań o sale była czystą funkcją bez DOM, testowalną hermetycznie w Node.js (`test_cross_reference.js`) z użyciem dedykowanych fixture'ów.
10. Jako programista, chcę, aby cały kod HTML generowany z danych zewnętrznych był bezpiecznie escapowany, uniemożliwiając ataki XSS (z poprawną obsługą wartości `0`).
11. Jako programista, chcę, aby `app.js` nie musiał wiedzieć, jak pobierany jest `cross_reference.json` ani jak wyglądają modale szczegółów.
12. Jako użytkownik czytnika ekranu lub klawiatury, chcę zamykać modal klawiszem `Escape`, mieć uwięziony fokus wewnątrz otwartego modalu i powrócić fokusem do klikniętego przycisku po zamknięciu.

---

## Implementation Decisions

### D1 — Wzorzec modułu i UMD

Moduł eksportowany w identycznym standardzie UMD/IIFE jak `web/js/schedule-engine.js`:

```javascript
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.CrossRef = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Prywatne stałe, silnik, DataService i UI
});
```

---

### D2 — Struktura danych wejściowych `cross_reference.json`

Moduł operuje na obiekcie o następującym kształcie (generowanym przez `build_static.py`):

```typescript
interface CrossRefData {
  teachers: {
    [teacherName: string]: Array<{
      day: string;          // "PON", "WT", ...
      slot: number;
      hours: string;        // "08:00 - 09:30"
      subject: string;
      raw_subject?: string;
      room: string;
      groups: string[];
      plan_id: string;
      plan_name: string;
      weeks: number;
      data_start: string;
      co_ile: number;
      od_tyg: number;
      polowa_sem: number | null;
    }>;
  };
  rooms: {
    [roomName: string]: {
      [dayCode: string]: Array<{
        slot: number;
        hours: string;
        subject: string;
        teacher: string;
        groups: string[];
        plan_id: string;
        plan_name: string;
        weeks: number;
        data_start: string;
        co_ile: number;
        od_tyg: number;
        polowa_sem: number | null;
      }>;
    };
  };
  subjects: {
    [subjectName: string]: {
      subject: string;
      raw_variants: string[];
      teachers: string[];
      majors?: string[];
      syllabus_url?: string;
      plans: Array<{ plan_id: string; plan_name: string; groups: string[] }>;
    };
  };
  room_list: string[];      // np. ["Aula", "110", "114", "114a", "2", "C31", "P1", "P2", "basen"]
  generated_at?: string;
}
```

---

### D3 — Interfejs `CrossRef.Engine` (Czysta warstwa zapytań)

1. **Wyszukiwarka z normalizacją diakrytyków (`search`)**:
   ```javascript
   CrossRef.Engine.search(crossRefData, query: string, limitPerCategory = 5)
     → {
         teachers: Array<{ name: string, classCount: number }>,
         rooms: Array<{ room: string }>,
         subjects: Array<{ name: string, teachers: string[] }>
       }
   ```
   - Normalizacja: `str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()` + zamiana `ł->l`.
   - Dopasowanie: Substringowe w znormalizowanym tekście. Zapytanie "sala 114" dopasowuje zarówno całą frazę, jak i numer "114". Dla sal zapytanie `"114"` zwraca zarówno rekord `"114"`, jak i `"114a"`.
   - **Próg długości**: Puste zapytanie (`""` lub `< 2` znaki) zwraca puste tablice wyników (chroni przed generowaniem gigantycznych list przy wpisaniu 1 litery w menu bocznym).

2. **Dostępność wolnych sal (`findFreeRooms`)**:
   ```javascript
   CrossRef.Engine.findFreeRooms(crossRefData, {
     dateISO: string,             // np. "2026-11-13" (JEDYNE źródło prawdy o dacie)
     queryRange: { start: number, end: number }, // minuty [start, end)
     scheduleEngine: object,      // instancja ScheduleEngine
     filterText?: string,         // opcjonalny filtr tekstowy sali (działa od 1 znaku)
     now?: Date                   // wstrzykiwalny czas dla determinizmu
   })
     → Array<{
         room: string,
         isFree: boolean,
         occupyingClass: object | null,
         nextClass: object | null
       }>
   ```
   - **Kolejność weryfikacji dostępności**:
     1. Sprawdzenie dnia wolnego: Jeśli `!scheduleEngine.isTeachingDay(dateISO)` (święto, przerwa dydaktyczna lub sesja egzaminacyjna) → **wszystkie pasujące sale są zwracane jako wolne** (`{ room, isFree: true, occupyingClass: null, nextClass: null }`).
     2. Rozwiązanie dnia bazowego: `const effectiveDay = scheduleEngine.resolveBaseDay(dateISO);`. Jeśli `effectiveDay === null` (błędna data) lub `effectiveDay === "ND"` (brak planowych zajęć w niedzielę) → **wszystkie pasujące sale są zwracane jako wolne**.
     3. Studia niestacjonarne (Sobota): W UMG sobota (`SOB`) jest normalnym dniem zajęć dydaktycznych dla studiów zaocznych. Metoda `isTeachingDay` traktuje ją jako dzień dydaktyczny, a obłożenie sal jest poprawnie kalkulowane z siatki sobotniej.
     4. Weryfikacja obłożenia: Dla każdej pasującej sali z listy `crossRefData.room_list`, pobierany jest rozkład `(crossRefData.rooms[r] && crossRefData.rooms[r][effectiveDay]) || []`, a następnie wywoływana jest metoda `scheduleEngine.getRoomOccupancyAt(daySchedule, queryRange, dateISO, effectiveDay)`.
   - **Filtr sal (`filterText`)**: Działa już od 1 znaku (`filterText.trim().length >= 1`) jako dopasowanie **substringowe** (zawiera podciąg, case-insensitive, bez diakrytyków). Wpisanie `"p"` filtruje wszystkie sale zawierające literę "p" (np. "P1", "P2", "Pływalnia").
   - **Konwencja zakresu godzin**: `queryRange` operuje na minutach w konwencji półotwartej `[start, end)`. Jeśli zajęcia kończą się o 09:30 (570 min), a kolejne zaczynają o 09:30, zapytanie o slot 09:30–11:00 nie traktuje poprzednich zajęć jako kolizji.
   - **Tryb "Teraz" i strefa czasowa**:
     - Wyznaczenie aktualnego czasu następuje zawsze w strefie `Europe/Warsaw` za pomocą `Intl.DateTimeFormat` (a nie lokalnego zegara urządzenia).
     - W trybie "Teraz" `dateISO` to data dzisiejsza w strefie polskiej.
     - Tworzony jest punktowy przedział `[curMinutes, curMinutes + 1)` (gdzie `curMinutes` to minuty od północy w strefie warszawskiej). Jeżeli dowolna lekcja w danym dniu pokrywa minutę `curMinutes`, sala jest oznaczana jako zajęta.
     - Funkcja pomocnicza:
       ```javascript
       function getWarsawTimeParts(date = new Date()) {
         const formatter = new Intl.DateTimeFormat("en-CA", {
           timeZone: "Europe/Warsaw",
           year: "numeric", month: "2-digit", day: "2-digit",
           hour: "2-digit", minute: "2-digit", hour12: false
         });
         const parts = formatter.formatToParts(date);
         const getPart = type => parts.find(p => p.type === type)?.value;
         const year = getPart("year");
         const month = getPart("month");
         const day = getPart("day");
         const hour = parseInt(getPart("hour"), 10) || 0;
         const minute = parseInt(getPart("minute"), 10) || 0;
         return {
           dateISO: `${year}-${month}-${day}`,
           minutes: hour * 60 + minute
         };
       }
       ```

3. **Standardowe sloty godzinowe UMG (Stała dziedzinowa zgodna z danymi uczelni)**:
   ```javascript
   CrossRef.Engine.STANDARD_SLOTS = [
     { label: "08:00 - 09:30", start: 480, end: 570 },
     { label: "09:45 - 11:15", start: 585, end: 675 },
     { label: "11:30 - 13:00", start: 690, end: 780 },
     { label: "13:30 - 15:00", start: 810, end: 900 },
     { label: "15:15 - 16:45", start: 915, end: 1005 },
     { label: "17:00 - 18:30", start: 1020, end: 1110 },
     { label: "18:45 - 20:15", start: 1125, end: 1215 }
   ];
   ```

---

### D4 — Bezpieczeństwo i renderer HTML (`renderSlotCard` & `escapeHtml`)

Każda dana pochodząca z bazy planów (`subject`, `teacher`, `room`, `groups`, `plan_name`) jest rygorystycznie sanityzowana funkcją `escapeHtml`:
```javascript
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```
*Uwaga: Zastosowanie `str === null || str === undefined` zapobiega wycięciu poprawnej wartości numerycznej `0` (np. slot `0` lub sala `"0"`).*

Zunifikowany szablon `renderSlotCard`:
- Jedno źródło prawdy dla widoków sali, wykładowcy i przedmiotu.
- Testowany jednostkowo pod kątem obecności poprawnych klas CSS i odporności na znaki specjalne (`<script>`, `"`, `&`).

---

### D5 — Zarządzanie danymi i cache (`CrossRef.DataService`)

Wszystkie operacje I/O na `cross_reference.json` przenoszą się do modułu:
- `CrossRef.DataService.load(options)`:
  - Przyjmuje opcje wstrzykiwania zależności dla pełnej testowalności w Node.js:
    ```javascript
    const storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    const fetchFn = options.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
    const onUpdate = options.onUpdate || null;
    ```
  - Struktura zapisu w `storage`:
    ```json
    {
      "schemaVersion": 1,
      "cachedAt": 1727190000000,
      "data": { ... }
    }
    ```
  - Sprawdza pamięć podręczną w `storage` (`umg_cross_ref_cache`). Jeśli obiekt nie zawiera `schemaVersion === 1` lub parsowanie rzuca błąd, cache jest czyszczony i ignorowany.
  - Jeśli poprawne dane istnieją w cache: natychmiast zwraca zcache'owane dane i w tle asynchronicznie odpytuje `fetchFn("data/cross_reference.json")`.
  - Po pobraniu świeżych danych z sieci: cicho aktualizuje `storage` (zabezpieczone blokiem `try/catch` na wypadek `QuotaExceededError`). Jeśli przekazano `onUpdate(freshData)`, wywołuje ten callback, umożliwiając widokowi natychmiastowe odświeżenie bez czekania na restart sesji.
  - Jeśli brak sieci / błąd JSON: zwraca dane z cache'a lub `null` w przypadku całkowitej niedostępności.

---

### D6 — Dostępność (a11y) w `CrossRef.UI`

- Modal `#cross-modal` posiada atrybuty: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="cross-modal-title"`.
- Zamykanie klawiszem `Escape`.
- Zapisanie elementu aktywnego przed otwarciem modalu (`previousFocusedElement = document.activeElement`) i przywrócenie fokusu po zamknięciu.
- Etykiety dostępności dla kontrolek (`aria-label="Wybierz datę"`, `aria-label="Filtruj sale"`).

---

### D7 — Integracja z `web/app.js`

W `web/app.js`:
- Całkowite usunięcie starych funkcji: `openTeacherSchedule`, `openRoomSchedule`, `openSubjectDetail`, `openFreeRoomsModal`, `onSearchInput`, `loadCrossRefData`, `openCrossModal`, `closeCrossModal`.
- Inicjalizacja modułu:
  ```javascript
  CrossRef.UI.init({
    elements: {
      modal: elements.crossModal,
      title: elements.crossModalTitle,
      badge: elements.crossModalBadge,
      body: elements.crossModalBody,
      searchInput: elements.searchInput,
      searchResults: elements.searchResults,
      clearSearchBtn: elements.clearSearchBtn
    },
    scheduleEngine: engine
  });
  ```
- Delegacja zdarzeń w siatce planu (`click` na salę, wykładowcę, przedmiot) wywołuje odpowiednio `CrossRef.UI.openRoom(...)`, `CrossRef.UI.openTeacher(...)`, `CrossRef.UI.openSubject(...)`.

---

### D8 — Rejestracja assetów i wersjonowanie cache

- W `web/index.html`: dodanie `<script src="js/cross-reference.js?v=3.10"></script>` przed `app.js`.
- Podbicie wersji `app.js?v=3.10` oraz `schedule-engine.js?v=3.10`.
- W `web/sw.js`: podbicie `CACHE_NAME = 'plan-umg-v3.10'` oraz dodanie `'./js/cross-reference.js'` do `STATIC_ASSETS`.

---

## Testing Decisions

### Hermetyczność testów w `test_cross_reference.js`

Testy jednostkowe w `test_cross_reference.js` nie zależą od zawartości pliku `dist/data/cross_reference.json` (który podczas lokalnych testów może być wygenerowany z flagą `--limit 3`). Testy operują na dedykowanym, hermetycznym obiekcie fixture'a testowego, zawierającym reprezentatywne dane:
- Wykładowcy: `"Boniewicz-Szmyt Katarzyna"`, `"Wawrzyńska Aleksandra"`, `"Daniszewska Małgorzata"`.
- Sale: `"114"`, `"114a"`, `"2"`, `"P1"`, `"Aula"`.
- Przedmioty: z różnymi wariantami skrótów i powiązanymi prowadzącymi.
- Lekcje o typowych i niestandardowych godzinach (np. `10:15 - 11:45`).

### Scenariusze w `test_cross_reference.js`

1. **Wyszukiwarka (`search`)**:
   - Puste zapytanie lub < 2 znaki -> puste wyniki (`[]`).
   - Normalizacja polskich znaków: `"wawrzynska"` znajduje `"Wawrzyńska Aleksandra"`, `"boniewicz"` znajduje `"Boniewicz-Szmyt Katarzyna"`.
   - Niewrażliwość na wielkość liter (`"FizYkA"` -> `"Fizyka"`).
   - Ograniczenie liczby wyników do `limitPerCategory`.
   - Zapytanie `"114"` zwraca zarówno salę `"114"`, jak i `"114a"` (dopasowanie substringowe).
2. **Dostępność sal (`findFreeRooms`)**:
   - Zapytanie w trakcie trwania zajęć -> `isFree: false`, `occupyingClass` zawiera dane przedmiotu.
   - Zapytanie po zajęciach -> `isFree: true`, `occupyingClass: null`, `nextClass` wskazuje kolejne zajęcia w tym dniu lub `null` gdy brak.
   - **Dzień wolny**: data święta lub przerwy (`!scheduleEngine.isTeachingDay`) -> 100% pasujących sal zwraca `isFree: true`, `occupyingClass: null`, `nextClass: null`.
   - **Niedziela lub brak danych**: `resolveBaseDay` zwraca `"ND"` lub `null` -> 100% sal wolnych.
   - **Zamiana dnia**: zapytanie na piątek 13.11 (gdzie `scheduleEngine.resolveBaseDay("2026-11-13") === "ŚR"`) sprawdza zajęcia środowe w salach.
   - **Determinizm "Teraz"**: przekazanie opcji `now: new Date("2026-11-04T09:20:00Z")` (odpowiada 10:20 czasu polskiego, 620 min od północy). Lekcja w fixture o godzinach `10:15 - 11:45` nakłada się na ten punkt -> sala ma `isFree: false`.
   - **Szybki filtr sal**: `filterText = "P"` filtruje sale zawierające literę "p" (np. `"P1"`, `"Pływalnia"`), poprawnie działając od 1 znaku.
3. **Bezpieczeństwo HTML (`escapeHtml` & `renderSlotCard`)**:
   - Ciąg zawierający `<script>alert(1)</script>` lub `" onclick="...` jest poprawnie zamieniany na encje HTML.
   - Przekazanie wartości numerycznej `0` (np. slot `0`) zwraca `"0"`, a nie pusty ciąg `""`.
   - `null` i `undefined` zwracają pusty ciąg `""`.
4. **Obsługa cache i `onUpdate` w `DataService`**:
   - Wstrzyknięty mock `storage` z uszkodzonym JSON nie powoduje błędu (fallback do `fetchFn`).
   - Mock `storage` z nieaktualnym `schemaVersion` unieważnia wpis i pobiera świeże dane z `fetchFn`.
   - Asynchroniczny fetch w tle nadpisuje `storage` nowymi danymi oraz wywołuje callback `onUpdate(freshData)` jeśli został przekazany.

### Kryteria wyjścia (Definition of Done)
- Wszystkie testy `test_cross_reference.js` przechodzą 🟢 (100% PASS).
- Wszystkie dotychczasowe testy (`test_schedule_engine.js` w tym Test 14, `test_calendar.js`, `tests.py`) pozostają zielone 🟢.
- Usunięcie wymienionych funkcji z `web/app.js` (brak ich definicji w pliku).
- Brak błędów w konsoli przeglądarki, działający date picker, wyszukiwarka i modale na `http://localhost:8080/`.

---

## Fazy wdrożenia

| Faza | Zakres | Kryterium wyjścia |
|------|--------|-------------------|
| **1 — Red/Green Engine & DataService** | **Warunek startu: wymaga zamkniętej Fazy 4 z `schedule-engine-refactor` (wersja bazowa `v3.9`).**<br>Stworzyć `test_cross_reference.js` + `web/js/cross-reference.js`; zaimplementować czysty silnik `CrossRef.Engine` (search, findFreeRooms, escapeHtml, renderSlotCard) oraz `CrossRef.DataService` (z mockowaniem storage/fetch/onUpdate) w cyklu TDD | `test_cross_reference.js` 🟢 oraz `test_schedule_engine.js` (z Testem 14) 🟢 |
| **2 — UI & Wyszukiwarka Sal** | Zaimplementować `CrossRef.UI` (modale profilowe, date picker, szybki filtr sal, obsługa klawisza Escape i a11y) | 1. Test Node dla `renderSlotCard` i `escapeHtml` 🟢<br>2. Manualna checklista: otwórz modal, zamknij klawiszem Escape, fokus wraca na kliknięty przycisk, filtr sal zawęża listę live od 1 znaku |
| **3 — Integracja z app.js** | Usunąć wymienione w D7 funkcje z `web/app.js`, podpiąć wywołania do `CrossRef.UI` | Wszystkie testy 🟢, grep w `web/app.js` nie znajduje definicji starych funkcji z D7 |
| **4 — Assety, cache i weryfikacja** | Dodać do `index.html`, podbić `sw.js` do `v3.10`, zsynchronizować `dist/`, manualny test w przeglądarce | Działające modale i selektor daty na `http://localhost:8080/` |
