import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { getSelectedComponentId, getComponentParams } from '@/store/selectors/components'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { updateComponent } from '@/store/slices/componentsSlice'

export const useParamsForm = () => {
  const dispatch = useAppDispatch()
  const componentId = useSelector(getSelectedComponentId)
  const currentParams = useSelector(getComponentParams) || []

  const setValue = useCallback(
    (
      name: string,
      value: any,
      type: string,
      optional: boolean,
      exposed: boolean = false,
      ref: boolean = false,
    ) => {
      const updatedParams = [...currentParams]
      const existingParamIndex = updatedParams.findIndex(p => p.name === name)
      
      if (existingParamIndex !== -1) {
        updatedParams[existingParamIndex] = {
          name,
          value,
          type,
          optional,
          exposed,
          ref,
        }
      } else {
        updatedParams.push({
          name,
          value,
          type,
          optional,
          exposed,
          ref,
        })
      }

      dispatch(updateComponent({
        id: 'root',
        updates: {
          params: updatedParams
        }
      }))
    },
    [dispatch, currentParams],
  )

  const deleteValue = useCallback(
    (name: string) => {
      const updatedParams = currentParams.filter(param => param.name !== name)
      
      dispatch(updateComponent({
        id: 'root',
        updates: {
          params: updatedParams
        }
      }))
    },
    [dispatch, currentParams],
  )

  return { setValue, deleteValue }
}
