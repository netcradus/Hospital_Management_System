import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function useCrudResource(service, resourceLabel) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await service.list({ limit: 100 });
      setItems(data.items ?? []);
      setPagination(data.pagination ?? null);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to load ${resourceLabel.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const createItem = async (payload) => {
    setIsSubmitting(true);
    try {
      await service.create(payload);
      toast.success(`${resourceLabel} created`);
      await loadItems();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to create ${resourceLabel.toLowerCase()}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateItem = async (id, payload) => {
    setIsSubmitting(true);
    try {
      await service.update(id, payload);
      toast.success(`${resourceLabel} updated`);
      await loadItems();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to update ${resourceLabel.toLowerCase()}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (id) => {
    setIsSubmitting(true);
    try {
      await service.remove(id);
      toast.success(`${resourceLabel} deleted`);
      await loadItems();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to delete ${resourceLabel.toLowerCase()}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    items,
    pagination,
    isLoading,
    isSubmitting,
    reload: loadItems,
    createItem,
    updateItem,
    deleteItem,
  };
}

