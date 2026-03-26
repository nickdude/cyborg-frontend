const DOCTORS = [
  {
    name: "Dr. Cole Palmer",
    details: "Cyborg Chief Longevity Officer, Harvard MD & MBA",
    image: "/assets/preview/profiles/profile1.png",
  },
  {
    name: "Dr. Reece James",
    details: "Clinician & Founder of The Centre for New Medicine",
    image: "/assets/preview/profiles/profile2.png",
  },
  {
    name: "Dr. Enzo Fernandes",
    details: "Founder & Medical Director of Concierge MD",
    image: "/assets/preview/profiles/profile3.png",
  },
  {
    name: "Dr. Moises Caicedo",
    details: "UCLA Medical Professor, NYT Bestselling Author",
    image: "/assets/preview/profiles/profile4.png",
  },
];

function DoctorCard({ doctor }) {
  return (
    <article className="flex items-start gap-4 rounded-2xl">
      <img
        src={doctor.image}
        alt={doctor.name}
        className="h-[96px] w-[96px] rounded-2xl object-cover md:h-[110px] md:w-[110px]"
      />

      <div className="pt-1">
        <h3 className="text-[clamp(1.6rem,4.8vw,2rem)] font-semibold leading-[1.15] text-[#0f1013]">
          {doctor.name}
        </h3>
        <p className="mt-2 max-w-[24ch] text-[clamp(1.15rem,3.8vw,1.65rem)] leading-[1.32] text-[#666973]">
          {doctor.details}
        </p>
      </div>
    </article>
  );
}

export default function MedicalProfessionalsSection() {
  return (
    <section className="bg-[#ECECEC] px-5 pb-14 pt-14 text-black md:px-8 md:pb-20 md:pt-16">
      <div className="mx-auto w-full max-w-[430px] md:max-w-[980px]">
        <h2 className="max-w-[12ch] text-[clamp(2.4rem,8.3vw,4rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[#0f1013]">
          Developed by world-class medical professionals
        </h2>

        <p className="mt-6 max-w-[24ch] text-[clamp(1.4rem,4.8vw,2.3rem)] leading-[1.3] text-[#111216] md:max-w-[30ch]">
          Supported by the world’s top longevity clinicians and MDs.
        </p>

        <div className="mt-8 grid grid-cols-3 items-center gap-4 md:mt-10 md:max-w-[760px] md:gap-8">
          <img
            src="/assets/preview/logos/logo1.svg"
            alt="Stanford logo"
            className="h-9 w-auto md:h-12"
          />
          <img
            src="/assets/preview/logos/logo2.svg"
            alt="Harvard Medical School logo"
            className="mx-auto h-9 w-auto md:h-12"
          />
          <img
            src="/assets/preview/logos/logo3.svg"
            alt="UCLA logo"
            className="ml-auto h-9 w-auto md:h-12"
          />
        </div>

        <div className="mt-9 space-y-7 md:mt-12 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-9 md:space-y-0">
          {DOCTORS.map((doctor) => (
            <DoctorCard key={doctor.name} doctor={doctor} />
          ))}
        </div>

        <p className="mt-14 text-[clamp(1.35rem,4.4vw,2rem)] leading-[1.3] text-[#666973] md:mt-16">
          What would cost you 15,000 is 4999
        </p>
      </div>
    </section>
  );
}
