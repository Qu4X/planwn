# Spec: Cross-Reference Modals & Wyszukiwarka Wolnych Sal

> Status: `ready-for-implementation`  
> Data: 2026-09-24  
> Powiązane dokumenty: `architecture-review-1789844861.html`, `docs/specs/schedule-engine-refactor.md`, `TODO.md`, `AGENTS.md`

---

## Problem Statement

W `web/app.js` znajduje się ~550 linii kodu odpowiedzialnego za powiązania krzyżowe (Cross-Reference) oraz wyszukiwarkę wolnych sal:
1. **Duplikacja kodu widoków**: Modale planu wykładowcy (`openTeacherSchedule`), obłożenia sali (`openRoomSchedule`) oraz szczegółów przedmiotu (`openSubjectDetail`) budują niemal identyczne struktury HTML (`modal-day-group`, `modal-slot-item`, plakietki cykli, grupy).
2. **Ograniczenia wyszukiwarki wolnych sal**:
   - Sprawdzanie sal bazowało na wyliczaniu daty z bieżącego tygodnia (`state.weekOffset`), uniemożliwiając studentowi swobodny wybór dowolnego dnia semestru z kalendarza.
   - Brak filtrowania sal wg budynków lub pięter (duża lista sal wymaga uciążliwego przewijania na telefonie).
3. **Monolityczność `app.js`**: Logika wyszukiwania w sidebarze (`onSearchInput`), zarządzania cache'em `cross_reference.json` w `localStorage` oraz orkiestracja modali zaciemniają główny cel `app.js`, którym jest nawigacja i siatka planu.

---

## Solution

Wyodrębnić powiązania krzyżowe i wyszukiwarkę sal do dedykowanego modułu `web/js/cross-reference.js`. 

Moduł dzieli się na dwa wyraźne poziomy:
1. **Czysta warstwa logiki i zapytań (`CrossRefEngine`)**:
   - Wyszukiwanie pełnotekstowe (wykładowcy, sale, przedmioty + aliasy).
   - Wyznaczanie dostępności sal (`findFreeRooms`) w oparciu o pełną bazę wszystkich planów UMG (`cross_reference.json`) oraz silnik `ScheduleEngine`.
   - Czyste funkcje pobierania i sortowania planów dla sal, prowadzących i przedmiotów.
2. **Współdzielony renderer komponentów UI (`CrossRefUI`)**:
   - Uniwersalna funkcja renderująca harmonogram bloków godzinowych.
   - Nowy interfejs wyszukiwarki wolnych sal z **selektorem daty (date picker / szybkie przyciski dni)** oraz **filtrem budynków**.
   - Zarządzanie modalem `cross-modal` (otwieranie, focus trap, zamykanie).

W rezultacie `web/app.js` zmniejszy się o kolejne **~500 linii**, a student zyska potężną i szybką wyszukiwarkę wolnych sal na całej uczelni.

---

## User Stories

1. Jako student, chcę sprawdzić dostępność wolnych sal na dowolny wybrany dzień semestru (np. za 3 tygodnie), wybierając datę z selektora, a nie tylko dla bieżącego tygodnia.
2. Jako student, chcę przefiltrować wolne sale według budynku (np. Budynek Główny A, Nawigacja B, Siłownia/Sport), żeby nie biegać po całym kampusie.
3. Jako student, chcę widzieć, która sala jest wolna „teraz” (bieżąca godzina) oraz do której godziny pozostaje wolna (następne zajęcia).
4. Jako student, chcę kliknąć salę w kafelku zajęć i natychmiast zobaczyć tygodniowy rozkład zajęć w tej sali.
5. Jako student, chcę kliknąć nazwisko prowadzącego i zobaczyć jego pełny tygodniowy plan zajęć ze wszystkimi grupami na UMG.
6. Jako student, chcę wpisać w wyszukiwarkę w menu bocznym nazwisko, salę lub przedmiot i otrzymać natychmiastowe podpowiedzi wyników.
7. Jako student, chcę, aby wyszukiwarka przedmiotów rozumiała oficjalne kody i nazwy ze słownika `wn_subjects_catalog.json`.
8. Jako programista, chcę, aby logika filtrowania i zapytań o sale była czystą funkcją bez DOM, możliwą do testowania w Node.js (`test_cross_reference.js`).
9. Jako programista, chcę, aby formatowanie bloków zajęć w modalach sali i wykładowcy korzystało z jednego szablonu, aby zmiany w CSS nie wymagały poprawek w 3 miejscach.
10. Jako programista, chcę, aby dane `cross_reference.json` były pobierane raz i bezpiecznie cache'owane w `localStorage` z cichym odświeżaniem w tle.
11. Jako programista, chcę, aby `app.js` delegował zdarzenia kliknięć w prowadzącego/salę bezpośrednio do `CrossRefUI`.
12. Jako użytkownik offline, chcę, aby raz załadowana baza powiązań działała w trybie offline w PWA.

