// Prime Addis - Application entry point
// cPanel startup file → delegates to dist/index.js
import('./dist/index.js').catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
