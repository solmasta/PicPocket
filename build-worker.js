import { build } from 'esbuild';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildWorker() {
  try {
    // Create the dist directory if it doesn't exist
    const distDir = join(__dirname, 'dist');
    
    // Bundle the worker
    await build({
      entryPoints: ['worker.js'],
      bundle: true,
      outfile: 'dist/_worker.js',
      format: 'esm',
      target: 'es2022',
      minify: true,
      sourcemap: false,
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });

    console.log('Worker built successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildWorker();