const assert = require("assert");
const fs = require("fs");
const ScheduleEngine = require("./web/js/schedule-engine.js");
const academicCalendarPath = fs.existsSync("./data/academic_calendar.json") ? "./data/academic_calendar.json" : "./academic_calendar.json";
const academicCalendar = require(academicCalendarPath);

// Domain engine instance
const engine = ScheduleEngine.create(academicCalendar);
const getLessonMeetingInfo = (...args) => engine.getLessonMeetingInfo(...args);
const getMonday = (...args) => engine.getMonday(...args);
const getRoomOccupancyAt = (...args) => engine.getRoomOccupancyAt(...args);
const isTeachingDay = (...args) => engine.isTeachingDay(...args);

// UI helpers and state from app.js
const { getSafeGroupName, parsePlanInfo, getAcademicInfoForWeek, updateCalendarNotice, renderSchedule, renderLessonCard, shouldShowChangelog, openChangelogModal, closeChangelogModal, comparePlans, getPlanSortKey, populatePlanSelect, onStudyModeChange, state, elements } = require("./web/app.js");

console.log("\n🧪 Running Calendar Engine TDD Tests...\n");

// --- TEST 1: Twardy koniec semestru (Przedmiot poniedziałkowy w sesji egzaminacyjnej) ---
console.log("-- Test 1: Twardy koniec semestru dla przedmiotu poniedziałkowego");

const lessonMonday = {
  przedmiot: "Fizyka",
  data_start: "2026-11-30", // Poniedziałek, 2. połowa semestru
  polowa_sem: 2,
  tygodnie: 8,
  co_ile: 1
};

// Data: 8 lutego 2027 (Poniedziałek podczas sesji egzaminacyjnej 02.02 - 08.02.2027)
// W semestrze zimowym 01.02 to ostatni dzień zajęć dydaktycznych (15. poniedziałek w związku z zamianą dnia z 04.01)
const examMondayDate = "2027-02-08";
const examMonday = getMonday(new Date(2027, 1, 8)); // 2027-02-08

const result = getLessonMeetingInfo(lessonMonday, "PON", examMonday, examMondayDate);

console.log("Wynik dla 2027-02-08:", result);


try {
  assert.strictEqual(
    result.active,
    false,
    `Oczekiwano active = false w czasie sesji egzaminacyjnej, a otrzymano active = ${result.active} (meetingNum: ${result.meetingNum}/${result.total})`
  );
  console.log("✅ [PASS] Zajęcia w sesji są prawidłowo nieaktywne.");
} catch (err) {
  console.error("❌ [FAIL]", err.message);
  process.exit(1);
}

// --- TEST 2: Święto (11.11) i zamiana dnia (13.11 Pt jako Śr) ---
console.log("\n-- Test 2: Święto 11.11 jest nieaktywne, a zamiana 13.11 realizuje kolejne spotkanie (04.11 = 5, 13.11 = 6)");

const lessonWed = {
  przedmiot: "Matematyka",
  data_start: "2026-10-07", // Środa
  tygodnie: 15,
  co_ile: 1
};

// 1. Środa 04.11.2026 -> powinno być 5. spotkanie
const mon04 = getMonday(new Date(2026, 10, 4));
const res04 = getLessonMeetingInfo(lessonWed, "ŚR", mon04, "2026-11-04");
console.log("04.11 (Śr przed świętem):", res04);
assert.strictEqual(res04.meetingNum, 5, `04.11 powinno być spotkanie 5, a jest: ${res04.meetingNum}`);

// 2. Środa 11.11.2026 (Święto Niepodległości) -> zajęcia nieaktywne
const mon11 = getMonday(new Date(2026, 10, 11));
const res11 = getLessonMeetingInfo(lessonWed, "ŚR", mon11, "2026-11-11");
console.log("11.11 (Święto Niepodległości):", res11);
assert.strictEqual(res11.active, false, `11.11 powinno być active = false`);

// 3. Piątek 13.11.2026 (zamiana rektorska na środę) -> 6. spotkanie!
const res13 = getLessonMeetingInfo(lessonWed, "ŚR", mon11, "2026-11-13");
console.log("13.11 (Piątek realizujący środę):", res13);
assert.strictEqual(res13.active, true, `13.11 powinno być active = true`);
assert.strictEqual(res13.meetingNum, 6, `13.11 powinno być spotkanie 6, a jest: ${res13.meetingNum}`);

// 4. Środa 18.11.2026 -> 7. spotkanie
const mon18 = getMonday(new Date(2026, 10, 18));
const res18 = getLessonMeetingInfo(lessonWed, "ŚR", mon18, "2026-11-18");
console.log("18.11 (Śr po święcie i zamianie):", res18);

try {
  assert.strictEqual(
    res18.meetingNum,
    7,
    `18.11 powinno być 7. fizyczne spotkanie, a system zwrócił: ${res18.meetingNum}`
  );
  console.log("✅ [PASS] Licznik spotkań prawidłowo uwzględnia dzień wolny i zamianę dnia.");
} catch (err) {
  console.error("❌ [FAIL]", err.message);
  process.exit(1);
}

// --- TEST 3: Zamiana dnia (Piątek 13.11 jako Środa): realizacja zajęć w dniu zamiany ---
console.log("\n-- Test 3: Zamiana dnia (Piątek 13.11 jako Środa): realizacja zajęć w dniu zamiany");

const resSwap13 = getLessonMeetingInfo(lessonWed, "ŚR", mon11, "2026-11-13");
console.log("13.11 (Piątek realizujący środę):", resSwap13);

try {
  assert.strictEqual(resSwap13.active, true, "13.11 zajęcia ze środy powinny być aktywne");
  assert.strictEqual(
    resSwap13.meetingNum,
    res04.meetingNum + 1,
    `13.11 powinno być kolejne spotkanie (${res04.meetingNum + 1}), a otrzymano: ${resSwap13.meetingNum}`
  );
  console.log(`✅ [PASS] Prawidłowo zrealizowano spotkanie ze środy w dniu zamiany 13.11 (spotkanie ${resSwap13.meetingNum}).`);
} catch (err) {
  console.error("❌ [FAIL]", err.message);
  process.exit(1);
}

// --- TEST 4: Przedmiot z 1. połowy semestru (7 spotkań) z uwzględnieniem świąt i zamiany ---
console.log("\n-- Test 4: Przedmiot 1. połowy semestru (7 spotkań) kończy się na 18.11 dzięki zamianie 13.11");

const lessonHalf1 = {
  przedmiot: "BHP",
  data_start: "2026-10-07", // Środa
  polowa_sem: 1,
  tygodnie: 7,
  co_ile: 1
};

// 1. Piątek 13.11.2026 -> 6. spotkanie BHP (zamiana za 11.11)
const resHalf1_13 = getLessonMeetingInfo(lessonHalf1, "ŚR", mon11, "2026-11-13");
console.log("13.11 (Pt - 6. spotkanie BHP z zamiany):", resHalf1_13);
assert.strictEqual(resHalf1_13.active, true, "13.11 BHP powinno być aktywne");
assert.strictEqual(resHalf1_13.meetingNum, 6, "13.11 BHP to 6. spotkanie");

// 2. Środa 18.11.2026 -> 7. spotkanie (ostatnie!)
const resHalf1_18 = getLessonMeetingInfo(lessonHalf1, "ŚR", mon18, "2026-11-18");
console.log("18.11 (Śr - 7. spotkanie BHP, ostatnie):", resHalf1_18);
assert.strictEqual(resHalf1_18.active, true, "18.11 BHP powinno być aktywne");
assert.strictEqual(resHalf1_18.meetingNum, 7, "18.11 BHP to 7. spotkanie");

