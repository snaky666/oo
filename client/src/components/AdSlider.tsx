
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

interface AdSliderProps {
  isHero?: boolean;
}

export default function AdSlider({ isHero = false }: AdSliderProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/ads');
      const data = await response.json();
      const activeAds = data.filter((ad: Ad) => ad.active);
      setAds(activeAds);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ads.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [ads.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-muted animate-pulse rounded-lg" />
    );
  }

  if (ads.length === 0) {
    return null;
  }

  const currentSlide = ads[currentIndex];

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
          {currentSlide.link && (
            <div className="flex justify-end">
              <Button
                asChild
                size="lg"
                className={`${isHero ? "bg-white text-black hover:bg-gray-100" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
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
      {ads.length > 1 && (
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
      {ads.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {ads.map((_, index) => (
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
