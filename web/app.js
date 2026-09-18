
// SVG Icon helper using inline sprite
function icon(name, extraClass = "", style = "") {
  const cls = extraClass ? `icon ${extraClass}` : "icon";
  const styleAttr = style ? ` style="${style}"` : "";
  return `<svg class="${cls}"${styleAttr} aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

// UMG Static Schedule Web Application

const DNI_TYGODNIA = ["PON", "WT", "ŚR", "CZW", "PT", "SOB", "ND"];
const DNI_PELNE = {
  "PON": "Poniedziałek",
  "WT": "Wtorek",
  "ŚR": "Środa",
  "CZW": "Czwartek",
  "PT": "Piątek",
  "SOB": "Sobota",
  "ND": "Niedziela"
};

const DNI_DOPELNIACZ = {
  "PON": "poniedziałku",
  "WT": "wtorku",
  "ŚR": "środy",
  "CZW": "czwartku",
  "PT": "piątku",
  "SOB": "soboty",
  "ND": "niedzieli"
};

const DNI_MIEJSCOWNIK = {
  "PON": "poniedziałek",
  "WT": "wtorek",
  "ŚR": "środę",
  "CZW": "czwartek",
  "PT": "piątek",
  "SOB": "sobotę",
  "ND": "niedzielę"
};

const DNI_PRZYMIOTNIK = {
  "PON": "poniedziałkowym",
  "WT": "wtorkowym",
  "ŚR": "środowym",
  "CZW": "czwartkowym",
  "PT": "piątkowym",
  "SOB": "sobotnim",
  "ND": "niedzielnym"
};

const DNI_PRZYIMEK = {
  "PON": "w",
  "WT": "we",
  "ŚR": "w",
  "CZW": "w",
  "PT": "w",
  "SOB": "w",
  "ND": "w"
};

// Academic calendar configuration for UMG
// Based on Zarządzenie nr 30 Rektora Uniwersytetu Morskiego w Gdyni z dnia 25 maja 2026 r.
// Rok akademicki 2026/2027
let ACADEMIC_CALENDAR = {
  // Day replacements: format 'YYYY-MM-DD': { replaceWith: 'DAY_CODE', note: 'Description' }
  daySwaps: {
    "2026-11-05": { replaceWith: "PON", note: "Czwartek 05.11 – zajęcia z poniedziałku" },
    "2026-11-13": { replaceWith: "ŚR", note: "Piątek 13.11 – zajęcia ze środy" },
    "2027-01-04": { replaceWith: "ŚR", note: "Poniedziałek 04.01 – zajęcia ze środy" },
    "2027-03-31": { replaceWith: "PON", note: "Środa 31.03 – zajęcia z poniedziałku" },
    "2027-05-25": { replaceWith: "PT", note: "Wtorek 25.05 – zajęcia z piątku" },
    "2027-06-14": { replaceWith: "CZW", note: "Poniedziałek 14.06 – zajęcia z czwartku" }
  },

  // Holidays & Days off (non-teaching days)
  holidays: {
    "2026-10-31": "Dzień wolny od zajęć",
    "2026-11-01": "Wszystkich Świętych",
    "2026-11-02": "Dzień wolny od zajęć",
    "2026-11-11": "Święto Niepodległości",
    "2026-12-21": "Dzień wolny od zajęć (zimowa przerwa świąteczna)",
    "2026-12-22": "Dzień wolny od zajęć (zimowa przerwa świąteczna)",
    "2026-12-23": "Dzień wolny od zajęć (zimowa przerwa świąteczna)",
    "2026-12-24": "Wigilia Bożego Narodzenia",
    "2026-12-25": "Boże Narodzenie",
    "2026-12-26": "Drugi dzień Świąt",
    "2026-12-27": "Dzień wolny od zajęć (zimowa przerwa świąteczna)",
    "2026-12-28": "Dzień wolny od zajęć (zimowa przerwa świąteczna)",
    "2026-12-29": "Dzień wolny od zajęć (zimowa przerwa świąteczna)",
    "2026-12-30": "Dzień wolny od zajęć (zimowa przerwa świąteczna)",
    "2026-12-31": "Dzień wolny od zajęć (zimowa przerwa świąteczna)",
    "2027-01-01": "Nowy Rok",
    "2027-01-02": "Dzień wolny od zajęć (zimowa przerwa świąteczna)",
    "2027-01-03": "Dzień wolny od zajęć (zimowa przerwa świąteczna)",
    "2027-01-06": "Święto Trzech Króli",
    "2027-03-28": "Wielkanoc",
    "2027-03-29": "Poniedziałek Wielkanocny",
    "2027-05-01": "Święto Pracy",
    "2027-05-03": "Święto Konstytucji 3 Maja",
    "2027-05-26": "Święto Uczelni (dzień rektorski)",
    "2027-05-27": "Boże Ciało",
    "2027-05-28": "Dzień wolny od zajęć"
  },

  // Periods (teaching, breaks, exam sessions)
  // Specific breaks and exam sessions are listed first so they take priority
  periods: [
    { name: "Zimowa przerwa świąteczna", type: "break", start: "2026-12-21", end: "2027-01-03" },
    { name: "Sesja egzaminacyjna zimowa", type: "exam", start: "2027-02-02", end: "2027-02-08" },
    { name: "Zimowa sesja poprawkowa", type: "exam", start: "2027-02-09", end: "2027-02-15" },
    { name: "Przerwa międzysemestralna", type: "break", start: "2027-02-16", end: "2027-02-21" },
    { name: "Przerwa wielkanocna", type: "break", start: "2027-03-25", end: "2027-03-30" },
    { name: "Letnia sesja egzaminacyjna", type: "exam", start: "2027-06-16", end: "2027-06-28" },
    { name: "Letnia sesja poprawkowa", type: "exam", start: "2027-09-01", end: "2027-09-14" },
    { name: "Okres zajęć dydaktycznych – semestr zimowy", type: "teaching", start: "2026-10-01", end: "2027-02-01" },
    { name: "Okres zajęć dydaktycznych – semestr letni", type: "teaching", start: "2027-02-22", end: "2027-06-15" }
  ]
};

const savedDaysView = typeof localStorage !== "undefined"
  ? (localStorage.getItem("umg_days_view") || (localStorage.getItem("umg_show_weekends") === "true" ? "all" : "workdays"))
  : "workdays";

function getTodayCode(respectMode = false) {
  const days = ["ND", "PON", "WT", "ŚR", "CZW", "PT", "SOB"];
  const dayIdx = new Date().getDay();
  const code = days[dayIdx];
  if (respectMode && state.daysView === "workdays" && (code === "SOB" || code === "ND")) {
    return "PON";
  }
  return code;
}

// Application State
const state = {
  plansData: null,
  selectedPlanId: null,
  selectedGroup: null,
  scheduleData: null,
  crossRefData: null,
  weekOffset: 0, // 0 = current week, 1 = next week, etc.
  daysView: savedDaysView, // "workdays" | "active_only" | "all"
  selectedDayTab: "ALL",
  theme: typeof localStorage !== "undefined" && localStorage.getItem("umg_theme")
    ? localStorage.getItem("umg_theme")
    : (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
};
state.selectedDayTab = typeof window !== "undefined" && window.innerWidth >= 900 ? "ALL" : getTodayCode(true);

// DOM Elements
const elements = typeof document !== "undefined" ? {
  menuToggleBtn: document.getElementById("menu-toggle"),
  openMenuCta: document.getElementById("open-menu-cta"),
  closeSidebarBtn: document.getElementById("close-sidebar"),
  sidebarBackdrop: document.getElementById("sidebar-backdrop"),
  appSidebar: document.getElementById("app-sidebar"),
  headerActiveGroup: document.getElementById("header-active-group"),
  headerSearchBtn: document.getElementById("header-search-btn"),
  sidebarSearchInput: document.getElementById("sidebar-search-input"),
  clearSearchBtn: document.getElementById("clear-search-btn"),
  searchResults: document.getElementById("search-results"),
  planSelect: document.getElementById("plan-select"),
  planMetaInfo: document.getElementById("plan-meta-info"),
  planPubDate: document.getElementById("plan-pub-date"),
  planVersionBadge: document.getElementById("plan-version-badge"),
  groupSelect: document.getElementById("group-select"),
  daysViewSelect: document.getElementById("days-view-select"),
  freeRoomsBtn: document.getElementById("free-rooms-btn"),
  currentWeekLabel: document.getElementById("current-week-label"),
  weekDatePicker: document.getElementById("week-date-picker"),
  prevWeekBtn: document.getElementById("prev-week"),
  nextWeekBtn: document.getElementById("next-week"),
  todayBtn: document.getElementById("today-btn"),
  dayTabs: document.getElementById("day-tabs"),
  calendarNotice: document.getElementById("calendar-notice"),
  loadingState: document.getElementById("loading-state"),
  emptyState: document.getElementById("empty-state"),
  noClassesState: document.getElementById("no-classes-state"),
  scheduleContent: document.getElementById("schedule-content"),
  calendarBtn: document.getElementById("calendar-btn"),
  calendarModal: document.getElementById("calendar-modal"),
  closeModalBtn: document.getElementById("close-modal"),
  calGoogleBtn: document.getElementById("cal-google-btn"),
  calAppleBtn: document.getElementById("cal-apple-btn"),
  calDownloadBtn: document.getElementById("cal-download-btn"),
  calGoogleCard: document.getElementById("cal-google-card"),
  calAppleCard: document.getElementById("cal-apple-card"),
  calendarUrlInput: document.getElementById("calendar-url-input"),
  copyUrlBtn: document.getElementById("copy-url-btn"),
  copyFeedback: document.getElementById("copy-feedback"),
  crossModal: document.getElementById("cross-modal"),
  crossModalTitle: document.getElementById("cross-modal-title"),
  crossModalBadge: document.getElementById("cross-modal-badge"),
  crossModalBody: document.getElementById("cross-modal-body"),
  closeCrossModalBtn: document.getElementById("close-cross-modal"),
  themeToggle: document.getElementById("theme-toggle"),
  lastUpdated: document.getElementById("last-updated"),
  headerInstallBtn: document.getElementById("header-install-btn"),
  pwaInstallBtn: document.getElementById("pwa-install-btn"),
  pwaInstallBtnText: document.getElementById("pwa-install-btn-text"),
  iosInstallModal: document.getElementById("ios-install-modal"),
  closeIosModalBtn: document.getElementById("close-ios-modal"),
  closeIosModalActionBtn: document.getElementById("close-ios-modal-btn"),
  aboutAppBtn: document.getElementById("about-app-btn"),
  footerAboutBtn: document.getElementById("footer-about-btn"),
  aboutModal: document.getElementById("about-modal"),
  closeAboutModalBtn: document.getElementById("close-about-modal"),
  reportMailBtn: document.getElementById("report-mail-btn")
} : {};

// Initialize App
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    setupEventListeners();
    initPwaInstall();
    loadAcademicCalendarConfig();
    updateDayTabsUI();
    loadPlans();
    loadCrossRefData(); // Preload cross-reference data in background
  });
}

async function loadAcademicCalendarConfig() {
  try {
    const res = await fetch("data/academic_calendar.json");
    if (res.ok) {
      const data = await res.json();
      if (data && data.periods) {
        ACADEMIC_CALENDAR = data;
        updateDayTabsUI();
        if (state.scheduleData) {
          renderSchedule();
        }
      }
    }
  } catch (e) {
    // Keep inline defaults if offline or file unavailable
  }
}

function initTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  if (elements.themeToggle) {
    const isDark = state.theme === "dark";
    const iconName = isDark ? "light_mode" : "dark_mode";
    elements.themeToggle.innerHTML = icon(iconName);
    const label = isDark ? "Przełącz na jasny motyw" : "Przełącz na ciemny motyw";
    elements.themeToggle.setAttribute("title", label);
    elements.themeToggle.setAttribute("aria-label", label);
  }
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("umg_theme", state.theme);
  initTheme();
}

function setupEventListeners() {
  elements.themeToggle.addEventListener("click", toggleTheme);

  // Sidebar Controls
  elements.menuToggleBtn.addEventListener("click", openSidebar);
  if (elements.openMenuCta) {
    elements.openMenuCta.addEventListener("click", openSidebar);
  }
  elements.closeSidebarBtn.addEventListener("click", closeSidebar);
  elements.sidebarBackdrop.addEventListener("click", closeSidebar);

  elements.planSelect.addEventListener("change", (e) => {
    onPlanChange(e.target.value);
  });

  elements.groupSelect.addEventListener("change", (e) => {
    if (e.target.value) {
      selectGroup(e.target.value);
      closeSidebar();
    }
  });

  elements.prevWeekBtn.addEventListener("click", () => changeWeek(-1));
  elements.nextWeekBtn.addEventListener("click", () => changeWeek(1));
  elements.todayBtn.addEventListener("click", () => {
    state.weekOffset = 0;
    state.selectedDayTab = getTodayCode(true);
    updateWeekDisplay();
    updateDayTabsUI();
    renderSchedule();
  });

  // Days view selector in sidebar (workdays / active_only / all)
  if (elements.daysViewSelect) {
    elements.daysViewSelect.value = state.daysView;
    elements.daysViewSelect.addEventListener("change", (e) => {
      state.daysView = e.target.value;
      localStorage.setItem("umg_days_view", state.daysView);
      if (state.daysView === "workdays" && (state.selectedDayTab === "SOB" || state.selectedDayTab === "ND")) {
        state.selectedDayTab = "PON";
      }
      updateDayTabsUI();
      renderSchedule();
    });
  }

  // Calendar date picker upon clicking current week label
  if (elements.currentWeekLabel && elements.weekDatePicker) {
    elements.currentWeekLabel.addEventListener("click", () => {
      const targetMonday = getWeekMonday(state.weekOffset);
      elements.weekDatePicker.value = formatDateISO(targetMonday);
      try {
        if (typeof elements.weekDatePicker.showPicker === "function") {
          elements.weekDatePicker.showPicker();
        } else {
          elements.weekDatePicker.focus();
          elements.weekDatePicker.click();
        }
      } catch (err) {
        elements.weekDatePicker.click();
      }
    });

    elements.weekDatePicker.addEventListener("change", (e) => {
      if (!e.target.value) return;
      const [year, month, day] = e.target.value.split("-").map(Number);
      const selectedDate = new Date(year, month - 1, day);

      const selMonday = getMonday(selectedDate);
      const nowMonday = getMonday(new Date());
      const diffWeeks = Math.round((selMonday.getTime() - nowMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));

      const days = ["ND", "PON", "WT", "ŚR", "CZW", "PT", "SOB"];
      const dayCode = days[selectedDate.getDay()];

      state.weekOffset = diffWeeks;
      state.selectedDayTab = dayCode;

      updateWeekDisplay();
      updateDayTabsUI();
      renderSchedule();
    });
  }

  elements.dayTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".day-tab");
    if (!tab) return;
    state.selectedDayTab = tab.dataset.day;
    updateDayTabsUI();
    renderSchedule();
  });

  // Calendar Modal
  if (elements.calendarBtn) {
    elements.calendarBtn.addEventListener("click", () => {
      closeSidebar();
      openCalendarModal();
    });
  }
  if (elements.closeModalBtn) elements.closeModalBtn.addEventListener("click", closeCalendarModal);
  if (elements.calendarModal) {
    const backdrop = elements.calendarModal.querySelector(".modal-backdrop");
    if (backdrop) backdrop.addEventListener("click", closeCalendarModal);
  }
  if (elements.copyUrlBtn) elements.copyUrlBtn.addEventListener("click", copyCalendarUrl);

  // Cross-reference Detail Modal
  elements.closeCrossModalBtn.addEventListener("click", closeCrossModal);
  elements.crossModal.querySelector(".modal-backdrop").addEventListener("click", closeCrossModal);

  // About App Modal
  if (elements.aboutAppBtn) {
    elements.aboutAppBtn.addEventListener("click", () => {
      closeSidebar();
      openAboutModal();
    });
  }
  if (elements.footerAboutBtn) {
    elements.footerAboutBtn.addEventListener("click", openAboutModal);
  }
  if (elements.closeAboutModalBtn) {
    elements.closeAboutModalBtn.addEventListener("click", closeAboutModal);
  }
  if (elements.aboutModal) {
    const aboutBackdrop = elements.aboutModal.querySelector(".modal-backdrop");
    if (aboutBackdrop) aboutBackdrop.addEventListener("click", closeAboutModal);
  }
  if (elements.reportMailBtn) {
    elements.reportMailBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const currentGroup = state.activeGroup || "Brak (nie wybrano)";
      const currentPlan = state.activePlanName || "Brak";
      const subject = encodeURIComponent("[Plan WN] Zgłoszenie błędu / uwaga");
      const body = encodeURIComponent(
        `Cześć,\n\nOpis problemu lub uwagi:\n\n\n---\nDane diagnostyczne:\nGrupa: ${currentGroup}\nKierunek: ${currentPlan}\nPrzeglądarka: ${navigator.userAgent}\nRozdzielczość: ${window.innerWidth}x${window.innerHeight}\n`
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });
  }

  // Fallback for Tally modal: if Tally embed script is blocked by adblockers, open form directly
  document.addEventListener("click", (e) => {
    const tallyLink = e.target.closest("a[data-tally-open], a[href*='tally-open=']");
    if (tallyLink && (!window.Tally || typeof window.Tally.openPopup !== "function")) {
      e.preventDefault();
      const formId = tallyLink.getAttribute("data-tally-open") || "2E2vNj";
      window.open(`https://tally.so/r/${formId}`, "_blank", "noopener");
    }
  });

  // Global Escape key handler to close any active modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAboutModal();
      closeCrossModal();
      closeCalendarModal();
      if (typeof closeIosModal === "function") closeIosModal();
    }
  });

  // Search & Filter Listeners
  if (elements.headerSearchBtn) {
    elements.headerSearchBtn.addEventListener("click", () => {
      openSidebar();
      setTimeout(() => elements.sidebarSearchInput.focus(), 250);
    });
  }

  elements.sidebarSearchInput.addEventListener("input", (e) => {
    onSearchInput(e.target.value);
  });

  elements.clearSearchBtn.addEventListener("click", () => {
    elements.sidebarSearchInput.value = "";
    onSearchInput("");
    elements.sidebarSearchInput.focus();
  });

  elements.searchResults.addEventListener("click", (e) => {
    const item = e.target.closest(".search-result-item");
    if (!item) return;
    const type = item.dataset.type;
    const id = item.dataset.id;
    closeSidebar();
    elements.searchResults.classList.add("hidden");
    if (type === "teacher") {
      openTeacherSchedule(id);
    } else if (type === "room") {
      openRoomSchedule(id);
    } else if (type === "subject") {
      openSubjectDetail(id);
    }
  });

  // Free Rooms Finder Button
  elements.freeRoomsBtn.addEventListener("click", () => {
    closeSidebar();
    openFreeRoomsModal();
  });

  // Delegated clicks inside Schedule Cards (Teachers and Rooms)
  elements.scheduleContent.addEventListener("click", (e) => {
    const roomBtn = e.target.closest(".lesson-room-btn");
    if (roomBtn) {
      e.stopPropagation();
      openRoomSchedule(roomBtn.dataset.room);
      return;
    }
    const teacherBtn = e.target.closest(".lesson-teacher-btn");
    if (teacherBtn) {
      e.stopPropagation();
      openTeacherSchedule(teacherBtn.dataset.teacher);
      return;
    }
  });

  // Delegated clicks inside Cross Modal (to navigate between teachers, rooms, and subjects)
  elements.crossModalBody.addEventListener("click", (e) => {
    const roomBtn = e.target.closest(".lesson-room-btn");
    if (roomBtn) {
      e.stopPropagation();
      openRoomSchedule(roomBtn.dataset.room);
      return;
    }
    const teacherBtn = e.target.closest(".lesson-teacher-btn");
    if (teacherBtn) {
      e.stopPropagation();
      openTeacherSchedule(teacherBtn.dataset.teacher);
      return;
    }
  });
}

