# Spec: Cross-Reference Modals & Wyszukiwarka Wolnych Sal

> Status: `ready-for-implementation`  
> Data: 2026-09-24 (v2 — po szczegółowej recenzji tofix.txt)  
> Powiązane dokumenty: `docs/specs/schedule-engine-refactor.md`, `TODO.md`, `AGENTS.md`

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

Wyodrębnić powiązania krzyżowe i wyszukiwarkę sal do dedykowanego modułu `web/js/cross-reference.js`. Moduł jest zależny od ukończonego modułu `ScheduleEngine` (korzysta z jego publicznych metod: `isTeachingDay`, `getRoomOccupancyAt`, `formatDateISO`, `getMonday`).

Moduł dzieli się na dwa poziomy:
1. **Czysta warstwa logiki i zapytań (`CrossRef.Engine`)**:
   - Wyszukiwanie pełnotekstowe z normalizacją polskich znaków diakrytycznych (`ą->a, ł->l, ś->s` itp.) i case-insensitive.
   - Wyznaczanie dostępności sal (`findFreeRooms`) w oparciu o pełną bazę wszystkich planów UMG (`cross_reference.json`) oraz instancję `ScheduleEngine`.
   - Zależność datowa oparta wyłącznie o `dateISO` (zamiany dnia wyliczane wewnętrznie).
   - Wstrzykiwalny czas (`options.now`) dla determinizmu testów przycisku "Teraz".
2. **Warstwa widoku i zarządzania danymi (`CrossRef.UI`)**:
   - Centralne pobieranie i cache'owanie `cross_reference.json` w `localStorage` z cichym odświeżaniem w tle i bezpieczną obsługą błędów.
   - Uniwersalny, bezpieczny renderer kart zajęć `renderSlotCard` z obowiązkowym `escapeHtml` przeciw XSS.
   - Nowy interfejs wyszukiwarki wolnych sal z **selektorem daty (date picker / szybkie przyciski dni)** oraz **szybkim filtrem tekstowym sal**.
   - Dostępność (a11y): `role="dialog"`, `aria-modal="true"`, zamykanie klawiszem `Escape`, focus trap i przywracanie fokusu.

---

## User Stories

1. Jako student, chcę sprawdzić dostępność wolnych sal na dowolny wybrany dzień semestru, wybierając datę z natywnego date pickera lub szybkich przycisków (`Dziś`, `Jutro`).
2. Jako student, chcę móc wpisać fragment nazwy sali (np. "114", "aula", "P") w polu szybkiego filtra, aby natychmiast zawęzić listę bez przewijania.
3. Jako student, chcę widzieć, która sala jest wolna „teraz” (bieżąca godzina) oraz do której godziny pozostaje wolna (następne zajęcia).
4. Jako student, chcę kliknąć salę w kafelku zajęć i natychmiast zobaczyć tygodniowy rozkład zajęć w tej sali.
5. Jako student, chcę kliknąć nazwisko prowadzącego i zobaczyć jego pełny tygodniowy plan zajęć ze wszystkimi grupami na UMG.
6. Jako student, chcę wpisać w wyszukiwarkę w menu bocznym nazwisko bez polskich znaków (np. "lukasz", "boniewicz") i otrzymać właściwe podpowiedzi ("Łukasz", "Boniewicz-Szmyt").
7. Jako student, chcę, aby wyszukiwarka przedmiotów rozumiała warianty skrótowe i pełne nazwy z `raw_variants`.
8. Jako student w dzień wolny od zajęć (święto, przerwa, sesja egzaminacyjna), chcę zobaczyć informację, że wszystkie sale są wolne przez cały dzień.
9. Jako programista, chcę, aby logika filtrowania i zapytań o sale była czystą funkcją bez DOM, testowalną w Node.js (`test_cross_reference.js`).
10. Jako programista, chcę, aby cały kod HTML generowany z danych zewnętrznych był bezpiecznie escapowany, uniemożliwiając ataki XSS.
11. Jako programista, chcę, aby `app.js` nie musiał wiedzieć, jak pobierany jest `cross_reference.json` ani jak wyglądają modale szczegółów.
12. Jako użytkownik czytnika ekranu lub klawiatury, chcę zamykać modal klawiszem `Escape`, mieć uwięziony fokus wewnątrz otwartego modalu i powrócić fokusem do klikniętego przycisku po zamknięciu.

