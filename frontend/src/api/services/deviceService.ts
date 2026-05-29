import type { Device } from '../../types/index';
import { isMockMode } from '../config';
import { request } from '../client';
import { MOCK_DEVICES } from '../mock/devicesMock';

export async function listDevices(): Promise<Device[]> {
  if (isMockMode()) {
    return MOCK_DEVICES.map((d) => ({ ...d }));
  }
  return request<Device[]>('/devices');
}
