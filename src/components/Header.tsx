import React, { memo, useState } from 'react'
import {
    Box,
    Switch,
    Button,
    Flex,
    Link,
    Stack,
    FormLabel,
    DarkMode,
    FormControl,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody,
    LightMode,
    PopoverFooter,
    Tooltip,
    HStack,
    Spacer,
    Image,
    AspectRatio,
} from '@chakra-ui/react'
import { ExternalLinkIcon, SmallCloseIcon, CheckIcon } from '@chakra-ui/icons'
import { DiGithubBadge } from 'react-icons/di'
import { AiFillThunderbolt } from 'react-icons/ai'
import { SiTypescript } from 'react-icons/si'
import { buildParameters } from 'src/utils/codesandbox'
import { generateCode } from 'src/utils/code'
import useDispatch from 'src/hooks/useDispatch'
import { useSelector } from 'react-redux'
import { getComponents } from 'src/core/selectors/components'
import {
    getCustomComponents,
} from 'src/core/selectors/customComponents'
import { getShowLayout } from 'src/core/selectors/app'
import HeaderMenu from 'src/components/headerMenu/HeaderMenu'
import { FaReact } from 'react-icons/fa'
import Themer from './themer/Themer'
import ResponsiveToolBar from './ResponsiveToolBar'

const CodeSandboxButton = () => {
    const components = useSelector(getComponents)
    const componentsList = useSelector(getCustomComponents)
    const [isLoading, setIsLoading] = useState(false)

    const exportToCodeSandbox = async (isTypeScript: boolean) => {
        setIsLoading(true)
        const code = await generateCode(
            components,
            componentsList,
        )
        setIsLoading(false)
        const parameters = buildParameters(code, isTypeScript)

        window.open(
            `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parameters}`,
            '_blank',
        )
    }

    return (
        <Popover>
            {({ onClose }) => (
                <>
                    <PopoverTrigger>
                        <Button
                            isLoading={isLoading}
                            rightIcon={<ExternalLinkIcon path="" />}
                            variant="ghost"
                            size="xs"
                        >
                            Export code
                        </Button>
                    </PopoverTrigger>

                    <LightMode>
                        <PopoverContent zIndex={100} bg="white">
                            <PopoverArrow />
                            <PopoverCloseButton />
                            <PopoverHeader>Export format</PopoverHeader>
                            <PopoverBody fontSize="sm">
                                Export the code in CodeSandbox in which format ?
                            </PopoverBody>
                            <PopoverFooter display="flex" justifyContent="flex-end">
                                <Button
                                    size="sm"
                                    mr={2}
                                    variant="ghost"
                                    colorScheme="orange"
                                    rightIcon={<FaReact />}
                                    onClick={async () => {
                                        await exportToCodeSandbox(false)
                                        if (onClose) {
                                            onClose()
                                        }
                                    }}
                                >
                                    JSX
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="blue"
                                    rightIcon={<SiTypescript />}
                                    onClick={async () => {
                                        await exportToCodeSandbox(true)
                                        if (onClose) {
                                            onClose()
                                        }
                                    }}
                                >
                                    TSX
                                </Button>
                            </PopoverFooter>
                        </PopoverContent>
                    </LightMode>
                </>
            )}
        </Popover>
    )
}

const Header = () => {
    const showLayout = useSelector(getShowLayout)
    const dispatch = useDispatch()

    return (
        <DarkMode>
            <Flex
                className="header"
                justifyContent="space-between"
                bg="#1a202c"
                as="header"
                height="3rem"
                px="1rem"
            >
                <AspectRatio
                    maxW="12rem"
                    w='100%'
                    ratio={107 / 33}
                >
                    {/* @ts-expect-error "!important" not in type */}
                    <Image src='/karmyc_logo.svg' alt="Karmyc" objectFit='contain !important' />
                </AspectRatio>

                <Flex flexGrow={1} justifyContent="space-between" alignItems="center">
                    <HStack spacing={4} justify="center" align="center">
                        <Box>
                            <HeaderMenu />
                        </Box>
                        <FormControl flexDirection="row" display="flex" alignItems="center">
                            <Tooltip
                                zIndex={100}
                                hasArrow
                                bg="yellow.100"
                                aria-label="Builder mode help"
                                label="Builder mode adds extra padding/borders"
                            >
                                <FormLabel
                                    cursor="help"
                                    color="gray.200"
                                    fontSize="xs"
                                    htmlFor="preview"
                                    pb={0}
                                    mb={0}
                                    mr={2}
                                    whiteSpace="nowrap"
                                >
                                    Builder mode
                                </FormLabel>
                            </Tooltip>
                            <LightMode>
                                <Switch
                                    isChecked={showLayout}
                                    colorScheme="teal"
                                    size="sm"
                                    onChange={() => dispatch.app.toggleBuilderMode()}
                                    id="preview"
                                />
                            </LightMode>
                        </FormControl>
                    </HStack>
                    <Themer />
                    <Spacer />
                    <ResponsiveToolBar />
                    <Stack direction="row">
                        <CodeSandboxButton />
                        <Popover>
                            {({ onClose }) => (
                                <>
                                    <PopoverTrigger>
                                        <Button
                                            ml={4}
                                            rightIcon={<SmallCloseIcon path="" />}
                                            size="xs"
                                            variant="ghost"
                                        >
                                            Clear
                                        </Button>
                                    </PopoverTrigger>
                                    <LightMode>
                                        <PopoverContent zIndex={100} bg="white">
                                            <PopoverArrow />
                                            <PopoverCloseButton />
                                            <PopoverHeader>Are you sure?</PopoverHeader>
                                            <PopoverBody fontSize="sm">
                                                Do you really want to remove all components on the
                                                editor?
                                            </PopoverBody>
                                            <PopoverFooter display="flex" justifyContent="flex-end">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    colorScheme="red"
                                                    rightIcon={<CheckIcon path="" />}
                                                    onClick={() => {
                                                        dispatch.components.reset()
                                                        if (onClose) {
                                                            onClose()
                                                        }
                                                    }}
                                                >
                                                    Yes, clear
                                                </Button>
                                            </PopoverFooter>
                                        </PopoverContent>
                                    </LightMode>
                                </>
                            )}
                        </Popover>
                    </Stack>
                </Flex>

                <Stack
                    justifyContent="flex-end"
                    width="13rem"
                    align="center"
                    direction="row"
                    spacing="2"
                >
                    <Link isExternal={true} href="https://github.com/yannloosli/karmyc">
                        <Box as={DiGithubBadge} size={32} color="gray.200" />
                    </Link>
                </Stack>
            </Flex>
        </DarkMode>
    )
}

export default memo(Header)
