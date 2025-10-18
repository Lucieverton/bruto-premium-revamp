import { useEffect, useRef } from 'react';
import barbershopFront from '@/assets/barbershop-front.jpg';
import barbershopInterior from '@/assets/barbershop-interior.jpg';

export const About = () => {
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

  return (
    <section id="sobre" ref={sectionRef} className="py-16 md:py-24 px-5 bg-background">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-center mb-12 uppercase relative inline-block left-1/2 -translate-x-1/2">
          Sobre nós
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded" />
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center mt-16">
          <div className="space-y-6">
            <figure className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img 
                src={barbershopFront}
                alt="Fachada da Barbearia Brutos"
                className="w-full h-auto rounded-lg animate-bounceIn"
                loading="lazy"
              />
            </figure>
            <figure className="relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img 
                src={barbershopInterior}
                alt="Interior da Barbearia Brutos"
                className="w-full h-auto rounded-lg animate-bounceIn"
                loading="lazy"
              />
            </figure>
          </div>
          
          <div className="space-y-4 text-left">
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Na <strong className="text-foreground font-bold">Brutos Barbearia</strong>, tradição e modernidade caminham lado a lado!
            </p>
            
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Nosso time é formado por três excelentes profissionais que seguem o padrão Brutos de qualidade: <strong className="text-foreground font-bold">Lucas</strong>, <strong className="text-foreground font-bold">DG</strong> e <strong className="text-foreground font-bold">Bruninho</strong>. Eles estão prontos para atender você com toda a dedicação e habilidade, garantindo um visual que reflete sua personalidade.
            </p>
            
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Mas aqui não é apenas sobre cabelo. É sobre <strong className="text-foreground font-bold">atitude</strong>, <strong className="text-foreground font-bold">identidade</strong> e aquele papo descontraído que só rola na barbearia.
            </p>
            
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed font-semibold">
              Venha pra <strong className="text-primary">Brutos</strong> e sinta a diferença!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
