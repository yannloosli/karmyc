import React from 'react'
import { Flex, IconButton, useTheme } from '@chakra-ui/react'
import { HiOutlineDesktopComputer } from 'react-icons/hi'
import { MdOutlineTabletMac } from 'react-icons/md'
import { ImMobile } from 'react-icons/im'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { getEditorWidth } from '../store/selectors/app'
import { useSelector } from 'react-redux'
import { updateEditorWidth } from '../store/slices/appSlice'

const ResponsiveToolBar = () => {
  const dispatch = useAppDispatch()
  const theme = useTheme()
  const editorWidth = useSelector(getEditorWidth)

 const activeColor = '#b644ff'
 const inactiveColor = 'whiteAlpha.500'

  const onClick = (width: string) => {
    dispatch(updateEditorWidth({ width }))
  }

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
        onClick={() => onClick('100%')}
        />

      <IconButton
        icon={<MdOutlineTabletMac />}
        size="lg"
        color={editorWidth === theme.breakpoints.md ? activeColor : inactiveColor}
        fontSize="30px"
        variant="ghost"
        aria-label="Tablet version"
        mx={12}
        onClick={() => onClick(theme.breakpoints.md)}
        />

      <IconButton
        icon={<ImMobile />}
        size="lg"
        color={editorWidth === theme.breakpoints.sm ? activeColor : inactiveColor}
        fontSize="30px"
        variant="ghost"
        aria-label="Mobile version"
        onClick={() => onClick(theme.breakpoints.sm)}
      />
    </Flex>
  )
}

export default ResponsiveToolBar
