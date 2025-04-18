import _debug from 'debug';

// Default name if we can't import package.json
const DEFAULT_NAME = 'badma';

// Get app name from package.json
let packageName = DEFAULT_NAME;
try {
  // Dynamic import for package.json
  const packageJson = await import('../package.json', { assert: { type: 'json' } });
  packageName = packageJson.default.name;
} catch (error) {
  console.warn('Could not load package.json, using default name for debug');
}

// Initialize root debugger with package name
const rootDebug = _debug(packageName);

// Export function to create child debuggers
export default function Debug(namespace: string) {
  return rootDebug.extend(namespace);
} 