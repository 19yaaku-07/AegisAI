import { createContext, useContext } from 'react';
import type { ScanResult } from '../types';

interface ScanResultContextValue {
  result: ScanResult | null;
  setResult: (r: ScanResult | null) => void;
}

export const ScanResultContext = createContext<ScanResultContextValue>({
  result: null,
  setResult: () => {},
});

export function useScanResult() {
  return useContext(ScanResultContext);
}
