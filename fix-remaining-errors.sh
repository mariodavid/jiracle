#!/bin/bash

echo "Fixing remaining test compilation errors..."

# Fix 1: Add missing IssueKey imports
echo "Adding missing IssueKey imports..."
files_needing_import=(
    "source/tests/use-cases/WeeklyWorklogSummaryUseCase/sliding-window/basic-scenarios.test.ts"
    "source/tests/utils/FocusableItemCalculator.test.ts"
)

for file in "${files_needing_import[@]}"; do
    if [ -f "$file" ] && grep -q "IssueKey.fromString" "$file" && ! grep -q "import.*IssueKey" "$file"; then
        # Add import after the first import line
        sed -i '' '1a\
import {IssueKey} from '"'"'../../domain/IssueKey.js'"'"';\
' "$file"
    fi
done

# Fix 2: Convert remaining LocalDate to .toDate() in WorklogEntry tests
echo "Fixing LocalDate to Date conversions..."
sed -i '' 's/date: LocalDate\.fromString(\([^)]*\))/date: LocalDate.fromString(\1).toDate()/g' source/tests/domain/WorklogEntry.test.ts

# Fix 3: Fix favorite issues to use IssueKey.fromString()
echo "Fixing favorite issue keys..."
find source/tests -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s/{key: '\\([^']*\\)', defaultTime:/{key: IssueKey.fromString('\\1'), defaultTime:/g"

# Fix 4: Revert projects keys back to strings (they should not be IssueKey)
echo "Reverting project keys to strings..."
find source/tests -name "*.tsx" -o -name "*.ts" | xargs sed -i '' "s/{key: IssueKey\.fromString('\\([^']*\\)')}/{key: '\\1'}/g"

echo "Remaining error fixes completed!"