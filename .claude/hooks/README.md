# Claude Code XO Quality Gate

Automatic XO linting enforcement for Claude Code edits.

## How It Works

When Claude edits JS/TS files, the hook:
1. ✅ Runs XO linting 
2. ❌ Blocks operation if violations found
3. 🔄 Claude receives feedback and automatically fixes issues

## Setup

Already configured in `.claude/settings.json` - works automatically.

## Testing

Create a test file with violations:

```bash
cat > source/test-violations.tsx << 'EOF'
import React from 'react';

function TestComponent() {
	var unused = 'this variable is unused';
	let name = 'test'
	
	console.log("Double quotes violation");
	
	return <div>Hello {name}</div>;
}
export default TestComponent;
EOF
```

Ask Claude to edit this file → hook will trigger and violations will be automatically fixed.

## Troubleshooting

- **Hook not running?** Check `.claude/settings.json` and ensure `chmod +x .claude/hooks/xo-check.sh`
- **XO not found?** Run `npm install`  
- **Disable temporarily?** Add `exit 0` at top of `xo-check.sh`