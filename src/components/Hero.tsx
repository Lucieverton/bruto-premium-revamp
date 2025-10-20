import { ChevronDown } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import heroMobileImage from "@/assets/hero-mobile.jpg";

export const Hero = () => {
  return (
    <header className="relative h-[calc(100vh-96px)] md:h-[calc(100vh-112px)] w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Background Mobile - Visível apenas em telas pequenas */}
      <div
        className="absolute inset-0 bg-no-repeat md:hidden"
        style={{
          backgroundImage: `url(${heroMobileImage})`,
          backgroundPosition: "center center",
          backgroundSize: "cover",
        }}
      />

      {/* Background Desktop - Visível apenas em telas médias e grandes */}
      <div
        className="hidden md:block absolute inset-0 bg-no-repeat bg-center transition-all duration-700 ease-out"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundPosition: "center center",
          backgroundSize: "115%", // Aumente esse valor pra dar mais zoom (ex: 120%)
        }}
      />

      {/* Overlay gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />

      {/* Conteúdo principal */}
      <div className="relative z-10 text-center px-5 max-w-4xl mx-auto">
        {/* Exemplo caso queira o conteúdo aqui */}
        {/* 
        <h1 className="text-4xl md:text-6xl font-display text-white uppercase mb-6">
          Barbearia <span className="text-primary">Brutos</span>
        </h1>
        <p className="text-xl text-gray-300">
          Tradição, Estilo e Atitude em Cada Corte
        </p>
        */}
      </div>

      {/* Ícone chevron para rolagem */}
      <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-10 h-10 text-foreground opacity-80" />
      </div>
    </header>
  );
};
