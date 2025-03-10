import React from 'react'
import * as Chakra from '@chakra-ui/react'

import {
    BadgeProps,
    BoxProps,
    ButtonProps,
    IconProps,
    IconButtonProps,
    ImageProps,
    ProgressProps,
    AvatarGroupProps,
    AvatarProps,
    CheckboxProps,
    LinkProps,
    MenuProps,
    MenuButtonProps,
    MenuListProps,
    MenuItemProps,
    MenuItemOptionProps,
    MenuGroupProps,
    MenuOptionGroupProps,
    MenuDividerProps,
    PopoverProps,
    PopoverContentProps,
    PopoverHeaderProps,
    PopoverBodyProps,
    PopoverFooterProps,
    PopoverArrowProps,
    PopoverCloseButtonProps,
    SpinnerProps,
    CloseButtonProps,
    HeadingProps,
    TagProps,
    TagLabelProps,
    TagCloseButtonProps,
    SimpleGridProps,
    SwitchProps,
    AlertProps,
    FlexProps,
    StackProps,
    AccordionProps,
    AccordionButtonProps,
    AccordionItemProps,
    FormControlProps,
    TabListProps,
    TabPanelProps,
    TabPanelsProps,
    TabsProps,
    InputProps,
    AspectRatioProps,
    BreadcrumbItemProps,
    BreadcrumbItem,
    EditableProps,
    SliderProps,
    SliderTrackProps,
    SliderThumbProps,
    SliderMarkProps,
    NumberInputProps,
    RadioProps,
    SelectProps,
    RadioGroupProps,
    InputGroupProps,
    GridProps,
    CenterProps,
    ContainerProps,
    AvatarBadgeProps,
    CircularProgressProps,
    TextProps,
    DividerProps,
    CodeProps,
    TextareaProps,
    AlertIconProps,
    AlertTitleProps,
    AlertDescriptionProps,
    AccordionPanelProps,
    FormLabelProps,
    FormErrorMessageProps,
    TabProps,
    BreadcrumbLinkProps,
    ListProps,
    HighlightProps,
    KbdProps,
    StatProps,
    StatGroupProps,
    StatHelpTextProps,
    StatLabelProps,
    StatNumberProps,
    StatArrowProps,
    TableContainerProps,
    TableProps,
    TableCaptionProps,
    TableBodyProps,
    TableRowProps,
    TableFooterProps,
    TableHeadProps,
    TooltipProps,
    TableColumnHeaderProps,
    TableCellProps,
    ModalProps,
    ModalOverlayProps,
    ModalContentProps,
    ModalHeaderProps,
    ModalFooterProps,
    ModalBodyProps,
    RangeSliderProps,
    RangeSliderTrackProps,
    RangeSliderThumbProps,
    GridItemProps,
} from '@chakra-ui/react'

import iconsList from 'src/iconsList'
import { AddIcon } from '@chakra-ui/icons'

type PropsWithForm<T> = T & { form?: T }

