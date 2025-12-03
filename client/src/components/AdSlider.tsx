
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
    <div className="relative w-full overflow-hidden">
      {/* Main Slider Container */}
      <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src={currentSlide.image}
            alt={currentSlide.companyName || "إعلان"}
            className="w-full h-full object-cover transition-transform duration-700 ease-in-out"
            style={{
              filter: currentSlide.isHero ? 'brightness(0.85)' : 'brightness(0.9)',
            }}
          />
          
          {/* Gradient Overlays */}
          {currentSlide.isHero ? (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/10" />
          )}
        </div>

        {/* Content Overlay */}
        <div className="relative h-full flex items-end">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-12 md:pb-16 lg:pb-20">
            <div className="max-w-3xl mr-auto">
              {/* Hero Content */}
              {currentSlide.isHero && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight text-right text-white drop-shadow-2xl">
                    منصة موثوقة<br />
                    <span className="text-primary">لبيع وشراء</span><br />
                    الأغنام
                  </h1>
                  <p className="text-lg md:text-xl lg:text-2xl font-light text-white/90 text-right drop-shadow-lg">
                    {currentSlide.description}
                  </p>
                  <div className="flex gap-4 justify-end pt-4">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                    >
                      ابدأ الآن
                    </Button>
                  </div>
                </div>
              )}

              {/* Ad Content */}
              {!currentSlide.isHero && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {currentSlide.companyName && (
                    <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 mb-2">
                      <p className="text-sm md:text-base text-white/80 font-medium">إعلان</p>
                    </div>
                  )}
                  
                  {currentSlide.companyName && (
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-right text-white drop-shadow-2xl leading-tight">
                      {currentSlide.companyName}
                    </h2>
                  )}
                  
                  {currentSlide.description && (
                    <p className="text-base md:text-lg lg:text-xl font-light text-white/90 text-right drop-shadow-lg max-w-2xl mr-auto leading-relaxed">
                      {currentSlide.description}
                    </p>
                  )}

                  {currentSlide.link && (
                    <div className="flex justify-end pt-4">
                      <Button
                        asChild
                        size="lg"
                        className="bg-white text-black hover:bg-white/90 font-bold px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                      >
                        <a href={currentSlide.link} target="_blank" rel="noopener noreferrer">
                          اعرف المزيد
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/30 text-white w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 border border-white/30 text-white w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-300 hover:scale-110 shadow-lg"
            onClick={nextSlide}
          >
            <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? "bg-white w-10 md:w-12 h-2.5 md:h-3 shadow-lg"
                  : "bg-white/40 hover:bg-white/60 w-2.5 md:w-3 h-2.5 md:h-3 backdrop-blur-sm"
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`الانتقال إلى الشريحة ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
