import { spawn } from 'child_process';

if (process.env.NEON_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.NEON_DATABASE_URL;
  console.log('Using Neon database:', process.env.DATABASE_URL.replace(/:([^@]+)@/, ':***@'));
} else {
  console.warn('NEON_DATABASE_URL not set — falling back to DATABASE_URL:', process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':***@'));
}

const child = spawn('node', ['dist/dist/index.js'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