// 3. Środa 25.11.2026 -> BHP zakończone (active = false)
const mon25 = getMonday(new Date(2026, 10, 25));
const resHalf1_25 = getLessonMeetingInfo(lessonHalf1, "ŚR", mon25, "2026-11-25");
console.log("25.11 (Śr po zakończeniu BHP):", resHalf1_25);

try {
  assert.strictEqual(resHalf1_25.active, false, "25.11 BHP powinno być nieaktywne (zakończyło 7 spotkań)");
  console.log("✅ [PASS] Przedmiot z 1. połowy semestru zrealizował dokładnie 7 fizycznych spotkań.");
} catch (err) {
  console.error("❌ [FAIL]", err.message);
  process.exit(1);
}

// --- TEST 5: Przedmiot co 2 tygodnie (cykl nieparzysty, od 1. tyg, 5 spotkań) ---
console.log("\n-- Test 5: Przedmiot co 2 tygodnie (aktywny tylko w swoich tygodniach i kończy się po 5 spotkaniach)");

const lessonBi = {
  przedmiot: "Nawigacja",
  data_start: "2026-10-07", // Środa, 1. tydzień semestru
  co_ile: 2,
  od_tyg: 1,
  tygodnie: 5
};

// 1. Tydzień 1 (07.10) -> aktywne, spotkanie 1
const mon07 = getMonday(new Date(2026, 9, 7));
const resBi_07 = getLessonMeetingInfo(lessonBi, "ŚR", mon07, "2026-10-07");
console.log("07.10 (Tydzień 1, spotkanie 1):", resBi_07);
assert.strictEqual(resBi_07.active, true);
assert.strictEqual(resBi_07.meetingNum, 1);

// 2. Tydzień 2 (14.10) -> tydzień przerwy (nieaktywne dla grupy od 1. tyg)
const mon14 = getMonday(new Date(2026, 9, 14));
const resBi_14 = getLessonMeetingInfo(lessonBi, "ŚR", mon14, "2026-10-14");
console.log("14.10 (Tydzień 2, tydzień wolny od przedmiotu):", resBi_14);
assert.strictEqual(resBi_14.active, false, "14.10 powinien być nieaktywny dla cyklu od 1. tyg");

// 3. Tydzień 9 (02.12) -> aktywne, spotkanie 5 (ostatnie!)
const mon02Dec = getMonday(new Date(2026, 11, 2));
const resBi_02Dec = getLessonMeetingInfo(lessonBi, "ŚR", mon02Dec, "2026-12-02");
console.log("02.12 (Tydzień 9, spotkanie 5 - ostatnie):", resBi_02Dec);
assert.strictEqual(resBi_02Dec.active, true);
assert.strictEqual(resBi_02Dec.meetingNum, 5);

// 4. Tydzień 11 (16.12) -> zakończone (active = false)
const monDec = getMonday(new Date(2026, 11, 16));
const resBi_16Dec = getLessonMeetingInfo(lessonBi, "ŚR", monDec, "2026-12-16");
console.log("16.12 (Tydzień 11, po zrealizowaniu 5 spotkań):", resBi_16Dec);

try {
  assert.strictEqual(resBi_16Dec.active, false, "16.12 powinien być nieaktywny (zakończono 5 spotkań)");
  console.log("✅ [PASS] Przedmiot co 2 tygodnie zachowuje właściwy rytm i kończy się po 5 spotkaniach.");
} catch (err) {
  console.error("❌ [FAIL]", err.message);
  process.exit(1);
}

// --- TEST 6: Przedmiot co 2 tygodnie (cykl parzysty): 11.11 to święto, ale 13.11 realizuje spotkanie 3 w ramach zamiany dnia ---
console.log("\n-- Test 6: Przedmiot co 2 tygodnie (cykl parzysty): 11.11 to święto, ale 13.11 realizuje spotkanie 3 w ramach zamiany dnia");

const lessonBiWithHoliday = {
  przedmiot: "Łączność Morska",
  data_start: "2026-10-14", // Środa, 2. tydzień semestru
  co_ile: 2,
  od_tyg: 2,
  tygodnie: 5
};

// 1. Tydzień 2 (14.10) -> Spotkanie 1
const resBiH_14 = getLessonMeetingInfo(lessonBiWithHoliday, "ŚR", mon14, "2026-10-14");
console.log("14.10 (Tydz 2 - Spotkanie 1):", resBiH_14);
assert.strictEqual(resBiH_14.active, true);
assert.strictEqual(resBiH_14.meetingNum, 1);

// 2. Tydzień 4 (28.10) -> Spotkanie 2
const mon28 = getMonday(new Date(2026, 9, 28));
const resBiH_28 = getLessonMeetingInfo(lessonBiWithHoliday, "ŚR", mon28, "2026-10-28");
console.log("28.10 (Tydz 4 - Spotkanie 2):", resBiH_28);
assert.strictEqual(resBiH_28.active, true);
assert.strictEqual(resBiH_28.meetingNum, 2);

// 3. Tydzień 6 (11.11 - Święto Niepodległości): termin grupy, ale jest święto!
const resBiH_11 = getLessonMeetingInfo(lessonBiWithHoliday, "ŚR", mon11, "2026-11-11");
console.log("11.11 (Tydz 6 - Święto Niepodległości):", resBiH_11);
assert.strictEqual(resBiH_11.active, false, "11.11 zajęcia nie mogą się odbyć (Święto)");

// 4. Tydzień 6 (13.11 - Piątek realizujący środę): realizacja spotkania 3!
const resBiH_13 = getLessonMeetingInfo(lessonBiWithHoliday, "ŚR", mon11, "2026-11-13");
console.log("13.11 (Tydz 6 - Piątek realizujący środę):", resBiH_13);
assert.strictEqual(resBiH_13.active, true, "13.11 zajęcia powinny się odbyć");
assert.strictEqual(resBiH_13.meetingNum, 3, "13.11 to 3. spotkanie");

// 5. Tydzień 7 (18.11 - Tydzień grupy przeciwnej): wolne od tego przedmiotu
const resBiH_18 = getLessonMeetingInfo(lessonBiWithHoliday, "ŚR", mon18, "2026-11-18");
console.log("18.11 (Tydz 7 - Tydzień grupy przeciwnej):", resBiH_18);
assert.strictEqual(resBiH_18.active, false, "18.11 powinno być nieaktywne dla grupy z parzystego cyklu");
assert.strictEqual(resBiH_18.meetingNum, 3, `18.11 powinno wskazywać 3 dotychczas odbyte spotkania, a jest: ${resBiH_18.meetingNum}`);

// 6. Tydzień 8 (25.11 - Kolejny termin grupy): spotkanie 4!
const resBiH_25 = getLessonMeetingInfo(lessonBiWithHoliday, "ŚR", mon25, "2026-11-25");
console.log("25.11 (Tydz 8 - Spotkanie 4):", resBiH_25);
try {
  assert.strictEqual(resBiH_25.active, true, "25.11 zajęcia powinny się odbyć");
  assert.strictEqual(
    resBiH_25.meetingNum,
    4,
    `25.11 powinno być 4. spotkanie, a jest: ${resBiH_25.meetingNum}`
  );
  console.log("✅ [PASS] Przedmiot co 2 tygodnie po święcie i zamianie prawidłowo realizuje kolejne spotkanie.");
} catch (err) {
  console.error("❌ [FAIL]", err.message);
  process.exit(1);
}

// --- TEST 7: Zamiana dnia w parze ze świętem (Styczeń: 04.01 jako Środa, 06.01 Trzech Króli) ---
console.log("\n-- Test 7: Zamiana dnia w parze ze świętem (04.01 realizuje środę, 06.01 to święto)");

const lessonMondaySem = {
  przedmiot: "Fizyka",
  data_start: "2026-10-05", // Poniedziałek
  tygodnie: 15,
  co_ile: 1
};

