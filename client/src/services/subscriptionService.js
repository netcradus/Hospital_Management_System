import api from "./api";

async function unwrap(promise) {
  const { data } = await promise;
  return data.data;
}

const subscriptionService = {
  getPlans() {
    return unwrap(api.get("/subscription/plans"));
  },
  getCurrent() {
    return unwrap(api.get("/subscription/current"));
  },
  getStatus() {
    return unwrap(api.get("/subscription/status"));
  },
  create(payload) {
    return unwrap(api.post("/subscription/create", payload));
  },
  renew(payload) {
    return unwrap(api.post("/subscription/renew", payload));
  },
};

export default subscriptionService;
