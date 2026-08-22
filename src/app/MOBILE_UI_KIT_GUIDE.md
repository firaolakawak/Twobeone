# 📱 Mobile UI Kit - Complete Documentation

## Overview

A comprehensive, enterprise-grade mobile UI component library built for **TwoBeOne** following iOS Human Interface Guidelines and Android Material Design principles.

---

## 🎨 Design System Foundations

### Color System

#### Primary Colors (Rose/Pink - Brand)
```css
--primary-50: #fef1f4    /* Lightest tint */
--primary-100: #ffe0e8
--primary-200: #ffc7d7
--primary-300: #ff9db7
--primary-400: #ff6391
--primary-500: #f43f5e   /* Main brand color */
--primary-600: #e11d48   /* Primary button color */
--primary-700: #be123c
--primary-800: #9f1239
--primary-900: #881337   /* Darkest shade */
```

#### Secondary Colors (Blue - Accent)
```css
--secondary-50: #f0f9ff
--secondary-100: #e0f2fe
--secondary-200: #bae6fd
--secondary-300: #7dd3fc
--secondary-400: #38bdf8
--secondary-500: #0ea5e9   /* Main secondary */
--secondary-600: #0284c7
--secondary-700: #0369a1
--secondary-800: #075985
--secondary-900: #0c4a6e
```

#### Neutral/Grayscale (50-950 scale)
```css
--neutral-50: #f9fafb    /* Backgrounds */
--neutral-100: #f3f4f6
--neutral-200: #e5e7eb   /* Borders */
--neutral-300: #d1d5db
--neutral-400: #9ca3af
--neutral-500: #6b7280   /* Muted text */
--neutral-600: #4b5563
--neutral-700: #374151
--neutral-800: #1f2937
--neutral-900: #111827   /* Dark text */
--neutral-950: #030712   /* Darkest */
```

#### Status Colors
```css
/* Success (Green) */
--success-50: #f0fdf4
--success-500: #22c55e
--success-700: #15803d

/* Warning (Amber) */
--warning-50: #fffbeb
--warning-500: #f59e0b
--warning-700: #b45309

/* Error (Red) */
--error-50: #fef2f2
--error-500: #ef4444
--error-700: #b91c1c
```

**Accessibility:** All color combinations meet WCAG AA+ contrast requirements (4.5:1 for normal text, 3:1 for large text).

---

### Typography System

#### iOS Typography Scale (pt)
```css
--text-display: 34px;       /* Large Title: 28-34pt */
--text-large-title: 28px;   /* Title 1 */
--text-title: 24px;         /* Title 2 */
--text-subtitle: 20px;      /* Title 3 / Subtitle: 18-20pt */
--text-heading: 18px;       /* Heading */
--text-body: 16px;          /* Body: 16-17pt */
--text-body-large: 17px;    /* Body Large */
--text-callout: 15px;       /* Callout */
--text-caption: 14px;       /* Caption: 12-14pt */
--text-caption-small: 12px; /* Caption 2 */
--text-label: 11px;         /* Label/Footnote */
```

#### Android Typography Scale (sp)
```css
--text-display-android: 32px;   /* Display: 32sp */
--text-title-android: 24px;     /* Title: 20-24sp */
--text-body-android: 16px;      /* Body: 14-16sp */
--text-caption-android: 12px;   /* Caption: 12sp */
```

#### Font Weights
```css
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

---

### Spacing System (8dp Grid)

```css
--spacing-0: 0px;
--spacing-1: 4px;    /* 4dp - Minimal spacing */
--spacing-2: 8px;    /* 8dp - Vertical rhythm base */
--spacing-3: 12px;   /* 12dp - Small spacing */
--spacing-4: 16dp;   /* 16dp - Standard spacing */
--spacing-5: 20px;   /* 20dp */
--spacing-6: 24px;   /* 24dp - Large spacing */
--spacing-8: 32px;   /* 32dp - Extra large */
--spacing-10: 40px;  /* 40dp - Section spacing */
--spacing-12: 48px;  /* 48dp - Touch target minimum */
--spacing-14: 56px;  /* 56dp - Comfortable touch */
--spacing-16: 64px;  /* 64dp - Large sections */
--spacing-20: 80px;  /* 80dp - Hero spacing */
--spacing-24: 96px;  /* 96dp - Major sections */
```

**Usage Guidelines:**
- Use 4dp (spacing-1) for minimal gaps
- Use 8dp (spacing-2) for vertical rhythm between lines
- Use 16dp (spacing-4) for standard padding and margins
- Use 24dp (spacing-6) for section spacing
- Use 48dp+ (spacing-12+) for touch targets

---

### Safe Area Standards

#### iOS Safe Areas
```css
--safe-area-top-ios: 44px;        /* Notch area */
--safe-area-bottom-ios: 34px;     /* Gesture bar */
```

#### Android Safe Areas
```css
--safe-area-top-android: 32px;    /* Status bar */
--safe-area-bottom-android: 24px; /* Nav bar */
```

**Implementation:**
```css
/* Top padding for content below status bar */
.pt-11 { padding-top: 44px; }  /* iOS top safe */

