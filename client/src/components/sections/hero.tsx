import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/language-context";
import { apiRequest } from "@/lib/queryClient";
import { getFullImageUrl, handleImageError } from "@/lib/image-utils";

type Slide = { title?: string; text?: string; imageUrl?: string };

// Red promo card (background image + scrim + copy)
function PromoCard({ slide }: { slide: Slide }) {
  return (
    <div className="relative w-full h-full rounded-[20px] overflow-hidden min-h-[240px] md:min-h-[330px] flex flex-col justify-center p-8 md:p-11 bg-gradient-to-br from-[#E8442E] to-[#F0603F]">
      {slide?.imageUrl && (
        <img
          src={getFullImageUrl(slide.imageUrl)}
          alt={slide.title || "Марал Мах"}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => handleImageError(e, slide.imageUrl)}
          loading="eager"
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(100deg,rgba(200,40,30,.92) 0%,rgba(200,40,30,.55) 48%,rgba(200,40,30,0) 78%)",
        }}
      />
      <div className="relative max-w-[420px] flex flex-col gap-3.5 pointer-events-none">
        <span className="bg-[#262626] text-white text-[11px] font-extrabold tracking-[1.5px] px-3 py-1.5 rounded-full w-max">
          ХЯМДРАЛ
        </span>
        <h2 className="text-white text-[26px] md:text-[34px] font-extrabold leading-[1.25] tracking-[-.5px]">
          {slide?.title || "Өнөөдөр идэх махаа маргааш гэж бүү хойшлуул"}
        </h2>
        {slide?.text && (
          <p className="text-white/85 text-sm font-semibold">{slide.text}</p>
        )}
      </div>
    </div>
  );
}

// Yellow recipe card
function RecipeCard() {
  return (
    <div className="relative w-full h-full rounded-[20px] overflow-hidden p-7 md:p-8 flex flex-col gap-3 min-h-[240px] md:min-h-[330px] bg-[#F6C544]">
      <span className="relative bg-white text-[#262626] text-[11px] font-extrabold tracking-[1.5px] px-3 py-1.5 rounded-full w-max">
        ЖОР
      </span>
      <h3 className="relative text-[22px] md:text-[26px] font-extrabold tracking-[-.5px] leading-[1.2]">
        Солонгосын аль ч хот руу хүргэнэ
      </h3>
      <p className="relative text-[12.5px] font-semibold text-[#6b5410] leading-[1.5]">
        Видео жорыг дагаад Маралын хавиргаар гэртээ ресторан шиг хоол хийгээрэй.
      </p>
    </div>
  );
}

export function Hero() {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Fetch hero content (admin-managed)
  const { data: heroData } = useQuery<any>({
    queryKey: ["/api/settings/hero"],
    queryFn: () => apiRequest("GET", "/api/settings/hero"),
    staleTime: 60000,
  });

  const slides: Slide[] = React.useMemo(() => {
    if (!heroData) return [];
    if (
      heroData.slides &&
      Array.isArray(heroData.slides) &&
      heroData.slides.length > 0
    ) {
      return heroData.slides;
    }
    return [
      {
        title: heroData.title || t.heroTitle,
        text: heroData.text || t.heroSubtitle,
        imageUrl: heroData.imageUrl,
      },
    ];
  }, [heroData, t]);

  const displaySlides: Slide[] =
    slides.length > 0
      ? slides
      : [
          {
            title: "Өнөөдөр идэх махаа маргааш гэж бүү хойшлуул",
            text: "Өөрийн дуртай хэсгээ сонгоод гэртээ хүргүүлээрэй.",
            imageUrl: undefined,
          },
        ];

  // Desktop: auto-rotate the single promo card
  useEffect(() => {
    if (displaySlides.length <= 1) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % displaySlides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [displaySlides.length]);

  const slide = displaySlides[active] || displaySlides[0];

  // Mobile: panels = each promo slide + recipe card
  const mobilePanels = displaySlides.length + 1;

  const onMobileScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== mobileIndex) setMobileIndex(idx);
  };

  const scrollToPanel = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-2 pb-2">
      {/* Mobile: horizontal swipe carousel */}
      <div className="md:hidden">
        <div
          ref={scrollerRef}
          onScroll={onMobileScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
          style={{ scrollBehavior: "smooth" }}
        >
          {displaySlides.map((s, i) => (
            <div
              key={i}
              className="snap-center shrink-0 basis-full pr-3 last:pr-0"
            >
              <PromoCard slide={s} />
            </div>
          ))}
          <div className="snap-center shrink-0 basis-full pr-3 last:pr-0">
            <RecipeCard />
          </div>
        </div>

        {/* Dots */}
        {mobilePanels > 1 && (
          <div className="flex justify-center gap-1.5 items-center mt-3">
            {Array.from({ length: mobilePanels }).map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToPanel(i)}
                aria-label={`Panel ${i + 1}`}
                className={
                  i === mobileIndex
                    ? "w-[18px] h-1.5 rounded-full bg-[#E8442E] transition-all"
                    : "w-1.5 h-1.5 rounded-full bg-gray-300 transition-all"
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: 2-column grid */}
      <div className="hidden md:grid grid-cols-[2fr_1fr] gap-5">
        <div className="relative">
          <PromoCard slide={slide} />
          {displaySlides.length > 1 && (
            <div className="absolute left-11 bottom-5 flex gap-1.5 items-center">
              {displaySlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={
                    i === active
                      ? "w-[18px] h-1.5 rounded-full bg-white"
                      : "w-1.5 h-1.5 rounded-full bg-white/45"
                  }
                />
              ))}
            </div>
          )}
        </div>
        <RecipeCard />
      </div>
    </section>
  );
}
