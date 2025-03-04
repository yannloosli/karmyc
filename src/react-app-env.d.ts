/// <reference types="react-scripts" />;
declare module 'prettier/standalone'
declare module 'browser-nativefs'

type ComponentType =
  | 'Accordion'
  | 'AccordionItem'
  | 'AccordionButton'
  | 'AccordionPanel'
  | 'AccordionIcon'
  | 'Alert'
  | 'AlertIcon'
  | 'AlertTitle'
  | 'AlertDescription'
  | 'AspectRatio'
  | 'AvatarBadge'
  | 'AvatarGroup'
  | 'Avatar'
  | 'Badge'
  | 'Box'
  | 'Breadcrumb'
  | 'BreadcrumbItem'
  | 'BreadcrumbLink'
  | 'Button'
  | 'Center'
  | 'Checkbox'
  | 'CircularProgress'
  | 'CloseButton'
  | 'Code'
  | 'Container'
  | 'Divider'
  | 'Editable'
  | 'Flex'
  | 'FormControl'
  | 'FormLabel'
  | 'FormHelperText'
  | 'FormErrorMessage'
  | 'Grid'
  | 'GridItem'
  | 'Heading'
  | 'Highlight'
  | 'Icon'
  | 'IconButton'
  | 'Image'
  | 'Input'
  | 'InputGroup'
  | 'InputLeftAddon'
  | 'InputRightAddon'
  | 'InputLeftElement'
  | 'InputRightElement'
  | 'Link'
  | 'List'
  | 'ListItem'
  | 'ListIcon'
  | 'Kbd'
  | 'Menu'
  | 'MenuButton'
  | 'MenuList'
  | 'MenuItem'
  | 'MenuItemOption'
  | 'MenuGroup'
  | 'MenuOptionGroup'
  | 'MenuDivider'
  | 'Modal'
  | 'ModalOverlay'
  | 'ModalContent'
  | 'ModalHeader'
  | 'ModalFooter'
  | 'ModalBody'
  | 'ModalCloseButton'
  | 'NumberInput'
  | 'Popover'
  | 'PopoverTrigger'
  | 'PopoverContent'
  | 'PopoverHeader'
  | 'PopoverBody'
  | 'PopoverFooter'
  | 'PopoverArrow'
  | 'PopoverCloseButton'
  | 'PopoverAnchor'
  | 'Progress'
  | 'Radio'
  | 'RadioGroup'
  | 'Select'
  | 'SimpleGrid'
  | 'Spinner'
  | 'Slider'
  | 'SliderTrack'
  | 'SliderFilledTrack'
  | 'SliderThumb'
  | 'SliderMark'
  | 'RangeSlider'
  | 'RangeSliderTrack'
  | 'RangeSliderFilledTrack'
  | 'RangeSliderThumb'
  | 'Stack'
  | 'Stat'
  | 'StatLabel'
  | 'StatNumber'
  | 'StatHelpText'
  | 'StatArrow'
  | 'StatGroup'
  | 'Switch'
  | 'Tab'
  | 'Tabs'
  | 'TabList'
  | 'TabPanel'
  | 'TabPanels'
  | 'Tag'
  | 'TagLabel'
  | 'TagLeftIcon'
  | 'TagRightIcon'
  | 'TagCloseButton'
  | 'Text'
  | 'Textarea'
  | 'Table'
  | 'Thead'
  | 'Tbody'
  | 'Tfoot'
  | 'Tr'
  | 'Th'
  | 'Td'
  | 'TableCaption'
  | 'TableContainer'
  | 'Tooltip'
  | string

interface ParametersType {
  name: string
  value: any
  type: string
  optional: boolean
  exposed: boolean
  ref: boolean
}

interface IComponent {
  children: string[]
  type: ComponentType
  parent: string
  id: string
  props: any
  params?: Array<ParametersType>
  rootParentType?: ComponentType
  componentName?: string
}

interface IComponents {
  [name: string]: IComponent
}

interface IPreviewProps {
  component: IComponent
  index: number
}

interface ComponentItemProps {
  id: string
  label: string
  type: ComponentType
  isMoved?: boolean
  isChild?: boolean
  isSelected?: boolean
  custom?: boolean
  isPreset?: boolean
  rootParentType?: ComponentType
  children?: React.ReactNode
  index?: number
  onDragStart?: () => void
}
