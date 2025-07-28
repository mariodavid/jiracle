#!/bin/bash

echo "Fixing test IssueKey compilation errors..."

# Fix 1: Convert string issueKey properties to IssueKey.fromString() in component props
echo "Fixing component prop issueKey strings..."
find source/tests -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s/issueKey: '\\([^']*\\)'/issueKey: IssueKey.fromString('\\1')/g"

# Fix 2: Convert key properties in mock JiraIssue objects  
echo "Fixing JiraIssue.key properties in mock data..."
find source/tests -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s/key: '\\([^']*\\)'/key: IssueKey.fromString('\\1')/g"

# Fix 3: Fix WorklogEntry.test.ts - fromApiResponse calls need string parameters
echo "Fixing WorklogEntry.test.ts fromApiResponse calls..."
sed -i '' "s/WorklogEntry\\.fromApiResponse(validApiEntry, '\\([^']*\\)')/WorklogEntry.fromApiResponse(validApiEntry, '\\1')/g" source/tests/domain/WorklogEntry.test.ts

echo "Test IssueKey fixes completed!"