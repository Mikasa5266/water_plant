import type { PlantOverview } from '../../types/index';
import { isMockMode } from '../config';
import { request } from '../client';
import { MOCK_PLANT_OVERVIEW } from '../mock/plantMock';

export async function getPlantOverview(): Promise<PlantOverview> {
  if (isMockMode()) {
    return { ...MOCK_PLANT_OVERVIEW, updatedAt: new Date().toISOString() };
  }
  return request<PlantOverview>('/plant/overview');
}
