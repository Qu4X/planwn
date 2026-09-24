
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

const _ScheduleEngine = (typeof ScheduleEngine !== "undefined")
  ? ScheduleEngine
  : (typeof require !== "undefined" ? require("./js/schedule-engine.js") : null);

let engine = _ScheduleEngine ? _ScheduleEngine.create(ACADEMIC_CALENDAR) : null;

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
  reportMailBtn: document.getElementById("report-mail-btn"),
  changelogModal: document.getElementById("changelog-modal"),
  closeChangelogModalBtn: document.getElementById("close-changelog-modal"),
  confirmChangelogBtn: document.getElementById("confirm-changelog-btn"),
  changelogVersionBadge: document.getElementById("changelog-version-badge"),
  changelogDate: document.getElementById("changelog-date"),
  changelogFeaturesList: document.getElementById("changelog-features-list")
} : {};

// Initialize App
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    setupEventListeners();
    initPwaInstall();
    initCrossRefUI();
    loadAcademicCalendarConfig();
    updateDayTabsUI();
    loadPlans();
  });
}

function initCrossRefUI() {
  if (typeof window !== "undefined" && window.CrossRef && window.CrossRef.UI) {
    window.CrossRef.UI.init({
      elements: {
        modal: elements.crossModal,
        title: elements.crossModalTitle,
        badge: elements.crossModalBadge,
        body: elements.crossModalBody,
        searchInput: elements.sidebarSearchInput,
        searchResults: elements.searchResults,
        clearSearchBtn: elements.clearSearchBtn
      },
      scheduleEngine: engine,
      onBeforeOpen: closeSidebar
    });
    window.CrossRef.DataService.load();
  }
}

