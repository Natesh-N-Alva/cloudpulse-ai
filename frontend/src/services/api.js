import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const fetchMonitoringLogs = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/logs`);
    return response.data.logs || [];
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
};

export const diagnoseIncident = async (query) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/diagnose`, { query });
    return response.data.diagnosis;
  } catch (error) {
    console.error("Error diagnosing incident:", error);
    return "Failed to connect to CloudPulse AI backend.";
  }
};