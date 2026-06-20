import { Container } from "@/components/Container";

/** "The most complete picture" — heading left, phone dashboard preview right. */
export function CompletePicture() {
  return (
    <section className="bg-white py-24 md:py-28">
      <Container>
        <div className="flex flex-col items-center justify-between gap-12 md:flex-row">
          <h2 className="max-w-[520px] text-center text-4xl font-bold leading-[1.04] tracking-[-0.02em] text-black md:text-left md:text-[56px]">
            The most complete picture of your health you&apos;ve ever had
          </h2>

          <img
            src="/assets/sm/sub-main.webp"
            alt="Cyborg health dashboard preview"
            className="h-auto w-[300px] shrink-0 md:w-[460px]"
          />
        </div>
      </Container>
    </section>
  );
}
