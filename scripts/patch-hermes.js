const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.resolve('D:\\My-work_My-Everything\\TimeTrackOT\\node_modules\\react-native'),
  path.resolve('D:\\My-work_My-Everything\\TimeTrackOT\\node_modules\\react-native-reanimated'),
  path.resolve('D:\\My-work_My-Everything\\TimeTrackOT\\node_modules\\react-native-worklets'),
];

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(js|jsx|ts|tsx|mjs|cjs)$/.test(filePath)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

let patchedCount = 0;

for (const baseDir of targetDirs) {
  const allFiles = getAllFiles(baseDir);
  for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('#')) {
      let newContent = content.replace(/this\.#([a-zA-Z0-9_]+)/g, 'this._$1');
      newContent = newContent.replace(/^(\s*)#([a-zA-Z0-9_]+)(\s*[;:=])/gm, '$1_$2$3');
      newContent = newContent.replace(/^(\s*)#([a-zA-Z0-9_]+)\s*\(/gm, '$1_$2(');

      if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Cleaned:', path.relative(path.resolve('D:\\My-work_My-Everything\\TimeTrackOT'), file));
        patchedCount++;
      }
    }
  }
}

// Patch Event.js and DOMException.js Object.defineProperty to be writable
const eventJsPath = path.join(path.resolve('D:\\My-work_My-Everything\\TimeTrackOT'), 'node_modules', 'react-native', 'src', 'private', 'webapis', 'dom', 'events', 'Event.js');
if (fs.existsSync(eventJsPath)) {
  let content = fs.readFileSync(eventJsPath, 'utf8');
  if (!content.includes('writable: true')) {
    content = content.replace(/(Object\.defineProperty\([^\n]+,\s*\{[\s\n]*enumerable:\s*true,)/g, '$1\n  writable: true,\n  configurable: true,');
    fs.writeFileSync(eventJsPath, content, 'utf8');
    console.log('Patched Event.js read-only properties');
  }
}

const domExceptionPath = path.join(path.resolve('D:\\My-work_My-Everything\\TimeTrackOT'), 'node_modules', 'react-native', 'src', 'private', 'webapis', 'errors', 'DOMException.js');
if (fs.existsSync(domExceptionPath)) {
  let content = fs.readFileSync(domExceptionPath, 'utf8');
  if (!content.includes('writable: true')) {
    content = content.replace(/(Object\.defineProperty\([^\n]+,\s*\{[\s\n]*enumerable:\s*true,)/g, '$1\n    writable: true,\n    configurable: true,');
    fs.writeFileSync(domExceptionPath, content, 'utf8');
    console.log('Patched DOMException.js read-only properties');
  }
}

console.log(`Total files cleaned: ${patchedCount}`);

