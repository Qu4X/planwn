# Plan UMG - Backlog / TODO

Rejestr decyzji, zaległości i planowanych usprawnień wynikających z modelowania domeny i stres-testów założeń.

## 📌 Do zrobienia w kolejnych krokach

### Kalendarz ICS (`scrapper.py` -> `generuj_ics`)
- [ ] **Spójność ICS z kalendarzem akademickim**: Funkcja `generuj_ics` musi uwzględniać dni wolne (`holidays`), przerwy (`breaks`) oraz zamiany dni (`daySwaps`), aby plik `.ics` pobierany przez studenta był w 100% zgodny z widokiem Web.

### Logika kalendarza i spotkań (`web/app.js` i ew. Python)
- [x] **Twardy koniec semestru**: Zablokowano doliczanie spotkań w trakcie sesji egzaminacyjnej (`type === "exam"`), przerw oraz poza oficjalnym okresem dydaktycznym (`type === "teaching"`). Przetestowane TDD w `test_calendar.js`.
- [ ] **Weryfikacja reguły przedmiotów co 2 tygodnie w dni zamienione**: Ustalić z dziekanatem / studentami UMG, czy przedmiot dwutygodniowy może odbyć się dwukrotnie w jednym tygodniu w przypadku zamiany dnia (np. środa 16.12 i piątek 18.12).
- [ ] **Podgląd dnia bazowego przy zamianie rektorskiej**: W dniach z zamianą rektorską domyślnie pokazujemy dzień realizowany z oficjalnym licznikiem spotkań, ale dodajemy opcję informacyjną "Podgląd dnia bazowego" (pokazuje sale i godziny oryginalnego planu bez wyświetlania numeru spotkania).


### Społeczność i funkcje użytkownika
- [ ] **Funkcja "Zgłoś błąd w planie"**: Możliwość zgłaszania przez studentów rozbieżności (np. modal z formularzem, webhook lub link do GitHub Issues), pozwalający na bieżąco korygować nietypowe wyjątki.

