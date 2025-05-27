# Refactorisation de Karmyc Core

## Prompt pour l'assistant

Je suis un assistant IA qui va vous aider à refactoriser Karmyc Core. Pour m'assurer de bien comprendre le contexte et les besoins, voici les points clés que je dois garder à l'esprit :

1. **Architecture existante**
   - Application React/Next.js
   - État géré par Zustand
   - Système de plugins
   - Areas et Spaces comme concepts principaux
   - Screens pour la gestion des vues

2. **Objectifs de la refactorisation**
   - Utiliser Y.js pour la synchronisation des données
   - Persister les données dans IndexedDB
   - Maintenir la compatibilité avec les plugins
   - Garder les composants UI fonctionnels

3. **Stack technique**
   - React/Next.js pour le frontend
   - NATS pour la messagerie
   - Apollo GraphQL pour les API
   - PayloadCMS pour le contenu
   - Docker pour le déploiement

4. **Points d'attention**
   - Ne pas casser l'existant
   - Garder une API cohérente
   - Assurer la performance
   - Maintenir la sécurité

5. **Contraintes**
   - Pas de migration de données nécessaire
   - Pas de période de transition
   - Pas de limite sur le nombre d'espaces ouverts
   - Sauvegarde automatique toutes les 15 minutes

Je dois toujours :
- Vérifier la compatibilité avec l'existant
- Proposer des solutions simples et maintenables
- Documenter les changements
- Assurer la sécurité
- Optimiser les performances

## Objectifs
- Utiliser Y.js pour la gestion des données des spaces
- Synchroniser les areas entre les screens
- Persister les données dans IndexedDB via Dexie.js
- Restructurer les données des spaces pour une meilleure utilisation d'IndexedDB
- Maintenir la compatibilité avec le système de plugins existant
- Garder les composants UI fonctionnels

## Structure des données

### Space
```typescript
interface Space {
  id: string;
  metadata: {
    name: string;
    description: string;
    createdAt: number;
    updatedAt: number;
  };
  config: {
    // configurations spécifiques
  };
  data: Y.Map<any>;
  plugins: Y.Map<{
    name: string;
    config: any;
    data: any;
  }>;
}
```

### Screen
```typescript
interface Screen {
  id: string;
  name: string;
  isDetached: boolean;
}
```

### Area
```typescript
interface Area {
  id: string;
  type: string;
  spaceId: string;
  screenId: string;
  // ... autres propriétés
}
```

## Stores

### SpaceStore (Zustand)
```typescript
interface SpaceStore {
  // État
  openSpaces: Set<string>;
  activeSpaceId: string | null;
  spaces: Record<string, Space>;
  
  // Actions
  openSpace: (id: string) => Promise<void>;
  closeSpace: (id: string) => void;
  setActiveSpace: (id: string | null) => void;
  saveSpace: (id: string) => Promise<void>;
  executePluginAction: (spaceId: string, pluginName: string, actionName: string, payload: any) => void;
}
```

### ScreenStore (Zustand)
```typescript
interface ScreenStore {
  // État
  screens: Record<string, Screen>;
  activeScreenId: string | null;
  
  // Actions
  addScreen: () => void;
  removeScreen: (id: string) => void;
  switchScreen: (id: string) => void;
  duplicateScreen: (id: string) => void;
}
```

### AreaStore (Zustand)
```typescript
interface AreaStore {
  // État
  areas: Record<string, Area>;
  activeAreaId: string | null;
  
  // Actions
  addArea: (area: Area) => void;
  removeArea: (id: string) => void;
  updateArea: (id: string, changes: Partial<Area>) => void;
  setActiveArea: (id: string | null) => void;
}
```

## Synchronisation

### Y.js Provider
```typescript
class YjsProvider {
  private space: Space;
  private provider: any; // WebSocket ou autre provider
  
  constructor(space: Space) {
    this.space = space;
    this.initializeProvider();
  }
  
  getMap(path: string): Y.Map<any> {
    return this.space.data.get(path);
  }
  
  destroy() {
    this.provider.destroy();
  }
}
```

### Plugin Sync
```typescript
class PluginSync {
  private space: Space;
  
  constructor(space: Space) {
    this.space = space;
  }
  
  syncPluginData(pluginName: string, data: any) {
    const pluginData = this.space.plugins.get(pluginName);
    if (pluginData) {
      pluginData.set('data', data);
    }
  }
  
  syncPluginConfig(pluginName: string, config: any) {
    const pluginData = this.space.plugins.get(pluginName);
    if (pluginData) {
      pluginData.set('config', config);
    }
  }
}
```

## Composants UI

### SpaceProvider
```typescript
const SpaceProvider: React.FC<SpaceProviderProps> = ({ children, spaceId }) => {
  const space = useSpace(spaceId);
  const yjsProvider = useYjsProvider(space);
  
  return (
    <YjsContext.Provider value={yjsProvider}>
      {children}
    </YjsContext.Provider>
  );
};
```

### Area Components
Les composants Area existants restent inchangés, mais utilisent les hooks Y.js pour les données partagées.

## Étapes de la refactorisation

