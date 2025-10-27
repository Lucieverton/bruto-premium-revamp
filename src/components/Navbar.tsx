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
    const text = 'Bem-vindos a barbearia!';
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
    { href: '#precos', label: 'Tabela de Preços' },
    { href: '#contato', label: 'Contato' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-500 animate-slideDown ${
          isScrolled 
            ? 'bg-black/95 backdrop-blur-md shadow-2xl border-b border-primary/30' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 md:h-24 lg:h-28">
            {/* Logo */}
            <a href="#" className="flex-shrink-0 group">
              <img 
                src={logo} 
                alt="Logo Barbearia Brutos" 
                className="h-14 md:h-16 lg:h-20 w-auto transition-all duration-500 hover:scale-110 animate-breathe hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]"
              />
            </a>

            {/* Typing Message - Center - Responsive */}
            <div className="absolute left-1/2 -translate-x-1/2 max-w-[45%] sm:max-w-[50%] md:max-w-none">
              <p className="text-primary font-display text-[10px] sm:text-base md:text-lg lg:text-xl xl:text-2xl uppercase tracking-wide animate-fadeInUp whitespace-nowrap">
                {displayedText}
                <span className="animate-blink">|</span>
              </p>
            </div>

            {/* Menu Button - Visible on all screens */}
            <div className="relative">
              <button
                className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center transition-all duration-300 hover:scale-110 group rounded-lg hover:bg-gradient-to-br hover:from-primary/20 hover:to-primary/5 z-50"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={isOpen}
              >
                <img 
                  src={isOpen ? closeIcon : menuIcon} 
                  alt={isOpen ? 'Fechar menu' : 'Abrir menu'}
                  className={`w-20 h-20 md:w-24 md:h-24 object-contain transition-all duration-500 group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.8)] ${isOpen ? 'rotate-180' : ''}`}
                />
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </button>

              {/* Dropdown Menu */}
              <div
                className={`absolute top-full right-0 mt-2 w-56 bg-black/95 backdrop-blur-xl border border-primary/30 rounded-lg shadow-2xl transition-all duration-300 origin-top z-[60] ${
                  isOpen 
                    ? 'opacity-100 scale-y-100 translate-y-0' 
                    : 'opacity-0 scale-y-0 -translate-y-4 pointer-events-none'
                }`}
              >
                <ul className="py-2">
                  {navLinks.map((link, index) => (
                    <li 
                      key={link.href}
                      className={`transform transition-all duration-300 ${
                        isOpen 
                          ? 'translate-x-0 opacity-100' 
                          : '-translate-x-4 opacity-0'
                      }`}
                      style={{ 
                        transitionDelay: isOpen ? `${index * 0.05}s` : '0s'
                      }}
                    >
                      <a
                        href={link.href}
                        onClick={(e) => handleLinkClick(e, link.href)}
                        className="block text-foreground hover:text-primary transition-all duration-200 text-base font-medium py-3 px-4 hover:bg-primary/10 border-b border-border/20 last:border-b-0"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-transparent z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </nav>
    </>
  );
};
