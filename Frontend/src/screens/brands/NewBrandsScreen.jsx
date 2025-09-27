import React, { useState } from "react";
import { Link } from "react-router-dom";
import ShowErrorMessage from "../../components/ShowErrorMessage";
import axios from "axios";
import { SERVER_URL } from "../../router";

function NewBrandScreen() {
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState({
    name: "",
    subCategories: [{ name: "", children: [{ name: "" }] }],
  });
  const [isError, setError] = useState("");

  // update category/subcategory/child values
  const handleChange = (e, index, type, childIndex) => {
    const value = e.target.value;
    const updated = { ...data };

    if (type === "category") {
      updated.name = value;
    } else if (type === "subCategory") {
      updated.subCategories[index].name = value;
    } else if (type === "child") {
      updated.subCategories[index].children[childIndex].name = value;
    }
    setData(updated);
  };

  // add subcategory
  const addSubCategory = () => {
    setData({
      ...data,
      subCategories: [...data.subCategories, { name: "", children: [{ name: "" }] }],
    });
  };

  // add child category
  const addChildCategory = (subIndex) => {
    const updated = { ...data };
    updated.subCategories[subIndex].children.push({ name: "" });
    setData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setUploading(true);

      await axios.post(
        `${SERVER_URL}/api/v1/brands`,
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      setSuccess(true);
      setData({ name: "", subCategories: [{ name: "", children: [{ name: "" }] }] });
    } catch (e) {
      setError(e.message || "Failed to create category");
      console.log(e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-5 w-full h-full">
      <h1 className="text-2xl font-semibold">Add New Category</h1>

      {isError && (
        <ShowErrorMessage
          children={<span className="underline cursor-pointer">{isError}</span>}
        />
      )}

      {success && (
        <div className="mx-auto text-center border-teal-700 bg-teal-300 p-3 w-1/2 border-2 rounded-md mt-4">
          <p>
            Category Created Successfully{" "}
            <Link className="underline" to={"/"} replace={true}>
              Go Home
            </Link>
          </p>
        </div>
      )}

      <div className="max-w-2xl mx-auto mt-5">
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          {/* Category Name */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Category Name</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => handleChange(e, null, "category")}
              required
              className="shadow border rounded w-full py-2 px-3"
            />
          </div>

          {/* Subcategories */}
          {data.subCategories.map((sub, subIndex) => (
            <div key={subIndex} className="border p-3 rounded mb-3">
              <label className="block text-sm font-semibold mb-1">Sub Category {subIndex + 1}</label>
              <input
                type="text"
                value={sub.name}
                onChange={(e) => handleChange(e, subIndex, "subCategory")}
                required
                className="shadow border rounded w-full py-2 px-3 mb-2"
              />

              {/* Child categories */}
              {sub.children.map((child, childIndex) => (
                <div key={childIndex} className="ml-5 mb-2">
                  <label className="block text-xs font-medium mb-1">Child {childIndex + 1}</label>
                  <input
                    type="text"
                    value={child.name}
                    onChange={(e) => handleChange(e, subIndex, "child", childIndex)}
                    required
                    className="shadow border rounded w-full py-1 px-2"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={() => addChildCategory(subIndex)}
                className="text-sm text-blue-500 mt-2"
              >
                + Add Child
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addSubCategory}
            className="text-sm text-green-600 mb-4"
          >
            + Add Sub Category
          </button>

          <div className="flex items-center justify-between">
            <button
              disabled={uploading}
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {uploading ? "Uploading..." : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewBrandScreen;
