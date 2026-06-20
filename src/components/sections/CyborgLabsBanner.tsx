import Link from "next/link";
import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

export function CyborgLabsBanner() {
  return (
    <section className="bg-white py-10 md:py-12">
      <Container>
        <div
          className={cn(
            "relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-3xl text-center md:min-h-[520px]",
          )}
        >
          <img
            src="/assets/sm/test5_2.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/45" />

          <div className="relative z-10 flex flex-col items-center px-6">
            <h2 className="text-4xl font-bold tracking-[-0.02em] text-white md:text-[56px]">
              CYBORG Labs
            </h2>
            <p className="mt-3 text-base text-white/90">
              Because health is not just human.
            </p>
            <Link
              href="/market-place"
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-white px-12 py-4 text-lg font-semibold text-black"
            >
              Read More
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
