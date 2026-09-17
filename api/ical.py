import sys
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Add root directory to python path so we can import scrapper
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapper import pobierz_surowy_plan, przetworz_plan_na_grafike, generuj_ics

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urlparse(self.path)
        query = parse_qs(parsed_url.query)

        g_name = query.get("ical", [None])[0]
        p_id = query.get("plan_id", ["533"])[0]

        if not g_name:
            self.send_response(400)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write("Brak parametru 'ical' (nazwy grupy)".encode("utf-8"))
            return

        try:
            # 1. Pobieramy surowy HTML z UMG
            html_content, grupy_z_planu = pobierz_surowy_plan(p_id)
            
            # 2. Przetwarzamy na grafikę / dane płaskie dla wybranej grupy
            dane_planu, _, _ = przetworz_plan_na_grafike(html_content, g_name, grupy_z_planu)
            
            # 3. Generujemy plik ICS
            ics_output = generuj_ics(dane_planu, g_name)

            self.send_response(200)
            self.send_header("Content-Type", "text/calendar; charset=utf-8")
            self.send_header("Content-Disposition", f"attachment; filename=\"{g_name}.ics\"")
            self.end_headers()
            self.wfile.write(ics_output.encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(f"Błąd generowania kalendarza: {e}".encode("utf-8"))
