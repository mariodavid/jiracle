# Fix ESLint Rules

Du sollst eine Liste von spezifischen ESLint-Regel beheben basierend auf den GitHub Issues: $ARGUMENTS

## Workflow

Du sollst automatisch folgende Schritte ausführen:

### 0. Branch anlegen

### 1. Issue Analyse
- GitHub Issue: $ARGUMENTS über GH CLI abrufen
- ESLint-Regel aus Issue-Titel extrahieren  
- Regel-Details und Beschreibung analysieren

### 2. Regel Aktivierung
- In `package.json` die entsprechende Regel von `"off"` entfernen
- XO-Konfiguration aktualisieren

### 3. Violations Beheben
- `npm run lint` ausführen um Violations zu identifizieren
- Alle gefundenen Violations automatisch beheben
- Code-Änderungen gemäß Regel-Anforderungen implementieren

### 4. Tests Sicherstellen
- `npm test` ausführen um sicherzustellen, dass alle Tests bestehen
- Bei Bedarf fehlende Tests ergänzen
- Test-Failures durch Code-Anpassungen beheben

### 5. Git Commit


## Vorgehen

Diese Schrite 1 - 5 sollen für jedes GH issue gemacht werden und es soll alles auf einen branch. Am ende soll ein PR erstellt werden.


## Wichtige Hinweise
- Validiere die GitHub Issue URL und stelle sicher dass es eine ESLint-Regel betrifft
- Bei Test-Failures führe entsprechende Code-Anpassungen durch
- Erstelle aussagekräftige Commit-Messages und PR-Beschreibungen
- Verwende die TodoWrite Tool um deinen Fortschritt zu verfolgen
- Das Repository verwendet XO ESLint-Konfiguration in package.json