import React, { useState } from 'react'
import {
  Box,
  Text,
  IconButton,
  Input,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  Button,
  ModalFooter,
} from '@chakra-ui/react'
import { DeleteIcon, EditIcon } from '@chakra-ui/icons'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { useAppDispatch } from '../../hooks/useAppDispatch'
import { deletePreset, updatePresetName, addPreset, RootComponents, Preset } from '../../store/slices/presetsSlice'
import DragItem from './DragItem'
import { defaultPresets } from '../../presets'
import { ComponentState } from '../../store/slices/componentsSlice'

interface PresetDragItem {
  id?: string
  name: string
  rootComponents: RootComponents
}

const PresetsList = () => {
  const presets = useSelector((state: RootState) => state.presets.presets)
  const dispatch = useAppDispatch()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedPreset, setSelectedPreset] = useState<{ id: string; name: string } | null>(null)

  const handleRename = (id: string, name: string) => {
    setSelectedPreset({ id, name })
    onOpen()
  }

  const handleDelete = (id: string) => {
    dispatch(deletePreset(id))
  }

  const handlePresetDrag = (preset: PresetDragItem) => {
    // Si le preset a un ID, c'est un preset personnalisé existant
    if (preset.id) {
      return
    }

    // Ne pas ajouter le preset au store s'il est déjà dans les presets personnalisés
    const existingPreset = Object.values(presets).find(p => p.name === preset.name)
    if (existingPreset) {
      console.log('Using existing preset:', existingPreset.id)
      return
    }

    // Créer un ID unique pour le preset
    const id = `${preset.name}-${Date.now()}`
    
    // Ajouter le preset au store Redux
    dispatch(addPreset({
      id,
      name: preset.name,
      rootComponents: preset.rootComponents
    }))
  }

  const getRootParentType = (preset: PresetDragItem) => {
    if (!preset.rootComponents?.component?.rootParentType) {
      // Si le rootParentType n'est pas défini, utiliser le type du composant racine
      const componentType = preset.rootComponents?.component?.type
      if (componentType) {
        return componentType
      }
      // Si pas de type, utiliser le nom du preset
      console.warn(`No type found for ${preset.name}, using name as fallback`)
      return preset.name
    }
    return preset.rootComponents.component.rootParentType
  }

  return (
    <Box>
      <Text fontSize="lg" fontWeight="bold" mb={4} color="whiteAlpha.900">
        Presets
      </Text>
      {/* Presets par défaut */}
      {Object.entries(defaultPresets).map(([name, preset]) => {
        try {
          const presetWithName: PresetDragItem = {
            name,
            rootComponents: (preset as any).rootComponents
          }
          const rootParentType = getRootParentType(presetWithName)
          if (!rootParentType) {
            console.warn(`No rootParentType found for preset ${name}`)
            return null
          }
          return (
            <Box key={name} position="relative">
              <DragItem
                id={name}
                type={name}
                label={name}
                rootParentType={rootParentType}
                isPreset={true}
                onDragStart={() => handlePresetDrag(presetWithName)}
              >
                {name}
              </DragItem>
            </Box>
          )
        } catch (error) {
          console.error(`Error processing preset ${name}:`, error)
          return null
        }
      })}

      {/* Presets personnalisés */}
      {Object.entries(presets)
        .filter(([id, preset]) => !Object.keys(defaultPresets).includes(preset.name))
        .map(([id, preset]) => {
          try {
            console.log('Processing custom preset:', id, preset)
            const presetDragItem: PresetDragItem = {
              id,
              name: preset.name,
              rootComponents: preset.rootComponents
            }
            const rootParentType = getRootParentType(presetDragItem)
            if (!rootParentType) {
              console.warn(`No rootParentType found for preset ${preset.name}`)
              return null
            }
            return (
              <Box key={id} position="relative">
                <DragItem
                  id={id}
                  type={id}
                  label={preset.name}
                  rootParentType={rootParentType}
                  isPreset={true}
                  onDragStart={() => handlePresetDrag(presetDragItem)}
                >
                  {preset.name}
                </DragItem>
                <Box position="absolute" right={2} top={1} zIndex={2}>
                  <IconButton
                    aria-label="Rename preset"
                    icon={<EditIcon />}
                    size="xs"
                    variant="ghost"
                    color="whiteAlpha.900"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRename(id, preset.name)
                    }}
                  />
                  <IconButton
                    aria-label="Delete preset"
                    icon={<DeleteIcon />}
                    size="xs"
                    variant="ghost"
                    color="whiteAlpha.900"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(id)
                    }}
                  />
                </Box>
              </Box>
            )
          } catch (error) {
            console.error(`Error processing preset ${preset.name}:`, error)
            return null
          }
        })}

      {/* Modal de renommage */}
      {selectedPreset && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Rename Preset</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl>
                <FormLabel>New Name</FormLabel>
                <Input
                  defaultValue={selectedPreset.name}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      dispatch(updatePresetName({
                        id: selectedPreset.id,
                        name: e.currentTarget.value
                      }))
                      onClose()
                    }
                  }}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.parentElement?.querySelector('input')
                  if (input) {
                    dispatch(updatePresetName({
                      id: selectedPreset.id,
                      name: input.value
                    }))
                    onClose()
                  }
                }}
              >
                Save
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  )
}

export default PresetsList 
