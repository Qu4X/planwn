# Spec: System Globalnych Wydarzeń w Planie WN (Events System)

## Problem Statement

Studenci oraz administratorzy Wydziału Nawigacyjnego Uniwersytetu Morskiego w Gdyni nie mają obecnie sposobu na przeglądanie istotnych wydarzeń pozalekcyjnych bezpośrednio w aplikacji Plan WN. Informacje o godzinach rektorskich, uroczystościach uczelnianych, spotkaniach kół naukowych, dniach adaptacyjnych czy tradycyjnych spotkaniach integracyjnych (np. czwartkowe flanki) są rozproszone po portalach społecznościowych i stronach uczelni. Jednocześnie student sprawdzający plan zajęć w telefonie lub na komputerze chce widzieć te wydarzenia w kontekście konkretnego dnia i godziny, bez zaśmiecania podstawowej siatki zajęć dydaktycznych i bez psucia oficjalnych liczników spotkań semestralnych.

## Solution

Wprowadzenie scentralizowanego, wersjonowanego w repozytorium rejestru wydarzeń (`data/events.json`), ładowanego przez dedykowany moduł frontendowy (`EventsService`). Wydarzenia są prezentowane w sposób nieinwazyjny w dedykowanej sekcji na samym dole listy zajęć danego dnia (oraz na dole kolumny w widoku tygodniowym na desktopie), a obecność wydarzenia jest subtelnie sygnalizowana kropką-wskaźnikiem w zakładkach dni. Kliknięcie w kartę wydarzenia otwiera w pełni dostępny, natywny modal dialogowy ze szczegółami i opcjonalnym odnośnikiem zewnętrznym. System obsługuje proste targetowanie (stacjonarne / niestacjonarne / stopień studiów) i nie ingeruje w silnik planu ani w subskrypcje kalendarzy ICS.

## User Stories

1. Jako student, chcę widzieć informację o godzinach rektorskich w dniu, którego one dotyczą, aby wiedzieć, w jakich godzinach jestem zwolniony z zajęć.
2. Jako student, chcę widzieć wydarzenia na samym dole planu danego dnia, aby nie mieszały się one z moimi regularnymi zajęciami dydaktycznymi.
3. Jako student przeglądający plan na telefonie, chcę widzieć kropkę-wskaźnik na zakładce dnia z wydarzeniem, aby od razu wiedzieć, że w tym dniu zaplanowano coś dodatkowego bez konieczności scrollowania do dołu.
4. Jako student, chcę widzieć wydarzenia w widoku tygodniowym na komputerze na dole kolumny odpowiedniego dnia, aby zachować spójność czasową i przegląd całego tygodnia.
5. Jako student, chcę kliknąć w kartę wydarzenia, aby otworzyć okno ze szczegółowym opisem, dokładną lokalizacją i organizatorem.
6. Jako student, chcę mieć możliwość kliknięcia w odnośnik w szczegółach wydarzenia (np. formularz zapisów lub post na Facebooku), aby przejść bezpośrednio do źródła w nowej karcie.
7. Jako student korzystający z czytnika ekranu lub klawiatury, chcę otworzyć szczegóły wydarzenia klawiszem Enter/Spacja i zamknąć je klawiszem Escape, aby aplikacja była w pełni dostępna.
8. Jako student na urządzeniu dotykowym, chcę móc zamknąć modal ze szczegółami wydarzenia poprzez tapnięcie w przyciemnione tło poza oknem (light-dismiss), aby obsługa była intuicyjna i szybka.
9. Jako student studiów niestacjonarnych, chcę widzieć tylko wydarzenia ogólne lub skierowane do mojego trybu studiów, aby nie otrzymywać powiadomień o imprezach odbywających się w środku tygodnia.
10. Jako student studiów magisterskich (II stopnia), chcę widzieć wydarzenia ogólne oraz dedykowane dla II stopnia, bez ogłoszeń dotyczących wyłącznie adaptacji I roku.
11. Jako student przeglądający miniony tydzień, chcę widzieć przeszłe wydarzenia w formie wyszarzonej/oznaczonej jako zakończone, aby zachować ciągłość historyczną semestru.
12. Jako student korzystający z trybu ciemnego, chcę, aby karty wydarzeń i modal dialogowy miały dopasowaną, czytelną kolorystykę spełniającą normy kontrastu WCAG AA.
13. Jako student subskrybujący kalendarz na telefonie przez Google Calendar lub Apple Calendar, chcę, aby globalne wydarzenia z aplikacji webowej nie zaśmiecały mojego kalendarza systemowego zajęć dydaktycznych.
14. Jako administrator i autor planu, chcę dodawać nowe wydarzenie poprzez prosty wpis w pliku JSON w repozytorium GitHub, aby nie musieć utrzymywać bazy danych ani serwera w chmurze.
15. Jako autor planu, chcę móc wybrać gotowy preset wizualny wydarzenia (akademickie, impreza, ogłoszenie, ostrzeżenie) lub podać własny kolor i ikonę, aby wydarzenie wyróżniało się właściwym charakterem.

## Implementation Decisions