// 1. Poniedziałek 04.01.2027 -> obowiązuje plan ze ŚRODY!
// Przedmiot ŚRODOWY (Matematyka) musi być AKTYWNY w poniedziałek 04.01:
const monJan04 = getMonday(new Date(2027, 0, 4)); // 2027-01-04
const resWedOnMon = getLessonMeetingInfo(lessonWed, "ŚR", monJan04, "2027-01-04");
console.log("04.01 (Przedmiot środowy w zamieniony poniedziałek):", resWedOnMon);
assert.strictEqual(resWedOnMon.active, true, "04.01 przedmiot środowy powinien być aktywny");

// Przedmiot PONIEDZIAŁKOWY (Fizyka) musi być NIEAKTYWNY w poniedziałek 04.01:
const resMonOnMon = getLessonMeetingInfo(lessonMondaySem, "PON", monJan04, "2027-01-04");
console.log("04.01 (Przedmiot poniedziałkowy w zamieniony poniedziałek):", resMonOnMon);
assert.strictEqual(resMonOnMon.active, false, "04.01 przedmiot poniedziałkowy musi być nieaktywny (obowiązuje środa)");

// 2. Środa 06.01.2027 -> Święto Trzech Króli (dzień wolny)
const resWedOnWed06 = getLessonMeetingInfo(lessonWed, "ŚR", monJan04, "2027-01-06");
console.log("06.01 (Przedmiot środowy w Święto Trzech Króli):", resWedOnWed06);
assert.strictEqual(resWedOnWed06.active, false, "06.01 nie może być zajęć (Święto Trzech Króli)");

// 3. Sprawdzenie maja: Wtorek 25.05 (zajęcia z piątku), Piątek 28.05 (dzień wolny)
const lessonFridaySem = {
  przedmiot: "Automatyka",
  data_start: "2027-02-26", // Piątek w semestrze letnim
  tygodnie: 15,
  co_ile: 1
};
const lessonTuesdaySem = {
  przedmiot: "Chemia",
  data_start: "2027-02-23", // Wtorek w semestrze letnim
  tygodnie: 15,
  co_ile: 1
};
const monMay24 = getMonday(new Date(2027, 4, 25)); // 2027-05-24

// Wtorek 25.05 -> zajęcia piątkowe aktywne, wtorkowe nieaktywne
const resFriOnTue = getLessonMeetingInfo(lessonFridaySem, "PT", monMay24, "2027-05-25");
const resTueOnTue = getLessonMeetingInfo(lessonTuesdaySem, "WT", monMay24, "2027-05-25");
console.log("25.05 (Przedmiot piątkowy we wtorek):", resFriOnTue);
console.log("25.05 (Przedmiot wtorkowy we wtorek):", resTueOnTue);
assert.strictEqual(resFriOnTue.active, true, "25.05 przedmiot piątkowy powinien być aktywny");
assert.strictEqual(resTueOnTue.active, false, "25.05 przedmiot wtorkowy powinien być nieaktywny");

// Piątek 28.05 -> dzień wolny od zajęć
const resFriOnFri = getLessonMeetingInfo(lessonFridaySem, "PT", monMay24, "2027-05-28");
console.log("28.05 (Przedmiot piątkowy w dzień wolny):", resFriOnFri);
assert.strictEqual(resFriOnFri.active, false, "28.05 dzień wolny od zajęć");

console.log("✅ [PASS] Tydzień zamiany ze świętem działa w 100% precyzyjnie zarówno dla stycznia, jak i maja.");

// --- TEST 8: Wielkanoc i odrabianie poniedziałku (Środa 31.03 realizuje Poniedziałek) ---
console.log("\n-- Test 8: Przerwa wielkanocna i odrabianie poniedziałku (31.03 środa realizuje poniedziałek)");

const lessonMondaySummer = {
  przedmiot: "Fizyka Morza",
  data_start: "2027-02-22", // Poniedziałek, start semestru letniego
  tygodnie: 15,
  co_ile: 1
};
const lessonWednesdaySummer = {
  przedmiot: "Matematyka Dyskretna",
  data_start: "2027-02-24", // Środa, semestr letni
  tygodnie: 15,
  co_ile: 1
};

const monEaster = getMonday(new Date(2027, 2, 29)); // 2027-03-29

// 1. Poniedziałek Wielkanocny 29.03 -> w trakcie przerwy wielkanocnej (brak zajęć)
const resEasterMon = getLessonMeetingInfo(lessonMondaySummer, "PON", monEaster, "2027-03-29");
console.log("29.03 (Poniedziałek Wielkanocny):", resEasterMon);
assert.strictEqual(resEasterMon.active, false, "29.03 Poniedziałek Wielkanocny musi być wolny");

// 2. Środa 31.03 -> odrabianie poniedziałku!
// Przedmiot poniedziałkowy w środę 31.03:
const resEasterMonOnWed = getLessonMeetingInfo(lessonMondaySummer, "PON", monEaster, "2027-03-31");
console.log("31.03 (Przedmiot poniedziałkowy w odrabianą środę):", resEasterMonOnWed);
assert.strictEqual(resEasterMonOnWed.active, true, "31.03 przedmiot poniedziałkowy powinien być aktywny");

// Przedmiot środowy w środę 31.03:
const resEasterWedOnWed = getLessonMeetingInfo(lessonWednesdaySummer, "ŚR", monEaster, "2027-03-31");
console.log("31.03 (Przedmiot środowy w środę zastąpioną poniedziałkiem):", resEasterWedOnWed);
assert.strictEqual(resEasterWedOnWed.active, false, "31.03 przedmiot środowy musi być nieaktywny (obowiązuje poniedziałek)");

console.log("✅ [PASS] Przerwa wielkanocna i odrabianie poniedziałku w środę 31.03 działają prawidłowo.");

// --- TEST 9: Przedmiot modułowy / szkolenie zaczynające się w trakcie semestru ---
console.log("\n-- Test 9: Przedmiot o nietypowej dacie startu (moduł 3-tygodniowy od 1 grudnia 2026)");

const lessonModular = {
  przedmiot: "Szkolenie Bezpieczeństwa STCW",
  data_start: "2026-12-01", // Wtorek, grudzień
  tygodnie: 3,
  co_ile: 1
};

// 1. Październik (przed datą startu) -> nieaktywne, meetingNum = 0
const monOct12 = getMonday(new Date(2026, 9, 13));
const resModOct = getLessonMeetingInfo(lessonModular, "WT", monOct12, "2026-10-13");
console.log("13.10 (Przed datą startu modułu):", resModOct);
assert.strictEqual(resModOct.active, false, "Przed datą startu moduł musi być nieaktywny");
assert.strictEqual(resModOct.meetingNum, 0, "Przed datą startu meetingNum musi być 0");

// 2. 01.12 (1. spotkanie modułu)
const monDec01 = getMonday(new Date(2026, 11, 1));
const resModDec01 = getLessonMeetingInfo(lessonModular, "WT", monDec01, "2026-12-01");
console.log("01.12 (Spotkanie 1/3):", resModDec01);
assert.strictEqual(resModDec01.active, true);
assert.strictEqual(resModDec01.meetingNum, 1);

// 3. 15.12 (3. spotkanie modułu - ostatnie!)
const monDec15 = getMonday(new Date(2026, 11, 15));
const resModDec15 = getLessonMeetingInfo(lessonModular, "WT", monDec15, "2026-12-15");
console.log("15.12 (Spotkanie 3/3 - ostatnie):", resModDec15);
assert.strictEqual(resModDec15.active, true);
assert.strictEqual(resModDec15.meetingNum, 3);

// 4. 12.01 (Styczeń, po zrealizowaniu 3 spotkań) -> nieaktywne!
const monJan11 = getMonday(new Date(2027, 0, 12));
const resModJan = getLessonMeetingInfo(lessonModular, "WT", monJan11, "2027-01-12");
console.log("12.01 (Po zrealizowaniu 3 spotkań modułu):", resModJan);
assert.strictEqual(resModJan.active, false, "Po zrealizowaniu puli moduł musi być nieaktywny");

