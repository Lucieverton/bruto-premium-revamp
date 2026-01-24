import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import menuIcon from '@/assets/menu-icon.png';
import closeIcon from '@/assets/close-icon.png';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const lastClickTime = useRef(Date.now());
  const navigate = useNavigate();

  // Secret admin access - 5 rapid clicks on logo
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    
    // Reset counter if more than 3 seconds passed
    if (now - lastClickTime.current > 3000) {
      setClickCount(1);
    } else {
      setClickCount(prev => prev + 1);
    }
    lastClickTime.current = now;
    
    // Visual hint at 3rd click
    if (clickCount >= 2 && clickCount < 4) {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 200);
    }
    
    // Navigate at 5th click
    if (clickCount >= 4) {
      navigate('/admin/login');
      setClickCount(0);
      return;
    }
  };

  // Single click to go home (delayed to allow for rapid clicks)
  const handleLogoSingleClick = () => {
    // Only navigate home if not in the middle of rapid clicks
    setTimeout(() => {
      if (clickCount === 0 || Date.now() - lastClickTime.current > 500) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 300);
  };

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
            {/* Logo with secret admin access */}
            <button 
              onClick={(e) => {
                handleLogoClick(e);
                handleLogoSingleClick();
              }}
              className="flex-shrink-0 group bg-transparent border-none cursor-pointer"
              aria-label="Logo Barbearia Brutos"
            >
              <img 
                src={logo} 
                alt="Logo Barbearia Brutos" 
                className={`h-14 md:h-16 lg:h-20 w-auto transition-all duration-500 hover:scale-110 animate-breathe hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.6)] ${
                  showHint ? 'scale-95 opacity-70' : ''
                }`}
              />
            </button>

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
