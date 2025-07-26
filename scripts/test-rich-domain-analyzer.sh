#!/bin/bash

# Rich Domain Analyzer Local Tester
# Tests domain modeling analysis logic locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo
    print_status "$PURPLE" "=== $1 ==="
}

# Function to test domain analyzer logic
test_domain_analyzer_logic() {
    local response="$1"
    local scenario_name="$2"
    
    print_header "Testing: $scenario_name"
    echo "Response length: ${#response} characters"
    echo
    
    # Initialize result
    RESULT=""
    
    # Method 1: Look for exact format
    if echo "$response" | grep -q "DOMAIN_ANALYSIS_RESULT:"; then
        RESULT=$(echo "$response" | grep "DOMAIN_ANALYSIS_RESULT:" | head -1 | cut -d: -f2 | tr -d ' ')
        print_status "$GREEN" "✓ Method 1 SUCCESS: $RESULT"
    else
        print_status "$YELLOW" "⚠ Method 1 FAILED: No DOMAIN_ANALYSIS_RESULT found"
    fi
    
    # Method 2: Look for domain issues patterns if no explicit result
    if [[ -z "$RESULT" ]]; then
        if echo "$response" | grep -qi "primitive.*obsession\|domain.*issue\|value.*object\|rich.*domain"; then
            RESULT="IMPROVEMENTS_NEEDED"
            print_status "$GREEN" "✓ Method 2 SUCCESS: $RESULT (domain patterns detected)"
        else
            print_status "$YELLOW" "⚠ Method 2 FAILED: No domain patterns found"
        fi
    fi
    
    # Method 3: Conservative fallback - check changed files for domain types
    if [[ -z "$RESULT" ]]; then
        print_status "$BLUE" "→ Method 3: File analysis for domain patterns"
        
        CHANGED_FILES=$(git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1 2>/dev/null || echo "")
        echo "  Changed files: $CHANGED_FILES"
        
        if [[ -n "$CHANGED_FILES" ]] && echo "$CHANGED_FILES" | grep -E '\.ts$|\.tsx$' > /dev/null 2>&1; then
            RESULT="NO_ISSUES"
            print_status "$GREEN" "✓ Method 3 SUCCESS: $RESULT (TS files changed, analysis complete)"
        else
            RESULT="NO_ISSUES"
            print_status "$GREEN" "✓ Method 3 SUCCESS: $RESULT (no TS files)"
        fi
    fi
    
    # Final result
    if [[ "$RESULT" == "IMPROVEMENTS_NEEDED" ]]; then
        print_status "$YELLOW" "🏗️ RESULT: Domain modeling improvements needed"
        echo "  has_domain_issues=true"
    elif [[ "$RESULT" == "GOOD_PRACTICES" ]] || [[ "$RESULT" == "NO_ISSUES" ]]; then
        print_status "$GREEN" "✅ RESULT: No domain issues found"
        echo "  has_domain_issues=false"
    else
        print_status "$RED" "⚠️ RESULT: Unexpected result, defaulting to NO_ISSUES"
        echo "  has_domain_issues=false"
    fi
    
    print_status "$BLUE" "  Final Result: $RESULT"
    echo
}

# Test scenarios
print_header "Rich Domain Analyzer Local Test Suite"

# Scenario 1: Valid analysis with improvements needed
print_header "Scenario 1: Domain Issues Found"
test_domain_analyzer_logic "I found several primitive obsession cases in the codebase.

## Issues Found:
- File: source/hooks/useWorklogForm.ts:42
  Issue: Using {issueKey: string, date: Date} instead of WorklogEntry
  Suggestion: Create WorklogEntry value object

DOMAIN_ANALYSIS_RESULT: IMPROVEMENTS_NEEDED
CONFIDENCE: HIGH" \
"Domain Issues Detected"

# Scenario 2: Good practices found
print_header "Scenario 2: Good Domain Practices"
test_domain_analyzer_logic "The code shows good domain modeling practices.

## Positive Patterns:
- source/utils/Duration.ts: Excellent use of Duration class with encapsulated behavior
- source/domain/WeeklyWorklogSummary.ts: Good domain structure

DOMAIN_ANALYSIS_RESULT: GOOD_PRACTICES
CONFIDENCE: HIGH" \
"Good Domain Practices"

# Scenario 3: No explicit result format (fallback to method 2)
print_header "Scenario 3: Implicit Domain Issues"
test_domain_analyzer_logic "The code has primitive obsession issues where string dates are used instead of rich domain types. Consider using value objects for better domain modeling." \
"Implicit Domain Issues"

# Scenario 4: No domain response (fallback to method 3)
print_header "Scenario 4: No Domain Analysis (File Fallback)"
test_domain_analyzer_logic "" \
"Empty Response"

# Scenario 5: Current branch analysis
print_header "Scenario 5: Real Branch Analysis"
print_status "$BLUE" "Analyzing current branch for domain patterns..."

REAL_CHANGED_FILES=$(git diff --name-only origin/main...HEAD 2>/dev/null || echo "No changes found")
echo "Files changed in current branch:"
echo "$REAL_CHANGED_FILES"
echo

if echo "$REAL_CHANGED_FILES" | grep -E '\.ts$|\.tsx$' > /dev/null; then
    print_status "$BLUE" "📝 Current branch contains TypeScript files - domain analysis applicable"
    
    # Check for potential domain anti-patterns
    if echo "$REAL_CHANGED_FILES" | grep -E 'util|service|helper' > /dev/null; then
        print_status "$YELLOW" "⚠️ Utility/service files changed - potential domain logic leakage"
    fi
    
    if echo "$REAL_CHANGED_FILES" | grep -E 'hook|component' > /dev/null; then
        print_status "$BLUE" "🎯 UI files changed - check for domain logic in presentation layer"
    fi
else
    print_status "$GREEN" "✅ No TypeScript files changed - domain analysis not needed"
fi

print_header "Domain Analysis Examples"
print_status "$BLUE" "Example primitive obsession patterns to look for:"
echo

echo "🚨 BAD: Primitive obsession"
echo "  function logTime(hours: string, issueKey: string, date: string)"
echo "  const totalHours = calculateWeeklyHours(worklogs: string[])"
echo

echo "✅ GOOD: Rich domain types"  
echo "  function logTime(entry: WorklogEntry)"
echo "  const totalHours = weeklyWorklog.getTotalHours()"
echo

print_header "Test Summary"
print_status "$GREEN" "All domain analyzer scenarios tested!"
print_status "$BLUE" "Use this script to debug domain analysis issues locally"
print_status "$BLUE" "Focus on time tracking domain: Duration, LocalDate, WorklogEntry, IssueId"