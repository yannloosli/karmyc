import React from 'react'
import { MenuItem, Box } from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'

interface MenuItemLinkProps {
  href: string
  isExternal?: boolean
  children: React.ReactNode
  onClick?: () => void
}

const MenuItemLink: React.FC<MenuItemLinkProps> = ({
  href,
  children,
  onClick,
  isExternal,
  ...props
}) => {
  const isExt = isExternal ||href.startsWith('http')

  return (
    <MenuItem
      as="a"
      href={href}
      target={isExt ? '_blank' : undefined}
      rel={isExt ? 'noopener noreferrer' : undefined}
      onClick={onClick}
      display="flex"
      alignItems="center"
      {...props}
    >
      <Box flex="1">{children}</Box>
      {isExt && <ExternalLinkIcon ml={2} />}
    </MenuItem>
  )
}

export default React.memo(MenuItemLink)
