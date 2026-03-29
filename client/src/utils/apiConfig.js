// Centralize API Base URL for easier production/local environment switching
export const API_BASE_URL = import.meta.env.PROD 
  ? "https://api-node-microbiz-copilot.onrender.com" 
  : "http://localhost:5000";
