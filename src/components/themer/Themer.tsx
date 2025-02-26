import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  useDisclosure,
  Divider,
  Tooltip,
  Tabs,
  TabPanel,
  TabPanels,
  TabList,
  Tab,
} from '@chakra-ui/react'
import React from 'react'
import { useSelector } from 'react-redux'
import { getNewTheme } from '@/store/selectors/customComponents'
import ThemeColorPalette from './ThemeColorPalette'
import ThemeFonts from './ThemeFonts'
import { GiLargePaintBrush } from 'react-icons/gi'

const Themer = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const newThemeState = useSelector(getNewTheme)

  return (
    <>
      <Button
        mx={4}
        display="flex"
        flexDirection="row"
        alignItems="center"
        rightIcon={<GiLargePaintBrush />}
        variant="ghost"
        size="xs"
        onClick={onOpen}
      >
        Theme
      </Button>

      <Drawer placement="bottom" onClose={onClose} isOpen={isOpen} size="xl">
        <DrawerOverlay />
        <DrawerContent
          className="themer"
          bgColor="white"
          style={{ color: 'black', colorScheme: 'teal' }}
        >
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            Customize Project Theme
          </DrawerHeader>
          <DrawerBody>
            <Tabs
              variant="line"
              isLazy
              colorScheme="teal"
              orientation="vertical"
              className="theme"
            >
              <TabList>
                <Tab>
                  <Tooltip
                    label="Customize the colorScheme and different colors for your project"
                    fontFamily="sans-serif"
                    fontSize="sm"
                    hasArrow
                    placement="right"
                  >
                    Color Palette
                  </Tooltip>
                </Tab>
                <Divider />
                <Tab>
                  <Tooltip
                    label="Customise the heading and body font family"
                    fontFamily="sans-serif"
                    fontSize="sm"
                    hasArrow
                    placement="right"
                  >
                    Fonts
                  </Tooltip>
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <ThemeColorPalette themeState={newThemeState} />
                </TabPanel>
                <TabPanel>
                  <ThemeFonts themeState={newThemeState} />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default Themer
