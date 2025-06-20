# Karmyc Core Demo

Ce dossier contient les démonstrations de Karmyc Core avec deux configurations différentes :

## Structure

```
demo/
├── csr/                    # Version Client-Side Rendering (Vite)
├── ssr/                    # Version Server-Side Rendering (Next.js 14)
├── shared/                 # Configuration partagée
│   ├── config/
│   │   ├── karmycConfig.ts
│   │   ├── AreaInitializer.tsx
│   │   └── areas/
│   └── types/
├── App.tsx                 # Application CSR principale
├── vite.config.ts
└── package.json
```

## Configuration partagée

La configuration de Karmyc est maintenant centralisée dans `shared/config/karmycConfig.ts` et peut être utilisée par les deux versions (CSR et SSR) sans modification.

## Scripts disponibles

### Version CSR (Client-Side Rendering)
```bash
# Développement
yarn demo:csr:dev

# Build
yarn demo:build
```

### Version SSR (Server-Side Rendering)
```bash
# Développement
yarn demo:ssr:dev

# Build
yarn demo:ssr:build

# Production
yarn demo:ssr:start
```

## Différences entre CSR et SSR

### CSR (Vite)
- Rendu côté client uniquement
- Chargement plus rapide pour les utilisateurs avec une connexion rapide
- Pas de contenu initial visible pendant le chargement

### SSR (Next.js 14)
- Rendu côté serveur avec hydratation côté client
- Meilleur SEO et performance perçue
- Affichage d'un placeholder pendant l'hydratation
- Support des métadonnées et optimisations Next.js

## Utilisation

Les deux versions utilisent exactement la même configuration Karmyc, garantissant une cohérence parfaite entre les modes de rendu.

Pour tester les deux versions en parallèle :
1. Lancez la version CSR : `yarn demo:csr:dev` (port 3000)
2. Lancez la version SSR : `yarn demo:ssr:dev` (port 3001)

## Développement

Pour ajouter de nouvelles fonctionnalités :
1. Modifiez la configuration dans `shared/config/karmycConfig.ts`
2. Ajoutez de nouveaux composants d'areas dans `shared/config/areas/`
3. Mettez à jour `shared/config/AreaInitializer.tsx` si nécessaire

Les changements seront automatiquement disponibles dans les deux versions. 