---

## Implementation Decisions

### D1 — Wzorzec modułu i UMD

Moduł eksportowany w standardzie UMD/IIFE — spójnym z `web/js/schedule-engine.js`:

```javascript
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.CrossRef = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Prywatne stałe, silnik i UI
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
   - Zapytanie "sala 114" dopasowuje zarówno frazę "sala 114", jak i sam numer "114".
   - Puste zapytanie (`""` lub `< 2` znaki) zwraca puste tablice wyników.

2. **Dostępność wolnych sal (`findFreeRooms`)**:
   ```javascript
   CrossRef.Engine.findFreeRooms(crossRefData, {
     dateISO: string,             // np. "2026-11-13" (JEDYNE źródło prawdy o dacie)
     queryRange: { start: number, end: number }, // minuty [start, end)
     scheduleEngine: object,      // instancja ScheduleEngine
     filterText?: string,         // opcjonalny filtr tekstowy sali (np. "aula", "114")
     now?: Date                   // wstrzykiwalny czas dla determinizmu
   })
     → Array<{
         room: string,
         isFree: boolean,
         occupyingClass: object | null,
         nextClass: object | null
       }>
   ```
   - **Brak parametru `dayCode`**: Silnik sam wyznacza dzień bazowy z `dateISO` (dzień tygodnia z daty), a następnie sprawdza w `academicCalendar.daySwaps[dateISO]`, czy nastąpiła zamiana dnia rektorskiego (np. piątek 13.11 realizuje plan ze środy `ŚR`).
   - **Dni wolne od zajęć**: Jeśli `!scheduleEngine.isTeachingDay(dateISO)` (święto, przerwa dydaktyczna lub sesja egzaminacyjna):
     - Wszystkie sale zwracają: `{ room, isFree: true, occupyingClass: null, nextClass: null }`.
   - **Konwencja zakresu godzin**: `queryRange` operuje na minutach w konwencji półotwartej `[start, end)`. Jeśli zajęcia kończą się o 09:30 (570 min), a kolejne zaczynają o 09:30, zapytanie o slot 09:30–11:00 nie traktuje poprzednich zajęć jako kolizji.

3. **Standardowe sloty godzinowe UMG (Stała dziedzinowa)**:
   ```javascript
   CrossRef.Engine.STANDARD_SLOTS = [
     { label: "08:00 - 09:30", start: 480, end: 570 },
     { label: "09:45 - 11:15", start: 585, end: 675 },
     { label: "11:30 - 13:00", start: 690, end: 780 },
     { label: "13:45 - 15:15", start: 825, end: 915 },
     { label: "15:30 - 17:00", start: 930, end: 1020 },
     { label: "17:15 - 18:45", start: 1035, end: 1125 },
     { label: "19:00 - 20:30", start: 1140, end: 1230 }
   ];
   ```

---

### D4 — Bezpieczeństwo i renderer HTML (`renderSlotCard` & `escapeHtml`)

Każda dana pochodząca z bazy planów (`subject`, `teacher`, `room`, `groups`, `plan_name`) jest rygorystycznie sanityzowana funkcją `escapeHtml`:
```javascript
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

Zunifikowany szablon `renderSlotCard`:
- Jedno źródło prawdy dla widoków sali, wykładowcy i przedmiotu.
- Testowany jednostkowo pod kątem obecności poprawnych klas CSS i odporności na znaki specjalne (`<script>`, `"`, `&`).

---

### D5 — Zarządzanie danymi i cache (`CrossRef.DataService`)

