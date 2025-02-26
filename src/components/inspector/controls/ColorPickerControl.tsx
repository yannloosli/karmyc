import React, { ChangeEvent } from 'react'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  IconButton,
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Input,
  Portal,
  theme,
} from '@chakra-ui/react'
import ColorPicker from '../inputs/ColorPicker'
import HuesPickerControl from './HuesPickerControl'
import { useForm } from 'src/hooks/useForm'
import omit from 'lodash/omit'
import { createSelector } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'

type ColorPickerPropType = {
  withFullColor?: boolean
  name: string
  gradient: boolean
  gradientColor?: string
  index?: number
  updateGradient?: (value: string, index: number) => Promise<void>
}

// Cache pour les sélecteurs par nom
const selectorsCache = new Map<string, any>()

// Créer un sélecteur mémorisé pour chaque nom
const createColorSelector = (name: string) => {
  if (!selectorsCache.has(name)) {
    selectorsCache.set(
      name,
      createSelector(
        [(state: RootState) => (state.components as any).present.components],
        (components) => components[name] || ''
      )
    )
  }
  return selectorsCache.get(name)!
}

const ColorPickerControl = (props: ColorPickerPropType) => {
  const themeColors: Record<string, any> = omit(theme.colors, [
    'transparent',
    'current',
    'black',
    'white',
  ])

  const { setValue, setValueFromEvent } = useForm()
  const value = useSelector(createColorSelector(props.name))

  let propsIconButton: any = { bg: value }
  if (value && typeof value === 'string' && themeColors[value]) {
    propsIconButton = { colorScheme: value }
  }

  return (
    <>
      <Popover placement="bottom">
        <PopoverTrigger>
          {props.gradient ? (
            <IconButton
              mr={2}
              boxShadow="md"
              border={props.gradientColor ? 'none' : '2px solid grey'}
              isRound
              aria-label="Color"
              size="xs"
              colorScheme={props.gradientColor}
              bg={props.gradientColor}
            />
          ) : (
            <IconButton
              mr={2}
              boxShadow="md"
              border={value ? 'none' : '2px solid grey'}
              isRound
              aria-label="Color"
              size="xs"
              {...propsIconButton}
            />
          )}
        </PopoverTrigger>
        <Portal>
          <PopoverContent width="200px">
            <PopoverArrow />
            <PopoverBody>
              {props.withFullColor ? (
                <Tabs size="sm" variant="soft-rounded" colorScheme="green">
                  <TabList>
                    <Tab>Theme</Tab>
                    <Tab>All</Tab>
                  </TabList>
                  <TabPanels mt={4}>
                    <TabPanel p={0}>
                      {props.gradient ? (
                        <HuesPickerControl
                          name={props.name}
                          themeColors={themeColors}
                          enableHues
                          setValue={setValue}
                          gradient={true}
                          index={props.index}
                          updateGradient={props.updateGradient}
                        />
                      ) : (
                        <HuesPickerControl
                          name={props.name}
                          themeColors={themeColors}
                          enableHues
                          setValue={setValue}
                          gradient={props.gradient}
                        />
                      )}
                    </TabPanel>

                    <TabPanel p={0}>
                      <Box position="relative" height="150px">
                        <ColorPicker
                          value={(props.gradient ? props.gradientColor : value) as string}
                          onChange={(newColor) => {
                            props.gradient
                              ? props.updateGradient!(newColor, props.index!)
                              : setValue(props.name, newColor)
                          }}
                        />
                      </Box>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              ) : props.gradient ? (
                <HuesPickerControl
                  name={props.name}
                  themeColors={themeColors}
                  enableHues
                  setValue={setValue}
                  gradient={true}
                  index={props.index}
                  updateGradient={props.updateGradient}
                />
              ) : (
                <HuesPickerControl
                  name={props.name}
                  themeColors={themeColors}
                  enableHues={false}
                  setValue={setValue}
                  gradient={props.gradient}
                />
              )}
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
      {props.gradient ? (
        <Input
          width="100px"
          size="sm"
          name={props.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            props.gradient
              ? props.updateGradient!(e.target.value, props.index!)
              : setValue(props.name, e.target.value)
          }}
          value={props.gradientColor}
        />
      ) : (
        <Input
          width="200px"
          size="sm"
          borderColor="gray.200"
          name="bgColor"
          onChange={setValueFromEvent}
          value={value as string}
        />
      )}
    </>
  )
}

export default ColorPickerControl
