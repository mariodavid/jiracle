# Fix ESLint Rule

Du sollst eine spezifische ESLint-Regel beheben basierend auf dem GitHub Issue: $ARGUMENTS

## Workflow

Du sollst automatisch folgende Schritte ausführen:

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

### 5. Pull Request Erstellen
- Branch für die Regel erstellen
- Änderungen committen mit aussagekräftiger Commit-Message
- Pull Request mit detaillierter Beschreibung erstellen
- Issue im PR referenzieren

### 6. Pull Request Success verifizieren
- GH Actions Workflow per GH CLI abfragen
- Sicherstellen das erfolgreich durchlaufen wurde

## Wichtige Hinweise
- Validiere die GitHub Issue URL und stelle sicher dass es eine ESLint-Regel betrifft
- Bei Test-Failures führe entsprechende Code-Anpassungen durch
- Erstelle aussagekräftige Commit-Messages und PR-Beschreibungen
- Verwende die TodoWrite Tool um deinen Fortschritt zu verfolgen
- Das Repository verwendet XO ESLint-Konfiguration in package.json