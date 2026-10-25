import axios from 'axios';
import { API_BASE_URL, authHeaders } from './client';

export async function createShare(snapshot) {
  const { data } = await axios.post(`${API_BASE_URL}/api/v1/shares`, snapshot, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });
  return data;
}

export async function getShare(shareId) {
  const { data } = await axios.get(
    `${API_BASE_URL}/api/v1/shares/${encodeURIComponent(shareId)}`
  );
  return data;
}
