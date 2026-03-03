const DeleteConfirm = ({ onConfirm, onCancel }) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h4>Are you sure you want to delete this task?</h4>

        <button onClick={onConfirm}>Yes, Delete</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modal: {
    background: "white",
    padding: "20px",
    width: "350px",
    margin: "200px auto",
  },
};

export default DeleteConfirm;
