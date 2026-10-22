#!/usr/bin/env python3
"""
UMG Schedule Static Site Generator
Scrapes plans from UMG, generates JSON + ICS files, and exports a production-ready static site to dist/
"""

import os
import re
import sys
import json
import shutil
import argparse
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import requests

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("build_static")

from arktur_client import pobierz_liste_planow, pobierz_surowy_plan, pobierz_plany_w_modyfikacji
from arktur_parser import przetworz_plan_na_grafike, _wspolny_parser_html
from ics_export import generuj_ics, generate_nst_ics, load_academic_calendar
from nst_client import fetch_nst_plans_list, download_pdf_file
from nst_parser import parse_pdf_schedule
from models import LessonDict, RoomScheduleEntry, TeacherScheduleEntry


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DATA_DIR = os.path.join(BASE_DIR, "data")
WEB_DIR = os.path.join(BASE_DIR, "web")
DIST_DIR = os.path.join(BASE_DIR, "dist")
DATA_DIR = os.path.join(DIST_DIR, "data")
SCHEDULES_DIR = os.path.join(DATA_DIR, "schedules")
CALENDARS_DIR = os.path.join(DIST_DIR, "calendars")
PRODUCTION_BASE_URL = "https://qu4x.github.io/planwn"
DEFAULT_HEADERS = {"User-Agent": "Mozilla/5.0"}


def _get_data_path(filename: str) -> str:
    """Returns path to reference data file, checking data/ first then falling back to BASE_DIR."""
    p = os.path.join(SRC_DATA_DIR, filename)
    if os.path.exists(p):
        return p
    return os.path.join(BASE_DIR, filename)


CURRICULUM_FORMS_PATH = _get_data_path("wn_curriculum_forms.json")
FORMS_MANUAL_PATH = _get_data_path("forms_manual.json")


def setup_dist_directories():
    """Ensures clean output directories in dist/"""
    os.makedirs(SCHEDULES_DIR, exist_ok=True)
    os.makedirs(CALENDARS_DIR, exist_ok=True)

    # Sync app version from package.json into sw.js and index.html
    try:
        from scripts.sync_version import sync_version
        sync_version()
    except Exception as e:
        logger.warning(f"Version sync skipped: {e}")

    # Copy web assets (index.html, style.css, app.js, manifest, service worker, icons) to dist/
    web_assets = [
        "index.html",
        "style.css",
        "app.js",
        "manifest.json",
        "sw.js",
        "icon-192.png",
        "icon-512.png",
        "icon-maskable-192.png",
        "icon-maskable-512.png",
        "maskable_icon_x48.png",
        "maskable_icon_x72.png",
        "maskable_icon_x96.png",
        "maskable_icon_x128.png",
        "maskable_icon_x192.png",
        "maskable_icon_x384.png",
        "maskable_icon_x512.png",
        "screenshot-desktop.png",
        "screenshot-mobile.png",
        "apple-touch-icon.png",
        "monochrome.svg",
        "planwn.svg",
        "changelog.json"
    ]
    for filename in web_assets:
        src = os.path.join(WEB_DIR, filename)
        dst = os.path.join(DIST_DIR, filename)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            logger.info(f"Copied {filename} -> dist/")
        else:
            logger.warning(f"File {src} not found!")

    # Copy web/js directory (e.g. schedule-engine.js) to dist/js/
    js_src_dir = os.path.join(WEB_DIR, "js")
    js_dst_dir = os.path.join(DIST_DIR, "js")
    if os.path.exists(js_src_dir):
        os.makedirs(js_dst_dir, exist_ok=True)
        for js_file in os.listdir(js_src_dir):
            shutil.copy2(os.path.join(js_src_dir, js_file), os.path.join(js_dst_dir, js_file))
        logger.info("Copied web/js/ -> dist/js/")

    # Copy academic_calendar.json to dist/data/
    cal_src = _get_data_path("academic_calendar.json")
    cal_dst = os.path.join(DATA_DIR, "academic_calendar.json")
    if os.path.exists(cal_src):
        shutil.copy2(cal_src, cal_dst)
        logger.info("Copied academic_calendar.json -> dist/data/")

    # Copy events.json to dist/data/
    events_src = _get_data_path("events.json")
    events_dst = os.path.join(DATA_DIR, "events.json")
    if os.path.exists(events_src):
        shutil.copy2(events_src, events_dst)
        logger.info("Copied events.json -> dist/data/")


def regenerate_all_ics():
    """Regeneruje pliki .ics w dist/calendars/ na podstawie istniejących plików JSON w dist/data/schedules/"""
    os.makedirs(CALENDARS_DIR, exist_ok=True)
    academic_cal = load_academic_calendar()
    count = 0
    if not os.path.exists(SCHEDULES_DIR):
        logger.warning(f"Brak katalogu {SCHEDULES_DIR}")
        return 0

    for filename in os.listdir(SCHEDULES_DIR):
        if filename.endswith(".json"):
            json_path = os.path.join(SCHEDULES_DIR, filename)
            base_name = os.path.splitext(filename)[0]
            parts = base_name.split("_", 1)
            group_name = parts[1] if len(parts) > 1 else base_name
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    dane_plaskie = json.load(f)
                ics_text = generuj_ics(dane_plaskie, group_name, academic_calendar=academic_cal)
                ics_path = os.path.join(CALENDARS_DIR, f"{base_name}.ics")
                with open(ics_path, "wb") as f:
                    f.write(ics_text.encode("utf-8") if isinstance(ics_text, str) else ics_text)
                count += 1
            except Exception as e:
                logger.error(f"Błąd generowania ICS dla {filename}: {e}")

    logger.info(f"Zregenerowano {count} plików .ics w dist/calendars/")
    return count


