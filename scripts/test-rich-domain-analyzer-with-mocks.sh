#!/bin/bash

# Extended Rich Domain Analyzer Tester with Mock Response Files
# Tests domain modeling analysis using predefined mock responses

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOCK_DIR="$SCRIPT_DIR/mock-responses"

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
    
    # Method 3: Conservative fallback
    if [[ -z "$RESULT" ]]; then
        print_status "$BLUE" "→ Method 3: File analysis fallback"
        RESULT="NO_ISSUES"
        print_status "$GREEN" "✓ Method 3 SUCCESS: $RESULT (default fallback)"
    fi
    
    # Final result
    case "$RESULT" in
        "IMPROVEMENTS_NEEDED")
            print_status "$YELLOW" "🏗️ RESULT: Domain modeling improvements needed"
            echo "  has_domain_issues=true"
            ;;
        "GOOD_PRACTICES"|"NO_ISSUES")
            print_status "$GREEN" "✅ RESULT: No domain issues found"
            echo "  has_domain_issues=false"
            ;;
        *)
            print_status "$RED" "⚠️ RESULT: Unexpected result '$RESULT'"
            echo "  has_domain_issues=false"
            ;;
    esac
    
    print_status "$BLUE" "  Final Result: $RESULT"
    echo
}

# Test with mock response files
test_with_mock_file() {
    local filename="$1"
    local scenario_name="$2"
    
    if [[ -f "$MOCK_DIR/$filename" ]]; then
        local response=$(cat "$MOCK_DIR/$filename")
        test_domain_analyzer_logic "$response" "$scenario_name"
    else
        print_status "$RED" "❌ Mock file not found: $MOCK_DIR/$filename"
    fi
}

# Main test execution
print_header "Rich Domain Analyzer Test Suite with Mock Responses"
print_status "$BLUE" "Using mock responses from: $MOCK_DIR"

# Test 1: Domain improvements needed
test_with_mock_file "domain-improvements-needed.txt" \
    "Domain Improvements Needed"

# Test 2: Good domain practices
test_with_mock_file "domain-good-practices.txt" \
    "Good Domain Practices"

# Test 3: No domain issues
test_with_mock_file "domain-no-issues.txt" \
    "No Domain Issues"

# Test 4: Real-world domain patterns check
print_header "Real Codebase Domain Pattern Analysis"
print_status "$BLUE" "Checking actual codebase for domain modeling patterns..."

# Check for existing domain patterns
DURATION_USAGE=$(find source -name "*.ts" -o -name "*.tsx" | xargs grep -l "Duration\|parseToMinutes\|toHours" 2>/dev/null | wc -l || echo "0")
WORKLOG_USAGE=$(find source -name "*.ts" -o -name "*.tsx" | xargs grep -l "WorklogEntry\|timeSpent.*string" 2>/dev/null | wc -l || echo "0")  
DATE_USAGE=$(find source -name "*.ts" -o -name "*.tsx" | xargs grep -l "LocalDate\|date.*string\|ISO.*date" 2>/dev/null | wc -l || echo "0")

echo "📊 Domain Pattern Usage:"
echo "  Duration pattern: $DURATION_USAGE files"
echo "  WorklogEntry pattern: $WORKLOG_USAGE files"  
echo "  Date handling: $DATE_USAGE files"
echo

if [[ $DURATION_USAGE -gt 0 ]]; then
    print_status "$GREEN" "✅ Good: Duration class is being used"
else
    print_status "$YELLOW" "⚠️ Opportunity: No Duration class usage found"
fi

if [[ $WORKLOG_USAGE -gt 3 ]]; then
    print_status "$YELLOW" "⚠️ Potential issue: Multiple files handling worklog data"
    print_status "$BLUE" "   Consider WorklogEntry value object"
fi

# Check for primitive obsession patterns
print_header "Primitive Obsession Detection"
print_status "$BLUE" "Scanning for common anti-patterns..."

PRIMITIVE_DATE_PATTERN=$(find source -name "*.ts" -o -name "*.tsx" | xargs grep -l "date.*string\|string.*date" 2>/dev/null | wc -l || echo "0")
PRIMITIVE_TIME_PATTERN=$(find source -name "*.ts" -o -name "*.tsx" | xargs grep -l "timeSpent.*string\|hours.*string" 2>/dev/null | wc -l || echo "0")
PRIMITIVE_ISSUE_PATTERN=$(find source -name "*.ts" -o -name "*.tsx" | xargs grep -l "issueKey.*string\|key.*string" 2>/dev/null | wc -l || echo "0")

echo "🚨 Primitive Obsession Patterns:"
echo "  String dates: $PRIMITIVE_DATE_PATTERN files"
echo "  String time durations: $PRIMITIVE_TIME_PATTERN files"
echo "  String issue keys: $PRIMITIVE_ISSUE_PATTERN files"
echo

if [[ $PRIMITIVE_DATE_PATTERN -gt 5 ]]; then
    print_status "$YELLOW" "🏗️ Consider: LocalDate value object for date handling"
fi

if [[ $PRIMITIVE_TIME_PATTERN -gt 3 ]]; then
    print_status "$YELLOW" "🏗️ Consider: Duration value object expansion"
fi

if [[ $PRIMITIVE_ISSUE_PATTERN -gt 5 ]]; then
    print_status "$YELLOW" "🏗️ Consider: IssueId value object for validation"
fi

print_header "Domain Modeling Recommendations"
print_status "$BLUE" "Based on time tracking domain analysis:"

echo "🎯 Focus Areas for Rich Domain Modeling:"
echo "  1. Duration - ✅ Already implemented well"
echo "  2. LocalDate - 🚧 Could be extracted from string dates"
echo "  3. WorklogEntry - 🚧 Currently using object literals"  
echo "  4. IssueId - 🚧 String validation could be encapsulated"
echo "  5. WeekRange - 🚧 Week calculation logic could be domain object"
echo

echo "📋 Implementation Strategy:"
echo "  - Start with most-used primitives (dates, issue keys)"
echo "  - Extract value objects for validation logic"
echo "  - Move business calculations into domain objects"
echo "  - Maintain backward compatibility during migration"

print_header "Test Summary"
print_status "$GREEN" "All domain modeling scenarios tested!"
print_status "$BLUE" "Mock files tested: domain-improvements-needed, domain-good-practices, domain-no-issues"
print_status "$BLUE" "Use this for debugging domain analysis workflow issues"
print_status "$PURPLE" "Focus: Primitive obsession → Rich domain types"