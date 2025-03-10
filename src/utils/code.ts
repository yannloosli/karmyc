import isBoolean from 'lodash/isBoolean'
import filter from 'lodash/filter'
import icons from 'src/iconsList'
import { CustomDictionary } from 'src/core/models/customComponents'
import { convertToPascal } from './theme'
import { ComponentState } from '../store/slices/componentsSlice'
import { CustomComponent } from '../store/slices/customComponentsSlice'

const capitalize = (value: string) => {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export const formatCode = async (code: string) => {
  let formattedCode = `// 🚨 Your props contains invalid code`

  const prettier = await import('prettier/standalone')
  const babylonParser = await import('prettier/parser-babylon')

  try {
    formattedCode = prettier.format(code, {
      parser: 'babel',
      plugins: [babylonParser],
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      tabWidth: 2,
      endOfLine: 'lf',
    })
  } catch (e) {}

  return formattedCode
}

type BuildBlockParams = {
  component: IComponent
  components: IComponents
  forceBuildBlock?: boolean
}
type BuildSingleBlockParams = {
  index: number
  component: IComponent
  components: IComponents
  forceBuildBlock?: boolean
}

const buildParams = (paramsName: any, customOcTsx: boolean = false) => {
  let paramTypes = ``
  let params = ``

  paramTypes += `{`
  params += `{`
  paramsName?.forEach((param: any) => {
    const optional = param.optional ? '?' : ''
    paramTypes += `${param.name}${optional}: ${
      param.type === 'RefObject<HTMLInputElement>'
        ? `(ref: HTMLInputElement) => void`
        : `${param.type}`
    }, `
    params += `${param.name}`
    if (customOcTsx) {
      let operand =
        param.type == 'string'
          ? `'${param.value}'`
          : param.type == 'Function'
          ? `${param.value.slice(1, param.value.length - 1)}`
          : `${param.value}`
      params += `=${operand}, `
    } else {
      params += `, `
    }
  })
  paramTypes += `}`
  params += `}`

  if (params.length <= 2) {
    return { paramTypes: undefined, params: undefined }
  }
  paramTypes = `type AppPropsTypes = ${paramTypes}`
  params = `${params}: AppPropsTypes`

  return { paramTypes, params }
}

const destructureParams = (params: any) => {
  return `const { ${params
    .map((param: any) => param.name)
    .toString()} } = props`
}

const buildMenuButtonProps = (
  propNames: string[],
  childComponent: IComponent,
) => {
  let props = []
  if (childComponent.props['as'] === 'Button') {
    props = propNames.filter((prop: string) => {
      return prop !== 'isRound' && prop !== 'icon'
    })
  } else {
    props = propNames.filter((prop: string) => {
      return prop !== 'leftIcon' && prop !== 'rightIcon' && prop !== 'children'
    })
  }
  return props
}

const buildStyledProps = (propsNames: string[], childComponent: IComponent) => {
  let propsContent = ``

  propsNames.forEach((propName: string) => {
    const propsValue = childComponent.props[propName]

    if (
      propName.toLowerCase().includes('icon') &&
      childComponent.type !== 'Icon'
    ) {
      if (Object.keys(icons).includes(propsValue)) {
        let operand = `={<${propsValue} />}`

        propsContent += `${propName}${operand} `
      }
    } else if (
      propName.toLowerCase() === 'as' &&
      childComponent.type !== 'Icon' &&
      childComponent.type !== 'Heading'
    ) {
      let operand = `={${propsValue}}`
      propsContent += `${propName}${operand} `
    } else if (
      propName !== 'children' &&
      propsValue &&
      propName !== 'showpreview'
    ) {
      let operand = `='${propsValue}'`
      if (propsValue[0] === '{' && propsValue[propsValue.length - 1] === '}') {
        operand = `=${propsValue}`
      } else if (propsValue === true || propsValue === 'true') {
        operand = ``
      } else if (
        propsValue === 'false' ||
        isBoolean(propsValue) ||
        !isNaN(propsValue)
      ) {
        operand = `={${propsValue}}`
      }

      propsContent += `${propName}${operand} `
    }
  })

  return propsContent
}

const returnConditionalValue: (
  propsNames: string[],
  childComponent: IComponent,
) => boolean | string = (propsNames: string[], childComponent: IComponent) => {
  let conditionValue = false

  propsNames.forEach((propName: string) => {
    if (propName === 'condition') {
      conditionValue = childComponent.props[propName]
    }
  })
  return conditionValue
}

const returnLoopValue: (
  propsNames: string[],
  childComponent: IComponent,
) => any = (propsNames: string[], childComponent: IComponent) => {
  let loopValue = [1]

  propsNames.forEach((propName: string) => {
    if (propName === 'list') {
      loopValue = childComponent.props[propName]
    }
  })
  return loopValue
}

const buildSingleBlock = ({
  index,
  component,
  components,
  forceBuildBlock = false,
}: BuildSingleBlockParams) => {
  let content = ''
  const key: string = component.children[index]
  let childComponent = components[key]
  if (!childComponent) {
    console.error(`invalid component ${key}`)
  } else if (forceBuildBlock || !childComponent.componentName) {
    const componentName = convertToPascal(childComponent.type)
    let propsContent = ''
    let propsNames = Object.keys(childComponent.props).filter(propName => {
      if (childComponent.type === 'Icon') {
        return propName !== 'icon'
      }
      return true
    })
    if (componentName === 'MenuButton') {
      propsNames = buildMenuButtonProps(propsNames, childComponent)
    }
    // Special case for Highlight component
    if (componentName === 'Highlight') {
      const [query, children, ...restProps] = propsNames
      propsContent += buildStyledProps([query, children], childComponent)
      propsContent += `styles={{${restProps
        .filter(propName => childComponent.props[propName])
        .map(propName => `${propName}:'${childComponent.props[propName]}'`)}}}`
    } else {
      propsContent += buildStyledProps(propsNames, childComponent)
    }
    if (
      typeof childComponent.props.children === 'string' &&
      childComponent.children.length === 0 &&
      propsNames.includes('children')
    ) {
      content += `<${componentName} ${propsContent}>${childComponent.props.children}</${componentName}>`
    } else if (childComponent.type === 'Icon') {
      content += `<${childComponent.props.icon} ${propsContent} />`
    } else if (
      childComponent.children.length &&
      componentName !== 'Conditional' &&
      componentName !== 'Loop'
    ) {
      content += `<${componentName} ${propsContent}>
      ${buildBlock({ component: childComponent, components, forceBuildBlock })}
      </${componentName}>`
    } else if (componentName === 'Conditional') {
      const conditionalValue = returnConditionalValue(
        propsNames,
        childComponent,
      )
      content += `{${
        typeof conditionalValue === 'boolean'
          ? `${conditionalValue}`
          : `${
              conditionalValue.slice(0, 1) === '{'
                ? `${conditionalValue.slice(1, -1)}`
                : `'${conditionalValue}'`
            }`
      }? <>${buildSingleBlock({
        index: 0,
        component: childComponent,
        components,
        forceBuildBlock,
      })}</>: <>${buildSingleBlock({
        index: 1,
        component: childComponent,
        components,
        forceBuildBlock,
      })}</>}`
    } else if (componentName === 'Loop') {
      const loopValue = returnLoopValue(propsNames, childComponent)
      content += `{${
        typeof loopValue === 'object'
          ? `${JSON.stringify(loopValue)}`
          : `${
              loopValue.slice(0, 1) === '{'
                ? `${loopValue.slice(1, -1)}`
                : `${loopValue}`
            }`
      }.map((item${childComponent.id.slice(
        7,
        10,
      )}, index${childComponent.id.slice(7, 10)}) => (<Box>${buildBlock({
        component: childComponent,
        components,
        forceBuildBlock,
      })}</Box>))}`
    } else {
      content += `<${componentName} ${propsContent} />`
    }
  } else {
    content += `<${childComponent.componentName} />`
  }
  return content
}
const buildBlock = ({
  component,
  components,
  forceBuildBlock = false,
}: BuildBlockParams) => {
  let content = ''

  component.children.forEach((key: string) => {
    let childComponent = components[key]
    if (!childComponent) {
      console.error(`invalid component ${key}`)
    } else if (forceBuildBlock || !childComponent.componentName) {
      const componentName = convertToPascal(childComponent.type)
      let propsContent = ''
      let propsNames = Object.keys(childComponent.props).filter(propName => {
        if (childComponent.type === 'Icon') {
          return propName !== 'icon'
        }

        return true
      })
      if (componentName === 'MenuButton') {
        propsNames = buildMenuButtonProps(propsNames, childComponent)
      }
      // Special case for Highlight component
      if (componentName === 'Highlight') {
        const [query, children, ...restProps] = propsNames
        propsContent += buildStyledProps([query, children], childComponent)

        propsContent += `styles={{${restProps
          .filter(propName => childComponent.props[propName])
          .map(
            propName => `${propName}:'${childComponent.props[propName]}'`,
          )}}}`
      } else {
        propsContent += buildStyledProps(propsNames, childComponent)
      }

      if (
        typeof childComponent.props.children === 'string' &&
        childComponent.children.length === 0 &&
        propsNames.includes('children')
      ) {
        content += `<${componentName} ${propsContent}>${childComponent.props.children}</${componentName}>`
      } else if (childComponent.type === 'Icon') {
        content += `<${childComponent.props.icon} ${propsContent} />`
      } else if (
        childComponent.children.length &&
        componentName !== 'Conditional' &&
        componentName !== 'Loop'
      ) {
        content += `<${componentName} ${propsContent}>
      ${buildBlock({ component: childComponent, components, forceBuildBlock })}
      </${componentName}>`
      } else if (componentName === 'Conditional') {
        const conditionalValue = returnConditionalValue(
          propsNames,
          childComponent,
        )
        content += `{${
          typeof conditionalValue === 'boolean'
            ? `${conditionalValue}`
            : `${
                conditionalValue.slice(0, 1) === '{'
                  ? `${conditionalValue.slice(1, -1)}`
                  : `'${conditionalValue}'`
              }`
        }? <>${buildSingleBlock({
          index: 0,
          component: childComponent,
          components,
          forceBuildBlock,
        })}</>: <>${buildSingleBlock({
          index: 1,
          component: childComponent,
          components,
          forceBuildBlock,
        })}</>}`
      } else if (componentName === 'Loop') {
        const loopValue = returnLoopValue(propsNames, childComponent)
        content += `{${
          typeof loopValue === 'object'
            ? `${JSON.stringify(loopValue)}`
            : `${
                loopValue.slice(0, 1) === '{'
                  ? `${loopValue.slice(1, -1)}`
                  : `${loopValue}`
              }`
        }.map((item${childComponent.id.slice(
          7,
          10,
        )}, index${childComponent.id.slice(7, 10)}) => (<Box>${buildBlock({
          component: childComponent,
          components,
          forceBuildBlock,
        })}</Box>))}`
      } else {
        content += `<${componentName} ${propsContent} />`
      }
    } else {
      content += `<${childComponent.componentName} />`
    }
  })

  return content
}

const buildComponents = (components: IComponents) => {
  const codes = filter(components, comp => !!comp.componentName).map(comp => {
    return generateComponentCode({
      component: { ...components[comp.parent], children: [comp.id] },
      components,
      forceBuildBlock: true,
      componentName: comp.componentName,
    })
  })

  return codes.reduce((acc, val) => {
    return `
      ${acc}

      ${val}
    `
  }, '')
}

type GenerateComponentCode = {
  component: IComponent
  components: IComponents
  componentName?: string
  forceBuildBlock?: boolean
}

export const generateComponentCode = ({
  component,
  components,
  componentName,
  forceBuildBlock,
}: GenerateComponentCode) => {
  let code = buildBlock({
    component,
    components,
    forceBuildBlock,
  })

  code = `
const ${componentName} = () => (
  ${code}
)`

  return code
}

const getIconsImports = (components: IComponents) => {
  return Object.keys(components).flatMap(name => {
    return Object.keys(components[name].props)
      .filter(
        prop =>
          (prop.toLowerCase().includes('icon') && prop !== 'iconSpacing') ||
          (prop.toLowerCase() === 'as' &&
            Object.keys(icons).includes(components[name].props[prop])),
      )
      .filter(prop => !!components[name].props[prop])
      .map(prop => components[name].props[prop])
  })
}

export const initializeParams = (params: any) => {
  let paramsCode = ``
}

export const generateMainTsx = (params: any, fileName: string) => {
  let refsCode = ``
  let appCode = `return <${fileName}OC \n`
  params.map((param: any) => {
    appCode += `${
      param.ref
        ? `${param.name}={(ref) => set${capitalize(param.name)}(ref)}\n`
        : `${param.name}={${param.name}}\n`
    }`
    if (param.ref) {
      refsCode += `const [${param.name}, set${capitalize(
        param.name,
      )}] = useState${param.type.replace('RefObject', '').slice(0, -1) +
        ' | null >'}();\n`
    }
  })
  appCode += `/>;`
  return { refsCode, appCode }
}

export const generateCode = async (
  components: Record<string, ComponentState>,
  componentsList: Record<string, CustomComponent>
) => {
  let code = buildBlock({ component: components.root, components })
  let componentsCodes = buildComponents(components)
  const { paramTypes, params } = buildParams(components.root.params)
  const iconImports = Array.from(new Set(getIconsImports(components)))
  const nonImports = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

  let imports = [
    ...new Set([
      ...new Set(
        Object.keys(components)
          .filter(
            name =>
              name !== 'root' &&
              components[name].type !== 'Conditional' &&
              components[name].type !== 'Loop' &&
              components[name].type !== 'Box' &&
              !Object.keys(componentsList).includes(components[name].type)
          )
          .map(name => components[name].type),
      ),
      ...new Set(
        Object.keys(components).flatMap(name => {
          return Object.keys(components[name].props)
            .filter(
              prop =>
                prop.toLowerCase() === 'as' &&
                !Object.keys(icons).includes(components[name].props[prop]) &&
                !nonImports.includes(components[name].props[prop]),
            )
            .filter(prop => !!components[name].props[prop])
            .map(prop => components[name].props[prop])
        }),
      ),
    ]),
  ]

  const customImports = [
    ...new Set(
      Object.keys(components)
        .filter(
          name =>
            name !== 'root' &&
            components[name].type !== 'Conditional' &&
            Object.keys(componentsList).includes(components[name].type),
        )
        .map(
          name =>
            `import { ${convertToPascal(
              componentsList[components[name].type].template
            )} } from '@tiui/${componentsList[components[name].type].template
              .slice(3)
              .replaceAll('/', '.')}';`,
        ),
    ),
  ]

  code = `import React, {RefObject} from 'react';
import {
  ChakraProvider,
  Box,
  ${imports.join(',')}
} from "@chakra-ui/react";${
    iconImports.length
      ? `
import { ${iconImports.join(',')} } from "@chakra-ui/icons";`
      : ''
  }

  ${customImports.join(';')}

${paramTypes ? paramTypes : ''}

${componentsCodes}

const App = (${params ? params : ''}) => (
  <>
    ${code}
  </>
);

export default App;`
  return await formatCode(code)
}

export const generateOcTsxCode = async (
  components: IComponents,
  currentComponents: CustomDictionary = {},
) => {
  let code = buildBlock({ component: components.root, components })
  let componentsCodes = buildComponents(components)

  const { paramTypes, params } = buildParams(components.root.params, true)
  const iconImports = Array.from(new Set(getIconsImports(components)))
  const nonImports = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

  let imports = [
    ...new Set([
      ...new Set(
        Object.keys(components)
          .filter(
            name =>
              name !== 'root' &&
              components[name].type !== 'Conditional' &&
              components[name].type !== 'Loop' &&
              components[name].type !== 'Box' &&
              !Object.keys(currentComponents).includes(components[name].type)
          )
          .map(name => components[name].type),
      ),
      ...new Set(
        Object.keys(components).flatMap(name => {
          return Object.keys(components[name].props)
            .filter(
              prop =>
                prop.toLowerCase() === 'as' &&
                !Object.keys(icons).includes(components[name].props[prop]) &&
                !nonImports.includes(components[name].props[prop]),
            )
            .filter(prop => !!components[name].props[prop])
            .map(prop => components[name].props[prop])
        }),
      ),
    ]),
  ]

  const customImports = [
    ...new Set(
      Object.keys(components)
        .filter(
          name =>
            name !== 'root' &&
            components[name].type !== 'Conditional' &&
            Object.keys(currentComponents).includes(components[name].type),
        )
        .map(
          name =>
            `import { ${convertToPascal(
              currentComponents[components[name].type],
            )} } from 'src/custom-components/customOcTsx/${
              components[name].type
            }';`,
        ),
    ),
  ]

  code = `import React, {RefObject} from 'react';
import {
  ChakraProvider,
  Box,
  ${imports.join(',')}
} from "@chakra-ui/react";${
    iconImports.length
      ? `
import { ${iconImports.join(',')} } from "@chakra-ui/icons";`
      : ''
  }

  ${customImports.join(';')}

${paramTypes ? paramTypes : ''}

${componentsCodes}

const App = (${params ? params : ''}) => (
  <>
    ${code}
  </>
);

export default App;`

  return await formatCode(code)
}

export const generateICPanel = async (
  fileName: string,
  paramList: CustomDictionary[],
) => {
  let boolArray = paramList.filter(param => param.type === 'boolean')
  let textArray = paramList.filter(
    param => param.type === 'string' || param.type === 'number',
  )
  let enumArray = paramList.filter(param => {
    param.type.includes('|')
  })
  let boolCode = boolArray.map(param => {
    return `<SwitchControl label="${param.name}" name="${param.name}" />`
  })
  let textCode = textArray.map(param => {
    return `<TextControl label="${param.name}" name="${param.name}" />`
  })
  let selectCode = enumArray.map(param => {
    return `const ${param.name} = usePropsSelector('${param.name}')`
  })

  const controlCodeOptions = (options: string) => {
    let optionArray = options.split('|')
    optionArray = optionArray.map(opt => {
      return `<option>${opt.trim()}</option>`
    })
    return optionArray.join('\n')
  }

  let controlCode = enumArray.map(param => {
    return `<FormControl htmlFor="${param.name}" label="${param.name}">
    <Select
      id="${param.name}"
      onChange={setValueFromEvent}
      name="${param.name}"
      size="sm"
      value={${param.name} || ''}
    >
      ${controlCodeOptions(param.type)}
    </Select>
  </FormControl>`
  })
  let code = `import React, { memo } from 'react'
  ${
    boolArray.length > 0
      ? `import SwitchControl from 'src/components/inspector/controls/SwitchControl'`
      : ``
  }
  ${
    textArray.length > 0
      ? `import TextControl from 'src/components/inspector/controls/TextControl'`
      : ``
  }
  ${
    enumArray.length > 0
      ? `import { Select } from '@chakra-ui/react'
  import FormControl from 'src/components/inspector/controls/FormControl'
  import { useForm } from 'src/hooks/useForm'
  import usePropsSelector from 'src/hooks/usePropsSelector'`
      : ``
  }

  const ${fileName}Panel = () => {

    ${enumArray.length > 0 ? `const { setValueFromEvent } = useForm()` : ``}
    ${selectCode.join('\n')}
    return (
      <>
        ${boolCode.join('\n')}
        ${textCode.join('\n')}
        ${controlCode.join('\n')}
      </>
    )
  }
  
  export default memo(${fileName}Panel)`
  code = await formatCode(code)

  return code
}

export const generatePreview = async (
  components: IComponents,
  fileName: string,
  selectedComponent?: string,
) => {
  let code = buildBlock({ component: components.root, components })
  const iconImports = Array.from(new Set(getIconsImports(components)))
  const paramsContent = destructureParams(components.root.params)

  code = `import React from 'react'
  import { useDropComponent } from 'src/hooks/useDropComponent'
  import { useInteractive } from 'src/hooks/useInteractive'
  import { Box } from "@chakra-ui/react";

  ${`import { ${fileName} } from 'src/custom-components/customOcTsx/${selectedComponent}';`}

  ${
    iconImports.length
      ? `
  import { ${iconImports.join(',')} } from "@chakra-ui/icons";`
      : ''
  }

  interface Props {
    component: IComponent
  }

  const ${fileName}Preview = ({ component, index }: Props) => {
  const { isOver } = useDropComponent(component.id, index, ref)
  const { props, ref } = useInteractive(component, index)

  if (isOver) {
      props.bg = 'teal.50'
    }

    ${paramsContent}

    return (<Box {...props} ref={ref}>
      ${`<${fileName}  {...props}/>`}
    </Box>)
  }

  export default ${fileName}Preview`

  code = await formatCode(code)
  return code
}

export const generatePanel = async (
  components: IComponents,
  fileName: string,
) => {
  let eligibleParams = components.root.params?.filter(param => param.exposed)

  const textControls = [
    ...new Set(
      eligibleParams
        ?.filter(param => param.type === 'string' || param.type === 'number')
        .map(
          param => `<TextControl label="${param.name}" name="${param.name}" />`,
        ),
    ),
  ]

  const switchControls = [
    ...new Set(
      eligibleParams
        ?.filter(param => param.type === 'boolean')
        .map(
          param =>
            `<SwitchControl label="${param.name}" name="${param.name}" />`,
        ),
    ),
  ]

  const colorsControls = [
    ...new Set(
      eligibleParams
        ?.filter(param => param.type === 'color')
        .map(
          param =>
            `<ColorsControl label="${param.name}" name="${param.name}" />`,
        ),
    ),
  ]

  const iconControls = [
    ...new Set(
      eligibleParams
        ?.filter(param => param.type === 'icon')
        .map(
          param => `<IconControl label="${param.name}" name="${param.name}" />`,
        ),
    ),
  ]

  const displayProps = [
    ...new Set(
      eligibleParams
        ?.filter(param => param.type === 'display')
        .map(param => {
          return `const ${param.name} = usePropsSelector('${param.name}')
      const alignItems${param.name} = usePropsSelector('alignItems')
      const flexDirection${param.name} = usePropsSelector('flexDirection')
      const justifyContent${param.name} = usePropsSelector('justifyContent')`
        }),
    ),
  ]

  const displayControls = [
    ...new Set(
      eligibleParams
        ?.filter(param => param.type === 'display')
        .map(param => {
          return `<FormControl htmlFor="${param.name}" label="${param.name}">
    <Select
      id="${param.name}"
      onChange={setValueFromEvent}
      name="${param.name}"
      size="sm"
      value={${param.name} || ''}
    >
      <option>block</option>
      <option>flex</option>
      <option>inline</option>
      <option>grid</option>
    </Select>
  </FormControl>
  {${param.name} === 'flex' ? (<><FormControl label="flexDirection">
  <Select
    name="flexDirection${param.name}"
    size="sm"
    value={flexDirection${param.name} || ''}
    onChange={setValueFromEvent}
  >
    <option>row</option>
    <option>row-reverse</option>
    <option>column</option>
    <option>column-reverse</option>
  </Select>
</FormControl>

<FormControl label="justifyContent">
  <Select
    name="justifyContent${param.name}"
    size="sm"
    value={justifyContent${param.name} || ''}
    onChange={setValueFromEvent}
  >
    <option>flex-start</option>
    <option>center</option>
    <option>flex-end</option>
    <option>space-between</option>
    <option>space-around</option>
  </Select>
</FormControl></>) : null}
  `
        }),
    ),
  ]

  let panelCode = `import React, { memo } from 'react'
  ${
    eligibleParams?.some(
      param => param.type === 'string' || param.type === 'number',
    )
      ? `import TextControl from 'src/components/inspector/controls/TextControl'`
      : ''
  }
  ${
    eligibleParams?.some(param => param.type === 'boolean')
      ? `import SwitchControl from 'src/components/inspector/controls/SwitchControl'`
      : ''
  }
  ${
    eligibleParams?.some(param => param.type === 'color')
      ? `import ColorsControl from 'src/components/inspector/controls/ColorsControl'`
      : ''
  }
  ${
    eligibleParams?.some(param => param.type === 'display')
      ? `import FormControl from 'src/components/inspector/controls/FormControl'
  import { useForm } from 'src/hooks/useForm'
  import usePropsSelector from 'src/hooks/usePropsSelector'
  import { Select } from '@chakra-ui/react'`
      : ''
  }
  ${
    eligibleParams?.some(param => param.type === 'icon')
      ? `import IconControl from 'src/components/inspector/controls/IconControl'`
      : ''
  }

  const ${fileName}Panel = () => {
    ${
      eligibleParams?.some(param => param.type === 'display')
        ? `const { setValueFromEvent } = useForm()
  ${displayProps.join('\n')}`
        : ''
    }
    return (
    <>
    ${
      eligibleParams?.some(
        param => param.type === 'string' || param.type === 'number',
      )
        ? `${textControls.join('')}`
        : ''
    }
    ${
      eligibleParams?.some(param => param.type === 'boolean')
        ? `${switchControls.join('')}`
        : ''
    }
    ${
      eligibleParams?.some(param => param.type === 'color')
        ? `${colorsControls.join('')}`
        : ''
    }
    ${
      eligibleParams?.some(param => param.type === 'icon')
        ? `${iconControls.join('')}`
        : ''
    }
    ${
      eligibleParams?.some(param => param.type === 'display')
        ? `${displayControls.join('\n')}`
        : ''
    }
    </>
    )
  }

  export default memo(${fileName}Panel)
  `

  panelCode = await formatCode(panelCode)
  return panelCode
}

export const generateICPreview = async (
  fileName: string,
  selectedComponent?: string,
) => {
  let code = `import React from 'react'
  import { useDropComponent } from 'src/hooks/useDropComponent'
  import { useInteractive } from 'src/hooks/useInteractive'
  import { Box } from "@chakra-ui/react";

  ${`import { ${fileName} } from '${selectedComponent}';`}

  interface Props {
    component: IComponent
  }

  const ${fileName}Preview = ({ component, index }: Props) => {

  const { isOver } = useDropComponent(component.id, index, ref)
  const { props, ref } = useInteractive(component, index)

  if (isOver) {
      props.bg = 'teal.50'
    }


    return (<Box {...props} ref={ref}>
      ${`<${fileName}  {...props}/>`}
    </Box>)
  }

  export default ${fileName}Preview`

  code = await formatCode(code)
  return code
}
