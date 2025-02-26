import { createSelector } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux'
import { RootState } from '../../../store/store'
import { FormControl, Grid, Button } from '@chakra-ui/react'
import FormLabel from '../FormLabel'
import { useMemo, memo } from 'react'

// Constante pour le tableau vide
const EMPTY_ARRAY: readonly any[] = Object.freeze([])

interface ComponentsState {
  present: {
    components: {
      root?: {
        params?: Array<{name: string}>
      }
    }
  }
}

// Cache global pour les paramètres
const paramsCache = new WeakMap()

// Sélecteur de base avec cache
const selectRootParams = (state: RootState) => {
  const components = (state.components as ComponentsState).present.components
  
  if (!components.root?.params) {
    return EMPTY_ARRAY
  }
  
  // Utiliser le cache existant si disponible
  if (paramsCache.has(components.root)) {
    return paramsCache.get(components.root)
  }
  
  // Sinon créer et mettre en cache
  const params = Object.freeze([...components.root.params])
  paramsCache.set(components.root, params)
  return params
}

// Créer un cache pour les options
const optionsCache = new Map<string, readonly { value: string; label: string }[]>()

interface Param {
  name: string
}

// Sélecteur mémorisé avec cache manuel
const selectParamOptions = createSelector(
  [selectRootParams],
  (params: readonly Param[]) => {
    if (params === EMPTY_ARRAY) return EMPTY_ARRAY

    // Créer une clé unique pour le cache basée sur les noms des paramètres
    const cacheKey = params.map(p => p.name).join('|')
    
    if (!optionsCache.has(cacheKey)) {
      // Créer et geler les nouvelles options
      const options = Object.freeze(
        params.map(param => Object.freeze({
          value: `$${param.name}`,
          label: param.name,
        }))
      )
      optionsCache.set(cacheKey, options)
    }
    
    return optionsCache.get(cacheKey)!
  }
)

interface ParamSelectorProps {
  name: string
  label?: string
  onChange?: (value: string) => void
  value?: string
}

const ParamSelector: React.FC<ParamSelectorProps> = ({ 
  name, 
  label, 
  onChange,
  value 
}) => {
  const paramOptions = useSelector(selectParamOptions)
  
  const handleChange = useMemo(() => 
    (newValue: string) => onChange?.(newValue),
    [onChange]
  )

  // Mémoriser le rendu des options
  const renderedOptions = useMemo(() => 
    paramOptions.map(option => (
      <Button
        key={option.value}
        size="sm"
        variant={value === option.value ? "solid" : "outline"}
        onClick={() => handleChange(option.value)}
        width="100%"
      >
        {option.label}
      </Button>
    )),
    [paramOptions, value, handleChange]
  )

  return (
    <FormControl>
      {label && <FormLabel name={name}>{label}</FormLabel>}
      <Grid templateColumns="1fr" gap={2}>
        {renderedOptions}
      </Grid>
    </FormControl>
  )
}

// Mémoriser le composant avec une fonction de comparaison personnalisée
export default memo(ParamSelector, (prevProps, nextProps) => {
  return prevProps.name === nextProps.name &&
         prevProps.value === nextProps.value &&
         prevProps.label === nextProps.label &&
         prevProps.onChange === nextProps.onChange
}) 
