import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { QueueHeader } from "@/components/queue/QueueHeader";
import { QueueStatus } from "@/components/queue/QueueStatus";
import { MyTicketCard } from "@/components/queue/MyTicketCard";
import { BarbersPanel } from "@/components/queue/BarbersPanel";
import { HeroStatsPanel } from "@/components/queue/HeroStatsPanel";
import { QueueListPanel } from "@/components/queue/QueueListPanel";
import { ActiveServicesDisplay } from "@/components/queue/ActiveServicesDisplay";
import { useQueueSettingsRealtime } from "@/hooks/useQueueRealtime";

const QueuePage = () => {
  const [isValidating, setIsValidating] = useState(false); // Ajustado para exemplo
  const [myTicketId, setMyTicketId] = useState<string | null>(null);

  useQueueSettingsRealtime();

  const handleLeave = () => {
    setMyTicketId(null);
  };

  const handleJoinSuccess = () => {
    // Lógica de atualização após entrar na fila
  };

  return (
    <div className="min-h-screen bg-background">
      <QueueHeader />

      <main className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 1. Título de Boas-Vindas */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="font-display text-3xl sm:text-5xl uppercase mb-2 tracking-wide">
              <span className="text-primary">Fila</span> Virtual
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              Escolha seu barbeiro e acompanhe seu atendimento em tempo real
            </p>
          </motion.div>

          {isValidating ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 size={32} className="text-primary animate-spin mb-3" />
              <p className="text-muted-foreground">Carregando fila...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 2. Ticket do Usuário (Destaque Central) */}
              {myTicketId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-xl mx-auto"
                >
                  <MyTicketCard ticketId={myTicketId} onLeave={handleLeave} />
                </motion.div>
              )}

              {/* 3. Grid Principal de Atendimentos */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* LADO ESQUERDO: Lista de Barbeiros (Desktop: Col 3) */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="lg:col-span-3 order-2 lg:order-1"
                >
                  <BarbersPanel onJoinSuccess={handleJoinSuccess} hasActiveTicket={!!myTicketId} />
                </motion.div>

                {/* CENTRO: "Atendimentos em Andamento" (Desktop: Col 6) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:col-span-6 order-1 lg:order-2"
                >
                  <div className="bg-card/50 border border-border rounded-2xl p-4 sm:p-6 h-full flex flex-col justify-center shadow-sm">
                    <div className="text-center mb-4">
                      <h2 className="text-lg font-semibold uppercase tracking-wider text-primary">
                        Atendimentos em Andamento
                      </h2>
                    </div>
                    {/* Aqui centralizamos o HeroStats ou o ActiveServices */}
                    <ActiveServicesDisplay />
                    <div className="mt-6">
                      <HeroStatsPanel />
                    </div>
                  </div>
                </motion.div>

                {/* LADO DIREITO: Próximos da Fila (Desktop: Col 3) */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="lg:col-span-3 order-3"
                >
                  <QueueListPanel />
                </motion.div>
              </div>

              {/* 4. Rodapé de Status */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="pt-4 border-t border-border/40"
              >
                <QueueStatus />
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default QueuePage;
