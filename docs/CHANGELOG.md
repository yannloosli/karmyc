# Documentation Changelog - Karmyc Core

## Unreleased

### Breaking Changes (Hard Clean)
- Removed legacy history API and types:
  - Deleted legacy types: `IHistoryOptions`, `THistoryState`, `THistoryChange`, `THistoryDiff`, `THistoryAction`, `IHistoryState`, `TUndoableOptions`, `HistoryConfig`.
  - Removed legacy `SpaceSharedState` and `pastDiffs`/`futureDiffs` usage.
  - Removed `undoSharedState`/`redoSharedState` from `spaceStore` (use `undoEnhanced`/`redoEnhanced`).
- Deprecated hook `useSpaceHistory` now throws an error directing to `useHistory` or `useActiveSpaceHistory`.

### Docs
- Updated README and API reference to reference `useHistory` (renamed from `useEnhancedHistory`).

### Naming Simplification
- Hook rename: `useEnhancedHistory` → `useHistory` (a backward-compatible alias `useEnhancedHistory` still exists, but docs/examples use `useHistory`).
- Docs files renamed:
  - `README_ENHANCED_HISTORY.md` → `README_HISTORY.md`
  - `ENHANCED_HISTORY_EXAMPLES.md` → `HISTORY_EXAMPLES.md`

## Version 1.0.0-beta18 - Documentation Update

### Overview
This update provides a comprehensive revision of the Karmyc Core documentation to accurately reflect the current API and architecture based on source code analysis.

### Major Changes

#### Architecture Updates

**useArea vs useAreaOptimized Hook Architecture**

This update clarifies the significant architectural differences between the two area management approaches:

**useArea.ts (Classic Approach)**:
- Centralized hook with callback-based data access
- Uses `useMemo` for action memoization
- Provides basic CRUD operations
- Tolerant type validation with fallback types
- Traditional React patterns with potential re-render issues

**useAreaOptimized.ts (Modular Approach)**:
- Modular architecture with specialized hooks
- Zustand selector-based optimization
- Granular data access reducing unnecessary re-renders
- Extended functionality with advanced layout operations
- Strict type validation without fallbacks
- Performance-optimized for complex applications

**Key Architectural Changes**:
- **Data Access**: Moved from callbacks (`getActive()`, `getById()`) to optimized selectors (`useActiveArea()`, `useAreaById()`)
- **Performance**: Introduced specialized hooks that only re-render when specific data changes
- **Functionality**: Extended with layout operations (`splitArea`, `joinOrMoveArea`, `setRowSizes`)
- **Type Safety**: Stricter validation in optimized version
- **Interface**: Different position interfaces (`Position` vs `AreaPosition`)

**Migration Impact**:
- Legacy code can continue using `useArea()` for compatibility
- New development should prefer `useAreaOptimized()` for better performance
- Specialized hooks provide granular control over component re-renders
- Enhanced debugging and development experience with typed actions

#### README.md
- **Updated React version requirement**: Changed from React 18.2+ to React 19.0+
- **Corrected API references**: Updated all hook and component references to match current implementation
- **Enhanced Quick Start guide**: Improved examples with current API patterns
- **Added missing hooks**: Documented `useAreaOptimized`, `useResizePreview`, `useContextMenu`, etc.
- **Updated configuration interface**: Added missing options like `validators`, `allowStackMixedRoles`, `t`, `spaces`
- **Added component documentation**: Documented `AreaErrorBoundary`, `AreaTabs`, `ScreenSwitcher`, etc.
- **Enhanced advanced features**: Added multi-screen support and built-in layouts documentation

#### API_REFERENCE.md
- **Complete API overhaul**: Updated all hook signatures and return types to match current implementation
- **Corrected useArea hook**: Changed from `useArea(id)` to `useArea()` with action functions
- **Updated useAreaOptimized architecture**: Documented the complete modular architecture with specialized hooks
- **Added specialized area hooks**: Documented `useAreaById`, `useActiveArea`, `useAllAreas`, `useAreaLayoutById`, `useAreaViewports`, etc.
- **Enhanced area hook documentation**: Added comprehensive comparison between `useArea()` and `useAreaOptimized()`
- **Updated useSpace hook**: Removed optional parameter, simplified return type
- **Enhanced component documentation**: Added all available components with proper interfaces
- **Added missing hooks**: Documented all hooks found in source code
- **Updated type definitions**: Corrected all TypeScript interfaces to match current types
- **Added menu components**: Documented context menu system components

