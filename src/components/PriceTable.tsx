import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Scissors } from 'lucide-react';
import produtos1 from '@/assets/produtos1.png';

const priceData = [
  { service: 'Navalhado + Barba', duration: '20 min', price: 'R$ 50,00' },
  { service: 'Barba Completa', duration: '15 min', price: 'R$ 20,00' },
  { service: 'Corte Social', duration: '20 min', price: 'R$ 25,00' },
  { service: 'Degradê Navalhado', duration: '20 min', price: 'R$ 30,00' },
  { service: 'Degradê Normal', duration: '20 min', price: 'R$ 25,00' },
  { service: 'Tesoura Total', duration: '20 min', price: 'R$ 30,00' },
  { service: 'Infantil (criança até 12 anos)', duration: '20 min', price: 'R$ 30,00' },
  { service: 'Militar', duration: '15 min', price: 'R$ 20,00' },
  { service: 'Barba Militar', duration: '20 min', price: 'R$ 40,00' },
  { service: 'Sobrancelha', duration: '10 min', price: 'R$ 10,00' },
  { service: 'Listra', duration: '5 min', price: 'R$ 5,00' },
  { service: 'Lavar e Hidratação', duration: '10 min', price: 'R$ 10,00' },
  { service: 'Pigmentação Completa', duration: '20 min', price: 'R$ 20,00' },
  { service: 'Degradê + Sobrancelha', duration: '20 min', price: 'R$ 30,00' },
  { service: 'Tesoura Total + Sobrancelha', duration: '20 min', price: 'R$ 35,00' },
  { service: 'Barba + Sobrancelha', duration: '20 min', price: 'R$ 30,00' },
  { service: 'Degradê Navalhado + Sobrancelha', duration: '20 min', price: 'R$ 35,00' },
  { service: 'Degradê Zero + Barba + Sobrancelha', duration: '20 min', price: 'R$ 50,00' },
  { service: 'Lavar Cabelo com Corte', duration: '5 min', price: 'R$ 5,00' },
  { service: 'Lavar sem Corte', duration: '5 min', price: 'R$ 10,00' },
  { service: 'Degradê Navalhado + Barba + Sobrancelha', duration: '20 min', price: 'R$ 55,00' },
  { service: 'Barba Degradê', duration: '5 min', price: 'R$ 5,00' },
  { service: 'Degradê + Barba Completa', duration: '20 min', price: 'R$ 45,00' },
  { service: 'Platinado + Corte', duration: '50 min', price: 'R$ 100,00' },
  { service: 'Luzes + Corte', duration: '50 min', price: 'R$ 100,00' },
];

export const PriceTable = () => {
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
    <section id="precos" ref={sectionRef} className="py-16 md:py-24 px-5 bg-card">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl uppercase relative inline-block">
            Tabela de Preços
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-primary rounded" />
          </h2>
          <p className="text-muted-foreground text-lg mt-6">
            Confira todos os nossos serviços e valores
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-background/50 rounded-lg overflow-hidden shadow-lg">
            <thead>
              <tr className="bg-primary/10 border-b-2 border-primary">
                <th className="py-4 px-4 md:px-6 text-left text-sm md:text-base font-bold uppercase">
                  Serviço
                </th>
                <th className="py-4 px-4 md:px-6 text-center text-sm md:text-base font-bold uppercase">
                  Duração
                </th>
                <th className="py-4 px-4 md:px-6 text-right text-sm md:text-base font-bold uppercase">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {priceData.map((item, index) => (
                <tr 
                  key={index}
                  className="border-b border-border hover:bg-primary/5 transition-colors duration-200"
                >
                  <td className="py-3 px-4 md:px-6 text-sm md:text-base text-muted-foreground">
                    {item.service}
                  </td>
                  <td className="py-3 px-4 md:px-6 text-center text-sm md:text-base text-muted-foreground">
                    {item.duration}
                  </td>
                  <td className="py-3 px-4 md:px-6 text-right text-sm md:text-base font-semibold text-primary">
                    {item.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Produtos Premium Card */}
        <div className="mt-12 max-w-md mx-auto">
          <article className="bg-card border border-border rounded-lg p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300 mb-6 overflow-hidden">
              <img 
                src={produtos1}
                alt="Produtos Premium"
                className="w-full h-full object-contain p-4"
              />
            </div>
            
            <h3 className="font-display text-xl md:text-2xl mb-3 uppercase">
              Produtos Premium
            </h3>
            
            <p className="text-muted-foreground mb-4">
              Minoxidil, Pomada modeladora e linhas exclusivas.
            </p>
            
            <div className="text-primary font-bold text-lg bg-primary/10 py-2 px-4 rounded-lg inline-block mb-6">
              A partir de R$ 25,00
            </div>

            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wide w-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
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
          </article>
        </div>
      </div>
    </section>
  );
};
