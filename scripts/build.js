const { execSync } = require('child_process');

// Clear problematic Next.js private environment variables that may be injected
// by the parent shell/IDE and cause "TypeError: generate is not a function".
delete process.env.__NEXT_PRIVATE_STANDALONE_CONFIG;
delete process.env.__NEXT_PRIVATE_ORIGIN;
delete process.env.__NEXT_PRIVATE_RUNTIME_TYPE;
delete process.env.NEXT_OTEL_FETCH_DISABLED;
delete process.env.NEXT_DEPLOYMENT_ID;

console.log('Building with clean environment...');

try {
  execSync('npx next build', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  });
} catch (error) {
  process.exit(1);
}
