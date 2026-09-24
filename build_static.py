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
from typing import Any, Dict, List, Optional

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("build_static")

from arktur_client import pobierz_liste_planow, pobierz_surowy_plan
from arktur_parser import przetworz_plan_na_grafike
from ics_export import generuj_ics, load_academic_calendar
from models import LessonDict, RoomScheduleEntry, TeacherScheduleEntry


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(BASE_DIR, "web")
DIST_DIR = os.path.join(BASE_DIR, "dist")
DATA_DIR = os.path.join(DIST_DIR, "data")
SCHEDULES_DIR = os.path.join(DATA_DIR, "schedules")
CALENDARS_DIR = os.path.join(DIST_DIR, "calendars")


def setup_dist_directories():
    """Ensures clean output directories in dist/"""
    os.makedirs(SCHEDULES_DIR, exist_ok=True)
    os.makedirs(CALENDARS_DIR, exist_ok=True)

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
    cal_src = os.path.join(BASE_DIR, "academic_calendar.json")
    cal_dst = os.path.join(DATA_DIR, "academic_calendar.json")
    if os.path.exists(cal_src):
        shutil.copy2(cal_src, cal_dst)
        logger.info("Copied academic_calendar.json -> dist/data/")


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
                with open(ics_path, "w", encoding="utf-8") as f:
                    f.write(ics_text)
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


def build(limit=None):
    """Main build process"""
    start_time = datetime.now()
    logger.info("Starting UMG Static Site Build...")

    setup_dist_directories()

    logger.info("1. Fetching plans list from UMG...")
    plany_slownik = pobierz_liste_planow()
    if not plany_slownik:
        logger.error("Failed to retrieve plans from UMG. Aborting build.")
        sys.exit(1)

    logger.info(f"Found {len(plany_slownik)} plans.")

    # Filter/limit if specified
    plan_items = list(plany_slownik.items())
    if limit and limit > 0:
        logger.info(f"Applying limit: processing first {limit} plans only.")
        plan_items = plan_items[:limit]

    plans_metadata = {
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "plans": {}
    }

    total_groups_processed = 0
    discovered_subjects = {}

    for idx, (plan_name, plan_id) in enumerate(plan_items, start=1):
        plan_id_str = str(plan_id)
        logger.info(f"[{idx}/{len(plan_items)}] Scraping plan {plan_id_str}: '{plan_name}'...")

        try:
            html_text, grupy = pobierz_surowy_plan(plan_id_str)
        except Exception as e:
            logger.error(f"Error scraping plan {plan_id_str}: {e}")
            continue

        if not grupy:
            logger.warning(f"No groups detected for plan {plan_id_str}. Skipping.")
            continue

        parsed_title = parse_plan_title(plan_name)
        plans_metadata["plans"][plan_id_str] = {
            "name": plan_name,
            "clean_name": parsed_title["clean_name"],
            "published_at": parsed_title["published_at"],
            "version": parsed_title["version"],
            "groups": grupy
        }

        # Process each group in plan
        for grupa in grupy:
            try:
                # 1. Generate flat schedule JSON
                dane_plaskie, min_slot, max_slot = przetworz_plan_na_grafike(
                    html_text, grupa, grupy
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
                with open(ics_path, "w", encoding="utf-8") as icsf:
                    icsf.write(ics_text)

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

    # Write plans.json metadata file
    plans_json_path = os.path.join(DATA_DIR, "plans.json")
    with open(plans_json_path, "w", encoding="utf-8") as f:
        json.dump(plans_metadata, f, ensure_ascii=False, indent=2)

    # Merge manual subjects with discovered subjects
    manual_subjects_path = os.path.join(BASE_DIR, "subjects_manual.json")
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

    # Generate cross-reference index files
    build_cross_reference_indexes(plans_metadata)

    elapsed = (datetime.now() - start_time).total_seconds()
    logger.info(f"Build complete in {elapsed:.1f}s!")
    logger.info(f"Summary: {len(plans_metadata['plans'])} plans, {total_groups_processed} group schedules & calendars generated in dist/")


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
    dni_order = {"PON": 1, "WT": 2, "ŚR": 3, "CZW": 4, "PT": 5, "SOB": 6}

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
    wn_catalog_path = os.path.join(BASE_DIR, "wn_subjects_catalog.json")
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

            for day, day_slots in schedule_data.items():
                if not isinstance(day_slots, dict):
                    continue
                for slot_str, lesson in day_slots.items():
                    try:
                        slot = int(str(slot_str).split('_')[0])
                    except ValueError:
                        slot = 0

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
        "--reindex-only",
        action="store_true",
        help="Skip network scraping and regenerate cross-reference indexes from existing schedule JSONs"
    )
    args = parser.parse_args()
    if args.reindex_only:
        setup_dist_directories()
        if not build_cross_reference_indexes():
            sys.exit(1)
    else:
        build(limit=args.limit)

