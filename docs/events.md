# 📅 Instrukcja dodawania i edycji wydarzeń w Planie WN

Wydarzenia studenckie, integracje, imprezy i oficjalne ogłoszenia w aplikacji **Plan WN** można dodawać na dwa sposoby:
1. **[Sposób 1: Przez formularz zgłoszeniowy (najprostszy, bez edycji kodu)](#sposób-1-przez-formularz-dla-każdego)** — idealny dla osób nietechnicznych, samorządu i starostów.
2. **[Sposób 2: Bezpośrednia edycja pliku `data/events.json`](#sposób-2-bezpośrednia-edycja-pliku-dataeventsjson)** — dla administratorów i osób chcących szybko zmienić parametry, zaktualizować lub ukryć wydarzenie.

---

## Sposób 1: Przez formularz (dla każdego)

Nie musisz znać się na programowaniu ani edytować żadnych plików. Wszystko odbywa się w przeglądarce.

### Krok 1: Otwórz formularz
Kliknij bezpośredni link do formularza:  
👉 **[Dodaj nowe wydarzenie (GitHub Issue Form)](https://github.com/Qu4X/planwn/issues/new?template=new_event.yml)**

*(Możesz też wejść w zakładkę **Issues** w repozytorium, kliknąć zielony przycisk **New issue** i wybrać kafelek z kalendarzem).*

### Krok 2: Wypełnij pola
Wypełnij pola formularza tak, jak w zwykłej ankiecie:
* **Tytuł wydarzenia** *(wymagane)*: Krótka nazwa (np. `Czwartkowe Flanki Integracyjne` lub `Dni Otwarte Koła Nawigator`).
* **Data wydarzenia** *(wymagane)*: W formacie `RRRR-MM-DD` (np. `2026-10-15`).
* **Godziny rozpoczęcia i zakończenia** *(opcjonalne)*: W formacie 24-godzinnym (np. `18:00` i `22:00`). Zostaw puste, jeśli wydarzenie trwa cały dzień.
* **Typ i styl wydarzenia** *(wymagane)*: Wybierz kategorię z listy (np. Flanki, Impreza, Uczelnia, Ważne, Ogłoszenie) — aplikacja sama dobierze odpowiednie kolory, tło i ikonę.
* **Miejsce / Lokalizacja** *(opcjonalne)*: Gdzie odbywa się wydarzenie (np. `Polanka Redłowska`, `Aula Główna`).
* **Pełny opis wydarzenia** *(opcjonalne)*: Krótki opis, co zabrać ze sobą, dla kogo jest wydarzenie itp. Tekst ten wyświetla się w oknie po kliknięciu w kafelek na planie.
* **Link zewnętrzny** *(opcjonalne)*: Link do wydarzenia na Facebooku, map Google lub formularza zapisów.
* **Tekst na przycisku linku** *(opcjonalne)*: Własny napis na przycisku (np. `Zapisz się`, `Zobacz na FB`, `Otwórz mapę`).
* **Dla kogo jest wydarzenie?** *(wymagane)*: Wszyscy studenci, tylko studia stacjonarne (dzienne) lub tylko niestacjonarne (zaoczne).

### Krok 3: Wyślij zgłoszenie
Zjedź na dół strony i kliknij zielony przycisk **Submit new issue**.

### Krok 4: Co dzieje się potem? (Moderacja GitOps)
1. Zgłoszenie trafia do listy wątków na GitHubie.
2. Moderator przegląda wpis i dodaje etykietę **`approved`**.
3. Automat (GitHub Actions) natychmiast:
   - weryfikuje poprawność danych,
   - dopisuje wydarzenie do bazy `data/events.json`,
   - uruchamia testy i wdraża nową wersję na produkcję.
Po 1–2 minutach wydarzenie pojawia się u wszystkich studentów w aplikacji!

---

## Sposób 2: Bezpośrednia edycja pliku `data/events.json`

Wszystkie opublikowane wydarzenia przechowywane są w pliku [`data/events.json`](../data/events.json).

### Jak edytować plik na GitHubie:
1. Otwórz plik [`data/events.json`](https://github.com/Qu4X/planwn/blob/main/data/events.json).
2. Kliknij ikonkę ołówka ✏️ (**Edit this file**) w prawym górnym rogu.
3. Dodaj nowy wpis lub zmodyfikuj istniejący wewnątrz listy `[ ... ]`.
4. Kliknij zielony przycisk **Commit changes...** u góry strony, aby zapisać zmiany.

### Gotowy szablon do skopiowania

Wklej poniższy blok do pliku (pamiętaj o przecinku `,` oddzielającym wpisy):

```json
{
  "id": "flanki-polanka-2026-10",
  "title": "Czwartkowe Flanki na Polance",
  "date": "2026-10-15",
  "time_start": "18:00",
  "time_end": "22:00",
  "type": "flanki",
  "location": "Polanka Redłowska",
  "description": "Zabierzcie ze sobą dobry humor i puszki. Zbiórka o 18:00 na polance!",
  "url": "https://maps.google.com/?q=Polanka+Redlowska",
  "button_text": "Pokaż na mapie",
  "enabled": true,
  "target": {
    "mode": "all",
    "degree": "all"
  }
}
```

---

## 3. Opis wszystkich zmiennych (pól w pliku JSON)

| Pole | Typ | Wymagane? | Opis i przeznaczenie | Przykłady |
|---|:---:|:---:|---|---|
| **`id`** | tekst | **TAK** | Unikalny identyfikator wpisu. Używaj małych liter, cyfr i myślników (bez spacji i polskich znaków). | `"flanki-2026-10"`, `"inauguracja"` |
| **`title`** | tekst | **TAK** | Tytuł wyświetlany na kafelku w planie oraz na górze okna szczegółów. | `"Flanki Integracyjne"`, `"Dni Otwarte"` |
| **`date`** | tekst | **TAK** | Dokładna data wydarzenia w formacie ISO: `RRRR-MM-DD`. | `"2026-10-15"` |
| **`time_start`** | tekst / `null` | Nie | Godzina rozpoczęcia w formacie 24h `GG:MM`. Jeśli wydarzenie trwa cały dzień – wpisz `null` lub pomiń. | `"18:00"`, `null` |
| **`time_end`** | tekst / `null` | Nie | Godzina zakończenia w formacie 24h `GG:MM`. | `"22:00"`, `null` |
| **`type`** | tekst | Nie | Kategoria i styl wizualny (automatycznie ustawia tło, ramkę i ikonę). Dostępne: `"flanki"`, `"party"`, `"academic"`, `"warning"`, `"info"`. | `"flanki"`, `"party"` |
| **`location`** | tekst | Nie | Miejsce wydarzenia wyświetlane z ikoną pinezki 📍. | `"Polanka Redłowska"`, `"Aula Główna"` |
| **`description`** | tekst | Nie | Pełny opis wyświetlany w oknie po kliknięciu w kafelek na planie. | `"Zbiórka przy wejściu głównym..."` |
| **`url`** | tekst / `null` | Nie | Link zewnętrzny. Jeśli go podasz, w oknie pojawi się przycisk kierujący pod ten adres. | `"https://facebook.com/events/..."` |
| **`button_text`** | tekst | Nie | Własny napis na przycisku linku (domyślnie: `"Więcej informacji"`). | `"Zapisz się"`, `"Otwórz mapę"` |
| **`enabled`** | `true` / `false` | Nie | Czy wydarzenie jest aktywne. Ustawienie `false` ukrywa je w aplikacji bez konieczności usuwania z pliku (idealne na szablony). Domyślnie `true`. | `true`, `false` |
| **`badge`** | tekst | Nie | Własny tekst małej plakietki w rogu kafelka. Jeśli puste, aplikacja dobierze go automatycznie z pola `type`. | `"Samorząd"`, `"Koło Naukowe"` |
| **`icon`** | tekst | Nie | Własne emoji lub ikona przed tytułem. Jeśli puste, aplikacja dobierze ikonę z pola `type`. | `"🍻"`, `"🎉"`, `"🎓"`, `"📌"` |
| **`color`** | tekst | Nie | Własny kod koloru akcentu w formacie HEX. Jeśli puste, pobierany z pola `type`. | `"#d97706"`, `"#7c3aed"` |
| **`target`** | obiekt | Nie | Grupa docelowa studentów (filtry widoczności):<br>• `"mode"`: `"all"` (wszyscy), `"stacjonarne"` (dzienne), `"niestacjonarne"` (zaoczne).<br>• `"degree"`: `"all"` (wszyscy), `1` (I stopień), `2` (II stopień magisterski). | `{"mode": "all", "degree": "all"}` |

---

## 4. Gotowe style wizualne (`type`)

Jeśli nie zdefiniujesz własnych pól `badge`, `icon` ani `color`, aplikacja automatycznie dopasuje styl na podstawie wartości `type`:

* **`flanki`**:
  * Plakietka: `Flanki`, Ikona: `🍻`, Kolor: złoty piwny (`#d97706`).
  * Wygląd: Wyróżnione złote tło kafelka.
  * Zastosowanie: Czwartkowe flanki, integracje przy piwie, spotkania rocznikowe.
* **`party`**:
  * Plakietka: `Impreza`, Ikona: `🎉`, Kolor: fioletowy (`#7c3aed`).
  * Wygląd: Wyróżnione fioletowe tło kafelka.
  * Zastosowanie: Imprezy klubowe, otrzęsiny, juwenalia.
* **`academic`**:
  * Plakietka: `Uczelnia`, Ikona: `🎓`, Kolor: oficjalny granat UMG (`#0d3b66`).
  * Zastosowanie: Dni rektorskie, godziny dziekańskie, inauguracje, uroczystości.
* **`warning`**:
  * Plakietka: `Ważne`, Ikona: `⚠️`, Kolor: bursztynowy ostrzegawczy.
  * Zastosowanie: Terminy wniosków stypendialnych, zapisy na WF i lektoraty.
* **`info`**:
  * Plakietka: `Wydarzenie`, Ikona: `📌`, Kolor: błękitny.
  * Zastosowanie: Koła naukowe, targi pracy, ankiety studenckie, ogłoszenia ogólne.

---

## 5. Ważne zasady składni JSON (jak nie zepsuć pliku)

Edytując plik `events.json`, pamiętaj o 3 regułach formatu JSON:
1. **Przecinki między wydarzeniami**: Każdy blok w klamrach `{ ... }` musi być oddzielony od kolejnego przecinkiem `,`. Po **ostatnim** wydarzeniu na liście nie stawiaj przecinka!
2. **Podwójne cudzysłowy**: Wszystkie nazwy pól i teksty muszą być w cudzysłowach podwójnych `"tekst"` (nie pojedynczych `'tekst'`).
3. **Ukrywanie zamiast usuwania**: Jeśli wydarzenie się skończyło lub zostało odwołane, ustaw `"enabled": false`. Dzięki temu zachowasz je jako wzór na kolejny rok.
