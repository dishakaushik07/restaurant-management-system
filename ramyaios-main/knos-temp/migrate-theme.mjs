import fs from 'fs';
import path from 'path';

const directoryPath = path.join(process.cwd(), 'src/app/dashboard');

function replaceColors(content) {
  let newContent = content;
  
  // Backgrounds
  newContent = newContent.replace(/bg-black/g, 'bg-page');
  newContent = newContent.replace(/bg-gray-950/g, 'bg-page');
  newContent = newContent.replace(/bg-gray-900/g, 'bg-panel');
  newContent = newContent.replace(/bg-gray-800/g, 'bg-panel-hover');
  
  // Borders
  newContent = newContent.replace(/border-gray-900/g, 'border-border-subtle');
  newContent = newContent.replace(/border-gray-800/g, 'border-border-subtle');
  newContent = newContent.replace(/border-gray-700/g, 'border-border-subtle');
  
  // Text
  newContent = newContent.replace(/text-white/g, 'text-text-main');
  newContent = newContent.replace(/text-gray-300/g, 'text-text-main');
  newContent = newContent.replace(/text-gray-400/g, 'text-text-muted');
  newContent = newContent.replace(/text-gray-500/g, 'text-text-muted');

  return newContent;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const updatedContent = replaceColors(content);
      if (content !== updatedContent) {
        fs.writeFileSync(fullPath, updatedContent, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);
console.log('Migration complete!');
