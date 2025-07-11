# Plan: Inline Worklog Form in Weekly Timetable

## Ziel

Wenn der User auf eine Zelle in der Tabelle klickt (Enter drückt), soll unter der Tabelle ein kompaktes Formular erscheinen, wo Zeit und Kommentar eingegeben werden können.

## UI Design Vorschlag

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                           JIRACLE                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ← Previous Week        Week 28 (Jul 7-13, 2025)        Next Week → │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Issue     │  Mon  │  Tue  │  Wed  │  Thu  │  Fri  │ Total │          │
│ ──────────┼───────┼───────┼───────┼───────┼───────┼───────┤          │
│ PROJ-123  │   4   │   -   │  [2]  │   -   │   3   │   9   │          │
│ Summary   │       │       │       │       │       │       │          │
│ PROJ-456  │   -   │   8   │   -   │   4   │   -   │  12   │          │
│ Summary   │       │       │       │       │       │       │          │
│ ──────────┼───────┼───────┼───────┼───────┼───────┼───────┤          │
│ Daily Tot │   4   │   8   │   2   │   4   │   3   │  21   │          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─ Log Work: PROJ-123 on Wednesday, Jul 9 ──────────────────────┐   │
│ │                                                                │   │
│ │ Time spent:        │ Comment:                                  │   │
│ │                    │                                           │   │
│ │ ○ 15m             │ [Implemented login feature______________] │   │
│ │ ○ 30m             │ [____________________________________]  │   │
│ │ ○ 45m             │ [____________________________________]  │   │
│ │ ● 1h              │ [____________________________________]  │   │
│ │ ○ 1h 15m          │ [____________________________________]  │   │
│ │ ○ 1h 30m          │ [____________________________________]  │   │
│ │ ○ 2h              │ [____________________________________]  │   │
│ │ ○ Custom: [___]   │ [____________________________________]  │   │
│ │                    │                                           │   │
│ │ [Submit]  [Cancel] │                                           │   │
│ └────────────────────┴───────────────────────────────────────────┘   │
│                                                                     │
│ [↑↓] Select Time [Tab] Switch Areas [Enter] Submit                  │
│ [Shift+←→] Week Navigation [T] Today [R] Refresh [Q] Quit           │
└─────────────────────────────────────────────────────────────────────┘
```

## Technische Implementierung

### 1. State Management

- Neuer State in `WeeklyTimetableView`: `worklogFormData`
- Interface für Form-Daten:
  ```typescript
  interface WorklogFormData {
  	issueKey: string;
  	date: Date;
  	timeSpent: string;
  	comment: string;
  	isVisible: boolean;
  }
  ```

### 2. Neue Komponente: `InlineWorklogForm`

**Datei:** `source/components/InlineWorklogForm.tsx`

**Features:**

- Zwei-spaltige Layout: Zeit-Auswahl links, Kommentar rechts
- Radio-Button-Liste für Zeit-Optionen (wie im bestehenden Worklog)
- Custom Zeit-Eingabe als letzte Option
- Mehrzeiliges Kommentar-Feld
- Submit/Cancel Buttons
- Tab-Navigation zwischen Bereichen
- Escape zum Abbrechen

**Zeit-Optionen:**

```typescript
const TIME_OPTIONS = ['30m', '1h', '2h', '4h', '6h', '8h', 'custom'];
```

**Props:**

```typescript
interface InlineWorklogFormProps {
	issueKey: string;
	date: Date;
	defaultTimeSpent?: string;
	defaultComment?: string;
	onSubmit: (data: {timeSpent: string; comment: string}) => void;
	onCancel: () => void;
}
```

### 3. Integration in WeeklyTimetableView

**Workflow:**

1. User drückt Enter auf einer Zelle
2. `onCellWorklog` wird aufgerufen
3. State wird gesetzt: Form wird sichtbar, Fokus geht an erste Input
4. Form erscheint unter der Tabelle
5. User kann mit Tab zwischen Zeit- und Kommentar-Feld wechseln
6. Submit oder Cancel schließt das Form

**State Updates:**

- Bei Zellen-Auswahl: Form-State setzen und anzeigen
- Bei Submit: Worklog-API aufrufen, Form schließen
- Bei Cancel/Escape: Form schließen, zurück zur Tabelle

### 4. Input-Handling Anpassungen

**Tab-Navigation erweitern:**

- Wenn Form aktiv: nur innerhalb des Forms navigieren
- Tab zwischen: Zeit-Auswahl → Kommentar-Feld → Submit-Button → Cancel-Button
- Escape: Form schließen und zurück zur Tabelle

**Keyboard Shortcuts:**

- ↑↓: Zeit-Option auswählen
- Tab: zwischen Zeit-Auswahl und Kommentar-Feld wechseln
- Enter im Kommentar-Feld: Submit
- Ctrl+Enter: Submit von überall im Form
- Escape: Cancel

### 5. Visual Design Details

**Form-Styling:**

- Border mit rounded corners
- Titel zeigt Issue-Key und Datum
- Zwei-spaltige Layout mit vertikaler Trennung
- Radio-Buttons für Zeit-Optionen (○ unselected, ● selected)
- Mehrzeiliges Kommentar-Feld (ca. 4-5 Zeilen)
- Fokus-Highlighting für aktiven Bereich
- Button-Styling ähnlich der Navigation

**Layout-Aufteilung:**

- Linke Spalte (30%): Zeit-Auswahl mit Radio-Buttons
- Rechte Spalte (70%): Kommentar-Eingabe
- Buttons unten links

### 6. Fehlerbehandlung

**Validation:**

- Zeit-Format prüfen mit `normalizeTimeFormat`
- Leere Zeit-Eingabe abfangen
- API-Fehler anzeigen (kleine Fehler-Box unter dem Form)

**Edge Cases:**

- Form schließen wenn Woche gewechselt wird
- Form schließen bei Refresh
- State cleanup bei Component unmount

## Implementierung Schritte

1. **InlineWorklogForm Komponente erstellen**

   - Zwei-spaltiges Layout mit Border
   - Radio-Button-Liste für Zeit-Optionen (links)
   - Mehrzeiliges Kommentar-Feld (rechts)
   - Button-Bereich (unten links)

2. **State Management in WeeklyTimetableView**

   - Form-State hinzufügen
   - Event-Handler für Show/Hide
   - Zeit-Auswahl State

3. **Zeit-Auswahl Komponente**

   - Radio-Button-Liste wie im bestehenden Worklog
   - Custom-Zeit-Eingabe als letzte Option
   - ↑↓ Navigation zwischen Optionen

4. **Integration in TimetableGrid**

   - `onCellWorklog` erweitern
   - Form unter Tabelle einbauen
   - Tab-Navigation anpassen

5. **Input-Handling erweitern**

   - Radio-Button Navigation (↑↓)
   - Tab zwischen Zeit-Auswahl und Kommentar
   - Escape-Handling
   - Submit-Logic

6. **Styling und Polish**

   - Zwei-spaltige Layout-Logik
   - Radio-Button Styling (○●)
   - Fokus-Indikatoren für beide Bereiche
   - Konsistente Farben und Fonts

7. **Tests hinzufügen**
   - Unit Tests für InlineWorklogForm
   - Radio-Button Navigation Tests
   - Integration Tests für Workflow

## Vorteile dieses Ansatzes

✅ **Keine neue Seite:** Workflow bleibt in der Timetable-Ansicht
✅ **Kontext bleibt:** User sieht weiterhin die Tabelle während der Eingabe
✅ **Bekanntes Interface:** Zeit-Auswahl wie beim bestehenden Worklog
✅ **Schnell:** Radio-Button für Zeit + Kommentar-Feld → Submit
✅ **Übersichtlich:** Zwei-spaltige Aufteilung für bessere Organisation
✅ **Flexibel:** Custom Zeit-Eingabe weiterhin möglich
✅ **Konsistent:** Passt zum bestehenden UI-Design und Worklog-Flow