console.log("✅ [PASS] Przedmiot modułowy o nietypowej dacie startu działa w 100% poprawnie.");

// --- TEST 10: Przedmiot co 2 tygodnie w tygodniu zamiany dnia (04.01 poniedziałek jako środa) ---
console.log("\n-- Test 10: Zajęcia co 2 tygodnie w tygodniu z zamianą dnia (04.01 jako Środa)");

const lessonBiCycle1 = {
  przedmiot: "Nawigacja (Nieparzyste)",
  data_start: "2026-10-07", // Tydzień 1, cykl nieparzysty
  co_ile: 2,
  od_tyg: 1,
  tygodnie: 8
};

const lessonBiCycle2 = {
  przedmiot: "Łączność (Parzyste)",
  data_start: "2026-10-14", // Tydzień 2, cykl parzysty
  co_ile: 2,
  od_tyg: 2,
  tygodnie: 8
};

// 04.01.2027 (Poniedziałek ze środowym planem) to 14. tydzień kalendarzowy (parzysty):
// 1. Grupa z cyklu parzystego (od_tyg = 2) POWINNA mieć zajęcia w poniedziałek 04.01:
const resBi2_Jan04 = getLessonMeetingInfo(lessonBiCycle2, "ŚR", monJan04, "2027-01-04");
console.log("04.01 (Grupa parzysta w zamieniony poniedziałek):", resBi2_Jan04);
assert.strictEqual(resBi2_Jan04.active, true, "Grupa z cyklu parzystego powinna mieć zajęcia 04.01");

// 2. Grupa z cyklu nieparzystego (od_tyg = 1) NIE POWINNA mieć zajęć w 14. tygodniu:
const resBi1_Jan04 = getLessonMeetingInfo(lessonBiCycle1, "ŚR", monJan04, "2027-01-04");
console.log("04.01 (Grupa nieparzysta w zamieniony poniedziałek):", resBi1_Jan04);
assert.strictEqual(resBi1_Jan04.active, false, "Grupa z cyklu nieparzystego nie ma zajęć w parzystym tygodniu 14");

// 3. 06.01.2027 (Święto Trzech Króli) -> obie grupy mają wolne:
const resBi2_Jan06 = getLessonMeetingInfo(lessonBiCycle2, "ŚR", monJan04, "2027-01-06");
console.log("06.01 (Grupa parzysta w Trzech Króli):", resBi2_Jan06);
assert.strictEqual(resBi2_Jan06.active, false, "W Święto Trzech Króli zajęcia nie mogą się odbyć");

console.log("✅ [PASS] Przedmioty co 2 tygodnie precyzyjnie respektują swój cykl parzystości podczas zamian dni.");

// --- TEST 11: Format licznika w UI (x/y oraz 'Ostatnie zajęcia') ---
console.log("\n-- Test 11: Format licznika spotkań w UI (x/y oraz 'Ostatnie zajęcia')");
const { getLessonProgress } = require("./web/app.js");

// 1. Zwykłe spotkanie w trakcie cyklu (np. 6. z 7 spotkań BHP w zamieniony piątek 13.11)
const prog6 = getLessonProgress(lessonHalf1, "ŚR", mon11, "2026-11-13");
console.log("Postęp BHP dla spotkania 6/7:", prog6);
assert.strictEqual(prog6.text, "6/7", `Oczekiwano tekstu '6/7', a otrzymano: ${prog6.text}`);
assert.strictEqual(prog6.isFinal, false);

// 2. Ostatnie spotkanie w cyklu (7. z 7 spotkań BHP w środę 18.11) -> powinno wyświetlać 'Ostatnie zajęcia'
const prog7 = getLessonProgress(lessonHalf1, "ŚR", mon18, "2026-11-18");
console.log("Postęp BHP dla spotkania 7/7 (ostatnie):", prog7);
assert.strictEqual(prog7.text, "Ostatnie zajęcia", `Oczekiwano 'Ostatnie zajęcia', a otrzymano: ${prog7.text}`);
assert.strictEqual(prog7.isFinal, true);

// 3. Przedmiot pełnosemestralny (np. 11. spotkanie z 15) -> '11/15'
const prog11 = getLessonProgress(lessonWed, "ŚR", monDec, "2026-12-16");
console.log("Postęp Matematyki 11/15:", prog11);
assert.strictEqual(prog11.text, "11/15", `Oczekiwano '11/15', a otrzymano: ${prog11.text}`);
assert.strictEqual(prog11.isFinal, false);

console.log("✅ [PASS] Format licznika w UI wyświetla czyste 'x/y' oraz wyróżnia 'Ostatnie zajęcia'.");

// --- TEST 12: Bezpieczne mapowanie nazw grup na pliki JSON i ICS ---
console.log("\n-- Test 12: getSafeGroupName - bezpieczne mapowanie nazw grup z kropkami i spacjami");
assert.strictEqual(getSafeGroupName("GR.01"), "GR_01");
assert.strictEqual(getSafeGroupName("1 TM"), "1_TM");
assert.strictEqual(getSafeGroupName("1/2 M"), "1_2_M");
assert.strictEqual(getSafeGroupName("GR-1"), "GR-1");
console.log("✅ [PASS] getSafeGroupName poprawnie mapuje kropki, spacje i ukośniki.");

// --- TEST 13: Granice semestralne (przedmiot zimowy nie może odbyć się w semestrze letnim i odwrotnie) ---
console.log("\n-- Test 13: Granice semestralne (przedmiot zimowy nie może odbyć się w semestrze letnim i odwrotnie)");

// 1. Przedmiot z semestru zimowego (np. sem. 1 lub data_start w semestrze zimowym 2026-12-02)
const lessonWinterCourse = {
  przedmiot: "Nawigacja Techniczna",
  data_start: "2026-12-02", // Grudzień (semestr zimowy)
  tygodnie: 10,
  co_ile: 1
};

// Środa 24 lutego 2027 (1. tydzień semestru letniego, po przerwie międzysemestralnej)
const monFeb22 = getMonday(new Date(2027, 1, 24)); // 2027-02-22
const resWinterInSummer = getLessonMeetingInfo(lessonWinterCourse, "ŚR", monFeb22, "2027-02-24");
console.log("Przedmiot zimowy w semestrze letnim (24.02.2027):", resWinterInSummer);

try {
  assert.strictEqual(
    resWinterInSummer.active,
    false,
    `Przedmiot z semestru zimowego NIE MOŻE być aktywny w semestrze letnim (po przerwie międzysemestralnej), a otrzymano active = ${resWinterInSummer.active}`
  );
} catch (err) {
  console.error("❌ [FAIL]", err.message);
  process.exit(1);
}

// 2. Przedmiot z semestru letniego (data_start w semestrze letnim 2027-02-24)
const lessonSummerCourse = {
  przedmiot: "Meteorologia Morska",
  data_start: "2027-02-24", // Semestr letni
  tygodnie: 15,
  co_ile: 1
};

// Środa 16 grudnia 2026 (semestr zimowy, przed przerwą międzysemestralną)
const resSummerInWinter = getLessonMeetingInfo(lessonSummerCourse, "ŚR", monDec, "2026-12-16");
console.log("Przedmiot letni w semestrze zimowym (16.12.2026):", resSummerInWinter);

try {
  assert.strictEqual(
    resSummerInWinter.active,
    false,
    `Przedmiot z semestru letniego NIE MOŻE być aktywny w semestrze zimowym (przed przerwą międzysemestralną), a otrzymano active = ${resSummerInWinter.active}`
  );
  console.log("✅ [PASS] Granice semestralne są ściśle przestrzegane.");
} catch (err) {
  console.error("❌ [FAIL]", err.message);
  process.exit(1);
}

