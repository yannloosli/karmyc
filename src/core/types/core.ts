import { IActionPlugin, TActionValidator } from './actions';
import { IAreaLayout } from './area';
import { IStoreOptions } from './store';

/**
 * Options d'initialisation du module core
 */
export interface IInitializeOptions {
  plugins?: IActionPlugin[];
  validators?: Array<{ actionType: string; validator: TActionValidator }>;
  defaultAreaTypes?: string[];
  defaultLayout?: IAreaLayout;
}

/**
 * Configuration du module core
 */
export interface ICoreConfig extends IStoreOptions, IInitializeOptions {
  // Options supplémentaires spécifiques au module core
} 
