# Theme System Documentation

## Overview

El CMS ahora incluye un sistema completo de temas con:
- 4 temas built-in (Light, Dark, Light HC, Dark HC)
- Selector de apariencia en el admin panel
- Cálculo automático de contraste WCAG
- Persistencia en localStorage
- Variables CSS dinámicas

## Themes Available

| Theme ID | Name | Mode | Contrast |
|----------|------|------|----------|
| `light-default` | Light (Default) | light | Normal |
| `dark-default` | Dark | dark | Normal |
| `light-enhanced` | Light (High Contrast) | light | Enhanced |
| `dark-enhanced` | Dark (High Contrast) | dark | Enhanced |

## Usage

### In React Components

```tsx
import { useTheme } from '@/lib/useTheme';

export default function MyComponent() {
  const { theme, selectTheme, availableThemes } = useTheme();

  return (
    <div>
      <p>Current theme: {theme?.name}</p>
      <button onClick={() => selectTheme('dark-default')}>
        Switch to Dark
      </button>
    </div>
  );
}
```

### In CSS

Use CSS variables for theming:

```css
.button {
  background: var(--color-primary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 0.5rem 1rem;
}

.button:hover {
  background: var(--color-accent);
}
```

### Available CSS Variables

```
--color-primary          Primary brand color
--color-secondary        Secondary color
--color-accent          Accent highlight
--color-background      Page background
--color-surface         Card/surface background
--color-text            Main text color
--color-text-secondary  Secondary text color
--color-border          Border colors
--color-success         Success/green
--color-warning         Warning/yellow
--color-error           Error/red
```

## Contrast Ratios

All themes are WCAG tested:
- Normal: Min 4.5:1 (AA)
- Enhanced: Min 7:1 (AAA)

## Adding the Theme Selector to Admin

Add `<ThemeSelector />` to your admin dashboard:

```tsx
import ThemeSelector from '@/components/admin/ThemeSelector';

export default function Dashboard() {
  return (
    <div>
      <ThemeSelector />
      {/* Rest of dashboard */}
    </div>
  );
}
```

## Creating Custom Themes

Add to `src/lib/themes.ts` in the `BUILTIN_THEMES` array:

```typescript
{
  id: 'custom-theme',
  name: 'My Custom Theme',
  mode: 'light',
  colors: {
    primary: '#ff0000',
    secondary: '#00ff00',
    // ... rest of colors
  },
  contrast: 'normal',
}
```

## Storing Theme Preference

Theme selection is stored in localStorage under key:
```
cms-theme-preference: {"themeId": "light-default", "mode": "light"}
```

## Testing Accessibility

Check contrast ratios programmatically:

```typescript
import { getContrastRatio } from '@/lib/themes';

const ratio = getContrastRatio('#ffffff', '#000000');
console.log(`Contrast ratio: ${ratio}:1`); // 21:1
```

## Best Practices

1. Always use CSS variables, not hardcoded colors
2. Test color combinations with `getContrastRatio()`
3. Provide high-contrast alternatives for important elements
4. Use `theme.colors` in TypeScript for type safety
5. Test both light and dark modes in UI components