type PreviewDefaultProps = {
    Badge?: PropsWithForm<BadgeProps>
    Box?: PropsWithForm<BoxProps>
    Button?: PropsWithForm<ButtonProps>
    Icon?: PropsWithForm<IconProps> & { icon: keyof typeof iconsList }
    IconButton?: PropsWithForm<IconButtonProps>
    Image?: PropsWithForm<ImageProps>
    Text?: PropsWithForm<TextProps>
    Progress?: PropsWithForm<ProgressProps>
    AvatarBadge?: PropsWithForm<AvatarBadgeProps>
    AvatarGroup?: PropsWithForm<Omit<AvatarGroupProps, 'children'>>
    Avatar?: PropsWithForm<AvatarProps>
    Checkbox?: PropsWithForm<CheckboxProps>
    Link?: PropsWithForm<LinkProps>
    Spinner?: PropsWithForm<SpinnerProps>
    CloseButton?: PropsWithForm<CloseButtonProps>
    Divider?: PropsWithForm<DividerProps>
    Code?: PropsWithForm<CodeProps>
    Textarea?: PropsWithForm<TextareaProps>
    CircularProgress?: PropsWithForm<CircularProgressProps>
    Heading?: PropsWithForm<HeadingProps>
    Highlight?: PropsWithForm<HighlightProps>
    Popover?: PropsWithForm<PopoverProps>
    PopoverTrigger?: PropsWithForm<any>
    PopoverContent?: PropsWithForm<PopoverContentProps>
    PopoverHeader?: PropsWithForm<PopoverHeaderProps>
    PopoverBody?: PropsWithForm<PopoverBodyProps>
    PopoverFooter?: PropsWithForm<PopoverFooterProps>
    PopoverArrow?: PropsWithForm<PopoverArrowProps>
    PopoverCloseButton?: PropsWithForm<PopoverCloseButtonProps>
    PopoverAnchor?: PropsWithForm<any>
    Tag?: PropsWithForm<TagProps>
    TagLabel?: PropsWithForm<TagLabelProps>
    TagLeftIcon?: PropsWithForm<any>
    TagRightIcon?: PropsWithForm<any>
    TagCloseButton?: PropsWithForm<TagCloseButtonProps>
    SimpleGrid?: PropsWithForm<SimpleGridProps>
    Switch?: PropsWithForm<SwitchProps>
    Alert?: PropsWithForm<AlertProps>
    AlertIcon?: PropsWithForm<AlertIconProps>
    AlertTitle?: PropsWithForm<AlertTitleProps>
    AlertDescription?: PropsWithForm<AlertDescriptionProps>
    Flex?: PropsWithForm<FlexProps>
    Stack?: PropsWithForm<StackProps>
    Accordion?: PropsWithForm<Omit<AccordionProps, 'children'>>
    AccordionButton?: PropsWithForm<AccordionButtonProps>
    AccordionItem?: PropsWithForm<Omit<AccordionItemProps, 'children'>>
    Stat?: PropsWithForm<Omit<StatProps, 'children'>>
    StatGroup?: PropsWithForm<Omit<StatGroupProps, 'children'>>
    StatLabel?: PropsWithForm<StatLabelProps>
    StatNumber?: PropsWithForm<StatNumberProps>
    StatHelpText?: PropsWithForm<StatHelpTextProps>
    StatArrow?: PropsWithForm<StatArrowProps>
    AccordionPanel?: PropsWithForm<AccordionPanelProps>
    AccordionIcon?: PropsWithForm<IconProps>
    FormControl?: PropsWithForm<FormControlProps>
    FormLabel?: PropsWithForm<FormLabelProps>
    FormHelperText?: PropsWithForm<TextProps>
    FormErrorMessage?: PropsWithForm<FormErrorMessageProps>
    Grid?: PropsWithForm<GridProps>
    GridItem?: PropsWithForm<GridItemProps>
    TabList?: PropsWithForm<TabListProps>
    TabPanel?: PropsWithForm<TabPanelProps>
    TabPanels?: PropsWithForm<TabPanelsProps>
    Tab?: PropsWithForm<TabProps>
    Tabs?: PropsWithForm<TabsProps>
    Select?: PropsWithForm<SelectProps & { children: JSX.Element }>
    Input?: PropsWithForm<InputProps>
    InputGroup?: PropsWithForm<InputGroupProps>
    InputLeftAddon?: PropsWithForm<any>
    InputRightAddon?: PropsWithForm<any>
    InputLeftElement?: PropsWithForm<any>
    InputRightElement?: PropsWithForm<any>
    AspectRatio?: PropsWithForm<AspectRatioProps>
    Breadcrumb?: PropsWithForm<BreadcrumbItemProps>
    BreadcrumbItem?: PropsWithForm<BreadcrumbItemProps>
    BreadcrumbLink?: PropsWithForm<BreadcrumbLinkProps>
    Editable?: PropsWithForm<EditableProps>
    Slider?: PropsWithForm<SliderProps>
    SliderTrack?: PropsWithForm<SliderTrackProps>
    SliderFilledTrack?: PropsWithForm<any>
    SliderThumb?: PropsWithForm<SliderThumbProps>
    SliderMark?: PropsWithForm<SliderMarkProps>
    Menu?: PropsWithForm<MenuProps>
    MenuButton?: PropsWithForm<MenuButtonProps>
    MenuList?: PropsWithForm<MenuListProps>
    MenuItem?: PropsWithForm<MenuItemProps>
    MenuItemOption?: PropsWithForm<MenuItemOptionProps>
    MenuGroup?: PropsWithForm<MenuGroupProps>
    MenuOptionGroup?: PropsWithForm<MenuOptionGroupProps>
    Tooltip?: PropsWithForm<TooltipProps>
    NumberInput?: PropsWithForm<NumberInputProps>
    Radio?: PropsWithForm<RadioProps>
    RadioGroup?: PropsWithForm<RadioGroupProps>
    List?: PropsWithForm<ListProps>
    ListIcon?: PropsWithForm<IconProps>
    ListItem?: PropsWithForm<any>
    Center?: PropsWithForm<CenterProps>
    Container?: PropsWithForm<ContainerProps>
    Kbd?: PropsWithForm<KbdProps>
    TableContainer?: PropsWithForm<TableContainerProps>
    Table?: PropsWithForm<TableProps>
    TableCaption?: PropsWithForm<TableCaptionProps>
    Tr?: PropsWithForm<TableRowProps>
    // Td?: PropsWithForm<TableCellProps>
    // Th?: PropsWithForm<TableColumnHeaderProps>
    TBody?: PropsWithForm<TableBodyProps>
    THead?: PropsWithForm<TableHeadProps>
    TFoot?: PropsWithForm<TableFooterProps>
    Modal?: PropsWithForm<ModalProps>
    ModalOverlay?: PropsWithForm<ModalOverlayProps>
    ModalContent?: PropsWithForm<ModalContentProps>
    ModalHeader?: PropsWithForm<ModalHeaderProps>
    ModalFooter?: PropsWithForm<ModalFooterProps>
    ModalBody?: PropsWithForm<ModalBodyProps>
    ModalCloseButton?: PropsWithForm<any>
    RangeSlider?: PropsWithForm<RangeSliderProps>
    RangeSliderTrack?: PropsWithForm<RangeSliderTrackProps>
    RangeSliderFilledTrack?: PropsWithForm<any>
    RangeSliderThumb?: PropsWithForm<RangeSliderThumbProps>

}

