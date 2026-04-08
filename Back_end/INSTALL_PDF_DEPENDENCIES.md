## Installation des dépendances pour la génération de PDFs

Vous devez installer `pdfkit` pour la génération des ordonnances en PDF.

### Étape 1 : Installer pdfkit

```bash
cd Back_end
npm install pdfkit
```

### Étape 2 : Vérifier l'installation

Vérifiez que `pdfkit` est bien ajouté à `package.json` :

```json
{
  "dependencies": {
    "pdfkit": "^0.13.0",
    ...autres dépendances
  }
}
```

### Étape 3 : Redémarrer le serveur

```bash
node server.js
```

### Dépannage

Si vous rencontrez une erreur de module manquant :

```bash
# Réinstallez toutes les dépendances
npm install

# Ou forcez la réinstallation de pdfkit
npm install --save pdfkit
```

### Vérification

Pour vérifier que tout fonctionne, exécutez :

```javascript
const PDFDocument = require("pdfkit");
console.log("PDFKit version:", require("pdfkit/package.json").version);
```

---

**Après installation**, les endpoints suivants seront disponibles :

- `POST /api/ordonnances/:id/generate-pdf` - Générer un PDF
- `GET /api/ordonnances/:id/download` - Télécharger un PDF
- `GET /api/ordonnances/:id/status` - Vérifier le statut
