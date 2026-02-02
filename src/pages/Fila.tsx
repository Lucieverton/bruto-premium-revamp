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
  // Simulação de estado (mantenha sua lógica original aqui)
  const myTicketId = null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <QueueHeader />

      <main className="py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Header Minimalista para evitar repetição */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <h1 className="font-display text-4xl md:text-6xl uppercase tracking-tighter italic">
              FILA <span className="text-primary">BRUTOS</span>
            </h1>
            <p className="text-muted-foreground text-sm uppercase tracking-[0.2em] mt-2">
              Acompanhamento em tempo real
            </p>
          </motion.div>

          {/* Grid Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
            {/* ESQUERDA: Barbeiros (3 colunas) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3 order-2 lg:order-1 h-full"
            >
              <div className="bg-card/30 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="bg-secondary/50 p-3 border-b border-border/50">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-center">Barbeiros Disponíveis</h3>
                </div>
                <div className="p-2">
                  <BarbersPanel hasActiveTicket={!!myTicketId} />
                </div>
              </div>
            </motion.div>

            {/* CENTRO: O Coração da Página (6 colunas) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-6"
            >
              {/* Card do Usuário (se existir) */}
              {myTicketId && <MyTicketCard ticketId={myTicketId} />}

              {/* Painel de Atendimento Centralizado */}
              <div className="bg-gradient-to-b from-card to-background border border-primary/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/30" />

                <div className="text-center space-y-2 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Status Atual</span>
                  <h2 className="text-xl font-bold uppercase">Atendimentos em Andamento</h2>
                </div>

                {/* Área da Cadeira e Nome do Cliente */}
                <div className="flex-1 flex items-center justify-center py-4">
                  <ActiveServicesDisplay />
                </div>

                {/* Stats no Rodapé do Card Central */}
                <div className="mt-4 pt-6 border-t border-border/50">
                  <HeroStatsPanel />
                </div>
              </div>
            </motion.div>

            {/* DIREITA: Visão Geral (3 colunas) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3 order-3 h-full"
            >
              <div className="bg-card/30 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm h-full">
                <div className="bg-secondary/50 p-3 border-b border-border/50">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-center">Visão Geral da Fila</h3>
                </div>
                <div className="p-4">
                  <QueueListPanel />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Barra de Status Inferior */}
          <footer className="mt-8">
            <QueueStatus />
          </footer>
        </div>
      </main>
    </div>
  );
};

export default QueuePage;
