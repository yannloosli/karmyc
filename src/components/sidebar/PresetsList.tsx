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
import { deletePreset, updatePresetName, addPreset } from '../../store/slices/presetsSlice'
import DragItem from './DragItem'
import { defaultPresets } from '../../presets'
import { ComponentState } from '../../store/slices/componentsSlice'

interface Preset {
  name: string
  component: ComponentState
  components: Record<string, ComponentState>
}

interface RenameModalProps {
  isOpen: boolean
  onClose: () => void
  presetId: string
  currentName: string
}

const RenameModal = ({ isOpen, onClose, presetId, currentName }: RenameModalProps) => {
  const [newName, setNewName] = useState(currentName)
  const dispatch = useAppDispatch()

  const handleRename = () => {
    dispatch(updatePresetName({
      id: presetId,
      name: newName
    }))
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>Renommer le preset</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Nouveau nom</FormLabel>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Entrez un nouveau nom"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleRename}>
              Renommer
            </Button>
            <Button onClick={onClose}>Annuler</Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  )
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

  const handleDefaultPresetDrag = (name: string, preset: Preset) => {
    // Créer un ID unique pour le preset
    const id = `${name}-${Date.now()}`
    
    // Ajouter le preset au store Redux
    dispatch(addPreset({
      id,
      name,
      component: preset.component,
      components: preset.components
    }))
  }

  return (
    <Box>
      <Text fontSize="lg" fontWeight="bold" mb={4} color="whiteAlpha.900">
        Presets
      </Text>
      {Object.entries(defaultPresets as Record<string, Preset>).map(([name, preset]) => (
        <Box key={name} position="relative">
          <DragItem
            id={name}
            type={name}
            label={name}
            rootParentType={preset.component.rootParentType}
            isPreset={true}
            onDragStart={() => handleDefaultPresetDrag(name, preset)}
          >
            {name}
          </DragItem>
        </Box>
      ))}

      {Object.values(presets).map((preset) => (
        <Box key={preset.id} position="relative">
          <DragItem
            id={preset.id}
            type={preset.id}
            label={preset.name}
            rootParentType={preset.component.rootParentType}
            isPreset={true}
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
                handleRename(preset.id, preset.name)
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
                handleDelete(preset.id)
              }}
            />
          </Box>
        </Box>
      ))}

      {selectedPreset && (
        <RenameModal
          isOpen={isOpen}
          onClose={() => {
            onClose()
            setSelectedPreset(null)
          }}
          presetId={selectedPreset.id}
          currentName={selectedPreset.name}
        />
      )}
    </Box>
  )
}

export default PresetsList 
