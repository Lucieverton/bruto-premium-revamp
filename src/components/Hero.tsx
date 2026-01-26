import { ChevronDown } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import heroMobileImage from "@/assets/hero-mobile.jpg";
export const Hero = () => {
  return <header className="relative h-[100svh] md:h-[calc(100vh-100px)] w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Background Mobile - Otimizado para telas pequenas */}
      <div className="absolute inset-0 md:hidden" style={{
      backgroundImage: `url(${heroMobileImage})`,
      backgroundPosition: "center center",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat"
    }} />

      {/* Background Desktop - Visível apenas em telas médias e grandes */}
      {/* Camada de fundo desfocada para preencher laterais */}
      <div className="hidden md:block absolute inset-0 bg-no-repeat bg-center" style={{
      backgroundImage: `url(${heroImage})`,
      backgroundSize: "cover",
      filter: "blur(20px)",
      transform: "scale(1.1)"
    }} />
      {/* Imagem principal nítida */}
      <div className="hidden md:block absolute inset-0 bg-no-repeat transition-all duration-700 ease-out" style={{
      backgroundImage: `url(${heroImage})`,
      backgroundPosition: "center 65%",
      backgroundSize: "auto 110%"
    }} />

      {/* Overlay gradiente - mais intenso no mobile para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90 md:from-black/50 md:via-black/30 md:to-black/80" />

      {/* Conteúdo principal - Melhor posicionamento mobile */}
      <div className="relative z-10 text-center px-4 sm:px-5 max-w-4xl mx-auto mt-auto mb-24 md:mt-0 md:mb-0">
        
        
      </div>

      {/* Ícone chevron para rolagem - posição ajustada */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 sm:w-10 sm:h-10 text-foreground opacity-80" />
      </div>
    </header>;
};