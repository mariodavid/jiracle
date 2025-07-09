# Jiracle Test Plan

## Überblick

Diese Testpläne beschreiben die fachlichen Testfälle für die Jiracle TUI-Anwendung. Tests werden mit ink-testing-library als Integrationstests implementiert.

## 1. Application Lifecycle Tests

### 1.1 App Start & Configuration Loading

- **Test:** App startet erfolgreich
- **Erwartet:** Loading-Banner wird angezeigt, dann Main Menu
- **Validierung:** "What would you like to do?" erscheint

### 1.2 Configuration Error Handling

- **Test:** App startet mit fehlender/ungültiger Konfiguration
- **Erwartet:** Fehler-Alert wird angezeigt
- **Validierung:** Error-Meldung enthält Config-Pfad

### 1.3 API Connection Error

- **Test:** App startet aber API ist nicht erreichbar
- **Erwartet:** Fehler-Alert nach Loading-Timeout
- **Validierung:** "Failed to fetch" Error-Meldung

## 2. Main Menu Tests

### 2.1 Main Menu Display

- **Test:** Main Menu wird korrekt angezeigt
- **Erwartet:** Alle Optionen sind sichtbar und navigierbar
- **Validierung:** "Log Work", "Week Overview", "Settings" vorhanden

### 2.2 Log Work Navigation

- **Test:** "Log Work" auswählen navigiert zu Issue Selection Mode
- **Erwartet:** Issue Selection Mode Screen erscheint
- **Validierung:** "How would you like to select an issue?" Text

### 2.3 Not Implemented Features

- **Test:** "Week Overview" und "Settings" auswählen
- **Erwartet:** "Not implemented yet" Fehler-Alert
- **Validierung:** Entsprechende Error-Meldung

## 3. Issue Selection Mode Tests

### 3.1 Issue Selection Mode Display

- **Test:** Issue Selection Mode zeigt alle Optionen
- **Erwartet:** Favorites, Assigned Issues, Other sind verfügbar
- **Validierung:** Alle drei Optionen im Menu sichtbar

### 3.2 Favorites Selection

- **Test:** "Favorites" auswählen zeigt Favorite Issues
- **Erwartet:** Liste der konfigurierten Favorite Issues
- **Validierung:** Issue Keys und Titles werden angezeigt

### 3.3 Assigned Issues Selection

- **Test:** "Assigned Issues" auswählen zeigt zugewiesene Issues
- **Erwartet:** Liste der dem User zugewiesenen Issues
- **Validierung:** Issue Keys und Titles werden angezeigt

### 3.4 Other Selection (Manual Input)

- **Test:** "Other" auswählen zeigt Manual Input
- **Erwartet:** TextInput für Issue Key/URL erscheint
- **Validierung:** "Enter issue key or URL" Placeholder

## 4. Issue Selection Tests

### 4.1 Favorite Issue Selection

- **Test:** Issue aus Favorites-Liste auswählen
- **Erwartet:** Navigation zu Time Selection
- **Validierung:** "Select time to log" erscheint

### 4.2 Assigned Issue Selection

- **Test:** Issue aus Assigned-Liste auswählen
- **Erwartet:** Navigation zu Time Selection
- **Validierung:** "Select time to log" erscheint

### 4.3 Empty Favorites List

- **Test:** Favorites-Liste ist leer
- **Erwartet:** Entsprechende Meldung oder leere Liste
- **Validierung:** Keine Issues angezeigt

### 4.4 Empty Assigned List

- **Test:** Assigned-Liste ist leer
- **Erwartet:** Entsprechende Meldung oder leere Liste
- **Validierung:** Keine Issues angezeigt

## 5. Manual Issue Input Tests

### 5.1 Valid Issue Key Input

- **Test:** Gültigen Issue Key eingeben (z.B. "JTS-1234")
- **Erwartet:** Issue wird validiert und Navigation zu Time Selection
- **Validierung:** Kein Error, Time Selection erscheint

### 5.2 Valid Jira URL Input

- **Test:** Gültige Jira URL eingeben
- **Erwartet:** Issue Key wird extrahiert, Navigation zu Time Selection
- **Validierung:** URL wird zu Issue Key konvertiert

### 5.3 Invalid Issue Key Input

- **Test:** Ungültigen Issue Key eingeben
- **Erwartet:** Error-Alert wird angezeigt
- **Validierung:** "Invalid issue key or URL format" Meldung

### 5.4 Invalid URL Input

- **Test:** Ungültige URL eingeben
- **Erwartet:** Error-Alert wird angezeigt
- **Validierung:** "Invalid issue key or URL format" Meldung

### 5.5 Empty Input

- **Test:** Leere Eingabe bestätigen
- **Erwartet:** Error-Alert wird angezeigt
- **Validierung:** Entsprechende Validierungs-Meldung

### 5.6 Non-existent Issue

