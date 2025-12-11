# Frontend Development Guide

## Project Structure

```
app/
├── src/
│   ├── frontend/          # Frontend TypeScript source
│   │   ├── main.ts        # Entry point
│   │   ├── app.ts         # Main app logic + views
│   │   ├── router.ts      # SPA router (History API)
│   │   ├── api.ts         # API client
│   │   ├── types.ts       # TypeScript types
│   │   └── styles.css     # Tailwind input
│   └── server.ts          # Backend entry point
├── public/
│   ├── index.html         # HTML entry point
│   ├── css/
│   │   └── styles.css     # Compiled Tailwind CSS
│   └── js/
│       └── main.js        # Compiled frontend JS
├── tsconfig.json          # Points to backend config
├── tsconfig.backend.json  # Backend TypeScript config
├── tsconfig.frontend.json # Frontend TypeScript config
└── tailwind.config.js     # Tailwind configuration
```

## Build Commands

### Production Build
```bash
npm run build
```
This runs:
1. `build:backend` - Compiles backend TS to `dist/`
2. `build:frontend` - Compiles frontend TS to `public/js/`
3. `build:css` - Compiles Tailwind CSS to `public/css/`

### Development

#### Backend
```bash
npm run dev
```

#### Frontend (watch mode)
```bash
npm run dev:css
```

## Features

### SPA Router
- History API based
- Browser back/forward support
- Routes:
  - `/login` - Login page
  - `/register` - Register page
  - `/home` - Home page (requires auth)

### Authentication
- Session-based auth with HTTP-only cookies
- Auto-redirect on auth status
- Persistent sessions across page reloads
- Logout functionality

### Styling
- Tailwind CSS utility-first approach
- Dark theme design
- Responsive layout
- Gradient backgrounds

## API Integration

All API calls go through `api.ts`:
- `register(username, password)` - Create account
- `login(username, password)` - Sign in
- `logout()` - Sign out
- `getCurrentUser()` - Get authenticated user

Credentials are automatically included via `credentials: 'include'`.