Wszystkie operacje I/O na `cross_reference.json` przenoszą się do modułu:
- `CrossRef.DataService.load(options)`:
  1. Sprawdza pamięć podręczną w `localStorage` (`umg_cross_ref_cache`).
  2. Jeśli dane istnieją w cache: natychmiast zwraca zcache'owane dane i w tle asynchronicznie odpytuje `fetch("data/cross_reference.json")`.
  3. Jeśli pobrano świeższe dane: cicho aktualizuje `localStorage` (zabezpieczone blokiem `try/catch` na wypadek `QuotaExceededError`).
  4. Jeśli brak sieci / błąd JSON: zwraca dane z cache'a lub `null` w przypadku całkowitej niedostępności.

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

### Scenariusze w `test_cross_reference.js`

1. **Wyszukiwarka (`search`)**:
   - Puste zapytanie lub < 2 znaki -> puste wyniki.
   - Zapytanie bez polskich znaków: `"lukasz"` znajduje `"Daniszewska Małgorzata"` / `"Łukasz"`.
   - Niewrażliwość na wielkość liter (`"FizYkA"` -> `"Fizyka"`).
   - Ograniczenie liczby wyników do `limitPerCategory`.
   - Obsługa `"sala 114"` oraz `"114"` zwraca rekord sali 114.
2. **Dostępność sal (`findFreeRooms`)**:
   - Zapytanie w trakcie trwania zajęć -> `isFree: false`, `occupyingClass` zawiera dane przedmiotu.
   - Zapytanie po zajęciach -> `isFree: true`, `occupyingClass: null`, `nextClass` wskazuje kolejne zajęcia w tym dniu lub `null` gdy brak.
   - **Dzień wolny**: data święta lub przerwy (`!scheduleEngine.isTeachingDay`) -> 100% sal ma `isFree: true`, `occupyingClass: null`, `nextClass: null`.
   - **Zamiana dnia**: zapytanie na piątek 13.11 (realizujący środę) sprawdza zajęcia środowe w salach.
   - **Determinizm "Teraz"**: przekazanie opcji `now` o godzinie 10:20 sprawdza slot 10:15–11:45.
3. **Bezpieczeństwo HTML (`escapeHtml` & `renderSlotCard`)**:
   - Ciąg zawierający `<script>alert(1)</script>` lub `" onclick="...` jest poprawnie zamieniany na encje HTML.
4. **Obsługa błędów cache**:
   - Uszkodzony JSON w `localStorage` nie powoduje błędu krytycznego (fallback do pobierania sieciowego).

### Kryteria wyjścia (Definition of Done)
- Wszystkie testy `test_cross_reference.js` przechodzą 🟢 (100% PASS).
- Wszystkie dotychczasowe testy (`test_schedule_engine.js`, `test_calendar.js`, `tests.py`) pozostają zielone 🟢.
- Usunięcie wymienionych funkcji z `web/app.js`.
- Brak błędów w konsoli przeglądarki, działający date picker, wyszukiwarka i modale na `http://localhost:8080/`.

---

## Fazy wdrożenia

| Faza | Zakres | Kryterium wyjścia |
|------|--------|-------------------|
| **1 — Red/Green Engine** | Stworzyć `test_cross_reference.js` + moduł `web/js/cross-reference.js`; zaimplementować czysty silnik `CrossRef.Engine` (search, findFreeRooms, escapeHtml, renderSlotCard) w cyklu TDD | `test_cross_reference.js` 🟢 |
| **2 — UI & Wyszukiwarka Sal** | Zaimplementować `CrossRef.UI` (modale profilowe, date picker, szybki filtr sal, obsługa klawisza Escape i a11y) | Przetestowane komponenty UI |
| **3 — Integracja z app.js** | Usunąć stare implementacje z `web/app.js`, podpiąć wywołania do `CrossRef.UI` | Wszystkie testy 🟢, brak duplikacji |
| **4 — Assety, cache i weryfikacja** | Dodać do `index.html`, podbić `sw.js` do `v3.10`, zsynchronizować `dist/`, manualny test w przeglądarce | Działające modale i selektor daty na `http://localhost:8080/` |