function openSidebar() {
  elements.appSidebar.classList.add("open");
  elements.sidebarBackdrop.classList.remove("hidden");
}

function closeSidebar() {
  elements.appSidebar.classList.remove("open");
  elements.sidebarBackdrop.classList.add("hidden");
}

// Load metadata: plans and groups
async function loadPlans() {
  try {
    elements.loadingState.classList.remove("hidden");
    elements.emptyState.classList.add("hidden");

    const response = await fetch("data/plans.json");
    if (!response.ok) throw new Error("Błąd wczytywania plans.json");

    state.plansData = await response.json();

    if (state.plansData.last_updated) {
      elements.lastUpdated.textContent = `Aktualizacja: ${state.plansData.last_updated}`;
    }

    populatePlanSelect();

    // Restore saved selections from localStorage
    const savedPlan = localStorage.getItem("umg_selected_plan");
    const savedGroup = localStorage.getItem("umg_selected_group");

    if (savedPlan && state.plansData.plans[savedPlan]) {
      elements.planSelect.value = savedPlan;
      onPlanChange(savedPlan, savedGroup);
    } else {
      elements.loadingState.classList.add("hidden");
      elements.emptyState.classList.remove("hidden");
      // Open sidebar automatically on first visit so user knows to pick a group
      openSidebar();
    }

    updateWeekDisplay();
    updateDayTabsUI();
  } catch (err) {
    console.error(err);
    elements.loadingState.innerHTML = `<p style="color: #ef4444;">Nie udało się wczytać listy planów. Uruchom build_static.py.</p>`;
  }
}

function parsePlanInfo(rawName) {
  if (!rawName) return { cleanName: "", publishedAt: null, version: null, isSecondDegree: false };

  // 1. Extract publication date [YYYY-MM-DD HH:MM] or [YYYY-MM-DD]
  const dateMatch = rawName.match(/\[(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)\]/);
  const publishedAt = dateMatch ? dateMatch[1] : null;

  // 2. Extract version (e.g. "wer. 2", "wer 1", "wersja 3")
  const verMatch = rawName.match(/\b(?:wer\.?|wersja)\s*(\d+)\b/i);
  const version = verMatch ? `wer. ${verMatch[1]}` : null;

  // 3. Detect degree
  const isSecondDegree = /drugiego\s+stopnia|II\s+st/i.test(rawName);

  // 4. Strip prefix like [TM Sem 1] or [something]
  let clean = rawName.replace(/^\[[^\]]+\]\s*/, "");

  // 5. Strip suffix date and version: [2026-...] wer. ...
  clean = clean.replace(/\s*\[\d{4}-\d{2}-\d{2}[^\]]*\]\s*(?:wer\.?\s*\d+)?/gi, "");
  clean = clean.replace(/\s*\b(?:wer\.?|wersja)\s*\d+\b/gi, "");

  // 6. Strip degree words ("pierwszego stopnia", "drugiego stopnia")
  clean = clean.replace(/\s*(?:pierwszego|drugiego)\s+stopnia\s*/gi, " ");
  clean = clean.replace(/\s*(?:I|II)\s+stopnia\s*/gi, " ");

  // 7. Normalize whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  // 8. Add suffix for 2nd degree if applicable
  if (isSecondDegree && !clean.includes("II st")) {
    clean += " (II st.)";
  }

  return {
    cleanName: clean || rawName,
    publishedAt,
    version,
    isSecondDegree
  };
}

