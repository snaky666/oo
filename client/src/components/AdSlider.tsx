import { useState, useEffect } from "react";
import { Ad } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface SlideContent {
  id: string;
  image: string;
  description?: string;
  link?: string;
  isHero?: boolean;
}

interface AdSliderProps {
  slides: SlideContent[];
  autoSlideInterval?: number;
}

export default function AdSlider({ slides, autoSlideInterval = 5000 }: AdSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible || slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [slides.length, autoSlideInterval, isVisible]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const isHero = currentSlide.isHero;

  return (
    <div
      className={`relative w-full overflow-hidden ${isHero ? "h-[500px] md:h-[600px]" : "h-[300px] md:h-[400px]"} ${!isHero ? "rounded-lg" : ""} fade-in`}
      onMouseEnter={() => setIsVisible(false)}
      onMouseLeave={() => setIsVisible(true)}
    >
      {/* Slide Image with Fade Transition */}
      <div
        key={currentSlide.id}
        className="absolute inset-0 fade-in-out"
      >
        <img
          src={currentSlide.image}
          alt={isHero ? "صفحة البداية" : "إعلان"}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 ${isHero ? "bg-gradient-to-t from-black/70 via-black/50 to-black/30" : "bg-gradient-to-t from-black/60 via-black/30 to-transparent"}`} />
      </div>

      {/* Content */}
      {currentSlide.description && (
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          <div className="max-w-2xl">
            <p className="text-white text-lg md:text-2xl font-semibold mb-4">
              {currentSlide.description}
            </p>
            {currentSlide.link && currentSlide.link !== "" && !isHero && (
              <a href={currentSlide.link} target="_blank" rel="noopener noreferrer">
                <Button variant="default" size="lg" data-testid="button-visit-ad">
                  زيارة موقع الشركة
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
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
