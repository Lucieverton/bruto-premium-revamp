import { useEffect, useRef } from 'react';
import { MapPin, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';

export const Contact = () => {
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
    <section 
      id="contato" 
      ref={sectionRef} 
      className="py-16 md:py-24 px-5 bg-background relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-transparent" />
      
      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl uppercase relative inline-block">
            Entre em contato
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded" />
          </h2>
          <p className="text-muted-foreground text-lg mt-6">
            Agende seu horário ou tire dúvidas pelos nossos canais!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mt-16">
          <div className="space-y-6">
            <div className="flex items-start gap-4 bg-card border border-border rounded-lg p-6 hover:bg-card/80 transition-colors duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-display text-lg mb-1">Endereço</h4>
                <p className="text-muted-foreground">
                  Rua da Codeal, Salvador Lyra, Maceió – AL
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-card border border-border rounded-lg p-6 hover:bg-card/80 transition-colors duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-display text-lg mb-1">Horário</h4>
                <p className="text-muted-foreground">
                  Segunda a Sábado, das 8h às 19h30
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-card border border-border rounded-lg p-6 hover:bg-card/80 transition-colors duration-300">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-display text-lg mb-1">Telefone</h4>
                <p className="text-muted-foreground">
                  (82) 99659-2830
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-lg py-6"
            >
              <a 
                href="https://wa.me/5582996592830"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp className="mr-2" size={24} />
                Chame no WhatsApp
              </a>
            </Button>

            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#E1306C] to-[#C32AA3] hover:from-[#C32AA3] hover:to-[#E1306C] text-white font-bold text-lg py-6"
            >
              <a 
                href="https://instagram.com/barbeariabrutos"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram className="mr-2" size={24} />
                Siga-nos no Instagram
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