function getShortPlanCode(planName) {
  if (!planName) return "";
  let major = "";
  if (/Transport Morski/i.test(planName)) {
    major = "TM";
  } else if (/Transport i Logistyka/i.test(planName)) {
    major = "TiL";
  } else if (/Morskie Systemy/i.test(planName)) {
    major = "MSTiL";
  } else if (/Eksploatacja/i.test(planName)) {
    major = "EST";
  } else if (/Nawigacja/i.test(planName)) {
    major = "NAW";
  } else {
    major = planName.split(" ")[0];
  }

  const semMatch = planName.match(/sem\.?\s*(\d+)/i);
  const sem = semMatch ? `Sem ${semMatch[1]}` : "";

  return [major, sem].filter(Boolean).join(" ");
}

function populatePlanSelect() {
  elements.planSelect.innerHTML = '<option value="">Wybierz kierunek studiów...</option>';
  for (const [id, plan] of Object.entries(state.plansData.plans)) {
    const opt = document.createElement("option");
    opt.value = id;
    const planInfo = parsePlanInfo(plan.clean_name || plan.name);
    opt.textContent = planInfo.cleanName;
    elements.planSelect.appendChild(opt);
  }
}

function onPlanChange(planId, preferredGroup = null) {
  state.selectedPlanId = planId;
  state.selectedGroup = null;

  if (!planId) {
    if (elements.planMetaInfo) elements.planMetaInfo.classList.add("hidden");
    elements.groupSelect.disabled = true;
    elements.groupSelect.innerHTML = '<option value="">Najpierw wybierz kierunek...</option>';
    elements.headerActiveGroup.textContent = "Wybierz grupę";
    localStorage.removeItem("umg_selected_plan");
    localStorage.removeItem("umg_selected_group");
    showEmptyState();
    return;
  }

  localStorage.setItem("umg_selected_plan", planId);
  const plan = state.plansData.plans[planId];

  // Update plan publication metadata in sidebar
  const planInfo = parsePlanInfo(plan.name || "");
  const publishedAt = plan.published_at || planInfo.publishedAt;
  const version = plan.version || planInfo.version;
  if (elements.planMetaInfo) {
    if (publishedAt || version) {
      elements.planMetaInfo.classList.remove("hidden");
      elements.planPubDate.textContent = publishedAt ? `Aktualizacja: ${publishedAt}` : "";
      if (version) {
        elements.planVersionBadge.textContent = version;
        elements.planVersionBadge.style.display = "inline-block";
      } else {
        elements.planVersionBadge.style.display = "none";
      }
    } else {
      elements.planMetaInfo.classList.add("hidden");
    }
  }

  // Populate expandable group dropdown
  elements.groupSelect.innerHTML = "";
  if (!plan.groups || plan.groups.length === 0) {
    elements.groupSelect.disabled = true;
    elements.groupSelect.innerHTML = '<option value="">Brak grup dla tego planu</option>';
    elements.headerActiveGroup.textContent = "Brak grup";
    return;
  }

  elements.groupSelect.disabled = false;
  elements.groupSelect.innerHTML = '<option value="">Wybierz grupę...</option>';

  plan.groups.forEach((groupName) => {
    const opt = document.createElement("option");
    opt.value = groupName;
    opt.textContent = groupName;
    elements.groupSelect.appendChild(opt);
  });

  // Pick preferred group or the first one
  const groupToSelect = (preferredGroup && plan.groups.includes(preferredGroup))
    ? preferredGroup
    : plan.groups[0];

  elements.groupSelect.value = groupToSelect;
  selectGroup(groupToSelect);
}

function selectGroup(groupName) {
  state.selectedGroup = groupName;
  localStorage.setItem("umg_selected_group", groupName);
  elements.groupSelect.value = groupName;

  // Update header badge with Major + Semester + Group (e.g. "TM Sem 1 • GR.01")
  const plan = state.plansData && state.plansData.plans[state.selectedPlanId];
  const shortPlanCode = plan ? getShortPlanCode(plan.name) : "";
  elements.headerActiveGroup.textContent = shortPlanCode
    ? `${shortPlanCode} • ${groupName}`
    : groupName;

  loadSchedule();
}

function getSafeGroupName(group) {
  return group ? String(group).replace(/[^\w-]/g, '_') : '';
}

// Load schedule JSON for selected plan + group
async function loadSchedule() {
  if (!state.selectedPlanId || !state.selectedGroup) return;

  elements.loadingState.classList.remove("hidden");
  elements.scheduleContent.classList.add("hidden");
  elements.noClassesState.classList.add("hidden");
  elements.emptyState.classList.add("hidden");

  try {
    const safeGroup = getSafeGroupName(state.selectedGroup);
    const filename = `data/schedules/${state.selectedPlanId}_${safeGroup}.json`;
    const response = await fetch(filename);
    if (!response.ok) throw new Error("Brak pliku planu dla tej grupy");

    state.scheduleData = await response.json();
    elements.loadingState.classList.add("hidden");

    // Smart initial week: jump to first active week if outside semester
    resolveInitialWeekOffset(state.scheduleData);

    updateWeekDisplay();
    renderSchedule();
  } catch (err) {
    console.error(err);
    elements.loadingState.innerHTML = `<p style="color: #ef4444;">Brak danych planu dla grupy ${state.selectedGroup}.</p>`;
  }
}