export const DEFAULT_PROPS: PreviewDefaultProps | any = {
    AlertDescription: {
        children: 'Alert description',
    },
    AccordionPanel: { showpreview: true },
    AlertTitle: {
        children: 'Alert title',
        mr: 1,
        fontWeight: 'bold',
    },
    AvatarBadge: {
        bg: 'green.500',
        boxSize: '1.25rem',
        borderColor: 'white',
    },
    AvatarGroup: {
        spacing: -3,
        max: 3,
        size: 'md',
        form: {
            display: 'flex',
        },
    },
    Badge: {
        children: 'Badge name',
        variant: 'subtle',
    },
    Breadcrumb: {
        form: {
            separator: '/',
        },
    },
    BreadcrumbLink: {
        ...Chakra.BreadcrumbLink.defaultProps,
    },
    Button: {
        children: 'Button text',
        variant: 'solid',
        size: 'md',
    },
    Checkbox: {
        children: 'Label checkbox',
        isReadOnly: true,
        isChecked: false,
    },
    CircularProgress: {
        size: '48px',
        value: 60,
        min: 0,
        max: 100,
    },
    CloseButton: {
        size: 'md',
    },
    Code: {
        children: 'Code value',
    },
    Divider: { borderColor: 'blackAlpha.500' },
    Flex: {
        form: {
            display: 'flex',
        },
    },
    FormLabel: { children: 'Label' },
    FormHelperText: {
        children: 'Helper message',
    },
    FormErrorMessage: {
        children: 'Error message',
    },
    Grid: {
        templateColumns: 'repeat(5, 1fr)',
        gap: 6,
        form: {
            display: 'grid',
        },
    },
    GridItem: {
        colSpan: 1,
      },
    Heading: {
        children: 'Heading title',
    },
    Highlight: {
        children: 'Heading title',
        query: 'title',
    },
    Icon: { icon: 'CopyIcon' },
    IconButton: {
        'aria-label': 'icon',
        // @ts-ignore
        icon: 'CopyIcon',
        size: 'md',
    },
    Image: {
        height: '100px',
        width: '100px',
    },
    InputLeftAddon: { children: 'left' },
    InputRightAddon: {
        children: 'right',
    },
    Link: { children: 'Link text' },
    List: {
        form: {
            styleType: 'none',
        },
    },
    ListItem: { children: 'list' },
    Kbd: { children: 'shift' },
    Menu: {},
    MenuButton: { as: 'Button', children: 'Menu Button' },
    MenuList: {},
    MenuItem: { children: 'My Account' },
    MenuItemOption: { value: 'asc', children: 'Ascending' },
    MenuGroup: { title: 'Profile' },
    MenuOptionGroup: { title: 'Order', type: 'radio' },
    MenuDivider: {},
    Modal: { size: 'md' },
    ModalOverlay: {},
    ModalContent: {},
    ModalHeader: { children: 'Modal Title' },
    ModalFooter: {},
    ModalBody: {},
    ModalCloseButton: {},
    Popover: {},
    PopoverTrigger: {},
    PopoverContent: {},
    PopoverHeader: { children: 'Popover Title' },
    PopoverBody: { children: 'This is the body of my popover' },
    PopoverFooter: {},
    PopoverArrow: {},
    PopoverCloseButton: {},
    PopoverAnchor: {},
    Progress: {
        value: 60,
        min: 0,
        max: 100,
    },
    Radio: { children: 'Radio' },
    Select: {
        // @ts-ignore
        icon: 'ChevronDownIcon',
        variant: 'outline',
        size: 'md',
        // @ts-ignore
        form: {
            children: (
                <>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                </>
            ),
        },
    },
    SimpleGrid: {
        columns: 2,
        spacingX: 1,
        spacingY: 1,
    },
    Slider: {
        // step: 1,
        // size: 'md',
        // value: 70,
        min: 1,
        max: 100,
        'aria-label': 'slider',
    },
    SliderFilledTrack: {},
    SliderThumb: {},
    SliderTrack: {},
    SliderMark: { children: '95%', value: 95 },
    RangeSlider: {
        min: 1,
        max: 100,
    },
    RangeSliderFilledTrack: {},
    RangeSliderThumb: {
        index: '0',
    },
    RangeSliderTrack: {},
    Stack: {
        spacing: 2,
        form: {
            display: 'flex',
        },
    },
    Stat: {},
    StatLabel: { children: 'Stat label' },
    StatNumber: { children: '45' },
    StatArrow: { type: 'increase' },
    StatHelpText: {
        display: 'flex',
        alignItems: 'center',
    },
    StatGroup: {},
    Switch: {
        isChecked: false,
    },
    Tab: { children: 'Tab' },
    Tabs: { children: '', size: 'md', variant: 'line' },
    TabPanel: { children: 'Tab' },
    Tag: { rounded: 'full', variant: 'subtle' },
    TagLabel: { children: 'Tag name' },
    TagLeftIcon: { as: 'AddIcon' },
    TagRightIcon: { as: 'AddIcon' },
    TagCloseButton: {},
    Text: { children: 'Text value' },
    Td: { children: 'data', isNumeric: false },
    Th: { children: 'heading', isNumeric: false },
    TableCaption: { children: 'Table Caption', placement: 'bottom' },
    Table: { variant: 'simple' },
    Conditional: { condition: false },
    Loop: { list: [1, 2, 3, 4] },
    Tooltip: { label: 'This is my label', 'aria-label': 'beautiful tooltip' },
    BreadcrumbItem: { ...BreadcrumbItem.defaultProps },
}

export const getDefaultFormProps = (type: ComponentType) => {
    //@ts-ignore
    let chakraDefaultProps = []
    //@ts-ignore
    if (!!Chakra[type]) chakraDefaultProps = Chakra[type].defaultProps
    // @ts-ignore
    return { ...chakraDefaultProps, ...DEFAULT_PROPS[type]?.form }
}
