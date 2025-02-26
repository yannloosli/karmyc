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
    'components/addMetaComponent',
    'components/moveSelectedComponentChildren',
    'components/duplicate',
  ]

  return allowedActions.includes(action.type)
}
