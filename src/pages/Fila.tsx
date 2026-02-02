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
  // Mantenha seus hooks de estado e realtime aqui
  const myTicketId = null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 overflow-x-hidden">
      <QueueHeader />

      <main className="py-2 sm:py-6 px-4 lg:px-8 max-w-[1600px] mx-auto">
        {/* Header Compacto */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="font-display text-3xl md:text-5xl uppercase tracking-tighter italic font-black">
            FILA <span className="text-primary">BRUTOS</span>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
            Gestão de Atendimento em Tempo Real
          </p>
        </motion.div>

        {/* Grid Principal - Ajustado para evitar scroll */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          {/* ESQUERDA: Barbeiros (Compacto) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 order-2 lg:order-1"
          >
            <div className="bg-card/20 border border-white/5 rounded-xl overflow-hidden backdrop-blur-md">
              <div className="bg-white/5 p-2 border-b border-white/5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-center text-slate-400">
                  Barbeiros Disponíveis
                </h3>
              </div>
              {/* Aplicando escala menor para evitar scroll lateral/vertical */}
              <div className="p-2 max-h-[70vh] overflow-y-auto scrollbar-hide scale-[0.95] origin-top">
                <BarbersPanel hasActiveTicket={!!myTicketId} />
              </div>
            </div>
          </motion.div>

          {/* CENTRO: Atendimentos em Andamento (O Coração) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-4"
          >
            {/* Card do Usuário (se ativo) */}
            {myTicketId && (
              <div className="max-w-md mx-auto w-full">
                <MyTicketCard ticketId={myTicketId} />
              </div>
            )}

            {/* Container Central de Atendimento */}
            <div className="bg-gradient-to-b from-card/80 to-[#0a0a0a] border border-primary/30 rounded-3xl p-6 shadow-[0_0_50px_-12px_rgba(234,179,8,0.15)] relative min-h-[480px] flex flex-col items-center">
              {/* Título Interno */}
              <div className="text-center mb-8">
                <span className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-primary/20">
                  Painel de Monitoramento
                </span>
                <h2 className="text-xl font-bold uppercase mt-3 tracking-tight">Atendimentos em Andamento</h2>
              </div>

              {/* Área Central: Onde a mágica do alinhamento acontece */}
              <div className="flex-1 w-full flex flex-col items-center justify-center">
                <div className="w-full transform transition-all duration-500 ease-in-out flex justify-center">
                  {/* O ActiveServicesDisplay dentro de um flex-center garante que se houver só 1, ele fique no meio */}
                  <ActiveServicesDisplay />
                </div>
              </div>

              {/* Stats na Base */}
              <div className="w-full mt-6 pt-6 border-t border-white/5">
                <HeroStatsPanel />
              </div>
            </div>
          </motion.div>

          {/* DIREITA: Fila (Compacto) */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3 order-3">
            <div className="bg-card/20 border border-white/5 rounded-xl overflow-hidden backdrop-blur-md">
              <div className="bg-white/5 p-2 border-b border-white/5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-center text-slate-400">
                  Próximos da Fila
                </h3>
              </div>
              <div className="p-3 scale-[0.95] origin-top">
                <QueueListPanel />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Rodapé Status */}
        <footer className="mt-6 opacity-80">
          <QueueStatus />
        </footer>
      </main>
    </div>
  );
};

export default QueuePage;
