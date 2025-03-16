import { IAreaState } from './area';
import { IContextMenuState } from './contextMenu';
import { IHistoryState } from './history';

/**
 * État global de l'application
 */
export interface IRootState {
  area: IAreaState;
  contextMenu: IContextMenuState;
  history: IHistoryState;
  // Autres slices à ajouter ici
}

/**
 * Options pour la création du store
 */
export interface IStoreOptions {
  preloadedState?: Partial<IRootState>;
  enablePersistence?: boolean;
  persistenceKey?: string;
  enableHistory?: boolean;
  maxHistorySize?: number;
  devTools?: boolean;
}

/**
 * Type pour le dispatch de l'application
 */
export type TAppDispatch = any; // Sera remplacé par le type réel une fois le store implémenté 
