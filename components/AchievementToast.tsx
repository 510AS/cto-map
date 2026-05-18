'use client';

import { useEffect, useState } from 'react';

interface AchievementToastProps {
  name: string;
  icon: string;
  onDismiss: () => void;
}

export default function AchievementToast({ name, icon, onDismiss }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl shadow-xl animate-bounce-in">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs font-medium opacity-90">Achievement Unlocked!</p>
          <p className="text-sm font-bold">{name}</p>
        </div>
      </div>
    </div>
  );
}