- **Test:** Gültiges Format aber nicht existierender Issue
- **Erwartet:** API-Error Alert wird angezeigt
- **Validierung:** "Issue not found" oder ähnliche Meldung

## 6. Time Selection Tests

### 6.1 Time Selection Display

- **Test:** Time Selection zeigt alle Optionen
- **Erwartet:** 1h, 2h, 4h, 6h, 8h, Custom verfügbar
- **Validierung:** Alle Zeitoptionen sichtbar

### 6.2 Predefined Time Selection

- **Test:** Vordefinierte Zeit auswählen (1h, 2h, 4h, 6h, 8h)
- **Erwartet:** Navigation zu Comment Input
- **Validierung:** Comment Input Screen erscheint

### 6.3 Custom Time Selection

- **Test:** "Custom" Zeit auswählen
- **Erwartet:** TextInput für custom Zeit erscheint
- **Validierung:** "Enter custom time" Input erscheint

## 7. Custom Time Input Tests

### 7.1 Valid Time Formats

- **Test:** Gültige Zeitformate eingeben
- **Testdaten:** "1h", "30m", "2h30m", "1.5h", "2,5h"
- **Erwartet:** Zeit wird akzeptiert, Navigation zu Comment Input
- **Validierung:** Kein Error, Comment Input erscheint

### 7.2 Invalid Time Format

- **Test:** Ungültige Zeitformate eingeben
- **Testdaten:** "abc", "1x", "25h", "-1h"
- **Erwartet:** Error-Alert wird angezeigt
- **Validierung:** "Invalid time format" Meldung

### 7.3 Empty Time Input

- **Test:** Leere Zeit-Eingabe bestätigen
- **Erwartet:** Error-Alert wird angezeigt
- **Validierung:** Entsprechende Validierungs-Meldung

### 7.4 German Decimal Format

- **Test:** Deutsche Dezimalschreibweise ("2,5h")
- **Erwartet:** Komma wird zu Punkt konvertiert
- **Validierung:** Zeit wird korrekt geparst

## 8. Comment Input Tests

### 8.1 Comment Input Display

- **Test:** Comment Input wird angezeigt
- **Erwartet:** TextInput für Kommentar
- **Validierung:** "Enter comment" Input erscheint

### 8.2 Valid Comment Input

- **Test:** Kommentar eingeben
- **Erwartet:** Navigation zu Date Selection
- **Validierung:** Date Selection Screen erscheint

### 8.3 Empty Comment Input

- **Test:** Leeren Kommentar bestätigen
- **Erwartet:** Navigation zu Date Selection (optional)
- **Validierung:** Date Selection Screen erscheint

### 8.4 Long Comment Input

- **Test:** Sehr langen Kommentar eingeben
- **Erwartet:** Kommentar wird akzeptiert
- **Validierung:** Navigation zu Date Selection

## 9. Date Selection Tests

### 9.1 Date Selection Display

- **Test:** Date Selection zeigt Optionen
- **Erwartet:** "Today", "Yesterday", "Custom" verfügbar
- **Validierung:** Alle Datums-Optionen sichtbar

### 9.2 Today Selection

- **Test:** "Today" auswählen
- **Erwartet:** Navigation zu Worklog Submission
- **Validierung:** "Submitting worklog" oder Success-Meldung

### 9.3 Yesterday Selection

- **Test:** "Yesterday" auswählen
- **Erwartet:** Navigation zu Worklog Submission
- **Validierung:** "Submitting worklog" oder Success-Meldung

### 9.4 Custom Date Selection

- **Test:** "Custom" Datum auswählen
- **Erwartet:** Date Input erscheint
- **Validierung:** Custom Date Input Screen

## 10. Worklog Submission Tests

### 10.1 Successful Worklog Submission

- **Test:** Kompletter Workflow mit gültigen Daten
- **Erwartet:** Success-Alert wird angezeigt
- **Validierung:** "Worklog successfully added!" Meldung

### 10.2 API Error During Submission

- **Test:** API gibt Fehler zurück bei Submission
- **Erwartet:** Error-Alert wird angezeigt
- **Validierung:** API-Error-Meldung angezeigt

### 10.3 Network Error During Submission

- **Test:** Netzwerk-Fehler bei Submission
- **Erwartet:** Network-Error-Alert wird angezeigt
- **Validierung:** Network-Error-Meldung

### 10.4 Auto-Return to Main Menu

- **Test:** Nach erfolgreichem Worklog
- **Erwartet:** Nach 2 Sekunden Rückkehr zum Main Menu
- **Validierung:** Main Menu erscheint wieder

## 11. Navigation & ESC Tests

### 11.1 ESC from Issue Selection Mode

- **Test:** ESC drücken in Issue Selection Mode
- **Erwartet:** Rückkehr zum Main Menu
- **Validierung:** Main Menu erscheint

### 11.2 ESC from Issue List

- **Test:** ESC drücken in Issue List (Favorites/Assigned)
- **Erwartet:** Rückkehr zu Issue Selection Mode
- **Validierung:** Issue Selection Mode erscheint

