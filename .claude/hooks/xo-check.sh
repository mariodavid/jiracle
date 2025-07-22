#!/bin/bash

# XO quality gate hook - blocks Claude if XO finds violations
input_json=$(cat)

# Extract file path
tool_name=$(echo "$input_json" | jq -r '.tool_name // "unknown"')
file_path=$(echo "$input_json" | jq -r '.tool_input.file_path // ""')

# Skip if no file path
if [[ -z "$file_path" || "$file_path" == "null" ]]; then
    exit 0
fi

# Only run on JS/TS files
if [[ ! "$file_path" =~ \.(js|jsx|ts|tsx)$ ]]; then
    exit 0
fi

# Check if file exists
if [[ ! -f "$file_path" ]]; then
    exit 0
fi

# Change to the project directory
project_root=$(dirname "$file_path")
while [[ ! -f "$project_root/package.json" && "$project_root" != "/" ]]; do
    project_root=$(dirname "$project_root")
done

if [[ -f "$project_root/package.json" ]]; then
    cd "$project_root"
    
    # Run XO
    if command -v npx >/dev/null 2>&1; then
        xo_output=$(npx xo "$file_path" 2>&1)
        xo_exit_code=$?
        
        if [ $xo_exit_code -eq 0 ]; then
            exit 0
        else
            # Send XO violations to Claude via stderr
            echo "" >&2
            echo "❌ XO LINTING ISSUES DETECTED in: $file_path" >&2
            echo "" >&2
            echo "$xo_output" >&2
            echo "" >&2
            echo "Claude: You must fix these XO violations before proceeding. Please edit the file to resolve these issues." >&2
            echo "" >&2
            
            # Exit with code 2 - BLOCK and force Claude to react
            exit 2
        fi
    fi
fi

exit 0