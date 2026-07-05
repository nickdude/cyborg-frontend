import Link from "next/link";

// Not-found boundary. Rendered inside the root layout, so a 404 resolves to a
// real, themed component instead of an on-demand default that can fail to
// compile alongside the other error components in dev.
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 text-sm font-semibold text-primary">404</p>
      <h1 className="mb-1.5 text-xl font-semibold text-ink">Page not found</h1>
      <p className="mb-6 max-w-sm text-sm text-secondary">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/dashboard"
        className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-800"
      >
        Back to home
      </Link>
    </div>
  );
}
