import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { getSelectedComponentId } from '@/store/selectors/components'
import { useAppDispatch } from '@/hooks/useAppDispatch'

export const useParamsForm = () => {
  const dispatch = useAppDispatch()
  const componentId = useSelector(getSelectedComponentId)

  const setValue = useCallback(
    (
      name: string,
      value: any,
      type: string,
      optional: boolean,
      exposed: boolean = false,
      ref: boolean = false,
    ) => {
      dispatch.components.updateParams({
        id: 'root',
        name,
        value,
        type,
        optional,
        exposed,
        ref,
      })
    },
    [componentId, dispatch.components],
  )

  return { setValue }
}
