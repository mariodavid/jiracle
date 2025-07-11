## Sortierung der Issues nach Name in der Tabellenansicht

### Beschreibung

In der aktuellen Wochenansicht von Jiracle werden die Jira Issues in einer Tabelle dargestellt. Die Issues sollten standardmäßig nach ihrem Namen (Issue Key) sortiert werden, um eine bessere Übersicht zu gewährleisten.

### Aktuelles Verhalten

Die Issues werden derzeit in der Reihenfolge angezeigt, wie sie von der Jira API zurückgegeben werden, ohne spezifische Sortierung.

### Gewünschtes Verhalten

Die Issues sollten in der Tabellenansicht alphabetisch nach Issue Key sortiert werden. Die Sortierung sollte automatisch und nicht optional sein.

### Implementierungsvorschlag

#### Intelligente Sortierung (Projekt-Prefix, dann Nummer)

```typescript
// In app.tsx nach dem Laden der Issues
const sortIssuesByKey = (issues: Issue[]) => {
	return issues.sort((a, b) => {
		// Teile Issue Key in Projekt und Nummer
		const [aProject, aNumber] = a.key.split('-');
		const [bProject, bNumber] = b.key.split('-');

		// Erst nach Projekt sortieren
		if (aProject !== bProject) {
			return aProject.localeCompare(bProject);
		}

		// Dann nach Nummer sortieren
		return parseInt(aNumber) - parseInt(bNumber);
	});
};

// In der State-Verwaltung
const loadIssues = async () => {
	const rawIssues = await fetchJiraIssues();
	const sortedIssues = sortIssuesByKey(rawIssues);
	setIssues(sortedIssues);
};
```

### Vorteile

- **Bessere Übersicht**: Zusammengehörige Issues (gleicher Projekt-Prefix) werden gruppiert
- **Konsistente Darstellung**: Issues erscheinen immer in der gleichen Reihenfolge
- **Leichteres Auffinden**: Spezifische Issues können schneller lokalisiert werden

### Akzeptanzkriterien

- [ ] Issues werden automatisch nach Issue Key sortiert (erst Projekt-Prefix, dann Nummer)
- [ ] Die Sortierung erfolgt bei jedem Laden der Daten
- [ ] Die Performance bleibt unverändert
- [ ] Die Fokus-Position bleibt nach der Sortierung erhalten

### Beispiel

Vorher (unsortiert):

- JTS-2456
- GVV-5417
- JTS-2457
- GVV-5419
- GVV-5420

Nachher (sortiert):

- GVV-5417
- GVV-5419
- GVV-5420
- JTS-2456
- JTS-2457
