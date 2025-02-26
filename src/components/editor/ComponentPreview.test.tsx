import React from 'react'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { ChakraProvider } from '@chakra-ui/react'
import { configureStore } from '@reduxjs/toolkit'
import undoable from 'redux-undo'

import ComponentPreview from './ComponentPreview'
import componentsReducer from '../../store/slices/componentsSlice'
import appReducer from '../../store/slices/appSlice'
import customComponentsReducer from '../../store/slices/customComponentsSlice'

function createTestStore(initialState = {}) {
  return configureStore({
    reducer: {
      app: undoable(appReducer),
      components: undoable(componentsReducer),
      customComponents: undoable(customComponentsReducer)
    },
    preloadedState: initialState
  })
}

function renderWithRedux(
  ui: React.ReactNode,
  {
    initialState = {},
    store = createTestStore(initialState)
  } = {}
) {
  return {
    ...render(
      <ChakraProvider>
        <DndProvider backend={HTML5Backend}>
          <Provider store={store}>{ui}</Provider>
        </DndProvider>
      </ChakraProvider>
    ),
    store,
  }
}

const componentsToTest = [
  'Badge',
  'Button',
  'Icon',
  'IconButton',
  'Image',
  'Text',
  'Progress',
  'Link',
  'Spinner',
  'CloseButton',
  'Checkbox',
  'Divider',
  'Code',
  'Textarea',
  'CircularProgress',
  'Heading',
  'Highlight',
  'Tag',
  'Switch',
  'FormLabel',
  'Input',
  'Radio',
  'Box',
  'SimpleGrid',
  'Flex',
  'FormControl',
  'List',
  'Avatar',
  'AvatarGroup',
  'Alert',
  'Stack',
  'Accordion',
  'RadioGroup',
  'Select',
  'InputGroup',
  'PopoverMeta',
  'MenuMeta',
]

test.each(componentsToTest)('Component Preview for %s', componentName => {
  const store = createTestStore()
  store.dispatch({
    type: 'components/addComponent',
    payload: {
      parentName: 'root',
      type: componentName,
      rootParentType: componentName,
      testId: 'test'
    }
  })

  renderWithRedux(<ComponentPreview componentName="test" index={0} />, { store })
})
