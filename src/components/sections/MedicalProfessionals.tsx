import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

type University = {
  name: string;
  src: string;
};

type Doctor = {
  name: string;
  role: string;
  photo: string;
};

const universities: University[] = [
  { name: "Harvard Medical School", src: "/assets/logo2.svg" },
  { name: "Stanford", src: "/assets/logo1.svg" },
  { name: "UCLA", src: "/assets/logo3.svg" },
];

const doctors: Doctor[] = [
  {
    name: "Dr. Cole Palmer",
    role: "Cyborg Chief Longevity Officer, Harvard MD & MBA",
    photo: "/assets/profile1.png",
  },
  {
    name: "Dr. Reece James",
    role: "Clinician & Founder of The Centre for New Medicine",
    photo: "/assets/profile2.png",
  },
  {
    name: "Dr. Enzo Fernandes",
    role: "Founder & Medical Director of Concierge MD",
    photo: "/assets/profile3.png",
  },
  {
    name: "Dr. Moises Caicedo",
    role: "UCLA Medical Professor, NYT Bestselling Author",
    photo: "/assets/profile4.png",
  },
];

export function MedicalProfessionals() {
  return (
    <section className="bg-[#ececec] py-20 md:py-24">
      <Container className="max-w-[960px]">
        <h2 className="max-w-[520px] text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-[#0f1013] md:text-[56px]">
          Developed by world-class medical professionals
        </h2>
        <p className="mt-4 text-lg text-black/60">
          Supported by the world&apos;s top longevity clinicians and MDs.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-10">
          {universities.map((university) => (
            <img
              key={university.name}
              src={university.src}
              alt={university.name}
              className="h-12 w-auto opacity-80"
            />
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-8 sm:grid-cols-2">
          {doctors.map((doctor) => (
            <div key={doctor.name} className="flex items-center gap-4">
              <img
                src={doctor.photo}
                alt={doctor.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
              <div>
                <h3 className="text-xl font-semibold text-[#0f1013] md:text-2xl">
                  {doctor.name}
                </h3>
                <p className="mt-0.5 text-sm text-black/55">{doctor.role}</p>
              </div>
            </div>
          ))}
        </div>

        <p className={cn("mt-12 text-base text-black/45")}>
          World-class clinical care, made accessible.
        </p>
      </Container>
    </section>
  );
}
