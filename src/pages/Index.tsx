import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { IntroBanner } from '@/components/IntroBanner';
import { About } from '@/components/About';
import { Portfolio } from '@/components/Portfolio';
import { PriceTable } from '@/components/PriceTable';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { WhatsAppFloat } from '@/components/WhatsAppFloat';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <IntroBanner />
      <main>
        <About />
        <Portfolio />
        <PriceTable />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default Index;
