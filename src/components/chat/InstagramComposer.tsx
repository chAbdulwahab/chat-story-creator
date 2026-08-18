import React from 'react';
import { ChatTheme } from '@/types/project';

interface InstagramComposerProps {
  theme?: ChatTheme;
  placeholder?: string;
  isKeyboardOpen?: boolean;
}

export const InstagramComposer: React.FC<InstagramComposerProps> = ({
  theme = 'instagram-dark',
  placeholder = '@unsunikahaniyn',
  isKeyboardOpen = true,
}) => {
  const isDark = theme === 'instagram-dark';
  const keyboardSrc = isDark
    ? '/assets/composer_keyboard_footer.png'
    : '/assets/composer_keyboard_footer.png';

  return (
    <div className={`w-full shrink-0 z-20 select-none overflow-hidden ${isDark ? 'bg-black' : 'bg-white'}`}>
      <img
        src={keyboardSrc}
        alt="Android Gboard Message Bar and Keyboard"
        className="w-full h-auto object-contain block select-none pointer-events-none"
      />
    </div>
  );
};
