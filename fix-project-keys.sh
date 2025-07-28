#!/bin/bash

echo "Reverting project key conversions (keeping them as strings)..."

# Revert project key conversions - ProjectDefaults.key should be string
find source/tests -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s/projects: \\[{key: IssueKey.fromString('\\([^']*\\)')/projects: [{key: '\\1'/g"

# Fix any other project-related configurations
find source/tests -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s/{key: IssueKey.fromString('\\([^']*\\)'), /{key: '\\1', /g"

echo "Project key fixes completed!"