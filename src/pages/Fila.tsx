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
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden selection:bg-primary/30">
      <QueueHeader />

      <main className="py-4 px-4 lg:px-6 max-w-[1600px] mx-auto">
        {/* TÍTULO ÚNICO NO TOPO */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-6xl uppercase tracking-tighter italic font-black">
            FILA <span className="text-primary">BRUTOS</span>
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] mt-1">Sua vez com estilo</p>
        </motion.div>

        {/* GRID DE 3 COLUNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUNA ESQUERDA: BARBEIROS */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="bg-white/5 p-3 text-center border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Barbeiros Disponíveis
                </span>
              </div>
              {/* Ocultando a barra de scroll aqui */}
              <div className="p-2 max-h-[70vh] overflow-y-auto scrollbar-hide">
                <div className="scale-[0.9] origin-top">
                  <BarbersPanel hasActiveTicket={!!myTicketId} />
                </div>
              </div>
            </div>
          </aside>

          {/* COLUNA CENTRAL: ATENDIMENTO EM DESTAQUE */}
          <section className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-6">
            {myTicketId && (
              <div className="max-w-md mx-auto w-full">
                <MyTicketCard ticketId={myTicketId} />
              </div>
            )}

            {/* CARD CENTRAL ÚNICO */}
            <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-6 sm:p-10 shadow-2xl flex flex-col items-center min-h-[450px]">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Atendimentos em Andamento</h2>
                <div className="h-1 w-12 bg-primary mx-auto mt-2 rounded-full" />
              </div>

              {/* CONTAINER DE CENTRALIZAÇÃO FORÇADA */}
              <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                <div className="w-full flex justify-center">
                  {/* Se o componente ActiveServicesDisplay tiver um grid fixo internamente, 
                      este wrapper flex ajudará a manter o conteúdo no meio. */}
                  <ActiveServicesDisplay />
                </div>
              </div>

              {/* STATS NA BASE DO CARD (HERO STATS) */}
              <div className="w-full mt-8 pt-8 border-t border-white/5">
                <HeroStatsPanel />
              </div>
            </div>
          </section>

          {/* COLUNA DIREITA: PRÓXIMOS */}
          <aside className="lg:col-span-3 order-3">
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="bg-white/5 p-3 text-center border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Próximos da Fila</span>
              </div>
              <div className="p-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
                <div className="scale-[0.95] origin-top">
                  <QueueListPanel />
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* RODAPÉ DE STATUS ÚNICO */}
        <footer className="mt-8 flex justify-center">
          <QueueStatus />
        </footer>
      </main>

      {/* ESTILO PARA OCULTAR SCROLLBARS */}
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
