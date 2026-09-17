const assert = require("assert");
const { getLessonMeetingInfo, getMonday } = require("./web/app.js");

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

// Data: 1 lutego 2027 (Poniedziałek podczas sesji egzaminacyjnej 01.02 - 07.02.2027)
// W semestrze zimowym 04.01 poniedziałek został zamieniony na środę, więc do 29.01 nie odbyło się 8 spotkań!
const examMondayDate = "2027-02-01";
const examMonday = getMonday(new Date(2027, 1, 1)); // 2027-02-01

const result = getLessonMeetingInfo(lessonMonday, "PON", examMonday, examMondayDate);

console.log("Wynik dla 2027-02-01:", result);


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

// --- TEST 2: Święto (11.11) nie może przeskakiwać numeru fizycznego spotkania ---
console.log("\n-- Test 2: Święto 11.11 nie może przeskakiwać numeru spotkania (04.11 = spotkanie 5, 18.11 = spotkanie 6)");

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

// 3. Środa 18.11.2026 -> powinno być 6. spotkanie (a NIE 7. tydzień kalendarzowy!)
const mon18 = getMonday(new Date(2026, 10, 18));
const res18 = getLessonMeetingInfo(lessonWed, "ŚR", mon18, "2026-11-18");
console.log("18.11 (Śr po święcie):", res18);

try {
  assert.strictEqual(
    res18.meetingNum,
    6,
    `18.11 powinno być 6. fizyczne spotkanie (po wolnym 11.11), a system zwrócił: ${res18.meetingNum}`
  );
  console.log("✅ [PASS] Licznik spotkań prawidłowo uwzględnia dzień wolny.");
} catch (err) {
  console.error("❌ [FAIL]", err.message);
  process.exit(1);
}

// --- TEST 3: Dwa spotkania ze środy w jednym tygodniu (16.12 i 18.12) ---
console.log("\n-- Test 3: Zamiana dnia (Piątek 18.12 jako Środa): dwa spotkania w jednym tygodniu");

// 1. Środa 16.12.2026 (normalna środa w 11. tygodniu semestru)
const monDec = getMonday(new Date(2026, 11, 16)); // 2026-12-14
const res16 = getLessonMeetingInfo(lessonWed, "ŚR", monDec, "2026-12-16");
console.log("16.12 (Środa w tygodniu 11):", res16);

// 2. Piątek 18.12.2026 (piątek z zamianą rektorską na środę)
const res18Dec = getLessonMeetingInfo(lessonWed, "ŚR", monDec, "2026-12-18");
console.log("18.12 (Piątek realizujący środę):", res18Dec);

try {
  assert.strictEqual(res18Dec.active, true, "18.12 zajęcia ze środy powinny być aktywne");
  assert.strictEqual(
    res18Dec.meetingNum,
    res16.meetingNum + 1,
    `18.12 powinno być kolejne spotkanie (${res16.meetingNum + 1}), a otrzymano: ${res18Dec.meetingNum}`
  );
  console.log(`✅ [PASS] Prawidłowo policzono 2 spotkania w jednym tygodniu (16.12 = spotkanie ${res16.meetingNum}, 18.12 = spotkanie ${res18Dec.meetingNum}).`);
} catch (err) {
  console.error("❌ [FAIL]", err.message);
  process.exit(1);
}

// --- TEST 4: Przedmiot z 1. połowy semestru (7 spotkań) z uwzględnieniem świąt ---
console.log("\n-- Test 4: Przedmiot 1. połowy semestru (7 spotkań) ze świętem 11.11 kończy się dopiero 25.11");

const lessonHalf1 = {
  przedmiot: "BHP",
  data_start: "2026-10-07", // Środa
  polowa_sem: 1,
  tygodnie: 7,
  co_ile: 1
};

// 1. Środa 18.11.2026 -> 6. spotkanie (mimo że to 7. tydzień kalendarzowy!)
const resHalf1_18 = getLessonMeetingInfo(lessonHalf1, "ŚR", mon18, "2026-11-18");
console.log("18.11 (Śr - 6. spotkanie BHP):", resHalf1_18);
assert.strictEqual(resHalf1_18.active, true, "18.11 BHP powinno być aktywne");
assert.strictEqual(resHalf1_18.meetingNum, 6, "18.11 BHP to 6. spotkanie");

// 2. Środa 25.11.2026 -> 7. spotkanie (ostatnie!)
const mon25 = getMonday(new Date(2026, 10, 25));
const resHalf1_25 = getLessonMeetingInfo(lessonHalf1, "ŚR", mon25, "2026-11-25");
console.log("25.11 (Śr - 7. spotkanie BHP, ostatnie):", resHalf1_25);
assert.strictEqual(resHalf1_25.active, true, "25.11 BHP powinno być aktywne");
assert.strictEqual(resHalf1_25.meetingNum, 7, "25.11 BHP to 7. spotkanie");

