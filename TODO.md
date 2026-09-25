# Plan WN - Backlog / TODO

Rejestr decyzji, zaległości i planowanych usprawnień wynikających z modelowania domeny i stres-testów założeń.

## 📌 Do zrobienia w kolejnych krokach

### Kalendarz ICS i Webcal (`scrapper.py`, `build_static.py`, `web/`)
- [x] **Spójność ICS z kalendarzem akademickim**: Funkcja `generuj_ics` uwzględnia dni wolne (`holidays`), przerwy (`breaks`) oraz zamiany dni (`daySwaps`), a pliki `.ics` generowane dla wszystkich grup są w 100% zsynchronizowane z kalendarzem rektorskim i widokiem Web (przetestowane w `tests.py`).
- [x] **Nowoczesny modal subskrypcji w UI**: Wdrożono dedykowane przyciski subskrypcji dla Google Calendar (Android / PC) oraz Apple Kalendarza (iOS / Mac), kopiowanie bezpośredniego adresu URL subskrypcji oraz pobieranie pliku `.ics` dla urządzeń offline / bez usług Google.

### Logika kalendarza i spotkań (`web/app.js` i ew. Python)
- [x] **Twardy koniec semestru**: Zablokowano doliczanie spotkań w trakcie sesji egzaminacyjnej (`type === "exam"`), przerw oraz poza oficjalnym okresem dydaktycznym (`type === "teaching"`). Przetestowane TDD w `test_calendar.js`.
- [ ] **Weryfikacja reguły przedmiotów co 2 tygodnie w dni zamienione**: Ustalić z dziekanatem / studentami UMG, czy przedmiot dwutygodniowy może odbyć się dwukrotnie w jednym tygodniu w przypadku zamiany dnia (np. środa 16.12 i piątek 18.12).
- [ ] **Podgląd dnia bazowego przy zamianie rektorskiej**: W dniach z zamianą rektorską domyślnie pokazujemy dzień realizowany z oficjalnym licznikiem spotkań, ale dodajemy opcję informacyjną "Podgląd dnia bazowego" (pokazuje sale i godziny oryginalnego planu bez wyświetlania numeru spotkania).


### Architektura kodu i refaktoryzacja (`web/app.js`)
- [ ] **Rozbicie monolitu `web/app.js` na głębokie moduły** (Raport: `architecture-review-1789844861.html`, Specyfikacja: `docs/specs/schedule-engine-refactor.md`):
  - [x] **Schedule Engine (Priorytet / Strong)**: Wyodrębnienie czystego silnika domenowego do `web/js/schedule-engine.js` (logika kalendarza akademickiego, zamiany dni, daty startu, `getLessonMeetingInfo`, `getRoomOccupancyAt`, `resolveWeekSchedule`, `buildScheduleIndex`). Pełne pokrycie testami TDD w `test_schedule_engine.js` i `test_calendar.js`.
  - [x] **Cross-Reference Modals (Worth exploring)**: Konsolidacja powielonego kodu w modalach wykładowców, sal, przedmiotów i wolnych sal w dedykowany moduł `web/js/cross-reference.js` (`CrossRef.Engine`, `CrossRef.DataService`, `CrossRef.UI`). Pełna dostępność (a11y, Escape, focus trap), SWR cache, usunięcie ~640 linii długu z `web/app.js` oraz testy TDD w `test_cross_reference.js` (8/8 PASS).
  - [ ] **Platform Adapter (Speculative)**: Odizolowanie integracji PWA, Service Workera, detekcji iOS i generowania linków webcal za dedykowanym szwem (seam).

### Prezentacja planu i interfejs (`web/`)
- [x] **Oczyszczenie nazw kierunków w menu wyboru**: Parsowanie długich nazw uczelnianych (np. `[TM Sem 1] Transport Morski pierwszego stopnia sem. 1 [2026-09-14 17:55] wer. 2` -> czyste `Transport Morski sem. 1`). Przetestowane w `test_calendar.js` (Test 17) i `tests.py` (Test 19).
- [x] **Data i wersja aktualizacji planu uczelnianego**: Wyciąganie znacznika czasu i wersji z nazwy planu na arktur (np. `[2026-09-14 17:55] wer. 2`) i wyświetlanie jako data publikacji planu w menu / panelu bocznym.
- [x] **Dostępność sal z uwzględnieniem dat i cykli (Ostrzeżenie E)**: Funkcja wyszukiwania wolnych sal weryfikuje faktyczny stan zajęć w danej dacie (`getRoomOccupancyAt`): uwzględnia przedmioty zakończone z 1. połowy semestru, naprzemienne cykle co 2 tygodnie, dni wolne oraz zamiany rektorskie. Przetestowane TDD w `test_calendar.js`.
- [x] **Usprawnienia wyszukiwarki wolnych sal**:
  - [x] **Wybór dnia i godziny z popupu kalendarza**: Dodanie selektora daty/dnia (Dziś / Jutro / kalendarz HTML5) bezpośrednio w modalu wolnych sal, umożliwiając sprawdzenie dostępności sal w dowolnym wybranym dniu semestru.
  - [x] **Globalna dostępność sal (wszystkie plany)**: Uwzględnianie obłożenia sal ze wszystkich dostępnych planów zajęć UMG (z indeksu `cross_reference.json`), zamian rektorskich oraz trybu "Teraz" z czasem warszawskim (`Europe/Warsaw`).
  - [x] **Szybkie filtrowanie i wyszukiwanie**: Natychmiastowe filtrowanie sal po nazwie (od 1 znaku), podział na kafelki wolne i zwijalną sekcję zajętych z informacją o kolejnych zajęciach.