// Date and week helpers
function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonday(d) {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekMonday(offsetWeeks = 0) {
  const now = new Date();
  const baseMonday = getMonday(now);
  baseMonday.setDate(baseMonday.getDate() + offsetWeeks * 7);
  return baseMonday;
}

function changeWeek(direction) {
  state.weekOffset += direction;
  updateWeekDisplay();
  renderSchedule();
}

// Automatically resolve initial week offset to the first week with classes
function resolveInitialWeekOffset(scheduleData) {
  if (!scheduleData) return;

  let earliestMonday = null;
  let latestMonday = null;

  for (const daySlots of Object.values(scheduleData)) {
    for (const lesson of Object.values(daySlots)) {
      if (lesson.data_start) {
        const [y, m, d] = lesson.data_start.split("-").map(Number);
        const startDate = new Date(y, m - 1, d);
        const mon = getMonday(startDate);
        const totalWeeks = lesson.tygodnie || 15;
        const endMon = new Date(mon);
        endMon.setDate(mon.getDate() + (totalWeeks - 1) * 7);

        if (!earliestMonday || mon < earliestMonday) {
          earliestMonday = mon;
        }
        if (!latestMonday || endMon > latestMonday) {
          latestMonday = endMon;
        }
      }
    }
  }

  if (!earliestMonday) return;

  const nowMonday = getMonday(new Date());

  // If today is before the first scheduled classes, jump to the first week
  if (nowMonday < earliestMonday) {
    const diffWeeks = Math.round((earliestMonday.getTime() - nowMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    state.weekOffset = diffWeeks;
  } else if (latestMonday && nowMonday > latestMonday) {
    // If today is past the semester, show the last active week
    const diffWeeks = Math.round((latestMonday.getTime() - nowMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
    state.weekOffset = diffWeeks;
  } else {
    // Current date is within the semester
    state.weekOffset = 0;
  }
}

// Calculate semester week or special periods based on UMG academic calendar
function getAcademicInfoForWeek(targetMonday) {
  const targetSunday = new Date(targetMonday);
  targetSunday.setDate(targetMonday.getDate() + 6);

  const monISO = formatDateISO(targetMonday);
  const sunISO = formatDateISO(targetSunday);

  let periodName = "";
  let periodType = "";
  let weekNum = null;

  // Check special periods (teaching, breaks, exams)
  for (const period of ACADEMIC_CALENDAR.periods) {
    if (period.start <= sunISO && period.end >= monISO) {
      periodName = period.name;
      periodType = period.type;

      if (period.type === "teaching") {
        const [sy, sm, sd] = period.start.split("-").map(Number);
        const semStartMon = getMonday(new Date(sy, sm - 1, sd));
        const diffWeeks = Math.floor((targetMonday.getTime() - semStartMon.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const w = diffWeeks + 1;
        if (w >= 1 && w <= 16) {
          weekNum = w;
        }
      }
      break;
    }
  }

  // Scan 7 days of the week for day swaps and holidays
  const daySwaps = [];
  const holidays = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(targetMonday);
    d.setDate(targetMonday.getDate() + i);
    const dISO = formatDateISO(d);

    if (ACADEMIC_CALENDAR.daySwaps[dISO]) {
      daySwaps.push({ date: dISO, ...ACADEMIC_CALENDAR.daySwaps[dISO] });
    }
    if (ACADEMIC_CALENDAR.holidays[dISO]) {
      const dayFormatted = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
      const dayName = DNI_PELNE[DNI_TYGODNIA[i]] || "";
      holidays.push(`${dayFormatted} (${dayName}): ${ACADEMIC_CALENDAR.holidays[dISO]}`);
    }
  }

  return {
    periodName,
    periodType,
    weekNum,
    daySwaps,
    holidays
  };
}

function updateCalendarNotice(academicInfo) {
  if (!elements.calendarNotice) return;

  const notices = [];
  let isHoliday = false;

  if (academicInfo.daySwaps && academicInfo.daySwaps.length > 0) {
    for (const swap of academicInfo.daySwaps) {
      const cleanNote = (swap.note || "").replace(/\s*\(zarządzenie rektora\)/gi, "").trim();
      notices.push(`
        <div class="calendar-notice-item">
          ${icon("warning", "notice-icon")}
          <span class="notice-text"><strong>Dzień zamienny:</strong> ${escapeHtml(cleanNote)}</span>
        </div>
      `);
    }
  }

  if (academicInfo.holidays && academicInfo.holidays.length > 0) {
    isHoliday = true;
    for (const hol of academicInfo.holidays) {
      notices.push(`
        <div class="calendar-notice-item">
          ${icon("celebration", "notice-icon")}
          <span class="notice-text"><strong>Dzień wolny:</strong> ${escapeHtml(hol)}</span>
        </div>
      `);
    }
  }

  if (academicInfo.periodType === "break" || academicInfo.periodType === "exam") {
    notices.push(`
      <div class="calendar-notice-item">
        ${icon("info", "notice-icon")}
        <span class="notice-text"><strong>${escapeHtml(academicInfo.periodName)}:</strong> W tym okresie mogą nie odbywać się regularne zajęcia dydaktyczne.</span>
      </div>
    `);
  }

  if (notices.length > 0) {
    elements.calendarNotice.innerHTML = notices.join("");
    elements.calendarNotice.className = `calendar-notice ${isHoliday ? "holiday" : ""}`;
    elements.calendarNotice.classList.remove("hidden");
  } else {
    elements.calendarNotice.classList.add("hidden");
    elements.calendarNotice.innerHTML = "";
  }
}

function updateWeekDisplay() {
  const targetMonday = getWeekMonday(state.weekOffset);
  const targetSunday = new Date(targetMonday);
  targetSunday.setDate(targetMonday.getDate() + 6);

  const formatShort = (date) => {
    return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  const monYear = targetMonday.getFullYear();
  const sunYear = targetSunday.getFullYear();
  const yearHtml = monYear === sunYear
    ? `<span class="week-year">.${sunYear}</span>`
    : `<span class="week-year">.${sunYear}</span>`;
  const datesHtml = `${formatShort(targetMonday)} – ${formatShort(targetSunday)}${yearHtml}`;
  const academicInfo = getAcademicInfoForWeek(targetMonday);

  let prefix = "";
  if (academicInfo.weekNum) {
    prefix = `Tydzień ${academicInfo.weekNum}`;
  } else if (academicInfo.periodName) {
    prefix = academicInfo.periodName;
  }

  let htmlContent = "";
  if (prefix && state.weekOffset === 0) {
    htmlContent = `<span class="week-prefix-long">Bieżący tydzień • </span>${escapeHtml(prefix)} (${datesHtml})`;
  } else if (prefix) {
    htmlContent = `${escapeHtml(prefix)} (${datesHtml})`;
  } else if (state.weekOffset === 0) {
    htmlContent = `Bieżący tydzień (${datesHtml})`;
  } else {
    htmlContent = `Tydzień (${datesHtml})`;
  }

  elements.currentWeekLabel.innerHTML = `<span style="font-size: 0.9em; opacity: 0.8; flex-shrink: 0;">📅</span> <span class="week-label-text">${htmlContent}</span>`;

  updateCalendarNotice(academicInfo);
}

function updateDayTabsUI(filteredSchedule = null) {
  let schedule = filteredSchedule;
  if (!schedule && state.scheduleData) {
    const targetMonday = getWeekMonday(state.weekOffset);
    schedule = {};
    for (let dIdx = 0; dIdx < DNI_TYGODNIA.length; dIdx++) {
      const day = DNI_TYGODNIA[dIdx];
      const dayDate = new Date(targetMonday);
      dayDate.setDate(targetMonday.getDate() + dIdx);
      const dateKey = formatDateISO(dayDate);

      let sourceDay = day;
      if (ACADEMIC_CALENDAR.daySwaps[dateKey]) {
        sourceDay = ACADEMIC_CALENDAR.daySwaps[dateKey].replaceWith;
      }
      const holiday = ACADEMIC_CALENDAR.holidays[dateKey] || null;

      const daySlots = state.scheduleData[sourceDay] || {};
      let hasLessons = false;
      if (!holiday) {
        for (const lessonInfo of Object.values(daySlots)) {
          if (isLessonInWeek(lessonInfo, sourceDay, targetMonday)) {
            hasLessons = true;
            break;
          }
        }
      }
      schedule[day] = { hasLessons };
    }
  }

  elements.dayTabs.querySelectorAll(".day-tab").forEach((tab) => {
    const day = tab.dataset.day;
    if (day === "ALL") {
      tab.classList.toggle("active", state.selectedDayTab === "ALL");
      return;
    }

    let shouldShow = true;
    if (state.daysView === "workdays") {
      shouldShow = day !== "SOB" && day !== "ND";
    } else if (state.daysView === "active_only") {
      if (schedule && schedule[day]) {
        shouldShow = schedule[day].lessons ? schedule[day].lessons.length > 0 : Boolean(schedule[day].hasLessons);
      }
    } else if (state.daysView === "all") {
      shouldShow = true;
    }

    tab.classList.toggle("hidden", !shouldShow);
    tab.classList.toggle("active", day === state.selectedDayTab);
  });

  if (state.selectedDayTab !== "ALL") {
    const activeTab = elements.dayTabs.querySelector(`.day-tab[data-day="${state.selectedDayTab}"]`);
    if (activeTab && activeTab.classList.contains("hidden")) {
      state.selectedDayTab = "ALL";
      const allTab = elements.dayTabs.querySelector('.day-tab[data-day="ALL"]');
      if (allTab) allTab.classList.add("active");
    }
  }
}


const DNI_MAP_SUNDAY_FIRST = ["ND", "PON", "WT", "ŚR", "CZW", "PT", "SOB"];

// Check if a given date is an official teaching day (not a holiday, break, or exam session)
function isTeachingDay(iso) {
  if (ACADEMIC_CALENDAR.holidays && ACADEMIC_CALENDAR.holidays[iso]) return false;
  if (ACADEMIC_CALENDAR.periods) {
    const isNonTeaching = ACADEMIC_CALENDAR.periods.some(
      p => (p.type === "break" || p.type === "exam") && p.start <= iso && p.end >= iso
    );
    if (isNonTeaching) return false;
    const isTeaching = ACADEMIC_CALENDAR.periods.some(
      p => p.type === "teaching" && p.start <= iso && p.end >= iso
    );
    return isTeaching;
  }
  return true;
}

// Determine the academic semester teaching period for a given lesson
function getLessonSemesterPeriod(lesson) {
  if (!lesson || !lesson.data_start || !ACADEMIC_CALENDAR.periods) return null;
  const startIso = lesson.data_start;
  const teachingPeriods = ACADEMIC_CALENDAR.periods.filter(p => p.type === "teaching");
  if (!teachingPeriods.length) return null;

  if (typeof lesson.semestr === "number") {
    const isSummer = lesson.semestr % 2 === 0;
    return teachingPeriods.find(
      p => isSummer ? p.name.includes("letni") : p.name.includes("zimowy")
    ) || null;
  }

  const directMatch = teachingPeriods.find(p => p.start <= startIso && p.end >= startIso);
  if (directMatch) return directMatch;

  if (startIso <= "2027-02-21") {
    return teachingPeriods.find(p => p.name.includes("zimowy")) || teachingPeriods[0];
  }
  return teachingPeriods.find(p => p.name.includes("letni")) || teachingPeriods[1];
}

// Calculate lesson meeting occurrence info accounting for calendar holidays, day swaps, and breaks
function getLessonMeetingInfo(lesson, baseDay, targetMonday, targetDate = null) {
  if (!lesson.data_start) return { active: true, meetingNum: 1, total: lesson.tygodnie || 15 };

  try {
    const [year, month, day] = lesson.data_start.split("-").map(Number);
    const startDate = new Date(year, month - 1, day);
    const startMonday = getMonday(startDate);
    const totalWeeks = lesson.tygodnie || 15;

    // Hard semester end: days outside teaching periods, holidays, or exam sessions cannot have active classes
    if (targetDate && !isTeachingDay(targetDate)) {
      return { active: false, meetingNum: 0, total: totalWeeks };
    }

    // Semester boundaries: classes from odd (winter) semesters cannot occur after inter-semester break,
    // and classes from even (summer) semesters cannot occur before it.
    const semPeriod = getLessonSemesterPeriod(lesson);
    if (semPeriod) {
      if (targetDate && (targetDate < semPeriod.start || targetDate > semPeriod.end)) {
        return { active: false, meetingNum: 0, total: totalWeeks };
      }
      if (!targetDate) {
        const monIso = formatDateISO(targetMonday);
        const sun = new Date(targetMonday);
        sun.setDate(sun.getDate() + 6);
        const sunIso = formatDateISO(sun);
        if (sunIso < semPeriod.start || monIso > semPeriod.end) {
          return { active: false, meetingNum: 0, total: totalWeeks };
        }
      }
    }

    if (targetDate && targetDate < formatDateISO(startDate)) {
      return { active: false, meetingNum: 0, total: totalWeeks };
    }
    if (!targetDate && targetMonday < startMonday) {
      return { active: false, meetingNum: 0, total: totalWeeks };
    }

    // Guard: if baseDay is not a recognised weekday name, avoid iterating at all
    if (!DNI_MAP_SUNDAY_FIRST.includes(baseDay)) {
      return { active: true, meetingNum: 1, total: totalWeeks };
    }

    let currentMon = new Date(startMonday);
    let meetingCount = 0;
    let targetMeetingNum = null;
    let targetActive = false;

    // Simulate week-by-week actual teaching sessions (hard cap = 50 weeks)
    const MAX_ITER = 50;
    let safetyCount = 0;

    while ((currentMon <= targetMonday || meetingCount < totalWeeks) && safetyCount++ < MAX_ITER) {
      const diffTime = currentMon.getTime() - startMonday.getTime();
      const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));

      // For bi-weekly classes, odd intervals from startMonday are off-weeks
      const isCycleWeek = (lesson.co_ile !== 2) || (diffWeeks % 2 === 0);

      if (isCycleWeek) {
        for (let i = 0; i < 7; i++) {
          const dayDate = new Date(currentMon);
          dayDate.setDate(currentMon.getDate() + i);
          const iso = formatDateISO(dayDate);

          // Skip if before subject start date
          if (iso < lesson.data_start) continue;

          // Skip if outside this lesson's semester teaching window
          if (semPeriod && (iso < semPeriod.start || iso > semPeriod.end)) continue;

          // Skip if not an official teaching day (holiday, break, or exam session)
          if (!isTeachingDay(iso)) continue;

          // Effective day of teaching (accounting for rector day swaps)
          let effectiveDay = DNI_MAP_SUNDAY_FIRST[dayDate.getDay()];
          if (ACADEMIC_CALENDAR.daySwaps[iso]) {
            effectiveDay = ACADEMIC_CALENDAR.daySwaps[iso].replaceWith;
          }

          if (effectiveDay === baseDay) {
            meetingCount++;

            if (targetDate) {
              if (iso === targetDate) {
                targetMeetingNum = meetingCount;
                targetActive = meetingCount <= totalWeeks;
              }
            } else if (currentMon.getTime() === targetMonday.getTime()) {
              targetMeetingNum = meetingCount;
              targetActive = meetingCount <= totalWeeks;
            }
          }
        }
      }

      if (currentMon.getTime() === targetMonday.getTime() && targetMeetingNum === null) {
        targetActive = false;
        targetMeetingNum = meetingCount;
      }

      if (currentMon > targetMonday && meetingCount >= totalWeeks) break;
      currentMon.setDate(currentMon.getDate() + 7);
    }

    return {
      active: targetActive,
      meetingNum: targetMeetingNum || meetingCount,
      total: totalWeeks
    };
  } catch (e) {
    return { active: true, meetingNum: 1, total: lesson.tygodnie || 15 };
  }
}

// Check if lesson is active in selected week or specific date
function isLessonInWeek(lesson, baseDay, targetMonday, targetDate = null) {
  if (!lesson.data_start) return true;
  const info = getLessonMeetingInfo(lesson, baseDay, targetMonday, targetDate);
  return info.active;
}

// Calculate subject meeting progress (e.g. 3/5, 10/15, Ostatnie zajęcia)
function getLessonProgress(lesson, baseDay, targetMonday, targetDate = null) {
  if (!lesson.tygodnie) return null;
  if (!lesson.data_start) return { text: `${lesson.tygodnie}`, title: `Liczba spotkań: ${lesson.tygodnie}`, isFinal: false };

  try {
    const info = getLessonMeetingInfo(lesson, baseDay, targetMonday, targetDate);
    if (!info.meetingNum || info.meetingNum < 1) {
      return { text: `${lesson.tygodnie}`, title: `Liczba spotkań: ${lesson.tygodnie}`, isFinal: false };
    }

    const total = info.total || lesson.tygodnie;
    const isFinal = info.meetingNum >= total;

    if (isFinal) {
      return {
        text: "Ostatnie zajęcia",
        title: `Ostatnie zajęcia (${info.meetingNum} z ${total})`,
        isFinal: true
      };
    }

    const text = total > 1 ? `${info.meetingNum}/${total}` : `${info.meetingNum}`;
    const title = total > 1 ? `Spotkanie ${info.meetingNum} z ${total}` : `Spotkanie ${info.meetingNum}`;

    return { text, title, isFinal: false };
  } catch (e) {
    return { text: `${lesson.tygodnie}`, title: `Liczba spotkań: ${lesson.tygodnie}`, isFinal: false };
  }
}

// Render schedule view
function renderSchedule() {
  if (!state.scheduleData) return;

  const targetMonday = getWeekMonday(state.weekOffset);
  const todayCode = getTodayCode();

  // Filter lessons for each day of the week, with support for day replacements
  const filteredSchedule = {};
  let totalLessonsInWeek = 0;

  for (let dIdx = 0; dIdx < DNI_TYGODNIA.length; dIdx++) {
    const day = DNI_TYGODNIA[dIdx];
    const dayDate = new Date(targetMonday);
    dayDate.setDate(targetMonday.getDate() + dIdx);
    const dateKey = formatDateISO(dayDate);

    let sourceDay = day;
    let daySwapInfo = null;
    if (ACADEMIC_CALENDAR.daySwaps[dateKey]) {
      daySwapInfo = ACADEMIC_CALENDAR.daySwaps[dateKey];
      sourceDay = daySwapInfo.replaceWith;
    }

    const holiday = ACADEMIC_CALENDAR.holidays[dateKey] || null;

    const daySlots = state.scheduleData[sourceDay] || {};
    const dayLessons = [];

    // If it's a holiday or day off, no classes are held!
    if (!holiday) {
      for (const [slotStart, lessonInfo] of Object.entries(daySlots)) {
        if (isLessonInWeek(lessonInfo, sourceDay, targetMonday, dateKey)) {
          dayLessons.push({
            slot: parseInt(slotStart),
            sourceDay: sourceDay,
            lessonDate: dateKey,
            ...lessonInfo
          });
        }
      }
    }

    // Sort by slot time
    dayLessons.sort((a, b) => a.slot - b.slot);
    filteredSchedule[day] = {
      lessons: dayLessons,
      swap: daySwapInfo,
      holiday: holiday,
      date: dayDate,
      dateKey: dateKey
    };
    totalLessonsInWeek += dayLessons.length;
  }

  // Update day tabs based on filteredSchedule and current view mode
  updateDayTabsUI(filteredSchedule);

  const iconEl = document.getElementById("no-classes-icon");
  const titleEl = document.getElementById("no-classes-title");
  const descEl = document.getElementById("no-classes-desc");

  // Check empty states
  if (totalLessonsInWeek === 0) {
    elements.scheduleContent.classList.add("hidden");
    elements.noClassesState.classList.remove("hidden");

    let minStartDate = null;
    for (const d of Object.values(state.scheduleData)) {
      for (const l of Object.values(d)) {
        if (l.data_start) {
          if (!minStartDate || l.data_start < minStartDate) minStartDate = l.data_start;
        }
      }
    }

    const academicInfo = getAcademicInfoForWeek(targetMonday);

    if (minStartDate && formatDateISO(targetMonday) < minStartDate) {
      if (iconEl) iconEl.innerHTML = icon("event_upcoming", "", "width: 3rem; height: 3rem; color: var(--brand-primary);");
      if (titleEl) titleEl.textContent = "Przed rozpoczęciem zajęć";
      if (descEl) {
        descEl.innerHTML = `W tym tygodniu nie masz zaplanowanych zajęć (przed rozpoczęciem semestru).<br><button id="jump-to-first-btn" class="btn-primary" style="margin-top: 1rem; font-size: 0.85rem; padding: 0.5rem 1rem; width: 100%; justify-content: center;">Przejdź do pierwszego tygodnia zajęć</button>`;
        const jumpBtn = document.getElementById("jump-to-first-btn");
        if (jumpBtn) {
          jumpBtn.onclick = () => {
            resolveInitialWeekOffset(state.scheduleData);
            updateWeekDisplay();
            renderSchedule();
          };
        }
      }
    } else if (academicInfo.periodType === "break") {
      if (iconEl) iconEl.innerHTML = icon("beach_access", "", "width: 3rem; height: 3rem; color: #3b82f6;");
      if (titleEl) titleEl.textContent = academicInfo.periodName;
      if (descEl) descEl.textContent = "W tym tygodniu trwa przerwa wolna od zajęć dydaktycznych.";
    } else if (academicInfo.periodType === "exam") {
      if (iconEl) iconEl.innerHTML = icon("school", "", "width: 3rem; height: 3rem; color: #8b5cf6;");
      if (titleEl) titleEl.textContent = academicInfo.periodName;
      if (descEl) descEl.textContent = "Trwa sesja egzaminacyjna – brak regularnych zajęć w siatce.";
    } else {
      if (iconEl) iconEl.textContent = "🎉";
      if (titleEl) titleEl.textContent = "Brak zajęć";
      if (descEl) descEl.textContent = "W tym tygodniu nie masz żadnych zaplanowanych zajęć.";
    }
    return;
  }

  elements.noClassesState.classList.add("hidden");
  elements.scheduleContent.classList.remove("hidden");

  // Determine multi-day list for full week view based on daysView setting
  let multiDays = DNI_TYGODNIA;
  if (state.daysView === "workdays") {
    multiDays = DNI_TYGODNIA.slice(0, 5);
  } else if (state.daysView === "active_only") {
    const activeDays = DNI_TYGODNIA.filter(day => filteredSchedule[day] && filteredSchedule[day].lessons.length > 0);
    multiDays = activeDays.length > 0 ? activeDays : DNI_TYGODNIA.slice(0, 5);
  } else {
    multiDays = DNI_TYGODNIA;
  }

  // Determine what days to display
  let daysToDisplay = multiDays;
  if (state.selectedDayTab !== "ALL") {
    daysToDisplay = [state.selectedDayTab];
  }

  let html = "";

  // Check if chosen single day has lessons
  if (daysToDisplay.length === 1) {
    const day = daysToDisplay[0];
    const dayData = filteredSchedule[day] || { lessons: [] };
    const lessons = dayData.lessons;

    const prep = DNI_PRZYIMEK[day] || "w";
    const dayAcc = DNI_MIEJSCOWNIK[day] || day;
    const dayDateFormatted = dayData.date ? `${String(dayData.date.getDate()).padStart(2, "0")}.${String(dayData.date.getMonth() + 1).padStart(2, "0")}` : "";

    if (lessons.length === 0) {
      elements.scheduleContent.classList.add("hidden");
      elements.noClassesState.classList.remove("hidden");

      if (dayData.swap) {
        const targetDayGen = DNI_DOPELNIACZ[dayData.swap.replaceWith] || dayData.swap.replaceWith;
        if (iconEl) iconEl.innerHTML = icon("swap_horiz", "", "width: 3rem; height: 3rem; color: #d97706;");
        if (titleEl) titleEl.textContent = `Dzień zamienny (plan z ${targetDayGen})`;
        if (descEl) {
          descEl.innerHTML = `${prep.charAt(0).toUpperCase() + prep.slice(1)} ${dayAcc} (${dayDateFormatted}) zajęcia odbywają się według planu z <strong>${targetDayGen}</strong>.<br>Twoja grupa nie ma zaplanowanych zajęć w tym planie.`;
        }
      } else if (dayData.holiday) {
        if (iconEl) iconEl.innerHTML = icon("celebration", "", "width: 3rem; height: 3rem; color: #0284c7;");
        if (titleEl) titleEl.textContent = dayData.holiday;
        if (descEl) {
          descEl.textContent = `${prep.charAt(0).toUpperCase() + prep.slice(1)} ${dayAcc} (${dayDateFormatted}) jest dniem wolnym od zajęć dydaktycznych.`;
        }
      } else {
        if (iconEl) iconEl.textContent = "🎉";
        if (titleEl) titleEl.textContent = "Brak zajęć";
        if (descEl) descEl.textContent = `Brak zajęć ${prep} ${dayAcc}. Czas na odpoczynek!`;
      }
      return;
    }

    let headerTitle = dayDateFormatted ? `${DNI_PELNE[day]} <span style="font-size: 0.85em; font-weight: normal; opacity: 0.8;">(${dayDateFormatted})</span>` : DNI_PELNE[day];

    let swapBanner = "";
    if (dayData.swap) {
      const targetDayGen = DNI_DOPELNIACZ[dayData.swap.replaceWith] || dayData.swap.replaceWith;
      swapBanner = `
        <div class="day-swap-banner">
          ${icon("swap_horiz")}
          <span>Dziś zajęcia według planu z <strong>${targetDayGen}</strong></span>
        </div>
      `;
    }

    html += `<div class="day-group">
      <div class="day-header">${headerTitle}</div>
      ${swapBanner}
      <div class="lessons-list">
        ${lessons.map((l) => renderLessonCard(l, targetMonday)).join("")}
      </div>
    </div>`;
  } else {
    // Multi-day / Desktop week view
    html += `<div class="schedule-week-grid" style="grid-template-columns: repeat(${multiDays.length}, 1fr);">`;
    for (const day of multiDays) {
      const dayData = filteredSchedule[day] || { lessons: [] };
      const lessons = dayData.lessons;
      const isToday = day === todayCode && state.weekOffset === 0;
      const dayDateFormatted = dayData.date ? `${String(dayData.date.getDate()).padStart(2, "0")}.${String(dayData.date.getMonth() + 1).padStart(2, "0")}` : "";

      let swapBadge = "";
      if (dayData.swap) {
        const targetDayGen = DNI_DOPELNIACZ[dayData.swap.replaceWith] || dayData.swap.replaceWith;
        const cleanNote = (dayData.swap.note || "").replace(/\s*\(zarządzenie rektora\)/gi, "").trim();
        swapBadge = `<div class="grid-day-swap-badge" title="${escapeHtml(cleanNote)}">${icon("swap_horiz", "", "width: 1.1em; height: 1.1em; vertical-align: middle;")} Plan z ${targetDayGen}</div>`;
      } else if (dayData.holiday) {
        swapBadge = `<div class="grid-day-holiday-badge" title="${escapeHtml(dayData.holiday)}">${icon("celebration", "", "width: 1.1em; height: 1.1em; vertical-align: middle;")} ${escapeHtml(dayData.holiday)}</div>`;
      }

      let emptyDayContent = `<p class="placeholder-text" style="text-align:center; padding: 1rem;">Brak zajęć</p>`;
      if (dayData.swap) {
        const targetDayAdj = DNI_PRZYMIOTNIK[dayData.swap.replaceWith] || "zamiennym";
        emptyDayContent = `
          <div class="grid-day-empty-state">
            ${icon("swap_horiz", "grid-empty-icon")}
            <span class="grid-empty-text">Brak zajęć w planie ${targetDayAdj}</span>
          </div>
        `;
      } else if (dayData.holiday) {
        emptyDayContent = `
          <div class="grid-day-empty-state holiday">
            ${icon("celebration", "grid-empty-icon")}
            <span class="grid-empty-text">${escapeHtml(dayData.holiday)}</span>
          </div>
        `;
      }

      html += `<div class="grid-day-col">
        <div class="grid-day-header ${isToday ? 'today' : ''}">
          <div>${DNI_PELNE[day]} <span style="font-size: 0.8em; font-weight: normal; opacity: 0.75;">${dayDateFormatted}</span> ${isToday ? '• Dziś' : ''}</div>
          ${swapBadge}
        </div>
        <div class="grid-lessons-list">
          ${lessons.length > 0
          ? lessons.map((l) => renderLessonCard(l, targetMonday)).join("")
          : emptyDayContent
        }
        </div>
      </div>`;
    }
    html += `</div>`;
  }

  elements.scheduleContent.innerHTML = html;
}

function renderLessonCard(lesson, targetMonday = null) {
  const safeTitle = escapeHtml(lesson.przedmiot || "Zajęcia");
  const safeTime = escapeHtml(lesson.godziny || "");
  const rawRoom = (lesson.sala || "").trim();
  const safeRoom = escapeHtml(rawRoom || "OL");
  const rawTeacher = (lesson.prowadzacy || "").trim();
  const safeTeacher = escapeHtml(rawTeacher);

  const targetMon = targetMonday || getWeekMonday(state.weekOffset);
  const prog = getLessonProgress(lesson, lesson.sourceDay || "PON", targetMon, lesson.lessonDate || null);

  const isPhysicalRoom = rawRoom && rawRoom.toUpperCase() !== "OL";
  const roomHtml = isPhysicalRoom
    ? `<button class="lesson-room-btn" data-room="${escapeHtml(rawRoom)}" title="Sprawdź plan i dostępność sali ${safeRoom}">Sala ${safeRoom}</button>`
    : `<span class="lesson-room-badge">${safeRoom}</span>`;

  const teacherHtml = rawTeacher && rawTeacher !== "Brak danych prowadzącego"
    ? `<button class="lesson-teacher-btn" data-teacher="${escapeHtml(rawTeacher)}" title="Zobacz pełny plan wykładowcy ${safeTeacher}">${safeTeacher}</button>`
    : `<span class="lesson-teacher">${safeTeacher || "Brak danych prowadzącego"}</span>`;

  const weeksHtml = prog
    ? `<span class="lesson-weeks ${prog.isFinal ? 'final-week' : ''}" title="${escapeHtml(prog.title || 'Spotkanie')}">${escapeHtml(prog.text)}</span>`
    : "";

  let badgeHtml = "";
  if (lesson.co_ile === 2) {
    badgeHtml += `<span class="lesson-cycle-badge" title="Zajęcia odbywają się co 2 tygodnie">co 2 tyg.</span>`;
  }
  if (lesson.polowa_sem === 1) {
    badgeHtml += `<span class="lesson-sem-badge" title="Zajęcia w 1. połowie semestru">1. poł. sem.</span>`;
  } else if (lesson.polowa_sem === 2) {
    badgeHtml += `<span class="lesson-sem-badge" title="Zajęcia w 2. połowie semestru">2. poł. sem.</span>`;
  }

  return `
    <div class="lesson-card">
      <div class="lesson-title">${safeTitle}</div>
      <div class="lesson-time">${safeTime}</div>
      <div class="lesson-room-wrapper">${roomHtml}${badgeHtml}</div>
      <div class="lesson-footer">
        ${teacherHtml}
        ${weeksHtml}
      </div>
    </div>
  `;
}

function showEmptyState() {
  elements.loadingState.classList.add("hidden");
  elements.scheduleContent.classList.add("hidden");
  elements.noClassesState.classList.add("hidden");
  elements.emptyState.classList.remove("hidden");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Calendar Modal Handlers
function openCalendarModal() {
  if (!state.selectedPlanId || !state.selectedGroup) {
    alert("Wybierz najpierw kierunek i grupę w menu!");
    openSidebar();
    return;
  }

  const origin = window.location.origin;
  const pathname = window.location.pathname.replace(/\/index\.html$/, "").replace(/\/$/, "");
  const safeGroup = getSafeGroupName(state.selectedGroup);
  const icsPath = `${pathname}/calendars/${state.selectedPlanId}_${safeGroup}.ics`;
  const fullHttpUrl = `${origin}${icsPath}`;
  const webcalUrl = fullHttpUrl.replace(/^https?:\/\//, "webcal://");
  const googleCalUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`;

  if (elements.calAppleBtn) {
    elements.calAppleBtn.href = webcalUrl;
  }
  if (elements.calGoogleBtn) {
    elements.calGoogleBtn.href = googleCalUrl;
  }
  if (elements.calDownloadBtn) {
    elements.calDownloadBtn.href = fullHttpUrl;
    elements.calDownloadBtn.setAttribute("download", `${state.selectedPlanId}_${safeGroup}.ics`);
  }
  if (elements.calendarUrlInput) {
    elements.calendarUrlInput.value = fullHttpUrl;
  }
  if (elements.copyFeedback) {
    elements.copyFeedback.classList.add("hidden");
  }

  // Device detection to recommend appropriate ecosystem (iOS vs Android / other)
  const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && !window.MSStream;
  if (elements.calAppleCard && elements.calGoogleCard) {
    elements.calAppleCard.classList.toggle("recommended", isApple);
    elements.calGoogleCard.classList.toggle("recommended", !isApple);
  }

  elements.calendarModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeCalendarModal() {
  elements.calendarModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function openAboutModal() {
  if (!elements.aboutModal) return;
  elements.aboutModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeAboutModal() {
  if (!elements.aboutModal) return;
  elements.aboutModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function copyCalendarUrl() {
  elements.calendarUrlInput.select();
  navigator.clipboard.writeText(elements.calendarUrlInput.value).then(() => {
    elements.copyFeedback.classList.remove("hidden");
    setTimeout(() => {
      elements.copyFeedback.classList.add("hidden");
    }, 2500);
  });
}

// ==========================================================================
// PWA Installation & iOS Guide Handlers
// ==========================================================================
let deferredPrompt = null;

function isAppStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIosDevice() {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

function openPwaModal(platform = "android") {
  const modal = elements.iosInstallModal;
  const title = document.getElementById("pwa-install-title");
  const body = document.getElementById("pwa-install-body");
  if (!modal) return;

  if (platform === "ios" || isIosDevice()) {
    if (title) title.textContent = "Dodaj do ekranu początkowego (iOS)";
    if (body) {
      body.innerHTML = `
        <p>Zainstaluj Plan WN na swoim urządzeniu Apple (Safari), aby mieć błyskawiczny dostęp jak do natywnej aplikacji:</p>
        <ol class="ios-install-steps">
          <li>
            <span class="step-num">1</span>
            <div class="step-desc">
              Kliknij ikonę <strong>Udostępnij</strong> (${icon("ios_share", "ios-step-icon")}) na pasku Safari.
            </div>
          </li>
          <li>
            <span class="step-num">2</span>
            <div class="step-desc">
              Przewiń w dół i wybierz <strong>„Do ekranu początkowego”</strong> (${icon("add_box", "ios-step-icon")}).
            </div>
          </li>
          <li>
            <span class="step-num">3</span>
            <div class="step-desc">
              Potwierdź klikając <strong>„Dodaj”</strong> w prawym górnym rogu.
            </div>
          </li>
        </ol>
        <button id="close-ios-modal-btn" class="btn-primary" style="width: 100%; justify-content: center; margin-top: 1.25rem;">Rozumiem</button>
      `;
      const btn = body.querySelector("#close-ios-modal-btn");
      if (btn) btn.onclick = closeIosModal;
    }
  } else {
    if (title) title.textContent = "Zainstaluj aplikację (Android / Chrome)";
    if (body) {
      body.innerHTML = `
        <p>Zainstaluj Plan WN jako aplikację na telefonie, aby korzystać z planu również offline i bez pasków przeglądarki:</p>
        <ol class="ios-install-steps">
          <li>
            <span class="step-num">1</span>
            <div class="step-desc">
              Kliknij menu z trzema kropkami (<strong>⋮</strong>) w prawym górnym rogu przeglądarki Chrome.
            </div>
          </li>
          <li>
            <span class="step-num">2</span>
            <div class="step-desc">
              Wybierz <strong>„Zainstaluj aplikację”</strong> lub <strong>„Dodaj do ekranu głównego”</strong> (${icon("install_mobile", "ios-step-icon")}).
            </div>
          </li>
          <li>
            <span class="step-num">3</span>
            <div class="step-desc">
              Potwierdź klikając <strong>„Zainstaluj”</strong>. Aplikacja z ikoną kotwicy ⚓ pojawi się na Twoim pulpicie.
            </div>
          </li>
        </ol>
        <button id="close-ios-modal-btn" class="btn-primary" style="width: 100%; justify-content: center; margin-top: 1.25rem;">Rozumiem</button>
      `;
      const btn = body.querySelector("#close-ios-modal-btn");
      if (btn) btn.onclick = closeIosModal;
    }
  }

  modal.classList.remove("hidden");
}

function openIosModal() {
  openPwaModal("ios");
}

function closeIosModal() {
  if (elements.iosInstallModal) {
    elements.iosInstallModal.classList.add("hidden");
  }
}

function initPwaInstall() {
  // Register Service Worker immediately for PWA support
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("Service Worker registration failed:", err);
    });
  }

  // If already installed and running as standalone app, keep install button hidden
  if (isAppStandalone()) {
    return;
  }

  // Show install button by default when running in browser
  if (elements.pwaInstallBtn) {
    elements.pwaInstallBtn.classList.remove("hidden");
    if (isIosDevice() && elements.pwaInstallBtnText) {
      elements.pwaInstallBtnText.textContent = "Dodaj do ekranu początkowego";
    }
  }
  if (elements.headerInstallBtn) {
    elements.headerInstallBtn.classList.remove("hidden");
  }

  // 1. Android / Chromium / Desktop PWA prompt listener
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (elements.pwaInstallBtn) elements.pwaInstallBtn.classList.remove("hidden");
    if (elements.headerInstallBtn) elements.headerInstallBtn.classList.remove("hidden");
  });

  // 2. Install click handler (Header + Sidebar)
  async function handleInstallTrigger() {
    const promptEvent = window.deferredPrompt || deferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult && choiceResult.outcome === "accepted") {
          if (elements.pwaInstallBtn) elements.pwaInstallBtn.classList.add("hidden");
          if (elements.headerInstallBtn) elements.headerInstallBtn.classList.add("hidden");
        }
      } catch (err) {
        console.warn("PWA prompt error:", err);
      }
      deferredPrompt = null;
      window.deferredPrompt = null;
      closeSidebar();
    } else if (isIosDevice()) {
      closeSidebar();
      openPwaModal("ios");
    } else {
      closeSidebar();
      openPwaModal("android");
    }
  }

  if (elements.pwaInstallBtn) {
    elements.pwaInstallBtn.addEventListener("click", handleInstallTrigger);
  }
  if (elements.headerInstallBtn) {
    elements.headerInstallBtn.addEventListener("click", handleInstallTrigger);
  }

  // 3. Listen for successful installation
  window.addEventListener("appinstalled", () => {
    if (elements.pwaInstallBtn) elements.pwaInstallBtn.classList.add("hidden");
    if (elements.headerInstallBtn) elements.headerInstallBtn.classList.add("hidden");
    deferredPrompt = null;
  });

  // 4. Modal Close Listeners
  if (elements.closeIosModalBtn) {
    elements.closeIosModalBtn.addEventListener("click", closeIosModal);
  }
  if (elements.closeIosModalActionBtn) {
    elements.closeIosModalActionBtn.addEventListener("click", closeIosModal);
  }
  if (elements.iosInstallModal) {
    const backdrop = elements.iosInstallModal.querySelector(".modal-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", closeIosModal);
    }
  }
}

// ==========================================================================
// Cross-Referencing, Search & Free Room Finder Engine
// ==========================================================================

async function loadCrossRefData() {
  if (state.crossRefData) return state.crossRefData;

  const CACHE_KEY = "umg_cross_ref_cache";
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      state.crossRefData = JSON.parse(cached);
      // Background fetch for freshness
      fetch("data/cross_reference.json")
        .then(r => r.ok ? r.json() : null)
        .then(fresh => {
          if (fresh) {
            state.crossRefData = fresh;
            try { localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch (e) { }
          }
        }).catch(() => { });
      return state.crossRefData;
    }
  } catch (e) { }

  try {
    const resp = await fetch("data/cross_reference.json");
    if (resp.ok) {
      state.crossRefData = await resp.json();
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(state.crossRefData)); } catch (e) { }
      return state.crossRefData;
    }
  } catch (err) {
    console.error("Error loading cross reference data:", err);
  }
  return null;
}

function openCrossModal(title, badge, bodyHtml) {
  elements.crossModalTitle.textContent = title;
  elements.crossModalBadge.textContent = badge;
  elements.crossModalBody.innerHTML = bodyHtml;
  elements.crossModal.classList.remove("hidden");
}

function closeCrossModal() {
  elements.crossModal.classList.add("hidden");
}

function onSearchInput(query) {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    elements.clearSearchBtn.classList.add("hidden");
    elements.searchResults.classList.add("hidden");
    elements.searchResults.innerHTML = "";
    return;
  }
  elements.clearSearchBtn.classList.remove("hidden");
  if (q.length < 2) {
    elements.searchResults.classList.add("hidden");
    return;
  }

  if (!state.crossRefData) {
    loadCrossRefData().then(() => onSearchInput(query));
    return;
  }

  const data = state.crossRefData;
  const matchedTeachers = [];
  const matchedRooms = [];
  const matchedSubjects = [];

  // Match teachers
  for (const t of Object.keys(data.teachers || {})) {
    if (t.toLowerCase().includes(q)) {
      matchedTeachers.push(t);
      if (matchedTeachers.length >= 5) break;
    }
  }

  // Match rooms
  for (const r of data.room_list || []) {
    if (r.toLowerCase().includes(q) || `sala ${r}`.toLowerCase().includes(q)) {
      matchedRooms.push(r);
      if (matchedRooms.length >= 5) break;
    }
  }

  // Match subjects
  for (const [sName, sData] of Object.entries(data.subjects || {})) {
    let match = sName.toLowerCase().includes(q);
    if (!match && sData.raw_variants) {
      match = sData.raw_variants.some(v => v.toLowerCase().includes(q));
    }
    if (match) {
      matchedSubjects.push(sName);
      if (matchedSubjects.length >= 5) break;
    }
  }

  if (matchedTeachers.length === 0 && matchedRooms.length === 0 && matchedSubjects.length === 0) {
    elements.searchResults.innerHTML = `<div class="search-no-results">Brak wyników dla "${escapeHtml(query)}"</div>`;
    elements.searchResults.classList.remove("hidden");
    return;
  }

  let html = "";
  if (matchedTeachers.length > 0) {
    html += `<div class="search-group-header">👨‍🏫 Wykładowcy</div>`;
    for (const t of matchedTeachers) {
      const classCount = (data.teachers[t] || []).length;
      html += `
        <button class="search-result-item" data-type="teacher" data-id="${escapeHtml(t)}">
          <div class="search-result-main">
            <span class="search-result-title">${escapeHtml(t)}</span>
            <span class="search-result-subtitle">${classCount} zajęć w tygodniu</span>
          </div>
          <span class="search-result-badge">Plan</span>
        </button>
      `;
    }
  }

  if (matchedRooms.length > 0) {
    html += `<div class="search-group-header">🚪 Sale</div>`;
    for (const r of matchedRooms) {
      html += `
        <button class="search-result-item" data-type="room" data-id="${escapeHtml(r)}">
          <div class="search-result-main">
            <span class="search-result-title">Sala ${escapeHtml(r)}</span>
            <span class="search-result-subtitle">Dostępność i zajęcia</span>
          </div>
          <span class="search-result-badge">Sala</span>
        </button>
      `;
    }
  }

  if (matchedSubjects.length > 0) {
    html += `<div class="search-group-header">📚 Przedmioty</div>`;
    for (const s of matchedSubjects) {
      const sData = data.subjects[s] || {};
      const teachersStr = (sData.teachers || []).slice(0, 2).join(", ");
      html += `
        <button class="search-result-item" data-type="subject" data-id="${escapeHtml(s)}">
          <div class="search-result-main">
            <span class="search-result-title">${escapeHtml(s)}</span>
            <span class="search-result-subtitle">${escapeHtml(teachersStr || "Szczegóły przedmiotu")}</span>
          </div>
          <span class="search-result-badge">Przedmiot</span>
        </button>
      `;
    }
  }

  elements.searchResults.innerHTML = html;
  elements.searchResults.classList.remove("hidden");
}

async function openTeacherSchedule(teacherName) {
  closeSidebar();
  openCrossModal(teacherName, "👨‍🏫 Wykładowca", `<div class="spinner" style="margin: 2rem auto;"></div><p style="text-align:center;">Wczytywanie planu...</p>`);

  const data = await loadCrossRefData();
  if (!data) {
    openCrossModal(teacherName, "👨‍🏫 Wykładowca", `<p class="placeholder-text" style="text-align:center; padding: 2rem; color: #ef4444;">Nie udało się załadować danych.</p>`);
    return;
  }

  let entries = (data.teachers && data.teachers[teacherName]) || null;
  if (!entries && data.teachers) {
    const lower = teacherName.toLowerCase().trim();
    for (const [k, v] of Object.entries(data.teachers)) {
      if (k.toLowerCase().trim() === lower) {
        entries = v;
        break;
      }
    }
  }
  entries = entries || [];

  if (entries.length === 0) {
    openCrossModal(teacherName, "👨‍🏫 Wykładowca", `<p class="placeholder-text" style="text-align:center; padding: 2rem;">Brak zaplanowanych zajęć w bazie dla ${escapeHtml(teacherName)}.</p>`);
    return;
  }

  const byDay = {};
  for (const day of DNI_TYGODNIA) byDay[day] = [];
  for (const entry of entries) {
    if (!byDay[entry.day]) byDay[entry.day] = [];
    byDay[entry.day].push(entry);
  }

  let html = `<div class="modal-schedule-section">`;
  html += `<p style="margin-bottom: 0.5rem; color: var(--text-secondary);">Łącznie zajęć w tygodniu: <strong>${entries.length}</strong></p>`;

  for (const day of DNI_TYGODNIA) {
    const dayEntries = byDay[day] || [];
    if (dayEntries.length === 0) continue;

    html += `
      <div class="modal-day-group">
        <div class="modal-day-title">
          <span>${DNI_PELNE[day] || day}</span>
          <span>${dayEntries.length} ${dayEntries.length === 1 ? 'zajęcia' : 'zajęć'}</span>
        </div>
        <div class="modal-slots-list">
    `;

    for (const e of dayEntries) {
      const isPhys = e.room && e.room.toUpperCase() !== "OL";
      const roomBtn = isPhys
        ? `<button class="lesson-room-btn" data-room="${escapeHtml(e.room)}">📍 Sala ${escapeHtml(e.room)}</button>`
        : `<span class="lesson-room-badge">${escapeHtml(e.room || "OL")}</span>`;

      let cycleBadges = "";
      if (e.polowa_sem) {
        cycleBadges += `<span class="lesson-sem-badge">${e.polowa_sem}. poł. sem.</span>`;
      }
      if (e.co_ile === 2) {
        const odStr = e.od_tyg === 2 ? "od 2 tyg" : "od 1 tyg";
        cycleBadges += `<span class="lesson-cycle-badge">co 2 tyg (${odStr})</span>`;
      }

      const groupsHtml = (e.groups || []).map(g => `<span class="modal-group-chip">${escapeHtml(g)}</span>`).join("");

      html += `
        <div class="modal-slot-item">
          <div class="modal-slot-header">
            <span class="modal-slot-time">${escapeHtml(e.hours)}</span>
            <div style="display:flex; gap:0.35rem; align-items:center;">
              ${cycleBadges}
              ${roomBtn}
            </div>
          </div>
          <div class="modal-slot-subject">${escapeHtml(e.subject)}</div>
          <div class="modal-slot-meta">
            <span>Grupy:</span>
            <div class="modal-groups-chips">${groupsHtml}</div>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(e.plan_name)}</div>
        </div>
      `;
    }

    html += `</div></div>`;
  }

  html += `</div>`;
  openCrossModal(teacherName, "👨‍🏫 Wykładowca", html);
}

async function openRoomSchedule(roomName) {
  closeSidebar();
  openCrossModal(`Sala ${roomName}`, "🚪 Sala", `<div class="spinner" style="margin: 2rem auto;"></div><p style="text-align:center;">Wczytywanie obłożenia sali...</p>`);

  const data = await loadCrossRefData();
  if (!data) {
    openCrossModal(`Sala ${roomName}`, "🚪 Sala", `<p class="placeholder-text" style="text-align:center; padding: 2rem; color: #ef4444;">Nie udało się załadować danych.</p>`);
    return;
  }

  let roomDays = (data.rooms && data.rooms[roomName]) || null;
  if (!roomDays && data.rooms) {
    const lower = roomName.toLowerCase().trim();
    for (const [k, v] of Object.entries(data.rooms)) {
      if (k.toLowerCase().trim() === lower) {
        roomDays = v;
        break;
      }
    }
  }
  roomDays = roomDays || {};

  let totalBooked = 0;
  for (const d of Object.values(roomDays)) totalBooked += d.length;

  let html = `<div class="modal-schedule-section">`;
  html += `<p style="margin-bottom: 0.5rem; color: var(--text-secondary);">Tygodniowe obłożenie sali: <strong>${totalBooked}</strong> bloków zajęciowych.</p>`;

  for (const day of DNI_TYGODNIA) {
    const dayEntries = roomDays[day] || [];
    html += `
      <div class="modal-day-group">
        <div class="modal-day-title">
          <span>${DNI_PELNE[day] || day}</span>
          <span>${dayEntries.length > 0 ? `${dayEntries.length} zajęć` : 'Wolna cały dzień'}</span>
        </div>
        <div class="modal-slots-list">
    `;

    if (dayEntries.length === 0) {
      html += `<p style="padding: 0.75rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Brak zajęć w tym dniu (sala wolna)</p>`;
    } else {
      for (const e of dayEntries) {
        const teacherBtn = e.teacher && e.teacher !== "Brak danych prowadzącego"
          ? `<button class="lesson-teacher-btn" data-teacher="${escapeHtml(e.teacher)}">👨‍🏫 ${escapeHtml(e.teacher)}</button>`
          : `<span style="font-style: italic; font-size: 0.8rem; color: var(--text-muted);">Brak danych prowadzącego</span>`;

        let cycleBadges = "";
        if (e.polowa_sem) {
          cycleBadges += `<span class="lesson-sem-badge">${e.polowa_sem}. poł. sem.</span>`;
        }
        if (e.co_ile === 2) {
          const odStr = e.od_tyg === 2 ? "od 2 tyg" : "od 1 tyg";
          cycleBadges += `<span class="lesson-cycle-badge">co 2 tyg (${odStr})</span>`;
        }

        const groupsHtml = (e.groups || []).map(g => `<span class="modal-group-chip">${escapeHtml(g)}</span>`).join("");

        html += `
          <div class="modal-slot-item">
            <div class="modal-slot-header">
              <span class="modal-slot-time">${escapeHtml(e.hours)}</span>
              <div style="display:flex; gap:0.35rem; align-items:center;">
                ${cycleBadges}
                <span class="free-room-badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Zajęta</span>
              </div>
            </div>
            <div class="modal-slot-subject">${escapeHtml(e.subject)}</div>
            <div class="modal-slot-meta">
              ${teacherBtn}
              <div class="modal-groups-chips">${groupsHtml}</div>
            </div>
          </div>
        `;
      }
    }

    html += `</div></div>`;
  }

  html += `</div>`;
  openCrossModal(`Sala ${roomName}`, "🚪 Sala", html);
}

async function openSubjectDetail(subjectName) {
  closeSidebar();
  openCrossModal(subjectName, "📚 Przedmiot", `<div class="spinner" style="margin: 2rem auto;"></div><p style="text-align:center;">Wczytywanie szczegółów przedmiotu...</p>`);

  const data = await loadCrossRefData();
  if (!data) {
    openCrossModal(subjectName, "📚 Przedmiot", `<p class="placeholder-text" style="text-align:center; padding: 2rem; color: #ef4444;">Nie udało się załadować danych.</p>`);
    return;
  }

  let sInfo = (data.subjects && data.subjects[subjectName]) || null;
  if (!sInfo && data.subjects) {
    const lower = subjectName.toLowerCase().trim();
    for (const [k, v] of Object.entries(data.subjects)) {
      if (k.toLowerCase().trim() === lower) {
        sInfo = v;
        break;
      }
    }
  }

  if (!sInfo) {
    openCrossModal(subjectName, "📚 Przedmiot", `<p class="placeholder-text">Brak szczegółów dla ${escapeHtml(subjectName)}</p>`);
    return;
  }

  let html = `<div class="subject-meta-card">`;

  if (sInfo.syllabus_url) {
    html += `
      <div>
        <a class="subject-syllabus-link" href="${escapeHtml(sInfo.syllabus_url)}" target="_blank" rel="noopener">
          📄 Oficjalna karta przedmiotu (Sylabus WN) ↗
        </a>
      </div>
    `;
  }

  if (sInfo.majors && sInfo.majors.length > 0) {
    html += `
      <div>
        <div class="control-label" style="margin-bottom: 0.25rem;">Kierunki studiów (siatka WN):</div>
        <div style="font-size: 0.88rem; color: var(--text-primary); line-height: 1.4;">${sInfo.majors.map(m => `• ${escapeHtml(m)}`).join("<br>")}</div>
      </div>
    `;
  }

  if (sInfo.teachers && sInfo.teachers.length > 0) {
    html += `
      <div style="margin-top: 0.5rem;">
        <div class="control-label" style="margin-bottom: 0.25rem;">Prowadzący ten przedmiot:</div>
        <div style="display: flex; flex-direction: column; gap: 0.35rem;">
          ${sInfo.teachers.map(t => `<button class="lesson-teacher-btn" data-teacher="${escapeHtml(t)}">👨‍🏫 ${escapeHtml(t)}</button>`).join("")}
        </div>
      </div>
    `;
  }

  if (sInfo.plans && sInfo.plans.length > 0) {
    html += `
      <div style="margin-top: 0.5rem;">
        <div class="control-label" style="margin-bottom: 0.25rem;">Grupy realizujące ten przedmiot w semestrze:</div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
    `;
    for (const p of sInfo.plans) {
      const gChips = (p.groups || []).map(g => `<span class="modal-group-chip">${escapeHtml(g)}</span>`).join("");
      html += `
        <div style="font-size: 0.82rem; color: var(--text-secondary); background: var(--bg-card); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-subtle);">
          <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">${escapeHtml(p.plan_name)}</div>
          <div class="modal-groups-chips">${gChips}</div>
        </div>
      `;
    }
    html += `</div></div>`;
  }

  html += `</div>`;
  openCrossModal(subjectName, "📚 Przedmiot", html);
}

// Pure function to determine room occupancy at a given date and time range
function getRoomOccupancyAt(daySchedule, queryRange, targetDateIso, baseDay) {
  if (!daySchedule || !daySchedule.length) {
    return { isFree: true, occupyingClass: null, nextClass: null };
  }

  // If the target date is not a teaching day (holiday, break, exam session)
  if (!isTeachingDay(targetDateIso)) {
    return { isFree: true, occupyingClass: null, nextClass: null };
  }

  const qStart = queryRange.start;
  const qEnd = queryRange.end;

  let occupyingClass = null;
  let nextClass = null;

  const [y, m, d] = targetDateIso.split("-").map(Number);
  const targetDateObj = new Date(y, m - 1, d);
  const targetMonday = getMonday(targetDateObj);

  for (const entry of daySchedule) {
    if (!entry.hours || !entry.hours.includes(" - ")) continue;
    const [startStr, endStr] = entry.hours.split(" - ");
    const [sh, sm] = startStr.trim().split(":").map(Number);
    const [eh, em] = endStr.trim().split(":").map(Number);
    const cStart = sh * 60 + sm;
    const cEnd = eh * 60 + em;

    // Check if the lesson is active on targetDateIso
    const lessonDesc = {
      przedmiot: entry.subject,
      data_start: entry.data_start,
      tygodnie: entry.weeks || entry.tygodnie || 15,
      co_ile: entry.co_ile || 1,
      polowa_sem: entry.polowa_sem
    };

    const meetingInfo = getLessonMeetingInfo(lessonDesc, baseDay, targetMonday, targetDateIso);
    if (!meetingInfo.active) {
      continue;
    }

    if (cStart < qEnd && cEnd > qStart) {
      occupyingClass = entry;
      break;
    }
    if (cStart >= qEnd) {
      if (!nextClass) {
        nextClass = entry;
      } else {
        const [nsh, nsm] = nextClass.hours.split(" - ")[0].trim().split(":").map(Number);
        if (cStart < nsh * 60 + nsm) {
          nextClass = entry;
        }
      }
    }
  }

  return {
    isFree: !occupyingClass,
    occupyingClass,
    overlappingClass: occupyingClass,
    nextClass
  };
}

async function openFreeRoomsModal(customDay, customSlot) {
  closeSidebar();
  openCrossModal("Dostępność sal", "🔎 Wolne sale", `<div class="spinner" style="margin: 2rem auto;"></div><p style="text-align:center;">Sprawdzanie dostępności sal...</p>`);

  const data = await loadCrossRefData();
  if (!data) {
    openCrossModal("Dostępność sal", "🔎 Wolne sale", `<p class="placeholder-text" style="text-align:center; padding: 2rem; color: #ef4444;">Nie udało się załadować danych.</p>`);
    return;
  }

  const todayCode = getTodayCode();
  const day = customDay || (DNI_TYGODNIA.includes(todayCode) ? todayCode : "PON");

  const STANDARD_SLOTS = [
    { label: "Teraz (bieżący czas)", value: "NOW" },
    { label: "08:00 - 09:30", value: "08:00 - 09:30" },
    { label: "09:45 - 11:15", value: "09:45 - 11:15" },
    { label: "11:30 - 13:00", value: "11:30 - 13:00" },
    { label: "13:30 - 15:00", value: "13:30 - 15:00" },
    { label: "15:15 - 16:45", value: "15:15 - 16:45" },
    { label: "17:00 - 18:30", value: "17:00 - 18:30" },
    { label: "18:45 - 20:15", value: "18:45 - 20:15" }
  ];

  const slot = customSlot || "NOW";

  function parseMinutes(timeStr) {
    const [h, m] = timeStr.trim().split(":").map(Number);
    return h * 60 + m;
  }

  let qStart = 0;
  let qEnd = 0;

  if (slot === "NOW") {
    const now = new Date();
    const curMinutes = now.getHours() * 60 + now.getMinutes();
    qStart = curMinutes;
    qEnd = curMinutes + 1;
  } else {
    const parts = slot.split(" - ");
    if (parts.length === 2) {
      qStart = parseMinutes(parts[0]);
      qEnd = parseMinutes(parts[1]);
    }
  }

  // Determine target date for date-aware occupancy
  const todayObj = new Date();
  const todayIso = formatDateISO(todayObj);
  let targetDateIso = todayIso;
  let effectiveScheduleDay = day;

  if (day !== todayCode) {
    const curMon = getMonday(todayObj);
    const dayIdx = DNI_MAP_SUNDAY_FIRST.indexOf(day);
    const offset = (dayIdx === 0 ? 6 : dayIdx - 1);
    const targetDayDate = new Date(curMon);
    targetDayDate.setDate(curMon.getDate() + offset);
    targetDateIso = formatDateISO(targetDayDate);
  }

  if (ACADEMIC_CALENDAR.daySwaps && ACADEMIC_CALENDAR.daySwaps[targetDateIso]) {
    effectiveScheduleDay = ACADEMIC_CALENDAR.daySwaps[targetDateIso].replaceWith;
  }

  const roomsList = data.room_list || [];
  const roomStatuses = [];

  for (const r of roomsList) {
    const daySchedule = (data.rooms[r] && data.rooms[r][effectiveScheduleDay]) || [];
    const occupancy = getRoomOccupancyAt(daySchedule, { start: qStart, end: qEnd }, targetDateIso, effectiveScheduleDay);

    roomStatuses.push({
      room: r,
      isFree: occupancy.isFree,
      overlappingClass: occupancy.occupyingClass,
      nextClass: occupancy.nextClass
    });
  }

  // Free rooms first, then by room name
  roomStatuses.sort((a, b) => {
    if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
    return a.room.localeCompare(b.room, undefined, { numeric: true });
  });

  const freeCount = roomStatuses.filter(r => r.isFree).length;

  let html = `
    <div class="free-rooms-controls">
      <div class="free-rooms-control-group">
        <label for="fr-day-select">Dzień tygodnia:</label>
        <select id="fr-day-select">
          ${DNI_TYGODNIA.map(d => `<option value="${d}" ${d === day ? 'selected' : ''}>${DNI_PELNE[d]}</option>`).join("")}
        </select>
      </div>
      <div class="free-rooms-control-group">
        <label for="fr-slot-select">Przedział godzinowy:</label>
        <select id="fr-slot-select">
          ${STANDARD_SLOTS.map(s => `<option value="${s.value}" ${s.value === slot ? 'selected' : ''}>${s.label}</option>`).join("")}
        </select>
      </div>
    </div>

    <div class="free-rooms-summary-banner">
      <span>Dostępne sale: <strong style="color: #10b981;">${freeCount}</strong> z ${roomsList.length}</span>
      <span style="font-size: 0.8rem; color: var(--text-muted);">Kliknij salę, aby sprawdzić jej plan</span>
    </div>

    <div class="free-rooms-grid">
  `;

  for (const st of roomStatuses) {
    if (st.isFree) {
      let subtext = "Wolna do końca dnia";
      if (st.nextClass && st.nextClass.hours) {
        const nextStart = st.nextClass.hours.split(" - ")[0];
        subtext = `Wolna do ${nextStart}`;
      }
      html += `
        <div class="free-room-card status-free" data-room="${escapeHtml(st.room)}">
          <div class="free-room-header">
            <span class="free-room-name">Sala ${escapeHtml(st.room)}</span>
            <span class="free-room-badge">WOLNA</span>
          </div>
          <div class="free-room-detail" style="color: #10b981; font-weight: 600;">${escapeHtml(subtext)}</div>
        </div>
      `;
    } else {
      const cls = st.overlappingClass;
      html += `
        <div class="free-room-card status-busy" data-room="${escapeHtml(st.room)}">
          <div class="free-room-header">
            <span class="free-room-name">Sala ${escapeHtml(st.room)}</span>
            <span class="free-room-badge">ZAJĘTA</span>
          </div>
          <div class="free-room-detail" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHtml(cls.subject || "Zajęcia")} (${escapeHtml(cls.hours)})
          </div>
        </div>
      `;
    }
  }

  html += `</div>`;

  openCrossModal("Dostępność sal", "🔎 Wolne sale", html);

  // Bind change events inside modal
  const daySel = document.getElementById("fr-day-select");
  const slotSel = document.getElementById("fr-slot-select");
  if (daySel && slotSel) {
    daySel.addEventListener("change", () => openFreeRoomsModal(daySel.value, slotSel.value));
    slotSel.addEventListener("change", () => openFreeRoomsModal(daySel.value, slotSel.value));
  }

  // Click handler on room cards inside modal
  elements.crossModalBody.querySelectorAll(".free-room-card").forEach(card => {
    card.addEventListener("click", () => {
      const r = card.dataset.room;
      if (r) openRoomSchedule(r);
    });
  });
}

// Global exports for inline handlers
if (typeof window !== "undefined") {
  window.openTeacherSchedule = openTeacherSchedule;
  window.openRoomSchedule = openRoomSchedule;
  window.openSubjectDetail = openSubjectDetail;
  window.openFreeRoomsModal = openFreeRoomsModal;
  window.getRoomOccupancyAt = getRoomOccupancyAt;
  window.closeCrossModal = closeCrossModal;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ACADEMIC_CALENDAR,
    formatDateISO,
    getMonday,
    isTeachingDay,
    getLessonSemesterPeriod,
    getLessonMeetingInfo,
    getLessonProgress,
    getSafeGroupName,
    getRoomOccupancyAt,
    parsePlanInfo
  };
}




