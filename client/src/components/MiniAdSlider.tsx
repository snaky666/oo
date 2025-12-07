import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Ad {
  id: string;
  image: string;
  companyName?: string;
  link?: string;
  description?: string;
  active: boolean;
}

interface MiniAdSliderProps {
  ads: Ad[];
}

export default function MiniAdSlider({ ads }: MiniAdSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (ads.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [ads.length]);

  if (ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentIndex];

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  return (
    <div className="relative w-full overflow-hidden mb-0">
      <div className="relative w-full h-[140px] md:h-[180px]">
        <div className="absolute inset-0">
          <img
            src={currentAd.image}
            alt={currentAd.companyName || "إعلان"}
            className="w-full h-full object-cover transition-transform duration-500 ease-in-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative h-full flex items-end">
          <div className="w-full px-4 pb-4">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                {currentAd.companyName && (
                  <h3 className="text-lg md:text-xl font-bold text-white drop-shadow-lg mb-1">
                    {currentAd.companyName}
                  </h3>
                )}
                {currentAd.description && (
                  <p className="text-sm text-white/80 drop-shadow line-clamp-2">
                    {currentAd.description}
                  </p>
                )}
              </div>
              {currentAd.link && (
                <Button
                  asChild
                  size="sm"
                  className="bg-white text-black hover:bg-white/90 font-semibold shadow-lg flex-shrink-0"
                >
                  <a href={currentAd.link} target="_blank" rel="noopener noreferrer">
                    المزيد
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {ads.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors"
              aria-label="السابق"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={goToNext}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors"
              aria-label="التالي"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {ads.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {ads.map((_, index) => (
            <button
              key={index}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? "bg-white w-6 h-1.5 shadow"
                  : "bg-white/40 hover:bg-white/60 w-1.5 h-1.5"
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`الانتقال إلى الإعلان ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
