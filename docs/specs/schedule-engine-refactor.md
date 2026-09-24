# Spec: Schedule Engine — Refaktoryzacja `app.js`

> Status: `ready-for-agent`  
> Data: 2026-09-24  
> Powiązane dokumenty: `implementation_plan.md`, `plan_analysis.md`, `AGENTS.md`

---

## Problem Statement

`web/app.js` to monolit liczący ~2250 linii, który obsługuje równocześnie: renderowanie DOM, logikę kalendarza akademickiego (zamiany dni, przerwy, liczenie spotkań), wyszukiwarkę wolnych sal, instalację PWA oraz zarządzanie stanem. Jest to klasyczny zapach „Divergent Change": zmiana w logice liczenia spotkań otwiera ten sam plik co zmiana w wyglądzie modala subskrypcji.

Konsekwencją jest:
- Logika dziedzinowa (zamiany dni rektorskich, cykle co 2 tygodnie, połowy semestru) jest powielona w co najmniej 3 miejscach: `renderSchedule`, `openFreeRoomsModal`, `openTeacherSchedule`.
- Reguły kalendarza czytają globalną mutowalną zmienną `ACADEMIC_CALENDAR`, co uniemożliwia testowanie w izolacji.
- Każdy bug w logice spotkań (historycznie naprawiane wielokrotnie) wymaga ręcznego śledzenia, czy fix trafił do każdego z miejsc wywołania.

---

## Solution

Wyodrębnić wszystkie reguły dziedzinowe do osobnego modułu `ScheduleEngine` w nowym pliku. Moduł ten jest tworzony metodą factory (`ScheduleEngine.create(academicCalendar)`), przyjmuje dane jako argumenty i zwraca czyste, deterministyczne wyniki. `app.js` staje się wyłącznie modułem UI i zarządzania stanem.

Zakres refaktoryzacji nie zmienia żadnego zachowania widocznego dla użytkownika — jest to czyste przeniesienie logiki za nowy szew (seam).

---

## User Stories

1. Jako programista, chcę, żeby logika liczenia spotkań (numer spotkania, łączna liczba, ostatnie zajęcia) żyła w jednym module, żeby poprawka buga zmieniała jeden plik, a nie szukała wszystkich miejsc wywołania.
2. Jako programista, chcę pisać testy dla reguł kalendarza (zamiana dnia, przerwa świąteczna, cykl co 2 tygodnie) bez potrzeby mockowania DOM ani globalnego stanu.
3. Jako programista, chcę, żeby `test_calendar.js` działał na nowym module silnika, żeby testy dawały pewność że reguły są poprawne niezależnie od sposobu renderowania.
4. Jako programista, chcę, żeby `app.js` był czytelny jako „UI + state" bez wchodzenia w logikę dat akademickich.
5. Jako programista, chcę, żeby wyszukiwarka wolnych sal korzystała z tego samego silnika co renderowanie planu, żeby nie mogła stosować innych reguł dla tych samych danych.
6. Jako programista, chcę, żeby `resolveWeekSchedule` zwracała opisowy obiekt `DayStatus` z polem `status` (normal/holiday/daySwap/break/exam) i `message`, żeby `renderSchedule` nie musiał samodzielnie interpretować dni wolnych.
7. Jako programista, chcę, żeby słowniki `DNI_TYGODNIA` i `DNI_MAP_SUNDAY_FIRST` były własnością silnika i eksportowane, żeby nigdy nie było dwóch kopii z różnymi wartościami.
8. Jako programista, chcę, żeby `test_calendar.js` pozostał zielony przez cały czas migracji (żadnego momentu kiedy testy są zepsute bez powodu domenowego).
9. Jako programista, chcę, żeby `sw.js` zawierał nowy plik w liście precache, żeby PWA działało offline po wdrożeniu.
10. Jako programista, chcę, żeby silnik przyjmował kalendarz akademicki jako argument (nie czytał globala), żeby można było testować scenariusze z dowolnym kalendarzem bez modyfikacji stanu globalnego.
11. Jako programista, chcę, żeby `ResolvedLesson` zwracany przez silnik zawierał pola `isActive`, `meetingNumber`, `totalMeetings`, `isFinalMeeting`, żeby `renderLessonCard` nie musiał wywoływać `getLessonProgress` — mógł tylko odczytać gotowe dane.
12. Jako student korzystający z PWA, chcę żeby refaktoring nie zmienił żadnego widocznego zachowania aplikacji, żeby nie zaskoczyło mnie coś po wdrożeniu.

---

## Implementation Decisions

### D1 — Factory pattern (zamknięte Ryzyko 1)

Moduł udostępnia funkcję `create(academicCalendar)` zamiast klasy. Wywołanie zwraca zamrożony obiekt z metodami. Kalendarz jest zamrożony wewnątrz factory i nigdy nie jest mutowany. `app.js` wywołuje `create` raz po załadowaniu kalendarza z sieci i po awarii sieci (z domyślnym kalendarzem wbudowanym).

### D2 — Typ zwracany przez `resolveWeekSchedule` (zamknięte Ryzyko 4)

Metoda zwraca mapę `{ [DayCode]: DayStatus }`. `DayStatus` zawiera:
- `status`: `"normal" | "holiday" | "daySwap" | "break" | "exam"`
- `message`: tekst dla UI (np. nazwa święta, notatka zamiany dnia)
- `swapNote`, `swapReplaceWith`: szczegóły zamiany dnia (null gdy brak)
- `dateISO`, `dateObj`: data konkretnego dnia
- `lessons`: tablica `ResolvedLesson[]` (pusta jeśli holiday/break/exam)
- `baseDayPreview`: opcjonalna tablica `ResolvedLesson[]` oryginalnych zajęć w dzień zamiany

