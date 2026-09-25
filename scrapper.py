"""
scrapper.py — Fasada (Adapter kompatybilności wstecznej).
Udostępnia zunifikowany interfejs delegujący do trzech wyspecjalizowanych modułów:
  - arktur_client: operacje sieciowe HTTP, pobieranie surowych planów i zapytań AJAX
  - arktur_parser: bezstanowe parsowanie HTML, wyodrębnianie komórek i kafelków planu
  - ics_export: eksport do formatu iCalendar (RFC 5545) z obsługą kalendarza rektorskiego
"""

# Re-eksporty z modułu klienta sieciowego arktur_client
from arktur_client import (
    URL_AJAX,
    URL_LISTA,
    URL_PLAN,
    pobierz_dane_z_ajax,
    pobierz_liste_planow,
    pobierz_surowy_plan,
)

# Re-eksporty z modułu parsera HTML arktur_parser
from arktur_parser import (
    DNI_MAPA,
    MANUAL_DICT_PATH,
    _resolve_cell_ajax_key,
    _wspolny_parser_html,
    load_manual_subjects,
    oblicz_godzine_konca,
    parsuj_plan_html,
    przetworz_plan_na_grafike,
)

# Re-eksporty z modułu eksportu iCalendar ics_export
from ics_export import (
    ACADEMIC_CALENDAR_PATH,
    WEEKDAY_TO_CODE,
    generate_ics,
    generate_nst_ics,
    generuj_ics,
    generuj_ics_nst,
    load_academic_calendar,
)

# Re-eksporty dla planów niestacjonarnych
from nst_client import (
    fetch_nst_plans_list,
    download_pdf_file,
    pobierz_liste_planow_nst,
    pobierz_plik_pdf,
)
from nst_parser import parse_pdf_schedule

__all__ = [
    # arktur_client
    "URL_AJAX",
    "URL_LISTA",
    "URL_PLAN",
    "pobierz_dane_z_ajax",
    "pobierz_liste_planow",
    "pobierz_surowy_plan",
    # arktur_parser
    "DNI_MAPA",
    "MANUAL_DICT_PATH",
    "_resolve_cell_ajax_key",
    "_wspolny_parser_html",
    "load_manual_subjects",
    "oblicz_godzine_konca",
    "parsuj_plan_html",
    "przetworz_plan_na_grafike",
    # ics_export
    "ACADEMIC_CALENDAR_PATH",
    "WEEKDAY_TO_CODE",
    "generate_ics",
    "generate_nst_ics",
    "generuj_ics",
    "generuj_ics_nst",
    "load_academic_calendar",
    # nst
    "fetch_nst_plans_list",
    "download_pdf_file",
    "pobierz_liste_planow_nst",
    "pobierz_plik_pdf",
    "parse_pdf_schedule",
]

