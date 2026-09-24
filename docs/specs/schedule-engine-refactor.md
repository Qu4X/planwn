# Spec: Schedule Engine — Refaktoryzacja `app.js`

> Status: `ready-for-agent`  
> Data: 2026-09-24 (v3 — po dwóch rundach peer review)  
> Powiązane dokumenty: `implementation_plan.md`, `plan_analysis.md`, `AGENTS.md`

---

## Problem Statement

`web/app.js` to monolit liczący ~2250 linii, który obsługuje równocześnie: renderowanie DOM, logikę kalendarza akademickiego (zamiany dni, przerwy, liczenie spotkań), wyszukiwarkę wolnych sal, instalację PWA oraz zarządzanie stanem. Jest to klasyczny zapach „Divergent Change": zmiana w logice liczenia spotkań otwiera ten sam plik co zmiana w wyglądzie modala subskrypcji.

Konsekwencją jest:
- Logika dziedzinowa (zamiany dni rektorskich, cykle co 2 tygodnie, połowy semestru) jest powielona w co najmniej 3 miejscach: `renderSchedule`, `openFreeRoomsModal`, `openTeacherSchedule`.
- Reguły kalendarza czytają globalną mutowalną zmienną `ACADEMIC_CALENDAR`, co uniemożliwia testowanie w izolacji.
- Każdy bug w logice spotkań (historycznie naprawiany wielokrotnie) wymaga ręcznego śledzenia, czy fix trafił do każdego z miejsc wywołania.

---

## Solution

Wyodrębnić wszystkie reguły dziedzinowe do osobnego modułu `ScheduleEngine` w nowym pliku. Moduł tworzony jest przez factory `ScheduleEngine.create(academicCalendar, options?)`, przyjmuje dane jako argumenty i zwraca czyste, deterministyczne wyniki. `app.js` staje się wyłącznie modułem UI i zarządzania stanem.

Zakres refaktoryzacji nie zmienia żadnego zachowania widocznego dla użytkownika.

---

## User Stories

1. Jako programista, chcę, żeby logika liczenia spotkań żyła w jednym module, żeby poprawka buga zmieniała jeden plik.
2. Jako programista, chcę pisać testy dla reguł kalendarza bez potrzeby mockowania DOM ani globalnego stanu.
3. Jako programista, chcę, żeby `test_calendar.js` działał na nowym module silnika, żeby testy dawały pewność niezależnie od sposobu renderowania.
4. Jako programista, chcę, żeby `app.js` był czytelny jako „UI + state" bez wchodzenia w logikę dat akademickich.
5. Jako programista, chcę, żeby wyszukiwarka wolnych sal korzystała z tego samego silnika co renderowanie planu, żeby nie mogła stosować innych reguł dla tych samych danych.
6. Jako programista, chcę, żeby `resolveWeekSchedule` zwracała `DayStatus` z polem `status` i `message`, żeby `renderSchedule` nie musiał samodzielnie interpretować dni wolnych.
7. Jako programista, chcę, żeby słowniki `DNI_TYGODNIA` i `DNI_MAP_SUNDAY_FIRST` były własnością silnika, żeby nigdy nie było dwóch kopii z różnymi wartościami.
8. Jako programista, chcę, żeby `test_calendar.js` pozostał zielony przez cały czas migracji.
9. Jako programista, chcę, żeby `sw.js` zawierał nowy plik w liście precache, żeby PWA działało offline po wdrożeniu.
10. Jako programista, chcę, żeby silnik przyjmował kalendarz jako argument (nie czytał globala), żeby można było testować scenariusze z dowolnym kalendarzem.
11. Jako programista, chcę, żeby `ResolvedLesson` zawierał gotowe pola (`meetingNumber`, `isFinalMeeting`), żeby `renderLessonCard` mógł je tylko odczytać.
12. Jako student korzystający z PWA, chcę, żeby refaktoring nie zmienił żadnego widocznego zachowania aplikacji.

---

## Fazy wdrożenia