---

## Implementation Decisions

### D1 — Struktura modułu `web/js/cross-reference.js`

Moduł eksportowany w standardzie UMD/IIFE (identycznie jak `schedule-engine.js`), aby działać w przeglądarce (`window.CrossRef`) oraz w testach Node.js:

```js
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.CrossRef = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Implementacja
});
```

Moduł udostępnia:
- `CrossRef.Engine`: czyste metody wyszukiwania, wyliczania wolnych sal i transformacji danych.
- `CrossRef.UI`: orkiestracja widoków, obsługa zdarzeń i wstrzykiwanie HTML do `#cross-modal`.

---

### D2 — Interfejs `CrossRef.Engine` (warstwa testowalna)

Kompletne sygnatury metod czystych:

```javascript
// 1. Wyszukiwarka w menu bocznym
CrossRef.Engine.search(crossRefData, query: string, limitPerCategory = 5)
  → {
      teachers: Array<{ name: string, classCount: number }>,
      rooms: Array<{ room: string }>,
      subjects: Array<{ name: string, teachers: string[] }>
    }

// 2. Dostępność wolnych sal (globalna dla całej bazy)
CrossRef.Engine.findFreeRooms(crossRefData, {
  dateISO: string,             // np. "2026-11-04"
  dayCode: string,             // np. "ŚR" (uwzględnia zamiany dnia)
  queryRange: { start: number, end: number }, // minuty od północy, np. { start: 480, end: 570 }
  scheduleEngine: object,      // instancja ScheduleEngine
  buildingFilter?: string      // opcjonalny filtr budynku np. "A", "B", "C"
})
  → Array<{
      room: string,
      isFree: boolean,
      occupyingClass: object | null,
      nextClass: object | null
    }>

// 3. Agregacja planu prowadzącego wg dni
CrossRef.Engine.getTeacherScheduleByDay(crossRefData, teacherName: string)
  → { [dayCode]: Array<TeacherEntry> }

// 4. Agregacja planu sali wg dni
CrossRef.Engine.getRoomScheduleByDay(crossRefData, roomName: string)
  → { [dayCode]: Array<RoomEntry> }

// 5. Pobieranie listy budynków (dla filtrów UI)
CrossRef.Engine.extractBuildings(roomList: string[])
  → Array<{ id: string, name: string, count: number }>
```

---

### D3 — Usprawnienia Wyszukiwarki Wolnych Sal w UI

W widoku modala wolnych sal (`CrossRef.UI.openFreeRoomsModal`):
1. **Selektor daty i slotu**:
   - Szybkie przełączniki: `Dziś`, `Jutro` oraz natywny `<input type="date">` ograniczony do ram semestru.
   - Wybór godziny: przycisk `Teraz (bieżąca godzina)` oraz lista standardowych bloków zajęć UMG (08:00–09:30, 09:45–11:15, 11:30–13:00, 13:45–15:15, 15:30–17:00, 17:15–18:45, 19:00–20:30).
2. **Filtr budynków / skrzydeł**:
   - Przyciski pills (np. `Wszystkie`, `Budynek A`, `Budynek B / Nawigacja`, `Inne`).
3. **Wyświetlanie statusu**:
   - Wolne sale wyróżnione zielonym akcentem, informacja: *„Wolna do 13:45 (następnie: Nawigacja)”* lub *„Wolna do końca dnia”*.
   - Zajęte sale opcjonalnie zwijane/rozwijane na dole listy.

---

### D4 — Zunifikowany szablon kart zajęć (`renderSlotCard`)

Zamiast powielać kod HTML w trzech miejscach, moduł posiada jeden generator karty zajęć w modalu:

```javascript
function renderSlotCard({
  hours,
  subject,
  room,
  roomBtn = true,
  teachers = [],
  groups = [],
  planName = "",
  cycleBadges = ""
}) → string (HTML)
```

Gwarantuje to spójność wizualną (CSS classes) i eliminuje 150 linii duplikacji.

