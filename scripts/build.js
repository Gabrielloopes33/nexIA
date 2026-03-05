const { execSync } = require('child_process');

// Clear the problematic environment variable
delete process.env.__NEXT_PRIVATE_STANDALONE_CONFIG;
delete process.env.__NEXT_PRIVATE_ORIGIN;

console.log('Building with clean environment...');

try {
  execSync('npx next build', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env
  });
} catch (error) {
  process.exit(1);
}
