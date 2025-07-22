# Claude Code XO Quality Gate

This directory contains a simple hook system that enforces XO linting quality for TypeScript/JavaScript files.

## How It Works

When Claude Code edits any JS/TS/JSX/TSX file, the `xo-check.sh` hook automatically:

1. ✅ Runs XO linting on the edited file
2. ✅ If linting passes → continues normally  
3. ❌ If linting fails → **blocks the operation** and sends detailed error messages to Claude
4. 🔄 Claude receives the feedback and **automatically fixes the violations**

## Setup

1. **Hook is already configured** in `.claude/settings.json`
2. **XO must be available** in your project (`npm install` should provide it)
3. **Works automatically** - no manual intervention needed

## Example Workflow

```
Claude: *edits a TypeScript file with violations*
Hook: ❌ XO LINTING ISSUES DETECTED
      ✖ Unexpected var, use let or const instead
      ✖ Missing semicolon
Claude: *receives feedback and automatically fixes the violations*  
Hook: ✅ Linting passed
```

## Files

- `xo-check.sh` - The main quality gate hook
- `README.md` - This documentation

## Testing the Hook

To test the XO quality gate, create a file with violations:

```bash
# Create a test file with XO violations
cat > source/test-violations.tsx << 'EOF'
import React from 'react';

function TestComponent() {
	var unused = 'this variable is unused';
	let name = 'test'
	
	// Missing semicolon above
	console.log("Double quotes violation");
	
	const handleClick = (event: any) => {
		console.log('clicked');
	};
	
	return <div onClick={handleClick}>Hello {name}</div>;
}

export default TestComponent;
EOF
```

Now ask Claude to edit this file - the hook will trigger and Claude will automatically fix the violations!

### Manual Hook Testing

```bash
# Create a test JSON payload for manual testing
echo '{
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "./source/test-violations.tsx"
  }
}' | .claude/hooks/xo-check.sh

# Check exit code
echo $?
# 0 = linting passed
# 2 = linting failed (blocking error)
```

## Troubleshooting

**Hook not running?**
- Check `.claude/settings.json` has the PostToolUse hook configured
- Ensure `xo-check.sh` is executable: `chmod +x .claude/hooks/xo-check.sh`

**XO not found?**  
- Run `npm install` to ensure XO is available
- Check that `npx xo --version` works in your project

**Want to disable temporarily?**
- Remove the hook from `.claude/settings.json`
- Or add `exit 0` at the top of `xo-check.sh`