---

### D5 — Odchudzenie `web/app.js`

Z `app.js` usuwamy:
- `loadCrossRefData()` (~35 linii)
- `openCrossModal()`, `closeCrossModal()` (~15 linii)
- `onSearchInput()` (~110 linii)
- `openTeacherSchedule()` (~95 linii)
- `openRoomSchedule()` (~90 linii)
- `openSubjectDetail()` (~80 linii)
- `openFreeRoomsModal()` (~160 linii)

W `app.js` pozostaje jedynie delegacja kliknięć i inicjalizacja:
```javascript
CrossRef.UI.init({
  elements: {
    modal: elements.crossModal,
    title: elements.crossModalTitle,
    badge: elements.crossModalBadge,
    body: elements.crossModalBody
  },
  scheduleEngine: engine,
  loadCrossRefData: () => loadCrossRefData()
});
```

---

### D6 — Rejestracja w `index.html` i `sw.js`

- W `web/index.html`: dodanie `<script src="js/cross-reference.js?v=3.9"></script>` przed `app.js`.
- W `web/sw.js`: dodanie `'./js/cross-reference.js'` do `STATIC_ASSETS`.
- W `build_static.py`: katalog `web/js/` jest już automatycznie kopiowany do `dist/js/` (dodane w poprzednim kroku).

---

## Testing Decisions

### Strategia testów TDD (`test_cross_reference.js`)

Utworzenie dedykowanego pliku testowego `test_cross_reference.js` w Node.js, testującego czysty silnik `CrossRef.Engine`:
1. **Wyszukiwanie**:
   - Zapytanie o fragment nazwiska prowadzącego zwraca pasujące wyniki z liczbą zajęć.
   - Zapytanie o salę (np. "101", "sala 101") zwraca poprawny rekord.
   - Zapytanie o przedmiot z uwzględnieniem `raw_variants` znajduje właściwy rekord.
2. **Dostępność sal (`findFreeRooms`)**:
   - Sala z zajęciami w danym slocie zwraca `isFree: false` z poprawnym obiektem `occupyingClass`.
   - Sala wolna w danym slocie zwraca `isFree: true` z polem `nextClass` wskazującym kolejne zajęcia tego dnia.
   - Zapytanie w dzień wolny od zajęć (święto lub przerwa z `scheduleEngine`) zwraca wszystkie sale jako wolne.
   - Prawidłowe działanie z uwzględnieniem zamiany dnia rektorskiego.
3. **Ekstrakcja budynków**:
   - Podział listy sal (`A-101`, `B-204`, `Aula 1`, `312`) na spójne kategorie budynków.

### Kryteria wyjścia (Definition of Done)
- `node test_cross_reference.js` -> 100% 🟢
- `node test_schedule_engine.js` -> 100% 🟢
- `node test_calendar.js` -> 100% 🟢
- `.venv\Scripts\python.exe tests.py` -> 100% 🟢
- Brak błędów w konsoli przeglądarki, działający date picker i filtry w modalu wolnych sal.

---

## Out of Scope

- Zmiany w strukturze pliku JSON `cross_reference.json` generowanego w Pythonie (`build_static.py`).
- Scrapowanie dodatkowych danych o dyżurach wykładowców ze stron uczelni (wymaga oddzielnego zadania w Pythonie).
- Refaktoryzacja Platform Adapter (PWA/iOS) — zgodnie z planem pozostaje na później.

---

## Fazy wdrożenia

| Faza | Zakres | Kryterium wyjścia |
|------|--------|-------------------|
| **1 — Red/Green Engine** | Stworzyć `test_cross_reference.js` + szkielet `web/js/cross-reference.js`; zaimplementować czysty silnik `CrossRef.Engine` test po teście | `test_cross_reference.js` 🟢 |
| **2 — Shared UI Components & Free Rooms** | Wdrożyć `CrossRef.UI` z selektorem daty i filtrami sal w `web/js/cross-reference.js` | Działający modal wolnych sal i date picker |
| **3 — Integracja z app.js** | Usunąć powielone modale i wyszukiwarkę z `web/app.js`, przekierować wywołania do `CrossRef.UI` | Wszystkie testy 🟢, `app.js` odchudzony o ~500 linii |
| **4 — Assety i weryfikacja** | Dodać skrypt do `index.html`, zaktualizować `sw.js`, zsynchronizować `dist/`, test w przeglądarce | Działające modale i wyszukiwarka na `http://localhost:8080/` |
