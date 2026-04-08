# Gestion des Ordonnances PDF

## Modifications de la Base de Données

Les colonnes suivantes ont été ajoutées à la table `ordonnances` :

### Nouvelles Colonnes

```sql
ALTER TABLE ordonnances ADD COLUMN IF NOT EXISTS chemin_pdf TEXT DEFAULT NULL;
ALTER TABLE ordonnances ADD COLUMN IF NOT EXISTS statut_pdf VARCHAR(20) DEFAULT 'non_genere' CHECK (statut_pdf IN ('non_genere', 'genere', 'erreur'));
ALTER TABLE ordonnances ADD COLUMN IF NOT EXISTS date_generation TIMESTAMP DEFAULT NULL;
```

### Nouveaux Index

```sql
CREATE INDEX IF NOT EXISTS idx_ordonnances_consultation ON ordonnances(id_consultation);
CREATE INDEX IF NOT EXISTS idx_ordonnances_statut ON ordonnances(statut_pdf);
```

## Structure des Colonnes

| Colonne           | Type        | Description                                           |
| ----------------- | ----------- | ----------------------------------------------------- |
| `chemin_pdf`      | TEXT        | Chemin complet du fichier PDF généré                  |
| `statut_pdf`      | VARCHAR(20) | État de génération : `non_genere`, `genere`, `erreur` |
| `date_generation` | TIMESTAMP   | Date/heure de génération du PDF                       |

## API Endpoints

### 1. Générer un PDF d'ordonnance

**POST** `/api/ordonnances/:ordonnance_id/generate-pdf`

**Authentification:** Bearer Token requis

**Réponse succès (200):**

```json
{
  "success": true,
  "message": "PDF généré avec succès",
  "data": {
    "pdfPath": "/path/to/file/ordonnance_123_1234567890.pdf",
    "pdfFileName": "ordonnance_123_1234567890.pdf",
    "downloadUrl": "/api/ordonnances/123/download"
  }
}
```

**Comportement:**

- Génère un PDF avec les informations du médecin, du patient et les médicaments
- Met à jour `statut_pdf` à `'genere'` et `date_generation`
- Stocke le chemin du fichier dans `chemin_pdf`
- En cas d'erreur, met à jour `statut_pdf` à `'erreur'`

### 2. Télécharger un PDF d'ordonnance

**GET** `/api/ordonnances/:ordonnance_id/download`

**Authentification:** Bearer Token requis

**Réponse:** Le fichier PDF en téléchargement

**Conditions:**

- Le PDF doit avoir été généré (`statut_pdf = 'genere'`)
- L'ordonnance doit appartenir au patient connecté
- Le fichier doit exister physiquement

### 3. Vérifier le statut de génération

**GET** `/api/ordonnances/:ordonnance_id/status`

**Authentification:** Bearer Token requis

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "ordonnance_id": 123,
    "statut": "genere",
    "date_generation": "2024-04-08T10:30:00.000Z",
    "isPDFGenerated": true
  }
}
```

## Flux de Génération

```
1. Médecin prescrit une ordonnance
   ↓
2. Ordonnance insérée avec statut_pdf = 'non_genere'
   ↓
3. Patient/App demande la génération du PDF
   ↓
4. API génère le PDF et stocke le chemin
   ↓
5. statut_pdf = 'genere' + date_generation définie
   ↓
6. Patient peut télécharger le PDF
```

## Exemple d'utilisation (Frontend)

### Générer un PDF

```javascript
const ordonnanceId = 123;
const token = localStorage.getItem("token");

const res = await fetch(`/api/ordonnances/${ordonnanceId}/generate-pdf`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await res.json();
if (data.success) {
  console.log("PDF généré:", data.data.downloadUrl);
}
```

### Vérifier le statut

```javascript
const res = await fetch(`/api/ordonnances/${ordonnanceId}/status`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await res.json();
console.log("Statut:", data.data.statut);
console.log("Est généré:", data.data.isPDFGenerated);
```

### Télécharger le PDF

```javascript
const link = document.createElement("a");
link.href = `/api/ordonnances/${ordonnanceId}/download`;
link.download = `ordonnance_${ordonnanceId}.pdf`;
link.click();
```

## Configuration

### Répertoire de stockage

Les PDFs sont stockés dans : `/Back_end/uploads/ordonnances/`

Ce répertoire est créé automatiquement au démarrage du serveur s'il n'existe pas.

### Dépendances

Le contrôleur utilise la librairie `pdfkit` :

```bash
npm install pdfkit
```

Assurez-vous que c'est installé dans `package.json`.

## Gestion d'erreurs

### Cas d'erreur possibles

1. **Ordonnance non trouvée (404)**
   - L'ID d'ordonnance fourni n'existe pas

2. **Accès non autorisé (403)**
   - L'ordonnance n'appartient pas au patient connecté

3. **PDF non disponible (400)**
   - Le PDF n'a pas encore été généré
   - statut_pdf n'est pas 'genere'

4. **Erreur de génération (500)**
   - Problème lors de la création du PDF
   - Libre espace disque insuffisant
   - Permissions d'accès insuffisantes

## Note importante

- Les PDFs générés restent sur le serveur et occupent de l'espace disque
- Prévoir une politique de suppression des anciens PDFs si nécessaire
- Les chemins sont stockés en base de données pour traçabilité
