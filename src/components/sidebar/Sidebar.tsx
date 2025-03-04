import React, { useState, ChangeEvent, memo, useEffect } from 'react'
import {
    Box,
    Input,
    InputGroup,
    InputRightElement,
    DarkMode,
    IconButton,
    Divider,
} from '@chakra-ui/react'
import { CloseIcon, SearchIcon } from '@chakra-ui/icons'
import DragItem from './DragItem'
import { menuItems, MenuItem } from '../../componentsList'
import PresetsList from './PresetsList'

const Menu = () => {
    const [searchTerm, setSearchTerm] = useState('')

    return (
        <DarkMode>
            <Box
                className="sidebar"
                maxH="calc(100dvh - 6rem)"
                overflowY="auto"
                overflowX="hidden"
                boxShadow="xl"
                flex="0 0 14rem"
                m={0}
                p={0}
                as="menu"
                backgroundColor="#2e3748"
                width="100%"
            >
                <Box p={0} pb={0} position="sticky" w="100%" bgColor="#2e3748" top={0} zIndex={2}>
                    <InputGroup size="sm" mb={0}>
                        <Input
                            value={searchTerm}
                            color="gray.300"
                            placeholder="Search component"
                            _placeholder={{
                                color: 'gray',
                            }}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                setSearchTerm(event.target.value)
                            }
                            borderColor="rgba(255, 255, 255, 0.04)"
                            bg="rgba(255, 255, 255, 0.06)"
                            _hover={{
                                borderColor: 'rgba(255, 255, 255, 0.08)',
                            }}
                            zIndex={0}
                        />
                        <InputRightElement>
                            {searchTerm ? (
                                <IconButton
                                    color="gray.300"
                                    aria-label="clear"
                                    icon={<CloseIcon path="" />}
                                    size="xs"
                                    onClick={() => setSearchTerm('')}
                                />
                            ) : (
                                <SearchIcon path="" color="gray.300" />
                            )}
                        </InputRightElement>
                    </InputGroup>
                </Box>

                <Box p={4}>
                    <PresetsList />
                </Box>

                <Divider my={2} borderColor="whiteAlpha.200" />

                <Box p={0} pt={0}>
                    {(Object.keys(menuItems) as ComponentType[])
                        .filter(c =>
                            c.toLowerCase().includes(searchTerm.toLowerCase()),
                        )
                        .map(name => {
                            return (
                                <DragItem
                                    key={name}
                                    label={name}
                                    type={name as any}
                                    id={name as any}
                                    rootParentType={menuItems[name]?.rootParentType || name}
                                >
                                    {name}
                                </DragItem>
                            )
                        })}
                </Box>
            </Box>
        </DarkMode>
    )
}

export default memo(Menu)
