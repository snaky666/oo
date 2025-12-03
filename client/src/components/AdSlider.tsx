import { useState, useEffect } from "react";
import { Ad } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface AdSliderProps {
  ads: Ad[];
  autoSlideInterval?: number;
}

export default function AdSlider({ ads, autoSlideInterval = 5000 }: AdSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible || ads.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [ads.length, autoSlideInterval, isVisible]);

  if (ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <div
      className="relative w-full h-[300px] md:h-[400px] overflow-hidden rounded-lg fade-in"
      onMouseEnter={() => setIsVisible(false)}
      onMouseLeave={() => setIsVisible(true)}
    >
      {/* Ad Image with Fade Transition */}
      <div
        key={currentAd.id}
        className="absolute inset-0 fade-in-out"
      >
        <img
          src={currentAd.image}
          alt="إعلان"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
      </div>

      {/* Ad Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
        <div className="max-w-2xl">
          <p className="text-white text-lg md:text-2xl font-semibold mb-4">
            {currentAd.description}
          </p>
          {currentAd.link && currentAd.link !== "" && (
            <a href={currentAd.link} target="_blank" rel="noopener noreferrer">
              <Button variant="default" size="lg" data-testid="button-visit-ad">
                زيارة موقع الشركة
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Indicators */}
      {ads.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/70"
              }`}
              data-testid={`button-ad-indicator-${index}`}
            />
          ))}
        </div>
      )}

      {/* CSS for Fade In/Out */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .fade-in {
          animation: fadeIn 0.8s ease-in-out;
        }

        .fade-in-out {
          animation: fadeIn 0.8s ease-in-out;
        }
      `}</style>
    </div>
  );
}
