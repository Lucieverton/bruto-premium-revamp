import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

export const QueueHeader = () => {
  return (
    <header className="bg-background border-b border-border py-4 px-5">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          {/* Logo 20% maior */}
          <img 
            src={logo} 
            alt="Brutos Barbearia" 
            className="h-14 w-auto transition-transform duration-300 group-hover:scale-105"
          />
          <span className="font-display text-xl uppercase hidden sm:block tracking-tight">Brutos</span>
        </Link>
        
        <Link 
          to="/"
          className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
        >
          ← Voltar ao site
        </Link>
      </div>
    </header>
  );
};
