# Plan WN - Backlog / TODO

Rejestr decyzji, zaległości i planowanych usprawnień wynikających z modelowania domeny i stres-testów założeń.

---

## 📌 Do zrobienia w kolejnych krokach (kolejność priorytetów)

### 1. Widok zbiorczy dla wszystkich grup (`web/`)
- [ ] **Widok zbiorczy dla wszystkich grup**: Dodanie widoku porównawczego (dzień / tydzień) prezentującego zajęcia wszystkich grup danego kierunku i semestru jednocześnie w przejrzystej siatce.

### 2. Społeczność i integracja studencka (`web/`)
- [ ] **Czwartkowy komunikat o flankach**: Wyświetlanie w czwartki lekkiego, studenckiego baneru / powiadomienia przypominającego o tradycji integracyjnej (flanki).

### 3. Scraping i integracja z Arkturem (`arktur_client.py`, `build_static.py`)
- [ ] **Inteligentne sprawdzanie aktualizacji (Conditional Scraping)**: Weryfikacja daty publikacji i wersji `[YYYY-MM-DD HH:MM] wer. X` przed pobieraniem pełnej siatki i dziesiątek zapytań AJAX, minimalizując obciążenie serwera Arktura.
- [ ] **Słownik wyjątków i nadpisań grup (`data/groups_manual.json`)**: Wprowadzenie pliku manualnego fallbacku dla grup (analogicznie do `data/subjects_manual.json`), jako bezpiecznego koła ratunkowego dla nietypowych oznaczeń dziekanatu.

### 4. Baza wykładowców i konsultacje (`scrapper.py`, `build_static.py`, `web/`)
- [ ] **Rozszerzenie profilu prowadzącego o konsultacje**: Scrapowanie dodatkowych danych ze stron UMG (terminy i sale dyżurów / konsultacji, katedra, kontakt) i prezentacja w modalu wykładowcy.

### 5. Architektura kodu i refaktoryzacja (`web/app.js`)
- [ ] **Platform Adapter (`web/js/platform-adapter.js`)**: Odizolowanie integracji PWA, Service Workera, detekcji iOS oraz generowania linków webcal za dedykowanym modułem/szwem (seam), redukując pozostałości w `web/app.js`.

### 6. Integracje zewnętrzne (`scrapper.py`, `web/`)
- [ ] **Zajętość i harmonogram pływalni UMG (`umg.edu.pl/basen/harmonogram`)**:
  - Scrapowanie cotygodniowej tabeli harmonogramu basenu UMG (status: otwarte / nieczynne, rezerwacje torów 1–6, wolne tory dla klientów/studentów).
  - Eksport do `dist/data/pool_schedule.json` podczas nocnego buildu.
  - Prezentacja dostępności torów w aplikacji (np. wzbogacenie sali `WF basen` w wyszukiwarce sal lub dedykowany kafel z aktualnym statusem "Czy popływam teraz?").

### 7. Logika kalendarza i spotkań (`web/js/schedule-engine.js` i ew. Python)
- [ ] **Podgląd dnia bazowego przy zamianie rektorskiej**: W dniach z zamianą rektorską domyślnie pokazujemy dzień realizowany z oficjalnym licznikiem spotkań, ale dodajemy opcję informacyjną "Podgląd dnia bazowego" (pokazuje sale i godziny oryginalnego planu bez wyświetlania numeru spotkania).
- [ ] **Weryfikacja reguły przedmiotów co 2 tygodnie w dni zamienione**: Ustalić z dziekanatem / studentami UMG, czy przedmiot dwutygodniowy może odbyć się dwukrotnie w jednym tygodniu w przypadku zamiany dnia (np. środa 16.12 i piątek 18.12).

---

## ✅ Zrealizowane funkcjonalności

### Prezentacja planu i interfejs (`web/`)
- [x] **Naturalne sortowanie listy planów w menu wyboru**: Sortowanie planów alfabetycznie po nazwie kierunku, a w ramach danego kierunku rosnąco po numerze semestru (`comparePlans`, `get_plan_sort_key`). Przetestowane w `tests/test_calendar.js` (Test 23) i `tests/test_backend.py` (Test 24).
- [x] **Oczyszczenie nazw kierunków w menu wyboru**: Parsowanie długich nazw uczelnianych (np. `[TM Sem 1] Transport Morski...` -> czyste `Transport Morski sem. 1`). Przetestowane w `tests/test_calendar.js` (Test 17) i `tests/test_backend.py` (Test 19).
- [x] **Data i wersja aktualizacji planu uczelnianego**: Wyciąganie znacznika czasu i wersji z nazwy planu na arktur (np. `[2026-09-14 17:55] wer. 2`) i wyświetlanie jako data publikacji planu w menu / panelu bocznym.
- [x] **Oznaczenie kolorystyczne form zajęć**: Rozróżnienie form dydaktycznych (wykład, ćwiczenia, laboratorium, symulator) za pomocą akcentów kolorystycznych lewej krawędzi (`border-left-color`) na kartach zajęć.
- [x] **Dostępność sal z uwzględnieniem dat i cykli**: Funkcja wyszukiwania wolnych sal weryfikuje faktyczny stan zajęć w danej dacie (`getRoomOccupancyAt`): uwzględnia przedmioty zakończone z 1. połowy semestru, naprzemienne cykle co 2 tygodnie, dni wolne oraz zamiany rektorskie.
- [x] **Usprawnienia wyszukiwarki wolnych sal**:
  - Wybór dnia i godziny z popupu kalendarza (Dziś / Jutro / kalendarz HTML5).
  - Globalna dostępność sal ze wszystkich planów UMG (`cross_reference.json`) w czasie polskim (`Europe/Warsaw`).
  - Szybkie filtrowanie sal po nazwie, podział na kafelki wolne i sekcję zajętych z informacją o kolejnych zajęciach.

