
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Ad {
  id: string;
  image: string;
  companyName?: string;
  link?: string;
  description?: string;
  active: boolean;
}

interface Slide {
  id: string;
  image: string;
  companyName?: string;
  link?: string;
  description?: string;
  isHero?: boolean;
}

interface AdSliderProps {
  ads: Ad[];
  heroImage: string;
}

export default function AdSlider({ ads, heroImage }: AdSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine hero image with ads
  const slides: Slide[] = [
    {
      id: "hero",
      image: heroImage,
      description: "منصة موثوقة لبيع وشراء الأغنام",
      isHero: true,
    },
    ...ads.map((ad) => ({
      id: ad.id,
      image: ad.image,
      companyName: ad.companyName,
      description: ad.description,
      link: ad.link,
      isHero: false,
    })),
  ];

  useEffect(() => {
    if (slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (slides.length === 0) {
    return null;
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative w-full overflow-hidden rounded-lg shadow-lg">
      {/* Main Image */}
      <div className="relative w-full h-96">
        <img
          src={currentSlide.image}
          alt={currentSlide.companyName || "إعلان"}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay gradient for better text readability */}
        {isHero && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        )}
      </div>

      {/* Content Below Image */}
      {currentSlide.description && (
        <div className={`flex flex-col justify-between p-6 md:p-8 lg:p-10 ${currentSlide.isHero ? "bg-transparent" : "bg-white dark:bg-slate-900"}`}>
          {/* Company Name */}
          {!currentSlide.isHero && currentSlide.companyName && (
            <div className="flex items-start justify-end mb-4">
              <h2 className="text-2xl md:text-4xl font-black leading-tight text-right text-foreground">
                {currentSlide.companyName}
              </h2>
            </div>
          )}
          
          {/* Hero Title */}
          {currentSlide.isHero && (
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-right text-white" style={{textShadow: '0 4px 12px rgba(0,0,0,0.8)'}}>
              منصة موثوقة<br />لبيع وشراء<br />الأغنام
            </h1>
          )}

          {/* Description */}
          <p className={`text-base md:text-lg font-light mb-6 leading-relaxed text-right ${currentSlide.isHero ? "text-white" : "text-foreground"}`}>
            {currentSlide.description}
          </p>

          {/* CTA Button */}
          {currentSlide.link && (
            <div className="flex justify-end">
              <Button
                asChild
                size="lg"
                className={`${currentSlide.isHero ? "bg-white text-black hover:bg-gray-100" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
              >
                <a href={currentSlide.link} target="_blank" rel="noopener noreferrer">
                  اعرف المزيد
                </a>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
            onClick={nextSlide}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