def parse_plan_title(raw_name: str) -> dict:
    """
    Ekstraktuje czystą nazwę kierunku/semestru, datę publikacji oraz wersję planu.
    Przykład: '[TM Sem 1] Transport Morski pierwszego stopnia sem. 1 [2026-09-14 17:55] wer. 2'
              -> {'clean_name': 'Transport Morski sem. 1', 'published_at': '2026-09-14 17:55', 'version': 'wer. 2'}
    """
    if not raw_name:
        return {"clean_name": "", "published_at": None, "version": None}

    # Data publikacji [YYYY-MM-DD HH:MM] lub [YYYY-MM-DD]
    date_match = re.search(r'\[(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)\]', raw_name)
    published_at = date_match.group(1) if date_match else None

    # Wersja planu (np. wer. 1, wer. 2)
    ver_match = re.search(r'\b(?:wer\.?|wersja)\s*(\d+)\b', raw_name, re.IGNORECASE)
    version = f"wer. {ver_match.group(1)}" if ver_match else None

    is_second_degree = bool(re.search(r'drugiego\s+stopnia|II\s+st', raw_name, re.IGNORECASE))

    # Oczyszczenie nazwy
    clean = re.sub(r'^\[[^\]]+\]\s*', '', raw_name)
    clean = re.sub(r'\s*\[modyfikowany\]\s*', ' ', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\s*\[\d{4}-\d{2}-\d{2}[^\]]*\]\s*(?:wer\.?\s*\d+)?', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\s*\b(?:wer\.?|wersja)\s*\d+\b', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\s*(?:pierwszego|drugiego)\s+stopnia\s*', ' ', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\s*(?:I|II)\s+stopnia\s*', ' ', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\s+', ' ', clean).strip()

    if is_second_degree and "II st" not in clean:
        clean += " (II st.)"

    return {
        "clean_name": clean or raw_name,
        "published_at": published_at,
        "version": version
    }


def get_plan_sort_key(plan_entry: tuple) -> tuple:
    """Klucz naturalnego sortowania planów: kierunek alfabetycznie, stopień, semestr rosnąco."""
    pid, pdata = plan_entry
    name = (pdata.get("clean_name") or pdata.get("name") or "") if isinstance(pdata, dict) else str(pdata)
    m_sem = re.search(r'\bsem\.?\s*(\d+)\b', name, re.IGNORECASE)
    sem_num = int(m_sem.group(1)) if m_sem else 0
    is_second_degree = bool(re.search(r'drugiego\s+stopnia|II\s+st', name, re.IGNORECASE))
    degree_order = 2 if is_second_degree else 1
    clean_major = re.sub(r'\bsem\.?\s*\d+\b', '', name, flags=re.IGNORECASE)
    clean_major = re.sub(r'\(II\s+st\.?\)', '', clean_major, flags=re.IGNORECASE)
    clean_major = re.sub(r'\s+', ' ', clean_major).strip()
    return (clean_major.lower(), degree_order, sem_num, name)


