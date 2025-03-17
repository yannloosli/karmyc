import React, { useEffect, useRef } from 'react';
import { useContextMenu } from '../hooks/useContextMenu';

interface ContextMenuProps {
  children: React.ReactNode;
}

/**
 * Composant qui gère l'affichage du menu contextuel
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({ children }) => {
  const { isVisible, position, items, closeMenu } = useContextMenu();
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu lors d'un clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, closeMenu]);

  // Rendre le menu
  if (!isVisible) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <div
        ref={menuRef}
        className="context-menu"
        style={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          padding: '4px 0',
          minWidth: '150px',
        }}
      >
        {items.map((item) => {
          if (item.divider) {
            return <div key={item.id} className="context-menu-divider" />;
          }

          return (
            <div
              key={item.id}
              className={`context-menu-item ${item.disabled ? 'disabled' : ''}`}
              onClick={() => {
                if (!item.disabled && item.action) {
                  item.action();
                  closeMenu();
                }
              }}
              style={{
                padding: '8px 16px',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: item.disabled ? 0.5 : 1,
              }}
            >
              {item.icon && <span className="context-menu-icon">{item.icon}</span>}
              <span className="context-menu-label">{item.label}</span>
              {item.shortcut && (
                <span className="context-menu-shortcut">{item.shortcut}</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}; 
