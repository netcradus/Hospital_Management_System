import api from "./api";

const dashboardService = {
  async getAdminDashboard() {
    const response = await api.get("/dashboard/admin");
    return response.data.data;
  },
};

export default dashboardService;

