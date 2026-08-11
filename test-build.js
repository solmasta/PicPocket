import { build } from 'esbuild';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testBuild() {
  try {
    console.log('Testing build process...');
    
    // Test if we can read the worker file
    const workerContent = await readFile(join(__dirname, 'worker.js'), 'utf-8');
    console.log('✓ Worker file found and readable');
    
    // Test building the worker
    await build({
      entryPoints: ['worker.js'],
      bundle: true,
      write: false,
      format: 'esm',
      target: 'es2022',
      minify: false,
    });
    
    console.log('✓ Worker builds successfully');
    console.log('Build test completed successfully!');
    
  } catch (error) {
    console.error('Build test failed:', error);
    process.exit(1);
  }
}

testBuild();