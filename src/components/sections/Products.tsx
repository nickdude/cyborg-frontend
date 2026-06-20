import Link from "next/link";
import { Container } from "@/components/Container";

interface Product {
  name: string;
  image: string;
  price: string;
}

const products: Product[] = [
  { name: "Amino 9", image: "/assets/product-1.png", price: "$49.99" },
  { name: "Mito Heart", image: "/assets/product-2.png", price: "$49.99" },
  { name: "Ozempic", image: "/assets/product-3.png", price: "$49.99" },
  { name: "Mounjaro", image: "/assets/product-4.png", price: "$49.99" },
];

export function Products() {
  return (
    <section className="w-full bg-cyborg-purple py-20 md:py-24">
      <Container>
        {/* Header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row">
          <h2 className="max-w-[520px] text-3xl font-bold leading-[1.04] tracking-[-0.03em] text-white md:text-[48px]">
            Whole body health starts with the right signal.
          </h2>
          <p className="max-w-[420px] text-[18px] leading-relaxed text-white/90">
            Formulations that provide fast-acting and sustained support using
            scientifically and clinically studied ingredients.
          </p>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.name}
              className="flex flex-col rounded-2xl bg-white/10 p-5"
            >
              <span className="self-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                Best Seller
              </span>
              <h3 className="mt-3 text-xl font-semibold text-white">
                {product.name}
              </h3>
              <img
                src={product.image}
                alt={product.name}
                className="mx-auto my-6 h-[240px] w-auto object-contain"
              />
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-[#101010]"
              >
                Join Today
              </Link>
              <p className="mt-3 text-center text-sm text-white/90">
                Starting at {product.price}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex justify-end">
          <Link
            href="/market-place"
            className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-3 text-lg font-semibold text-white"
          >
            Shop All →
          </Link>
        </div>
      </Container>
    </section>
  );
}
