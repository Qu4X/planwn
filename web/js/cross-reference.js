/**
 * CrossRef — Moduł powiązań krzyżowych (wykładowcy, sale, przedmioty) oraz wyszukiwarki wolnych sal
 * 
 * Zgodny ze specyfikacją: docs/specs/cross-reference-modals.md (v4)
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.CrossRef = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  const STANDARD_SLOTS = [
    { label: "08:00 - 09:30", start: 480, end: 570 },
    { label: "09:45 - 11:15", start: 585, end: 675 },
    { label: "11:30 - 13:00", start: 690, end: 780 },
    { label: "13:30 - 15:00", start: 810, end: 900 },
    { label: "15:15 - 16:45", start: 915, end: 1005 },
    { label: "17:00 - 18:30", start: 1020, end: 1110 },
    { label: "18:45 - 20:15", start: 1125, end: 1215 }
  ];

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeQuery(str) {
    if (!str) return "";
    return String(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/ł/g, "l");
  }

  function getWarsawTimeParts(date = new Date()) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Warsaw",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const getPart = type => parts.find(p => p.type === type)?.value;
    const year = getPart("year");
    const month = getPart("month");
    const day = getPart("day");
    const hour = parseInt(getPart("hour"), 10) || 0;
    const minute = parseInt(getPart("minute"), 10) || 0;
    return {
      dateISO: `${year}-${month}-${day}`,
      minutes: hour * 60 + minute
    };
  }

  // --- Czysta warstwa logiki i zapytań (CrossRef.Engine) ---
  const Engine = {
    STANDARD_SLOTS,
    escapeHtml,
    normalizeQuery,
    getWarsawTimeParts,

    search(crossRefData, query, limitPerCategory = 5) {
      if (!crossRefData || !query || typeof query !== "string") {
        return { teachers: [], rooms: [], subjects: [] };
      }
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        return { teachers: [], rooms: [], subjects: [] };
      }

      const norm = normalizeQuery(trimmed);
      const roomQuery = norm.replace(/^sala\s+/, "");

      const matchedTeachers = [];
      if (crossRefData.teachers) {
        for (const t of Object.keys(crossRefData.teachers)) {
          if (normalizeQuery(t).includes(norm)) {
            matchedTeachers.push({
              name: t,
              classCount: (crossRefData.teachers[t] || []).length
            });
            if (matchedTeachers.length >= limitPerCategory) break;
          }
        }
      }

      const matchedRooms = [];
      const roomList = crossRefData.room_list || (crossRefData.rooms ? Object.keys(crossRefData.rooms) : []);
      for (const r of roomList) {
        const normR = normalizeQuery(r);
        if (normR.includes(norm) || (roomQuery && normR.includes(roomQuery))) {
          matchedRooms.push({ room: r });
          if (matchedRooms.length >= limitPerCategory) break;
        }
      }

      const matchedSubjects = [];
      if (crossRefData.subjects) {
        for (const s of Object.keys(crossRefData.subjects)) {
          const sData = crossRefData.subjects[s] || {};
          const normS = normalizeQuery(s);
          const rawVariants = (sData.raw_variants || []).map(normalizeQuery);
          if (normS.includes(norm) || rawVariants.some(v => v.includes(norm))) {
            matchedSubjects.push({
              name: s,
              teachers: sData.teachers || []
            });
            if (matchedSubjects.length >= limitPerCategory) break;
          }
        }
      }

      return {
        teachers: matchedTeachers,
        rooms: matchedRooms,
        subjects: matchedSubjects
      };
    },

    findFreeRooms(crossRefData, options = {}) {
      if (!crossRefData) return [];
      const scheduleEngine = options.scheduleEngine;
      if (!scheduleEngine) {
        throw new Error("CrossRef.Engine.findFreeRooms requires scheduleEngine instance");
      }

      let dateISO = options.dateISO;
      let queryRange = options.queryRange;

      if (!queryRange && options.now) {
        const warsaw = getWarsawTimeParts(options.now);
        dateISO = warsaw.dateISO;
        queryRange = { start: warsaw.minutes, end: warsaw.minutes + 1 };
      } else if (!dateISO) {
        const warsaw = getWarsawTimeParts(options.now || new Date());
        dateISO = warsaw.dateISO;
      }

      if (!queryRange) {
        queryRange = { start: 0, end: 1440 };
      }

      let roomsList = crossRefData.room_list || (crossRefData.rooms ? Object.keys(crossRefData.rooms) : []);
      if (options.filterText && typeof options.filterText === "string") {
        const fNorm = normalizeQuery(options.filterText.trim());
        if (fNorm.length >= 1) {
          roomsList = roomsList.filter(r => normalizeQuery(r).includes(fNorm));
        }
      }

      // 1. Sprawdzenie dnia wolnego od zajęć (święto, przerwa, sesja)
      if (!scheduleEngine.isTeachingDay(dateISO)) {
        return roomsList.map(r => ({
          room: r,
          isFree: true,
          occupyingClass: null,
          nextClass: null
        }));
      }

      // 2. Rozwiązanie dnia bazowego planu (z uwzględnieniem zamian rektorskich)
      const effectiveDay = scheduleEngine.resolveBaseDay(dateISO);
      if (!effectiveDay || effectiveDay === "ND") {
        return roomsList.map(r => ({
          room: r,
          isFree: true,
          occupyingClass: null,
          nextClass: null
        }));
      }

      // 3. Weryfikacja obłożenia dla każdej pasującej sali
      const results = [];
      for (const r of roomsList) {
        const daySchedule = (crossRefData.rooms && crossRefData.rooms[r] && crossRefData.rooms[r][effectiveDay]) || [];
        const occ = scheduleEngine.getRoomOccupancyAt(daySchedule, queryRange, dateISO, effectiveDay);
        results.push({
          room: r,
          isFree: occ.isFree,
          occupyingClass: occ.occupyingClass,
          nextClass: occ.nextClass
        });
      }

      // Sortowanie: najpierw wolne, potem alfabetycznie po nazwie sali
      results.sort((a, b) => {
        if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
        return a.room.localeCompare(b.room, undefined, { numeric: true, sensitivity: 'base' });
      });

      return results;
    },

    renderSlotCard(item, type = "room") {
      if (!item) return "";

      let cycleBadges = "";
      if (item.polowa_sem) {
        cycleBadges += `<span class="lesson-sem-badge">${escapeHtml(item.polowa_sem)}. poł. sem.</span>`;
      }
      if (item.co_ile === 2) {
        const odStr = item.od_tyg === 2 ? "od 2 tyg" : "od 1 tyg";
        cycleBadges += `<span class="lesson-cycle-badge">co 2 tyg (${odStr})</span>`;
      }

      const teacherHtml = item.teacher && item.teacher !== "Brak danych prowadzącego"
        ? `<button class="lesson-teacher-btn" data-teacher="${escapeHtml(item.teacher)}">👨‍🏫 ${escapeHtml(item.teacher)}</button>`
        : (item.teacher ? `<span style="font-style: italic; font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(item.teacher)}</span>` : "");

      const roomHtml = item.room
        ? `<button class="lesson-room-btn" data-room="${escapeHtml(item.room)}">🚪 Sala ${escapeHtml(item.room)}</button>`
        : "";

      const groupsHtml = (item.groups || []).map(g => `<span class="modal-group-chip">${escapeHtml(g)}</span>`).join("");

      return `
        <div class="modal-slot-item">
          <div class="modal-slot-header">
            <span class="modal-slot-time">${escapeHtml(item.hours || "")}</span>
            <div style="display:flex; gap:0.35rem; align-items:center;">
              ${cycleBadges}
              <span class="free-room-badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Zajęta</span>
            </div>
          </div>
          <div class="modal-slot-subject">${escapeHtml(item.subject || "")}</div>
          <div class="modal-slot-meta">
            ${type === "room" ? teacherHtml : roomHtml}
            <div class="modal-groups-chips">${groupsHtml}</div>
          </div>
        </div>
      `;
    }
  };

  // --- Warstwa zarządzania danymi (CrossRef.DataService) ---
  const CACHE_KEY = "umg_cross_ref_cache";
  const SCHEMA_VERSION = 1;

  const DataService = {
    CACHE_KEY,
    SCHEMA_VERSION,

    async load(options = {}) {
      const storage = options.storage || (typeof localStorage !== "undefined" ? localStorage : null);
      const fetchFn = options.fetchFn || (typeof fetch !== "undefined" ? fetch : null);
      const url = options.url || "data/cross_reference.json";
      const onUpdate = options.onUpdate || null;

      let cachedData = null;

      if (storage) {
        try {
          const raw = storage.getItem(CACHE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.schemaVersion === SCHEMA_VERSION && parsed.data) {
              cachedData = parsed.data;
            } else {
              storage.removeItem(CACHE_KEY);
            }
          }
        } catch (e) {
          try { storage.removeItem(CACHE_KEY); } catch (_) {}
        }
      }

      const fetchPromise = (async () => {
        if (!fetchFn) return null;
        try {
          const res = await fetchFn(url);
          if (!res.ok) return null;
          const fresh = await res.json();
          if (fresh && storage) {
            try {
              storage.setItem(CACHE_KEY, JSON.stringify({
                schemaVersion: SCHEMA_VERSION,
                cachedAt: Date.now(),
                data: fresh
              }));
            } catch (e) {
              // QuotaExceededError or private browsing restriction
            }
          }
          if (onUpdate && fresh) {
            try { onUpdate(fresh); } catch (_) {}
          }
          return fresh;
        } catch (e) {
          return null;
        }
      })();

      if (cachedData) {
        fetchPromise.catch(() => {});
        return cachedData;
      }

      return await fetchPromise;
    }
  };

  // --- Stub interfejsu widoku (CrossRef.UI) dla Fazy 1 ---
  const UI = {
    init(config) {},
    openRoom(roomName) {},
    openTeacher(teacherName) {},
    openSubject(subjectName) {},
    openFreeRooms() {}
  };

  return {
    Engine,
    DataService,
    UI
  };
});