| Faza | Zakres | Kryterium wyjścia |
|------|--------|-------------------|
| **1/2 — Red/Green loop** | Stworzyć szkielet `web/js/schedule-engine.js` (puste metody) + `test_schedule_engine.js`; implementować test po teście w cyklu: napisz test → 🔴 → zaimplementuj → 🟢 → następny | `test_schedule_engine.js` 🟢 w całości; `test_calendar.js` 🟢 przez cały czas |
| **3 — Refactor** | Stworzyć `engine` w `app.js` (`ScheduleEngine.create(...)`); podmienić wywołania po jednej metodzie z wrapperami; manualny przegląd w przeglądarce po każdej podmianie | Oba pliki testowe 🟢; brak regresji w UI |
| **4 — Cleanup** | Usunąć wrappery; zmigrować `test_calendar.js` na import z silnika; podbić `CACHE_NAME`; dodać do `STATIC_ASSETS` i `index.html` | `test_calendar.js` i `test_schedule_engine.js` 🟢; `tests.py` 🟢 |


---

## Implementation Decisions

### D1 — Factory pattern + injectable `now` + głęboka kopia kalendarza

Silnik tworzony przez `ScheduleEngine.create(academicCalendar, options?)`.

- `options.now?: Date` — wstrzykiwalna "dzisiaj". Domyślnie `new Date()`. Używana wszędzie, gdzie silnik potrzebuje aktualnej daty. Bez tego testy zależałyby od zegara systemowego.
- Kalendarz kopiowany przez `structuredClone(academicCalendar)` wewnątrz factory. `structuredClone` tworzy głęboką kopię — żadna mutacja z zewnątrz nie dosięgnie kopii wewnątrz silnika. `Object.freeze` jest **celowo pomijany**: freeze jest płytki (nie chroni zagnieżdżonych obiektów) i daje fałszywe poczucie bezpieczeństwa. Wystarczy głęboka kopia. Silnik nigdy nie zwraca referencji do wewnętrznego kalendarza.
- Wszystkie porównania dat: wyłącznie przez stringi `YYYY-MM-DD`. Iteracja tygodniowa (`currentMon.setDate(+7)`) normalizuje czas do `00:00:00` UTC przed porównaniem, żeby DST nie przesuwało daty.


### D2 — Interfejs metod instancji silnika (kompletne sygnatury)

```
engine.resolveWeekSchedule(targetMonday: Date, rawSchedule: object, options?: { baseDayPreview?: boolean })
  → { [DayCode]: DayStatus }

engine.getLessonMeetingInfo(lesson, baseDay: string, targetMonday: Date, targetDate?: string)
  → { active: boolean, meetingNum: number, total: number }

engine.getLessonProgress(lesson, baseDay: string, targetMonday: Date, targetDate?: string)
  → { text: string, title: string, isFinal: boolean } | null

engine.getRoomOccupancyAt(daySchedule: object[], queryRange: { start: number, end: number }, targetDateISO: string, baseDay: string)
  → { isFree: boolean, occupyingClass: object|null, nextClass: object|null }

engine.buildScheduleIndex(plansMap: { [planId]: { [dayCode]: object } })
  → { [roomName]: { [dayCode]: object[] } }

engine.isTeachingDay(iso: string) → boolean
engine.getMonday(d: Date) → Date
engine.formatDateISO(date: Date) → string
```

> **Uwaga o nazewnictwie:** `getRoomOccupancyAt` to jedyna nazwa tej metody w całej spec i kodzie. Poprzednia nazwa `resolveRoomOccupancyForDay` (z pierwszego projektu planu) jest porzucona.

> **Narzędzia pomocnicze:** `isTeachingDay`, `getMonday`, `formatDateISO` są wystawione publicznie, bo `app.js` ich używa bezpośrednio. Traktowane jako implementation detail silnika — nie podlegają osobnym testom. Testowane pośrednio przez scenariusze `resolveWeekSchedule` i `getLessonMeetingInfo`.

### D3 — Typ `DayStatus`

```
{
  status: "normal" | "holiday" | "daySwap" | "break" | "exam",
  message: string | null,
  swapNote: string | null,
  swapReplaceWith: string | null,    // kod dnia np. "ŚR", null gdy brak
  dateISO: string,
  dateObj: Date,
  lessons: ResolvedLesson[],         // zawsze [] gdy status !== "normal"
  baseDayPreview: ResolvedLesson[] | null,  // patrz D5
}
```

**Jedno źródło prawdy:** `DayStatus.status !== "normal"` implikuje `lessons: []`. `ResolvedLesson.isActive` dotyczy wyłącznie aktywności w ramach cyklu (co 2 tygodnie, połowa semestru) — nigdy nie koduje informacji o dniu wolnym.