#### CORE_CONCEPTS.md
- **Architecture updates**: Updated diagrams to reflect current store structure
- **Enhanced area system**: Added comprehensive area type and registration documentation
- **Updated layout system**: Added layout tree structure and operations
- **Enhanced plugin system**: Updated plugin architecture and integration
- **Added multi-screen support**: Documented screen management system
- **Added tools slot system**: Documented UI injection system
- **Enhanced drag and drop**: Added comprehensive drag and drop flow
- **Added context menu system**: Documented menu architecture
- **Added error handling**: Documented error boundary system
- **Added performance optimizations**: Documented optimization strategies

#### AREA_GUIDE.md
- **Complete rewrite**: Restructured to focus on practical area development
- **Enhanced fundamentals**: Added comprehensive area structure and role documentation
- **Improved state management**: Updated to use current hooks architecture with specialized optimized hooks
- **Added hook comparison**: Comprehensive comparison between `useArea()` and `useAreaOptimized()` approaches
- **Documented specialized hooks**: Added usage examples for `useAreaById`, `useActiveArea`, `useAllAreas`, etc.
- **Added performance optimization**: Documented how optimized hooks reduce unnecessary re-renders
- **Enhanced migration guide**: Added step-by-step migration from classic to optimized hooks
- **Added interaction patterns**: Documented drag and drop, context menus, keyboard shortcuts
- **Enhanced error handling**: Added error boundaries and fallback components
- **Added styling guide**: Documented CSS classes and custom styling
- **Added performance section**: Documented optimization strategies
- **Enhanced configuration**: Updated area configuration examples
- **Added advanced features**: Documented area stacks, previews, and joining
- **Added best practices**: Comprehensive development guidelines

### Technical Updates

#### Hook Signatures
- `useArea()`: Now returns action functions instead of state/actions object
- `useSpace()`: Simplified to return all spaces and active space
- `useKarmyc()`: Updated configuration interface with new options
- `useHistory()`: Enhanced with additional utility functions

#### Component Interfaces
- `AreaComponentProps`: Updated to match current implementation
- `KarmycCoreProviderProps`: Added missing optional properties
- `AreaTypeOptions`: Updated with current role enum values

#### Type Definitions
- `IArea`: Updated with current structure including optional position and spaceId
- `IKarmycOptions`: Added missing configuration options
- `LayoutPreset`: Updated with current layout configuration structure
- `EnhancedHistoryAction`: Enhanced with additional metadata fields

### New Features Documented

#### Multi-Screen Support
- Screen management operations
- Detached window support
- State synchronization between screens

#### Tools Slot System
- UI injection architecture
- Slot types and positions
- Component registration system

#### Enhanced Error Handling
- Error boundary system
- Fallback components
- Error recovery strategies

#### Performance Optimizations
- Memoization strategies
- Selective updates
- Lazy loading
- Viewport culling

### Removed/Deprecated

#### Outdated API References
- Removed references to non-existent hooks
- Updated deprecated component interfaces
- Corrected outdated configuration options

#### Inaccurate Examples
- Replaced all examples with current API patterns
- Updated code snippets to match actual implementation
- Corrected TypeScript interfaces

### Migration Notes

#### For Existing Users
1. **Hook Usage**: Update `useArea(id)` calls to `useArea()` and use returned action functions
2. **Configuration**: Add missing options like `validators` and `allowStackMixedRoles`
3. **Component Props**: Update component interfaces to match current implementation
4. **Type Imports**: Ensure all types are imported from correct locations

#### Breaking Changes
- `useArea(id)` signature change
- Configuration interface updates
- Component prop interface changes

### Documentation Structure

#### File Organization
- `README.md`: Main overview and quick start
- `docs/API_REFERENCE.md`: Complete API documentation
- `docs/CORE_CONCEPTS.md`: Architecture and concepts
- `docs/AREA_GUIDE.md`: Area development guide
- `docs/PLUGIN_SYSTEM.md`: Plugin development (unchanged)
- `docs/README_HISTORY.md`: History system
- `docs/HISTORY_EXAMPLES.md`: History examples
- `docs/PLUGIN_GUIDE.md`: Plugin guide (unchanged)

### Quality Improvements

#### Accuracy
- All API references verified against source code
- Type definitions match actual implementation
- Examples tested against current API

#### Completeness
- Documented all exported hooks and components
- Added missing configuration options
- Included all available features

#### Clarity
- Improved code examples
- Enhanced diagrams and flow charts
- Better organization and structure

### Future Considerations

#### Planned Updates
- Additional examples for advanced use cases
- Performance benchmarking guide
- Migration guide for major version updates
- Troubleshooting guide expansion

#### Maintenance
- Regular API verification against source code
- Example code testing
- User feedback integration

---

*This changelog documents the comprehensive documentation update for Karmyc Core version 1.0.0-beta18, ensuring all documentation accurately reflects the current implementation.*