### Scraping i parsowanie (`scrapper.py`, `build_static.py`, `nst_parser.py`)
- [x] **Bezpieczna detekcja grup II stopnia (np. `A1`, `B1`)**: Rozszerzenie regexu w `scrapper.py` / `arktur_client.py` o format grup magisterskich (`^[A-E]\s*\d{1,2}$`), zapobiegający pomijaniu planów takich jak Morskie Systemy Transportowe i Logistyczne przy jednoczesnym blokowaniu śmieciowych komórek Arktura (przetestowane w `tests/test_backend.py` sekcja 23 i 25).
- [x] **Obsługa planów niestacjonarnych (NST)**: Scrapowanie i parsowanie planów w formacie PDF (`nst_client.py`, `nst_parser.py`), generowanie planów JSON i ICS per grupa, obsługa widoku NST w aplikacji webowej bez zamian rektorskich.

### Kalendarz ICS i Webcal (`scrapper.py`, `build_static.py`, `web/`)
- [x] **Spójność ICS z kalendarzem akademickim**: Funkcja `generuj_ics` uwzględnia dni wolne (`holidays`), przerwy (`breaks`) oraz zamiany dni (`daySwaps`), a pliki `.ics` generowane dla wszystkich grup są w 100% zsynchronizowane z kalendarzem rektorskim i widokiem Web.
- [x] **Nowoczesny modal subskrypcji w UI**: Dedykowane przyciski subskrypcji dla Google Calendar (Android / PC) oraz Apple Kalendarza (iOS / Mac), kopiowanie bezpośredniego adresu URL subskrypcji oraz pobieranie pliku `.ics` dla urządzeń offline.

### Logika kalendarza i spotkań (`web/js/schedule-engine.js`)
- [x] **Twardy koniec semestru**: Zablokowano doliczanie spotkań w trakcie sesji egzaminacyjnej (`type === "exam"`), przerw oraz poza oficjalnym okresem dydaktycznym (`type === "teaching"`). Przetestowane TDD w `tests/test_calendar.js`.

### Architektura kodu i refaktoryzacja (`web/`)
- [x] **Schedule Engine**: Wyodrębnienie czystego silnika domenowego do `web/js/schedule-engine.js` (logika kalendarza akademickiego, zamiany dni, daty startu, `getLessonMeetingInfo`, `getRoomOccupancyAt`, `resolveWeekSchedule`, `buildScheduleIndex`). Pełne pokrycie testami TDD w `tests/test_schedule_engine.js` i `tests/test_calendar.js`.
- [x] **Cross-Reference Modals**: Konsolidacja powielonego kodu w modalach wykładowców, sal, przedmiotów i wolnych sal w dedykowany moduł `web/js/cross-reference.js` (`CrossRef.Engine`, `CrossRef.DataService`, `CrossRef.UI`). Pełna dostępność (a11y, Escape, focus trap), SWR cache, usunięcie długu z `web/app.js` oraz testy TDD w `tests/test_cross_reference.js` (8/8 PASS).

### Baza wykładowców (`build_static.py`)
- [x] **Błąd sumowania grup w widoku wykładowcy przy cyklach naprzemiennych**: Gdy prowadzący ma w tym samym slocie zajęcia z różnymi grupami w różnych tygodniach/połówkach (np. co 2 tyg z grupami 1 i 2, a w drugim tygodniu z grupami 3 i 4), deduplikacja w `build_static.py` uwzględnia parametry cyklu (`co_ile`, `od_tyg`, `polowa_sem`, `data_start`) i nie sumuje grup, a widoki prezentują plakietki cykli.

### Społeczność i funkcje studenckie
- [x] **Funkcja "Zgłoś błąd w planie"**: Zaimplementowano w modalu "O aplikacji" dedykowany formularz zgłoszeniowy (Tally modal z automatycznym fallbackiem przy adblockerach) oraz bezpośredni odnośnik do GitHub Issues.

### Analityka i telemetria (`web/`)
- [x] **Wdrożenie analityki GoatCounter**: Dodanie lekkiego, bezciasteczkowego skryptu analitycznego do `web/index.html`.
