const fs = require('fs');
const path = require('path');

// Récupérer l'IP passée en argument
const targetIp = process.argv[2];

if (!targetIp) {
  console.log('❌ Veuillez spécifier une adresse IP ou "localhost".');
  console.log('Usage : node configure-frontend-ip.js <IP_DU_PI>');
  console.log('Exemple : node configure-frontend-ip.js 192.168.1.50');
  console.log('Pour revenir au mode local/dynamique : node configure-frontend-ip.js localhost');
  process.exit(1);
}

const frontendDir = path.join(__dirname, 'Front_end');

// Regex pour détecter la chaîne dynamique d'URL
const dynamicUrlRegex = /\(?\(?window\.location\.hostname\s*===\s*['"]localhost['"]\s*\|\|\s*window\.location\.hostname\s*===\s*['"]127\.0\.0\.1['"]\s*\|\|\s*!window\.location\.hostname\)?\s*\?\s*['"]http:\/\/localhost:5000['"]\s*:\s*['"]http:\/\/['"]\s*\+\s*window\.location\.hostname\s*\+\s*['"]:5000['"]\)?/g;

// Regex pour détecter une IP ou localhost déjà configuré
const configuredIpRegex = /['"]http:\/\/(?:\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|localhost):5000['"]/g;

const replacementValue = targetIp.toLowerCase() === 'localhost' 
  ? `((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname) ? 'http://localhost:5000' : 'http://' + window.location.hostname + ':5000')`
  : `'http://${targetIp}:5000'`;

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.html') || file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // 1. Remplacer la chaîne dynamique si elle est présente
      if (dynamicUrlRegex.test(content)) {
        content = content.replace(dynamicUrlRegex, replacementValue);
        modified = true;
      } 
      // 2. Ou remplacer l'IP précédemment configurée par la nouvelle
      else if (configuredIpRegex.test(content)) {
        content = content.replace(configuredIpRegex, replacementValue);
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Mis à jour : ${path.relative(__dirname, fullPath)}`);
      }
    }
  });
}

console.log(`⚙️  Configuration du frontend pour pointer vers le backend : ${targetIp}...`);
processDirectory(frontendDir);
console.log('🎉 Terminé ! Poussez les modifications sur Git pour les récupérer sur vos autres machines.');
