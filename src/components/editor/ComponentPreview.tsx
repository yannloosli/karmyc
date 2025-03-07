import React, { memo, Suspense, lazy, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import * as Chakra from '@chakra-ui/react'
import { getComponentBy } from '@/store/selectors/components'
import { getCustomComponentNames } from '@/store/selectors/customComponents'
import PreviewContainer from './PreviewContainer'
import WithChildrenPreviewContainer from './WithChildrenPreviewContainer'

// Imports des composants de preview
import AlertPreview from './previews/AlertPreview'
import AvatarPreview, {
    AvatarBadgePreview,
    AvatarGroupPreview,
} from './previews/AvatarPreview'
import AccordionPreview, {
    AccordionButtonPreview,
    AccordionItemPreview,
    AccordionPanelPreview,
} from './previews/AccordionPreview'
import { InputRightElementPreview } from './previews/InputRightElement'
import { InputLeftElementPreview } from './previews/InputLeftElement'
import AspectRatioPreview from './previews/AspectRatioBoxPreview'
import ButtonPreview from './previews/ButtonPreview'
import IconPreview from './previews/IconPreview'
import IconButtonPreview from './previews/IconButtonPreview'
import SelectPreview from './previews/SelectPreview'
import NumberInputPreview from './previews/NumberInputPreview'
import BreadcrumbPreview from './previews/BreadcrumbPreview'
import BreadcrumbItemPreview from './previews/BreadcrumbItemPreview'
import HighlightPreview from './previews/HighlightPreview'
import StatGroupPreview, {
    StatHelpTextPreview,
    StatPreview,
} from './previews/StatPreview'
import RangeSliderPreview from './previews/RangeSliderPreview'
import RangeSliderTrackPreview from './previews/RangeSliderTrackPreview'
import RangeSliderThumbPreview from './previews/RangeSliderThumbPreview'
import RangeSliderFilledTrackPreview from './previews/RangeSliderFilledTrackPreview'
import ModalPreview, {
    ModalCloseButtonPreview,
    ModalBodyPreview,
    ModalContentPreview,
    ModalFooterPreview,
    ModalHeaderPreview,
    ModalOverlayPreview,
} from './previews/ModalPreview'
import TagPreview, {
    TagLabelPreview,
    TagLeftIconPreview,
    TagRightIconPreview,
    TagCloseButtonPreview,
} from './previews/TagPreview'
import MenuPreview, {
    MenuListPreview,
    MenuButtonPreview,
    MenuItemPreview,
    MenuItemOptionPreview,
    MenuGroupPreview,
    MenuOptionGroupPreview,
    MenuDividerPreview,
} from './previews/MenuPreview'
import SliderPreview from './previews/SliderPreview'
import SliderTrackPreview from './previews/SliderTrackPreview'
import SliderThumbPreview from './previews/SliderThumbPreview'
import TableContainerPreview, {
    TbodyPreview,
    TfootPreview,
    TheadPreview,
    TrPreview,
} from './previews/TableContainerPreview'

const importView = (component: string) => {
    const pascalName = component.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')
    
    return lazy(() =>
        import(`src/custom-components/editor/previews/${pascalName}Preview.oc.tsx`)
        .catch(() => import('src/custom-components/fallback')),
    )
}

const CONTAINER_COMPONENTS = [
    'Box',
    'Flex',
    'SimpleGrid',
    'Grid',
    'GridItem',
    'Stack',
    'HStack',
    'VStack',
    'Container',
    'Center'
]

const WRAPPED_COMPONENTS = [
    'AlertIcon',
    'Progress',
    'CloseButton',
    'AccordionIcon',
    'Code',
    'ListIcon',
    'Divider',
    'AlertDescription',
    'AlertTitle',
    'InputRightAddon',
    'InputLeftAddon'
]

const ComponentPreview: React.FC<{
    componentName: string
    index: number
}> = ({ componentName, index, ...forwardedProps }) => {
    const component = useSelector(getComponentBy(componentName))
    const customComponents = useSelector(getCustomComponentNames)
    console.log("~~~~~~~~~~~~~~~~~~~~",component, componentName, customComponents)   
    if (!component) {
        console.error(`ComponentPreview unavailable for component ${componentName}`)
        return null
    }

    const type = component.type

    // Gérer les composants personnalisés
    if (customComponents.includes(type)) {
        const CustomPreview = lazy(() => 
            import(`src/custom-components/editor/previews/${type}Preview.oc.tsx`)
            .catch(() => import('src/custom-components/fallback'))
        )
        return (
            <Suspense fallback={'Loading...'}>
                <CustomPreview component={component} index={index} />
            </Suspense>
        )
    }

    // Gérer les composants conteneurs
    if (CONTAINER_COMPONENTS.includes(type)) {
        console.log("CONTAINER_COMPONENTS",type)
        return (
            <WithChildrenPreviewContainer
                enableVisualHelper
                index={index}
                component={component}
                type={Chakra[type]}
                {...forwardedProps}
            />
        )
    }

    // Gérer les composants qui nécessitent un wrapper Box
    if (WRAPPED_COMPONENTS.includes(type)) {
        console.log("WRAPPED_COMPONENTS",type)
        return (
            <PreviewContainer
                index={index}
                component={component}
                type={Chakra[type]}
                isBoxWrapped
                {...forwardedProps}
            />
        )
    }

    // Gérer les composants avec des enfants
    if (component.children && component.children.length > 0) {
        return (
            <WithChildrenPreviewContainer
                component={component}
                type={Chakra[type] || type}
                index={index}
                {...forwardedProps}
            />
        )
    }

    // Gérer les composants spéciaux
    switch (type) {
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
        case 'Table':
            return <TableContainerPreview component={component} index={index} />
        default:
            // Composants simples
            return (
                <PreviewContainer
                    index={index}
                    component={component}
                    type={Chakra[type] || type}
                    {...forwardedProps}
                />
            )
    }
}

export default memo(ComponentPreview)
