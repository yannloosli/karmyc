/**
 * Types d'actions pour les zones
 */
export const AREA_ACTION_TYPES = {
  ADD_AREA: 'area/addArea',
  REMOVE_AREA: 'area/removeArea',
  UPDATE_AREA: 'area/updateArea',
  SET_ACTIVE_AREA: 'area/setActiveArea',
  UPDATE_AREA_LAYOUT: 'area/updateAreaLayout',
};

/**
 * Types d'actions pour les menus contextuels
 */
export const CONTEXT_MENU_ACTION_TYPES = {
  OPEN_CONTEXT_MENU: 'contextMenu/openContextMenu',
  CLOSE_CONTEXT_MENU: 'contextMenu/closeContextMenu',
  OPEN_CUSTOM_CONTEXT_MENU: 'contextMenu/openCustomContextMenu',
};

/**
 * Types d'actions pour l'historique
 */
export const HISTORY_ACTION_TYPES = {
  UNDO: 'history/undo',
  REDO: 'history/redo',
  CLEAR_HISTORY: 'history/clearHistory',
  START_ACTION: 'history/startAction',
  SUBMIT_ACTION: 'history/submitAction',
  CANCEL_ACTION: 'history/cancelAction',
}; 
