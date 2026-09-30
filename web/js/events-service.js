/**
 * EventsService — Serwis domenowy obsługujący globalne i celowane wydarzenia studenckie.
 * Odpowiada za wczytywanie data/events.json, pobieranie wydarzeń dla danej daty oraz renderowanie kart.
 */

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.EventsService = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const THEME_PRESETS = {
    academic: {
      defaultBadge: "Uczelnia",
      defaultIcon: "🎓",
      defaultColor: "#0d3b66"
    },
    party: {
      defaultBadge: "Impreza",
      defaultIcon: "🎉",
      defaultColor: "#7c3aed"
    },
    flanki: {
      defaultBadge: "Flanki",
      defaultIcon: "🍻",
      defaultColor: "#d97706"
    },
    warning: {
      defaultBadge: "Ważne",
      defaultIcon: "⚠️",
      defaultColor: "#f59e0b"
    },
    info: {
      defaultBadge: "Wydarzenie",
      defaultIcon: "📌",
      defaultColor: "#3b82f6"
    }
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const EventsService = {
    events: [],
    loaded: false,
    loadingPromise: null,

    /**
     * Wczytuje bazę wydarzeń z podanego adresu URL (domyślnie data/events.json).
     */
    async loadEvents(dataUrl = "data/events.json", customFetch = null) {
      if (this.loaded) return this.events;
      if (this.loadingPromise) return this.loadingPromise;

      const doFetch = customFetch || (typeof fetch !== "undefined" ? fetch.bind(typeof window !== "undefined" ? window : global) : null);
      if (!doFetch) {
        console.warn("[EventsService] Brak dostępnej funkcji fetch.");
        this.events = [];
        this.loaded = true;
        return this.events;
      }

      this.loadingPromise = (async () => {
        try {
          const res = await doFetch(dataUrl);
          if (!res.ok) {
            console.warn(`[EventsService] Nie udało się pobrać ${dataUrl} (HTTP ${res.status}).`);
            this.events = [];
          } else {
            const data = await res.json();
            this.events = Array.isArray(data) ? data : [];
          }
        } catch (err) {
          console.warn(`[EventsService] Błąd wczytywania wydarzeń: ${err.message}`);
          this.events = [];
        } finally {
          this.loaded = true;
          this.loadingPromise = null;
        }
        return this.events;
      })();

      return this.loadingPromise;
    },

    /**
     * Zwraca wydarzenia dla danej daty ISO YYYY-MM-DD.
     */
    getEventsForDate(dateISO, context = {}) {
      if (!dateISO || !Array.isArray(this.events)) return [];

      return this.events.filter((ev) => {
        if (!ev || ev.date !== dateISO) return false;
        if (ev.enabled === false) return false;

        // Filtrowanie celowane (target criteria) — przygotowane na Issue #6
        if (ev.target && typeof ev.target === "object") {
          const targetMode = ev.target.mode;
          if (targetMode && targetMode !== "all" && context.studyMode && targetMode !== context.studyMode) {
            return false;
          }

          const targetDegree = ev.target.degree;
          if (targetDegree && targetDegree !== "all" && context.degree !== undefined && targetDegree !== context.degree) {
            return false;
          }
        }

        return true;
      });
    },

    /**
     * Sprawdza, czy w danym dniu występuje przynajmniej jedno aktywne wydarzenie.
     */
    hasEventOnDate(dateISO, context = {}) {
      return this.getEventsForDate(dateISO, context).length > 0;
    },

    /**
     * Zwraca metadane stylu i ikon dla danego typu wydarzenia.
     */
    getThemeDetails(event) {
      const typeKey = (event.type || "info").toLowerCase();
      const preset = THEME_PRESETS[typeKey] || THEME_PRESETS.info;

      return {
        badge: event.badge || preset.defaultBadge,
        icon: event.icon || preset.defaultIcon,
        color: event.color || preset.defaultColor,
        type: typeKey
      };
    },

    /**
     * Renderuje pojedynczą kartę wydarzenia (.event-card).
     */
    renderEventCard(event) {
      if (!event) return "";

      const theme = this.getThemeDetails(event);
      const timeStr = event.time_start && event.time_end
        ? `${escapeHtml(event.time_start)} – ${escapeHtml(event.time_end)}`
        : (event.time_start ? escapeHtml(event.time_start) : "");

      const locationHtml = event.location
        ? `<div class="event-location">
             <span class="event-location-icon" aria-hidden="true">📍</span>
             <span class="event-location-text">${escapeHtml(event.location)}</span>
           </div>`
        : "";

      return `
        <article class="event-card event-theme-${escapeHtml(theme.type)}" data-event-id="${escapeHtml(event.id)}" role="button" tabindex="0" aria-haspopup="dialog" style="--event-accent-color: ${escapeHtml(theme.color)};">
          <div class="event-card-header">
            <span class="event-badge">${escapeHtml(theme.badge)}</span>
            ${timeStr ? `<time class="event-time">${timeStr}</time>` : ""}
          </div>
          <div class="event-card-body">
            <h4 class="event-title">
              <span class="event-icon" aria-hidden="true">${escapeHtml(theme.icon)}</span>
              <span class="event-title-text">${escapeHtml(event.title)}</span>
            </h4>
            ${locationHtml}
          </div>
        </article>
      `.trim();
    },

    /**
     * Renderuje kontener wydarzeń (.day-events-section) na dole dnia.
     * Zgodnie z kryteriami: jeśli brak wydarzeń, zwraca pusty ciąg (zero śmieci w DOM).
     */
    renderEventsSection(events) {
      if (!events || !Array.isArray(events) || events.length === 0) {
        return "";
      }

      const cardsHtml = events.map((ev) => this.renderEventCard(ev)).join("\n");

      return `
        <section class="day-events-section" aria-label="Wydarzenia w tym dniu">
          <div class="day-events-header">
            <span class="day-events-icon" aria-hidden="true">📅</span>
            <span class="day-events-title">Wydarzenia</span>
          </div>
          <div class="day-events-list">
            ${cardsHtml}
          </div>
        </section>
      `.trim();
    },

    /**
     * Zwraca wydarzenie po ID.
     */
    getEventById(id) {
      if (!id || !Array.isArray(this.events)) return null;
      return this.events.find((ev) => ev && ev.id === id) || null;
    },

    /**
     * Otwiera modal ze szczegółami wydarzenia (<dialog id="event-details-dialog">).
     */
    openEventModal(eventId, triggerEl = null) {
      if (typeof document === "undefined") return;
      const event = this.getEventById(eventId);
      if (!event) return;

      const dialog = document.getElementById("event-details-dialog");
      if (!dialog) return;

      this.previouslyFocusedEl = triggerEl || document.activeElement;

      const theme = this.getThemeDetails(event);
      const iconEl = dialog.querySelector("#event-dialog-icon");
      const badgeEl = dialog.querySelector("#event-dialog-badge");
      const titleEl = dialog.querySelector("#event-dialog-title");
      const dateEl = dialog.querySelector("#event-dialog-date");
      const timeEl = dialog.querySelector("#event-dialog-time");
      const locationRow = dialog.querySelector("#event-dialog-location-row");
      const locationEl = dialog.querySelector("#event-dialog-location");
      const descEl = dialog.querySelector("#event-dialog-description");
      const footerEl = dialog.querySelector("#event-dialog-footer");
      const linkEl = dialog.querySelector("#event-dialog-link");

      if (iconEl) iconEl.textContent = theme.icon;
      if (badgeEl) {
        badgeEl.textContent = theme.badge;
        badgeEl.className = `event-badge event-theme-${escapeHtml(theme.type)}`;
      }
      if (titleEl) titleEl.textContent = event.title;

      if (dateEl) {
        let dateFormatted = event.date;
        try {
          const [y, m, d] = event.date.split("-").map(Number);
          const dt = new Date(y, m - 1, d);
          dateFormatted = dt.toLocaleDateString("pl-PL", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
          });
          dateFormatted = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
        } catch (_) {}
        dateEl.textContent = dateFormatted;
      }

      if (timeEl) {
        const timeStr = event.time_start && event.time_end
          ? `${event.time_start} – ${event.time_end}`
          : (event.time_start || "Cały dzień");
        timeEl.textContent = timeStr;
      }

      if (locationRow && locationEl) {
        if (event.location) {
          locationEl.textContent = event.location;
          locationRow.classList.remove("hidden");
        } else {
          locationRow.classList.add("hidden");
        }
      }

      if (descEl) {
        descEl.textContent = event.description || "Brak dodatkowego opisu wydarzenia.";
      }

      if (footerEl && linkEl) {
        if (event.url) {
          linkEl.href = event.url;
          const linkTextEl = dialog.querySelector("#event-dialog-link-text") || linkEl.querySelector("span");
          if (linkTextEl) {
            linkTextEl.textContent = event.button_text || event.link_text || "Więcej informacji";
          }
          footerEl.classList.remove("hidden");
        } else {
          footerEl.classList.add("hidden");
        }
      }

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.classList.remove("hidden");
      }
    },

    /**
     * Zamyka modal szczegółów wydarzenia i przywraca fokus.
     */
    closeEventModal() {
      if (typeof document === "undefined") return;
      const dialog = document.getElementById("event-details-dialog");
      if (!dialog) return;

      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.classList.add("hidden");
      }

      if (this.previouslyFocusedEl && typeof this.previouslyFocusedEl.focus === "function") {
        this.previouslyFocusedEl.focus();
        this.previouslyFocusedEl = null;
      }
    }
  };

  return EventsService;
});
