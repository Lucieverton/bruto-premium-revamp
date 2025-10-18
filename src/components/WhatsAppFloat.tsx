import { FaWhatsapp } from 'react-icons/fa';

export const WhatsAppFloat = () => {
  return (
    <a
      href="https://wa.me/5582996592830"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-glow"
      aria-label="WhatsApp"
    >
      <FaWhatsapp size={32} />
    </a>
  );
};
