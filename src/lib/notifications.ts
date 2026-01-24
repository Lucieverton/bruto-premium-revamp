// Notification utilities for queue system

export const playNotificationSound = () => {
  const audio = new Audio('/notification.mp3');
  audio.volume = 0.7;
  audio.play().catch(() => {
    // Fallback: use Web Audio API for a beep
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  });
};

export const vibrateDevice = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const showPushNotification = (title: string, body: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true,
    });
    vibrateDevice();
  }
};

// Generic function to send notifications with options
export const sendNotification = (title: string, options?: { body?: string; tag?: string }) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: options?.body || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: options?.tag,
      requireInteraction: true,
    });
    playNotificationSound();
    vibrateDevice();
  }
};

export const notifyUserCalled = (ticketNumber: string) => {
  playNotificationSound();
  vibrateDevice();
  showPushNotification(
    '🎉 É sua vez!',
    `Ticket ${ticketNumber} - Dirija-se ao balcão!`
  );
};
