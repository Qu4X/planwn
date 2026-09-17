import os
import json
import html
import requests
import re
import logging
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor
from requests.adapters import HTTPAdapter
from datetime import datetime, timedelta
from icalendar import Calendar, Event

# Konfiguracja logowania
logger = logging.getLogger(__name__)

DNI_MAPA = {"1": "PON", "2": "WT", "3": "ŚR", "4": "CZW", "5": "PT", "6": "SOB"}

MANUAL_DICT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "subjects_manual.json")

def load_manual_subjects():
    """Loads curated manual subject overrides from subjects_manual.json"""
    if os.path.exists(MANUAL_DICT_PATH):
        try:
            with open(MANUAL_DICT_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Nie udało się wczytać subjects_manual.json: {e}")
    return {}


def oblicz_godzine_konca(start_str, trwanie_min):
    try:
        start_dt = datetime.strptime(start_str.strip(), "%H:%M")
        koniec_dt = start_dt + timedelta(minutes=trwanie_min)
        return koniec_dt.strftime("%H:%M")
    except Exception as e:
        logger.warning(f"Błąd parsowania czasu '{start_str}': {e}")
        return start_str


def pobierz_liste_planow():
    url = "https://arktur.umg.edu.pl/planyzaj/strpza5.php"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        r = requests.get(url, headers=headers, timeout=10)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        return {opt.get_text().strip(): opt.get("value") for opt in soup.find_all("option")}
    except Exception as e:
        logger.error(f"Nie udało się pobrać listy kierunków: {e}")
        return {}


def pobierz_dane_z_ajax(session, ajax_val, url_target="https://arktur.umg.edu.pl/planyzaj/strpza6.php"):
    url = "https://arktur.umg.edu.pl/planyzaj/validate_sp_ka.php"
    headers = {"User-Agent": "Mozilla/5.0", "X-Requested-With": "XMLHttpRequest", "Referer": url_target}
    payload = {"inputValue": ajax_val, "fieldID": "prowadzacy_zajecia_public"}
    try:
        r = session.post(url, data=payload, headers=headers, timeout=5)
        r.raise_for_status()
        match = re.search(r"<komunikat>([^<]+)</komunikat>", r.text)
        if match:
            tresc = match.group(1).strip()
            items = []
            for part in tresc.split('|'):
                subparts = [p.strip() for p in part.split('_')]
                sub = subparts[0] if len(subparts) > 0 else ""
                teach = subparts[1] if len(subparts) > 1 else ""
                dt = subparts[2] if len(subparts) > 2 else ""
                if sub or teach or dt:
                    items.append({
                        "subject": sub,
                        "teacher": teach,
                        "date_info": dt
                    })
            return items
    except Exception as e:
        logger.warning(f"Błąd AJAX dla {ajax_val}: {e}")
    return []


def pobierz_surowy_plan(plan_id):
    url_start = "https://arktur.umg.edu.pl/planyzaj/strpza5.php"
    url_target = "https://arktur.umg.edu.pl/planyzaj/strpza6.php"
    headers = {"User-Agent": "Mozilla/5.0", "Referer": url_start}

    try:
        session = requests.Session()
        adapter = HTTPAdapter(pool_connections=20, pool_maxsize=20)
        session.mount("https://", adapter)
        session.get(url_start, headers=headers, timeout=10)
        payload = {"id_planu_zajec": plan_id, "id_obiektu": "1", "id_grupy": "0", "nazwa_rodzaju_zestawienia": "0"}
        r = session.post(url_target, data=payload, headers=headers, timeout=10)
        r.raise_for_status()
    except Exception as e:
        logger.error(f"Błąd pobierania surowego planu {plan_id}: {e}")
        return "", []

    html_text = r.text
    soup = BeautifulSoup(html_text, 'html.parser')

    grupy = []
    for h in soup.find_all("td", class_="komopcji"):
        txt = h.get_text(strip=True)

        # Ignorujemy opisy zajęć, znaczniki czasu i nawiasy
        if "ETMON" in txt or "[" in txt or "{" in txt or ":" in txt or len(txt) > 12:
            continue

        if re.search(r"^(?:GR\.?\s*\d+|[1-4]\s*(?:TM|ER|L|N)\b|[A-Z]{2,4}\.?\s*\d+)", txt, re.IGNORECASE):
            if txt not in grupy:
                grupy.append(txt)

    unique_ajax_vals = set()
    inputs_by_id = {inp['id']: inp.get('value', '0') for inp in soup.find_all('input', id=True)}
    id_pattern = re.compile(r"^id_pzz_\d+_\d+_\d+$")
    for inp_id, v1 in inputs_by_id.items():
        if id_pattern.match(inp_id) and v1 and v1 != '0':
            v2 = inputs_by_id.get(f"{inp_id}_2", "0")
            v3 = inputs_by_id.get(f"{inp_id}_3", "0")
            unique_ajax_vals.add(f"{v1}_{v2}_{v3}")

    ajax_cache = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(lambda val: (val, pobierz_dane_z_ajax(session, val, url_target)), unique_ajax_vals)
        for ajax_val, res_items in results:
            ajax_cache[ajax_val] = res_items

    ukryty_cache_html = '<div id="ukryta_baza_prowadzacych" style="display:none;">'
    ukryty_cache_html += f'<script id="ajax_cache_json" type="application/json">{json.dumps(ajax_cache, ensure_ascii=False)}</script>'
    for ajax_val, res_items in ajax_cache.items():
        for idx, res in enumerate(res_items):
            t = html.escape(res.get("teacher", ""))
            s = html.escape(res.get("subject", ""))
            ukryty_cache_html += f'<span id="ajax_{ajax_val}_{idx}" data-subject="{s}">{t}</span>'
        if res_items:
            t0 = html.escape(res_items[0].get("teacher", ""))
            s0 = html.escape(res_items[0].get("subject", ""))
            ukryty_cache_html += f'<span id="ajax_{ajax_val}" data-subject="{s0}">{t0}</span>'

    ukryty_cache_html += '</div>'
    html_text += ukryty_cache_html

    return html_text, grupy


def _wspolny_parser_html(html_text, _soup=None):
    soup = _soup or BeautifulSoup(html_text, 'html.parser')
    min_slot, max_slot = 999, 0
    zajecia_dane = {d: {} for d in DNI_MAPA.values()}
    inputs_by_id = {inp['id']: inp.get('value', '0') for inp in soup.find_all('input', id=True)}

    ajax_cache = {}
    ajax_script = soup.find('script', id='ajax_cache_json')
    if ajax_script and ajax_script.string:
        try:
            ajax_cache = json.loads(ajax_script.string)
        except Exception as e:
            logger.warning(f"Błąd parsowania ajax_cache_json: {e}")

    cache_spans = {
        span['id']: {
            "teacher": span.get_text(strip=True),
            "subject": span.get('data-subject', '').strip()
        }
        for span in soup.find_all('span', id=True)
    }
    manual_dict = load_manual_subjects()

    for td in soup.find_all("td", id=True):
        tid = td['id']
        if not tid.startswith("td_"): continue
        parts = tid.split('_')
        dzien_nazwa = DNI_MAPA.get(parts[1], "Inny")
        cell_slot_start, col_start = int(parts[2]), int(parts[3])
        colspan = int(td.get('colspan', 1))
        rowspan = int(td.get('rowspan', 1))
        cell_end_slot = cell_slot_start + rowspan

        drag = td.find('div', class_='drag')
        if not drag:
            continue

        green_fonts = td.find_all('font', color='green')
        blue_rooms = [
            f.get_text().strip() for f in td.find_all('font', color='darkblue')
            if not f.get_text().strip().startswith('{prow')
        ]

        inner = drag.find('div') or drag
        inner_soup = BeautifulSoup(str(inner), 'html.parser')
        for br in inner_soup.find_all('br'):
            br.replace_with('|||')
        raw_lines = [l.strip() for l in inner_soup.get_text().split('|||') if l.strip()]

        chunks = []
        for l in raw_lines:
            if re.search(r'\b\d{2}:\d{2}\b', l):
                chunks.append([l])
            else:
                if chunks:
                    chunks[-1].append(l)
                else:
                    chunks.append([l])

        if not chunks:
            chunks = [raw_lines] if raw_lines else [[""]]

        numer = tid.split('_', 1)[1]
        v1 = inputs_by_id.get(f"id_pzz_{numer}", '0')
        v2 = inputs_by_id.get(f"id_pzz_{numer}_2", '0')
        v3 = inputs_by_id.get(f"id_pzz_{numer}_3", '0')
        ajax_key = f"{v1}_{v2}_{v3}"
        ajax_items = ajax_cache.get(ajax_key, [])

        for i, chunk in enumerate(chunks):
            chunk_text = ' '.join(chunk)
            start_h = green_fonts[i].get_text().strip() if i < len(green_fonts) else None
            if not start_h:
                time_match = re.search(r'\b(\d{2}:\d{2})\b', chunk_text)
                start_h = time_match.group(1) if time_match else "??:??"

            sala = blue_rooms[i] if i < len(blue_rooms) else ('OL' if not blue_rooms else blue_rooms[0])

            try:
                sh, sm = map(int, start_h.split(':'))
                sub_slot_start = (sh - 7) * 12 + sm // 5
            except Exception:
                sub_slot_start = cell_slot_start

            if sub_slot_start < min_slot: min_slot = sub_slot_start
            if cell_end_slot > max_slot: max_slot = cell_end_slot

            sub_height = max(1, cell_end_slot - sub_slot_start)
            sub_duration = sub_height * 5
            koniec_h = oblicz_godzine_konca(start_h, sub_duration)

            match_prow = re.search(r"\{prow:\s*([^}]+)\}", chunk_text)
            prowadzacy = ""
            ajax_subject = ""
            if match_prow:
                prowadzacy = match_prow.group(1).strip()
            elif i < len(ajax_items):
                prowadzacy = ajax_items[i].get("teacher", "").strip()
                ajax_subject = ajax_items[i].get("subject", "").strip()
            elif ajax_key in cache_spans:
                prowadzacy = cache_spans[ajax_key].get("teacher", "").strip()
                ajax_subject = cache_spans[ajax_key].get("subject", "").strip()

            data_start_match = re.search(r"\[od:\s*(\d{4}-\d{2}-\d{2})\]", chunk_text)
            tygodnie_match = re.search(r"\[il\.tyg:\s*(\d+)\]", chunk_text)
            data_start = data_start_match.group(1) if data_start_match else None
            liczba_tygodni = int(tygodnie_match.group(1)) if tygodnie_match else None

            if not data_start and i < len(ajax_items):
                d_m = re.search(r"(\d{4}-\d{2}-\d{2})", ajax_items[i].get("date_info", ""))
                if d_m: data_start = d_m.group(1)
            if liczba_tygodni is None and i < len(ajax_items):
                t_m = re.search(r"tygodni:\s*(\d+)", ajax_items[i].get("date_info", ""))
                if t_m: liczba_tygodni = int(t_m.group(1))
            if liczba_tygodni is None:
                liczba_tygodni = 20

            l0 = chunk[0] if chunk else ""
            cleaned = re.sub(r'\b\d{2}:\d{2}\b', '', l0)
            if sala != 'OL':
                cleaned = cleaned.replace(sala, '')
            cleaned = re.sub(r'\(.*?\)', '', cleaned)
            cleaned = re.sub(r'\{.*?\}', '', cleaned)
            cleaned = re.sub(r'\[.*?\]', '', cleaned)
            raw_przedmiot = cleaned.strip()

            if raw_przedmiot in manual_dict:
                przedmiot = manual_dict[raw_przedmiot]
            elif ajax_subject:
                przedmiot = ajax_subject
            elif i < len(ajax_items) and ajax_items[i].get("subject"):
                przedmiot = ajax_items[i]["subject"]
            else:
                przedmiot = raw_przedmiot

            lesson_obj = {
                "przedmiot": przedmiot,
                "raw_przedmiot": raw_przedmiot,
                "prowadzacy": prowadzacy,
                "godziny": f"{start_h} - {koniec_h}",
                "sala": sala,
                "height": sub_height,
                "colspan": colspan,
                "data_start": data_start,
                "tygodnie": liczba_tygodni
            }

            slot_key = sub_slot_start
            if slot_key in zajecia_dane[dzien_nazwa] and col_start in zajecia_dane[dzien_nazwa][slot_key]:
                slot_key = f"{sub_slot_start}_{i}"

            if slot_key not in zajecia_dane[dzien_nazwa]:
                zajecia_dane[dzien_nazwa][slot_key] = {}

            zajecia_dane[dzien_nazwa][slot_key][col_start] = lesson_obj

    # Safe fallback only for subjects where no teacher was found anywhere
    # but only if a known subject abbreviation has a single unambiguous teacher
    teacher_counts = {}
    for dzien in zajecia_dane.values():
        for slot in dzien.values():
            for info in slot.values():
                t = info.get("prowadzacy")
                r = info.get("raw_przedmiot")
                if t and r:
                    teacher_counts.setdefault(r, set()).add(t)

    unambiguous_teachers = {
        r: list(teachers)[0]
        for r, teachers in teacher_counts.items()
        if len(teachers) == 1
    }

    for dzien in zajecia_dane.values():
        for slot in dzien.values():
            for info in slot.values():
                raw = info.get("raw_przedmiot")
                if not info.get("prowadzacy") and raw in unambiguous_teachers:
                    info["prowadzacy"] = unambiguous_teachers[raw]

    min_slot = (min_slot // 12) * 12 if min_slot != 999 else 24
    max_slot = ((max_slot // 12) + 1) * 12 if max_slot != 0 else 144
    return zajecia_dane, min_slot, max_slot


def przetworz_plan_na_grafike(html_text, wybrana_grupa, lista_grup, _soup=None):
    if wybrana_grupa not in lista_grup:
        return {}, 0, 0

    target_idx = lista_grup.index(wybrana_grupa)
    dane_z_kolumnami, min_slot, max_slot = _wspolny_parser_html(html_text, _soup=_soup)

    dane_plaskie = {d: {} for d in DNI_MAPA.values()}

    for dzien, sloty in dane_z_kolumnami.items():
        for slot_start, cols in sloty.items():
            wybrane_info = None

            # SORTUJEMY KOLUMNY: Najpierw te, które są najbliżej naszej grupy
            # To zapobiegnie nadpisaniu Twoich ćwiczeń przez wykład ogólny,
            # jeśli oba są w tym samym slocie.
            posortowane_kolumny = sorted(cols.keys(), key=lambda k: abs(k - target_idx))

            for col_start in posortowane_kolumny:
                info = cols[col_start]
                colspan = info.get("colspan", 1)

                # WARUNEK 1: Dokładne przykrycie Twojej grupy
                if col_start <= target_idx < (col_start + colspan):
                    wybrane_info = info
                    break

                # WARUNEK 2: Specjalny przypadek dla "BiSS" i Auli (kolumna 0 i duży colspan)
                # Jeśli kafelek zaczyna się w kolumnie 0 i jest szeroki (np. min 5 kolumn),
                # traktujemy go jako ogólny, o ile nie mamy już nic lepszego.
                if col_start == 0 and colspan > 5:
                    wybrane_info = info
                    # Nie robimy break, bo może dalej w pętli znajdziemy coś,
                    # co jeszcze lepiej pasuje do naszej konkretnej kolumny.

            if wybrane_info:
                target_key = slot_start
                if target_key in dane_plaskie[dzien]:
                    target_key = f"{slot_start}_{len(dane_plaskie[dzien])}"
                dane_plaskie[dzien][target_key] = wybrane_info

    return dane_plaskie, min_slot, max_slot


def przetworz_plan_wszystkie(html_text, lista_grup):
    return _wspolny_parser_html(html_text)


def generuj_ics(dane_planu, nazwa_grupy):
    cal = Calendar()
    cal.add('prodid', f'-//UMG Navigator//{nazwa_grupy}//')
    cal.add('version', '2.0')
    cal.add('x-wr-calname', f'Plan {nazwa_grupy}') # Automatyczna nazwa w apce
    cal.add('x-wr-timezone', 'Europe/Warsaw')

    def _dodaj_event(info):
        if not info.get("data_start"): return
        try:
            # Poprawione parsowanie godzin
            g_start, g_koniec = info['godziny'].split(' - ')
            start_dt = datetime.strptime(f"{info['data_start']} {g_start}", "%Y-%m-%d %H:%M")
            koniec_dt = datetime.strptime(f"{info['data_start']} {g_koniec}", "%Y-%m-%d %H:%M")

            # Format location nicely
            sala = str(info.get('sala', '')).strip()
            if sala.upper() == 'OL':
                loc = "Zdalnie / Online"
            elif sala.lower().startswith('sala') or sala.lower().startswith('aula') or sala.lower().startswith('basen'):
                loc = sala
            elif sala:
                loc = f"Sala {sala}"
            else:
                loc = ""

            prow = str(info.get('prowadzacy', '')).strip()
            desc = f"Prowadzący: {prow}" if prow else "Brak danych prowadzącego"
            if nazwa_grupy:
                desc += f"\nGrupa: {nazwa_grupy}"

            for t in range(info.get("tygodnie", 1)):
                event = Event()
                event.add('summary', info['przedmiot'])
                event.add('dtstart', start_dt + timedelta(weeks=t))
                event.add('dtend', koniec_dt + timedelta(weeks=t))
                if loc:
                    event.add('location', loc)
                event.add('description', desc)
                cal.add_component(event)
        except Exception as e:
            logger.warning(f"ICS - pominięto: {e}")

    # Obsługa różnych formatów danych wejściowych
    if isinstance(dane_planu, dict):
        for dzien_nazwa, sloty in dane_planu.items():
            for slot, slot_data in sloty.items():
                if "przedmiot" in slot_data:
                    _dodaj_event(slot_data)
                else:
                    for col_idx, info in slot_data.items():
                        if isinstance(info, dict) and "przedmiot" in info:
                            _dodaj_event(info)

    output = cal.to_ical()
    if isinstance(output, bytes):
        return output.decode("utf-8")
    return output