import { Scissors, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const IntroBanner = () => {
  return (
    <section className="bg-background py-16 md:py-20 px-5 text-center border-b border-border">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl uppercase tracking-wide mb-8 animate-fadeInUp">
          Tradição e Modernidade
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wide min-w-[200px] shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <a 
              href="https://filaparacorteoficial.lovable.app/fila/barbearia-brutos-1759232212817"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Scissors className="mr-2" size={20} />
              Entre na fila
            </a>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-2 border-foreground hover:bg-foreground hover:text-background font-bold uppercase tracking-wide min-w-[200px] shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <a 
              href="https://wa.me/5582996592830?text=Ol%C3%A1%2C%20Brutos!%20Vim%20do%20seu%20site."
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="mr-2" size={20} />
              Fale conosco
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};