// --- TEST 14: Odporność na nieprawidłowy baseDay ("Inny") ---
console.log("\n-- Test 14: Odporność na nieprawidłowy baseDay (np. 'Inny')");
const testLessonInny = {
  przedmiot: "Projekt Zespołowy",
  data_start: "2026-10-05",
  tygodnie: 15,
  co_ile: 1
};
const monOct = getMonday(new Date(2026, 9, 5));
const resInny = getLessonMeetingInfo(testLessonInny, "Inny", monOct, "2026-10-05");
console.log("Wynik dla baseDay = 'Inny':", resInny);
try {
  assert.ok(resInny && typeof resInny.active === "boolean");
  console.log("✅ [PASS] getLessonMeetingInfo bezpiecznie i natychmiast obsługuje nieobsługiwany dzień.");
} catch (err) {
  console.error("❌ [FAIL]", err.message);
  process.exit(1);
}

// --- TEST 15: Ciągłość kalendarza (brak luki między semestrem zimowym a sesją egzaminacyjną) ---
console.log("\n-- Test 15: Brak luki między semestrem zimowym (koniec 31.01) a sesją (początek 01.02)");
const lessonWeekend = {
  przedmiot: "Ćwiczenia Morskie",
  data_start: "2026-10-03", // Sobota
  tygodnie: 15,
  co_ile: 1
};
const monEndJan = getMonday(new Date(2027, 0, 30));
const resJan30 = getLessonMeetingInfo(lessonWeekend, "SOB", monEndJan, "2027-01-30");
console.log("Wynik dla 2027-01-30 (sobota przed sesją):", resJan30);
try {
  assert.strictEqual(
    resJan30.active,
    true,
    "Data 2027-01-30 musi mieścić się w semestrze zimowym (brak 2-dniowej luki przed sesją 01.02)"
  );
  console.log("✅ [PASS] Semestr zimowy poprawnie obejmuje 30-31 stycznia, zamykając lukę przed sesją.");
} catch (err) {
  console.error("❌ [FAIL]", err.message);
  process.exit(1);
}

// --- TEST 16: Dostępność sal z uwzględnieniem dat, świąt i modułów (getRoomOccupancyAt) ---
console.log("\n-- Test 16: getRoomOccupancyAt poprawnie zwalnia salę po zakończeniu modułu i w święta");

const bhpClass = {
  subject: "BHP",
  hours: "10:15 - 11:45",
  data_start: "2026-10-07",
  weeks: 7,
  polowa_sem: 1,
  co_ile: 1
};

const fullSemesterClass = {
  subject: "Matematyka",
  hours: "12:15 - 13:45",
  data_start: "2026-10-07",
  weeks: 15,
  co_ile: 1
};

const daySchedule = [bhpClass, fullSemesterClass];

// 1. W trakcie trwania modułu (07.10.2026, 10:30) -> sala zajęta przez BHP
const queryBhp = { start: 10 * 60 + 30, end: 10 * 60 + 31 }; // 10:30
const resOct07 = getRoomOccupancyAt(daySchedule, queryBhp, "2026-10-07", "ŚR");
console.log("Wynik 07.10 (BHP w trakcie):", resOct07);
assert.strictEqual(resOct07.isFree, false, "Sala powinna być zajęta przez BHP w dniu 07.10");
assert.strictEqual(resOct07.occupyingClass.subject, "BHP");

// 2. Po zakończeniu modułu 7 spotkań (02.12.2026, 10:30) -> sala WOLNA
const resDec02 = getRoomOccupancyAt(daySchedule, queryBhp, "2026-12-02", "ŚR");
console.log("Wynik 02.12 (po zakończeniu BHP):", resDec02);
assert.strictEqual(resDec02.isFree, true, "Sala powinna być wolna po zakończeniu 7 spotkań BHP");
assert.strictEqual(resDec02.occupyingClass, null);

// 3. W święto 11.11.2026 (12:30, normalnie Matematyka) -> sala WOLNA
const queryMath = { start: 12 * 60 + 30, end: 12 * 60 + 31 }; // 12:30
const resNov11 = getRoomOccupancyAt(daySchedule, queryMath, "2026-11-11", "ŚR");
console.log("Wynik 11.11 (Święto Niepodległości):", resNov11);
assert.strictEqual(resNov11.isFree, true, "Sala powinna być wolna w święto państwowe 11.11");

// 4. Sala z dwoma grupami naprzemiennymi co 2 tygodnie
const altClassA = {
  subject: "Fizyka (Gr 1)",
  hours: "08:00 - 09:30",
  data_start: "2026-10-07", // Tydzień 1
  weeks: 8,
  co_ile: 2
};
const altClassB = {
  subject: "Chemia (Gr 2)",
  hours: "08:00 - 09:30",
  data_start: "2026-10-14", // Tydzień 2
  weeks: 7,
  co_ile: 2
};
const alternatingSchedule = [altClassA, altClassB];
const queryMorning = { start: 8 * 60 + 30, end: 8 * 60 + 31 }; // 08:30

// 07.10 (Tydzień 1) -> zajęte przez Fizykę (Gr 1)
const resAltOct07 = getRoomOccupancyAt(alternatingSchedule, queryMorning, "2026-10-07", "ŚR");
console.log("Wynik 07.10 (Tydz 1, naprzemiennie):", resAltOct07);
assert.strictEqual(resAltOct07.isFree, false);
assert.strictEqual(resAltOct07.occupyingClass.subject, "Fizyka (Gr 1)");

// 14.10 (Tydzień 2) -> zajęte przez Chemię (Gr 2)
const resAltOct14 = getRoomOccupancyAt(alternatingSchedule, queryMorning, "2026-10-14", "ŚR");
console.log("Wynik 14.10 (Tydz 2, naprzemiennie):", resAltOct14);
assert.strictEqual(resAltOct14.isFree, false);
assert.strictEqual(resAltOct14.occupyingClass.subject, "Chemia (Gr 2)");

// 5. Sala z pojedynczym przedmiotem co 2 tygodnie (brak grupy na zmianę)
const singleAltSchedule = [altClassA]; // Tylko Gr 1 co 2 tyg
// 14.10 (Tydzień 2 - off-week dla Gr 1) -> sala WOLNA
const resSingleOct14 = getRoomOccupancyAt(singleAltSchedule, queryMorning, "2026-10-14", "ŚR");
console.log("Wynik 14.10 (off-week pojedynczego przedmiotu co 2 tyg):", resSingleOct14);
assert.strictEqual(resSingleOct14.isFree, true, "Sala bez zajęć w danym tygodniu powinna być wolna");
assert.strictEqual(resSingleOct14.occupyingClass, null);

console.log("✅ [PASS] getRoomOccupancyAt prawidłowo weryfikuje dostępność sal (w tym cykle naprzemienne).");

// --- TEST 17: parsePlanInfo (oczyszczanie nazw planów, wersja i data publikacji) ---
console.log("\n-- Test 17: parsePlanInfo (oczyszczanie nazw planów, wersja i data)");

const rawPlan1 = "[TM Sem 1] Transport Morski pierwszego stopnia sem. 1 [2026-09-14 17:55] wer. 2";
const parsed1 = parsePlanInfo(rawPlan1);
console.log("Wynik dla planu 1:", parsed1);
assert.strictEqual(parsed1.cleanName, "Transport Morski sem. 1");
assert.strictEqual(parsed1.publishedAt, "2026-09-14 17:55");
assert.strictEqual(parsed1.version, "wer. 2");

