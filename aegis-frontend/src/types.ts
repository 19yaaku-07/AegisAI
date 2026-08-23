export type RiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface ScanResult {
  extracted_text: string;
  risk_level: RiskLevel;
  threat_category: string;
  explanation: string;
  recommendations: string[];
  scan_id?: string;
  timestamp?: string;
}

export interface ScanError {
  message: string;
  code?: string;
}

export interface ThreatEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  indicators: string[];
  risk_level: RiskLevel;
  examples: string[];
}
