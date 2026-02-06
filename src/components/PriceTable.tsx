import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scissors, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import produtos1 from '@/assets/produtos1.png';

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

export const PriceTable = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ['public-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, duration_minutes, is_active')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Service[];
    },
  });

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  return (
    <section id="precos" ref={sectionRef} className="py-12 md:py-16 px-5 bg-card">
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

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
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
                {services?.map((service) => (
                  <tr 
                    key={service.id}
                    className="border-b border-border hover:bg-primary/5 transition-colors duration-200"
                  >
                    <td className="py-3 px-4 md:px-6 text-sm md:text-base text-muted-foreground">
                      {service.name}
                    </td>
                    <td className="py-3 px-4 md:px-6 text-center text-sm md:text-base text-muted-foreground">
                      {service.duration_minutes} min
                    </td>
                    <td className="py-3 px-4 md:px-6 text-right text-sm md:text-base font-semibold text-primary">
                      {formatPrice(service.price)}
                    </td>
                  </tr>
                ))}
                {(!services || services.length === 0) && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      Nenhum serviço disponível no momento
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

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
              <Link to="/fila">
                <Scissors className="mr-2" size={20} />
                Entre na fila agora
              </Link>
            </Button>
          </article>
        </div>
      </div>
    </section>
  );
};
