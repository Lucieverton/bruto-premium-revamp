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
            'bg-gradient-to-r from-primary via-primary/90 to-primary',
            'hover:from-primary/90 hover:via-primary hover:to-primary/90',
            'shadow-lg hover:shadow-xl hover:shadow-primary/20',
            'transition-all duration-500 ease-out',
            'px-8 py-6 text-lg font-bold',
            'rounded-xl border border-primary/20'
          )}
        >
          {/* Background animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          
          {/* Icon container with animation */}
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <Scissors 
                className={cn(
                  'w-6 h-6 transition-all duration-500',
                  'group-hover:rotate-[360deg] group-hover:scale-110'
                )} 
              />
              <Sparkles 
                className={cn(
                  'absolute -top-1 -right-1 w-3 h-3',
                  'text-yellow-300 opacity-0',
                  'group-hover:opacity-100 group-hover:animate-pulse',
                  'transition-opacity duration-300'
                )} 
              />
            </div>
            
            <span className="relative">
              Entrar na Fila
            </span>
            
            <Plus 
              className={cn(
                'w-5 h-5 transition-all duration-300',
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
