# Dev Command Hub — Exporter

Export du cheatsheet **Dev Command Hub** (900 × 400 mm) en haute résolution **300 DPI** pour impression sur tapis de souris gaming.

## Prérequis

- **Node.js** ≥ 18
- **npm**

## Installation

```bash
npm install
```

> L'installation télécharge automatiquement Chromium via Playwright (`postinstall`).

## Utilisation

### Export par format

```bash
npm run export:png     # PNG 300 DPI (10630 × 4724 px)
npm run export:jpeg    # JPEG 300 DPI (qualité 95)
npm run export:tiff    # TIFF 300 DPI (compression LZW)
npm run export:pdf     # PDF vectoriel 900 × 400 mm
npm run export:all     # Tous les formats d'un coup
```

### Options avancées

Des options supplémentaires peuvent être passées après `--` :

```bash
# Export PNG en 600 DPI
npm run export:png -- --dpi 600

# Export JPEG qualité 80
npm run export:jpeg -- --quality 80

# Export dans un dossier spécifique
npm run export:png -- --output ./mes-exports

# Combinaison
npm run export:all -- --dpi 450 --output ./print-ready
```

| Option      | Défaut     | Description                          |
|-------------|------------|--------------------------------------|
| `--format`  | (via npm)  | `png`, `jpeg`, `tiff`, `pdf`, `all`  |
| `--dpi`     | `300`      | Résolution en points par pouce       |
| `--quality` | `95`       | Qualité JPEG/TIFF (1-100)            |
| `--output`  | `./output` | Dossier de sortie                    |

## Fichiers générés

Les fichiers sont créés dans le dossier `output/` (ou celui spécifié) :

| Format | Fichier                           | Taille approx. |
|--------|-----------------------------------|-----------------|
| PNG    | `dev-command-hub-300dpi.png`      | ~15-25 Mo       |
| JPEG   | `dev-command-hub-300dpi.jpeg`     | ~3-6 Mo         |
| TIFF   | `dev-command-hub-300dpi.tiff`     | ~20-40 Mo       |
| PDF    | `dev-command-hub-300dpi.pdf`      | ~1-2 Mo         |

## Résolutions de référence

| DPI | Pixels (900×400mm)    | Usage                    |
|-----|-----------------------|--------------------------|
| 150 | 5315 × 2362          | Aperçu écran             |
| 300 | 10630 × 4724         | Impression standard      |
| 450 | 15945 × 7087         | Impression haute qualité |

## Personnalisation

Le fichier source est `src/cheatsheet.html`. Modifiez-le puis relancez l'export.

## Structure du projet

```
dev-command-hub-exporter/
├── package.json          # Scripts npm et dépendances
├── README.md             # Ce fichier
├── src/
│   ├── cheatsheet.html   # Le cheatsheet (source)
│   └── export.js         # Script d'export
└── output/               # Fichiers générés (gitignore)
```

## Notes techniques

- **PNG/JPEG/TIFF** : Rendu via Playwright (`deviceScaleFactor`) puis conversion avec Sharp. Les métadonnées DPI sont injectées dans les fichiers.
- **PDF** : Export vectoriel natif Chromium — dimensions exactes 900 × 400 mm, idéal pour les imprimeurs.
- **Compatibilité** : Testé sur Windows, macOS et Linux.
 
 