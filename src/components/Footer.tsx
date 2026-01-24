import logo from '@/assets/logo.png';
import { FaInstagram, FaWhatsapp, FaFacebook } from 'react-icons/fa';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { href: '#sobre', label: 'Sobre Nós' },
    { href: '#portfolio', label: 'Portfólio' },
    { href: '#servicos', label: 'Serviços' },
    { href: '#precos', label: 'Tabela de Preços' },
    { href: '#contato', label: 'Contato' },
    { href: '#/fila', label: 'Fila Virtual' },
  ];

  return (
    <footer className="w-full bg-black border-t border-border py-12 px-5">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src={logo}
              alt="Logo Barbearia Brutos"
              className="h-24 w-auto"
              loading="lazy"
            />
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://instagram.com/barbeariabrutos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-all duration-300 hover:scale-110"
              aria-label="Instagram"
            >
              <FaInstagram size={28} />
            </a>
            <a
              href="https://wa.me/5582996592830"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-all duration-300 hover:scale-110"
              aria-label="WhatsApp"
            >
              <FaWhatsapp size={28} />
            </a>
            <a
              href="https://facebook.com/barbeariabrutos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-all duration-300 hover:scale-110"
              aria-label="Facebook"
            >
              <FaFacebook size={28} />
            </a>
          </div>

          {/* Footer Links */}
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm md:text-base relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Copyright */}
          <div className="text-center text-muted-foreground text-sm">
            <p>
              © {currentYear} Barbearia Brutos - Todos os direitos reservados | Desenvolvido por{' '}
              <a 
                href="https://www.devstores.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                DevStores
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
