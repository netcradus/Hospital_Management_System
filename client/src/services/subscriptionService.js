import api from "./api";

const unavailableFallback = {
  available: false,
  status: "unknown",
  planPrice: 1999,
};

const subscriptionService = {
  async getStatus() {
    try {
      const response = await api.get("/subscriptions/status");
      return {
        available: true,
        ...response.data.data,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return unavailableFallback;
      }

      throw error;
    }
  },

  async create(payload) {
    const response = await api.post("/subscriptions/create", payload);
    return response.data.data;
  },
};

export default subscriptionService;
