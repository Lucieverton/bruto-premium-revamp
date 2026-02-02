import React from "react";
import { motion } from "framer-motion";
import { QueueHeader } from "@/components/queue/QueueHeader";
import { QueueStatus } from "@/components/queue/QueueStatus";
import { MyTicketCard } from "@/components/queue/MyTicketCard";
import { BarbersPanel } from "@/components/queue/BarbersPanel";
import { HeroStatsPanel } from "@/components/queue/HeroStatsPanel";
import { QueueListPanel } from "@/components/queue/QueueListPanel";
import { ActiveServicesDisplay } from "@/components/queue/ActiveServicesDisplay";

const QueuePage = () => {
  // Simulação de estado (mantenha sua lógica de ticket aqui)
  const myTicketId = null;

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <QueueHeader />

      <main className="py-2 sm:py-6 px-4 lg:px-8 max-w-[1500px] mx-auto">
        {/* HEADER ÚNICO: Removido repetições de "Fila Virtual" */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-10"
        >
          <h1 className="font-display text-4xl md:text-6xl uppercase tracking-tighter italic font-black">
            FILA <span className="text-primary">BRUTOS</span>
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] mt-2 font-medium">
            Sua vez com estilo • Tempo real
          </p>
        </motion.div>

        {/* GRID PRINCIPAL: Ajustado para proporção 3-6-3 no Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUNA ESQUERDA: Barbeiros (Compacto e sem scrollbar visível) */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
              <div className="bg-white/5 p-3 text-center border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Barbeiros</span>
              </div>
              <div className="p-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
                <div className="scale-[0.9] origin-top">
                  <BarbersPanel hasActiveTicket={!!myTicketId} />
                </div>
              </div>
            </div>
          </aside>

          {/* COLUNA CENTRAL: Onde estava o "buraco" e as repetições */}
          <section className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-6">
            {myTicketId && (
              <div className="max-w-md mx-auto w-full">
                <MyTicketCard ticketId={myTicketId} />
              </div>
            )}

            {/* CARD CENTRAL: Removido textos internos redundantes */}
            <div className="bg-zinc-900/80 border border-primary/20 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] flex flex-col items-center min-h-[400px]">
              <div className="text-center mb-8">
                <h2 className="text-lg font-bold uppercase tracking-widest text-white">Atendimentos em Andamento</h2>
                <div className="h-0.5 w-16 bg-primary mx-auto mt-2 rounded-full opacity-50" />
              </div>

              {/* CENTRALIZAÇÃO FORÇADA: Se houver 1 atendimento, ele ficará no meio exato */}
              <div className="flex-1 w-full flex items-center justify-center">
                <div className="w-full flex justify-center items-center overflow-visible">
                  <ActiveServicesDisplay />
                </div>
              </div>

              {/* HERO STATS: Colocado na base para equilibrar o visual */}
              <div className="w-full mt-8 pt-8 border-t border-white/5">
                <HeroStatsPanel />
              </div>
            </div>
          </section>

          {/* COLUNA DIREITA: Fila (Compacto) */}
          <aside className="lg:col-span-3 order-3">
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
              <div className="bg-white/5 p-3 text-center border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Próximos da Fila</span>
              </div>
              <div className="p-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
                <div className="scale-[0.95] origin-top">
                  <QueueListPanel />
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* STATUS FINAL */}
        <footer className="mt-10 flex justify-center opacity-60">
          <QueueStatus />
        </footer>
      </main>

      {/* CSS GLOBAL PARA LIMPAR O VISUAL */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Ajuste fino para o componente de cadeira quando estiver sozinho */
        .flex-1 > div > div {
          margin-left: auto !important;
          margin-right: auto !important;
          display: flex !important;
          justify-content: center !important;
        }
      `,
        }}
      />
    </div>
  );
};

export default QueuePage;
