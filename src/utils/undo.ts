import { UnknownAction } from '@reduxjs/toolkit'

export default function filterActions(action: UnknownAction): boolean {
  const allowedActions = [
    'components/reset',
    'components/loadDemo',
    'components/resetProps',
    'components/updateProps',
    'components/addComponent',
    'components/deleteComponent',
    'components/moveComponent',
    'components/moveSelectedComponentChildren',
    'components/duplicate',
    'components/sortHover',
    'components/sortUnhover',
    'components/hover',
    'components/unhover',
    'components/select',
    'components/unselect',
    'components/selectParent',
    'components/setComponentName',
    'components/setSelectedComponent',
    'components/setHoveredComponent'
  ]

  return allowedActions.includes(action.type)
}
