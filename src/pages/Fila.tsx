import React from "react";
import { motion } from "framer-motion";
import { QueueHeader } from "@/components/queue/QueueHeader";
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
        {/* TÍTULO PRINCIPAL */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-6xl uppercase tracking-tighter italic font-black">
            FILA <span className="text-primary">BRUTOS</span>
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] mt-2 font-bold">
            Acompanhamento em tempo real
          </p>
        </motion.div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ESQUERDA: Barbeiros */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="bg-white/5 p-3 text-center border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Barbeiros Disponíveis
                </span>
              </div>
              <div className="p-2 max-h-[70vh] overflow-y-auto scrollbar-hide">
                <div className="scale-[0.92] origin-top">
                  <BarbersPanel hasActiveTicket={!!myTicketId} />
                </div>
              </div>
            </div>
          </aside>

          {/* CENTRO: O CORAÇÃO DA PÁGINA */}
          <section className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-6">
            {myTicketId && (
              <div className="max-w-md mx-auto w-full">
                <MyTicketCard ticketId={myTicketId} />
              </div>
            )}

            {/* CARD CENTRAL DE ATENDIMENTO */}
            {/* Adicionei 'overflow-hidden' para cortar qualquer coisa vazando e p-8 para dar espaço ao texto */}
            <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-4 sm:p-8 shadow-2xl flex flex-col items-center min-h-[480px] relative overflow-hidden">
              <div className="text-center mb-6 z-10">
                <h2 className="text-xl font-bold uppercase tracking-tight text-white">Atendimentos em Andamento</h2>
                <div className="h-1 w-12 bg-primary mx-auto mt-2 rounded-full" />
              </div>

              {/* ÁREA DO CARD (CADEIRA) */}
              {/* O truque [&>*]:mx-auto força os filhos a se centralizarem */}
              <div className="flex-1 w-full flex flex-col justify-center items-center z-10 w-full max-w-full">
                <div className="w-full flex justify-center [&>*]:mx-auto [&_div]:max-w-full [&_p]:break-words [&_span]:break-words [&_span]:whitespace-normal">
                  <ActiveServicesDisplay />
                </div>
              </div>

              {/* STATS (NA PARTE INFERIOR DO CARD) */}
              <div className="w-full mt-6 pt-6 border-t border-white/5 z-10">
                <HeroStatsPanel />
              </div>

              {/* Efeito de Fundo Suave (Opcional) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-20 bg-primary/5 blur-[100px] pointer-events-none" />
            </div>
          </section>

          {/* DIREITA: Próximos */}
          <aside className="lg:col-span-3 order-3">
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="bg-white/5 p-3 text-center border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Visão Geral</span>
              </div>
              <div className="p-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
                <div className="scale-[0.95] origin-top">
                  <QueueListPanel />
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* RODAPÉ LIMPO - SEM 'FILA ABERTA' DUPLICADA */}
        <footer className="mt-8 text-center opacity-40 text-[10px] uppercase tracking-widest">
          Barbearia Brutos © 2024
        </footer>
      </main>

      {/* ESTILOS GLOBAIS DE CORREÇÃO */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Remove barras de rolagem feias */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* CORREÇÃO CRÍTICA PARA CENTRALIZAR O CARD ÚNICO */
        /* Força o grid interno do ActiveServicesDisplay a se comportar como flex center quando necessário */
        .grid-cols-1 { display: flex !important; justify-content: center !important; }
        
        /* CORREÇÃO DO TEXTO VAZANDO */
        /* Força quebra de linha em textos longos dentro dos alertas */
        .text-nowrap { white-space: normal !important; }
      `,
        }}
      />
    </div>
  );
};

export default QueuePage;
