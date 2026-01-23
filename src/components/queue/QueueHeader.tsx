import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

export const QueueHeader = () => {
  return (
    <header className="bg-background border-b border-border py-4 px-5">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src={logo} 
            alt="Brutos Barbearia" 
            className="h-12 w-auto transition-transform duration-300 group-hover:scale-110"
          />
          <span className="font-display text-xl uppercase hidden sm:block">Brutos</span>
        </Link>
        
        <Link 
          to="/"
          className="text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          ← Voltar ao site
        </Link>
      </div>
    </header>
  );
};