def load_curriculum_forms(path: Optional[str] = None) -> Dict[str, Any]:
    """Wczytuje oficjalny katalog siatek godzinowych WN z wn_curriculum_forms.json"""
    target_path = path or CURRICULUM_FORMS_PATH
    if os.path.exists(target_path):
        try:
            with open(target_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Nie udało się wczytać curriculum forms ({target_path}): {e}")
    return {}


def load_forms_manual(path: Optional[str] = None) -> Dict[str, Any]:
    """Wczytuje manualne nadpisania form zajęć z forms_manual.json"""
    target_path = path or FORMS_MANUAL_PATH
    if os.path.exists(target_path):
        try:
            with open(target_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Nie udało się wczytać forms_manual.json ({target_path}): {e}")
    return {}


def normalize_form_key(text: str) -> str:
    """Normalizuje nazwę przedmiotu lub kierunku do dopasowania w katalogu."""
    if not text:
        return ""
    text = text.strip().lower()
    return re.sub(r'[\s\-_.,/()]+', ' ', text).strip()


def classify_lesson_form(
    lesson: LessonDict,
    plan_name: str,
    curriculum_catalog: Optional[Dict[str, Any]] = None,
    manual_config: Optional[Dict[str, Any]] = None,
    total_groups: Optional[int] = None
) -> str:
    """
    Klasyfikuje formę zajęć do jednej z czterech kategorii:
    'wyklad', 'cwiczenia', 'laboratorium', 'symulator'.
    Kaskada: manualne nadpisania -> sala -> kolor Arktura -> pełny rocznik -> siatka godzinowa WN -> fallback.
    """
    manual = manual_config or {}
    catalog = curriculum_catalog or {}

    przedmiot = lesson.get("przedmiot", "")
    raw_przedmiot = lesson.get("raw_przedmiot", "")
    sala = (lesson.get("sala") or "").strip()
    colspan = lesson.get("colspan", 1)
    arktur_kolor = lesson.get("arktur_kolor", "default")
    norm_sub = normalize_form_key(przedmiot)
    norm_raw = normalize_form_key(raw_przedmiot)

    # 1. Manualne nadpisania po nazwie przedmiotu (np. WF -> cwiczenia, BHP -> wyklad)
    sub_overrides = manual.get("override_by_subject", {})
    if norm_sub in sub_overrides:
        return sub_overrides[norm_sub]
    if norm_raw in sub_overrides:
        return sub_overrides[norm_raw]

    # 2. Weryfikacja sali (np. 306,400 -> laboratorium, 306 -> symulator, Aula/C136 -> wyklad, basen -> cwiczenia)
    room_lower = sala.lower()
    room_overrides = manual.get("override_by_room", {})
    if room_lower in room_overrides:
        return room_overrides[room_lower]

    for pattern, form in manual.get("room_regex", []):
        if re.search(pattern, room_lower, re.IGNORECASE):
            return form

    # 3. Aula, audytorium lub kolor magenta (laboratoria specjalistyczne w Arkturze)
    if room_lower in ("aula", "audytorium"):
        return "wyklad"

    if arktur_kolor == "magenta":
        return "laboratorium"

    # 4. Sprawdzenie, czy zajęcia łączą cały rocznik / dużą grupę wykładową
    # Standardowe ćwiczenia łączą maksymalnie 2 grupy dziekańskie (colspan 1 lub 2).
    # Wykłady łączą cały rocznik (colspan >= 4 lub colspan >= total_groups).
    threshold = 4 if not total_groups else min(4, total_groups)
    is_cohort_wide = colspan >= threshold

    # 5. Sprawdzenie w oficjalnej siatce godzinowej WN
    m_sem = re.search(r'\bsem\.?\s*(\d+)\b', plan_name, re.IGNORECASE)
    sem_str = m_sem.group(1) if m_sem else None

    norm_plan = normalize_form_key(plan_name)
    matched_major_data = None
    for m_key, m_val in catalog.get("majors", {}).items():
        if m_key in norm_plan:
            matched_major_data = m_val
            break

    curriculum_entry = None
    if matched_major_data and sem_str and sem_str in matched_major_data.get("semesters", {}):
        sem_subs = matched_major_data["semesters"][sem_str]
        curriculum_entry = sem_subs.get(norm_sub) or sem_subs.get(norm_raw)

    if curriculum_entry:
        if curriculum_entry.get("single_form"):
            return curriculum_entry["single_form"]
        if is_cohort_wide and curriculum_entry.get("A", 0) > 0:
            return "wyklad"
        # Dla podgrup ćwiczeniowych/laboratoryjnych
        forms = curriculum_entry.get("forms", [])
        if "symulator" in forms and "cwiczenia" not in forms and "laboratorium" not in forms:
            return "symulator"
        if "cwiczenia" in forms and "laboratorium" in forms:
            # a) Pracownia laboratoryjna / komputerowa / sala wielokrotna
            if any(re.search(p, room_lower) for p in [r'\blab\b', r'\bprac\b', r'\bmw\b', r'h\d+', r'\d+a\b']) or "," in sala:
                return "laboratorium"
            # b) Większa podgrupa (ćwiczenia tablicowe często łączą >= 2 grupy)
            if colspan > 1:
                return "cwiczenia"
            # c) Stosunek godzin w siatce
            if curriculum_entry.get("C", 0) >= curriculum_entry.get("L", 0):
                return "cwiczenia"
            return "laboratorium"

        if "cwiczenia" in forms:
            return "cwiczenia"
        if "laboratorium" in forms:
            return "laboratorium"
        if "symulator" in forms:
            return "symulator"

    if norm_sub in catalog.get("global_single_forms", {}):
        return catalog["global_single_forms"][norm_sub]
    if norm_raw in catalog.get("global_single_forms", {}):
        return catalog["global_single_forms"][norm_raw]

    if is_cohort_wide:
        return "wyklad"

    # 6. Domyślny fallback dla sal standardowych
    return "cwiczenia"


def fetch_production_plans_metadata(
    production_base_url: str = PRODUCTION_BASE_URL,
    session: Optional[requests.Session] = None
) -> Dict[str, Any]:
    """Pobiera i normalizuje plans.json ze wskazanego adresu produkcyjnego."""
    http_session = session or requests.Session()
    plans_url = f"{production_base_url.rstrip('/')}/data/plans.json"
    try:
        resp = http_session.get(plans_url, headers=DEFAULT_HEADERS, timeout=10)
        if resp.status_code != 200:
            logger.warning(f"Could not fetch production plans.json (status {resp.status_code})")
            return {}
        prod_data = resp.json()
        all_plans = prod_data.get("plans", {})
        if isinstance(all_plans, list):
            all_plans = {str(p.get("id")): p for p in all_plans if isinstance(p, dict) and "id" in p}
        elif not isinstance(all_plans, dict):
            all_plans = {}
        return all_plans
    except Exception as e:
        logger.warning(f"Failed to fetch production plans.json: {e}")
        return {}


def restore_plan_from_production(
    plan_id: str,
    plan_data: Dict[str, Any],
    production_base_url: str = PRODUCTION_BASE_URL,
    session: Optional[requests.Session] = None
) -> int:
    """
    Pobiera pliki .json i .ics wszystkich grup danego planu (stacjonarnego lub NST) z produkcji.
    Zwraca liczbę pomyślnie przywróconych grup.
    """
    http_session = session or requests.Session()
    groups = plan_data.get("groups", [])
    if not groups:
        return 0

    os.makedirs(SCHEDULES_DIR, exist_ok=True)
    os.makedirs(CALENDARS_DIR, exist_ok=True)

    plan_groups_restored = 0
    for grp in groups:
        safe_grp = re.sub(r'[^\w-]', '_', grp)
        sched_filename = f"{plan_id}_{safe_grp}.json"
        sched_url = f"{production_base_url.rstrip('/')}/data/schedules/{sched_filename}"
        sched_path = os.path.join(SCHEDULES_DIR, sched_filename)

        cal_filename = f"{plan_id}_{safe_grp}.ics"
        cal_url = f"{production_base_url.rstrip('/')}/calendars/{cal_filename}"
        cal_path = os.path.join(CALENDARS_DIR, cal_filename)

        try:
            s_resp = http_session.get(sched_url, headers=DEFAULT_HEADERS, timeout=10)
            if s_resp.status_code == 200:
                with open(sched_path, "w", encoding="utf-8") as sf:
                    sf.write(s_resp.text)
                plan_groups_restored += 1
            else:
                logger.warning(f"Could not fetch schedule {sched_url} (status {s_resp.status_code})")

            c_resp = http_session.get(cal_url, headers=DEFAULT_HEADERS, timeout=10)
            if c_resp.status_code == 200:
                with open(cal_path, "wb") as cf:
                    cf.write(c_resp.content)
        except Exception as ge:
            logger.warning(f"Error restoring group files for {plan_id} {grp}: {ge}")

    if plan_groups_restored > 0:
        logger.warning(f"⚠️ Restored plan '{plan_id}' ({plan_groups_restored} groups) from production ({production_base_url}).")

    return plan_groups_restored


def restore_nst_plans_from_production(
    production_base_url: str = PRODUCTION_BASE_URL,
    session: Optional[requests.Session] = None
) -> Tuple[Dict[str, Any], int]:
    """
    Pobiera ostatni poprawny stan planów niestacjonarnych (NST) z produkcyjnego GitHub Pages.
    Zwraca słownik planów NST oraz liczbę przywróconych grup (wrapper dla kompatybilności wstecznej).
    """
    all_plans = fetch_production_plans_metadata(production_base_url, session=session)
    nst_plans = {pid: p for pid, p in all_plans.items() if p.get("mode") == "niestacjonarne"}
    restored_plans = {}
    total_restored = 0
    for pid, pdata in nst_plans.items():
        count = restore_plan_from_production(pid, pdata, production_base_url, session=session)
        if count > 0:
            restored_plans[pid] = pdata
            total_restored += count
    return restored_plans, total_restored


def check_for_updates(
    production_base_url: str = PRODUCTION_BASE_URL,
    session: Optional[requests.Session] = None
) -> Tuple[bool, List[str]]:
    """
    Sprawdza, czy na Arkturze pojawiły się nowe lub zaktualizowane plany w porównaniu z produkcją.
    Zwraca (has_updates: bool, changes: List[str]).
    """
    http_session = session or requests.Session()
    prod_plans = fetch_production_plans_metadata(production_base_url, session=http_session)
    if not prod_plans:
        logger.warning("Could not fetch production plans.json. Full build required.")
        return True, ["Production plans.json unavailable - full build required"]

    changes: List[str] = []

    # 1. Sprawdź stacjonarne ze strpza5.php
    arktur_plans = pobierz_liste_planow()
    if not arktur_plans:
        logger.warning("Could not fetch stationary plans list from Arktur. Assuming updates are present.")
        return True, ["Arktur stationary list unreachable"]

    for raw_name, pid in arktur_plans.items():
        pid_str = str(pid)
        parsed = parse_plan_title(raw_name)
        new_ver = parsed.get("version")
        new_date = parsed.get("published_at")

        if pid_str not in prod_plans:
            changes.append(f"New stationary plan: {pid_str} ('{parsed.get('clean_name')}')")
            continue

        prod_p = prod_plans[pid_str]
        old_ver = prod_p.get("version")
        old_date = prod_p.get("published_at")

        if new_ver != old_ver or new_date != old_date:
            changes.append(
                f"Stationary plan {pid_str} updated: "
                f"ver {old_ver}->{new_ver}, date {old_date}->{new_date}"
            )

    # 2. Sprawdź niestacjonarne ze strpza5n.php
    try:
        nst_plans = fetch_nst_plans_list(session=http_session)
        for nst_item in nst_plans:
            pid_nst = f"nst_{nst_item['id']}"
            new_date = nst_item.get("modified")

            if pid_nst not in prod_plans:
                changes.append(f"New NST plan: {pid_nst} ('{nst_item.get('name')}')")
                continue

            prod_p = prod_plans[pid_nst]
            old_date = prod_p.get("published_at")
            if new_date and old_date and new_date != old_date:
                changes.append(f"NST plan {pid_nst} updated: date {old_date}->{new_date}")
    except Exception as e:
        logger.warning(f"Error checking NST plans: {e}")
        return True, [f"Error checking NST plans: {e}"]

    has_updates = len(changes) > 0
    return has_updates, changes


def build(limit=None, plan_ids=None, filter_query=None):
    """Main build process"""
    start_time = datetime.now()
    logger.info("Starting UMG Static Site Build...")

    setup_dist_directories()
    production_plans_cache = fetch_production_plans_metadata()

    curriculum_catalog = load_curriculum_forms()
    manual_forms_config = load_forms_manual()

    logger.info("1. Fetching plans list from UMG...")
    plany_slownik = pobierz_liste_planow()
    if not plany_slownik:
        logger.error("Failed to retrieve plans from UMG. Aborting build.")
        sys.exit(1)

    logger.info(f"Found {len(plany_slownik)} plans.")

    # Fetch plans currently marked as [modyfikowany] or draft (value=0) on Arktur
    plany_modyfikowane = pobierz_plany_w_modyfikacji()
    modifying_map = {}
    for mod_item in plany_modyfikowane:
        mod_parsed = parse_plan_title(mod_item["raw_name"])
        clean_key = mod_parsed["clean_name"]
        if clean_key:
            modifying_map[clean_key] = {
                "is_modifying": True,
                "draft_version": mod_parsed["version"],
                "draft_date": mod_parsed["published_at"]
            }
    if modifying_map:
        logger.info(f"Detected {len(modifying_map)} plans currently being modified on Arktur: {list(modifying_map.keys())}")

    # Filter/limit if specified
    plan_items = list(plany_slownik.items())
    if plan_ids:
        plan_id_set = {str(pid).strip() for pid in plan_ids}
        plan_items = [(name, pid) for name, pid in plan_items if str(pid) in plan_id_set]
        logger.info(f"Filtered to {len(plan_items)} plans by plan IDs: {plan_ids}")
    elif filter_query:
        fq = filter_query.lower()
        plan_items = [(name, pid) for name, pid in plan_items if fq in name.lower()]
        logger.info(f"Filtered to {len(plan_items)} plans matching '{filter_query}'")
    elif limit and limit > 0:
        logger.info(f"Applying limit: processing first {limit} plans only.")
        plan_items = plan_items[:limit]

    plans_metadata = {
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "plans": {}
    }

    total_groups_processed = 0
    total_nst_groups_processed = 0
    discovered_subjects = {}

    for idx, (plan_name, plan_id) in enumerate(plan_items, start=1):
        plan_id_str = str(plan_id)
        logger.info(f"[{idx}/{len(plan_items)}] Scraping plan {plan_id_str}: '{plan_name}'...")

        try:
            html_text, grupy = pobierz_surowy_plan(plan_id_str)
        except Exception as e:
            logger.error(f"Error scraping plan {plan_id_str}: {e}")
            grupy = []
            html_text = ""

        if not grupy:
            logger.warning(f"No groups detected or scraping failed for plan {plan_id_str}.")
            prev_plan = production_plans_cache.get(plan_id_str)
            if prev_plan:
                r_count = restore_plan_from_production(plan_id_str, prev_plan)
                if r_count > 0:
                    plans_metadata["plans"][plan_id_str] = prev_plan
                    total_groups_processed += r_count
                    logger.warning(f"Preserved stationary plan {plan_id_str} with previous version '{prev_plan.get('version')}' and date '{prev_plan.get('published_at')}'.")
                    continue
            logger.warning(f"Could not restore plan {plan_id_str}. Skipping.")
            continue

        parsed_title = parse_plan_title(plan_name)
        plan_entry = {
            "name": plan_name,
            "clean_name": parsed_title["clean_name"],
            "published_at": parsed_title["published_at"],
            "version": parsed_title["version"],
            "groups": grupy,
            "mode": "stacjonarne"
        }
        if parsed_title["clean_name"] in modifying_map:
            plan_entry["modification"] = modifying_map[parsed_title["clean_name"]]

        plans_metadata["plans"][plan_id_str] = plan_entry

        # Parse schedule once for all groups in this plan
        parsed_schedule = _wspolny_parser_html(html_text)

        # Process each group in plan
        for grupa in grupy:
            try:
                # 1. Generate flat schedule JSON
                dane_plaskie, min_slot, max_slot = przetworz_plan_na_grafike(
                    html_text, grupa, grupy, _parsed_schedule=parsed_schedule
                )

                # Classify form for each lesson (wyklad, cwiczenia, laboratorium, symulator)
                for day_slots in dane_plaskie.values():
                    for lesson in day_slots.values():
                        lesson["forma"] = classify_lesson_form(
                            lesson, plan_name, curriculum_catalog, manual_forms_config, total_groups=len(grupy)
                        )

                safe_grupa = re.sub(r'[^\w-]', '_', grupa)
                safe_group_filename = f"{plan_id_str}_{safe_grupa}.json"
                json_path = os.path.join(SCHEDULES_DIR, safe_group_filename)
                with open(json_path, "w", encoding="utf-8") as jf:
                    json.dump(dane_plaskie, jf, ensure_ascii=False, indent=2)

                # 2. Generate iCal (.ics) file
                ics_text = generuj_ics(dane_plaskie, grupa)
                ics_filename = f"{plan_id_str}_{safe_grupa}.ics"
                ics_path = os.path.join(CALENDARS_DIR, ics_filename)
                with open(ics_path, "wb") as icsf:
                    icsf.write(ics_text.encode("utf-8") if isinstance(ics_text, str) else ics_text)

                total_groups_processed += 1

                # Collect discovered subjects
                for day_slots in dane_plaskie.values():
                    for lesson in day_slots.values():
                        raw_sub = lesson.get("raw_przedmiot")
                        res_sub = lesson.get("przedmiot")
                        if raw_sub:
                            discovered_subjects[raw_sub] = res_sub

            except Exception as e:
                logger.error(f"Error processing group {grupa} in plan {plan_id_str}: {e}")

    # =========================================================================
    # Part-time (NST) studies schedule processing from PDF files
    # =========================================================================
    logger.info("2. Fetching part-time (NST) plans list from UMG...")
    try:
        nst_plans = fetch_nst_plans_list()
        logger.info(f"Found {len(nst_plans)} part-time (NST) plans.")
        if len(nst_plans) == 0:
            logger.error("Scraper returned 0 part-time (NST) plans from Arktur.")
        if limit and limit > 0:
            nst_plans = nst_plans[:limit]
        cache_pdf_dir = os.path.join(BASE_DIR, "cache_nst_pdf")
        os.makedirs(cache_pdf_dir, exist_ok=True)

        for nst_item in nst_plans:
            plan_id_nst = f"nst_{nst_item['id']}"
            plan_name = nst_item["name"]
            pdf_url = nst_item["pdf_url"]
            local_pdf_path = os.path.join(cache_pdf_dir, nst_item["filename"])

            # Download or use cached PDF
            logger.info(f"Downloading/parsing NST plan {plan_id_nst} ({plan_name})...")
            if not download_pdf_file(pdf_url, local_pdf_path):
                logger.warning(f"Could not download NST PDF {pdf_url}.")
                prev_plan = production_plans_cache.get(plan_id_nst)
                if prev_plan:
                    r_count = restore_plan_from_production(plan_id_nst, prev_plan)
                    if r_count > 0:
                        plans_metadata["plans"][plan_id_nst] = prev_plan
                        total_groups_processed += r_count
                        total_nst_groups_processed += r_count
                        logger.warning(f"Preserved NST plan {plan_id_nst} with previous date '{prev_plan.get('published_at')}'.")
                        continue
                continue

            # Parse PDF schedule
            nst_schedule_by_group = parse_pdf_schedule(local_pdf_path)
            if not nst_schedule_by_group:
                logger.warning(f"No schedule extracted from {local_pdf_path}.")
                prev_plan = production_plans_cache.get(plan_id_nst)
                if prev_plan:
                    r_count = restore_plan_from_production(plan_id_nst, prev_plan)
                    if r_count > 0:
                        plans_metadata["plans"][plan_id_nst] = prev_plan
                        total_groups_processed += r_count
                        total_nst_groups_processed += r_count
                        logger.warning(f"Preserved NST plan {plan_id_nst} with previous date '{prev_plan.get('published_at')}'.")
                        continue
                continue

            nst_groups = sorted(list(nst_schedule_by_group.keys()))
            clean_name = f"{plan_name} (niestacjonarne)"

            plans_metadata["plans"][plan_id_nst] = {
                "name": plan_name,
                "clean_name": clean_name,
                "published_at": nst_item.get("modified"),
                "version": None,
                "groups": nst_groups,
                "mode": "niestacjonarne"
            }

            for group_name, dates_dict in nst_schedule_by_group.items():
                try:
                    safe_group = re.sub(r'[^\w-]', '_', group_name)
                    safe_group_filename = f"{plan_id_nst}_{safe_group}.json"
                    json_path = os.path.join(SCHEDULES_DIR, safe_group_filename)
                    with open(json_path, "w", encoding="utf-8") as jf:
                        json.dump(dates_dict, jf, ensure_ascii=False, indent=2)

                    # Generate iCal (.ics) calendar
                    ics_text = generate_nst_ics(dates_dict, group_name)
                    ics_filename = f"{plan_id_nst}_{safe_group}.ics"
                    ics_path = os.path.join(CALENDARS_DIR, ics_filename)
                    with open(ics_path, "wb") as icsf:
                        icsf.write(ics_text.encode("utf-8") if isinstance(ics_text, str) else ics_text)

                    total_groups_processed += 1
                    total_nst_groups_processed += 1
                except Exception as ge:
                    logger.error(f"Error processing NST group {group_name} in {plan_id_nst}: {ge}")

    except Exception as nst_err:
        logger.error(f"Error while processing part-time (NST) plans: {nst_err}")

    # Write plans.json metadata file (merge with existing plans only if subset was processed)
    plans_json_path = os.path.join(DATA_DIR, "plans.json")
    existing_plans = {}
    is_subset = bool(limit or plan_ids or filter_query)
    if os.path.exists(plans_json_path):
        try:
            with open(plans_json_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
                existing_plans = existing_data.get("plans", {})
                if isinstance(existing_plans, list):
                    existing_plans = {str(p.get("id")): p for p in existing_plans if isinstance(p, dict) and "id" in p}
                elif not isinstance(existing_plans, dict):
                    existing_plans = {}
        except Exception:
            existing_plans = {}

    if is_subset:
        merged_plans = {**existing_plans, **plans_metadata["plans"]}
    else:
        merged_plans = {**plans_metadata["plans"]}
        # Safety: preserve existing NST plans from previous plans.json if they were not parsed in this run
        for pid, p in existing_plans.items():
            if p.get("mode") == "niestacjonarne" and pid not in merged_plans:
                has_files = False
                for grp in p.get("groups", []):
                    safe_grp = re.sub(r'[^\w-]', '_', grp)
                    if os.path.exists(os.path.join(SCHEDULES_DIR, f"{pid}_{safe_grp}.json")):
                        has_files = True
                        total_nst_groups_processed += 1
                        total_groups_processed += 1
                if has_files:
                    merged_plans[pid] = p
                    logger.warning(f"Preserved existing NST plan '{pid}' from previous plans.json.")

        # If STILL no NST plans are available in full build (e.g. fresh CI runner), restore from production
        current_nst_count = sum(1 for p in merged_plans.values() if p.get("mode") == "niestacjonarne")
        if current_nst_count == 0:
            logger.warning("No NST plans found locally; attempting to restore from production...")
            restored_plans, restored_groups = restore_nst_plans_from_production()
            merged_plans.update(restored_plans)
            total_nst_groups_processed += restored_groups
            total_groups_processed += restored_groups
    plans_metadata["plans"] = dict(sorted(merged_plans.items(), key=get_plan_sort_key))

    with open(plans_json_path, "w", encoding="utf-8") as f:
        json.dump(plans_metadata, f, ensure_ascii=False, indent=2)

    # Merge manual subjects with discovered subjects
    manual_subjects_path = _get_data_path("subjects_manual.json")
    manual_subjects = {}
    if os.path.exists(manual_subjects_path):
        try:
            with open(manual_subjects_path, "r", encoding="utf-8") as mf:
                manual_subjects = json.load(mf)
        except Exception as e:
            logger.warning(f"Could not load subjects_manual.json: {e}")

    # Manual overrides take precedence over discovered
    final_subjects = {**discovered_subjects, **manual_subjects}


    # Warn about unresolved abbreviations
    for raw, res in final_subjects.items():
        if raw == res and len(raw) <= 4 and raw.isupper():
            logger.warning(f"⚠️ Unresolved subject abbreviation: '{raw}' - consider adding to subjects_manual.json")

    # Quality gate: abort build if scraping produced too few groups
    min_required_groups = 1 if (limit or plan_ids or filter_query) else 10
    if total_groups_processed < min_required_groups:
        logger.error(
            f"Quality gate failure: total_groups_processed ({total_groups_processed}) < "
            f"minimum required ({min_required_groups}). Aborting build."
        )
        sys.exit(1)

    # Quality gate for part-time (NST) plans: in full build, require at least 1 NST group
    if not is_subset:
        nst_final_count = sum(1 for p in plans_metadata["plans"].values() if p.get("mode") == "niestacjonarne")
        if nst_final_count == 0 or total_nst_groups_processed < 1:
            logger.error(
                f"Quality gate failure: 0 part-time (NST) plans/groups available in final build "
                f"(nst_plans={nst_final_count}, nst_groups={total_nst_groups_processed}) "
                f"and production fallback was unavailable. Aborting build."
            )
            sys.exit(1)

    # Generate cross-reference index files
    if not build_cross_reference_indexes(plans_metadata):
        logger.error("Quality gate failure: Failed to build cross-reference indexes. Aborting build.")
        sys.exit(1)

    elapsed = (datetime.now() - start_time).total_seconds()
    logger.info(f"Build complete in {elapsed:.1f}s!")
    logger.info(f"Summary: {len(plans_metadata['plans'])} plans, {total_groups_processed} group schedules & calendars generated in dist/")
    return total_groups_processed


def _is_same_cycle(
    entry: dict,
    co_ile: int,
    od_tyg: int,
    polowa_sem: Optional[int],
    data_start: str
) -> bool:
    """Helper to verify if schedule entry belongs to the identical academic cycle/half."""
    return (
        entry.get("co_ile", 1) == co_ile
        and entry.get("od_tyg", 1) == od_tyg
        and entry.get("polowa_sem") == polowa_sem
        and entry.get("data_start", "") == data_start
    )


def build_cross_reference_indexes(plans_metadata=None, schedules_dir=SCHEDULES_DIR, output_path=None):
    """
    Builds searchable indexes for Teachers, Rooms, and Subjects across all plans.
    Exports to a single combined dist/data/cross_reference.json.
    """
    if not os.path.exists(schedules_dir) or not any(f.endswith(".json") for f in os.listdir(schedules_dir)):
        logger.error(f"Cannot build cross-reference indexes: '{schedules_dir}' is empty or does not exist.")
        return False

    logger.info("Building cross-reference indexes (teachers, rooms, subjects)...")
    dni_order = {"PON": 1, "WT": 2, "ŚR": 3, "CZW": 4, "PT": 5, "SOB": 6, "ND": 7}

    # Load plans metadata if not passed
    if not plans_metadata:
        plans_json_path = os.path.join(DATA_DIR, "plans.json")
        if os.path.exists(plans_json_path):
            with open(plans_json_path, "r", encoding="utf-8") as pf:
                plans_metadata = json.load(pf)
        else:
            plans_metadata = {"plans": {}}

    plans_dict = plans_metadata.get("plans", {})
    if not plans_dict:
        logger.error("Cannot build cross-reference indexes: plans metadata is empty or missing.")
        return False

    # Load WN official subject catalog
    wn_catalog_path = _get_data_path("wn_subjects_catalog.json")
    wn_catalog = {}
    if os.path.exists(wn_catalog_path):
        try:
            with open(wn_catalog_path, "r", encoding="utf-8") as wf:
                wn_catalog = json.load(wf)
            logger.info(f"Loaded {len(wn_catalog)} subjects from WN catalog.")
        except Exception as e:
            logger.warning(f"Could not load wn_subjects_catalog.json: {e}")

    wn_lower = {k.lower(): (k, v) for k, v in wn_catalog.items()}

    teachers_index: Dict[str, List[TeacherScheduleEntry]] = {}
    rooms_index: Dict[str, Dict[str, List[RoomScheduleEntry]]] = {}
    subjects_index: Dict[str, Dict[str, Any]] = {}
    room_set: set = set()

    # Scan all schedule files in SCHEDULES_DIR
    for plan_id_str, plan_info in plans_dict.items():
        plan_name = plan_info.get("name", f"Plan {plan_id_str}")
        groups = plan_info.get("groups", [])

        for group in groups:
            safe_group = re.sub(r'[^\w-]', '_', group)
            schedule_filename = f"{plan_id_str}_{safe_group}.json"
            schedule_path = os.path.join(schedules_dir, schedule_filename)
            if not os.path.exists(schedule_path):
                continue

            try:
                with open(schedule_path, "r", encoding="utf-8") as sf:
                    schedule_data = json.load(sf)
            except Exception as e:
                logger.error(f"Error reading {schedule_path}: {e}")
                continue

            # Unified lesson extraction:
            # - full-time: day (e.g. "PON", "WT") -> dict of slots {"1": lesson_dict}
            # - part-time (NST): date_iso (e.g. "2026-10-01") -> list of lessons [lesson_dict, ...]
            all_entries_to_index = []

            for key, val in schedule_data.items():
                if isinstance(val, dict):
                    # Full-time format
                    day = key
                    for slot_str, lesson in val.items():
                        try:
                            slot = int(str(slot_str).split('_')[0])
                        except ValueError:
                            slot = 0
                        all_entries_to_index.append((day, slot, lesson))
                elif isinstance(val, list):
                    # Part-time (NST) format: key is ISO date e.g. "2026-10-03"
                    date_iso = key
                    for idx, lesson in enumerate(val):
                        # Determine day code from 'dzien' field or ISO date
                        raw_day_name = lesson.get("dzien", "").strip()
                        day_name_to_code = {
                            "Poniedziałek": "PON", "Wtorek": "WT", "Środa": "ŚR",
                            "Czwartek": "CZW", "Piątek": "PT", "Sobota": "SOB", "Niedziela": "ND"
                        }
                        day_code = day_name_to_code.get(raw_day_name)
                        if not day_code:
                            try:
                                dt = datetime.strptime(date_iso, "%Y-%m-%d")
                                day_code = {0: "PON", 1: "WT", 2: "ŚR", 3: "CZW", 4: "PT", 5: "SOB", 6: "ND"}[dt.weekday()]
                            except Exception:
                                day_code = "SOB"

                        lesson_copy = dict(lesson)
                        lesson_copy["data_start"] = date_iso
                        lesson_copy["tygodnie"] = 1
                        lesson_copy["co_ile"] = 1
                        all_entries_to_index.append((day_code, idx + 1, lesson_copy))

            for day, slot, lesson in all_entries_to_index:
                subject = (lesson.get("przedmiot") or "").strip()
                raw_subject = (lesson.get("raw_przedmiot") or subject).strip()
                teacher = (lesson.get("prowadzacy") or "").strip()
                room = (lesson.get("sala") or "").strip()
                hours = (lesson.get("godziny") or "").strip()
                weeks = lesson.get("tygodnie", 1)
                data_start = lesson.get("data_start", "")
                co_ile = int(lesson.get("co_ile", 1) or 1)
                od_tyg = int(lesson.get("od_tyg", 1) or 1)
                polowa_sem = lesson.get("polowa_sem")

                if not subject:
                    continue

                # 1. Instructor index
                if teacher and teacher != "Brak danych prowadzącego":
                    if teacher not in teachers_index:
                        teachers_index[teacher] = []

                    # Deduplicate multi-group lectures in the same room/time
                    # ONLY if they occur in the same cycle, semester half, and start date
                    deduped = False
                    for entry in teachers_index[teacher]:
                        if (entry["day"] == day and entry["slot"] == slot and
                            entry["hours"] == hours and entry["subject"] == subject and
                            entry["room"] == room and entry["plan_id"] == plan_id_str and
                            _is_same_cycle(entry, co_ile, od_tyg, polowa_sem, data_start)):
                            if group not in entry["groups"]:
                                entry["groups"].append(group)
                            deduped = True
                            break
                    if not deduped:
                        teachers_index[teacher].append({
                            "day": day,
                            "slot": slot,
                            "hours": hours,
                            "subject": subject,
                            "raw_subject": raw_subject,
                            "room": room,
                            "groups": [group],
                            "plan_id": plan_id_str,
                            "plan_name": plan_name,
                            "weeks": weeks,
                            "data_start": data_start,
                            "co_ile": co_ile,
                            "od_tyg": od_tyg,
                            "polowa_sem": polowa_sem
                        })

                # 2. Room index (exclude purely virtual 'OL' or blank)
                if room and room.upper() != "OL":
                    room_set.add(room)
                    if room not in rooms_index:
                        rooms_index[room] = {d: [] for d in dni_order.keys()}

                    if day in rooms_index[room]:
                        deduped = False
                        for entry in rooms_index[room][day]:
                            if (entry["slot"] == slot and entry["hours"] == hours and
                                entry["subject"] == subject and entry["plan_id"] == plan_id_str and
                                _is_same_cycle(entry, co_ile, od_tyg, polowa_sem, data_start)):
                                if group not in entry["groups"]:
                                    entry["groups"].append(group)
                                if not entry["teacher"] and teacher:
                                    entry["teacher"] = teacher
                                deduped = True
                                break
                        if not deduped:
                            rooms_index[room][day].append({
                                "slot": slot,
                                "hours": hours,
                                "subject": subject,
                                "teacher": teacher,
                                "groups": [group],
                                "plan_id": plan_id_str,
                                "plan_name": plan_name,
                                "weeks": weeks,
                                "data_start": data_start,
                                "co_ile": co_ile,
                                "od_tyg": od_tyg,
                                "polowa_sem": polowa_sem
                            })

                # 3. Subject index
                if subject not in subjects_index:
                    # Check WN catalog
                    wn_match = wn_lower.get(subject.lower())
                    wn_meta = wn_match[1] if wn_match else {}
                    subjects_index[subject] = {
                        "subject": subject,
                        "raw_variants": [],
                        "teachers": [],
                        "majors": wn_meta.get("majors", []),
                        "syllabus_url": wn_meta.get("syllabus_url", ""),
                        "plans": {}
                    }

                if raw_subject and raw_subject not in subjects_index[subject]["raw_variants"]:
                    subjects_index[subject]["raw_variants"].append(raw_subject)
                if teacher and teacher not in subjects_index[subject]["teachers"]:
                    subjects_index[subject]["teachers"].append(teacher)

                if plan_id_str not in subjects_index[subject]["plans"]:
                    subjects_index[subject]["plans"][plan_id_str] = {
                        "plan_id": plan_id_str,
                        "plan_name": plan_name,
                        "groups": []
                    }
                if group not in subjects_index[subject]["plans"][plan_id_str]["groups"]:
                    subjects_index[subject]["plans"][plan_id_str]["groups"].append(group)

    # Sort entries
    for teacher, entries in teachers_index.items():
        entries.sort(key=lambda x: (dni_order.get(x["day"], 99), x["slot"]))

    for room, days_dict in rooms_index.items():
        for d, r_entries in days_dict.items():
            r_entries.sort(key=lambda x: x["slot"])

    # Clean plans dict inside subjects_index
    for sub, info in subjects_index.items():
        info["plans"] = list(info["plans"].values())
        info["teachers"].sort()
        info["raw_variants"].sort()

    # Sort rooms list: Aula first, then alphanumerically
    room_list = sorted(list(room_set), key=lambda r: (0 if "aula" in r.lower() else 1, r))

    # Save combined cross-reference cache
    cross_reference_data = {
        "teachers": teachers_index,
        "rooms": rooms_index,
        "subjects": subjects_index,
        "room_list": room_list,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M")
    }
    cross_path = output_path or os.path.join(DATA_DIR, "cross_reference.json")
    with open(cross_path, "w", encoding="utf-8") as f:
        json.dump(cross_reference_data, f, ensure_ascii=False, indent=2)
    logger.info(f"Exported combined cross_reference.json ({len(room_list)} rooms, {len(teachers_index)} teachers, {len(subjects_index)} subjects)")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate static schedule site for UMG")
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit the number of plans processed (useful for quick local testing)"
    )
    parser.add_argument(
        "--plan-ids",
        type=str,
        default=None,
        help="Comma-separated plan IDs to scrape (e.g. '557,559' or '556')"
    )
    parser.add_argument(
        "--filter",
        type=str,
        default=None,
        help="Filter plans by name substring (e.g. 'Transport Morski')"
    )
    parser.add_argument(
        "--reindex-only",
        action="store_true",
        help="Skip network scraping and regenerate cross-reference indexes from existing schedule JSONs"
    )
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="Check if Arktur has updates compared to production without building"
    )
    args = parser.parse_args()
    if args.check_only:
        has_updates, changes = check_for_updates()
        status_str = "true" if has_updates else "false"
        logger.info(f"Update check finished: has_updates={status_str}")
        if changes:
            logger.info("Detected changes on Arktur:")
            for ch in changes:
                logger.info(f"  - {ch}")
        else:
            logger.info("No changes detected. Production schedule is up to date.")

        github_output = os.environ.get("GITHUB_OUTPUT")
        if github_output:
            try:
                with open(github_output, "a", encoding="utf-8") as gh:
                    gh.write(f"has_updates={status_str}\n")
            except Exception as e:
                logger.warning(f"Failed to write to GITHUB_OUTPUT: {e}")

        sys.exit(0)
    elif args.reindex_only:
        setup_dist_directories()
        if not build_cross_reference_indexes():
            sys.exit(1)
    else:
        plan_ids_list = [p.strip() for p in args.plan_ids.split(",")] if args.plan_ids else None
        build(limit=args.limit, plan_ids=plan_ids_list, filter_query=args.filter)

