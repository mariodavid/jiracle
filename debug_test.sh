#\!/bin/bash
result=$(node dist/cli.js workload add --issue NONEXISTENT-123 --date 2025-07-11 --time 2h --comment "Test comment" 2>&1)
echo "Exit code: $?"
echo "Full output: $result"
echo "Stderr contains Error: $(echo "$result" | grep -c "Error:")"
echo "Stderr contains JSON: $(echo "$result" | grep -c "{\"errorMessages\":")"

