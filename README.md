Cyborg Frontend — a [Next.js](https://nextjs.org/) 14 (App Router) app for the
Cyborg health platform: marketing landing page, auth, dashboard, blood-report
visualization (3D body model), marketplace, and concierge.

## Getting Started

> **Requires the backend.** This app talks to the Cyborg backend API. Start the
> backend first (default `http://localhost:5001`) — see the `cyborg-backend`
> repo — otherwise login, dashboard, and reports will not load.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local`:
   - `NEXT_PUBLIC_API_URL` — backend base URL (match the backend's port, default `5001`).
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — your Google OAuth client ID (optional; blank disables Google login).

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Tech stack

Next.js 14 · React 18 · Tailwind CSS v3 · react-three-fiber + drei (3D body) ·
motion + lenis (animations) · axios · zustand.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
