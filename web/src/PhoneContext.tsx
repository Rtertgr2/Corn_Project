// web/src/PhoneContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

const PhoneCtx = createContext<{ phone: string; setPhone: (p: string) => void }>({
  phone: '',
  setPhone: () => {},
});

export function PhoneProvider({ children }: { children: ReactNode }) {
  const [phone, setPhone] = useState('');
  return <PhoneCtx.Provider value={{ phone, setPhone }}>{children}</PhoneCtx.Provider>;
}

export const usePhone = () => useContext(PhoneCtx);
