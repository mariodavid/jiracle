# Einfaches Anwesenheits-Tracking für Jiracle

## Überblick

Einfache Erweiterung um grundlegendes Anwesenheits-Tracking zu ergänzen. Ziel: Arbeitszeit 8-17 Uhr mit 30min Pause erfassen, ohne komplexe Details.

## Was gebraucht wird

### Einfache Zeiterfassung

- **Check-in**: Arbeitsbeginn (z.B. 8:00)
- **Check-out**: Arbeitsende (z.B. 17:00)
- **Automatische 30min Pause**: Wird automatisch abgezogen
- **Sollzeit**: 8h (9h Anwesenheit - 30min Pause)

### CLI Commands

```bash
# Normale Nutzung
jiracle checkin     # Verwendet defaultCheckIn (08:00)
jiracle checkout    # Verwendet defaultCheckOut (17:00)
jiracle status      # Heute: 8:00-17:00 (8h 30m)

# Mit benutzerdefinierten Zeiten
jiracle checkin --time 08:15    # Checkin um 08:15
jiracle checkout --time 16:45   # Checkout um 16:45

# Nachträglich korrigieren
jiracle checkin --date 2025-07-11 --time 08:30
jiracle checkout --date 2025-07-11 --time 17:15
```

### Erweiterte Wochenansicht

```
                Mon    Tue    Wed    Thu    Fri    Total
Anwesenheit     8:15   8:00   7:45   8:30   7:45   40:15
Jira Stories    6:30   7:00   6:45   7:15   6:30   34:00
Differenz       1:45   1:00   1:00   1:15   1:15   6:15
```

## Technische Umsetzung

### Datenstruktur

```typescript
interface SimpleAttendance {
	date: string; // "2025-07-12"
	checkIn?: string; // "08:15"
	checkOut?: string; // "17:00"
	breakMinutes: number; // 30 (always 30min)
	totalHours?: number; // 8.25 (automatically calculated)
	notes?: string; // Optional notes
}

// CSV Format: Date,CheckIn,CheckOut,BreakMinutes,TotalHours,Notes
```

### Konfiguration

```json
{
	"attendance": {
		"enabled": true,
		"workingHours": 8,
		"breakMinutes": 30,
		"defaultCheckIn": "08:00",
		"defaultCheckOut": "17:00",
		"defaultBreakMinutes": 30
	}
}
```

### Konfigurationsoptionen

| Option                | Beschreibung                               | Beispiel  | Standard  |
| --------------------- | ------------------------------------------ | --------- | --------- |
| `enabled`             | Aktiviert Anwesenheits-Tracking            | `true`    | `false`   |
| `workingHours`        | Soll-Arbeitszeit pro Tag                   | `8`       | `8`       |
| `breakMinutes`        | Standard-Pausenzeit in Minuten             | `30`      | `30`      |
| `defaultCheckIn`      | Standard Check-in Zeit                     | `"08:00"` | `"08:00"` |
| `defaultCheckOut`     | Standard Check-out Zeit                    | `"17:00"` | `"17:00"` |
| `defaultBreakMinutes` | Standard-Pause (kann überschrieben werden) | `30`      | `30`      |

### CSV Speicherung

```
~/.config/jiracle/attendance.csv
Date,CheckIn,CheckOut,BreakMinutes,TotalHours,Notes
2025-07-12,08:15,17:00,30,8.25,
2025-07-13,08:30,17:15,30,8.25,
2025-07-14,08:00,16:45,30,8.25,
```

## Features

### Phase 1: Grundfunktionen

1. ✅ `jiracle checkin` - Zeit starten (mit Default-Zeit)
2. ✅ `jiracle checkout` - Zeit beenden (mit Default-Zeit)
3. ✅ `jiracle status` - Heutiger Status
4. ✅ Konfigurierbare Default-Zeiten und Pausen
5. ✅ Nachträgliche Zeitkorrektur mit --date und --time
6. ✅ CSV-Speicherung (Excel-kompatibel)

### Phase 2: UI Integration

1. ✅ Anwesenheitszeile in Weekly Timetable
2. ✅ Differenz zwischen Anwesenheit und Jira-Logs
3. ✅ Einfache Status-Indikatoren (✅/⚠️)

### Phase 3: Berichte

1. ✅ Wochenübersicht mit Sollzeit-Vergleich
2. ✅ Monatsübersicht
3. ✅ CSV ist bereits HR-ready (Excel öffnen)

## Implementierung

### Neue Dateien

```
source/attendance/
├── SimpleAttendanceManager.ts   # Check-in/out logic
├── AttendanceCSVStorage.ts      # CSV read/write operations
└── AttendanceCalculations.ts    # Time calculations

source/components/
└── SimpleAttendanceRow.tsx      # Row in weekly view

source/cli/
└── attendance-commands.ts       # CLI handlers
```

### Integration

- Bestehende Jira-Funktionalität bleibt unverändert
- Optionale Aktivierung über Config
- Minimal-invasive Erweiterung der Weekly View

## Beispiel Workflow

```bash
# Montag - normale Arbeitszeit
jiracle checkin           # Verwendet Default: 08:00
# ... arbeiten und Jira-Logs erstellen ...
jiracle checkout          # Verwendet Default: 17:00

# Dienstag - früher da
jiracle checkin --time 07:45
jiracle checkout          # Verwendet Default: 17:00

# Mittwoch - vergessen einzutragen, nachträglich
jiracle checkin --date 2025-07-13 --time 08:30
jiracle checkout --date 2025-07-13 --time 16:45

# Status anzeigen
jiracle status
# > Heute: 8:00-17:00 (8h 30m, Soll: 8h) ✅
# > Jira Stories: 6h 30m
# > Nicht erfasst: 2h

# Wochenübersicht
jiracle
# Zeigt erweiterte Tabelle mit Anwesenheitszeile
```

## Vorteile dieser Lösung

✅ **Einfach**: Nur das Nötigste, keine komplexen Pausendetails  
✅ **Schnell**: Minimaler Aufwand für Check-in/out  
✅ **Übersichtlich**: Klare Differenz zwischen Anwesenheit und Jira-Zeit  
✅ **CSV-Format**: Direkt in Excel öffnen, HR-freundlich  
✅ **Portable**: CSV kann einfach geteilt/bearbeitet werden  
✅ **Opt-in**: Bestehende Nutzer nicht betroffen  
✅ **Wartbar**: Wenig Code, einfache Logik

Das ist viel einfacher als der ursprüngliche Plan und deckt deine Bedürfnisse ab: 8-17 Uhr Arbeitszeit mit 30min Pause, ohne den Overhead von detailliertem Pausenmanagement.
