const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'assets', 'sounds', 'alarm.wav');
const DEST = path.join(__dirname, '..', 'modules', 'full-screen-alarm', 'android', 'src', 'main', 'res', 'raw', 'alarm.wav');

try {
  if (!fs.existsSync(SRC)) {
    console.warn('[sync-alarm] source not found:', SRC);
    process.exit(0);
  }
  fs.mkdirSync(path.dirname(DEST), { recursive: true });
  const srcBuf = fs.readFileSync(SRC);
  let needCopy = true;
  if (fs.existsSync(DEST)) {
    const dstBuf = fs.readFileSync(DEST);
    if (srcBuf.length === dstBuf.length && srcBuf.equals(dstBuf)) {
      needCopy = false;
    }
  }
  if (needCopy) {
    fs.copyFileSync(SRC, DEST);
    console.log(`[sync-alarm] copied ${ (srcBuf.length/1024).toFixed(0)}KB -> ${path.relative(path.join(__dirname,'..'), DEST)}`);
  } else {
    console.log('[sync-alarm] already in sync');
  }
} catch (e) {
  console.error('[sync-alarm] failed:', e.message);
}
