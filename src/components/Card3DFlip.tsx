import { useState } from 'react';

interface Card3DFlipProps {
  frontImage: string;
  backImage: string;
  frontAlt: string;
  backAlt: string;
}

export const Card3DFlip = ({ frontImage, backImage, frontAlt, backAlt }: Card3DFlipProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="relative w-full max-w-[550px] mx-auto perspective-[1500px] group">
      {/* Floating animation wrapper */}
      <div className="animate-float">
        {/* 3D Card Container */}
        <div
          className={`relative w-full h-[350px] md:h-[420px] transition-all duration-700 transform-style-3d ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front Side */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden rounded-2xl shadow-2xl overflow-hidden bg-background"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <img
              src={frontImage}
              alt={frontAlt}
              className="w-full h-full object-contain"
              loading="lazy"
            />
            <button
              onClick={handleFlip}
              className="absolute bottom-6 right-6 bg-primary/90 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:bg-primary transition-colors duration-300 cursor-pointer z-10"
            >
              Clique para girar
            </button>
          </div>

          {/* Back Side */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden rounded-2xl shadow-2xl overflow-hidden [transform:rotateY(180deg)]"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <img
              src={backImage}
              alt={backAlt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <button
              onClick={handleFlip}
              className="absolute bottom-6 right-6 bg-primary/90 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-lg hover:bg-primary transition-colors duration-300 cursor-pointer z-10"
            >
              Clique novamente
            </button>
          </div>
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 -z-10 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  );
};
