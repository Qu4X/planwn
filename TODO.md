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


### Prezentacja planu i interfejs (`web/`)
- [ ] **Oznaczenie kolorystyczne form zajęć**: Rozróżnienie form dydaktycznych (wykład, ćwiczenia, laboratorium, projekt) za pomocą czytelnych akcentów kolorystycznych i etykiet w widoku kafelkowym i siatce planu.
- [ ] **Widok zbiorczy dla wszystkich grup**: Dodanie widoku porównawczego (dzień / tydzień) prezentującego zajęcia wszystkich grup jednocześnie.

### Baza wykładowców i konsultacje (`scrapper.py`, `build_static.py`, `web/`)
- [ ] **Rozszerzenie profilu prowadzącego o konsultacje**: Scrapowanie dodatkowych danych ze stron UMG (terminy i sale dyżurów / konsultacji, katedra, kontakt) i prezentacja w modalu wykładowcy.

### Społeczność i funkcje studenckie
- [x] **Funkcja "Zgłoś błąd w planie"**: Zaimplementowano w modalu "O aplikacji" dedykowany formularz zgłoszeniowy (Tally modal z automatycznym fallbackiem przy adblockerach) oraz bezpośredni odnośnik do GitHub Issues.
- [ ] **Czwartkowy komunikat o flankach**: Wyświetlanie w czwartki lekkiego, studenckiego baneru / powiadomienia przypominającego o tradycji integracyjnej (flanki).


