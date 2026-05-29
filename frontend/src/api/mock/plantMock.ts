import type { PlantOverview } from '../../types/index';

export const MOCK_PLANT_OVERVIEW: PlantOverview = {
  id: 'plant-main',
  name: '智慧水厂主站',
  status: 'normal',
  waterQuality: {
    turbidity: 0.04,
    ph: 7.2,
    residualChlorine: 0.5,
  },
  activeAlertCount: 0,
  updatedAt: new Date().toISOString(),
};
