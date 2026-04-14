import api from "./api";

function unwrapResponse(response) {
  return response.data.data;
}

export function createEntityService(resource) {
  return {
    async list(params = {}) {
      const response = await api.get(`/${resource}`, { params });
      return unwrapResponse(response);
    },
    async getById(id) {
      const response = await api.get(`/${resource}/${id}`);
      return unwrapResponse(response);
    },
    async create(payload) {
      const response = await api.post(`/${resource}`, payload);
      return unwrapResponse(response);
    },
    async update(id, payload) {
      const response = await api.put(`/${resource}/${id}`, payload);
      return unwrapResponse(response);
    },
    async remove(id) {
      const response = await api.delete(`/${resource}/${id}`);
      return unwrapResponse(response);
    },
  };
}

