import { ChevronDown } from 'lucide-react';
import heroImage from '@/assets/hero-bg.jpg';
import heroMobileImage from '@/assets/hero-mobile.jpg';

export const Hero = () => {
  return (
    <header className="relative h-[85vh] md:h-screen md:min-h-[700px] w-full flex items-center justify-center overflow-hidden">
      {/* Background Mobile - Visível apenas em telas pequenas */}
      <div 
        className="absolute inset-0 bg-no-repeat md:hidden"
        style={{ 
          backgroundImage: `url(${heroMobileImage})`,
          backgroundPosition: 'center center',
          backgroundSize: '100% auto'
        }}
      />
      
      {/* Background Desktop - Visível apenas em telas médias e grandes */}
      <div 
        className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${heroImage})`,
          backgroundPosition: 'center center',
          backgroundSize: 'cover'
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />
      
      <div className="relative z-10 text-center px-5 max-w-4xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase mb-6 animate-fadeInUp text-shadow-lg">
          Barbearia <span className="text-primary">Brutos</span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          Tradição, Estilo e Atitude em Cada Corte
        </p>
      </div>
      
      <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-10 h-10 text-foreground opacity-80" />
      </div>
    </header>
  );
};
