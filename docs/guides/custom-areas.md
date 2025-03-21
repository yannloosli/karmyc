# Guide: Créer et utiliser des zones personnalisées

Ce guide vous explique comment créer vos propres types de zones et les utiliser dans votre application avec le système Karmyc.

## Prérequis

- Avoir installé le package `@karmyc/layout` dans votre projet
- Avoir configuré le `KarmycProvider` dans votre application

## 1. Définir un composant pour votre zone personnalisée

Commencez par créer un composant React qui représentera votre zone. Ce composant doit accepter les propriétés suivantes :

```tsx
interface AreaComponentProps<T = any> {
    id: string;        // Identifiant unique de la zone
    state: T;          // État spécifique au type de zone
    width?: number;    // Largeur de la zone (optionnel)
    height?: number;   // Hauteur de la zone (optionnel)
    isActive?: boolean; // Indique si la zone est active (optionnel)
}

// Exemple de composant personnalisé
const MyCustomArea: React.FC<AreaComponentProps<{ content: string }>> = ({ 
    id, 
    state, 
    width = 300, 
    height = 200,
    isActive = false
}) => {
    return (
        <div 
            style={{ 
                width, 
                height, 
                background: isActive ? '#e6f7ff' : '#f0f0f0',
                border: isActive ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '4px',
                padding: '8px',
                overflow: 'auto'
            }}
        >
            <h3>Zone personnalisée</h3>
            <p>{state.content}</p>
        </div>
    );
};
```

## 2. Enregistrer votre type de zone

Utilisez le hook `useRegisterAreaType` pour enregistrer votre composant en tant que type de zone. Ce hook doit être appelé à un niveau élevé de votre application, généralement dans un composant qui est enfant direct du `KarmycProvider`.

```tsx
import { useRegisterAreaType } from '@karmyc/layout';

const Setup = () => {
    // Enregistrer un type de zone personnalisé
    useRegisterAreaType(
        'custom-area',                   // Identifiant du type de zone
        MyCustomArea,                    // Composant React pour la zone
        { content: 'Contenu initial' },  // État initial
        {
            displayName: 'Zone Personnalisée',  // Nom affiché dans l'interface
            icon: CustomIcon,                   // Icône optionnelle
            defaultSize: { width: 400, height: 300 }, // Taille par défaut
            supportedActions: ['edit', 'delete']     // Actions supportées
        }
    );
    
    return null;
};

// Dans votre application
const App = () => {
    return (
        <KarmycProvider>
            <Setup />
            <YourApplication />
        </KarmycProvider>
    );
};
```

## 3. Créer des instances de votre zone

Utilisez le hook `useArea` pour créer des instances de votre zone personnalisée :

```tsx
import { useArea } from '@karmyc/layout';

const ZoneCreator = () => {
    const { createArea } = useArea();
    
    const handleCreateArea = () => {
        createArea(
            'custom-area',                      // Type de zone
            { content: 'Nouvelle zone créée' }, // État initial spécifique
            { x: 100, y: 100 }                  // Position initiale (optionnel)
        );
    };
    
    return (
        <button onClick={handleCreateArea}>
            Créer une zone personnalisée
        </button>
    );
};
```

## 4. Gérer l'état de votre zone

Vous pouvez mettre à jour l'état de vos zones à tout moment en utilisant les fonctions fournies par le hook `useArea` :

```tsx
const ZoneManager = () => {
    const { areas, updateAreaState, deleteArea, setActive } = useArea();
    
    // Mettre à jour l'état d'une zone
    const updateContent = (areaId, newContent) => {
        updateAreaState(areaId, { content: newContent });
    };
    
    return (
        <div>
            {areas.map(area => (
                <div key={area.id}>
                    <button onClick={() => setActive(area.id)}>
                        Activer
                    </button>
                    <button onClick={() => updateContent(area.id, 'Contenu mis à jour')}>
                        Mettre à jour
                    </button>
                    <button onClick={() => deleteArea(area.id)}>
                        Supprimer
                    </button>
                </div>
            ))}
        </div>
    );
};
```

## 5. Ajouter des raccourcis clavier à votre zone

Vous pouvez ajouter des raccourcis clavier spécifiques à votre type de zone en utilisant le hook `useAreaKeyboardShortcuts` :

