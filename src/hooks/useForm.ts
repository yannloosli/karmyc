import { ChangeEvent, useCallback } from 'react'
import { useAppDispatch } from './useAppDispatch'
import { getSelectedComponentId } from '@/store/selectors/components'
import { useSelector } from 'react-redux'
import { updateProps } from '../store/slices/componentsSlice'

export const useForm = () => {
    const dispatch = useAppDispatch()
    const selectedComponentId = useSelector(getSelectedComponentId)

    const setValueFromEvent = ({
        target: { name, value },
    }: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setValue(name, value)
    }

    const setValue = useCallback(
        (name: string, value: any) => {
            // Convertir les chaînes 'true'/'false' en booléens
            const finalValue = value === 'true' ? true : 
                             value === 'false' ? false : 
                             value
            
            dispatch(updateProps({
                componentId: selectedComponentId,
                props: {
                    [name]: finalValue
                }
            }))
        },
        [selectedComponentId, dispatch]
    )

    return { setValue, setValueFromEvent }
}

export default useForm