/* Bottom padding for content above gesture bar */
.pb-9 { padding-bottom: 36px; }  /* iOS bottom safe */
```

---

### Component Sizing

#### Touch Targets
```css
--touch-target-min: 44px;         /* iOS 44pt / Android 48dp */
--touch-target-comfortable: 56px;  /* Comfortable size */
```

**Guidelines:**
- Minimum tappable area: 44×44px (iOS) or 48×48dp (Android)
- Comfortable tappable area: 56×56px
- Spacing between tappable elements: 8-12dp

#### Icon Sizes
```css
--icon-xs: 16px;   /* Extra small */
--icon-sm: 20px;   /* Small icons */
--icon-md: 24px;   /* Standard icons (24dp) */
--icon-lg: 32px;   /* Large icons (32dp) */
--icon-xl: 40px;   /* Extra large */
--icon-2xl: 48px;  /* Hero icons */
```

#### Button Heights
```css
--button-sm: 40px;   /* Small button */
--button-md: 48px;   /* Standard (min touch) */
--button-lg: 56px;   /* Large/comfortable */
```

#### Border Radius
```css
--radius-sm: 8px;    /* Small */
--radius-md: 12px;   /* Standard */
--radius-lg: 16px;   /* Large */
--radius-xl: 20px;   /* Extra large */
--radius-2xl: 24px;  /* Hero */
--radius-full: 9999px; /* Circular */
```

---

## 📦 Components

### 1. Buttons

#### MobileButton

**Import:**
```tsx
import { MobileButton } from './components/mobile-ui/MobileButton';
```

**Props:**
```tsx
interface MobileButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'text' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}
```

**Usage:**
```tsx
// Primary button
<MobileButton>Primary</MobileButton>

// With icon
<MobileButton 
  icon={<Heart className="w-5 h-5" />}
  iconPosition="left"
>
  Like
</MobileButton>

// Loading state
<MobileButton loading={loading}>
  Submit
</MobileButton>

// Full width
<MobileButton fullWidth size="lg">
  Continue
</MobileButton>
```

**Variants:**
- `primary`: Rose gradient, white text (main CTA)
- `secondary`: Neutral background (secondary actions)
- `ghost`: Transparent, hover effect (subtle actions)
- `text`: Text-only, no background (links)
- `destructive`: Red, for delete/remove actions

---

### 2. Inputs

#### MobileInput

**Import:**
```tsx
import { MobileInput } from './components/mobile-ui/MobileInput';
```

**Props:**
```tsx
interface MobileInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  // ... all standard input props
}
```

**Usage:**
```tsx
<MobileInput
  label="Email Address"
  type="email"
  placeholder="your@email.com"
  icon={<Mail className="w-5 h-5" />}
  required
  error={errors.email}
  helperText="We'll never share your email"
/>
```

#### MobileTextarea

**Usage:**
```tsx
<MobileTextarea
  label="Message"
  placeholder="Type your message..."
  rows={4}
  helperText="Maximum 500 characters"
