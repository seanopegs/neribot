console.log('Starting...')

import { join, dirname } from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { setupMaster, fork } from 'cluster'
import { watchFile, unwatchFile } from 'fs'
import cfonts from 'cfonts';
import { createInterface } from 'readline'
import Helper from './lib/helper.js'
import { token as expectedToken } from './token.js';

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(__dirname)
const { name, author } = require(join(__dirname, './package.json'))
const { say } = cfonts
const rl = createInterface(process.stdin, process.stdout)

say('Lightweight\nWhatsApp Bot', {
  font: 'chrome',
  align: 'center',
  gradient: ['red', 'magenta']
})
say(`'${name}' By @${author.name || author}`, {
  font: 'console',
  align: 'center',
  gradient: ['red', 'magenta']
})

var isRunning = false

async function checkTokenAndStart() {
  try {
    const response = await fetch('https://justpaste.it/2ji7c');
    const text = await response.text();

    const tokenMatches = text.match(/token: '([a-zA-Z0-9]+)','([0-9]+ [a-zA-Z]+ [0-9]+)/g);

    if (!tokenMatches) {
      console.error("Tidak ada token yang ditemukan di URL yang diberikan.");
      return;
    }

    let isValidToken = false;

    for (const tokenMatch of tokenMatches) {
      const matchParts = tokenMatch.match(/token: '([a-zA-Z0-9]+)','([0-9]+ [a-zA-Z]+ [0-9]+)/);
      
      if (!matchParts) {
        console.error("Format token tidak sesuai:", tokenMatch);
        continue;
      }

      const fetchedToken = matchParts[1].trim();
      const expirationDateStr = matchParts[2].trim();
      const expirationDate = new Date(expirationDateStr);

      if (fetchedToken === expectedToken) {
        const currentDate = new Date();
        if (currentDate <= expirationDate) {
          console.log("Token valid. Menjalankan skrip...");
          start('main.js');
          isValidToken = true;
          break;
        } else {
          console.error("Token sudah kadaluarsa.");
        }
      }
    }

    if (!isValidToken) {
      console.error("Tidak ada token valid yang ditemukan.");
    }

  } catch (error) {
    console.error("Terjadi kesalahan saat mengambil token:", error);
  }
}

function start(file) {
  if (isRunning) return;
  isRunning = true;
  let args = [join(__dirname, file), ...process.argv.slice(2)];
  say([process.argv[0], ...args].join(' '), {
    font: 'console',
    align: 'center',
    gradient: ['red', 'magenta']
  });
  setupMaster({
    exec: args[0],
    args: args.slice(1),
  });
  let p = fork();
  p.on('message', data => {
    console.log('[RECEIVED]', data);
    switch (data) {
      case 'reset':
        p.process.kill();
        isRunning = false;
        start.apply(this, arguments);
        break;
      case 'uptime':
        p.send(process.uptime());
        break;
    }
  });
  p.on('exit', (_, code) => {
    isRunning = false;
    console.error('Exited with code:', code);
    if (code === 0) return;
    watchFile(args[0], () => {
      unwatchFile(args[0]);
      start(file);
    });
  });
  if (!Helper.opts['test'])
    if (!rl.listenerCount()) rl.on('line', line => {
      p.emit('message', line.trim());
    });
}

checkTokenAndStart();
