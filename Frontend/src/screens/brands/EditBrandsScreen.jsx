import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import ShowErrorMessage from "../../components/ShowErrorMessage";
import ShowSuccessMesasge from "../../components/ShowSuccessMesasge";
import LoadingIndicator from "../../components/LoadingIndicator";
import axios from "axios";
import { SERVER_URL } from "../../router";

function EditBrandsScreen() {
  const params = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState({
    name: "",
    subCategories: [],
  });
  const [isError, setError] = useState("");

  useEffect(() => {
    getDataFromApi();
  }, []);

  async function getDataFromApi() {
    try {
      setError("");
      const { data } = await axios.get(
        `${SERVER_URL}/api/v1/brands/${params.id}`
      );
      setData(data);
    } catch (e) {
      setError(e.message || "Failed to fetch");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Change handlers
  const handleChange = (e, type, subIndex, childIndex) => {
    const value = e.target.value;
    const updated = { ...data };

    if (type === "category") {
      updated.name = value;
    } else if (type === "subCategory") {
      updated.subCategories[subIndex].name = value;
    } else if (type === "child") {
      updated.subCategories[subIndex].children[childIndex].name = value;
    }
    setData(updated);
  };

  // Add / remove subcategories & children
  const addSubCategory = () => {
    setData({
      ...data,
      subCategories: [
        ...data.subCategories,
        { name: "", children: [{ name: "" }] },
      ],
    });
  };

  const removeSubCategory = (index) => {
    const updated = { ...data };
    updated.subCategories.splice(index, 1);
    setData(updated);
  };

  const addChild = (subIndex) => {
    const updated = { ...data };
    updated.subCategories[subIndex].children.push({ name: "" });
    setData(updated);
  };

  const removeChild = (subIndex, childIndex) => {
    const updated = { ...data };
    updated.subCategories[subIndex].children.splice(childIndex, 1);
    setData(updated);
  };

  // Update category
  async function handleUpdate(e) {
    e.preventDefault();
    try {
      setError("");
      setUploading(true);

      await axios.patch(
        `${SERVER_URL}/api/v1/brands/${params.id}`,
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      setSuccess(true);
    } catch (e) {
      setError(e.message || "Failed to update");
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  // Delete category
 async function handleDelete() {
  if (!window.confirm("Are you sure you want to delete this category?")) return;
  try {
    await axios.delete(`${SERVER_URL}/api/v1/brands/${params.id}`, {
      withCredentials: true,
    });
    navigate("/"); // go back home after delete
  } catch (e) {
    setError(e.message || "Failed to delete category");
    console.error(e);
  }
}


  return (
    <div className="p-5 w-full h-full">
      <h1 className="text-2xl font-semibold">Edit Category</h1>
      {isLoading && <LoadingIndicator />}

      {isError && (
        <ShowErrorMessage
          children={
            <span className="underline cursor-pointer" onClick={getDataFromApi}>
              {isError} (reload)
            </span>
          }
        />
      )}

      {success && (
        <ShowSuccessMesasge
          children={
            <p>
              Updated Successfully{" "}
              <Link className="underline" to={"/"} replace={true}>
                Go Home
              </Link>
            </p>
          }
        />
      )}

      {data && !isError && !isLoading && (
        <div className="max-w-2xl mx-auto mt-5">
          <form
            onSubmit={handleUpdate}
            className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
          >
            {/* Category Name */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => handleChange(e, "category")}
                required
                className="shadow border rounded w-full py-2 px-3"
              />
            </div>

            {/* Subcategories */}
            {data.subCategories?.map((sub, subIndex) => (
              <div key={subIndex} className="border p-3 rounded mb-3">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold">
                    Sub Category {subIndex + 1}
                  </label>
                  <button
                    type="button"
                    onClick={() => removeSubCategory(subIndex)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  value={sub.name}
                  onChange={(e) => handleChange(e, "subCategory", subIndex)}
                  required
                  className="shadow border rounded w-full py-2 px-3 mb-2"
                />

                {/* Child categories */}
                {sub.children?.map((child, childIndex) => (
                  <div key={childIndex} className="ml-5 mb-2 flex items-center">
                    <input
                      type="text"
                      value={child.name}
                      onChange={(e) =>
                        handleChange(e, "child", subIndex, childIndex)
                      }
                      required
                      className="shadow border rounded w-full py-1 px-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeChild(subIndex, childIndex)}
                      className="ml-2 text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addChild(subIndex)}
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

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                disabled={uploading}
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                {uploading ? "Updating..." : "Update"}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Delete
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default EditBrandsScreen;
