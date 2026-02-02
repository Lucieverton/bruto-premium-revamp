import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// Importações dos seus componentes
import { QueueHeader } from "@/components/queue/QueueHeader";
import { QueueStatus } from "@/components/queue/QueueStatus";
import { MyTicketCard } from "@/components/queue/MyTicketCard";
import { BarbersPanel } from "@/components/queue/BarbersPanel";
import { HeroStatsPanel } from "@/components/queue/HeroStatsPanel";
import { QueueListPanel } from "@/components/queue/QueueListPanel";
import { ActiveServicesDisplay } from "@/components/queue/ActiveServicesDisplay";
import { useQueueSettingsRealtime } from "@/hooks/useQueueRealtime";

// Adicione suas funções de hook/context aqui se necessário
// import { useQueue } from ...

const QueuePage = () => {
  // Estados (Mantendo a lógica que você já tinha)
  const [isValidating, setIsValidating] = useState(true);
  const [myTicketId, setMyTicketId] = useState<string | null>(null); // Exemplo de estado

  // Hooks de tempo real
  useQueueSettingsRealtime();

  // Simulação da validação inicial (substitua pela sua lógica real)
  useEffect(() => {
    const init = async () => {
      // Sua lógica de validação aqui...
      // const ticket = getMyTicket();
      // if (ticket) setMyTicketId(ticket.id);
      setTimeout(() => setIsValidating(false), 1000);
    };
    init();
  }, []);

  const handleJoinSuccess = () => {
    // Sua lógica de sucesso ao entrar na fila
    console.log("Entrou na fila");
  };

  const handleLeave = () => {
    setMyTicketId(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <QueueHeader />

      <main className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          {" "}
          {/* Aumentei a largura máxima para dar respiro no Desktop */}
          {/* Título / Hero Section */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="font-display text-3xl sm:text-5xl uppercase mb-2 tracking-wide">
              <span className="text-primary">Fila</span> Virtual
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">Acompanhe o atendimento em tempo real</p>
          </motion.div>
          {/* Loading State */}
          {isValidating ? (
            <div className="flex flex-col items-center justify-center p-12 h-[50vh]">
              <Loader2 size={40} className="text-primary animate-spin mb-4" />
              <p className="text-muted-foreground animate-pulse">Sincronizando fila...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Card do Usuário (Se tiver ticket, aparece com destaque total) */}
              {myTicketId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-xl mx-auto mb-8"
                >
                  <MyTicketCard ticketId={myTicketId} onLeave={handleLeave} />
                </motion.div>
              )}

              {/* GRID PRINCIPAL DO LAYOUT */}
              {/* Desktop: 3 colunas (Esquerda | Centro Maior | Direita) */}
              {/* Mobile: Coluna única vertical */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 1. LADO ESQUERDO: Lista de Barbeiros (Desktop: 3 colunas) */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-3 order-2 lg:order-1 h-full"
                >
                  {/* Container com altura definida para scroll interno se necessário */}
                  <div className="bg-card/50 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm sticky top-4">
                    <div className="p-4 border-b border-border/50">
                      <h3 className="font-semibold text-center uppercase text-sm tracking-wider">Barbeiros</h3>
                    </div>
                    <div className="p-2">
                      <BarbersPanel onJoinSuccess={handleJoinSuccess} hasActiveTicket={!!myTicketId} />
                    </div>
                  </div>
                </motion.div>

                {/* 2. CENTRO: Atendimentos em Andamento + Stats (Desktop: 6 colunas - O FOCO) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-6"
                >
                  {/* Container Principal Centralizado */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-lg min-h-[400px] flex flex-col">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold uppercase tracking-widest text-primary">Em Atendimento</h2>
                    </div>

                    {/* Aqui o ActiveServicesDisplay fica centralizado e grande */}
                    <div className="flex-1 flex items-center justify-center w-full">
                      <ActiveServicesDisplay />
                    </div>

                    {/* Stats logo abaixo do visualizador 3D */}
                    <div className="mt-8 pt-6 border-t border-border/50">
                      <HeroStatsPanel />
                    </div>
                  </div>
                </motion.div>

                {/* 3. LADO DIREITO: Lista da Fila (Desktop: 3 colunas) */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-3 order-3 h-full"
                >
                  <div className="bg-card/50 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm sticky top-4">
                    <div className="p-4 border-b border-border/50">
                      <h3 className="font-semibold text-center uppercase text-sm tracking-wider">Próximos</h3>
                    </div>
                    <div className="p-2">
                      <QueueListPanel />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Barra de Status Inferior (Opcional ou Footer) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
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
