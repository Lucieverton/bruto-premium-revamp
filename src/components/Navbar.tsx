import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

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
              className="h-16 md:h-20 w-auto animate-pulse"
            />
          </a>

          {/* Desktop Menu */}
          <ul className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-foreground hover:text-primary transition-colors duration-300 text-base font-medium relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed top-20 right-0 h-[calc(100vh-5rem)] w-72 bg-black/98 backdrop-blur-xl border-l border-border shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <ul className="flex flex-col p-6 space-y-4">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={handleLinkClick}
                className="block text-foreground hover:text-primary transition-colors duration-300 text-lg font-medium py-3 px-4 rounded-lg hover:bg-primary/10"
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[-1] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </nav>
  );
};
