import { createSelector } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux'
import { RootState } from '../../../store/store'
import { FormControl, Grid, Button } from '@chakra-ui/react'
import FormLabel from '../FormLabel'
import { useMemo, memo } from 'react'

// Constante pour le tableau vide
const EMPTY_ARRAY: readonly any[] = Object.freeze([])

// Sélecteur de base qui retourne directement les paramètres
const selectParams = (state: RootState) => 
  state.components.present.components.root?.params ?? EMPTY_ARRAY

// Sélecteur mémorisé pour les options avec une référence stable
const selectParamOptions = createSelector(
  [selectParams],
  (params) => {
    if (params === EMPTY_ARRAY) return EMPTY_ARRAY
    
    // Créer un tableau d'options avec une référence stable
    const options = params.map(param => ({
      value: `$${param.name}`,
      label: param.name,
    }))
    
    return Object.freeze(options)
  }
)

interface ParamSelectorProps {
  name: string
  label?: string
  onChange?: (value: string) => void
  value?: string
}

const ParamSelector: React.FC<ParamSelectorProps> = memo(({ 
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
}, (prevProps, nextProps) => {
  return prevProps.name === nextProps.name &&
         prevProps.value === nextProps.value &&
         prevProps.label === nextProps.label &&
         prevProps.onChange === nextProps.onChange
}) 
