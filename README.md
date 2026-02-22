# NekoEats - Restaurant App

This is a high-fidelity restaurant application built with React, Vite, Tailwind CSS, and Supabase.
It mimics the requested Next.js 14 App Router structure but runs as a SPA for optimal performance in this environment.

## Features

- **Customer Flow**:
  - Discovery Home Screen with promos and categories.
  - Full Menu with category filtering and search.
  - Item Customization Modal (variants, addons, instructions).
  - Cart & Checkout with WhatsApp integration.
  - **Real-time Store Status**: Checks if the store is open/closed before allowing orders.
  - **Dark Mode**: Toggle between light and dark themes.

- **Admin Flow**:
  - **Authentication**: Secure login for administrators.
  - **Dashboard**: Real-time analytics (Sales, Orders, Top Items).
  - **Live KDS (Kitchen Display System)**: Real-time order updates and status management.
  - **Menu Management**: Create, Read, Update, Delete (CRUD) menu items with **Image Uploads**.
  - **Store Settings**: Manage restaurant name, operating hours, and force close status.

## Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS v4 (Dark Mode support)
- **Backend**: Supabase (PostgreSQL)
  - **Auth**: Email/Password authentication
  - **Database**: Relational data for Menu, Orders, and Settings
  - **Realtime**: Live updates for Orders and Store Settings
  - **Storage**: Image hosting for menu items
- **State Management**: Zustand (Cart), React Context (Auth, Theme)
- **Forms**: React Hook Form + Zod
- **Icons**: Google Material Symbols
- **Animations**: Framer Motion
- **Routing**: React Router DOM v6

## Project Structure

- `src/pages`: Main route components (Home, Menu, Cart, Admin/*).
- `src/components`: Reusable UI components (Navbar, ItemModal, MenuFormModal, etc.).
- `src/store`: Zustand store for cart state.
- `src/services`: Supabase service layers (menu, orders, settings, storage, dashboard).
- `src/hooks`: Custom hooks (useStoreSettings, useAuth).
- `src/contexts`: React Context providers (AuthContext, ThemeContext).
- `src/lib`: Utilities, types, and Supabase client.

## Environment Variables

Create a `.env` file with the following:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

Run the SQL scripts provided in the root directory in your Supabase SQL Editor:
1. `supabase_schema.sql` (Tables & RLS)
2. `supabase_settings.sql` (Store Settings)
3. `supabase_storage.sql` (Storage Buckets)

## Deployment

This project is ready for deployment on Vercel. The `vercel.json` is configured for SPA routing.