const rawPlan2 = "Transport i Logistyka pierwszego stopnia sem. 1 [2026-09-15 19:52] wer. 1";
const parsed2 = parsePlanInfo(rawPlan2);
console.log("Wynik dla planu 2:", parsed2);
assert.strictEqual(parsed2.cleanName, "Transport i Logistyka sem. 1");
assert.strictEqual(parsed2.publishedAt, "2026-09-15 19:52");
assert.strictEqual(parsed2.version, "wer. 1");

const rawPlan3 = "Nawigacja drugiego stopnia sem. 2 [2026-09-14 12:00] wer. 3";
const parsed3 = parsePlanInfo(rawPlan3);
console.log("Wynik dla planu 3 (II stopień):", parsed3);
assert.strictEqual(parsed3.cleanName, "Nawigacja sem. 2 (II st.)");
assert.strictEqual(parsed3.publishedAt, "2026-09-14 12:00");
assert.strictEqual(parsed3.version, "wer. 3");
assert.strictEqual(parsed3.isSecondDegree, true);

console.log("✅ [PASS] parsePlanInfo precyzyjnie czyści nazwy planów i wyodrębnia wersję oraz datę publikacji.");

// --- TEST 18: updateCalendarNotice (filtracja alertów, dni zamienne vs wolne vs przerwy) ---
console.log("\n-- Test 18: updateCalendarNotice (dni zamienne, wykluczenie pojedynczych dni wolnych i ukrywanie w przerwach)");

const mockNoticeEl = {
  innerHTML: "",
  className: "",
  classList: {
    classes: new Set(["hidden"]),
    add(cls) { this.classes.add(cls); },
    remove(cls) { this.classes.delete(cls); },
    contains(cls) { return this.classes.has(cls); }
  }
};
elements.calendarNotice = mockNoticeEl;

// 1. Tydzień z dniem wolnym (11.11) i zamianą (13.11)
// Górny baner powinien zawierać TYLKO dzień zamienny, a NIE dzień wolny
const weekWithHolidayAndSwap = {
  periodType: "teaching",
  periodName: "Okres zajęć dydaktycznych",
  daySwaps: [{ replaceWith: "ŚR", note: "Piątek 13.11 – zajęcia ze środy" }],
  holidays: ["11.11 (Środa): Święto Niepodległości"]
};

updateCalendarNotice(weekWithHolidayAndSwap);
assert.strictEqual(mockNoticeEl.classList.contains("hidden"), false, "Baner powinien być widoczny dla dnia zamiennego");
assert.ok(mockNoticeEl.innerHTML.includes("Zamiana dnia"), "Powinien zawierać informację o zamianie dnia");
assert.ok(!mockNoticeEl.innerHTML.includes("Dzień wolny"), "NIE powinien powielać informacji o pojedynczym dniu wolnym");

// 2. Tydzień tylko z dniem wolnym (np. Wszystkich Świętych)
const weekOnlyHoliday = {
  periodType: "teaching",
  periodName: "Okres zajęć dydaktycznych",
  daySwaps: [],
  holidays: ["01.11 (Niedziela): Wszystkich Świętych"]
};

updateCalendarNotice(weekOnlyHoliday);
assert.strictEqual(mockNoticeEl.classList.contains("hidden"), true, "Baner powinien być ukryty, gdy są tylko pojedyncze dni wolne");
assert.strictEqual(mockNoticeEl.innerHTML, "", "Zawartość banera powinna być pusta");

// 3. Pełna przerwa (np. Zimowa przerwa świąteczna)
const weekBreak = {
  periodType: "break",
  periodName: "Zimowa przerwa świąteczna",
  daySwaps: [],
  holidays: ["24.12: Wigilia", "25.12: Boże Narodzenie"]
};

updateCalendarNotice(weekBreak);
assert.strictEqual(mockNoticeEl.classList.contains("hidden"), true, "Baner powinien być ukryty podczas pełnej przerwy dydaktycznej");

// 4. Komunikat krytyczny / ogłoszenie
const weekAnnouncement = {
  periodType: "teaching",
  periodName: "Okres zajęć dydaktycznych",
  daySwaps: [],
  holidays: [],
  announcements: ["Godziny rektorskie w dniu 15.10 od 12:00"]
};

updateCalendarNotice(weekAnnouncement);
assert.strictEqual(mockNoticeEl.classList.contains("hidden"), false, "Baner powinien być widoczny dla ogłoszeń administracyjnych");
assert.ok(mockNoticeEl.innerHTML.includes("Komunikat:"), "Powinien wyświetlać komunikat krytyczny");

console.log("✅ [PASS] updateCalendarNotice poprawnie filtruje alerty i ukrywa baner w trakcie przerw.");

// --- TEST 19: renderSchedule - umiejscowienie plakietki zamiany dnia oraz karta święta ---
console.log("\n-- Test 19: renderSchedule - umiejscowienie plakietki zamiany dnia oraz karta święta");

const mockScheduleContent = {
  innerHTML: "",
  classList: {
    classes: new Set(),
    add(cls) { this.classes.add(cls); },
    remove(cls) { this.classes.delete(cls); },
    contains(cls) { return this.classes.has(cls); }
  }
};
elements.scheduleContent = mockScheduleContent;
elements.noClassesState = {
  classList: {
    classes: new Set(["hidden"]),
    add(cls) { this.classes.add(cls); },
    remove(cls) { this.classes.delete(cls); },
    contains(cls) { return this.classes.has(cls); }
  }
};
elements.dayTabs = {
  innerHTML: "",
  querySelectorAll() { return []; },
  querySelector() {
    return { classList: { add() {}, remove() {}, contains() { return false; } } };
  }
};

// Mock global document if not present
if (typeof document === "undefined") {
  global.document = {
    getElementById(id) {
      return { innerHTML: "", textContent: "", classList: { add() {}, remove() {}, contains() { return false; } } };
    },
    createElement(tag) {
      const el = { _text: "" };
      Object.defineProperty(el, "textContent", {
        set(val) {
          this._text = val;
          this.innerHTML = String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        },
        get() { return this._text; }
      });
      return el;
    }
  };
}

// Przygotuj dane planu dla widoku tygodnia z dniem zamiennym i świętem
state.scheduleData = {
  "ŚR": {
    "08:00": {
      przedmiot: "Matematyka",
      godziny: "08:00 - 09:30",
      sala: "201",
      prowadzacy: "Dr Kowalski",
      co_ile: 1,
      od_tyg: 1,
      tygodnie: 15,
      grupa: "1"
    }
  }
};
state.selectedDayTab = "ALL";
state.daysView = "workdays";
// 13.11.2026 to tydzień 6 (weekOffset = calculate from targetMonday)
// Monday 09.11.2026: Środa 11.11 święto, Piątek 13.11 zamiana na Środę
const testMonDate = new Date(2026, 10, 9);
const curMon = getMonday(new Date());
state.weekOffset = Math.round((testMonDate - curMon) / (7 * 86400000));

renderSchedule();

const renderedHtml = mockScheduleContent.innerHTML;

// 1. Sprawdź, czy święto renderuje się jako .lesson-card.holiday-card
assert.ok(
  renderedHtml.includes("lesson-card holiday-card"),
  "Święto (11.11) powinno być renderowane jako dedykowana karta .lesson-card.holiday-card"
);
assert.ok(
  renderedHtml.includes("holiday-card-icon") && renderedHtml.includes("Święto Niepodległości"),
  "Karta święta powinna zawierać ikonę oraz nazwę święta"
);

// 2. Sprawdź, czy widok tygodnia używa zmiennej CSS --grid-cols i czy plakietka zamiany dnia znajduje się w nagłówku dnia
assert.ok(
  renderedHtml.includes("schedule-week-grid") && renderedHtml.includes("--grid-cols:"),
  "Widok tygodnia powinien używać zmiennej CSS --grid-cols zamiast sztywnego grid-template-columns inline"
);
assert.ok(
  renderedHtml.includes("grid-day-header") && renderedHtml.includes("grid-day-swap-badge"),
  "Plakietka zamiany dnia powinna być osadzona wewnątrz nagłówka dnia w widoku tygodnia"
);
assert.ok(
  renderedHtml.includes("Plan z środy"),
  "Plakietka zamiany powinna wskazywać 'Plan z środy'"
);