```tsx
import { useAreaKeyboardShortcuts } from '@karmyc/layout';

const KeyboardShortcutsSetup = () => {
    useAreaKeyboardShortcuts('custom-area', [
        {
            key: 'Delete',
            name: 'Supprimer la zone',
            fn: (areaId) => {
                // Logique pour supprimer la zone
            }
        },
        {
            key: 'S',
            modifierKeys: ['Control'],
            name: 'Sauvegarder le contenu',
            fn: (areaId, params) => {
                // Logique pour sauvegarder
            },
            history: true // Ajoutera cette action à l'historique (undo/redo)
        }
    ]);
    
    return null;
};
```

## 6. Initialiser votre application avec des zones prédéfinies

Vous pouvez initialiser votre application avec des zones prédéfinies en utilisant l'option `initialAreas` du `KarmycProvider` :

```tsx
const App = () => {
    return (
        <KarmycProvider 
            options={{
                initialAreas: [
                    {
                        type: 'custom-area',
                        state: { content: 'Zone prédéfinie 1' },
                        position: { x: 50, y: 50 }
                    },
                    {
                        type: 'custom-area',
                        state: { content: 'Zone prédéfinie 2' },
                        position: { x: 400, y: 50 }
                    }
                ],
                enableLogging: true
            }}
        >
            <Setup />
            <YourApplication />
        </KarmycProvider>
    );
};
```

## 7. Bonnes pratiques

- **Séparation des préoccupations** : Séparez la définition du composant, l'enregistrement du type et la création des instances.
- **État immuable** : Traitez l'état de vos zones comme immuable, n'essayez pas de le modifier directement.
- **Optimisation des performances** : Évitez les rendus inutiles en utilisant React.memo et useCallback.
- **Gestion des erreurs** : Gérez les cas d'erreur dans vos composants de zone pour éviter les crashs.

## Exemple complet

```tsx
import React, { useCallback } from 'react';
import { 
    KarmycProvider, 
    useRegisterAreaType, 
    useArea, 
    useAreaKeyboardShortcuts 
} from '@karmyc/layout';

// 1. Définir le composant de zone personnalisée
const TextEditorArea = React.memo(({ id, state, isActive }) => {
    const { content } = state;
    const { updateAreaState } = useArea();
    
    const handleChange = useCallback((e) => {
        updateAreaState(id, { content: e.target.value });
    }, [id, updateAreaState]);
    
    return (
        <div className={`text-editor ${isActive ? 'active' : ''}`}>
            <h3>Éditeur de texte</h3>
            <textarea 
                value={content} 
                onChange={handleChange}
                style={{ width: '100%', height: '180px' }}
            />
        </div>
    );
});

// 2. Composant de configuration
const Setup = () => {
    // Enregistrer le type de zone
    useRegisterAreaType(
        'text-editor',
        TextEditorArea,
        { content: '' },
        { displayName: 'Éditeur de texte' }
    );
    
    // Ajouter des raccourcis clavier
    useAreaKeyboardShortcuts('text-editor', [
        {
            key: 'S',
            modifierKeys: ['Control'],
            name: 'Sauvegarder',
            fn: (areaId, params) => {
                console.log('Sauvegarde du contenu de', areaId);
                // Logique de sauvegarde ici
            }
        }
    ]);
    
    return null;
};

// 3. Interface utilisateur
const Application = () => {
    const { createArea, areas, deleteArea, setActive } = useArea();
    
    return (
        <div className="application">
            <div className="toolbar">
                <button onClick={() => createArea('text-editor')}>
                    Nouvel éditeur de texte
                </button>
            </div>
            
            <div className="areas-list">
                <h3>Zones actives ({areas.length})</h3>
                {areas.map(area => (
                    <div key={area.id} className="area-item">
                        <span>ID: {area.id}</span>
                        <button onClick={() => setActive(area.id)}>Activer</button>
                        <button onClick={() => deleteArea(area.id)}>Supprimer</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 4. Application principale
const App = () => {
    return (
        <KarmycProvider 
            options={{ 
                enableLogging: true,
                initialAreas: [
                    { 
                        type: 'text-editor', 
                        state: { content: 'Ceci est un éditeur prédéfini.' },
                        position: { x: 100, y: 100 }
                    }
                ]
            }}
        >
            <Setup />
            <Application />
        </KarmycProvider>
    );
};

export default App;
```

## Ressources additionnelles

- Documentation complète de l'API : `/docs/api-reference.md`
- Exemples avancés : `/examples`
- Guide de débogage : `/docs/debugging.md`
