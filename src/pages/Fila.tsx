import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { QueueHeader } from "@/components/queue/QueueHeader";
import { MyTicketCard } from "@/components/queue/MyTicketCard";
import { BarbersPanel } from "@/components/queue/BarbersPanel";
import { HeroStatsPanel } from "@/components/queue/HeroStatsPanel";
import { QueueListPanel } from "@/components/queue/QueueListPanel";
import { ActiveServicesDisplay } from "@/components/queue/ActiveServicesDisplay";
import { getMyTicket, clearMyTicket } from "@/lib/antiAbuse";

const QueuePage = () => {
  const [myTicketId, setMyTicketId] = useState<string | null>(() => getMyTicket());

  const handleJoinSuccess = useCallback(() => {
    setTimeout(() => {
      const savedTicket = getMyTicket();
      setMyTicketId(savedTicket);
    }, 100);
  }, []);

  const handleLeaveQueue = useCallback(() => {
    clearMyTicket();
    setMyTicketId(null);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <QueueHeader />

      <main className="py-6 px-4 lg:px-8 max-w-[1600px] mx-auto">
        {/* TÍTULO PRINCIPAL - Sem repetição de "BRUTOS" */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl uppercase tracking-tight italic font-black">
            FILA <span className="text-primary">VIRTUAL</span>
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] mt-2 font-medium">
            Acompanhamento em tempo real
          </p>
        </motion.div>

        {/* GRID LAYOUT - Alinhamento vertical melhorado */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          {/* ESQUERDA: Barbeiros */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-card/60 border border-border rounded-2xl overflow-hidden backdrop-blur-sm h-full flex flex-col">
              <div className="bg-muted/50 px-4 py-3 text-center border-b border-border">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Barbeiros</span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto scrollbar-hide">
                <BarbersPanel onJoinSuccess={handleJoinSuccess} hasActiveTicket={!!myTicketId} />
              </div>
            </div>
          </aside>

          {/* CENTRO: O CORAÇÃO DA PÁGINA */}
          <section className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-5">
            {myTicketId && (
              <div className="max-w-md mx-auto w-full">
                <MyTicketCard ticketId={myTicketId} onLeave={handleLeaveQueue} />
              </div>
            )}

            {/* CARD CENTRAL DE ATENDIMENTO */}
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col min-h-[420px] relative overflow-hidden">
              <div className="text-center mb-5 z-10">
                <h2 className="text-lg font-bold uppercase tracking-tight text-foreground">
                  Atendimentos em Andamento
                </h2>
                <div className="h-0.5 w-10 bg-primary mx-auto mt-2 rounded-full" />
              </div>

              {/* ÁREA DO CARD (CADEIRA) - Centralização melhorada */}
              <div className="flex-1 w-full flex flex-col justify-center items-center z-10">
                <ActiveServicesDisplay />
              </div>

              {/* STATS (NA PARTE INFERIOR DO CARD) */}
              <div className="w-full mt-5 pt-5 border-t border-border z-10">
                <HeroStatsPanel />
              </div>

              {/* Efeito de Fundo Suave */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-primary/5 blur-[80px] pointer-events-none" />
            </div>
          </section>

          {/* DIREITA: Visão Geral */}
          <aside className="lg:col-span-3 order-3">
            <div className="bg-card/60 border border-border rounded-2xl overflow-hidden backdrop-blur-sm h-full flex flex-col">
              <div className="bg-muted/50 px-4 py-3 text-center border-b border-border">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Visão Geral</span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto scrollbar-hide">
                <QueueListPanel />
              </div>
            </div>
          </aside>
        </div>

        {/* RODAPÉ - Sem repetição de marca */}
        <footer className="mt-10 text-center text-muted-foreground/60 text-[10px] uppercase tracking-widest">
          Barbearia Brutos © {new Date().getFullYear()}
        </footer>
      </main>

      {/* ESTILOS GLOBAIS */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </div>
  );
};

export default QueuePage;