// 3. Sprawdź widok pojedynczego dnia (single-day view)
state.selectedDayTab = "PT"; // Piątek z zamianą na środę
renderSchedule();

const renderedSingleDayHtml = mockScheduleContent.innerHTML;
assert.ok(
  renderedSingleDayHtml.includes("day-header") && renderedSingleDayHtml.includes("day-swap-badge"),
  "Plakietka zamiany dnia powinna być osadzona wewnątrz nagłówka .day-header w widoku pojedynczego dnia"
);
assert.ok(
  renderedSingleDayHtml.includes("Plan z środy"),
  "Plakietka zamiany w widoku pojedynczego dnia powinna wskazywać 'Plan z środy'"
);

console.log("✅ [PASS] renderSchedule poprawnie umieszcza plakietkę zamiany w nagłówku (mobile + desktop) i renderuje kartę święta.");

// ─── Test 20: Wolne sale — używają właściwego tygodnia z state.weekOffset ────
console.log("\n-- Test 20: getRoomOccupancyAt działa poprawnie dla tygodnia przesuniętego o weekOffset");

// BHP: aktywne w tygodniach 1-7 (7 spotkań co tydzień), data_start 2026-10-07 (środa)
// Tydzień 9 (środa 02.12.2026): BHP już zakończone — sala powinna być wolna
const bhpEntry = {
  subject: "BHP",
  hours: "10:15 - 11:45",
  data_start: "2026-10-07",
  weeks: 7,
  co_ile: 1,
  polowa_sem: 1
};

const targetDateWeek9 = new Date(2026, 11, 2); // 02.12.2026
const mondayWeek9 = getMonday(targetDateWeek9);
const occupancyAfterEnd = getRoomOccupancyAt([bhpEntry], { start: 615, end: 705 }, "2026-12-02", "ŚR");
assert.strictEqual(occupancyAfterEnd.isFree, true,
  "Sala powinna być wolna w tygodniu 9 — BHP skończyło się po 7 spotkaniach");
assert.strictEqual(occupancyAfterEnd.occupyingClass, null,
  "occupyingClass powinien być null po zakończeniu przedmiotu");

// Tydzień 1 (środa 07.10.2026): BHP aktywne — sala zajęta
const occupancyWeek1 = getRoomOccupancyAt([bhpEntry], { start: 615, end: 705 }, "2026-10-07", "ŚR");
assert.strictEqual(occupancyWeek1.isFree, false,
  "Sala powinna być zajęta w tygodniu 1 — BHP aktywne");

console.log("Tydzień 1 (07.10 - BHP aktywne):", occupancyWeek1.isFree ? "wolna" : "zajęta ✓");
console.log("Tydzień 9 (02.12 - po BHP):", occupancyAfterEnd.isFree ? "wolna ✓" : "zajęta");
console.log("✅ [PASS] getRoomOccupancyAt poprawnie weryfikuje aktywność zajęć przy sprawdzaniu wolnych sal.");

// ─── Test 21: Powiadomienie o nowościach (Changelog Modal & shouldShowChangelog) ────
console.log("\n-- Test 21: Powiadomienie o nowościach (Changelog Popup Modal)");

// 1. shouldShowChangelog logic
assert.strictEqual(shouldShowChangelog("3.8.0", null), true, "Dla nowego użytkownika (brak zapisu) powinno pokazać modal");
assert.strictEqual(shouldShowChangelog("3.8.0", "3.7.0"), true, "Dla nowszej wersji powinno pokazać modal");
assert.strictEqual(shouldShowChangelog("3.8.0", "3.8.0"), false, "Dla tej samej wersji NIE powinno pokazywać modala");
assert.strictEqual(shouldShowChangelog(null, "3.8.0"), false, "Brak nowej wersji nie powinien wywołać modala");

// 2. Interakcja z elementami DOM i localStorage
let modalOpened = false;
let modalClosed = false;

elements.changelogModal = {
  showModal() { modalOpened = true; },
  close() { modalClosed = true; },
  classList: { add() {}, remove() {} }
};
elements.changelogVersionBadge = { textContent: "" };
elements.changelogDate = { textContent: "" };
elements.changelogFeaturesList = { innerHTML: "" };

const mockStorage = {};
global.localStorage = {
  getItem(k) { return mockStorage[k] || null; },
  setItem(k, v) { mockStorage[k] = String(v); }
};

const sampleChangelog = {
  version: "3.8.0",
  date: "2026-09-24",
  features: ["Funkcja A", "Funkcja B"]
};

openChangelogModal(sampleChangelog);

assert.strictEqual(modalOpened, true, "openChangelogModal powinno wywołać showModal() na elemencie dialog");
assert.strictEqual(elements.changelogVersionBadge.textContent, "Wersja 3.8.0", "Badge wersji powinien mieć tekst 'Wersja 3.8.0'");
assert.strictEqual(elements.changelogDate.textContent, "2026-09-24", "Data powinna być ustawiona na '2026-09-24'");
assert.ok(elements.changelogFeaturesList.innerHTML.includes("Funkcja A") && elements.changelogFeaturesList.innerHTML.includes("Funkcja B"),
  "Lista funkcji powinna zawierać wstrzyknięte elementy <li>");

// Zamknij modal i zweryfikuj zapis do localStorage
closeChangelogModal();
assert.strictEqual(modalClosed, true, "closeChangelogModal powinno wywołać close() na dialogu");
assert.strictEqual(mockStorage["last_seen_changelog_version"], "3.8.0", "Wersja powinna zostać zapisana w localStorage");

// Sprawdź ponowną weryfikację po zapisaniu wersji
assert.strictEqual(
  shouldShowChangelog("3.8.0", mockStorage["last_seen_changelog_version"]),
  false,
  "Po zapisaniu w localStorage modal nie powinien się ponownie wyświetlać dla tej samej wersji"
);

console.log("✅ [PASS] Powiadomienie o nowościach (Changelog Modal & shouldShowChangelog) działa prawidłowo.");

// -- Test 22: renderLessonCard z klasą formy zajęć (wykład, ćwiczenia, lab, symulator)
console.log("\n-- Test 22: renderLessonCard nadaje odpowiednie klasy formy (.form-*)");
const sampleLesson = {
  przedmiot: "Nawigacja",
  godziny: "08:00 - 09:30",
  sala: "306",
  prowadzacy: "Jan Kowalski",
  forma: "symulator"
};

const renderedCardSym = renderLessonCard(sampleLesson);
assert.ok(renderedCardSym.includes("form-symulator"), "Karta powinna zawierać klasę form-symulator");

const sampleWyk = { ...sampleLesson, forma: "wyklad" };
const renderedCardWyk = renderLessonCard(sampleWyk);
assert.ok(renderedCardWyk.includes("form-wyklad"), "Karta powinna zawierać klasę form-wyklad");

const sampleCw = { ...sampleLesson, forma: "cwiczenia" };
const renderedCardCw = renderLessonCard(sampleCw);
assert.ok(renderedCardCw.includes("form-cwiczenia"), "Karta powinna zawierać klasę form-cwiczenia");

const sampleLab = { ...sampleLesson, forma: "laboratorium" };
const renderedCardLab = renderLessonCard(sampleLab);
assert.ok(renderedCardLab.includes("form-laboratorium"), "Karta powinna zawierać klasę form-laboratorium");

const sampleNoForm = { ...sampleLesson, forma: null };
const renderedCardNoForm = renderLessonCard(sampleNoForm);
assert.ok(!renderedCardNoForm.includes("form-"), "Karta bez formy nie powinna mieć klasy form-*");