1. **Préparation**
   - [ ] Installer les dépendances (Y.js, Dexie.js)
   - [ ] Créer les types et interfaces
   - [ ] Mettre en place la structure de base

2. **Migration des données**
   - [ ] Créer les stores Zustand
   - [ ] Implémenter le YjsProvider
   - [ ] Adapter les composants existants

3. **Synchronisation**
   - [ ] Implémenter la synchronisation des spaces
   - [ ] Implémenter la synchronisation des areas
   - [ ] Gérer la synchronisation des plugins

4. **Persistence**
   - [ ] Configurer Dexie.js
   - [ ] Implémenter la persistance des spaces
   - [ ] Implémenter la persistance des plugins

5. **Tests et validation**
   - [ ] Tester la synchronisation
   - [ ] Tester la persistence
   - [ ] Valider la compatibilité des plugins
   - [ ] Vérifier les performances

## Points d'attention

1. **Performance**
   - Utiliser le lazy loading pour les données des areas
   - Optimiser les mises à jour Y.js
   - Gérer efficacement la mémoire

2. **Compatibilité**
   - Maintenir la compatibilité avec les plugins existants
   - Assurer la rétrocompatibilité des données
   - Préserver l'API existante

3. **Sécurité**
   - Valider les données avant synchronisation
   - Gérer les erreurs de synchronisation
   - Protéger les données sensibles

## Notes importantes

- Les composants UI n'ont pas besoin de savoir que Y.js est utilisé
- La synchronisation est gérée au niveau du provider
- Les actions restent dans Zustand pour la réactivité UI
- Les données partagées sont automatiquement synchronisées
- Les plugins peuvent toujours fonctionner comme avant
- La persistance est automatique toutes les 15 minutes
- Pas de limite sur le nombre d'espaces ouverts
- Pas de système de versioning personnalisé (utilisation du versioning Y.js)

## Dépendances à installer

```bash
# Y.js et ses dépendances
yarn add yjs y-websocket y-indexeddb
```

## Persistance des données

### Architecture de persistance
```typescript
// spaces/yjs/provider.ts
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'

class SpaceProvider {
  private space: Space;
  private persistence: IndexeddbPersistence;
  
  constructor(space: Space) {
    this.space = space;
    // La persistance est automatique
    this.persistence = new IndexeddbPersistence(
      `space-${space.id}`,
      space.data
    );
  }
  
  destroy() {
    this.persistence.destroy();
  }
}
```

### Avantages de y-indexeddb
- Intégration native avec Y.js
- Persistance automatique
- Moins de code à maintenir
- Gestion automatique de la synchronisation entre onglets
- Optimisé pour Y.js

## Structure des dossiers

```
src/
├── spaces/                  # Gestion des spaces
│   ├── yjs/               # Configuration et gestion Y.js
│   │   ├── providers/     # Providers Y.js
│   │   └── sync/         # Logique de synchronisation
│   ├── db/                # Gestion IndexedDB
│   │   ├── schema/       # Schémas de base de données
│   │   └── migrations/   # Migrations si nécessaire
│   ├── stores/           # Store Zustand pour les spaces
│   └── types/            # Types spécifiques aux spaces
│
├── areas/                    # Gestion des areas
│   ├── components/          # Composants UI des areas
│   ├── hooks/              # Hooks spécifiques aux areas
│   ├── stores/             # Store Zustand pour les areas
│   └── types/              # Types spécifiques aux areas
│
├── ui/                     # Composants UI partagés
│   ├── common/           # Composants génériques
│   └── layout/           # Composants de mise en page
│
└── shared/                # Code partagé
    ├── types/            # Types partagés
    ├── utils/            # Utilitaires
    └── constants/        # Constantes
```

## Configuration Y.js

```typescript
// spaces/yjs/config.ts
export const YJS_CONFIG = {
  // Configuration du provider WebSocket
  websocket: {
    url: 'ws://localhost:1234', // À configurer selon l'environnement
    connect: true,
  },
  
  // Configuration de la persistance
  indexeddb: {
    database: 'karmyc-spaces',
    storeName: 'spaces',
  },
  
  // Configuration de la synchronisation
  sync: {
    debounceTime: 100, // ms
    autoSaveInterval: 15 * 60 * 1000, // 15 minutes
  },
};
```

## Configuration Dexie.js

```typescript
// spaces/db/schema.ts
import Dexie from 'dexie';

export class SpaceDatabase extends Dexie {
  spaces: Dexie.Table<Space, string>;
  pluginData: Dexie.Table<PluginData, string>;
  
  constructor() {
    super('karmyc-spaces');
    
    this.version(1).stores({
      spaces: 'id, name, createdAt, updatedAt',
      pluginData: 'id, spaceId, pluginName',
    });
  }
}

export const db = new SpaceDatabase();
```

## Hooks principaux à implémenter

```typescript
// spaces/hooks/useYjsProvider.ts
export function useYjsProvider(space: Space) {
  // ... implementation
}

// spaces/hooks/useSpaceData.ts
export function useSpaceData<T>(path: string) {
  // ... implementation
}

// spaces/hooks/usePluginData.ts
export function usePluginData(pluginName: string) {
  // ... implementation
}
```

