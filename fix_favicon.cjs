const fs = require('fs');
const b64 = fs.readFileSync('src/assets/LOGO.png').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <image href="data:image/png;base64,${b64}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet" />
</svg>`;
fs.writeFileSync('public/favicon.svg', svg);