async function loadAcademicCalendarConfig() {
  try {
    const res = await fetch("data/academic_calendar.json");
    if (res.ok) {
      const data = await res.json();
      if (data && data.periods) {
        ACADEMIC_CALENDAR = data;
        if (_ScheduleEngine) {
          engine = _ScheduleEngine.create(ACADEMIC_CALENDAR);
          if (typeof window !== "undefined" && window.CrossRef && window.CrossRef.UI) {
            window.CrossRef.UI.scheduleEngine = engine;
          }
        }
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
  if (elements.closeCrossModalBtn) {
    elements.closeCrossModalBtn.addEventListener("click", () => {
      if (window.CrossRef && window.CrossRef.UI) window.CrossRef.UI.closeModal();
    });
  }
  if (elements.crossModal) {
    const backdrop = elements.crossModal.querySelector(".modal-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => {
        if (window.CrossRef && window.CrossRef.UI) window.CrossRef.UI.closeModal();
      });
    }
  }

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
  if (elements.closeChangelogModalBtn) {
    elements.closeChangelogModalBtn.addEventListener("click", closeChangelogModal);
  }
  if (elements.confirmChangelogBtn) {
    elements.confirmChangelogBtn.addEventListener("click", closeChangelogModal);
  }
  if (elements.changelogModal) {
    elements.changelogModal.addEventListener("click", (e) => {
      // If user clicks the dialog backdrop itself (outside the modal-dialog-content)
      const rect = elements.changelogModal.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!isInDialog || e.target === elements.changelogModal) {
        closeChangelogModal();
      }
    });
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
      if (window.CrossRef && window.CrossRef.UI) window.CrossRef.UI.closeModal();
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

  if (elements.sidebarSearchInput) {
    elements.sidebarSearchInput.addEventListener("input", (e) => {
      if (window.CrossRef && window.CrossRef.UI) {
        window.CrossRef.UI.handleSearch(e.target.value);
      }
    });
  }

  if (elements.clearSearchBtn) {
    elements.clearSearchBtn.addEventListener("click", () => {
      if (window.CrossRef && window.CrossRef.UI) {
        window.CrossRef.UI.clearSearch();
      }
      if (elements.sidebarSearchInput) elements.sidebarSearchInput.focus();
    });
  }

  if (elements.searchResults) {
    elements.searchResults.addEventListener("click", (e) => {
      const item = e.target.closest(".search-result-item");
      if (!item) return;
      const type = item.dataset.type;
      const id = item.dataset.id;
      closeSidebar();
      elements.searchResults.classList.add("hidden");
      if (!window.CrossRef || !window.CrossRef.UI) return;
      if (type === "teacher") {
        window.CrossRef.UI.openTeacher(id);
      } else if (type === "room") {
        window.CrossRef.UI.openRoom(id);
      } else if (type === "subject") {
        window.CrossRef.UI.openSubject(id);
      }
    });
  }

  // Free Rooms Finder Button
  if (elements.freeRoomsBtn) {
    elements.freeRoomsBtn.addEventListener("click", () => {
      closeSidebar();
      if (window.CrossRef && window.CrossRef.UI) {
        window.CrossRef.UI.openFreeRooms();
      }
    });
  }

  // Delegated clicks inside Schedule Cards (Teachers and Rooms)
  if (elements.scheduleContent) {
    elements.scheduleContent.addEventListener("click", (e) => {
      const roomBtn = e.target.closest(".lesson-room-btn");
      if (roomBtn && roomBtn.dataset.room) {
        e.stopPropagation();
        if (window.CrossRef && window.CrossRef.UI) {
          window.CrossRef.UI.openRoom(roomBtn.dataset.room);
        }
        return;
      }
      const teacherBtn = e.target.closest(".lesson-teacher-btn");
      if (teacherBtn && teacherBtn.dataset.teacher) {
        e.stopPropagation();
        if (window.CrossRef && window.CrossRef.UI) {
          window.CrossRef.UI.openTeacher(teacherBtn.dataset.teacher);
        }
        return;
      }
    });
  }

  // Delegated clicks inside Cross Modal (to navigate between teachers, rooms, and subjects)
  if (elements.crossModalBody) {
    elements.crossModalBody.addEventListener("click", (e) => {
      const roomBtn = e.target.closest(".lesson-room-btn");
      if (roomBtn && roomBtn.dataset.room) {
        e.stopPropagation();
        if (window.CrossRef && window.CrossRef.UI) {
          window.CrossRef.UI.openRoom(roomBtn.dataset.room);
        }
        return;
      }
      const teacherBtn = e.target.closest(".lesson-teacher-btn");
      if (teacherBtn && teacherBtn.dataset.teacher) {
        e.stopPropagation();
        if (window.CrossRef && window.CrossRef.UI) {
          window.CrossRef.UI.openTeacher(teacherBtn.dataset.teacher);
        }
        return;
      }
    });
  }
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

    // Check for feature updates and display "Co nowego?" modal if applicable
    checkChangelogNotification();
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

  // During full break or exam periods, the schedule view displays a dedicated card; hide top banner
  if (academicInfo.periodType === "break" || academicInfo.periodType === "exam") {
    elements.calendarNotice.classList.add("hidden");
    elements.calendarNotice.innerHTML = "";
    return;
  }

  const notices = [];

  // Retain day swaps and critical announcements
  if (academicInfo.daySwaps && academicInfo.daySwaps.length > 0) {
    for (const swap of academicInfo.daySwaps) {
      const cleanNote = (swap.note || "").replace(/\s*\(zarządzenie rektora\)/gi, "").trim();
      notices.push(`
        <div class="calendar-notice-item">
          ${icon("warning", "notice-icon")}
          <span class="notice-text"><strong>Zamiana dnia:</strong> ${escapeHtml(cleanNote)}</span>
        </div>
      `);
    }
  }

  if (academicInfo.announcements && academicInfo.announcements.length > 0) {
    for (const ann of academicInfo.announcements) {
      notices.push(`
        <div class="calendar-notice-item">
          ${icon("info", "notice-icon")}
          <span class="notice-text"><strong>Komunikat:</strong> ${escapeHtml(ann)}</span>
        </div>
      `);
    }
  }

  if (notices.length > 0) {
    elements.calendarNotice.innerHTML = notices.join("");
    elements.calendarNotice.className = "calendar-notice";
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

// Sprawdzenie dnia dydaktycznego (delegowane do ScheduleEngine)
function isTeachingDay(iso) {
  return engine ? engine.isTeachingDay(iso) : true;
}

// Obliczenie wystąpienia spotkania (delegowane do ScheduleEngine)
function getLessonMeetingInfo(lesson, baseDay, targetMonday, targetDate = null) {
  return engine
    ? engine.getLessonMeetingInfo(lesson, baseDay, targetMonday, targetDate)
    : { active: true, meetingNum: 1, total: (lesson && lesson.tygodnie) || 15 };
}

// Sprawdzenie czy zajęcia odbywają się w wybranym tygodniu
function isLessonInWeek(lesson, baseDay, targetMonday, targetDate = null) {
  if (!lesson || !lesson.data_start) return true;
  return getLessonMeetingInfo(lesson, baseDay, targetMonday, targetDate).active;
}

// Obliczenie postępu spotkania (delegowane do ScheduleEngine)
function getLessonProgress(lesson, baseDay, targetMonday, targetDate = null) {
  return engine ? engine.getLessonProgress(lesson, baseDay, targetMonday, targetDate) : null;
}

// Render schedule view
function renderSchedule() {
  if (!state.scheduleData) return;

  const targetMonday = getWeekMonday(state.weekOffset);
  const todayCode = getTodayCode();

  // Filter lessons for each day of the week, with support for day replacements
  const filteredSchedule = {};
  let totalLessonsInWeek = 0;

  const weekResolution = engine ? engine.resolveWeekSchedule(targetMonday, state.scheduleData) : {};
  for (const day of DNI_TYGODNIA) {
    const dayStatus = weekResolution[day] || { lessons: [] };
    filteredSchedule[day] = {
      lessons: dayStatus.lessons || [],
      swap: dayStatus.status === "daySwap" ? { replaceWith: dayStatus.swapReplaceWith, note: dayStatus.swapNote } : null,
      holiday: dayStatus.status === "holiday" ? dayStatus.message : null,
      date: dayStatus.dateObj,
      dateKey: dayStatus.dateISO,
      status: dayStatus.status,
      message: dayStatus.message,
      baseDayPreview: dayStatus.baseDayPreview
    };
    totalLessonsInWeek += (dayStatus.lessons || []).length;
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
        if (titleEl) titleEl.textContent = `Zamiana dnia (plan z ${targetDayGen})`;
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

    let swapBadge = "";
    if (dayData.swap) {
      const targetDayGen = DNI_DOPELNIACZ[dayData.swap.replaceWith] || dayData.swap.replaceWith;
      const cleanNote = (dayData.swap.note || "").replace(/\s*\(zarządzenie rektora\)/gi, "").trim();
      swapBadge = `<div class="day-swap-badge" title="${escapeHtml(cleanNote)}">${icon("swap_horiz", "", "width: 1.1em; height: 1.1em; vertical-align: middle;")} Plan z ${targetDayGen}</div>`;
    }

    html += `<div class="day-group">
      <div class="day-header">
        <span class="day-header-title">${headerTitle}</span>
        ${swapBadge}
      </div>
      <div class="lessons-list">
        ${lessons.map((l) => renderLessonCard(l, targetMonday)).join("")}
      </div>
    </div>`;
  } else {
    // Multi-day / Desktop week view
    html += `<div class="schedule-week-grid" style="--grid-cols: repeat(${multiDays.length}, 1fr);">`;
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
          <div class="lesson-card holiday-card">
            <div class="holiday-card-content">
              ${icon("celebration", "holiday-card-icon")}
              <span class="holiday-card-text">${escapeHtml(dayData.holiday)}</span>
            </div>
          </div>
        `;
      }

      html += `<div class="grid-day-col">
        <div class="grid-day-header ${isToday ? 'today' : ''}">
          <span class="grid-day-header-title">${DNI_PELNE[day]} <span style="font-size: 0.8em; font-weight: normal; opacity: 0.75;">${dayDateFormatted}</span> ${isToday ? '• Dziś' : ''}</span>
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
  if (typeof document !== "undefined") {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
// Changelog / What's New Notification Engine
// ==========================================================================
const CHANGELOG_STORAGE_KEY = "last_seen_changelog_version";
let currentPendingChangelogVersion = null;

function shouldShowChangelog(latestVersion, lastSeenVersion) {
  if (!latestVersion) return false;
  if (!lastSeenVersion) return true;
  return String(latestVersion).trim() !== String(lastSeenVersion).trim();
}

function openChangelogModal(changelogEntry) {
  if (!elements.changelogModal || !changelogEntry) return;

  currentPendingChangelogVersion = changelogEntry.version || null;

  if (elements.changelogVersionBadge) {
    elements.changelogVersionBadge.textContent = changelogEntry.version
      ? `Wersja ${changelogEntry.version}`
      : "Aktualizacja";
  }

  if (elements.changelogDate) {
    elements.changelogDate.textContent = changelogEntry.date || "";
  }

  if (elements.changelogFeaturesList) {
    const features = Array.isArray(changelogEntry.features) ? changelogEntry.features : [];
    elements.changelogFeaturesList.innerHTML = features
      .map(feat => `<li>${escapeHtml(feat)}</li>`)
      .join("");
  }

  if (typeof elements.changelogModal.showModal === "function") {
    elements.changelogModal.showModal();
  } else {
    elements.changelogModal.classList.remove("hidden");
  }
}

function closeChangelogModal() {
  if (!elements.changelogModal) return;

  if (currentPendingChangelogVersion) {
    try {
      localStorage.setItem(CHANGELOG_STORAGE_KEY, currentPendingChangelogVersion);
    } catch (e) {
      console.warn("Could not save seen changelog version to localStorage:", e);
    }
    currentPendingChangelogVersion = null;
  }

  if (typeof elements.changelogModal.close === "function") {
    elements.changelogModal.close();
  } else {
    elements.changelogModal.classList.add("hidden");
  }
}

async function checkChangelogNotification() {
  try {
    const response = await fetch("changelog.json");
    if (!response.ok) return;

    const changelogs = await response.json();
    if (!Array.isArray(changelogs) || changelogs.length === 0) return;

    const latest = changelogs[0];
    if (!latest || !latest.version) return;

    let lastSeen = null;
    try {
      lastSeen = localStorage.getItem(CHANGELOG_STORAGE_KEY);
    } catch (e) {
      // LocalStorage might be disabled or unavailable
    }

    if (shouldShowChangelog(latest.version, lastSeen)) {
      openChangelogModal(latest);
    }
  } catch (err) {
    // Fail silently without disturbing app execution
    console.debug("Changelog check skipped or failed:", err);
  }
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
// Cross-Referencing & Free Rooms Integration (Delegated to CrossRef module)
// ==========================================================================





// Pure function to determine room occupancy at a given date and time range
function getRoomOccupancyAt(daySchedule, queryRange, targetDateIso, baseDay) {
  if (engine) return engine.getRoomOccupancyAt(daySchedule, queryRange, targetDateIso, baseDay);
  return { isFree: true, occupyingClass: null, nextClass: null };
}

// Global exports for inline handlers & backward compatibility
if (typeof window !== "undefined") {
  window.openTeacherSchedule = (t) => window.CrossRef?.UI?.openTeacher(t);
  window.openRoomSchedule = (r) => window.CrossRef?.UI?.openRoom(r);
  window.openSubjectDetail = (s) => window.CrossRef?.UI?.openSubject(s);
  window.openFreeRoomsModal = (d, s) => window.CrossRef?.UI?.openFreeRooms({ dateISO: d, slot: s });
  window.getRoomOccupancyAt = getRoomOccupancyAt;
  window.closeCrossModal = () => window.CrossRef?.UI?.closeModal();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ACADEMIC_CALENDAR,
    formatDateISO,
    getMonday,
    isTeachingDay,
    getLessonMeetingInfo,
    getLessonProgress,
    getSafeGroupName,
    getRoomOccupancyAt,
    parsePlanInfo,
    updateCalendarNotice,
    renderSchedule,
    shouldShowChangelog,
    openChangelogModal,
    closeChangelogModal,
    checkChangelogNotification,
    state,
    elements
  };
}




