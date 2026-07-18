"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/Container";

interface Product {
  name: string;
  image: string;
  /** price formatted for India, e.g. "₹2,499" */
  price: string;
  href: string;
  badge?: string;
}

const products: Product[] = [
  { name: "Amino 9", image: "/assets/product-1.webp", price: "₹2,499", href: "/login", badge: "Best Seller" },
  { name: "Mito Heart", image: "/assets/product-2.webp", price: "₹2,999", href: "/login", badge: "New" },
  { name: "Ozempic", image: "/assets/product-3.webp", price: "₹14,999", href: "/login", badge: "Rx · Doctor-prescribed" },
  { name: "Mounjaro", image: "/assets/product-4.webp", price: "₹16,999", href: "/login", badge: "Rx · Doctor-prescribed" },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

const gridContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const gridItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

function ProductCard({ product }: { product: Product }) {
  return (
    <motion.article
      variants={gridItem}
      className="group relative flex h-full flex-col rounded-2xl border border-white/15 bg-[#9878AF] bg-[radial-gradient(120%_90%_at_50%_-10%,rgba(255,255,255,0.18),transparent_60%)] p-4 shadow-xl shadow-black/25 backdrop-blur-xl transition-all duration-200 ease-out hover:-translate-y-1.5 hover:border-white/35 hover:shadow-2xl hover:shadow-black/40 sm:p-7"
    >
      {/* Product badge */}
      {product.badge && (
        <span className="self-start rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-cyborg-ink shadow-sm sm:px-3 sm:py-1.5 sm:text-sm">
          {product.badge}
        </span>
      )}

      {/* Product title */}
      <h3 className="mt-3 text-lg font-semibold leading-snug tracking-[-0.01em] text-white sm:mt-5 sm:text-2xl">
        {product.name}
      </h3>

      {/* Product image */}
      <div className="my-4 flex flex-1 items-center justify-center sm:my-6">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-[120px] w-auto max-w-full object-contain drop-shadow-xl transition-transform duration-200 ease-out group-hover:scale-[1.05] sm:h-[240px]"
        />
      </div>

      {/* CTA */}
      <Link
        href={product.href}
        className="inline-flex w-full items-center justify-center rounded-lg bg-cyborg-purple px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#4a1c74] hover:shadow-xl hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-cyborg-purple sm:rounded-xl sm:px-5 sm:py-3 sm:text-base"
      >
        Join Today
      </Link>

      {/* Price */}
      <p className="mt-3 text-center text-xs text-white/75 sm:mt-4 sm:text-base">
        Starting at{" "}
        <span className="text-sm font-semibold text-white sm:text-lg">{product.price}</span>
      </p>
    </motion.article>
  );
}

export function Products() {
  return (
    <section className="relative w-full overflow-hidden bg-cyborg-purple py-16 md:py-20 lg:py-24">
      {/* ---- ambient background depth ---- */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* radial lighting from the top */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(161,79,241,0.45),transparent_70%)]" />
        {/* warm accent blob */}
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-orange-500/10 blur-[120px]" />
        {/* cool accent blob */}
        <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-[120px]" />
        {/* subtle grid, masked to fade at the edges */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <Container className="relative">
        {/* ---- header ---- */}
        <div className="flex max-w-3xl flex-col">
          {/* <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-violet-300 to-fuchsia-300" />
            Our Products
          </span> */}

          <h2 className="mt-6 text-4xl font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl md:text-[56px]">
            Whole body health starts with the right signal.
          </h2>

          <p className="mt-5 max-w-[620px] text-lg leading-relaxed text-white/80">
            Clinician-guided GLP-1 programs that target appetite, metabolism, and
            body composition — backed by peer-reviewed science and personalized to
            your biology.
          </p>
        </div>

        {/* ---- product grid ---- */}
        <motion.div
          variants={gridContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          className="mt-14 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4"
        >
          {products.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </motion.div>

        {/* ---- bottom CTA ---- */}
        {/* <div className="mt-12 flex justify-center">
          <Link
            href="/market-place"
            className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 ease-out hover:border-white/30 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-cyborg-purple"
          >
            Shop All Products
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div> */}
      </Container>
    </section>
  );
}