1. **Źródło danych i format**:
   - Dedykowany plik `data/events.json` wersjonowany w repozytorium.
   - Schemat każdego wydarzenia:
     ```json
     {
       "id": "slug-identyfikator",
       "date": "YYYY-MM-DD",
       "time_start": "HH:MM",
       "time_end": "HH:MM",
       "title": "Tytuł wydarzenia",
       "description": "Opcjonalny dłuższy opis",
       "location": "Opcjonalne miejsce (np. Aula Główna UMG)",
       "url": "https://... lub null",
       "type": "academic | party | info | warning",
       "badge": "Etykieta organizatora",
       "icon": "Emoji lub symbol",
       "color": "Opcjonalny kod HEX koloru akcentu",
       "target": {
         "mode": "all | stacjonarne | niestacjonarne",
         "degree": "all | 1 | 2"
       }
     }
     ```
2. **Architektura modułowa frontendu (`EventsService`)**:
   - Wyodrębnienie czystego modułu domenowo-usługowego `web/js/events-service.js`.
   - Moduł hermetyzuje pobieranie pliku `data/events.json`, parsowanie, filtrowanie pod kątem aktualnego kontekstu (`studyMode`, `degree`) oraz dopasowanie do daty.
   - Udostępnia publiczne metody:
     - `init(eventsDataOrUrl)`
     - `getEventsForDate(dateISO, context)`
     - `hasEventOnDate(dateISO, context)`
     - `renderEventCard(event)`
     - `openDetailsModal(event)`
3. **Izolacja od silnika kalendarza i eksportu ICS**:
   - Silnik spotkań (`schedule-engine.js`) oraz scraper z generatorem ICS (`ics_export.py`) pozostają w 100% nienaruszone.
   - Wydarzenia to warstwa prezentacyjna, nakładana w UI po wyliczeniu właściwego rozkładu zajęć.
4. **Warunkowe renderowanie sekcji w UI**:
   - Sekcja `.day-events-section` jest wstrzykiwana do DOM wyłącznie wtedy, gdy dla danego dnia istnieją pasujące wydarzenia. W dniach bez wydarzeń DOM nie zawiera żadnych pustych kontenerów.
   - W widoku mobilnym sekcja doklejana jest na dole kontenera kart lekcji.
   - W widoku desktopowym karty wydarzeń trafiają na dół kolumny odpowiadającego dnia.
5. **Wskaźnik w zakładkach dni**:
   - W pętli `updateDayTabsUI` w `web/app.js` wywoływana jest metoda `EventsService.hasEventOnDate(dateISO, currentContext)`. Jeśli zwróci `true`, do elementu zakładki dnia dodawana jest klasa `.has-event` renderująca małą kropkę `.event-indicator-dot`.
6. **Dostępny modal szczegółów (Modern Web Guidance)**:
   - Zastosowanie natywnego elementu `<dialog id="event-details-dialog" closedby="any">`.
   - Automatyczny fallback light-dismiss dla przeglądarek niewspierających jeszcze `closedby="any"` (detekcja kliknięcia w obszar poza `dialog.getBoundingClientRect()`).
   - Zachowanie i przywracanie fokusu na triggerze (`previouslyFocusedElement.focus()`).

## Testing Decisions

1. **Szwy testowe (Testing Seams)**:
   - **Główny szew domenowy (Unit / Service Seam)**: Bezpośrednie testowanie `EventsService` w Node.js (`tests/test_events.js`). Testowanie zachowań zewnętrznych:
     - Czy wydarzenie z `target.mode = "stacjonarne"` nie pojawia się w trybie niestacjonarnym.
     - Czy wydarzenie z `target.degree = 1` nie pojawia się dla studentów II stopnia.
     - Czy `hasEventOnDate` poprawnie odpowiada dla dni z wydarzeniami i bez.
     - Czy przeszłe wydarzenia otrzymują flagę/status `isPast = true`.
     - Czy domyślne presety (`academic`, `party`, etc.) zwracają prawidłowe kolory i ikony fallbackowe.
   - **Szew walidacji danych (Backend Seam)**: Test walidacyjny w `tests/test_backend.py` weryfikujący poprawność składniową i integralność referencyjną pliku `data/events.json` (formaty dat ISO, godziny `HH:MM`, wymagane pola).
2. **Wpięcie do pipeline'u CI**:
   - `tests/test_events.js` włączony do `npm test` w `package.json`.

## Out of Scope

- Edycja i dodawanie wydarzeń bezpośrednio z poziomu interfejsu użytkownika w przeglądarce (zarządzanie odbywa się przez repozytorium Git / GitOps).
- Eksport wydarzeń do plików `.ics` / subskrypcji kalendarza (wydarzenia są wyłącznie elementem widoku webowego).
- Zastępowanie regularnych zajęć w siatce (wydarzenia nie odwołują zajęć automatycznie ani nie zmieniają licznika spotkań).
- Złożone reguły cykliczności (np. RRULE z iCalendar) — każde wydarzenie definiowane jest konkretną datą ISO `YYYY-MM-DD`.

## Further Notes

System jest zaprojektowany w sposób rozszerzalny — w przyszłości, w razie potrzeby, dodanie panelu edycji dla administratora sprowadzi się do prostego formularza generującego commit do `data/events.json` za pośrednictwem GitHub REST API.
