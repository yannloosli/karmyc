import React, { memo, Suspense, lazy, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import AlertPreview from '../../components/editor/previews/AlertPreview'
import AvatarPreview, {
    AvatarBadgePreview,
    AvatarGroupPreview,
} from '../../components/editor/previews/AvatarPreview'
import AccordionPreview, {
    AccordionButtonPreview,
    AccordionItemPreview,
    AccordionPanelPreview,
} from 'src/components/editor/previews/AccordionPreview'
import * as Chakra from '@chakra-ui/react'
import { getComponentBy } from '@/store/selectors/components'
import { InputRightElementPreview } from 'src/components/editor/previews/InputRightElement'
import { InputLeftElementPreview } from 'src/components/editor/previews/InputLeftElement'
import AspectRatioPreview from 'src/components/editor/previews/AspectRatioBoxPreview'
import ButtonPreview from 'src/components/editor/previews/ButtonPreview'
import PreviewContainer from 'src/components/editor/PreviewContainer'
import WithChildrenPreviewContainer from 'src/components/editor/WithChildrenPreviewContainer'
import IconPreview from 'src/components/editor/previews/IconPreview'
import IconButtonPreview from 'src/components/editor/previews/IconButtonPreview'
import SelectPreview from 'src/components/editor/previews/SelectPreview'
import ConditionalPreview from 'src/components/editor/previews/ConditionalPreview'
import LoopPreview from 'src/components/editor/previews/LoopPreview'
import NumberInputPreview from 'src/components/editor/previews/NumberInputPreview'
import BreadcrumbPreview from 'src/components/editor/previews/BreadcrumbPreview'
import BreadcrumbItemPreview from 'src/components/editor/previews/BreadcrumbItemPreview'
import HighlightPreview from 'src/components/editor/previews/HighlightPreview'
import StatGroupPreview, {
    StatHelpTextPreview,
    StatPreview,
} from 'src/components/editor/previews/StatPreview'
import SkeletonPreview, {
    SkeletonCirclePreview,
    SkeletonTextPreview,
} from 'src/components/editor/previews/SkeletonPreview'
import RangeSliderPreview from 'src/components/editor/previews/RangeSliderPreview'
import RangeSliderTrackPreview from 'src/components/editor/previews/RangeSliderTrackPreview'
import RangeSliderThumbPreview from 'src/components/editor/previews/RangeSliderThumbPreview'
import RangeSliderFilledTrackPreview from 'src/components/editor/previews/RangeSliderFilledTrackPreview'
import ModalPreview, {
    ModalCloseButtonPreview,
    ModalBodyPreview,
    ModalContentPreview,
    ModalFooterPreview,
    ModalHeaderPreview,
    ModalOverlayPreview,
} from 'src/components/editor/previews/ModalPreview'
import PopoverPreview, {
    PopoverHeaderPreview,
    PopoverArrowPreview,
    PopoverBodyPreview,
    PopoverCloseButtonPreview,
    PopoverContentPreview,
    PopoverFooterPreview,
    PopoverTriggerPreview,
} from 'src/components/editor/previews/PopoverPreview'
import TooltipPreview from 'src/components/editor/previews/TooltipPreview'
import TagPreview, {
    TagLabelPreview,
    TagLeftIconPreview,
    TagRightIconPreview,
    TagCloseButtonPreview,
} from 'src/components/editor/previews/TagPreview'
import {
    getCustomComponentNames,
} from '@/store/selectors/customComponents'
import MenuPreview, {
    MenuListPreview,
    MenuButtonPreview,
    MenuItemPreview,
    MenuItemOptionPreview,
    MenuGroupPreview,
    MenuOptionGroupPreview,
    MenuDividerPreview,
} from 'src/components/editor/previews/MenuPreview'
import SliderPreview from 'src/components/editor/previews/SliderPreview'
import SliderTrackPreview from 'src/components/editor/previews/SliderTrackPreview'
import SliderThumbPreview from 'src/components/editor/previews/SliderThumbPreview'
import TableContainerPreview, {
    TablePreview,
    TbodyPreview,
    TfootPreview,
    TheadPreview,
    TrPreview,
} from 'src/components/editor/previews/TableContainerPreview'
import { convertToPascal } from './Editor'

const importView = (component: string) => {
    component = convertToPascal(component)
    return lazy(() =>
        import(
            `src/custom-components/editor/previews/${component}Preview.oc.tsx`
        ).catch(() => import('src/custom-components/fallback')),
    )
}

const ComponentPreview: React.FC<{
    componentName: string
    index: number
}> = ({ componentName, index, ...forwardedProps }) => {
    const component = useSelector(getComponentBy(componentName))

    if (!component) {
        console.error(`ComponentPreview unavailable for component ${componentName}`)
    }

    const type = (component && component.type) || null
    const [view, setView] = useState<any>()
    const [instView, setInstView] = useState<any>()
    const customComponents = useSelector(getCustomComponentNames)

    useEffect(() => {
        async function loadViews() {
            if (type) {
                const View = await importView(type)
                const loadedComponent = <View component={component} />
                Promise.all([loadedComponent]).then(setView)
            }
        }
        loadViews()
    }, [customComponents])


    if (type && customComponents.includes(type)) {
        return <Suspense fallback={'Loading...'}>{view}</Suspense>
    }

    switch (type) {
    // Simple components
    case 'Badge':
    case 'Image':
    case 'Text':
    case 'Link':
    case 'Spinner':
    case 'Checkbox':
    case 'Textarea':
    case 'CircularProgress':
    case 'Heading':
    case 'Switch':
    case 'FormLabel':
    case 'SliderFilledTrack':
    case 'SliderMark':
    case 'FormHelperText':
    case 'FormErrorMessage':
    case 'Tab':
    case 'Input':
    case 'Radio':
    case 'ListItem':
    case 'BreadcrumbLink':
    case 'Kbd':
    case 'StatLabel':
    case 'StatNumber':
    case 'StatArrow':
    case 'RangeSliderFilledTrack':
    case 'Td':
    case 'Th':
    case 'TableCaption':
        return (
            <PreviewContainer
                index={index}
                component={component}
                type={Chakra[type]}
                {...forwardedProps}
            />
        )
    // Wrapped functional components (forward ref issue)
    case 'AlertIcon':
    case 'Progress':
    case 'CloseButton':
    case 'AccordionIcon':
    case 'Code':
    case 'ListIcon':
    case 'Divider':
    case 'AlertDescription':
    case 'AlertTitle':
    case 'InputRightAddon':
    case 'InputLeftAddon':
        return (
            <PreviewContainer
                index={index}
                component={component}
                type={Chakra[type]}
                {...forwardedProps}
                isBoxWrapped
            />
        )
    // Components with childrens
    case 'Box':
    case 'SimpleGrid':
    case 'Flex':
    case 'FormControl':
    case 'Tabs':
    case 'List':
    case 'TabList':
    case 'TabPanel':
    case 'TabPanels':
    case 'Grid':
    case 'GridItem':
    case 'Center':
    case 'Container':
    case 'TableContainer':
    case 'Thead':
    case 'Tbody':
    case 'Tfoot':
        // case 'Tr':
        return (
            <WithChildrenPreviewContainer
                enableVisualHelper
                index={index}
                component={component}
                type={Chakra[type]}
                {...forwardedProps}
            />
        )
    case 'RadioGroup':
    case 'Stack':
    case 'InputGroup':
        return (
            <WithChildrenPreviewContainer
                enableVisualHelper
                index={index}
                component={component}
                type={Chakra[type]}
                {...forwardedProps}
                isBoxWrapped
            />
        )
    // More complex components
    case 'InputRightElement':
        return <InputRightElementPreview component={component} index={index} />
    case 'InputLeftElement':
        return <InputLeftElementPreview component={component} index={index} />
    case 'Avatar':
        return <AvatarPreview component={component} index={index} />
    case 'AvatarBadge':
        return <AvatarBadgePreview component={component} index={index} />
    case 'AvatarGroup':
        return <AvatarGroupPreview component={component} index={index} />
    case 'Alert':
        return <AlertPreview component={component} index={index} />
    case 'Accordion':
        return <AccordionPreview component={component} index={index} />
    case 'AccordionButton':
        return <AccordionButtonPreview component={component} index={index} />
    case 'AccordionItem':
        return <AccordionItemPreview component={component} index={index} />
    case 'AccordionPanel':
        return <AccordionPanelPreview component={component} index={index} />
    case 'AspectRatio':
        return <AspectRatioPreview component={component} index={index} />
    case 'Button':
        return <ButtonPreview component={component} index={index} />
    case 'Breadcrumb':
        return <BreadcrumbPreview component={component} index={index} />
    case 'BreadcrumbItem':
        return <BreadcrumbItemPreview component={component} index={index} />
    case 'Icon':
        return <IconPreview component={component} index={index} />
    case 'IconButton':
        return <IconButtonPreview component={component} index={index} />
    case 'Select':
        return <SelectPreview component={component} index={index} />
    case 'NumberInput':
        return <NumberInputPreview component={component} index={index} />
    case 'Highlight':
        return <HighlightPreview component={component} index={index} />
    case 'Skeleton':
        return <SkeletonPreview component={component} index={index} />
    case 'SkeletonText':
        return <SkeletonTextPreview component={component} index={index} />
    case 'SkeletonCircle':
        return <SkeletonCirclePreview component={component} index={index} />
    case 'RangeSliderTrack':
        return <RangeSliderTrackPreview component={component} index={index} />
    case 'RangeSlider':
        return <RangeSliderPreview component={component} index={index} />
    case 'RangeSliderThumb':
        return <RangeSliderThumbPreview component={component} index={index} />
    case 'Stat':
        return <StatPreview component={component} index={index} />
    case 'StatHelpText':
        return <StatHelpTextPreview component={component} index={index} />
    case 'Popover':
        return <PopoverPreview component={component} index={index} />
    case 'PopoverCloseButton':
        return <PopoverCloseButtonPreview component={component} index={index} />
    case 'PopoverHeader':
        return <PopoverHeaderPreview component={component} index={index} />
    case 'PopoverContent':
        return <PopoverContentPreview component={component} index={index} />
    case 'PopoverArrow':
        return <PopoverArrowPreview component={component} index={index} />
    case 'PopoverFooter':
        return <PopoverFooterPreview component={component} index={index} />
    case 'PopoverBody':
        return <PopoverBodyPreview component={component} index={index} />
    case 'PopoverTrigger':
        return <PopoverTriggerPreview component={component} index={index} />
    case 'StatGroup':
        return <StatGroupPreview component={component} index={index} />
    case 'Table':
        return <TablePreview component={component} index={index} />
    case 'Tr':
        return <TrPreview component={component} index={index} />
    case 'Thead':
        return <TheadPreview component={component} index={index} />
    case 'Tbody':
        return <TbodyPreview component={component} index={index} />
    case 'Tfoot':
        return <TfootPreview component={component} index={index} />
    case 'TableContainer':
        return <TableContainerPreview component={component} index={index} />
    case 'Tr':
        return <TrPreview component={component} index={index} />
    case 'Tag':
        return <TagPreview component={component} index={index} />
    case 'TagLabel':
        return <TagLabelPreview component={component} index={index} />
    case 'TagLeftIcon':
        return <TagLeftIconPreview component={component} index={index} />
    case 'TagRightIcon':
        return <TagRightIconPreview component={component} index={index} />
    case 'TagCloseButton':
        return <TagCloseButtonPreview component={component} index={index} />
    case 'Conditional':
        return <ConditionalPreview component={component} index={index} />
    case 'Loop':
        return <LoopPreview component={component} index={index} />
    case 'Modal':
        return <ModalPreview component={component} index={index} />
    case 'ModalCloseButton':
        return <ModalCloseButtonPreview component={component} index={index} />
    case 'ModalHeader':
        return <ModalHeaderPreview component={component} index={index} />
    case 'ModalContent':
        return <ModalContentPreview component={component} index={index} />
    case 'ModalOverlay':
        return <ModalOverlayPreview component={component} index={index} />
    case 'ModalFooter':
        return <ModalFooterPreview component={component} index={index} />
    case 'ModalBody':
        return <ModalBodyPreview component={component} index={index} />
    case 'Tooltip':
        return <TooltipPreview component={component} index={index} />
    case 'Menu':
        return <MenuPreview component={component} index={index} />
    case 'MenuButton':
        return <MenuButtonPreview component={component} index={index} />
    case 'MenuList':
        return <MenuListPreview component={component} index={index} />
    case 'MenuGroup':
        return <MenuGroupPreview component={component} index={index} />
    case 'MenuOptionGroup':
        return <MenuOptionGroupPreview component={component} index={index} />
    case 'MenuItemOption':
        return <MenuItemOptionPreview component={component} index={index} />
    case 'MenuItem':
        return <MenuItemPreview component={component} index={index} />
    case 'MenuDivider':
        return <MenuDividerPreview component={component} index={index} />
    case 'SliderTrack':
        return <SliderTrackPreview component={component} index={index} />
    case 'Slider':
        return <SliderPreview component={component} index={index} />
    case 'SliderThumb':
        return <SliderThumbPreview component={component} index={index} />
    default:
        return null
    }
}

export default memo(ComponentPreview)
