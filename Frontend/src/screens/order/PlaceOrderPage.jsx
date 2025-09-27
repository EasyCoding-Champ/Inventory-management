import React, { useState, useEffect } from "react";
import axios from "axios";
import ShowSuccessMesasge from "../../components/ShowSuccessMesasge";
import { SERVER_URL } from "../../router";

function PlaceOrderPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [subCategories, setSubCategories] = useState([]);
  const [childCategories, setChildCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [form, setForm] = useState({
    category: "",
    subCategory: "",
    childCategory: "",
    count: 1,
    price: 0,
    paidAmount: 0,
  });

  const [countLabel, setCountLabel] = useState("Count");
  const [priceLabel, setPriceLabel] = useState("Price per Unit");

  const [customers, setCustomers] = useState([]);
  const [customerMode, setCustomerMode] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "" });
  const [customerErrors, setCustomerErrors] = useState({ phone: "", email: "" });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch categories & customers
  useEffect(() => {
    async function fetchData() {
      try {
        const [hierarchyRes, custRes] = await Promise.all([
          axios.get(`${SERVER_URL}/api/v1/products/hierarchy`),
          axios.get(`${SERVER_URL}/api/v1/customers`)
        ]);
        setCategories(hierarchyRes.data);
        setCustomers(custRes.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

 useEffect(() => {
  const selectedChildObj = childCategories.find(c => c.productId === form.childCategory);
  if (!selectedChildObj) return;

  const catName = form.category.toLowerCase();
  let newCountLabel = "Count";
  let newPriceLabel = "Price per Unit";
  let newPrice = form.price;

  if (selectedChildObj.items && selectedChildObj.items.length > 0) {
    const itemPrice = selectedChildObj.items[0].pricePerUnit || 0;
    //newPrice = itemPrice;

    newCountLabel = selectedChildObj.items[0].unit || "Count";
    newPriceLabel = `Price per ${newCountLabel}`;
  }

  setForm(prev => ({ ...prev, price: newPrice }));
  setCountLabel(newCountLabel);
  setPriceLabel(newPriceLabel);
}, [form.category, form.childCategory, childCategories]);
  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone) ? "" : "Phone must be 10 digits and start with 6-9";
  };

  const handleCustomerMode = (mode) => {
    setCustomerMode(mode);
    setSelectedCustomerId("");
    setCustomer({ name: "", phone: "", email: "", address: "" });
    setCustomerErrors({ phone: "", email: "" });
  };

  const handleCustomerSelect = (e) => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    const cust = customers.find((c) => c._id === id);
    if (cust) setCustomer({ name: cust.name, phone: cust.phone, email: cust.email || "", address: cust.address });
    setCustomerErrors({ phone: "", email: "" });
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomer({ ...customer, [name]: value });

    if (customerMode === "new" && name === "phone") {
      const phoneError = validatePhone(value);
      if (!phoneError && customers.find(c => c.phone === value)) {
        setCustomerErrors(prev => ({ ...prev, phone: "Customer with this phone already exists" }));
      } else {
        setCustomerErrors(prev => ({ ...prev, phone: phoneError }));
      }
    } else if (customerMode === "existing") {
      const phoneError = validatePhone(value);
      // For existing customers, just validate phone format
      setCustomerErrors(prev => ({ ...prev, phone: phoneError }));
    }
  };

  const handleCategoryChange = (e) => {
    const selected = e.target.value;
    setForm({ ...form, category: selected, subCategory: "", childCategory: "", price: 0 });
    setSubCategories(Object.keys(categories[selected] || {}));
    setChildCategories([]);
  };

  const handleSubCategoryChange = (e) => {
    const selected = e.target.value;
    setForm({ ...form, subCategory: selected, childCategory: "", price: 0 });
    setChildCategories(categories[form.category][selected] || []);
  };

  const handleChildCategoryChange = (e) => {
    const selectedId = e.target.value;
    const childObj = childCategories.find(c => c.productId === selectedId);
    if (childObj) setForm({ ...form, childCategory: childObj.productId });
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: Number(e.target.value) });

  // Cart
  const addToCart = () => {
    if (!form.category || !form.subCategory || !form.childCategory || !form.count || !form.price) {
      return alert("Select category, subcategory, child category, count, and price");
    }

    const key = `${form.category}_${form.subCategory}_${form.childCategory}`;
    const total = Number(form.count) * Number(form.price);
    const existingIndex = cart.findIndex((item) => item.key === key);
    let newCart = [...cart];

    if (existingIndex >= 0) {
      newCart[existingIndex].quantity += Number(form.count);
      newCart[existingIndex].price = Number(form.price);
      newCart[existingIndex].totalAmount = newCart[existingIndex].quantity * newCart[existingIndex].price;
    } else {
      const selectedChildObj = childCategories.find(c => c.productId === form.childCategory);
      newCart.push({
        key,
        categoryId: form.category,
        subCategoryId: form.subCategory,
        childCategoryId: form.childCategory,
        quantity: Number(form.count),
        price: Number(form.price),
        totalAmount: total
      });
    }

    setCart(newCart);
    recalcTotal(newCart, form.paidAmount);
  };

  const removeFromCart = (childCategoryId) => {
    const newCart = cart.filter((item) => item.childCategoryId !== childCategoryId);
    setCart(newCart);
    recalcTotal(newCart, form.paidAmount);
  };

  const recalcTotal = (cartList, paid) => {
    const total = cartList.reduce((sum, item) => sum + item.totalAmount, 0);
    setTotalAmount(total);
    setBalance(total - (paid || 0));
  };

  const handlePaidChange = (e) => {
    const paid = Number(e.target.value) || 0;
    setForm({ ...form, paidAmount: paid });
    setBalance(totalAmount - paid);
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!customer.name || !customer.phone) return alert("Enter customer details");
    if (customerMode === "new" && customerErrors.phone) return setError("Fix customer details before placing order");
    if (cart.length === 0) return alert("Add items to cart");

    try {
      setIsLoading(true);
      let customerId = selectedCustomerId;

      if (customerMode === "new") {
        const res = await axios.post(`${SERVER_URL}/api/v1/customers`, customer);
        customerId = res.data._id;
      }

      const total = cart.reduce((sum, item) => sum + item.totalAmount, 0);

      await axios.post(`${SERVER_URL}/api/v1/transactions`, {
        customerId,
        products: cart.map(item => ({
          productId: item._id,
          categoryId: item.categoryId,
          subCategoryId: item.subCategoryId,
          childCategoryId: item.childCategoryId,
          quantity: item.quantity,
          price: item.price,
          totalAmount: item.totalAmount
        })),
        totalAmount: total,
        paidAmount: Number(form.paidAmount) || 0,
        balance: total - (Number(form.paidAmount) || 0),
        status: (total - (Number(form.paidAmount) || 0)) === 0 ? "Paid" : "Pending"
      });

      setSuccessMessage("Order placed successfully!");
      setCart([]);
      setForm({ category: "", subCategory: "", childCategory: "", count: 1, price: 0, paidAmount: 0 });
      setCustomer({ name: "", phone: "", email: "", address: "" });
      setCustomerMode("");
      setSelectedCustomerId("");
      setTotalAmount(0);
      setBalance(0);
      setCustomerErrors({ phone: "", email: "" });
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.error || err.message || "Something went wrong";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="m-5">
      <h1 className="text-3xl font-semibold mb-4">Place Order</h1>

      <div className="mb-4 flex gap-4">
        <button type="button" onClick={() => handleCustomerMode("existing")} className={`px-4 py-2 rounded ${customerMode === "existing" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Existing Customer</button>
        <button type="button" onClick={() => handleCustomerMode("new")} className={`px-4 py-2 rounded ${customerMode === "new" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>New Customer</button>
      </div>

      {error && <div className="text-red-500 mb-2">{error}</div>}
      {successMessage && <ShowSuccessMesasge><div className="text-gray-900">{successMessage}</div></ShowSuccessMesasge>}

      <form onSubmit={placeOrder} className="bg-white p-5 shadow-md rounded-lg max-w-xl">
        {(customerMode === "new" || customerMode === "existing") && (
          <div className="mb-3">
            {customerMode === "existing" && (
              <>
                <label className="block text-sm font-medium">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={handleCustomerSelect}
                  className="w-full border p-2 rounded mb-2"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </>
            )}
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={customer.name}
              onChange={handleCustomerChange}
              className="w-full border p-2 rounded mb-2"
              required
              disabled={customerMode === "existing"} // Disable for existing customers
            />
            <label className="block text-sm font-medium">Phone</label>
            <input
              type="text"
              name="phone"
              value={customer.phone}
              onChange={handleCustomerChange}
              className="w-full border p-2 rounded mb-2"
              disabled={customerMode === "existing"} // Disable for existing customers
            />
            {customerErrors.phone && (
              <p className="text-red-500 text-sm mb-2">{customerErrors.phone}</p>
            )}
            <label className="block text-sm font-medium">Address</label>
            <textarea
              name="address"
              value={customer.address}
              onChange={handleCustomerChange}
              className="w-full border p-2 rounded"
              disabled={customerMode === "existing"} // Disable for existing customers
            />
          </div>
        )}
        <div className="mb-3">
          <label className="block text-sm font-medium">Category</label>
          <select value={form.category} onChange={handleCategoryChange} className="w-full border p-2 rounded" required>
            <option value="">Select Category</option>
            {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {subCategories.length > 0 && (
          <div className="mb-3">
            <label className="block text-sm font-medium">Sub Category</label>
            <select value={form.subCategory} onChange={handleSubCategoryChange} className="w-full border p-2 rounded">
              <option value="">Select Sub Category</option>
              {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
        )}

        {childCategories.length > 0 && (
          <div className="mb-3">
            <label className="block text-sm font-medium">Child Category</label>
            <select value={form.childCategory} onChange={handleChildCategoryChange} className="w-full border p-2 rounded">
              <option value="">Select Child Category</option>
              {childCategories.map(child => <option key={child.productId} value={child.productId}>{child.child}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-sm font-medium">{countLabel}</label>
            <input type="text" name="count" value={form.count} min={1} onChange={handleFormChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">{priceLabel}</label>
            <input type="text" name="price" value={form.price} onChange={handleFormChange} className="w-full border p-2 rounded" />
          </div>
        </div>

        <button type="button" onClick={addToCart} className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 mb-4">Add to Cart</button>

        {cart.length > 0 && (
          <div className="mb-3">
            <h3 className="font-bold mb-2">Cart</h3>
            {cart.map(item => (
              <div key={item.childCategoryId} className="flex justify-between border-b py-1">
                <span>{item.price} x {item.quantity} = ₹{item.totalAmount}</span>
                <button type="button" className="text-red-600" onClick={() => removeFromCart(item.childCategoryId)}>Remove</button>
              </div>
            ))}
          </div>
        )}

        <div className="mb-3">
          <label className="block text-sm font-medium">Paid Amount</label>
          <input type="text" value={form.paidAmount} onChange={handlePaidChange} className="w-full border p-2 rounded" />
        </div>

        <p className="font-bold">Total: ₹{totalAmount}</p>
        <p className="font-bold">Balance: ₹{balance}</p>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4" disabled={isLoading}>
          {isLoading ? "Placing..." : "Place Order"}
        </button>
      </form>
    </div>
  );
}

export default PlaceOrderPage;