### 11.3 ESC from Manual Input

- **Test:** ESC drücken in Manual Issue Input
- **Erwartet:** Rückkehr zu Issue Selection Mode
- **Validierung:** Issue Selection Mode erscheint

### 11.4 ESC from Time Selection

- **Test:** ESC drücken in Time Selection
- **Erwartet:** Rückkehr zu Issue Selection/List
- **Validierung:** Vorheriger Screen erscheint

### 11.5 ESC from Custom Time Input

- **Test:** ESC drücken in Custom Time Input
- **Erwartet:** Rückkehr zu Time Selection
- **Validierung:** Time Selection Screen erscheint

### 11.6 ESC from Comment Input

- **Test:** ESC drücken in Comment Input
- **Erwartet:** Rückkehr zu Time Selection
- **Validierung:** Time Selection Screen erscheint

### 11.7 ESC from Date Selection

- **Test:** ESC drücken in Date Selection
- **Erwartet:** Rückkehr zu Comment Input
- **Validierung:** Comment Input Screen erscheint

## 12. Error Recovery Tests

### 12.1 Error Alert Dismissal

- **Test:** Error-Alert erscheint und wird dismissed
- **Erwartet:** Rückkehr zum vorherigen Screen
- **Validierung:** Input bleibt erhalten

### 12.2 Multiple Errors

- **Test:** Mehrere Fehler hintereinander
- **Erwartet:** Jeder Fehler wird einzeln angezeigt
- **Validierung:** Alle Fehler werden behandelt

### 12.3 Error During Loading

- **Test:** Fehler während App-Loading
- **Erwartet:** Error-Screen wird angezeigt
- **Validierung:** App stürzt nicht ab

## 13. Data Validation Tests

### 13.1 Time Format Normalization

- **Test:** Verschiedene Zeitformate werden normalisiert
- **Testdaten:** "2h30m" → "2h 30m", "1,5h" → "1.5h"
- **Erwartet:** Korrekte Jira-konforme Formatierung
- **Validierung:** API erhält korrektes Format

### 13.2 Issue Key Extraction

- **Test:** Issue Keys werden aus URLs extrahiert
- **Testdaten:** "https://jira.example.com/browse/JTS-1234" → "JTS-1234"
- **Erwartet:** Korrekter Issue Key
- **Validierung:** API erhält Issue Key

### 13.3 Date Formatting

- **Test:** Datum wird korrekt formatiert
- **Erwartet:** ISO-Format für API
- **Validierung:** API erhält korrektes Datum

## 14. Performance Tests

### 14.1 Loading Performance

- **Test:** App startet innerhalb akzeptabler Zeit
- **Erwartet:** Loading abgeschlossen < 5 Sekunden
- **Validierung:** Timing-Messung

### 14.2 Navigation Performance

- **Test:** Navigation zwischen Screens ist responsiv
- **Erwartet:** Navigation < 500ms
- **Validierung:** Timing-Messung

### 14.3 API Response Handling

- **Test:** Langsame API-Responses werden behandelt
- **Erwartet:** Spinner wird angezeigt
- **Validierung:** Loading-Indikator sichtbar

## 15. Integration Tests

### 15.1 Complete Happy Path

- **Test:** Kompletter Workflow von Start bis Success
- **Schritte:** Start → Log Work → Favorites → Issue Select → Time → Comment → Date → Success
- **Erwartet:** Erfolgreiches Worklog
- **Validierung:** Success-Meldung und Rückkehr zum Main Menu

### 15.2 Complete Error Path

- **Test:** Workflow mit verschiedenen Fehlern
- **Schritte:** Start → Fehler → Recovery → Success
- **Erwartet:** Fehlerbehandlung und Recovery
- **Validierung:** App bleibt stabil

### 15.3 Mixed Input Types

- **Test:** Verschiedene Input-Typen kombiniert
- **Schritte:** Manual Input → Custom Time → Custom Date
- **Erwartet:** Alle Inputs werden korrekt verarbeitet
- **Validierung:** API erhält korrekte Daten

## Test-Implementierungs-Prioritäten

### Priorität 1 (Critical)

- Main Menu Tests (2.1-2.3)
- Issue Selection Mode Tests (3.1-3.4)
- Complete Happy Path (15.1)

### Priorität 2 (High)

- Manual Issue Input Tests (5.1-5.6)
- Time Selection Tests (6.1-6.3)
- Custom Time Input Tests (7.1-7.4)
- Worklog Submission Tests (10.1-10.4)

### Priorität 3 (Medium)

- Comment Input Tests (8.1-8.4)
- Date Selection Tests (9.1-9.4)
- Navigation & ESC Tests (11.1-11.7)
- Error Recovery Tests (12.1-12.3)

### Priorität 4 (Low)

- Data Validation Tests (13.1-13.3)
- Performance Tests (14.1-14.3)
- Integration Tests (15.2-15.3)