// 3. Środa 02.12.2026 -> 8. tydzień, BHP zakończone (active = false)
const mon02Dec = getMonday(new Date(2026, 11, 2));
const resHalf1_02 = getLessonMeetingInfo(lessonHalf1, "ŚR", mon02Dec, "2026-12-02");
console.log("02.12 (Śr po zakończeniu BHP):", resHalf1_02);

try {
  assert.strictEqual(resHalf1_02.active, false, "02.12 BHP powinno być nieaktywne (zakończyło 7 spotkań)");
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
const resBi_02Dec = getLessonMeetingInfo(lessonBi, "ŚR", mon02Dec, "2026-12-02");
console.log("02.12 (Tydzień 9, spotkanie 5 - ostatnie):", resBi_02Dec);
assert.strictEqual(resBi_02Dec.active, true);
assert.strictEqual(resBi_02Dec.meetingNum, 5);

// 4. Tydzień 11 (16.12) -> zakończone (active = false)
const resBi_16Dec = getLessonMeetingInfo(lessonBi, "ŚR", monDec, "2026-12-16");
console.log("16.12 (Tydzień 11, po zrealizowaniu 5 spotkań):", resBi_16Dec);

try {
  assert.strictEqual(resBi_16Dec.active, false, "16.12 powinien być nieaktywny (zakończono 5 spotkań)");
  console.log("✅ [PASS] Przedmiot co 2 tygodnie zachowuje właściwy rytm i kończy się po 5 spotkaniach.");
} catch (err) {
  console.error("❌ [FAIL]", err.message);
  process.exit(1);
}

// --- TEST 6: Przedmiot co 2 tygodnie trafiający na dzień wolny (11.11) ---
console.log("\n-- Test 6: Przedmiot co 2 tygodnie trafia na dzień wolny 11.11");

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

// 4. Tydzień 7 (18.11 - Tydzień grupy przeciwnej): wolne od tego przedmiotu
const resBiH_18 = getLessonMeetingInfo(lessonBiWithHoliday, "ŚR", mon18, "2026-11-18");
console.log("18.11 (Tydz 7 - Tydzień grupy przeciwnej):", resBiH_18);
assert.strictEqual(resBiH_18.active, false, "18.11 powinno być nieaktywne dla grupy z parzystego cyklu");
assert.strictEqual(resBiH_18.meetingNum, 2, `18.11 powinno wskazywać 2 dotychczas odbyte spotkania, a jest: ${resBiH_18.meetingNum}`);

// 5. Tydzień 8 (25.11 - Kolejny termin grupy): spotkanie 3!
const resBiH_25 = getLessonMeetingInfo(lessonBiWithHoliday, "ŚR", mon25, "2026-11-25");
console.log("25.11 (Tydz 8 - Spotkanie 3 po święcie):", resBiH_25);
try {
  assert.strictEqual(resBiH_25.active, true, "25.11 zajęcia powinny się odbyć");
  assert.strictEqual(
    resBiH_25.meetingNum,
    3,
    `25.11 powinno być 3. spotkanie (po wolnym 11.11), a jest: ${resBiH_25.meetingNum}`
  );
  console.log("✅ [PASS] Przedmiot co 2 tygodnie po święcie prawidłowo realizuje kolejne spotkanie.");
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

// 1. Zwykłe spotkanie w trakcie cyklu (np. 6. z 7 spotkań BHP)
const prog6 = getLessonProgress(lessonHalf1, "ŚR", mon18, "2026-11-18");
console.log("Postęp BHP dla spotkania 6/7:", prog6);
assert.strictEqual(prog6.text, "6/7", `Oczekiwano tekstu '6/7', a otrzymano: ${prog6.text}`);
assert.strictEqual(prog6.isFinal, false);

// 2. Ostatnie spotkanie w cyklu (7. z 7 spotkań BHP) -> powinno wyświetlać 'Ostatnie zajęcia'
const prog7 = getLessonProgress(lessonHalf1, "ŚR", mon25, "2026-11-25");
console.log("Postęp BHP dla spotkania 7/7 (ostatnie):", prog7);
assert.strictEqual(prog7.text, "Ostatnie zajęcia", `Oczekiwano 'Ostatnie zajęcia', a otrzymano: ${prog7.text}`);
assert.strictEqual(prog7.isFinal, true);

// 3. Przedmiot pełnosemestralny (np. 10. spotkanie z 15) -> '10/15'
const prog10 = getLessonProgress(lessonWed, "ŚR", monDec, "2026-12-16");
console.log("Postęp Matematyki 10/15:", prog10);
assert.strictEqual(prog10.text, "10/15", `Oczekiwano '10/15', a otrzymano: ${prog10.text}`);
assert.strictEqual(prog10.isFinal, false);

console.log("✅ [PASS] Format licznika w UI wyświetla czyste 'x/y' oraz wyróżnia 'Ostatnie zajęcia'.");











