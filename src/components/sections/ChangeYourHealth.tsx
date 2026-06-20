import Link from "next/link";
import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

export function ChangeYourHealth() {
  return (
    <section className="bg-white py-10 md:py-12">
      <Container>
        <div
          className={cn(
            "bg-cyborg-cta",
            "flex min-h-[340px] flex-col items-center justify-center overflow-hidden rounded-[40px] px-6 py-16 text-center md:min-h-[380px]",
          )}
        >
          <h2 className="max-w-[620px] text-4xl font-bold leading-[1.03] tracking-[-0.02em] text-white md:text-[60px]">
            Change your health for good.
          </h2>
          <p className="mt-4 text-[18px] text-white/90">
            Feel lasting results in one week
          </p>
          <Link
            href="/market-place"
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-white px-12 py-4 text-lg font-semibold text-black"
          >
            Shop Now
          </Link>
        </div>
      </Container>
    </section>
  );
}