### D3 — Typ `ResolvedLesson`

Kopia oryginalnego obiektu zajęcia (przez spread) wzbogacona o:
- `isActive` (boolean), `meetingNumber`, `totalMeetings`, `isFinalMeeting` (boolean)
- `sourceDay` (dzień bazowy planu), `lessonDate` (ISO data konkretnego spotkania)

### D4 — Własność słowników (zamknięte Ryzyko 2)

`DNI_TYGODNIA` i `DNI_MAP_SUNDAY_FIRST` przeniesione do silnika i eksportowane jako `ScheduleEngine.DNI_TYGODNIA`. Słowniki prezentacyjne (`DNI_PELNE`, `DNI_DOPELNIACZ`, `DNI_MIEJSCOWNIK`, `DNI_PRZYMIOTNIK`, `DNI_PRZYIMEK`) pozostają wyłącznie w `app.js` — nie dotyczą logiki dziedzinowej.

### D5 — Wzorzec eksportu dla Vanilla JS + Node.js

Plik kończy się:
```js
if (typeof module !== 'undefined') {
  module.exports = ScheduleEngine;
}
```
W przeglądarce silnik jest obiektem globalnym. W `index.html` dołączony tagiem `<script>` przed `app.js`.

### D6 — Ochrona chronionych stref (`AGENTS.md`)

`getLessonMeetingInfo` przeniesiona do silnika z zachowaniem dokładnie tej samej sygnatury i zachowania, w tym:
- Guardy `"Inny"` dla nierozpoznanych nazw dni
- Hard cap `MAX_ITER = 200`
- Guard `isNaN(startDate.getTime())`

### D7 — Tymczasowe aliasy (Faza 3)

W czasie migracji `app.js` zawiera cienkie wrappery delegujące do `engine.*` — pozwala to utrzymać `test_calendar.js` zielonym. Usuwane w Fazie 4.

### D8 — Aktualizacja `sw.js`

`'./js/schedule-engine.js'` dodany do tablicy `STATIC_ASSETS` w `sw.js`. Wersja cache (`CACHE_NAME`) musi być podbita (np. `plan-umg-v3.9`).

---

## Testing Decisions

### Co jest dobrym testem

Test uderza w interfejs silnika (`engine.getLessonMeetingInfo(...)`, `engine.resolveWeekSchedule(...)`), nie w wewnętrzne implementacje (`getLessonSemesterPeriod`, `isTeachingDay`). Testujemy zachowanie obserwowalne z zewnątrz szwu.

### Moduły testowane

- **`test_schedule_engine.js`** (nowy): pełne pokrycie interfejsu silnika. Priorytetowe scenariusze:
  - Dzień wolny → `DayStatus.status === "holiday"`, `lessons === []`
  - Zamiana dnia → `status === "daySwap"`, `swapReplaceWith` ustawione, zajęcia z podmieniowego dnia
  - Przerwa dydaktyczna → `status === "break"`, `lessons === []`
  - Sesja egzaminacyjna → `status === "exam"`, `lessons === []`
  - Normalny tydzień → `status === "normal"`, spotkanie policzone poprawnie
  - Zajęcia co 2 tygodnie (nieparzyste/parzyste)
  - Połowa semestru (1. i 2.)
  - `getRoomOccupancyAt` z aktywną i nieaktywną lekcją

- **`test_calendar.js`** (istniejący): migrowany w Fazie 4 tak, żeby importował z silnika zamiast z `app.js`. Zachowuje wszystkie 20 dotychczasowych asercji.

- **`tests.py`** (Python): nie dotknięty — refaktoryzacja jest wyłącznie JS-owa.

### Prior art

Wzorzec testowy: `test_calendar.js` Tests 1–20. Każdy test definiuje fixture (obiekt zajęcia + datę) i sprawdza konkretne pole wyniku (`result.active`, `result.meetingNum`).

---

## Out of Scope

- Refaktoryzacja modali cross-reference (Candidate 2 z raportu architektonicznego) — osobna decyzja.
- Ekstrakcja Platform Adapter (PWA install, iOS detection) — Candidate 3 z raportu, oznaczony jako Speculative.
- Zmiany w wyglądzie aplikacji (`style.css`).
- Zmiany w `scrapper.py`, `build_static.py` — refaktoryzacja jest wyłącznie frontend JS.
- Zmiana danych wyjściowych JSON generowanych przez build (kontrakt Python ↔ JS nienaruszony).

---

## Further Notes

- Zamiana `ACADEMIC_CALENDAR` z globala na argument silnika usuwa jedną z ostatnich globalnych zmiennych mutowalnych w `app.js`. Po tej refaktoryzacji jedynym globalnym stanem pozostanie obiekt `state` (plan, grupa, weekOffset, selectedDayTab itd.).
- Refaktoryzacja nie zmienia kontraktu Kontrakt 1 (sanityzacja nazwy grupy) z `AGENTS.md` — `getSafeGroupName` pozostaje w `app.js`.
- `getAcademicInfoForWeek` (używana przez `updateWeekDisplay` i `updateCalendarNotice`) jest kandydatem do silnika, ale może też pozostać w `app.js` jako funkcja przyjmująca `engine` jako argument — do decyzji agenta wdrażającego (oba podejścia są poprawne).
