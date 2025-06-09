import React from "react";
import { ControlledMenu, MenuItem, SubMenu } from '@szhsin/react-menu';

import { useContextMenuStore } from '../store/contextMenuStore';
import { actionRegistry } from '../actions/handlers/actionRegistry';
import { ContextMenuItem } from '../types';
import { useTranslation } from '../hooks/useTranslation';


// Fonction utilitaire récursive pour générer les items et sous-menus
function renderMenuItems(items: ContextMenuItem[], handleAction: (actionId: string, metadata?: Record<string, any>, option?: ContextMenuItem) => void) {
  const { t } = useTranslation();
  
  return items.map((item) => {
    if (item.children && item.children.length > 0) {
      return (
        <SubMenu key={item.id} label={t(`menu.${item.id}.label`, item.label)} disabled={item.disabled}>
          {renderMenuItems(item.children, handleAction)}
        </SubMenu>
      );
    }
    // Séparateur visuel
    if (item.actionId === 'area.separator' || item.label.match(/^[-\u2500]+$/)) {
      return <div key={item.id} style={{ margin: '4px 0', borderBottom: '1px solid #ccc' }} />;
    }
    return (
      <MenuItem
        key={item.id}
        disabled={item.disabled}
        onClick={() => handleAction(item.actionId, item.metadata, item)}
      >
        {item.icon && React.createElement(item.icon)}
        {t(`menu.${item.id}.label`, item.label)}
      </MenuItem>
    );
  });
}

export const ContextMenu: React.FC = () => {
  const isVisible = useContextMenuStore((state) => state.isVisible && state.menuType === 'default');
  const items = useContextMenuStore((state) => state.items);
  const position = useContextMenuStore((state) => state.position);
  const closeContextMenu = useContextMenuStore((state) => state.closeContextMenu);
  const metadata = useContextMenuStore((state) => state.metadata);
  const menuClassName = useContextMenuStore((state) => state.menuClassName);

  // À adapter selon la logique métier pour déclencher l'action
  const handleAction = (actionId: string, itemMetadata?: Record<string, any>, option?: ContextMenuItem) => {
    actionRegistry.executeAction(actionId, { ...metadata, ...itemMetadata });
    if (closeContextMenu) closeContextMenu();
  };

  if (!isVisible) return null;

  return (
    <ControlledMenu
      anchorPoint={position}
      state={isVisible ? 'open' : 'closed'}
      onClose={closeContextMenu}
      transition
      direction="right"
      menuClassName={menuClassName}
    >
      {renderMenuItems(items, handleAction)}
    </ControlledMenu>
  );
};
