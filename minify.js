import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, 'src', 'css', 'style.css');
const outputFile = path.join(__dirname, 'src', 'css', 'style.min.css');

try {
  // Ensure the target directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (!fs.existsSync(inputFile)) {
    console.warn(`Warning: Style input file does not exist yet at ${inputFile}. Creating basic empty styles.`);
    fs.writeFileSync(inputFile, '/* Vanilla Gorilla Styles */\n', 'utf8');
  }

  let css = fs.readFileSync(inputFile, 'utf8');

  // Strip CSS comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Compress whitespace
  css = css.replace(/\s+/g, ' ');

  // Remove spacing around structural elements
  css = css.replace(/\s*([\{\}:;,])\s*/g, '$1');

  // Remove unnecessary trailing semicolons before closing braces
  css = css.replace(/;}/g, '}');

  // Trim leading and trailing whitespace
  css = css.trim();

  fs.writeFileSync(outputFile, css, 'utf8');
  console.log(`CSS minified successfully: ${outputFile}`);
} catch (err) {
  console.error('Minification failed:', err);
  process.exit(1);
}
