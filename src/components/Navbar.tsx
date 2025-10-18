import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import menuIcon from '@/assets/menu-icon.png';
import closeIcon from '@/assets/close-icon.png';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  useEffect(() => {
    const text = 'Bem vindos a barbearia!';
    let index = 0;
    
    const typingInterval = setInterval(() => {
      if (index <= text.length) {
        setDisplayedText(text.slice(0, index));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, []);

  const navLinks = [
    { href: '#sobre', label: 'Sobre nós' },
    { href: '#portfolio', label: 'Nosso Trabalho' },
    { href: '#servicos', label: 'Serviços' },
    { href: '#precos', label: 'Tabela de Preços' },
    { href: '#contato', label: 'Contato' },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-500 animate-slideDown ${
        isScrolled 
          ? 'bg-black/70 backdrop-blur-md shadow-2xl border-b border-primary/30' 
          : 'bg-black/50 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between h-24 md:h-28">
          {/* Logo */}
          <a href="#" className="flex-shrink-0 group">
            <img 
              src={logo} 
              alt="Logo Barbearia Brutos" 
              className="h-16 md:h-20 lg:h-24 w-auto transition-all duration-500 hover:scale-110 animate-breathe hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]"
            />
          </a>

          {/* Typing Message - Center */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
            <p className="text-primary font-display text-xl lg:text-2xl uppercase tracking-wide animate-fadeInUp">
              {displayedText}
              <span className="animate-blink">|</span>
            </p>
          </div>

          {/* Menu Button - Visible on all screens */}
          <button
            className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center transition-all duration-300 hover:scale-110 group rounded-lg hover:bg-gradient-to-br hover:from-primary/20 hover:to-primary/5"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <img 
              src={isOpen ? closeIcon : menuIcon} 
              alt={isOpen ? 'Fechar menu' : 'Abrir menu'}
              className={`w-16 h-16 md:w-20 md:h-20 object-contain transition-all duration-500 group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.8)] ${isOpen ? 'rotate-180' : ''}`}
            />
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
          </button>
        </div>
      </div>

      {/* Sidebar Menu */}
      <div
        className={`fixed top-20 right-0 h-[calc(100vh-5rem)] w-80 bg-black/98 backdrop-blur-xl border-l border-primary/20 shadow-2xl transition-all duration-500 ease-in-out ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <ul className="flex flex-col p-8 space-y-2">
          {navLinks.map((link, index) => (
            <li 
              key={link.href}
              style={{ 
                animation: isOpen ? `slideInRight 0.3s ease-out ${index * 0.1}s forwards` : 'none',
                opacity: isOpen ? 1 : 0 
              }}
            >
              <a
                href={link.href}
                onClick={handleLinkClick}
                className="block text-foreground hover:text-primary transition-all duration-300 text-lg font-medium py-4 px-5 rounded-lg hover:bg-primary/10 hover:translate-x-2 border-b border-border/30"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[-1]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </nav>
  );
};
