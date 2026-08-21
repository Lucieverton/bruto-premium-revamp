import { useEffect, useRef } from 'react';
import defaultBarbershopFront from '@/assets/barbershop-front-nobg.png';
import defaultBarbershopInterior from '@/assets/barbershop-interior.jpg';
import { useSiteImageSlot, useSiteText } from '@/hooks/useSiteImages';
import { ABOUT_DEFAULTS } from '@/lib/siteAboutDefaults';
import { Card3DFlip } from './Card3DFlip';

export const About = () => {
  const front = useSiteImageSlot('about_front', defaultBarbershopFront);
  const interior = useSiteImageSlot('about_interior', defaultBarbershopInterior);
  const barbershopFront = front.src;
  const barbershopInterior = interior.src;
  const imagesResolved = front.resolved && interior.resolved;


  const title = useSiteText('about_title', ABOUT_DEFAULTS.about_title);
  const caption1 = useSiteText('about_caption_1', ABOUT_DEFAULTS.about_caption_1);
  const caption2 = useSiteText('about_caption_2', ABOUT_DEFAULTS.about_caption_2);
  const p1 = useSiteText('about_p1', ABOUT_DEFAULTS.about_p1);
  const p2 = useSiteText('about_p2', ABOUT_DEFAULTS.about_p2);
  const p3 = useSiteText('about_p3', ABOUT_DEFAULTS.about_p3);
  const highlight = useSiteText('about_highlight', ABOUT_DEFAULTS.about_highlight);

  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeInUp');
          }
        });
      },
      { threshold: 0.1 },
    );
    const el = sectionRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  return (
    <section id="sobre" ref={sectionRef} className="py-12 md:py-16 px-5 bg-background">
      <div className="max-w-[900px] mx-auto">
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-center mb-16 uppercase relative inline-block left-1/2 -translate-x-1/2">
          {title}
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded" />
        </h2>

        <div className="space-y-10">
          {/* Card 3D Flip */}
          <div className="space-y-3">
            <div className={imagesResolved ? 'opacity-100 transition-opacity duration-300' : 'opacity-0'}>
              <Card3DFlip
                frontImage={barbershopFront}
                backImage={barbershopInterior}
                frontAlt={caption1}
                backAlt={caption2}
              />
            </div>

            {(caption1 || caption2) && (
              <p className="text-center text-sm text-muted-foreground break-words px-4">
                {caption1}
                {caption1 && caption2 && <span className="mx-2 text-primary">•</span>}
                {caption2}
              </p>
            )}
          </div>

          {/* Textos configuráveis */}
          <div className="space-y-6 text-center max-w-[800px] mx-auto px-4">
            {p1 && (
              <p className="text-foreground text-lg md:text-xl leading-relaxed whitespace-pre-line break-words">
                {p1}
              </p>
            )}
            {p2 && (
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed whitespace-pre-line break-words">
                {p2}
              </p>
            )}
            {p3 && (
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed whitespace-pre-line break-words">
                {p3}
              </p>
            )}
            {highlight && (
              <p className="text-lg md:text-xl font-semibold text-primary mt-8 break-words">
                {highlight}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
