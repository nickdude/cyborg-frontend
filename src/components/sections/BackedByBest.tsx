"use client";

import { motion } from "motion/react";
import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

type Advisor = {
  name: string;
  title: string;
  photo: string;
};

const PHOTOS = [
  "/assets/profile1.png",
  "/assets/profile2.png",
  "/assets/profile3.png",
  "/assets/profile4.png",
] as const;

const ADVISORS: Advisor[] = [
  {
    name: "Dr. Cole Palmer",
    title: "Cyborg Chief Longevity Officer, Harvard MD & MBA",
    photo: PHOTOS[0],
  },
  {
    name: "Dr. Reece James",
    title: "Clinician & Founder of The Centre for New Medicine",
    photo: PHOTOS[1],
  },
  {
    name: "Dr. Enzo Fernandes",
    title: "Founder & Medical Director of Concierge MD",
    photo: PHOTOS[2],
  },
  {
    name: "Dr. Moises Caicedo",
    title: "UCLA Medical Professor, NYT Bestselling Author",
    photo: PHOTOS[3],
  },
  {
    name: "Arielle Zuckerman",
    title: "Partner at Long Journey Ventures, formerly Coatue",
    photo: PHOTOS[0],
  },
  {
    name: "Shaan Puri",
    title: "6x Founder, investor, co-host of My First Million podcast",
    photo: PHOTOS[1],
  },
  {
    name: "Justin Mares",
    title: "Founder, Kettle & Fire, TrueMed, Surely, Perfect Keto",
    photo: PHOTOS[2],
  },
  {
    name: "Dr. Robert Lufkin",
    title: "Physician & medical school professor at UCLA & USC",
    photo: PHOTOS[3],
  },
  {
    name: "Balaji Srinivasan",
    title: "Investor & entrepreneur, former CTO of Coinbase",
    photo: PHOTOS[0],
  },
  {
    name: "Dr. Abe Malkin",
    title: "Physician Entrepreneur, Founder at Drip Hydration",
    photo: PHOTOS[1],
  },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

export function BackedByBest() {
  return (
    <section className="bg-white py-24">
      <Container>
        <motion.h2
          className="text-center text-4xl font-semibold tracking-[-0.02em] text-black md:text-[56px]"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          transition={{ duration: 0.7, ease: easeOut }}
        >
          Backed by the best
        </motion.h2>
        <motion.p
          className="mx-auto mt-4 max-w-[420px] text-center text-black/55"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          transition={{ duration: 0.7, delay: 0.08, ease: easeOut }}
        >
          Supported by the world&apos;s top longevity doctors, scientists, and
          technologists.
        </motion.p>

        <div className="mx-auto mt-16 grid max-w-[920px] grid-cols-1 gap-x-16 gap-y-6 md:grid-cols-2">
          {ADVISORS.map((advisor, index) => (
            <motion.div
              key={advisor.name}
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{
                duration: 0.6,
                delay: index * 0.05,
                ease: easeOut,
              }}
            >
              <img
                src={advisor.photo}
                alt={advisor.name}
                className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                loading="lazy"
              />
              <div className="min-w-0">
                <p className={cn("text-[15px] font-semibold text-black")}>
                  {advisor.name}
                </p>
                <p className="mt-0.5 text-[13px] text-black/55">
                  {advisor.title}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
