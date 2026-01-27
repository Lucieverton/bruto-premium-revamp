import { Scissors, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const IntroBanner = () => {
  return (
    <section className="bg-background py-8 md:py-12 px-5 text-center border-b border-border">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl uppercase tracking-wide mb-8 animate-fadeInUp">
          Tradição e Modernidade
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            asChild
            size="lg"
            className="group relative overflow-hidden bg-gradient-to-br from-[#e8e8e8] via-[#c0c0c0] to-[#a8a8a8] text-gray-900 font-bold uppercase tracking-wide min-w-[220px] shadow-[0_0_20px_rgba(192,192,192,0.4),0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(220,220,220,0.6),0_6px_20px_rgba(0,0,0,0.4)] transition-all duration-500 hover:-translate-y-1 border border-white/30"
          >
            <Link to="/fila">
              {/* Chrome shine effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              {/* Inner glow */}
              <span className="absolute inset-[1px] rounded-md bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <Scissors className="mr-2 relative z-10 drop-shadow-sm" size={20} />
              <span className="relative z-10 drop-shadow-sm">Entre na fila</span>
            </Link>
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
