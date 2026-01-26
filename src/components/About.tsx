import { useEffect, useRef } from 'react';
import barbershopFront from '@/assets/barbershop-front-nobg.png';
import barbershopInterior from '@/assets/barbershop-interior.jpg';
import { Card3DFlip } from './Card3DFlip';
export const About = () => {
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fadeInUp');
        }
      });
    }, {
      threshold: 0.1
    });
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  return <section id="sobre" ref={sectionRef} className="py-12 md:py-16 px-5 bg-background">
      <div className="max-w-[900px] mx-auto">
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-center mb-16 uppercase relative inline-block left-1/2 -translate-x-1/2">
          Sobre nós
          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded" />
        </h2>
        
        <div className="space-y-12">
          {/* Card 3D Flip */}
          <Card3DFlip frontImage={barbershopFront} backImage={barbershopInterior} frontAlt="Fachada da Barbearia Brutos" backAlt="Interior da Barbearia Brutos" />
          
          {/* Texto Principal */}
          <div className="space-y-6 text-center max-w-[800px] mx-auto px-4">
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
              Na <strong className="text-foreground font-bold">Brutos Barbearia</strong>, tradição e modernidade caminham lado a lado!
            </p>
            
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Nosso time é formado por dois excelentes profissionais que seguem o padrão Brutos de qualidade: <strong className="text-foreground font-bold">PAULO</strong> e <strong className="text-foreground font-bold">DG</strong>. Eles estão prontos para atender você com toda a dedicação e habilidade, garantindo um visual que reflete sua personalidade.
            </p>
            
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Mas aqui não é apenas sobre cabelo. É sobre <strong className="text-foreground font-bold">atitude</strong>, <strong className="text-foreground font-bold">identidade</strong> e aquele papo descontraído que só rola na barbearia.
            </p>
            
            <p className="text-lg md:text-xl font-semibold text-primary mt-8">
              Venha pra Brutos e sinta a diferença!
            </p>
          </div>
        </div>
      </div>
    </section>;
};