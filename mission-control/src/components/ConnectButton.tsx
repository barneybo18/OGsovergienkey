'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export const ConnectButtonCustom = () => {
  return (
    <div className="flex items-center justify-center">
      <ConnectButton 
        showBalance={false}
        accountStatus="address"
        chainStatus="icon"
      />
    </div>
  );
};
