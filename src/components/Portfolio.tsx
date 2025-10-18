import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import portfolio1 from '@/assets/portfolio1.png';
import portfolio2 from '@/assets/portfolio2.png';
import portfolio3 from '@/assets/portfolio3.png';
import portfolio4 from '@/assets/portfolio4.png';
import portfolio5 from '@/assets/portfolio5.png';
import portfolio6 from '@/assets/portfolio6.png';
import portfolio7 from '@/assets/portfolio7.png';

const portfolioImages = [
  { src: portfolio1, alt: 'Corte profissional com design' },
  { src: portfolio2, alt: 'Trança estilizada com fade' },
  { src: portfolio3, alt: 'Fade com design artístico' },
  { src: portfolio4, alt: 'Corte platinado elegante' },
  { src: portfolio5, alt: 'Corte infantil com degradê' },
  { src: portfolio6, alt: 'Design criativo com degradê' },
  { src: portfolio7, alt: 'Fade artístico com design' },
];

export const Portfolio = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  const [itemsPerView, setItemsPerView] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const calculateItemsPerView = () => {
      const width = window.innerWidth;
      if (width >= 1024) return 3;
      if (width >= 640) return 2;
      return 1;
    };

    const handleResize = () => {
      setItemsPerView(calculateItemsPerView());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeInUp');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const totalSlides = portfolioImages.length;
  const maxIndex = Math.max(0, totalSlides - itemsPerView);

  const goToSlide = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, maxIndex));
    setCurrentIndex(clampedIndex);
  };

  const nextSlide = () => {
    if (currentIndex < maxIndex) {
      goToSlide(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  };

  const openLightbox = (src: string) => {
    setLightboxImage(src);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <section id="portfolio" ref={sectionRef} className="py-16 md:py-24 px-5 bg-card">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl uppercase relative inline-block">
            Nosso trabalho
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded" />
          </h2>
          <p className="text-muted-foreground text-lg mt-6">
            Veja os resultados que transformam nossos clientes
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / itemsPerView + (itemsPerView > 1 ? 1.6 : 0))}%)`,
                gap: '1rem'
              }}
            >
              {portfolioImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => openLightbox(image.src)}
                  className="flex-shrink-0 cursor-pointer transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                  style={{ 
                    width: itemsPerView === 1 
                      ? '100%' 
                      : `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) / itemsPerView}rem)`,
                    marginRight: index < portfolioImages.length - 1 ? '1rem' : '0'
                  }}
                >
                  <img 
                    src={image.src}
                    alt={image.alt}
                    className="w-full aspect-[4/5] object-cover rounded-lg shadow-md"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full disabled:opacity-30"
          >
            <ChevronLeft size={24} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full disabled:opacity-30"
          >
            <ChevronRight size={24} />
          </Button>
        </div>

        {maxIndex > 0 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.min(maxIndex + 1, 7) }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-primary w-8' : 'bg-muted-foreground/30'
                }`}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:bg-white/10"
          >
            <X size={32} />
          </Button>
          <img 
            src={lightboxImage}
            alt="Imagem ampliada"
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};
