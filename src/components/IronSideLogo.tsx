import React from 'react';

interface Props {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const IronSideLogo: React.FC<Props> = ({
  className = 'w-10 h-10',
  size,
  showText = false,
}) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={size ? { width: size, height: size } : undefined}>
      <img
        src="/ironside-logo.svg"
        alt="Iron Side Road Rider M.C."
        className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(234,179,8,0.3)]"
      />
    </div>
  );
};
