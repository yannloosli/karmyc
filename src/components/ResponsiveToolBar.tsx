import React from 'react'
import { Flex, IconButton, useTheme } from '@chakra-ui/react'
import { HiOutlineDesktopComputer } from 'react-icons/hi'
import { MdOutlineTabletMac } from 'react-icons/md'
import { ImMobile } from 'react-icons/im'
import useDispatch from 'src/hooks/useDispatch'
import { getEditorWidth } from 'src/core/selectors/app'
import { useSelector } from 'react-redux'

const ResponsiveToolBar = () => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const editorWidth = useSelector(getEditorWidth)

 const activeColor = '#b644ff'
 const inactiveColor = 'whiteAlpha.500'

  return (
    <Flex
      w="100%"
      align="center"
      justify="center"
    >
      <IconButton
        icon={<HiOutlineDesktopComputer />}
        size="lg"
        fontSize="30px"
        variant="ghost"
        color={editorWidth === '100%' ? activeColor : inactiveColor}
        aria-label="Desktop version"
        onClick={() => dispatch.app.updateEditorWidth({ width: '100%' })}
        />

      <IconButton
        icon={<MdOutlineTabletMac />}
        size="lg"
        color={editorWidth === theme.breakpoints.md ? activeColor : inactiveColor}
        fontSize="30px"
        variant="ghost"
        aria-label="Tablet version"
        mx={12}
        onClick={() =>
          dispatch.app.updateEditorWidth({ width: theme.breakpoints.md })
        }
        />

      <IconButton
        icon={<ImMobile />}
        size="lg"
        color={editorWidth === theme.breakpoints.sm ? activeColor : inactiveColor}
        fontSize="30px"
        variant="ghost"
        aria-label="Mobile version"
        onClick={() =>
          dispatch.app.updateEditorWidth({ width: theme.breakpoints.sm })
        }
      />
    </Flex>
  )
}

export default ResponsiveToolBar
