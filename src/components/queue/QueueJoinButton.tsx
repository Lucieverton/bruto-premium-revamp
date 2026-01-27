import { useState } from 'react';
import { Scissors, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { QueueJoinForm } from './QueueJoinForm';
import { cn } from '@/lib/utils';

interface QueueJoinButtonProps {
  onSuccess: () => void;
}

export const QueueJoinButton = ({ onSuccess }: QueueJoinButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSuccess = () => {
    setIsOpen(false);
    onSuccess();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className={cn(
            'group relative overflow-hidden',
            'bg-gradient-to-br from-[#e8e8e8] via-[#c0c0c0] to-[#a8a8a8]',
            'text-gray-900 font-bold',
            'shadow-[0_0_25px_rgba(192,192,192,0.5),0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]',
            'hover:shadow-[0_0_35px_rgba(220,220,220,0.7),0_6px_25px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]',
            'transition-all duration-500 ease-out',
            'px-8 py-6 text-lg',
            'rounded-xl border border-white/40',
            'hover:-translate-y-1'
          )}
        >
          {/* Chrome shine sweep effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          
          {/* Top highlight */}
          <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-xl pointer-events-none" />
          
          {/* Icon container with animation */}
          <div className="relative flex items-center gap-3 z-10">
            <div className="relative">
              <Scissors 
                className={cn(
                  'w-6 h-6 transition-all duration-500 drop-shadow-sm',
                  'group-hover:rotate-[360deg] group-hover:scale-110'
                )} 
              />
              <Sparkles 
                className={cn(
                  'absolute -top-1 -right-1 w-3 h-3',
                  'text-gray-600 opacity-0',
                  'group-hover:opacity-100 group-hover:animate-pulse',
                  'transition-opacity duration-300'
                )} 
              />
            </div>
            
            <span className="relative drop-shadow-sm">
              Entrar na Fila
            </span>
            
            <Plus 
              className={cn(
                'w-5 h-5 transition-all duration-300 drop-shadow-sm',
                'group-hover:rotate-90 group-hover:scale-125'
              )} 
            />
          </div>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Scissors className="w-5 h-5 text-primary" />
            Entrar na Fila Virtual
          </SheetTitle>
        </SheetHeader>
        
        <QueueJoinForm onSuccess={handleSuccess} />
      </SheetContent>
    </Sheet>
  );
};
