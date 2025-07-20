Du sollst ESLint-Regel Violations für die GitHub Issues $ARGUMENTS systematisch beheben.

## Workflow

Für jede ESLint-Regel:

1. **Violations prüfen**: `npm run lint` ausführen um aktuelle Violations zu sehen
2. **Automatische Fixes versuchen**: `npm run lint:fix` ausführen um Violations automatisch zu beheben
3. **Tests prüfen**: `npm test` ausführen um sicherzustellen dass Auto-Fixes nichts kaputt gemacht haben
4. **Manuelle Fixes falls nötig**: Wenn Auto-Fix fehlschlägt oder Tests fehlschlagen, manuelle Fixes durchführen
5. **Finale Verifikation**: `npm test` erneut ausführen um sicherzustellen dass alle Fixes funktionieren
6. **Changes committen**: Einen Commit für jede Regel mit aussagekräftiger Message

## Wichtige Strategien

**Immer zuerst Auto-Fix versuchen** bevor manuelle Fixes:
- `npm run lint` → `npm run lint:fix` → `npm test`
- Nur wenn das nicht funktioniert, manuelle Fixes

**Für manuelle Fixes**:
- Helper-Methoden erstellen für häufige Patterns (wie setTimeout in Tests)
- Test-spezifische Rule-Overrides in package.json XO config wenn nötig
- Code refactoring um Rule-Patterns zu befolgen

**Beispiel Helper-Methoden Pattern**:
Für Rules wie `no-promise-executor-return` in Tests:

```typescript
// In InkTestHelpers
delay(ms: number): Promise<void> {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Configuration Override Pattern** in package.json:
```json
{
  "xo": {
    "overrides": [
      {
        "files": ["source/tests/**/*.ts"],
        "rules": {
          "@typescript-eslint/no-empty-function": "off"
        }
      }
    ]
  }
}
```

Immer den schnellsten Weg (Auto-Fix) zuerst versuchen, dann auf durchdachte manuelle Fixes zurückgreifen.