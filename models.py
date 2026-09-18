"""
Domain data models and TypedDicts for Plan WN.
Provides strict contracts between scraper, parsers, and static build indexers.
"""
from typing import TypedDict, Optional, List, Dict, Any


class LessonDict(TypedDict, total=False):
    """Represents a single parsed lesson slot from the university timetable grid."""
    przedmiot: str
    raw_przedmiot: str
    prowadzacy: str
    godziny: str
    sala: str
    height: int
    colspan: int
    data_start: str
    tygodnie: int
    co_ile: int
    od_tyg: Optional[int]
    polowa_sem: Optional[int]


class RoomScheduleEntry(TypedDict, total=False):
    """Represents a scheduled class in the room inverted index."""
    slot: int
    hours: str
    subject: str
    teacher: str
    groups: List[str]
    plan_id: str
    plan_name: str
    weeks: int
    data_start: str
    co_ile: int
    od_tyg: Optional[int]
    polowa_sem: Optional[int]


class TeacherScheduleEntry(TypedDict, total=False):
    """Represents a scheduled class in the instructor inverted index."""
    day: str
    slot: int
    hours: str
    subject: str
    raw_subject: str
    room: str
    groups: List[str]
    plan_id: str
    plan_name: str
    weeks: int
    data_start: str
    co_ile: int
    od_tyg: Optional[int]
    polowa_sem: Optional[int]


class AcademicCalendarPeriod(TypedDict, total=False):
    name: str
    type: str  # "teaching", "break", "exam"
    start: str
    end: str


class AcademicCalendarDaySwap(TypedDict, total=False):
    replaceWith: str  # "PON", "WT", "ŚR", "CZW", "PT"
    note: str
