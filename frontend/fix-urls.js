const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace double quote literal
      const newContent = content.replace(/"http:\/\/127\.0\.0\.1:8001([^"]*)"/g, "`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://127.0.0.1:8001'}$1`");

      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated URLs in ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);
