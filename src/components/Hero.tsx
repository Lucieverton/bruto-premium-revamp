import { ChevronDown } from 'lucide-react';
import heroImage from '@/assets/hero-bg.jpg';

export const Hero = () => {
  return (
    <header 
      className="relative h-[65vh] min-h-[450px] w-full flex items-end justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-foreground opacity-80" />
      </div>
    </header>
  );
};