### D4 — Tabela priorytetów `DayStatus.status`

Gdy dzień spełnia więcej niż jeden warunek (np. święto w środku sesji egzaminacyjnej), obowiązuje pierwsza pasująca reguła w poniższej kolejności:

| Priorytet | Warunek | Status |
|-----------|---------|--------|
| 1 (najwyższy) | Data w `academicCalendar.holidays` | `"holiday"` |
| 2 | Data w `academicCalendar.daySwaps` | `"daySwap"` |
| 3 | Data objęta periodem `type: "break"` w `academicCalendar.periods` | `"break"` |
| 4 | Data objęta periodem `type: "exam"` w `academicCalendar.periods` | `"exam"` |
| 5 (domyślny) | Żaden z powyższych | `"normal"` |


`"daySwap"` ma wyższy priorytet niż `"break"` i `"exam"`, bo zarządzenie rektorskie zamieniające dzień jest bardziej szczegółowe niż okres przerwy.

### D5 — Typ `ResolvedLesson` i semantyka `baseDayPreview`

```
{
  // — oryginalne pola zajęcia (spread) —
  przedmiot, godziny, sala, prowadzacy, data_start, tygodnie, co_ile, polowa_sem, ...
  // — wstrzyknięte przez silnik —
  isActive: boolean,           // aktywność w cyklu (nie dotyczy dnia wolnego)
  meetingNumber: number,       // 0 jeśli !isActive
  totalMeetings: number,
  isFinalMeeting: boolean,
  sourceDay: string,           // dzień bazowy planu
  lessonDate: string,          // ISO data konkretnego spotkania
}
```

**`baseDayPreview`**: Tablica `ResolvedLesson[]` zajęć z oryginalnego (niezamienionego) dnia. Służy wyłącznie do podglądu sal i godzin. Lekcje w `baseDayPreview` **nie mają** wypełnionego `meetingNumber` — pole ustawiane na `null`. Nie liczyć spotkań dla podglądu.

**Kontrakt niezmienności:** Silnik nie mutuje `rawSchedule`. Testy weryfikują `deepStrictEqual` przed i po.

### D6 — Własność słowników

`DNI_TYGODNIA` i `DNI_MAP_SUNDAY_FIRST` → przeniesione do silnika, eksportowane jako `ScheduleEngine.DNI_TYGODNIA`. Słowniki prezentacyjne (`DNI_PELNE`, `DNI_DOPELNIACZ`, `DNI_MIEJSCOWNIK`, `DNI_PRZYMIOTNIK`, `DNI_PRZYIMEK`) → wyłącznie `app.js`.

### D7 — Wzorzec eksportu Vanilla JS + Node.js

```js
if (typeof module !== 'undefined') {
  module.exports = ScheduleEngine;
}
```
W przeglądarce obiekt globalny. W `index.html` — `<script src="js/schedule-engine.js">` przed `app.js`. `app.js` używa `typeof document !== "undefined"` przy inicjalizacji `elements` — import w Node nie crashuje.

### D8 — Ochrona chronionych stref (`AGENTS.md`)

`getLessonMeetingInfo` przeniesiona z zachowaniem dokładnie tej samej sygnatury i logiki, w tym:
- Guard dla `"Inny"` (nierozpoznany dzień bazowy)
- Hard cap `MAX_ITER = 200`
- Guard `isNaN(startDate.getTime())`

### D9 — Tymczasowe aliasy + inicjalizacja `engine` (Faza 3)

`engine` tworzony w dwóch miejscach w `app.js`:

```js
// 1. Natychmiastowo po deklaracji ACADEMIC_CALENDAR (wbudowany fallback, działa offline)
let engine = ScheduleEngine.create(ACADEMIC_CALENDAR);

// 2. Po załadowaniu kalendarza z sieci (nadpisuje fallback)
async function loadAcademicCalendarConfig() {
  // ... fetch ...
  ACADEMIC_CALENDAR = data;
  engine = ScheduleEngine.create(ACADEMIC_CALENDAR);  // ← nowa instancja
}
```

Wrappery delegujące do `engine.*`:
```js
function getLessonMeetingInfo(...args) { return engine.getLessonMeetingInfo(...args); }
function getMonday(...args) { return engine.getMonday(...args); }
function getRoomOccupancyAt(...args) { return engine.getRoomOccupancyAt(...args); }
```

