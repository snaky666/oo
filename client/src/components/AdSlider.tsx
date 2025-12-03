import { useState, useEffect } from "react";
import { Ad } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface SlideContent {
  id: string;
  image: string;
  description?: string;
  companyName?: string;
  link?: string;
  isHero?: boolean;
}

interface AdSliderProps {
  slides?: SlideContent[];
  autoSlideInterval?: number;
}

export default function AdSlider({ slides = [], autoSlideInterval = 5000 }: AdSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible || !slides || slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [slides?.length, autoSlideInterval, isVisible]);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const isHero = currentSlide.isHero;

  return (
    <div
      className={`relative w-full flex flex-col ${isHero ? "h-auto" : "h-auto"} ${!isHero ? "rounded-lg overflow-hidden" : ""} fade-in`}
      onMouseEnter={() => setIsVisible(false)}
      onMouseLeave={() => setIsVisible(true)}
    >
      {/* Slide Image with Fade Transition */}
      <div
        key={currentSlide.id}
        className={`relative w-full fade-in-out overflow-hidden ${isHero ? "h-[500px] md:h-[600px]" : "h-[300px] md:h-[400px]"}`}
      >
        <img
          src={currentSlide.image}
          alt={isHero ? "صفحة البداية" : "إعلان"}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 ${isHero ? "bg-gradient-to-t from-black/70 via-black/50 to-black/30" : "bg-gradient-to-b from-black/10 to-transparent"}`} />
      </div>

      {/* Content Below Image */}
      {currentSlide.description && (
        <div className={`flex flex-col justify-between p-6 md:p-8 lg:p-10 ${isHero ? "bg-transparent" : "bg-white dark:bg-slate-900"}`}>
          {/* Company Name */}
          {!isHero && currentSlide.companyName && (
            <div className="flex items-start justify-end mb-4">
              <h2 className="text-2xl md:text-4xl font-black leading-tight text-right text-foreground">
                {currentSlide.companyName}
              </h2>
            </div>
          )}
          
          {/* Hero Title */}
          {isHero && (
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-right text-white" style={{textShadow: '0 4px 12px rgba(0,0,0,0.8)'}}>
              منصة موثوقة<br />لبيع وشراء<br />الأغنام
            </h1>
          )}

          {/* Description */}
          <p className={`text-base md:text-lg font-light mb-6 leading-relaxed text-right ${isHero ? "text-white" : "text-foreground"}`}>
            {currentSlide.description}
          </p>

          {/* CTA Button */}
          {currentSlide.link && currentSlide.link !== "" && !isHero && (
            <div className="flex justify-end">
              <a href={currentSlide.link} target="_blank" rel="noopener noreferrer">
                <Button variant="default" size="lg" className="shadow-lg" data-testid="button-visit-ad">
                  زيارة موقع الشركة
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Indicators - For non-hero ads */}
      {slides.length > 1 && !isHero && (
        <div className="flex justify-center gap-2 px-6 pb-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted hover:bg-muted-foreground"
              }`}
              data-testid={`button-ad-indicator-${index}`}
            />
          ))}
        </div>
      )}

      {/* Indicators - For hero */}
      {slides.length > 1 && isHero && (
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
