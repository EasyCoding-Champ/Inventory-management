import React, { useEffect, useState } from "react";
import axios from "axios";
import ShowSuccessMesasge from "../../components/ShowSuccessMesasge";
import { SERVER_URL } from "../../router";

function AddNewProductScreen() {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [childCategories, setChildCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "",
    subCategory: "",
    childCategory: "",
    items: [{ unit: "pcs", quantity: 0, pricePerUnit: 0, totalAmount: 0 }],
  });

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await axios.get(`${SERVER_URL}/api/v1/brands`);
        setCategories(data);
      } catch (e) {
        setError("Failed to fetch categories");
        console.error(e);
      }
    }
    fetchCategories();
  }, []);

  // Handle category change
  const handleCategoryChange = (e) => {
    const selectedCatId = e.target.value;
    const selectedCategory = categories.find((cat) => cat._id === selectedCatId);

    setForm({ ...form, category: selectedCatId, subCategory: "", childCategory: "" });
    setSubCategories(selectedCategory?.subCategories || []);
    setChildCategories([]);
  };

  // Handle subcategory change
  const handleSubCategoryChange = (e) => {
    const selectedSub = subCategories.find((sub) => sub.name === e.target.value);
    setForm({ ...form, subCategory: e.target.value, childCategory: "" });
    setChildCategories(selectedSub?.children || []);
  };

  // Handle child category change
  const handleChildChange = (e) => {
    setForm({ ...form, childCategory: e.target.value });
  };

  // Handle item change
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...form.items];
    updatedItems[index][field] = value;

    // Auto-calc totalAmount for this item
    const qty = Number(updatedItems[index].quantity || 0);
    const price = Number(updatedItems[index].pricePerUnit || 0);
    updatedItems[index].totalAmount = qty * price;

    setForm({ ...form, items: updatedItems });
  };

  // Add new item row
  const addItemRow = () => {
    setForm({
      ...form,
      items: [...form.items, { unit: "pcs", quantity: 0, pricePerUnit: 0, totalAmount: 0 }],
    });
  };

  // Remove item row
  const removeItemRow = (index) => {
    const updatedItems = [...form.items];
    updatedItems.splice(index, 1);
    setForm({ ...form, items: updatedItems });
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const selectedCategory = categories.find((c) => c._id === form.category);
      const selectedSub = subCategories.find((s) => s.name === form.subCategory);
      const selectedChild = childCategories.find((ch) => ch.name === form.childCategory);

      const payload = {
        title: form.title,
        category: selectedCategory
          ? { _id: selectedCategory._id, name: selectedCategory.name }
          : null,
        subCategory: selectedSub
          ? { _id: selectedSub._id || "", name: selectedSub.name }
          : null,
        childCategory: selectedChild
          ? { _id: selectedChild._id || "", name: selectedChild.name }
          : null,
        items: form.items.map((i) => ({
          unit: i.unit,
          quantity: Number(i.quantity) || 0,
          pricePerUnit: Number(i.pricePerUnit) || 0,
        })),
      };

      await axios.post(`${SERVER_URL}/api/v1/products`, payload, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });

      setSuccessMessage("Product added successfully!");
      setForm({
        title: "",
        category: "",
        subCategory: "",
        childCategory: "",
        items: [{ unit: "pcs", quantity: 0, pricePerUnit: 0, totalAmount: 0 }],
      });
    } catch (err) {
      setError("Failed to add product");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="m-5">
      <h1 className="text-3xl font-semibold text-neutral-900 mb-4">
        Add New Product
      </h1>
      {error && <div className="text-red-500">{error}</div>}
      {successMessage && (
        <ShowSuccessMesasge>
          <div className="text-gray-900 text-lg">{successMessage}</div>
        </ShowSuccessMesasge>
      )}

      <form
        onSubmit={handleSubmit}
        className="p-5 bg-white shadow-md rounded-lg max-w-2xl"
      >
        {/* Title */}
        <div className="mb-3">
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        {/* Category */}
        <div className="mb-3">
          <label className="block text-sm font-medium">Category</label>
          <select
            value={form.category}
            onChange={handleCategoryChange}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* SubCategory */}
        {subCategories.length > 0 && (
          <div className="mb-3">
            <label className="block text-sm font-medium">Sub Category</label>
            <select
              value={form.subCategory}
              onChange={handleSubCategoryChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Select Sub Category</option>
              {subCategories.map((sub, i) => (
                <option key={i} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ChildCategory */}
        {childCategories.length > 0 && (
          <div className="mb-3">
            <label className="block text-sm font-medium">Child Category</label>
            <select
              value={form.childCategory}
              onChange={handleChildChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Select Child</option>
              {childCategories.map((child, i) => (
                <option key={i} value={child.name}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Items Section */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold mb-2">Items</h2>
          {form.items.map((item, index) => (
            <div key={index} className="mb-3 border p-3 rounded bg-gray-50">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Unit (e.g. bag, kg, pcs)"
                  value={item.unit}
                  onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                  className="flex-1 border p-2 rounded"
                  required
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                  className="flex-1 border p-2 rounded"
                  required
                />
                <input
                  type="number"
                  placeholder="Price per Unit"
                  value={item.pricePerUnit}
                  onChange={(e) => handleItemChange(index, "pricePerUnit", e.target.value)}
                  className="flex-1 border p-2 rounded"
                  required
                />
              </div>

              <p className="font-bold">Total: ₹{item.totalAmount}</p>

              {form.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  className="text-red-500 mt-2"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}

export default AddNewProductScreen;
