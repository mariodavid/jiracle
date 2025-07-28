#!/bin/bash

echo "Final targeted fix for test type issues..."

# Fix 1: FavoriteIssue.key should be IssueKey (these are correct)
echo "Fixing favorites to use IssueKey.fromString()..."
find source/tests -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s/{key: '\\([^']*\\)'}/{key: IssueKey.fromString('\\1')}/g"

# Fix 2: FocusableItem.issueKey should be string (revert these)
echo "Reverting FocusableItem issueKey to strings..."
find source/tests -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s/issueKey: IssueKey\.fromString('\\([^']*\\)')/issueKey: '\\1'/g"

# Fix 3: Add missing imports for files that use IssueKey.fromString
echo "Adding IssueKey imports where needed..."
files_to_fix=(
    "source/tests/app.navigation.test.ts"
    "source/tests/hooks/useDeleteOperations.test.tsx"
    "source/tests/hooks/useGridNavigation.test.ts"
    "source/tests/hooks/useIssueGroups.test.ts"
    "source/tests/hooks/useWorklogForm-validation.test.tsx"
    "source/tests/hooks/useWorklogForm.test.tsx"
    "source/tests/integration/comment-prefill.integration.test.tsx"
    "source/tests/jira-client.project-defaults.test.ts"
    "source/tests/jira-client.worklog.test.ts"
    "source/tests/jira/utils.test.ts"
    "source/tests/services/IssueGroupManager.test.ts"
    "source/tests/services/WorklogGroupService.test.ts"
    "source/tests/use-cases/WeeklyWorklogSummaryUseCase.basic.test.ts"
    "source/tests/utils/testUtils.ts"
)

for file in "${files_to_fix[@]}"; do
    if [ -f "$file" ] && grep -q "IssueKey.fromString" "$file" && ! grep -q "import.*IssueKey" "$file"; then
        # Add import after first import line
        sed -i '' '1a\
import {IssueKey} from '"'"'../../domain/IssueKey.js'"'"';\
' "$file"
    fi
done

echo "Final type fixes completed!"