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
  const myTicketId = null;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 overflow-x-hidden">
      <QueueHeader />

      <main className="py-2 sm:py-4 px-4 lg:px-6 max-w-[1600px] mx-auto">
        {/* Título mais integrado e menos espaçoso */}
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl md:text-5xl uppercase tracking-tighter italic font-black text-white">
            FILA <span className="text-primary">BRUTOS</span>
          </h1>
        </div>

        {/* Grid Principal: 2.5 | 7 | 2.5 (Dando mais destaque ao centro) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LADO ESQUERDO: Barbeiros (Mais estreito e compacto) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 xl:col-span-2 order-2 lg:order-1"
          >
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
              <div className="bg-white/5 p-2 text-center border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Barbeiros</span>
              </div>
              <div className="p-1 scale-[0.9] origin-top">
                {" "}
                {/* Redução de escala para evitar scroll */}
                <BarbersPanel hasActiveTicket={!!myTicketId} />
              </div>
            </div>
          </motion.div>

          {/* CENTRO: Atendimentos em Andamento (Ouro da página) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-6 xl:col-span-8 order-1 lg:order-2 flex flex-col gap-4"
          >
            {myTicketId && (
              <div className="max-w-md mx-auto w-full mb-2">
                <MyTicketCard ticketId={myTicketId} />
              </div>
            )}

            {/* Card de Status Centralizado */}
            <div className="bg-zinc-900 border border-primary/20 rounded-3xl p-4 sm:p-8 shadow-[0_0_40px_-15px_rgba(234,179,8,0.2)] flex flex-col min-h-[400px]">
              <div className="text-center mb-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-primary">Atendimentos em Andamento</h2>
                <div className="h-[1px] w-24 bg-primary/30 mx-auto mt-2" />
              </div>

              {/* Aqui o ActiveServicesDisplay vai se comportar: 
                  Se for 1 pessoa, o flex-center coloca no meio. */}
              <div className="flex-1 flex flex-col items-center justify-center w-full">
                <div className="w-full flex justify-center items-center py-2">
                  <ActiveServicesDisplay />
                </div>
              </div>

              {/* Rodapé do Card com Stats Compactos */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <HeroStatsPanel />
              </div>
            </div>
          </motion.div>

          {/* LADO DIREITO: Fila (Mais estreito) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 xl:col-span-2 order-3"
          >
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
              <div className="bg-white/5 p-2 text-center border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Próximos</span>
              </div>
              <div className="p-2 scale-[0.9] origin-top">
                <QueueListPanel />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Status Bar Inferior (Reduzido) */}
        <div className="mt-6 opacity-60 hover:opacity-100 transition-opacity">
          <QueueStatus />
        </div>
      </main>
    </div>
  );
};

export default QueuePage;
