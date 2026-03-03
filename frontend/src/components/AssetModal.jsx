import { useState, useEffect } from "react";
import { getCategories } from "../api";

const AssetModal = ({ close, onSave, asset }) => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        asset_tag: "",
        category_id: "",
        brand: "",
        model: "",
        serial_number: "",
        configuration: "",
        purchase_date: "",
        purchase_cost: 0,
        depreciation_years: 3,
        warranty_expiry: "",
        location: "",
        condition_status: "New",
        status: "Available",
    });

    useEffect(() => {
        getCategories()
            .then(data => {
                setCategories(data);
                if (!asset && data.length > 0) {
                    setFormData(prev => ({ ...prev, category_id: data[0].category_id }));
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (asset) {
            setFormData({
                asset_tag: asset.asset_tag || "",
                category_id: asset.category_id || (categories.length > 0 ? categories[0].category_id : ""),
                brand: asset.brand || "",
                model: asset.model || "",
                serial_number: asset.serial_number || "",
                configuration: asset.configuration || "",
                purchase_date: asset.purchase_date ? asset.purchase_date.split("T")[0] : "",
                purchase_cost: asset.purchase_cost || 0,
                depreciation_years: asset.depreciation_years || 3,
                warranty_expiry: asset.warranty_expiry ? asset.warranty_expiry.split("T")[0] : "",
                location: asset.location || "",
                condition_status: asset.condition_status || "New",
                status: asset.status || "Available",
            });
        }
    }, [asset, categories]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            serial_number: formData.serial_number === "" ? null : formData.serial_number,
            brand: formData.brand === "" ? null : formData.brand,
            model: formData.model === "" ? null : formData.model,
            configuration: formData.configuration === "" ? null : formData.configuration,
            purchase_date: formData.purchase_date === "" ? null : formData.purchase_date,
            warranty_expiry: formData.warranty_expiry === "" ? null : formData.warranty_expiry,
            location: formData.location === "" ? null : formData.location,
            purchase_cost: formData.purchase_cost || 0,
            depreciation_years: formData.depreciation_years || 0,
            category_id: parseInt(formData.category_id) || (categories.length > 0 ? categories[0].category_id : 1)
        };

        onSave(payload);
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3>{asset ? "Edit Asset" : "Create Asset"}</h3>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <input
                            placeholder="Asset Tag (e.g., LPT-001)"
                            value={formData.asset_tag}
                            onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                            required
                            style={{ ...styles.input, flex: 1 }}
                        />
                        <select
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            required
                            style={{ ...styles.input, flex: 1 }}
                        >
                            {categories.map((cat) => (
                                <option key={cat.category_id} value={cat.category_id}>
                                    {cat.category_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                        <input
                            placeholder="Brand"
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            style={{ ...styles.input, flex: 1 }}
                        />
                        <input
                            placeholder="Model"
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            style={{ ...styles.input, flex: 1 }}
                        />
                    </div>

                    <input
                        placeholder="Serial Number"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                    />

                    <textarea
                        placeholder="Configuration Details (e.g., 16GB RAM, 512GB SSD)"
                        value={formData.configuration}
                        onChange={(e) => setFormData({ ...formData, configuration: e.target.value })}
                        style={{ ...styles.input, height: "60px" }}
                    />

                    <div style={{ display: "flex", gap: "10px" }}>
                        <input
                            type="number"
                            placeholder="Purchase Cost ($)"
                            value={formData.purchase_cost}
                            onChange={(e) => setFormData({ ...formData, purchase_cost: parseFloat(e.target.value) || 0 })}
                            style={{ ...styles.input, flex: 1 }}
                            min="0"
                            step="0.01"
                        />
                        <input
                            type="number"
                            placeholder="Depreciation Yrs"
                            value={formData.depreciation_years}
                            onChange={(e) => setFormData({ ...formData, depreciation_years: parseInt(e.target.value) || 0 })}
                            style={{ ...styles.input, flex: 1 }}
                            min="1"
                        />
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: "12px" }}>Purchase Date</label>
                            <input
                                type="date"
                                value={formData.purchase_date}
                                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: "12px" }}>Warranty Expiry</label>
                            <input
                                type="date"
                                value={formData.warranty_expiry}
                                onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                                style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                            />
                        </div>
                    </div>

                    <input
                        placeholder="Location (e.g., HQ-Floor 3)"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        style={styles.input}
                    />

                    <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: "12px" }}>Condition</label>
                            <select
                                value={formData.condition_status}
                                onChange={(e) => setFormData({ ...formData, condition_status: e.target.value })}
                                style={{ ...styles.input, width: "100%" }}
                            >
                                <option value="New">New</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                                <option value="Damaged">Damaged</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: "12px" }}>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                style={{ ...styles.input, width: "100%" }}
                            >
                                <option value="Available">Available</option>
                                <option value="Assigned">Assigned</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Retired">Retired</option>
                            </select>
                        </div>
                    </div>

                    <div style={styles.actions}>
                        <button type="button" onClick={close}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.5)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 1000
    },
    modal: { background: "white", padding: "20px", borderRadius: "8px", width: "500px", color: "#333", maxHeight: "90vh", overflowY: "auto" },
    form: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" },
    input: { padding: "8px", border: "1px solid #ccc", borderRadius: "4px" },
    actions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px" }
};

export default AssetModal;