/>
```

---

### 3. Cards

#### MobileCard

**Import:**
```tsx
import { 
  MobileCard, 
  MobileCardHeader, 
  MobileCardContent, 
  MobileCardFooter 
} from './components/mobile-ui/MobileCard';
```

**Usage:**
```tsx
<MobileCard shadow="md">
  <MobileCardHeader
    title="Card Title"
    subtitle="Subtitle text"
    icon={<Heart className="w-6 h-6" />}
    action={<Button>Action</Button>}
  />
  
  <MobileCardContent>
    <p>Card content goes here...</p>
  </MobileCardContent>
  
  <MobileCardFooter>
    <div className="flex gap-2">
      <MobileButton fullWidth>Primary</MobileButton>
      <MobileButton variant="secondary" fullWidth>Cancel</MobileButton>
    </div>
  </MobileCardFooter>
</MobileCard>
```

**Variants:**
- `default`: White background, border
- `outlined`: Transparent, border only
- `filled`: Filled neutral background

---

### 4. Navigation

#### MobileAppBar

**Import:**
```tsx
import { MobileAppBar } from './components/mobile-ui/MobileNavigation';
```

**Usage:**
```tsx
<MobileAppBar
  title="Dashboard"
  onBack={() => navigate(-1)}
  rightAction={
    <button>
      <Settings className="w-6 h-6" />
    </button>
  }
/>
```

#### MobileBottomNav

**Usage:**
```tsx
<MobileBottomNav
  items={[
    { id: 'home', label: 'Home', icon: <Home />, badge: 3 },
    { id: 'profile', label: 'Profile', icon: <User /> }
  ]}
  activeId={activeTab}
  onItemClick={setActiveTab}
/>
```

#### MobileFAB (Floating Action Button)

**Usage:**
```tsx
<MobileFAB
  icon={<Plus className="w-6 h-6" />}
  onClick={handleAdd}
  label="Add new item"
  position="bottom-right"
/>
```

---

### 5. Feedback

#### MobileAlert

**Import:**
```tsx
import { MobileAlert } from './components/mobile-ui/MobileFeedback';
```

**Usage:**
```tsx
<MobileAlert
  type="success"
  title="Success"
  message="Your changes have been saved."
  onClose={() => setShowAlert(false)}
/>
```

**Types:** `success`, `error`, `warning`, `info`

#### MobileBadge

**Usage:**
```tsx
<MobileBadge variant="success" dot>Active</MobileBadge>
<MobileBadge variant="error">3</MobileBadge>
```

#### MobileLoader

**Usage:**
```tsx
<MobileLoader size="md" text="Loading..." />
<MobileLoader fullScreen text="Please wait..." />
```

#### MobileEmptyState

**Usage:**
```tsx
<MobileEmptyState
  icon={<MessageCircle className="w-full h-full" />}
  title="No messages yet"
  description="Start a conversation"
  action={<MobileButton>New Message</MobileButton>}
/>
```

---

### 6. Lists

#### MobileListItem

**Import:**
```tsx
import { 
  MobileList, 
  MobileListItem, 
  MobileAvatar 
} from './components/mobile-ui/MobileList';
```

**Usage:**
```tsx
<MobileList>
  {/* One-line item */}
  <MobileListItem
    title="Settings"
    icon={<Settings className="w-6 h-6" />}
    showChevron
    onClick={handleClick}
  />
  
  {/* Two-line item */}
  <MobileListItem
    title="John Doe"
    subtitle="john@example.com"
    avatar={<MobileAvatar fallback="JD" status="online" />}
    trailing={<Badge>New</Badge>}
  />
  
  {/* Three-line item */}
  <MobileListItem
    title="Message Title"
    subtitle="From: Sarah"
    description="This is a longer message that can span multiple lines..."
    showChevron
  />
</MobileList>
```

---

## 🖥️ Screen Templates

### 1. Login/Signup Screen

**Import:**
```tsx
import { MobileLoginScreen } from './components/screens/MobileLoginScreen';
```

**Features:**
- Hero section with logo
- Mode toggle (Sign In / Sign Up)
- Form validation
- Bottom CTA elevated above safe area
- Responsive gradient background

### 2. Dashboard Screen

**Import:**
```tsx
import { MobileDashboardScreen } from './components/screens/MobileDashboardScreen';
```

**Features:**
- App bar with avatar and notifications
- Hero card with user info
- Stats grid (3 columns)
- Quick actions grid (4 columns)
- Content cards with proper spacing
- Bottom navigation

### 3. UI Kit Demo Screen

**Import:**
```tsx
import { UIKitDemoScreen } from './components/screens/UIKitDemoScreen';
```

**Features:**
- Tab navigation
- Complete component showcase
- Interactive examples
- All variants and states

---

## 📐 Layout Guidelines

### Screen Structure (Top to Bottom)

1. **Status Bar** (system, 20-24dp)
2. **Top Safe Area** (44px iOS / 32px Android)
3. **App Bar / Navigation** (44-56dp height)
4. **Main Content Area** (scrollable)
5. **Bottom CTA** (optional, 16-24dp above safe area)
6. **Bottom Safe Area** (34px iOS / 24px Android)
7. **Gesture Bar** (system)

### Spacing Rules

```css
/* Horizontal padding: 16dp on edges */
.px-4 { padding-left: 16px; padding-right: 16px; }

