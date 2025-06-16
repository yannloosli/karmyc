import React from "react";
import { ControlledMenu, MenuItem, SubMenu } from '@szhsin/react-menu';

import { useKarmycStore } from '@core/store';
import { actionRegistry } from '@core/registries/actionRegistry';
import { ContextMenuItem } from '@core/types/context-menu-types';
import { t } from '@core/utils/translation';

import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';

export const ContextMenu: React.FC = () => {
  const isVisible = useKarmycStore((state) => state.contextMenu.isVisible && state.contextMenu.menuType === 'default');
  const items = useKarmycStore((state) => state.contextMenu.items);

  const position = useKarmycStore((state) => state.contextMenu.position);
  const closeContextMenu = useKarmycStore((state) => state.contextMenu.closeContextMenu);
  const metadata = useKarmycStore((state) => state.contextMenu.metadata);
  const menuClassName = useKarmycStore((state) => state.contextMenu.menuClassName);

  // To be adapted according to business logic to trigger the action
  const handleAction = (actionId: string, itemMetadata?: Record<string, any>) => {
    actionRegistry.executeAction(actionId, { ...metadata, ...itemMetadata });
    if (closeContextMenu) closeContextMenu();
  };

  // Recursive utility function to generate items and submenus
  const renderMenuItems = (items: ContextMenuItem[], handleAction: (actionId: string, metadata?: Record<string, any>, option?: ContextMenuItem) => void) => {
    return Array.isArray(items) ? items.map((item) => {
      if (item.children && item.children.length > 0) {
        return (
          <SubMenu key={item.id} label={t(`menu.${item.id}.label`, item.label)} disabled={item.disabled}>
            {renderMenuItems(item.children, handleAction)}
          </SubMenu>
        );
      }
      // Visual separator
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
    }) : items;
  };


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