console.log("✅ [PASS] renderLessonCard poprawnie aplikuje klasy .form-* do kart zajęć.");
 
// -- Test 23: Naturalne sortowanie listy planów (kierunek alfabetycznie, stopień, semestr rosnąco)
console.log("\n-- Test 23: Naturalne sortowanie listy planów (comparePlans)");
const unorderedPlans = [
  { id: "557", name: "Transport Morski pierwszego stopnia sem. 1" },
  { id: "550", name: "Transport i Logistyka pierwszego stopnia sem. 3" },
  { id: "559", name: "Transport Morski pierwszego stopnia sem. 3" },
  { id: "558", name: "Transport i Logistyka pierwszego stopnia sem. 1" },
  { id: "556", name: "Morskie Systemy Transportowe i Logistyczne drugiego stopnia sem. 2" },
  { id: "551", name: "Transport i Logistyka pierwszego stopnia sem. 5" }
];

const sorted = [...unorderedPlans].sort((a, b) => comparePlans(a, b));
const sortedNames = sorted.map(p => parsePlanInfo(p.name).cleanName);

assert.deepStrictEqual(sortedNames, [
  "Morskie Systemy Transportowe i Logistyczne sem. 2 (II st.)",
  "Transport i Logistyka sem. 1",
  "Transport i Logistyka sem. 3",
  "Transport i Logistyka sem. 5",
  "Transport Morski sem. 1",
  "Transport Morski sem. 3"
]);

console.log("✅ [PASS] Naturalne sortowanie planów działa poprawnie (kierunki alfabetycznie, semestry rosnąco).");

// -- Test 24: Tryb studiów (stacjonarne / niestacjonarne) i renderowanie dat ISO
console.log("\n-- Test 24: Tryb studiów (studyMode) i obsługa planów niestacjonarnych");

// 24a. Filtrowanie planów wg trybu
state.plansData = {
  plans: {
    "101": { name: "Nawigacja stacjonarne sem. 1", mode: "stacjonarne" },
    "102": { name: "Transport stacjonarne sem. 3", mode: "stacjonarne" },
    "nst_TiL_I": { name: "Transport studia 1 stopnia (TiL) rok: I (niestacjonarne)", mode: "niestacjonarne" }
  }
};

state.studyMode = "stacjonarne";
const fakeSelect = {
  innerHTML: "",
  children: [],
  appendChild(child) {
    this.children.push(child);
  }
};
elements.planSelect = fakeSelect;

populatePlanSelect();
const stacjoOptions = fakeSelect.children.map(c => c.value);
assert.ok(stacjoOptions.includes("101"), "Tryb stacjonarny powinien zawierać plan 101");
assert.ok(!stacjoOptions.includes("nst_TiL_I"), "Tryb stacjonarny nie powinien zawierać planu niestacjonarnego");

state.studyMode = "niestacjonarne";
fakeSelect.children = [];
populatePlanSelect();
const nstOptions = fakeSelect.children.map(c => c.value);
assert.ok(nstOptions.includes("nst_TiL_I"), "Tryb niestacjonarny powinien zawierać plan nst_TiL_I");
assert.ok(!nstOptions.includes("101"), "Tryb niestacjonarny nie powinien zawierać planu stacjonarnego");

// 24b. ResolveWeekSchedule dla formatu niestacjonarnego (daty ISO)
const mockNstSchedule = {
  "2026-10-03": [
    {
      przedmiot: "Matematyka",
      godziny: "08:00-09:35",
      sala: "Aula",
      prowadzacy: "Milczek Beata, dr",
      dzien: "Sobota"
    }
  ]
};

const weekMon = new Date(2026, 8, 28); // Poniedziałek 28.09.2026 przed 03.10.2026
const resolvedWeek = engine.resolveWeekSchedule(weekMon, mockNstSchedule);

assert.ok(resolvedWeek["SOB"], "Tydzień powinien zawierać sobotę");
assert.strictEqual(resolvedWeek["SOB"].lessons.length, 1, "Sobota powinna mieć 1 zajęcia");
assert.strictEqual(resolvedWeek["SOB"].lessons[0].przedmiot, "Matematyka");
assert.strictEqual(resolvedWeek["SOB"].lessons[0].sala, "Aula");
assert.strictEqual(resolvedWeek["SOB"].lessons[0].lessonDate, "2026-10-03");

console.log("✅ [PASS] Przełącznik trybu studiów i silnik dat ISO dla planów niestacjonarnych działają prawidłowo.");
 
// -- Test 25: Brak dni zamiennych w trybie niestacjonarnym (NST)
console.log("\n-- Test 25: Brak dni zamiennych w trybie niestacjonarnym (NST)");

// Tydzień 09.11.2026 - 15.11.2026 zawiera zamianę dnia: 13.11 (Piątek jako Środa)
const swapWeekMon = new Date(2026, 10, 9); // Poniedziałek 09.11.2026

// 25a. W trybie stacjonarnym zamiana dnia powinna być widoczna
state.studyMode = "stacjonarne";
const stacjoAcademicInfo = getAcademicInfoForWeek(swapWeekMon);
assert.ok(stacjoAcademicInfo.daySwaps.length > 0, "Tryb stacjonarny powinien wykrywać zamianę dnia w tygodniu 09.11-15.11");
assert.strictEqual(stacjoAcademicInfo.daySwaps[0].replaceWith, "ŚR", "Dla stacjonarnych 13.11 powinien być zamieniony na Środę");

// 25b. W trybie niestacjonarnym zamiany dni są ignorowane
state.studyMode = "niestacjonarne";
const nstAcademicInfo = getAcademicInfoForWeek(swapWeekMon);
assert.strictEqual(nstAcademicInfo.daySwaps.length, 0, "Tryb niestacjonarny NIE powinien zawierać dni zamiennych w academicInfo");

// 25c. updateCalendarNotice nie renderuje zamiany dnia w trybie niestacjonarnym
elements.calendarNotice = {
  innerHTML: "",
  className: "",
  classList: {
    add(cls) { this.classes.add(cls); },
    remove(cls) { this.classes.delete(cls); },
    classes: new Set()
  }
};
updateCalendarNotice(stacjoAcademicInfo); // wywołane gdy state.studyMode = "niestacjonarne"
assert.ok(!elements.calendarNotice.innerHTML.includes("Zamiana dnia"), "Baner zamiany dnia nie powinien być renderowany w trybie NST");

// 25d. resolveWeekSchedule nie zamienia planu dla formatu niestacjonarnego
const nstFridaySchedule = {
  "2026-11-13": [
    {
      przedmiot: "Nawigacja techniczna",
      godziny: "16:00-18:25",
      sala: "B211",
      dzien: "Piątek"
    }
  ]
};
const nstResolved = engine.resolveWeekSchedule(swapWeekMon, nstFridaySchedule, { isNst: true, studyMode: "niestacjonarne" });
assert.strictEqual(nstResolved["PT"].status, "normal", "W trybie niestacjonarnym piątek 13.11 powinien mieć status 'normal' zamiast 'daySwap'");
assert.strictEqual(nstResolved["PT"].swapNote, null, "W trybie niestacjonarnym swapNote powinien być null");
assert.strictEqual(nstResolved["PT"].swapReplaceWith, null, "W trybie niestacjonarnym swapReplaceWith powinien być null");
assert.strictEqual(nstResolved["PT"].lessons.length, 1, "Piątkowe zajęcia NST powinny pozostać na swoim miejscu");
assert.strictEqual(nstResolved["PT"].lessons[0].przedmiot, "Nawigacja techniczna", "Zajęcia z piątku nie powinny być zastąpione środą");

console.log("✅ [PASS] Dni zamienne są całkowicie wyłączone w trybie niestacjonarnym (brak banerów, brak zamian w silniku i UI).");

