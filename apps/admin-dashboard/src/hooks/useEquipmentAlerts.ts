import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

/**
 * Alert object - combines ML prediction with equipment metadata
 * Predictions come from MQTT Consumer → ML Backend → Database
 */
export interface Alert {
  id: string | number;
  equipment_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: Date | string;
  predicted_fault: string;
  confidence: number;
  days_to_failure: number;
  contributing_factors: string;
  recommended_action: string;
  equipment: {
    brand: string;
    model: string;
    serial_number: string;
    location_name: string;
    city: string;
    customer_name: string;
  };
}

/**
 * Hook: Fetch latest predictions for all equipment
 * Data pipeline: IoT Sensors → MQTT → MQTT Consumer → ML API → Database → Frontend
 * Only fetches REAL ML predictions from the database, NO MOCKS
 */
export function useEquipmentAlerts(companyId: string | null) {
  return useQuery<Alert[], Error, Alert[]>({
    queryKey: ['equipment-alerts', companyId],
    queryFn: async () => {
      // Fetch real ML predictions from database via API
      // Do NOT filter by company_id - get all predictions from the system
      try {
        const response = await apiClient.get(`/ml/predictions/all`, {
          params: { limit: 500 }, // Fetch more to ensure we get all
        });

        // Ensure we always get an array
        let predictions = response.data;
        if (!Array.isArray(predictions)) {
          predictions = [];
        }

        if (predictions.length === 0) {
          console.log('⚠️ No predictions available yet. Ensure MQTT Consumer is running and sensors are sending data.');
        } else {
          console.log(`✅ Loaded ${predictions.length} real ML-based predictions from backend`);
        }

        return predictions;
      } catch (error) {
        console.error('❌ Error fetching predictions:', error);
        throw error;
      }
    },
    enabled: true, // Always enabled - don't depend on companyId
    staleTime: 15000, // Cache for 15 seconds (ML predictions update periodically)
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    retry: 1,
  });
}

/**
 * Hook: Get specific equipment metadata from CRM
 */
export function useEquipment(companyId: string | null, equipment_id: string | null) {
  return useQuery({
    queryKey: ['equipment', companyId, equipment_id],
    queryFn: async () => {
      if (!companyId) throw new Error('User company ID not found');
      if (!equipment_id) throw new Error('No equipment ID');

      const response = await apiClient.get(
        `/crm/customers/${companyId}/equipment/${equipment_id}`
      );
      return response.data;
    },
    enabled: !!companyId && !!equipment_id,
  });
}
