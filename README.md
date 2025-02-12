<div align="center" style="display:flex;flex-direction:column;">
    <img src="./public/karmyc_logo.svg" alt="Openchakra: Visual editor for Chakra UI." />
  <h3>Multi Purpose Visual Editor</h3>
</div>

Karmyc is a visual editor. It was forked from the very cool and standalone [OpenChakra](https://github.com/premieroctet/openchakra) in the first place. I've gathered all improvements I've found in various forks and make the tool a React component.


## Features

- 🎨 Drag and drop [Chakra UI](https://chakra-ui.com/getting-started) components
- 💅 Preset components
- 👀 Live props editing and styling
- ⚛️ Production-ready code
- 🎈 CodeSandbox export
- 🔮 Undo/redo edit
- 💽 Localstorage sync

## Roadmap
### To come
- Inject components and config
- Chakra UI V3 migration
- (wip)
### Item unherited from OpenChakra roadmap
- More Chakra UI components integration
- Components copy
- Props panel improvements
- Code generation improvements
- Dark mode support
- Custom presets
- Custom theme
- Handle PseudoBox state (hover, active…)
- Fix bugs 🧨

## Getting started

### Install and Run Locally
Follow the following steps to get this up and running locally:
1. Install dependencies: `npm install`
1. Run dev server locally `npm run dev`

OpenChakra will be running on `localhost`!

### Builder mode

The Builder mode adds extra padding/border to ease components selection (like containers).

> 💡Toggle the Builder mode with the `b` shortcut

### Code panel

Toggle the code panel for viewing the JSX/React code of your components. You can even export your code directly to CodeSandbox!

> 💡Toggle the Code panel with the `c` shortcut

### Components panel

Drag any component from the left hand panel into this editor. Then start interacting with them.
You can drag a preset: it's a group of components (like Alert). Just drop a preset to easily setup a complex component!

### Inspector

**Update props & style**

On the right hand-side, you can find the inspector panel. You will find the tools to edit the component's props and style.

**Delete, reset and documentation**

Reach the yellow bar on the top to delete, reset and access the Chakra documentation of each component.

**Sort components**

By clicking on a component containing children, you will see a Children panel appearing on the right. It enables sorting the children.

### Editor Shortcuts

| Shortcut         | Description               |
| ---------------- | ------------------------- |
| `cmd+Z` `ctrl+Z` | Undo last action          |
| `cmd+Y` `ctrl+y` | Redo action               |
| `cmd+D` `ctrl+d` | Duplicate component       |
| `del`            | Delete selected component |
| `b`              | Toggle Builder mode       |
| `p`              | Select parent component   |
| `Esc`            | Unselect component        |

## Other information
### FAQ
- Why this name ? \
This component is heavely based on [OpenChakra](https://github.com/premieroctet/openchakra), itself relying on [Chakra UI](https://chakra-ui.com/getting-started). Chakra, chained things, inheritance... Karma. Moreover, I've worked on an OpenChakra integration in a previous job andd even if I'm making this one from scratch, it's obvious I would not do this now without this prior experience (well, maybe not, it was perhaps some kind of destiny thing! Or not.)
- But why karm**Y**c ? \
Glad you ask. \
Mainly two reasons: \
  1. there's already a Github project with Karmic label.
  2. My name is **Y**ann.

### Code Contributors

This project exists thanks to all the people from [Premier Octet](https://www.premieroctet.com) who originally created and supported this project. 
