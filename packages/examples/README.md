# Karmyc Examples

This package contains example applications and demos showing how to use Karmyc.

## Getting Started

```bash
# Install dependencies (from the root of the monorepo)
yarn install

# Run the examples application
yarn dev:examples
```

## Available Examples

1. **Text Note Area** - Basic text editing area
2. **Color Picker** - Simple color selection tool
3. **Image Viewer** - Basic image viewing area
4. **History Drawing** - Drawing canvas with undo/redo functionality
5. **Custom Layout** - Example of custom layout configuration

## Keyboard Shortcuts

- **Ctrl+S** - Save (in text note and drawing areas)
- **Ctrl+R** - Reload/Reset (in color picker, image viewer, and drawing areas)

## Directory Structure

```
src/
├── components/     # Reusable components for examples
├── styles/         # CSS styles for examples
├── static/         # Static assets
├── App.tsx         # Main application component
├── main.tsx        # Entry point
└── AreaInitializer.tsx  # Registers all area types
```

## Contributing

If you'd like to add a new example, create a new component in the `components` directory and register it in `AreaInitializer.tsx`. 
