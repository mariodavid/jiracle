# Date Primitive Migration Plan

## Aktuelle Situation

Nach der Analyse der Codebase wurden **174 Date primitive Verwendungen** in 20+ Dateien identifiziert. Obwohl `LocalDate` und `WeekRange` bereits implementiert sind, werden noch viele `Date` Objekte verwendet.

## Kategorisierung der Date Primitive Usage

### 🔴 Kritische Migration (Hohe Priorität)

#### 1. Core Business Logic

- **`source/use-cases/WeeklyWorklogSummaryUseCase.ts:18-19`** - Interface verwendet `Date` statt `WeekRange`
- **`source/hooks/useNavigationState.ts:14,20`** - Navigation State mit `Date` statt `WeekRange`
- **`source/domain/WorklogEntry.ts:12,20,84,126`** - WorklogEntry verwendet noch `Date` intern

#### 2. Service Layer

- **`source/services/ReminderService.ts:25,53`** - Service Logic mit `new Date()`
- **`source/jira/utils.ts:149,151,156,160`** - Jira Utilities mit Date Arithmetik

### 🟡 Moderate Migration (Mittlere Priorität)

#### 3. Component Layer

- **`source/components/InlineWorklogForm.tsx:79,111,381`** - Form Components
- **`source/components/TimetableGrid.tsx:125`** - Grid Component
- **`source/hooks/useTitleResolver.ts:35,66,72,88-97`** - Title/Week Resolution

#### 4. Utility Functions

- **`source/utils/TimetableCalculations.ts:45`** - Calculation Utilities
- **`source/utils/TimetableDataUtils.ts:17`** - Data Transformation

### 🟢 Niedrige Priorität (Test & Implementierung Details)

#### 5. Test Files (>100 Vorkommen)

- Alle Test-Dateien verwenden noch `new Date()` für Test-Data
- Mock/Fixture Dateien mit hardcoded Dates

#### 6. Domain Type Internals

- **`source/domain/LocalDate.ts`** - Interne Date Verwendung (akzeptabel)
- **`source/domain/WeekRange.ts`** - Interne Date Arithmetik (akzeptabel)

## Migration Strategy

### Phase 1: Core Business Logic (Woche 1)

#### 1.1 WeeklyWorklogSummaryUseCase Migration

```typescript
// Vorher:
export type ExecuteWeeklyWorklogSummaryOptions = {
	weekStart: Date;
	weekEnd: Date;
	// ...
};

// Nachher:
export type ExecuteWeeklyWorklogSummaryOptions = {
	weekRange: WeekRange;
	// oder:
	weekStart: LocalDate;
	weekEnd: LocalDate;
	// ...
};
```

#### 1.2 Navigation State Migration

```typescript
// Vorher:
export type UseNavigationStateReturn = {
	currentWeek: Date;
	// ...
};

// Nachher:
export type UseNavigationStateReturn = {
	currentWeek: WeekRange;
	// ...
};
```

#### 1.3 WorklogEntry Date Handling

```typescript
// Option A: LocalDate intern verwenden
private readonly _date: LocalDate;

// Option B: Date beibehalten aber bessere Wrapper
get localDate(): LocalDate {
  return LocalDate.fromDate(this._date);
}
```

### Phase 2: Service Layer (Woche 2)

#### 2.1 ReminderService Migration

- `new Date()` → `LocalDate.today()`
- Date Vergleiche → LocalDate Methoden

#### 2.2 Jira Utils Migration

- Date Arithmetik → LocalDate/WeekRange Methoden
- Date Parsing → LocalDate.fromString()

### Phase 3: Component Layer (Woche 3)

#### 3.1 Form Components

- Props Interface: `Date` → `LocalDate`
- Event Handlers: Date → LocalDate Konversion

#### 3.2 Grid Components

- Date Display Logic → LocalDate.toDisplayString()
- Week Navigation → WeekRange Navigation

### Phase 4: Test Migration (Woche 4)

#### 4.1 Test Data Builder

```typescript
// Neue Test Utilities:
TestData.localDate(dateString: string): LocalDate
TestData.weekRange(startDate: string): WeekRange
TestData.worklogEntry(options: {date: LocalDate, ...})
```

#### 4.2 Systematic Test Migration

- 15+ Test-Dateien systematisch migrieren
- Mock Response Objects updaten

## Neue Domain Types Potential

### 1. TimeOfDay Value Object

```typescript
class TimeOfDay {
	static parse(time: string): TimeOfDay; // "14:30"
	toTimeString(): string;
	addHours(hours: number): TimeOfDay;
	isBetween(start: TimeOfDay, end: TimeOfDay): boolean;
}
```

### 2. DateTime Domain Object

```typescript
class DateTime {
	static fromLocalDateAndTime(date: LocalDate, time: TimeOfDay): DateTime;
	toJiraApiFormat(): string; // "2024-01-15T14:30:00+0000"
	getLocalDate(): LocalDate;
	getTimeOfDay(): TimeOfDay;
}
```

### 3. AttendanceDay Value Object

```typescript
class AttendanceDay {
	constructor(date: LocalDate, checkIn?: TimeOfDay, checkOut?: TimeOfDay);
	getWorkingDuration(): Duration;
	isComplete(): boolean;
	addBreak(duration: Duration): AttendanceDay;
}
```

## Migration Komplexität Assessment

### Einfach (1-2 Tage)

- Interface Type Changes
- Simple Date → LocalDate Konvertierungen
- Test Data Updates

### Mittel (3-5 Tage)

- Component Props Migration
- Service Layer Refactoring
- Utility Function Updates

### Komplex (1-2 Wochen)

- UseCase Interface Changes (Breaking Changes)
- Comprehensive Test Migration
- Edge Case Testing

## Erfolgskriterien

### ✅ Phase 1 Abschluss

- [ ] WeeklyWorklogSummaryUseCase verwendet WeekRange
- [ ] useNavigationState verwendet WeekRange
- [ ] Keine `new Date()` in Business Logic

### ✅ Phase 2 Abschluss

- [ ] Services verwenden LocalDate
- [ ] Jira Utils verwenden LocalDate
- [ ] Keine Date Arithmetik außerhalb Domain

### ✅ Phase 3 Abschluss

- [ ] Components verwenden LocalDate Props
- [ ] Alle Date Display via LocalDate
- [ ] Navigation komplett über WeekRange

### ✅ Phase 4 Abschluss

- [ ] Alle Tests verwenden Domain Types
- [ ] Test Coverage für alle Migrationen
- [ ] CI läuft grün

## Risiken & Mitigation

### Breaking Changes

- **Risiko**: API Interface Changes brechen bestehende Aufrufe
- **Mitigation**: Graduelle Migration mit Wrapper Methoden

### Test Instabilität

- **Risiko**: Massive Test Changes können Bugs einführen
- **Mitigation**: Phase-weise Migration mit kontinuierlichen Tests

### Performance Impact

- **Risiko**: Domain Objects könnten Performance beeinträchtigen
- **Mitigation**: Benchmarking vor/nach Migration

## Nächste Schritte

1. **Jetzt**: Phase 1 starten mit WeeklyWorklogSummaryUseCase
2. **Diese Woche**: Navigation State Migration
3. **Nächste Woche**: Service Layer beginnen
4. **Monitoring**: Date primitive Verwendung tracken (sollte von 174 → 0 gehen)
