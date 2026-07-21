/**
 * Fixed, full-screen background video — replaces the original site's scroll-driven
 * canvas image-sequence. It sits behind all content; only the transparent hero
 * reveals it (every other section paints its own opaque background on top).
 */
export function BackgroundVideo() {
  return (
    <div className="fixed inset-0 z-0 h-screen w-full bg-black">
      <video
        className="h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/videos/landing-hero-poster.webp"
        aria-hidden="true"
      >
        <source src="/videos/landing-hero.mp4" type="video/mp4" />
      </video>
      {/* subtle darken so hero text stays legible over any frame */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