## Tests à mettre en place

1. **Tests unitaires**
   - Tests des stores Zustand
   - Tests des providers Y.js
   - Tests de la persistance Dexie.js

2. **Tests d'intégration**
   - Tests de synchronisation entre clients
   - Tests de persistance des données
   - Tests de compatibilité des plugins

3. **Tests de performance**
   - Tests de charge avec plusieurs clients
   - Tests de mémoire avec beaucoup d'espaces
   - Tests de synchronisation avec beaucoup de données

## Points de contrôle

1. **Avant de commencer**
   - [ ] Vérifier que toutes les dépendances sont installées
   - [ ] Vérifier que la structure des dossiers est en place
   - [ ] Vérifier que les configurations sont correctes

2. **Pendant le développement**
   - [ ] Vérifier que les tests passent
   - [ ] Vérifier que la synchronisation fonctionne
   - [ ] Vérifier que la persistance fonctionne
   - [ ] Vérifier que les plugins fonctionnent

3. **Avant de déployer**
   - [ ] Vérifier que tous les tests passent
   - [ ] Vérifier que la documentation est à jour
   - [ ] Vérifier que les performances sont acceptables

## Ressources utiles

- [Documentation Y.js](https://docs.yjs.dev/)
- [Documentation Dexie.js](https://dexie.org/docs/Tutorial/Getting-started)
- [Documentation Zustand](https://github.com/pmndrs/zustand)

## Notes de développement

- Toujours utiliser les hooks fournis pour accéder aux données Y.js
- Ne pas accéder directement aux données Y.js dans les composants
- Utiliser les stores Zustand pour l'état local
- Utiliser Y.js pour les données partagées
- Utiliser Dexie.js pour la persistance

## Serveur WebSocket

### Solution recommandée : y-websocket-server

```typescript
// server/index.ts
import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'

const wss = new WebSocketServer({ port: 1234 })

wss.on('connection', setupWSConnection)
```

### Configuration Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 1234

CMD ["node", "server/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  yjs-server:
    build: .
    ports:
      - "1234:1234"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### Intégration avec la stack existante

1. **Next.js**
   - Le serveur Y.js peut être déployé séparément
   - Configuration du client dans `next.config.js` :
   ```javascript
   module.exports = {
     async rewrites() {
       return [
         {
           source: '/yjs',
           destination: 'ws://yjs-server:1234',
         },
       ]
     },
   }
   ```

2. **NATS**
   - Possibilité d'utiliser NATS comme transport pour Y.js
   - Nécessite un adaptateur personnalisé
   - Avantage : réutilisation de l'infrastructure existante

3. **Apollo GraphQL**
   - Les subscriptions GraphQL peuvent coexister avec Y.js
   - Séparation claire des responsabilités :
     - Y.js pour la synchronisation en temps réel
     - GraphQL pour les requêtes et mutations

4. **PayloadCMS**
   - Pas d'interaction directe nécessaire
   - Les données Y.js sont indépendantes du CMS

### Configuration du client

```typescript
// spaces/yjs/config.ts
export const YJS_CONFIG = {
  websocket: {
    url: process.env.NEXT_PUBLIC_YJS_WEBSOCKET_URL || 'ws://localhost:1234',
    connect: true,
  },
  // ... autres configurations
}
```

### Sécurité

1. **Authentification**
   ```typescript
   // server/index.ts
   import { WebSocketServer } from 'ws'
   import { setupWSConnection } from 'y-websocket/bin/utils'
   import { verifyToken } from './auth'

   const wss = new WebSocketServer({ port: 1234 })

   wss.on('connection', (ws, req) => {
     const token = req.headers['authorization']
     if (!verifyToken(token)) {
       ws.close()
       return
     }
     setupWSConnection(ws, req)
   })
   ```

2. **CORS**
   ```typescript
   // server/index.ts
   const wss = new WebSocketServer({
     port: 1234,
     cors: {
       origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
       methods: ['GET', 'POST'],
     },
   })
   ```

### Monitoring

1. **Logs**
   ```typescript
   // server/index.ts
   wss.on('connection', (ws, req) => {
     console.log(`New connection from ${req.socket.remoteAddress}`)
     setupWSConnection(ws, req)
   })
   ```

2. **Métriques**
   - Nombre de connexions actives
   - Taux de messages
   - Latence
   - Utilisation mémoire

### Déploiement

1. **Environnement de développement**
   ```bash
   docker-compose up -d yjs-server
   ```

2. **Environnement de production**
   ```bash
   # Build et push de l'image
   docker build -t your-registry/yjs-server:latest .
   docker push your-registry/yjs-server:latest

   # Déploiement
   kubectl apply -f k8s/yjs-server.yaml
   ```

### Ressources supplémentaires

- [Documentation y-websocket](https://github.com/yjs/y-websocket)
- [Exemples d'intégration avec Next.js](https://github.com/yjs/yjs-demos)
- [Meilleures pratiques de sécurité](https://docs.yjs.dev/ecosystem/connection-provider/websocket)