- [ ] **Widok zbiorczy dla wszystkich grup**: Dodanie widoku porównawczego (dzień / tydzień) prezentującego zajęcia wszystkich grup jednocześnie.
- [ ] **Naturalne sortowanie listy planów w menu wyboru**: Sortowanie planów alfabetycznie po nazwie kierunku, a w ramach danego kierunku rosnąco po numerze semestru (np. *Transport i Logistyka sem. 1, 3, 5, 7*, a następnie *Transport Morski sem. 1, 3* zamiast losowej/chronologicznej kolejności z Arktura).


### Scraping i integracja z Arkturem (`arktur_client.py`, `build_static.py`)
- [ ] **Bezpieczna detekcja grup II stopnia (np. `A1`, `B1`)**: Rozszerzenie regexu w `arktur_client.py` o ścisły format grup magisterskich (`^[A-E]\s*\d{1,2}$`), zapobiegający pomijaniu planów takich jak Morskie Systemy Transportowe i Logistyczne przy jednoczesnym blokowaniu śmieciowych komórek Arktura (z testem regresyjnym w `tests.py`).
- [ ] **Słownik wyjątków i nadpisań grup (`groups_manual.json`)**: Wprowadzenie pliku manualnego fallbacku dla grup (analogicznie do `subjects_manual.json`), jako bezpiecznego koła ratunkowego dla nietypowych oznaczeń dziekanatu.
- [ ] **Inteligentne sprawdzanie aktualizacji (Conditional Scraping)**: Weryfikacja daty publikacji i wersji `[YYYY-MM-DD HH:MM] wer. X` przed pobieraniem pełnej siatki i dziesiątek zapytań AJAX, minimalizując obciążenie serwera Arktura.

### Baza wykładowców i konsultacje (`scrapper.py`, `build_static.py`, `web/`)
- [x] **Błąd sumowania grup w widoku wykładowcy przy cyklach naprzemiennych**: Gdy prowadzący ma w tym samym slocie godzinowym zajęcia z różnymi grupami w różnych tygodniach/połówkach (np. co 2 tyg z grupami 1 i 2, a w drugim tygodniu z grupami 3 i 4), deduplikacja w `build_static.py` uwzględnia parametry cyklu (`co_ile`, `od_tyg`, `polowa_sem`, `data_start`) i nie sumuje grup, a widoki prezentują plakietki cykli. Przetestowane w `tests.py` (Test 20).
- [ ] **Rozszerzenie profilu prowadzącego o konsultacje**: Scrapowanie dodatkowych danych ze stron UMG (terminy i sale dyżurów / konsultacji, katedra, kontakt) i prezentacja w modalu wykładowcy.

### Społeczność i funkcje studenckie
- [x] **Funkcja "Zgłoś błąd w planie"**: Zaimplementowano w modalu "O aplikacji" dedykowany formularz zgłoszeniowy (Tally modal z automatycznym fallbackiem przy adblockerach) oraz bezpośredni odnośnik do GitHub Issues.
- [ ] **Czwartkowy komunikat o flankach**: Wyświetlanie w czwartki lekkiego, studenckiego baneru / powiadomienia przypominającego o tradycji integracyjnej (flanki).

### Analityka i telemetria (`web/`)
- [x] **Wdrożenie analityki GoatCounter**: Dodanie lekkiego, bezciasteczkowego skryptu analitycznego do `web/index.html`:
  ```html
  <script data-goatcounter="https://qu4x.goatcounter.com/count"
          async src="//gc.zgo.at/count.js"></script>
  ```

### Zadania przesunięte na koniec
- [x] **Oznaczenie kolorystyczne form zajęć**: Rozróżnienie form dydaktycznych (wykład, ćwiczenia, laboratorium, symulator) za pomocą akcentów kolorystycznych lewej krawędzi (`border-left-color`) na kartach zajęć.
- [ ] **Zajętość i harmonogram pływalni UMG (`umg.edu.pl/basen/harmonogram`)**:
  - Scrapowanie cotygodniowej tabeli harmonogramu basenu UMG (status: otwarte / nieczynne, rezerwacje torów 1–6, wolne tory dla klientów/studentów).
  - Eksport do `dist/data/pool_schedule.json` podczas nocnego buildu.
  - Prezentacja dostępności torów w aplikacji (np. wzbogacenie sali `WF basen` w wyszukiwarce sal lub dedykowany kafel/widok z aktualnym statusem "Czy popływam teraz?").


