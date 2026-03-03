const AssetTable = ({ assets, onEdit, onDelete, onTransaction }) => {
    return (
        <table className="asset-table">
            <thead>
                <tr>
                    <th>Asset Tag</th>
                    <th>Name / Model</th>
                    <th>Serial No</th>
                    <th>Status</th>
                    <th>Condition</th>
                    <th>Location</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {assets.map((asset) => (
                    <tr key={asset.asset_id}>
                        <td>{asset.asset_tag}</td>
                        <td>{asset.brand} {asset.model}</td>
                        <td>{asset.serial_number || "-"}</td>
                        <td>{asset.status}</td>
                        <td>{asset.condition_status}</td>
                        <td>{asset.location || "-"}</td>
                        <td className="actions" style={styles.actions}>
                            <button onClick={() => onEdit(asset)}>Edit</button>
                            <button onClick={() => onDelete(asset.asset_id)}>Delete</button>
                            <button onClick={() => onTransaction(asset)}>Manage</button>
                        </td>
                    </tr>
                ))}
                {assets.length === 0 && (
                    <tr>
                        <td colSpan="7" style={{ textAlign: "center", padding: "10px" }}>
                            No assets found
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

const styles = {
    actions: {
        display: "flex",
        gap: "10px",
    },
};

export default AssetTable;
