import React, { useState, useEffect } from "react";
import axios from "axios";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import LoadingIndicator from "../../components/LoadingIndicator";
import { NavLink, useOutletContext } from "react-router-dom";
import { SERVER_URL } from "../../router";

function ProductsScreen() {
  const [isLoading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  const [_, user] = useOutletContext();

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, searchTerm]);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await axios.get(`${SERVER_URL}/api/v1/products`, {
        params: {
          page: currentPage,
          itemsperpage: itemsPerPage,
          search: searchTerm,
        },
      });
      setProducts(response.data.data);
      setTotalPages(response.data.pages_count);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  function handlePrevPage() {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  }

  function handleNextPage() {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  }

  return (
    <div className="m-5">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-900">Products</h1>
        <p className="text-lg text-neutral-600">
          Here are the products created by you!
        </p>
      </div>
      <br />

      <div className="flex gap-3 items-center justify-between">
        <div className="flex gap-4">
          <input
            type="text"
            className="outline-none px-3 py-1 border-neutral-500 border-2 rounded-md text-lg"
            placeholder="Search products"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <NavLink
          className="text-lg font-semibold text-neutral-800 hover:bg-teal-50 hover:text-teal-800 px-4 py-1 border rounded-md"
          to={"new"}
        >
          Create Product
        </NavLink>
      </div>
      <br />

      <div className="border rounded-md border-neutral-700">
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse">
            <thead className="border-b text-left">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">TITLE</th>
                <th className="px-4 py-2">CATEGORY</th>
                <th className="px-4 py-2">SUB-CATEGORY</th>
                <th className="px-4 py-2">CHILD-CATEGORY</th>
                <th className="px-4 py-2">ITEMS</th>
                <th className="px-4 py-2">GRAND TOTAL</th>
                <th className="px-4 py-2">CREATED BY</th>
                <th className="px-4 py-2">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-2 text-center">
                    <LoadingIndicator />
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => (
                  <ProductRow
                    key={product._id}
                    index={idx}
                    product={product}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    user={user}
                  />
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between py-2 mx-5">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                className="border rounded-md aspect-square w-10 text-center"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(e.target.value)}
              />
              <h5>Per Page</h5>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="flex gap-2 items-center border rounded-md py-1 text-lg font-semibold px-3 hover:bg-teal-50 hover:text-teal-700 text-center"
              >
                <IoIosArrowBack />
                <span>Prev</span>
              </button>
              <input
                type="number"
                min={1}
                className="border rounded-md aspect-square w-10 text-center"
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
              />
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex gap-2 items-center border rounded-md py-1 text-lg font-semibold px-3 hover:bg-teal-50 hover:text-teal-700 text-center"
              >
                <span>Next</span>
                <IoIosArrowForward />
              </button>
              <h6>Total {totalPages} pages</h6>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductRow({ product, index, currentPage, itemsPerPage, user }) {
  return (
    <tr className="border-b hover:bg-teal-50 hover:text-teal-700">
      <td className="px-4 py-2 font-semibold">
        {index + 1 + (currentPage - 1) * itemsPerPage}
      </td>
      <td className="px-4 py-2">{product.title}</td>
      <td className="px-4 py-2">{product.category?.name || "-"}</td>
      <td className="px-4 py-2">{product.subCategory?.name || "-"}</td>
      <td className="px-4 py-2">{product.childCategory?.name || "-"}</td>

      {/* Items list */}
      <td className="px-4 py-2">
        {product.items?.length
          ? product.items.map((item, i) => (
              <div key={i}>
                {item.quantity}×{item.pricePerUnit}  = ₹{item.totalAmount}
              </div>
            ))
          : "-"}
      </td>

      {/* Grand total */}
      <td className="px-4 py-2">₹{product.grandTotalAmount}</td>

      <td className="px-4 py-2">{product.createdBy?.name || "Unknown"}</td>
      <td className="px-4 py-2">
        <NavLink
          to={user._id !== product.createdBy?._id ? "" : `edit/${product._id}`}
          className="px-4 py-1 bg-neutral-800 text-slate-100 text-sm rounded-md hover:bg-neutral-600 hover:scale-95 transition-transform"
        >
          {user._id === product.createdBy?._id ? "Edit" : "Action Not allowed"}
        </NavLink>
      </td>
    </tr>
  );
}

export default ProductsScreen;
