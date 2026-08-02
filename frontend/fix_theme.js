const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'app', 'dashboard');

const replacements = [
  { search: /bg-black\/40/g, replace: 'bg-bg-glass' },
  { search: /bg-black\/50/g, replace: 'bg-bg-card' },
  { search: /bg-black\/60/g, replace: 'bg-bg-tertiary' },
  { search: /bg-black\/20/g, replace: 'bg-bg-secondary' },
  { search: /bg-black\/30/g, replace: 'bg-bg-secondary' },
  { search: /bg-black\/80/g, replace: 'bg-bg-primary' },
  { search: /bg-black/g, replace: 'bg-bg-primary' },
  { search: /border-white\/5/g, replace: 'border-border-primary' },
  { search: /border-white\/10/g, replace: 'border-border-primary' },
  { search: /border-white\/20/g, replace: 'border-border-hover' },
  { search: /text-white\/10/g, replace: 'text-text-muted/30' },
  { search: /text-white\/70/g, replace: 'text-text-secondary' },
  { search: /text-white\/80/g, replace: 'text-text-secondary' },
  { search: /text-white\/90/g, replace: 'text-text-primary' },
  { search: /text-white/g, replace: 'text-text-primary' },
  { search: /bg-white\/5/g, replace: 'bg-bg-tertiary' },
  { search: /bg-white\/10/g, replace: 'bg-bg-tertiary' },
  { search: /bg-white\/20/g, replace: 'bg-bg-secondary' }
];

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const replacement of replacements) {
        content = content.replace(replacement.search, replacement.replace);
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);

// Also fix layout.tsx to default to light mode
const layoutPath = path.join(directoryPath, 'layout.tsx');
if (fs.existsSync(layoutPath)) {
  let layoutContent = fs.readFileSync(layoutPath, 'utf8');
  layoutContent = layoutContent.replace(/const \[isDark, setIsDark\] = useState\(true\);/g, 'const [isDark, setIsDark] = useState(false);');
  fs.writeFileSync(layoutPath, layoutContent, 'utf8');
  console.log(`Updated ${layoutPath} to default to light mode`);
}

console.log('Theme styling replaced globally for dashboard!');
