# Onlayn Tikket — Frontend Development Plan

## Design Guidelines

### Design References
- **Ticketmaster.com**: Event discovery, clean card layouts
- **Afisha.uz**: Local Uzbek event platform feel
- **Style**: Modern, vibrant, event-focused with dark accents

### Color Palette
- Primary: #6366F1 (Indigo - main brand)
- Secondary: #8B5CF6 (Violet - accents)
- Accent: #F59E0B (Amber - CTAs, highlights)
- Background: #0F172A (Slate 900 - dark sections)
- Surface: #1E293B (Slate 800 - cards on dark)
- Light BG: #F8FAFC (Slate 50 - light sections)
- Success: #10B981 (Emerald)
- Error: #EF4444 (Red)
- Text Primary: #F1F5F9 (on dark), #0F172A (on light)
- Text Secondary: #94A3B8 (Slate 400)

### Typography
- Font: Inter (sans-serif)
- H1: 48px bold
- H2: 36px semibold
- H3: 24px semibold
- Body: 16px regular
- Small: 14px regular

### Key Component Styles
- Cards: rounded-xl, shadow-lg, hover:scale-105 transition
- Buttons: rounded-lg, gradient backgrounds, hover brightness
- Inputs: rounded-lg, border-slate-300, focus:ring-indigo-500
- Badges: rounded-full, small text, colored backgrounds

### Images to Generate
1. **hero-banner-concert-crowd.jpg** — Vibrant concert crowd with colorful stage lights, energetic atmosphere (photorealistic, wide 1024x576)
2. **hero-banner-stadium-event.jpg** — Large stadium event with fireworks and crowd (photorealistic, wide 1024x576)
3. **hero-banner-cultural-show.jpg** — Traditional Uzbek cultural performance with colorful costumes (photorealistic, wide 1024x576)
4. **hero-banner-sport-event.jpg** — Exciting sports event in a modern arena (photorealistic, wide 1024x576)

---

## Architecture

### API Configuration
- Backend base URL: configurable via env (VITE_API_URL)
- All API calls via centralized api.ts with axios
- JWT token stored in localStorage
- Auth context for user state management

### File Structure (max 8 main files + supporting)

1. **src/lib/api.ts** — Axios instance, interceptors, all API functions
2. **src/contexts/AuthContext.tsx** — Auth state, login/register/logout, token management
3. **src/components/Layout.tsx** — Header (logo, nav, region selector, auth, notifications), Footer
4. **src/pages/Index.tsx** — Home page: banner slider, event grid, filters
5. **src/pages/Auth.tsx** — Login & Register (tabbed)
6. **src/pages/EventDetail.tsx** — Event detail + zone selection + checkout
7. **src/pages/MyTickets.tsx** — User tickets list + QR modal + Profile + Notifications
8. **src/pages/OrganizerPanel.tsx** — Organizer dashboard + create event + stats
9. **src/pages/AdminPanel.tsx** — Admin dashboard + pending events + organizers + ads (combined into sub-tabs)

### Routing
- `/` — Home
- `/login` — Auth (login tab)
- `/register` — Auth (register tab)
- `/events/:id` — Event detail
- `/my-tickets` — My tickets
- `/profile` — Profile & notifications
- `/organizer` — Organizer panel
- `/admin` — Admin panel

## Development Tasks
1. Setup: Create api.ts, AuthContext, update App.tsx routing, update index.html title
2. Generate images using ImageCreator
3. Create Layout component (Header + Footer)
4. Create Home page (Index.tsx) with banner slider, event cards, filters
5. Create Auth page (Login/Register)
6. Create EventDetail page with zones and checkout
7. Create MyTickets page with QR + Profile
8. Create OrganizerPanel page
9. Create AdminPanel page
10. Lint, build, check