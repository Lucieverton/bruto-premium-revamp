import { ChevronDown } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import heroMobileImage from "@/assets/hero-mobile.jpg";

export const Hero = () => {
  return (
    <header className="relative h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Background Mobile - Visível apenas em telas pequenas */}
      <div
        className="absolute inset-0 bg-no-repeat md:hidden"
        style={{
          backgroundImage: `url(${heroMobileImage})`,
          backgroundPosition: "center center",
          backgroundSize: "contain", // 👈 Mantido igual ao seu código original
        }}
      />

      {/* Background Desktop - Visível apenas em telas médias e grandes */}
      {/* Camada de fundo desfocada para preencher laterais */}
      <div
        className="hidden md:block absolute inset-0 bg-no-repeat bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          filter: "blur(20px)",
          transform: "scale(1.1)",
        }}
      />
      {/* Imagem principal nítida */}
      <div
        className="hidden md:block absolute inset-0 bg-no-repeat transition-all duration-700 ease-out"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundPosition: "center 65%",
          backgroundSize: "auto 110%",
        }}
      />

      {/* Overlay gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />

      {/* Conteúdo principal */}
      <div className="relative z-10 text-center px-5 max-w-4xl mx-auto">
        {/* (Conteúdo pode ser recolocado aqui se quiser mostrar título e subtítulo) */}
      </div>

      {/* Ícone chevron para rolagem */}
      <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-10 h-10 text-foreground opacity-80" />
      </div>
    </header>
  );
};
