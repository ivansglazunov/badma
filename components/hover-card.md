# HoverCard Component

A React component that creates interactive hover effects with 3D transforms, built using `react-resize-detector` for automatic size detection and native React mouse events.

## Features

- 🎯 **Mouse-following tilt effects** - Card rotates based on mouse position
- 📱 **Device orientation support** - Responds to device tilting with inertia effects
- 📏 **Automatic size detection** - Uses `react-resize-detector` to adjust to content size
- 🎚️ **Configurable force levels** - Control the intensity of hover effects (0-1)
- ✨ **Smooth animations** - CSS transitions with optimized performance
- 🎨 **Customizable parameters** - Maximum rotation, lift height, and glow effects
- 🔄 **Inertia effects** - Card returns to center after device tilt
- 🚫 **Disable option** - Can be disabled for accessibility or performance

## Usage

```tsx
import { HoverCard } from '../components/hover-card';

// Basic usage
<HoverCard>
  <div className="your-content">
    Content goes here
  </div>
</HoverCard>

// Advanced usage with custom settings
<HoverCard 
  force={0.8}
  maxRotation={20}
  maxLift={40}
  enableGlow={true}
  disabled={false}
>
  <div className="your-content">
    Content goes here
  </div>
</HoverCard>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Content to be wrapped in the hover card |
| `force` | `number` | `0.5` | Strength of mouse response (0-1) |
| `className` | `string` | `''` | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disable hover effects |
| `maxRotation` | `number` | `15` | Maximum rotation in degrees |
| `maxLift` | `number` | `30` | Maximum lift in pixels |
| `enableGlow` | `boolean` | `true` | Enable glow effect on hover |
| `useDeviceOrientation` | `boolean` | `true` | Use device orientation instead of/along with mouse |
| `orientationSensitivity` | `number` | `0.8` | Sensitivity for device orientation (0-1) |
| `returnToCenter` | `number` | `1500` | Time in ms to return to center after orientation |

## Force Levels Guide

- **Low (0.1 - 0.3)**: Subtle, gentle movements
- **Medium (0.4 - 0.7)**: Balanced, noticeable effects
- **High (0.8 - 1.0)**: Strong, dramatic movements

## Demo

Visit `/badma/hover-card` to see the interactive demo with different force levels.

## Technical Implementation

- Uses `useResizeDetector` from `react-resize-detector` for automatic size detection
- Implements `onMouseMove`, `onMouseEnter`, and `onMouseLeave` events for mouse interaction
- Listens to `DeviceOrientationEvent` for device tilt detection
- Calculates relative mouse position from element center
- Converts device orientation (gamma/beta) to position coordinates with inversion
- Applies 3D CSS transforms with `perspective`, `rotateX`, `rotateY`, `translateY`, and `scale`
- Uses timers with refs for inertia effects - card returns to center after orientation changes
- Optimized with `useCallback` hooks and efficient state management
- Prevents mouse events when device orientation is active

## Performance

- Uses `debounce` mode for resize detection (100ms)
- Optimized CSS transforms with `will-change` property
- Smooth transitions with cubic-bezier easing
- Minimal re-renders with proper React hooks usage 