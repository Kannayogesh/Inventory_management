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

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

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
      category_id: parseInt(formData.category_id) || (categories.length > 0 ? categories[0].category_id : 1),
    };
    onSave(payload);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{asset ? "Edit Asset" : "Register New Asset"}</h3>
          <button className="modal-close" onClick={close}>✕</button>
        </div>
        <p className="modal-subtitle">{asset ? "Update the asset information below." : "Fill in the details to register a new asset."}</p>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Asset Tag *</label>
                <input
                  className="form-input"
                  placeholder="e.g. LPT-001"
                  value={formData.asset_tag}
                  onChange={e => set("asset_tag", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={formData.category_id}
                  onChange={e => set("category_id", e.target.value)}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Brand</label>
                <input className="form-input" placeholder="e.g. Dell" value={formData.brand} onChange={e => set("brand", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input className="form-input" placeholder="e.g. Latitude 5520" value={formData.model} onChange={e => set("model", e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input className="form-input" placeholder="e.g. SN-1234ABCD" value={formData.serial_number} onChange={e => set("serial_number", e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Configuration</label>
              <textarea className="form-textarea" placeholder="e.g. 16GB RAM, 512GB SSD, Intel i7" value={formData.configuration} onChange={e => set("configuration", e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Purchase Cost ($)</label>
                <input type="number" className="form-input" placeholder="0.00" value={formData.purchase_cost} onChange={e => set("purchase_cost", parseFloat(e.target.value) || 0)} min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">Depreciation (Years)</label>
                <input type="number" className="form-input" placeholder="3" value={formData.depreciation_years} onChange={e => set("depreciation_years", parseInt(e.target.value) || 0)} min="1" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Purchase Date</label>
                <input type="date" className="form-input" value={formData.purchase_date} onChange={e => set("purchase_date", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Warranty Expiry</label>
                <input type="date" className="form-input" value={formData.warranty_expiry} onChange={e => set("warranty_expiry", e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" placeholder="e.g. HQ – Floor 3" value={formData.location} onChange={e => set("location", e.target.value)} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Condition</label>
                <select className="form-select" value={formData.condition_status} onChange={e => set("condition_status", e.target.value)}>
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={formData.status} onChange={e => set("status", e.target.value)}>
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {asset ? "Save Changes" : "Register Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetModal;