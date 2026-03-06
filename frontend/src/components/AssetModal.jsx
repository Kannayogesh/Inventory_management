import { useState, useEffect } from "react";
import { getCategories, createCategory } from "../api";

const AssetModal = ({ close, onSave, asset }) => {
  const [categories, setCategories] = useState([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState("");
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
    invoice_path: "",
  });

  useEffect(() => {
    getCategories()
      .then(data => {
        setCategories(data);
        if (!asset && data.length > 0) {
          const firstCat = data[0];
          setFormData(prev => ({ ...prev, category_id: firstCat.category_id }));
          setCategoryInput(firstCat.category_name);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (asset) {
      const catId = asset.category_id || (categories.length > 0 ? categories[0].category_id : "");
      const category = categories.find(c => c.category_id === catId);
      setFormData({
        asset_tag: asset.asset_tag || "",
        category_id: catId,
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
        invoice_path: asset.invoice_path || "",
      });
      setCategoryInput(category?.category_name || "");
      if (asset.invoice_path) {
        setInvoicePreview(asset.invoice_path);
      }
    }
  }, [asset, categories]);

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleInvoiceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setInvoiceFile(file);
      // Create a preview URL for the file
      const reader = new FileReader();
      reader.onload = (event) => {
        setInvoicePreview(event.target.result);
        set("invoice_path", file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeInvoice = () => {
    setInvoiceFile(null);
    setInvoicePreview("");
    set("invoice_path", "");
  };

  const handleCategorySelect = (categoryId) => {
    set("category_id", categoryId);
    const category = categories.find(c => c.category_id === categoryId);
    setCategoryInput(category?.category_name || "");
    setShowCategoryDropdown(false);
  };

  const handleCategoryInputChange = (e) => {
    setCategoryInput(e.target.value);
    setShowCategoryDropdown(true);
  };

  const handleCreateCategory = async () => {
    if (!categoryInput.trim()) return;
    
    try {
      const newCategory = await createCategory({ category_name: categoryInput });
      setCategories([...categories, newCategory]);
      set("category_id", newCategory.category_id);
      setShowCategoryDropdown(false);
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category");
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.category_name.toLowerCase().includes(categoryInput.toLowerCase())
  );

  const selectedCategory = categories.find(c => c.category_id == formData.category_id);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.asset_tag || !formData.asset_tag.trim()) {
      alert("Asset Tag is required");
      return;
    }
    
    if (!formData.category_id) {
      alert("Please select or create a category");
      return;
    }
    
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
      category_id: parseInt(formData.category_id),
      invoice_path: formData.invoice_path === "" ? null : formData.invoice_path,
    };
    
    // If there's an invoice file, we would need to handle file upload here
    // For now, we'll pass the file data along with the form
    if (invoiceFile) {
      payload._invoiceFile = invoiceFile;
    }
    
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
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Select or type to create a new category…"
                    value={categoryInput}
                    onChange={handleCategoryInputChange}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                    required={!formData.category_id}
                  />
                  {showCategoryDropdown && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderTop: "none",
                      borderRadius: "0 0 var(--radius-sm) var(--radius-sm)",
                      zIndex: 10,
                      maxHeight: "200px",
                      overflowY: "auto"
                    }}>
                      {filteredCategories.length > 0 && (
                        <>
                          {filteredCategories.map(cat => (
                            <div
                              key={cat.category_id}
                              onClick={() => handleCategorySelect(cat.category_id)}
                              style={{
                                padding: "10px 12px",
                                cursor: "pointer",
                                backgroundColor: formData.category_id === cat.category_id ? "var(--accent-light)" : "transparent",
                                color: formData.category_id === cat.category_id ? "var(--accent)" : "var(--text-primary)",
                                borderBottom: "1px solid var(--border-strong)"
                              }}
                            >
                              {cat.category_name}
                            </div>
                          ))}
                          <div style={{ borderTop: "1px solid var(--border-strong)" }} />
                        </>
                      )}
                      {categoryInput.trim() && !categories.some(c => c.category_name.toLowerCase() === categoryInput.toLowerCase()) && (
                        <div
                          onClick={handleCreateCategory}
                          style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            backgroundColor: "var(--accent-light)",
                            color: "var(--accent)",
                            fontWeight: "600"
                          }}
                        >
                          + Create "{categoryInput}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
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

            <div className="form-group">
              <label className="form-label">Invoice / Bill</label>
              <div style={{ marginBottom: "12px" }}>
                <label className="form-label" style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "400", marginBottom: "8px" }}>
                  📄 Upload invoice or bill receipt (PDF, image, etc.)
                </label>
                <input
                  type="file"
                  className="form-input"
                  onChange={handleInvoiceUpload}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  style={{ cursor: "pointer" }}
                />
              </div>
              {invoicePreview && (
                <div style={{
                  padding: "12px",
                  backgroundColor: "var(--bg-subtle)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  marginBottom: "12px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      ✓ {invoiceFile?.name || "Invoice uploaded"}
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={removeInvoice}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
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