# Mongolian Meat E-Commerce Platform - Design Guidelines

## Design Approach
**Reference-Based**: Drawing from Shopify's clean product presentation, Instacart's food-focused layouts, and modern SaaS aesthetics. The design emphasizes visual hierarchy through gradient accents and clear typography while maintaining approachability for a food commerce experience.

## Typography System
- **Primary Font**: Inter (Google Fonts) - clean, modern sans-serif
- **Headings**: Bold (700) for H1, Semibold (600) for H2-H3
- **Body**: Regular (400) for content, Medium (500) for emphasis
- **Sizes**: Hero (4xl-6xl), Section Headers (3xl-4xl), Card Titles (xl-2xl), Body (base-lg), Captions (sm)

## Layout System
**Spacing Primitives**: Tailwind units 2, 4, 6, 8, 12, 16, 24
- Tight spacing: 2-4 (card internals, badges)
- Standard: 6-8 (component padding, gaps)
- Generous: 12-16 (section padding)
- Large: 24 (section margins)

**Grid Structure**: 
- Product cards: 1 column mobile, 2 tablet, 3-4 desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4)
- Max container width: max-w-7xl
- Content sections: max-w-6xl

## Component Library

### Customer-Facing Platform

**Hero Section**:
- Full-width background image (Mongolian grasslands/premium cuts)
- Overlay with gradient accent (red-to-blue, diagonal 45deg, 60% opacity)
- Centered content: Large headline + subheadline + CTA button with blur backdrop
- Height: 80vh desktop, 60vh mobile

**Product Cards**:
- Elevated white cards with subtle shadow
- Square product image (aspect-ratio-1/1) with hover scale effect
- Green delivery badge positioned top-right (rounded-full, small pill)
- Title, price (large, bold), weight/quantity (small)
- Add to cart button (gradient background, white text)
- Card padding: p-4, gap: gap-4

**Category Navigation**:
- Horizontal scroll on mobile, grid on desktop
- Large circular category icons with gradient borders
- Category name below icon

**Featured Sections**:
- "Fresh Arrivals" - 4-card horizontal scroll
- "Popular Cuts" - 3-column grid with larger imagery
- "Delivery Guarantee" - 3-column benefit cards (icon, headline, description)

**Shopping Experience**:
- Sticky cart summary sidebar (desktop)
- Filter sidebar: collapsible sections, checkboxes with gradient accents
- Sort dropdown: modern, clean styling
- Delivery date selector: calendar interface with green highlights for available dates

### Admin Panel

**Dashboard Layout**:
- Left sidebar navigation (w-64, fixed)
- Main content area with breadcrumb navigation
- Top bar: search, notifications, profile

**Settings Management**:
- Tabbed interface (horizontal tabs with gradient underline for active)
- Form sections with clear visual separation
- Settings cards: white background, grouped logically
- Toggle switches with gradient fill when active
- Input fields: clean borders, focus states with gradient glow

**Data Tables**:
- Striped rows (subtle)
- Action buttons in final column
- Sortable headers with arrow indicators
- Pagination controls at bottom

**Metrics Cards**:
- 4-column grid on desktop (orders, revenue, products, customers)
- Large number, small label, trend indicator
- Subtle gradient background on hover

## Gradient Implementation
- **Primary Gradient**: Red (#FF4444 or similar) to Blue (#4444FF or similar), 135deg diagonal
- **Usage**: CTA buttons, section accents, card borders on hover, active states, admin panel highlights
- **Intensity**: 100% on buttons, 20-40% on backgrounds, 60% on overlays

## Images Section

**Required Images**:
1. **Hero Background**: Sweeping landscape of Mongolian grasslands or premium meat cuts on dark surface (1920x1080 min)
2. **Product Images**: High-quality photos of meat cuts, white/neutral background, consistent lighting (800x800)
3. **Category Icons**: Visual representations of meat types (beef, lamb, poultry, etc.) - use icon library or simple illustrations
4. **About Section**: Mongolian heritage imagery, butcher at work, quality guarantee visuals
5. **Delivery Section**: Refrigerated truck, fresh packaging, happy customers

**Image Treatment**: All product images maintain consistent aspect ratios, subtle shadow on white backgrounds, sharp focus on product with slight background blur for depth.

## Animations
Minimal, purposeful only:
- Card hover: slight scale (1.02) and shadow increase
- Button hover: gradient shift
- Product image hover: gentle zoom
- No scroll animations or excessive transitions