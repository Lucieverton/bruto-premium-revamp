// Notification utilities for queue system
import { showSWNotification } from '@/lib/pwa';

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

export const showPushNotification = async (title: string, body: string) => {
  // Use Service Worker notification for background support
  await showSWNotification(title, {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    requireInteraction: true,
    vibrate: [200, 100, 200],
  });
  vibrateDevice();
};

// Generic function to send notifications with options
export const sendNotification = async (title: string, options?: { body?: string; tag?: string }) => {
  await showSWNotification(title, {
    body: options?.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: options?.tag,
    requireInteraction: true,
    vibrate: [200, 100, 200],
  });
  playNotificationSound();
  vibrateDevice();
};

export const notifyUserCalled = async (ticketNumber: string) => {
  playNotificationSound();
  vibrateDevice();
  await showPushNotification(
    '🎉 É sua vez!',
    `Ticket ${ticketNumber} - Dirija-se ao balcão!`
  );
};
