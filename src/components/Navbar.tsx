import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';
import menuIcon from '@/assets/menu-icon.png';
import closeIcon from '@/assets/close-icon.png';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/95 backdrop-blur-lg shadow-lg' : 'bg-black/80 backdrop-blur-md'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex-shrink-0">
            <img 
              src={logo} 
              alt="Logo Barbearia Brutos" 
              className="h-14 md:h-16 w-auto transition-transform duration-300 hover:scale-105"
            />
          </a>

          {/* Menu Button - Visible on all screens */}
          <button
            className="w-12 h-12 flex items-center justify-center transition-transform duration-300 hover:scale-110"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <img 
              src={isOpen ? closeIcon : menuIcon} 
              alt={isOpen ? 'Fechar menu' : 'Abrir menu'}
              className={`w-10 h-10 object-contain transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}
            />
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