`engine` zawsze istnieje — inicjalizowany synchronicznie na starcie z kalendarzem wbudowanym. Wrappery nie potrzebują null-guarda. Usuwane w Fazie 4.

### D10 — Aktualizacja `sw.js`

Aktualny `CACHE_NAME = 'plan-umg-v3.8'`. Po wdrożeniu podbić do `'plan-umg-v3.9'`. Dodać `'./js/schedule-engine.js'` do `STATIC_ASSETS`.

### D11 — `resolveTeacherSchedule` poza zakresem Fazy 1

Wyłączona — nieokreślony zakres zwracanego okresu (cały semestr? bieżący tydzień?). Po Fazie 1 `openTeacherSchedule` korzysta z `engine.getLessonMeetingInfo` — duplikacja pętli znika, zostaje własne renderowanie HTML. Osobny spec po ustabilizowaniu interfejsu.

---

## Testing Decisions

### Co jest dobrym testem

Test uderza w interfejs silnika — metody publiczne `engine.*`. Nie testujemy wewnętrznych implementacji (`getLessonSemesterPeriod`, prywatne `isTeachingDay`). Testujemy zachowanie obserwowalne z zewnątrz szwu.

### Scenariusze wymagane w `test_schedule_engine.js`

- `status === "holiday"` → `lessons === []` (np. `2026-11-11`)
- `status === "daySwap"` → `swapReplaceWith` ustawione, zajęcia z podmieniowego dnia
- `status === "break"` → `lessons === []` (np. tydzień 2026-12-21)
- `status === "exam"` → `lessons === []` (np. tydzień 2027-02-08)
- `status === "normal"` → spotkanie policzone poprawnie
- Zajęcia co 2 tygodnie: tydzień parzysty i nieparzysty
- Połowa semestru: 1. i 2.
- `getRoomOccupancyAt`: sala zajęta i wolna
- **Priorytet statusów**: święto podczas sesji → `"holiday"` (nie `"exam"`)
- **Edge case licznik przy zamianie dnia**: zajęcia środowe przeniesione na piątek — `meetingNumber` rośnie (zachowanie obecnej implementacji; test potwierdza)
- **Niezmienność**: `deepStrictEqual(rawScheduleBefore, rawScheduleAfter)` dla `resolveWeekSchedule`, `getLessonMeetingInfo`, `buildScheduleIndex`
- **Deterministyczność `now`**: wywołanie z `options.now = new Date("2027-06-20")` (sesja letnia) zwraca `status: "exam"` niezależnie od systemowego zegara; wywołanie z innym `now` (np. `"2026-11-04"`, normalny tydzień) zwraca `status: "normal"`
- **Guard przy złej dacie**: `getLessonMeetingInfo` z `data_start: "invalid"` zwraca `{ active: true, meetingNum: 1 }` i nie rzuca wyjątku
- **`baseDayPreview`**: lekcje w preview mają `meetingNumber: null`

### Strategia Red — incremental

Test po teście. Workflow: napisz test → 🔴 → implementuj → 🟢 → następny. Nie blok 20 czerwonych naraz.

### Prior art

`test_calendar.js` Tests 1–20: fixture (obiekt zajęcia + data) → asercja na polu wyniku.

---

## Out of Scope

- Refaktoryzacja modali cross-reference (Candidate 2 z raportu).
- Ekstrakcja Platform Adapter (PWA install, iOS detection) — Speculative.
- `resolveTeacherSchedule` — patrz D11.
- `openTeacherSchedule` — po Fazie 1 korzysta z `engine.getLessonMeetingInfo`, duplikacja pętli znika; własne renderowanie HTML pozostaje.
- Zmiany w `style.css`, `scrapper.py`, `build_static.py`.
- Zmiana danych wyjściowych JSON (kontrakt Python ↔ JS nienaruszony).

---

## Further Notes

- Jedynym globalnym stanem po tej refaktoryzacji będzie obiekt `state` (plan, grupa, weekOffset, selectedDayTab).
- `getSafeGroupName` pozostaje w `app.js` (Kontrakt 1 z `AGENTS.md` nienaruszony).
- `getAcademicInfoForWeek` — kandydat do silnika lub funkcja w `app.js` przyjmująca `engine`; do decyzji agenta wdrażającego.
- Faza 3 wymaga manualnego przeglądu w przeglądarce po podmianie każdej metody — testy Node'a nie wychwycą regresji w renderowaniu DOM.
