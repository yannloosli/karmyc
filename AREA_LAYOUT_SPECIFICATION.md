# Feature Specification: Dynamic Area Layout

## 1. Introduction

This document specifies the required layout behavior for "Area" components within Karmyc, specifically addressing how an Area's content should utilize available space when its optional `menubar` (header) or `statusbar` (footer) are not present or hidden.

## 2. Requirement

The primary requirement is that the main content section of an Area component must dynamically expand vertically to fill any space that would otherwise be occupied by the `menubar` or `statusbar` if those elements are absent or configured to be hidden for that specific Area instance.

-   If **both** `menubar` and `statusbar` are present, the content area occupies the space between them.
-   If **only** the `menubar` is present, the content area should expand downwards to fill the space up to the bottom edge of the Area container.
-   If **only** the `statusbar` is present, the content area should expand upwards to fill the space from the top edge of the Area container down to the `statusbar`.
-   If **neither** the `menubar` nor the `statusbar` are present, the content area should occupy the full height of the Area container.

The Area container itself is assumed to have a defined height (e.g., determined by the grid layout it resides in).

## 3. Implementation Strategy (CSS Flexbox Recommended)

The recommended approach to achieve this dynamic layout is using CSS Flexbox.

### 3.1. Area Container Structure

The main container element for each Area should be styled as a flex container with a vertical direction.

```html
<!-- Conceptual Structure of an Area Component -->
<div class="area-container">
  {showMenubar && <MenuBarComponent />}

  <div class="area-content">
    {/* Main content of the area goes here */}
    {children}
  </div>

  {showStatusbar && <StatusBarComponent />}
</div>
```

### 3.2. CSS Styling

Apply the following CSS principles (actual class names may vary):

```css
.area-container {
  display: flex;
  flex-direction: column;
  /* Ensure the container itself has a defined height, often 100% of its parent */
  height: 100%;
  /* Prevent content overflow issues if container size is fixed */
  overflow: hidden;
}

.area-content {
  /* This is the crucial part: allows the content to grow and shrink */
  flex-grow: 1;
  /* If content might exceed available space, add scrollbars */
  overflow-y: auto; /* or overflow: auto; */
  /* Prevent shrinking below minimum content size if needed */
  /* flex-shrink: 0; */ /* Use with caution */
}

/* Menubar and Statusbar components should have their natural height */
.menu-bar-component,
.status-bar-component {
  /* flex-grow: 0; */ /* Default, but good to be explicit */
  flex-shrink: 0; /* Prevent bars from shrinking if content is large */
  /* Define their height or let content determine it */
  height: auto; /* or a fixed height e.g., 30px */
}
```

### 3.3. Conditional Rendering

The React component responsible for rendering an Area (`AreaComponent.tsx` or similar) must conditionally render the `<MenuBarComponent />` and `<StatusBarComponent />` **based purely on whether the respective bar component has actual content (children or specific props) to display.**

```typescript
// Example Props for an Area component
interface AreaProps {
  // showMenubar: boolean; // No longer needed
  // showStatusbar: boolean; // No longer needed
  menubarContent?: React.ReactNode; // Optional content for the menubar
  statusbarContent?: React.ReactNode; // Optional content for the statusbar
  children: React.ReactNode; // Main content
  // ... other props
}

// Inside the Area component's render method:
render() {
  const { menubarContent, statusbarContent, children } = this.props; // Or using hooks

  // Determine if bars should actually render based *only* on content
  const shouldRenderMenubar = !!menubarContent; // Render if content exists
  const shouldRenderStatusbar = !!statusbarContent; // Render if content exists

  return (
    <div className="area-container">
      {shouldRenderMenubar && <MenuBarComponent>{menubarContent}</MenuBarComponent>}
      <div className="area-content">
        {children}
      </div>
      {shouldRenderStatusbar && <StatusBarComponent>{statusbarContent}</StatusBarComponent>}
    </div>
  );
}
```
This ensures that space is only allocated for the menubar or statusbar if they actually contain something to display for that specific Area instance.

## 4. Alternative (CSS Grid)

CSS Grid can also achieve this layout:

```css
.area-container {
  display: grid;
  /* Define rows: auto height for bars, fraction unit for flexible content */
  grid-template-rows: auto 1fr auto;
  height: 100%;
  overflow: hidden;
}

.menu-bar-component { grid-row: 1; }
.area-content       { grid-row: 2; overflow-y: auto; }
.status-bar-component { grid-row: 3; }

/* If bars are not rendered, their grid rows effectively collapse,
   and the '1fr' content row takes up the available space. */
```
The conditional rendering in React remains the same. Flexbox is often considered slightly simpler for this specific 1-dimensional layout.

## 5. Impact

-   **CSS:** Requires defining or updating the CSS for Area containers and their direct children (`menubar`, content, `statusbar`).
-   **React Components:** The Area component needs to implement conditional rendering **based solely on checking if there is actual content (e.g., `menubarContent`, `statusbarContent` props or children) provided for the `MenuBarComponent` and `StatusBarComponent` before rendering them.** The explicit `showMenubar`/`showStatusbar` boolean props are removed.
-   **Configuration:** A mechanism must exist (likely via props passed down from the grid layout configuration) to provide the *content* for the `menubar` and `statusbar` if they are to be displayed. The decision to display them is now implicit based on whether content is provided.

This change simplifies the component's props API but still primarily affects layout and styling, impacting application logic only at the point where content is passed (or not passed) to the Area component. 
