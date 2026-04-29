import Button from "./Button";
import Modal from "./Modal";

function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm" }) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="md">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