/* Vertical rhythm: 8dp base */
.space-y-2 { gap: 8px; }   /* Between related items */
.space-y-4 { gap: 16px; }  /* Between form fields */
.space-y-6 { gap: 24px; }  /* Between sections */

/* Section margins */
.mb-6 { margin-bottom: 24px; }  /* Section spacing */
.mb-10 { margin-bottom: 40px; } /* Major sections */
```

### Content Area

```tsx
<main className="px-4 py-6 pb-32 max-w-6xl mx-auto">
  {/* Content here */}
</main>
```

- **Horizontal padding**: 16dp (`px-4`)
- **Top padding**: 24dp (`py-6`)
- **Bottom padding**: 128dp (`pb-32`) - clears bottom nav
- **Max width**: 90% of screen (`max-w-6xl mx-auto`)

### Grid System

```tsx
/* 2 columns with 8dp gap */
<div className="grid grid-cols-2 gap-2">

/* 3 columns with 12dp gap */
<div className="grid grid-cols-3 gap-3">

/* 4 columns with 12dp gap */
<div className="grid grid-cols-4 gap-3">
```

---

## ♿ Accessibility

### Touch Targets

✅ All buttons: min 48dp height
✅ List items: min 48dp height
✅ Icons in navigation: 24dp (with 48dp touch area)
✅ FAB: 56dp × 56dp

### Color Contrast

✅ All text combinations meet WCAG AA+ (4.5:1 minimum)
✅ UI components meet WCAG AA (3:1 minimum)

### ARIA Labels

```tsx
<button aria-label="Go back">
  <ArrowLeft />
</button>

<nav aria-label="Main navigation">
  {/* Navigation items */}
</nav>
```

### Focus States

```tsx
focus:outline-none focus:ring-2 focus:ring-rose-500
```

---

## 🌙 Dark Mode

All components support dark mode via Tailwind's `dark:` variant:

```tsx
className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
```

**Toggle dark mode:**
```tsx
document.documentElement.classList.toggle('dark');
```

---

## 🚀 Usage

### Installation

Components are already integrated in the project:

```tsx
import { MobileButton, MobileCard } from './components/mobile-ui';
```

### View Demo

To see all components in action:

1. Visit `/demo.html` in your browser
2. Navigate through the demo screens
3. Toggle dark mode
4. Interact with all components

---

## 📱 Testing Recommendations

### Devices to Test

- iPhone 13/14 (390×844)
- iPhone SE (375×667)
- Android Pixel (360×800)
- Tablet (768×1024)

### Test Cases

✅ Touch targets are 44dp minimum
✅ Text is readable at default size
✅ Colors have sufficient contrast
✅ Dark mode works correctly
✅ Content never touches screen edges
✅ Safe areas are respected
✅ Buttons are accessible
✅ Forms validate properly

---

## 💡 Best Practices

### Do's ✅

- Use semantic HTML elements
- Follow 8dp spacing system
- Respect safe areas
- Provide touch feedback
- Support dark mode
- Test on real devices
- Use proper touch targets
- Add ARIA labels

### Don'ts ❌

- Don't place content in safe zones
- Don't use touch targets < 44dp
- Don't ignore contrast ratios
- Don't skip accessibility
- Don't hardcode colors
- Don't forget loading states
- Don't create tiny tap areas

---

## 📚 Additional Resources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://m3.material.io/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Mobile UX Best Practices](https://www.nngroup.com/topic/mobile-tablet/)

---

**Built with ❤️ for TwoBeOne**
