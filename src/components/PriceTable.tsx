import { useEffect, useRef } from 'react';

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

        <div className="overflow-x-auto mt-16">
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
      </div>
    </section>
  );
};
