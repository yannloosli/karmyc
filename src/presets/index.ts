import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

declare const require: {
  context(
    directory: string,
    useSubdirectories: boolean,
    regExp: RegExp
  ): {
    keys(): string[];
    (id: string): any;
  };
};

const loadPresets = () => {
  const presets: Record<string, any> = {}
  
  // Utiliser le contexte de webpack pour charger les fichiers JSON
  const context = require.context('./', false, /\.json$/)
  
  context.keys().forEach(key => {
    try {
      const preset = context(key)
      const name = key.replace('./', '').replace('.json', '')
      
      presets[name] = preset
    } catch (error) {
      console.error(`Error loading preset ${key}:`, error)
    }
  })
  
  return presets
}

export const defaultPresets = loadPresets() 
