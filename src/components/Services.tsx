import { useEffect, useRef } from 'react';
import { Scissors, Sparkles, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const services = [
  {
    imageName: 'cabelo1',
    title: 'Corte de Cabelo',
    description: 'Clássico ou moderno, cortes alinhados às tendências.',
    price: 'R$ 40,00',
  },
  {
    imageName: 'barba1',
    title: 'Barba & Bigode',
    description: 'Design profissional para um visual impecável.',
    price: 'R$ 30,00',
  },
  {
    imageName: 'produtos1',
    title: 'Produtos Premium',
    description: 'Minoxidil, Pomada modeladora e linhas exclusivas.',
    price: 'A partir de R$ 25,00',
  },
];

export const Services = () => {
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
    <section id="servicos" ref={sectionRef} className="py-16 md:py-24 px-5 bg-background relative overflow-hidden">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23fff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }} />
      </div>

      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl uppercase relative inline-block">
            Nossos serviços
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded" />
          </h2>
          <p className="text-muted-foreground text-lg mt-6">
            Excelência em cada detalhe
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-16">
          {services.map((service, index) => (
            <article 
              key={index}
              className="bg-card border border-border rounded-lg p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.2}s forwards`,
                opacity: 0
              }}
            >
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300 mb-6 overflow-hidden">
                <img 
                  src={`/src/assets/${service.imageName}.png`}
                  alt={service.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback para caso a imagem não exista ainda
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              
              <h3 className="font-display text-xl md:text-2xl mb-3 uppercase">
                {service.title}
              </h3>
              
              <p className="text-muted-foreground mb-4">
                {service.description}
              </p>
              
              <div className="text-primary font-bold text-lg bg-primary/10 py-2 px-4 rounded-lg inline-block">
                {service.price}
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wide min-w-[250px] shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <a 
              href="https://filaparacorteoficial.lovable.app/fila/barbearia-brutos-1759232212817"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Scissors className="mr-2" size={20} />
              Entre na fila agora
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};
