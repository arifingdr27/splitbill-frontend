import axios from 'axios';
import { API_BASE_URL, authHeaders, setToken } from './client';

export async function loginWithGoogleIdToken(idToken) {
  const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/google`, {
    id_token: idToken,
  });
  if (data?.token) {
    setToken(data.token);
  }
  return data;
}

export async function fetchQuota() {
  const { data } = await axios.get(`${API_BASE_URL}/api/v1/me/quota`, {
    headers: {
      ...authHeaders(),
    },
  });
  return data;
}
