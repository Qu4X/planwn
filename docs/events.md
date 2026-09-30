# Instrukcja dodawania i edycji wydarzeń studenckich

Wydarzenia i ogłoszenia studenckie definiowane są w pliku [`data/events.json`](../data/events.json).
Plik ten jest automatycznie synchronizowany do `dist/data/events.json` podczas budowania aplikacji (`build_static.py`) oraz pobierany w czasie rzeczywistym przez aplikację PWA.

---

## 1. Szablon pojedynczego wpisu (Template)

```json
{
  "id": "unikalny-identyfikator-wydarzenia",
  "date": "2026-10-01",
  "time_start": "11:00",
  "time_end": "14:00",
  "title": "Tytuł widoczny na karcie w planie",
  "description": "Pełny opis wydarzenia wyświetlany w modalu po kliknięciu.",
  "location": "Aula Główna UMG / Polanka Redłowska",
  "url": "https://umg.edu.pl/aktualnosci/...",
  "type": "academic",
  "badge": "Rektorat",
  "icon": "🎓",
  "color": "#0d3b66",
  "target": {
    "mode": "all",
    "degree": "all"
  }
}
```

---

## 2. Opis pól

| Pole | Typ | Wymagane | Opis |
|---|---|:---:|---|
| `id` | `string` | **TAK** | Unikalny identyfikator wpisu (np. `inauguracja-2026`, `flanki-pazdziernik`). |
| `date` | `string` | **TAK** | Data w formacie ISO: `YYYY-MM-DD` (np. `2026-10-01`). |
| `time_start` | `string` | Nie | Godzina rozpoczęcia w formacie `HH:MM` (np. `11:00`). |
| `time_end` | `string` | Nie | Godzina zakończenia w formacie `HH:MM` (np. `14:00`). |
| `title` | `string` | **TAK** | Tytuł wydarzenia wyświetlany na karcie i w modalu. |
| `description` | `string` | Nie | Szczegółowy opis widoczny w modalu po kliknięciu karty. |
| `location` | `string` | Nie | Miejsce wydarzenia (np. `Aula Główna`, `Sala C-30`, `Polanka Redłowska`). |
| `url` | `string` / `null` | Nie | Link zewnętrzny do szczegółów/zapisów (dodaje przycisk w modalu). |
| `button_text` | `string` | Nie | Własny tekst na przycisku linku (domyślnie: `"Więcej informacji"`). |
| `type` | `string` | Nie | Styl i motyw: `"academic"`, `"party"`, `"warning"`, `"info"` (domyślnie `"info"`). |
| `badge` | `string` | Nie | Tekst plakietki (np. `"Rektorat"`, `"Samorząd"`, `"Ważne"`, `"Integracja"`). |
| `icon` | `string` | Nie | Emoji / ikona wyświetlana przy tytule (np. `"🎓"`, `"🍻"`, `"⚠️"`, `"📌"`). |
| `color` | `string` | Nie | Kod koloru akcentu HEX (np. `"#0d3b66"`). |
| `enabled` | `boolean` | Nie | Domyślnie `true`. Ustawienie `false` wyłącza wydarzenie (służy jako template). |
| `target` | `object` | Nie | Kryteria celowania do grup studentów (patrz niżej). |

---

## 3. Gotowe presety stylów (`type`)

Jeśli nie podasz własnych `badge`, `icon` lub `color`, aplikacja dobierze domyślne na podstawie pola `type`:

- **`academic`**:
  - Domyślna plakietka: `"Uczelnia"`, ikona: `🎓`, kolor akcentu: niebieski UMG.
  - Zastosowanie: inauguracje, dni rektorskie, godziny dziekańskie, matury próbne.
- **`party`**:
  - Domyślna plakietka: `"Impreza"`, ikona: `🎉`, kolor akcentu: fioletowy (`#7c3aed`).
  - Zastosowanie: imprezy studenckie, otrzęsiny, juwenalia, wyjazdy integracyjne.
- **`flanki`**:
  - Domyślna plakietka: `"Flanki"`, ikona: `🍻`, kolor akcentu: złoty (`#d97706`).
  - Zastosowanie: czwartkowe flanki na Polance, spotkania przy piwie, integracja rocznikowa.
- **`warning`**:
  - Domyślna plakietka: `"Ważne"`, ikona: `⚠️`, kolor akcentu: bursztynowy.
  - Zastosowanie: ostateczne terminy składania wniosków stypendialnych, zapisy na WF/lektoraty, zmiany w planie.
- **`info`**:
  - Domyślna plakietka: `"Wydarzenie"`, ikona: `📌`, kolor akcentu: błękitny.
  - Zastosowanie: targi pracy, koła naukowe, rekrutacje, ogłoszenia ogólne.

---

## 4. Celowanie wydarzeń (`target`)

Możesz ograniczyć widoczność wydarzenia do określonej grupy studentów:

```json
"target": {
  "mode": "stacjonarne",
  "degree": 1
}
```

- **`mode`**:
  - `"all"` — widoczne dla wszystkich (stacjonarni i niestacjonarni).
  - `"stacjonarne"` — widoczne tylko dla studentów studiów dziennych.
  - `"niestacjonarne"` — widoczne tylko dla studentów studiów zaocznych (zjazdowych).
- **`degree`**:
  - `"all"` — widoczne dla wszystkich stopni.
  - `1` — widoczne tylko dla studiów I stopnia (inżynierskich / licencjackich).
  - `2` — widoczne tylko dla studiów II stopnia (magisterskich).

---

## 5. Jak wyłączyć lub przygotować szablon (`enabled: false`)

W plikach JSON nie można stosować komentarzy `//`. Aby zachować wpis jako szablon lub tymczasowo go ukryć, dodaj do niego:

```json
"enabled": false
```

Wydarzenie z `"enabled": false` zostanie całkowicie pominięte w interfejsie użytkownika, ale pozostanie w pliku gotowe do późniejszego włączenia (`"enabled": true` lub usunięcie flagi).

---

## 6. Automatyczne dodawanie przez GitHub Issues (Zero-Code GitOps)

Dla osób, które nie chcą ręcznie edytować pliku JSON, przygotowany jest zautomatyzowany formularz zgłoszeniowy:

1. Przejdź do zakładki **Issues -> New Issue** w repozytorium na GitHubie.
2. Wybierz szablon: **„📅 Zgłoszenie nowego wydarzenia studenckiego”**.
3. Wypełnij czytelny formularz (tytuł, data, godziny, typ z listy rozwijanej, miejsce, opis, opcjonalny link i tekst przycisku).
4. Kliknij **Submit new issue**.
5. **Jak zatwierdzić (moderacja)**:
   - Moderator / administrator repozytorium przegląda zgłoszenie.
   - Aby zaakceptować wydarzenie, wystarczy dodać do zgłoszenia etykietę **`approved`**.
   - GitHub Actions (`process_event_issue.yml`) automatycznie:
     - Odczyta formularz i sparsuje dane,
     - Przeprowadzi walidację typów i formatu dat,
     - Dopisze wydarzenie do `data/events.json`,
     - Przeprowadzi testy regresyjne (`tests/test_backend.py`),
     - Zrobi commit do gałęzi `main` i zamknie zgłoszenie z komentarzem potwierdzającym,
     - Wywoła automatyczny build i wdrożenie na GitHub Pages!
