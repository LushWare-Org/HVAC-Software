import { useQuery, useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import api from '../lib/api';

/**
 * Sensor Reading Interface (11 fields + equipment_id)
 * Matches ML model input schema
 */
export interface SensorReading {
  equipment_id: string;
  outdoor_temp: number;
  return_air_temp: number;
  supply_air_temp: number;
  suction_pressure: number;
  discharge_pressure: number;
  suction_temp: number;
  discharge_temp: number;
  compressor_amps: number;
  vibration: number;
  filter_dp: number;
  fan_speed: number;
}

/**
 * ML Prediction Result from FastAPI /predict endpoint
 */
export interface MLPredictionResult {
  equipment_id: string;
  timestamp: string;
  predicted_fault: string;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  contributing_factors: string;
  recommended_action: string;
}

/**
 * Hook: Get ML prediction for sensor reading
 * Calls: POST /api/ml/predict
 * Via: Nginx gateway (routes to ml-backend:8000)
 */
export function usePrediction(sensorData: SensorReading | null) {
  return useQuery<MLPredictionResult>({
    queryKey: ['ml-prediction', sensorData?.equipment_id],
    queryFn: async () => {
      if (!sensorData) throw new Error('No sensor data provided');
      
      const response = await api.post('/ml/predict', sensorData);
      return response.data;
    },
    enabled: !!sensorData,
    staleTime: 30000, // Cache for 30 seconds
    retry: 1,
  });
}

/**
 * Hook: Mutation to get prediction (useful for manual triggers)
 * Returns: useMutation hook for imperative prediction calls
 */
export function usePredictionMutation(): UseMutationResult<
  MLPredictionResult,
  Error,
  SensorReading
> {
  return useMutation({
    mutationFn: async (sensorData: SensorReading) => {
      const response = await api.post('/ml/predict', sensorData);
      return response.data;
    },
  });
}

/**
 * Hook: Get ML health status
 * Calls: GET /api/ml/health
 * Useful for: Checking if ML backend is running before attempting predictions
 */
export function useMLHealth() {
  return useQuery<{ status: string; model_loaded: boolean }>({
    queryKey: ['ml-health'],
    queryFn: async () => {
      const response = await api.get('/ml/health');
      return response.data;
    },
    staleTime: 60000, // Cache for 1 minute
    retry: 2,
  });
}

/**
 * Helper: Convert fault prediction to alert severity
 */
export function getPredictionSeverity(
  confidence: number,
  faultType: string
): 'critical' | 'high' | 'medium' | 'low' {
  if (faultType === 'Normal') return 'low';
  if (confidence > 0.9) return 'critical';
  if (confidence > 0.8) return 'high';
  if (confidence > 0.6) return 'medium';
  return 'low';
}

/**
 * Helper: Convert fault string to days-to-failure estimate
 * Based on fault type and confidence
 */
export function estimateDaysToFailure(
  confidence: number,
  faultType: string
): number {
  const baseMap: Record<string, number> = {
    'Normal': 365,
    'Compressor Overheating': 30,
    'Refrigerant Leak': 45,
    'Condenser Fan Failure': 38,
    'Filter Clog': 14,
  };

  const baseDays = baseMap[faultType] || 30;
  // Higher confidence = sooner failure
  return Math.max(1, Math.round(baseDays * (1 - confidence * 0.5)));
}
