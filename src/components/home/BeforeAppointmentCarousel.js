"use client";

export default function BeforeAppointmentCarousel({ data }) {
  return (
    <div className="mt-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold font-inter text-black lg:text-xl">{data.title}</h3>
        <p className="text-sm font-inter text-secondary lg:text-base">{data.subtitle}</p>
      </div>

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:pb-0">
        {data.cards.map((card) => (
          <div
            key={card.title}
            className="min-w-[70vw] min-h-[30vh] bg-white flex flex-col justify-between rounded-2xl border border-borderColor p-4 shadow-sm md:min-w-[360px] lg:min-w-0 lg:min-h-[250px]"
          >
            <div className="flex flex-col">
              <h4 className="text-base font-semibold font-inter text-black mb-2 lg:text-lg">{card.title}</h4>
              <p className="text-sm font-inter text-secondary leading-relaxed lg:text-base">{card.description}</p>
            </div>
            <p className="text-xs font-inter text-secondary mt-6">{card.index}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
