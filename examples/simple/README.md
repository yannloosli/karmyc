# Exemple simple du Système de Layout

Cet exemple montre une utilisation basique du système de layout modulaire avec un seul type de zone.

## Structure du projet

```
examples/simple/
├── README.md          # Ce fichier
├── package.json       # Dépendances
├── tsconfig.json      # Configuration TypeScript
├── public/            # Fichiers statiques
└── src/
    ├── index.tsx      # Point d'entrée
    ├── App.tsx        # Composant principal
    ├── SimpleArea.tsx # Définition d'une zone simple
    └── styles.css     # Styles CSS
```

## Installation

```bash
cd examples/simple
npm install
# ou
yarn
```

## Exécution

```bash
npm start
# ou
yarn start
```

## Fonctionnalités démontrées

- Configuration de base avec KarmycProvider
- Enregistrement d'un type de zone personnalisé
- Utilisation du hook useArea pour créer et gérer des zones
- Affichage des zones avec AreaRoot
- Interaction basique avec les zones (sélection, déplacement, redimensionnement)

## Code source principal

### App.tsx

```tsx
import React from 'react';
import { KarmycProvider, AreaRoot } from '@karmyc';
import { SimpleArea } from './SimpleArea';
import { useRegisterAreaType, useArea } from '@karmyc';
import './styles.css';

// Composant d'application
function App() {
  // Enregistrer le type de zone simple
  useRegisterAreaType(
    'simple',
    SimpleArea,
    { content: 'Contenu initial', backgroundColor: '#f0f0f0' }
  );
  
  // Utiliser le hook useArea
  const { createArea, areas, activeArea, setActive, deleteArea } = useArea();
  
  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>Contrôles</h2>
        <button 
          onClick={() => 
            createArea('simple', { 
              content: `Zone ${areas.length + 1}`, 
              backgroundColor: getRandomColor() 
            })
          }
        >
          Créer une zone
        </button>
        
        {activeArea && (
          <button onClick={() => deleteArea(activeArea.id)}>
            Supprimer la zone active
          </button>
        )}
        
        <div className="areas-list">
          <h3>Zones ({areas.length})</h3>
          <ul>
            {areas.map(area => (
              <li 
                key={area.id}
                className={area.id === activeArea?.id ? 'active' : ''}
                onClick={() => setActive(area.id)}
              >
                Zone {area.id}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="main-content">
        <AreaRoot className="areas-container" />
      </div>
    </div>
  );
}

// Fonction utilitaire pour générer une couleur aléatoire
function getRandomColor() {
  const colors = [
    '#ffcccc', '#ccffcc', '#ccccff', 
    '#ffffcc', '#ffccff', '#ccffff'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Point d'entrée principal
export default function Root() {
  return (
    <KarmycProvider>
      <App />
    </KarmycProvider>
  );
}
```

### SimpleArea.tsx

```tsx
import React from 'react';
import { AreaComponentProps } from '@karmyc';

// Interface d'état pour notre zone simple
interface SimpleAreaState {
  content: string;
  backgroundColor: string;
}

// Composant de zone simple
export const SimpleArea: React.FC<AreaComponentProps<SimpleAreaState>> = ({
  width,
  height,
  left,
  top,
  areaState,
  areaId,
  isActive,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        backgroundColor: areaState.backgroundColor,
        padding: '16px',
        borderRadius: '4px',
        boxShadow: isActive 
          ? '0 0 0 2px #0066ff, 0 2px 4px rgba(0,0,0,0.1)' 
          : '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <h2>Zone {areaId}</h2>
      <p>{areaState.content}</p>
    </div>
  );
};
```

### styles.css

```css
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 250px;
  padding: 20px;
  background-color: #f8f9fa;
  border-right: 1px solid #e9ecef;
}

.main-content {
  flex-grow: 1;
  position: relative;
}

.areas-container {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  position: relative;
}

button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0069d9;
}

.areas-list {
  margin-top: 20px;
}

.areas-list ul {
  list-style: none;
  padding: 0;
}

.areas-list li {
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  background-color: #e9ecef;
  cursor: pointer;
}

.areas-list li.active {
  background-color: #007bff;
  color: white;
}
``` 
