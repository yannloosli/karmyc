import { LayerRegistry } from '../karmyc-layer-system';
import { TilemapEditorArea } from './src/TilemapEditorArea';
import { TilesetArea } from './src/TilesetArea';

LayerRegistry.register('tilemap-editor', TilemapEditorArea);
LayerRegistry.register('tileset', TilesetArea);

export * from './src/types';
export { TilemapEditorArea, TilesetArea };
