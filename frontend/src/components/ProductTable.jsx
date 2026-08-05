import { useEffect, useMemo, useState } from "react";

import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSyncAlt,
  FaBoxOpen,
  FaBoxes,
  FaWarehouse,
  FaChartLine,
} from "react-icons/fa";

import AddProductModal from "./AddProductModal";
import "../styles/ProductTable.css";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService";

function ProductTable() {

  /* ===========================================
                  STATES
  =========================================== */

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editProduct, setEditProduct] = useState(null);

  /* ===========================================
                LOAD PRODUCTS
  =========================================== */

  const loadProducts = async () => {

    try {

      setLoading(true);

      setError("");

      const data = await getProducts();

      if (Array.isArray(data)) {

        setProducts(data);

      } else {

        console.error("Unexpected product response:", data);

        setProducts([]);

      }

    } catch (err) {

      console.error("Error loading products:", err);

      setError("Unable to load products.");

      setProducts([]);

    } finally {

      setLoading(false);

    }

  };

  /* ===========================================
                LOAD ON START
  =========================================== */

  useEffect(() => {

    loadProducts();

  }, []);

  /* ===========================================
                SEARCH FILTER
  =========================================== */

  const filteredProducts = useMemo(() => {

    const keyword = search.toLowerCase();

    return products.filter((product) =>

      product.product_name?.toLowerCase().includes(keyword) ||

      product.category?.toLowerCase().includes(keyword) ||

      product.brand?.toLowerCase().includes(keyword) ||

      product.sku?.toLowerCase().includes(keyword) ||

      product.barcode?.toLowerCase().includes(keyword)

    );

  }, [products, search]);

  /* ===========================================
                KPI CALCULATIONS
  =========================================== */

  const totalProducts = products.length;

  const totalStock = products.reduce(

    (sum, product) => sum + Number(product.stock || 0),

    0

  );

  const totalCategories = new Set(

    products.map((product) => product.category)

  ).size;

  const averageAttention = totalProducts > 0

    ? (

        products.reduce(

          (sum, product) =>

            sum + Number(product.attention_score || 0),

          0

        ) / totalProducts

      ).toFixed(1)

    : "0.0";
    /* ===========================================
                SAVE PRODUCT
  =========================================== */

  const handleSave = async (productData) => {

    try {

      if (editProduct) {

        await updateProduct(editProduct.id, productData);

      } else {

        await createProduct(productData);

      }

      await loadProducts();

      setEditProduct(null);

      setIsModalOpen(false);

    } catch (err) {

      console.error("Error saving product:", err);

      alert("Failed to save product.");

    }

  };

  /* ===========================================
                EDIT PRODUCT
  =========================================== */

  const handleEdit = (product) => {

    setEditProduct(product);

    setIsModalOpen(true);

  };

  /* ===========================================
                DELETE PRODUCT
  =========================================== */

  const handleDelete = async (id) => {

    const confirmDelete = window.confirm(

      "Are you sure you want to delete this product?"

    );

    if (!confirmDelete) return;

    try {

      await deleteProduct(id);

      await loadProducts();

    } catch (err) {

      console.error("Error deleting product:", err);

      alert("Failed to delete product.");

    }

  };

  /* ===========================================
                CLOSE MODAL
  =========================================== */

  const handleCloseModal = () => {

    setEditProduct(null);

    setIsModalOpen(false);

  };

  /* ===========================================
                STOCK STATUS
  =========================================== */

  const getStockStatus = (stock) => {

    if (stock <= 0) return "Out of Stock";

    if (stock <= 20) return "Low Stock";

    return "In Stock";

  };

  const getStatusClass = (stock) => {

    if (stock <= 0) return "status out-stock";

    if (stock <= 20) return "status low-stock";

    return "status in-stock";

  };

  /* ===========================================
                LOADING
  =========================================== */

  if (loading) {

    return (

      <div className="product-container">

        <div className="loading-box">

          <h2>Loading Products...</h2>

        </div>

      </div>

    );

  }

  /* ===========================================
                ERROR
  =========================================== */

  if (error) {

    return (

      <div className="product-container">

        <div className="error-box">

          <h2>{error}</h2>

        </div>

      </div>

    );

  }

  /* ===========================================
                MAIN UI
  =========================================== */

  return (

    <div className="product-container">

      {/* ================= HEADER ================= */}

      <div className="product-header">

        <div>

          <h2>

            <FaBoxOpen />

            Product Management

          </h2>

          <p>

            Manage inventory, products, pricing, categories and
            product performance across all stores.

          </p>

        </div>

        <div className="header-actions">

          <button

            className="refresh-btn"

            onClick={loadProducts}

          >

            <FaSyncAlt />

            Refresh

          </button>

          <button

            className="add-product-btn"

            onClick={() => {

              setEditProduct(null);

              setIsModalOpen(true);

            }}

          >

            <FaPlus />

            Add Product

          </button>

        </div>

      </div>

      {/* ================= SEARCH ================= */}

      <div className="search-product">

        <FaSearch />

        <input

          type="text"

          placeholder="Search product, category, SKU, barcode or brand..."

          value={search}

          onChange={(e) => setSearch(e.target.value)}

        />

      </div>

      {/* ================= KPI CARDS ================= */}

      <div className="kpi-grid">

        <div className="kpi-card">

          <FaBoxOpen className="kpi-icon" />

          <h3>Total Products</h3>

          <h1>{totalProducts}</h1>

        </div>

        <div className="kpi-card">

          <FaBoxes className="kpi-icon" />

          <h3>Total Stock</h3>

          <h1>{totalStock}</h1>

        </div>

        <div className="kpi-card">

          <FaWarehouse className="kpi-icon" />

          <h3>Categories</h3>

          <h1>{totalCategories}</h1>

        </div>

        <div className="kpi-card">

          <FaChartLine className="kpi-icon" />

          <h3>Average Attention</h3>

          <h1>{averageAttention}</h1>

        </div>

      </div>
      {/* ================= PRODUCT OVERVIEW ================= */}

      <div className="product-overview-card">

        <div className="overview-grid">

          {/* ================= Product Information ================= */}

          <div className="info-card">

            <h3>

              <FaBoxOpen />

              Product Information

            </h3>

            <div className="info-row">

              <span>Total Products</span>

              <strong>{totalProducts}</strong>

            </div>

            <div className="info-row">

              <span>Total Categories</span>

              <strong>{totalCategories}</strong>

            </div>

            <div className="info-row">

              <span>Total Inventory</span>

              <strong>{totalStock}</strong>

            </div>

            <div className="info-row">

              <span>Average Attention</span>

              <strong>{averageAttention}</strong>

            </div>

          </div>

          {/* ================= Inventory Statistics ================= */}

          <div className="info-card">

            <h3>

              <FaChartLine />

              Inventory Statistics

            </h3>

            <div className="info-row">

              <span>In Stock</span>

              <strong>

                {

                  products.filter(

                    (product) => product.stock > 20

                  ).length

                }

              </strong>

            </div>

            <div className="info-row">

              <span>Low Stock</span>

              <strong>

                {

                  products.filter(

                    (product) =>

                      product.stock > 0 &&

                      product.stock <= 20

                  ).length

                }

              </strong>

            </div>

            <div className="info-row">

              <span>Out of Stock</span>

              <strong>

                {

                  products.filter(

                    (product) => product.stock <= 0

                  ).length

                }

              </strong>

            </div>

            <div className="info-row">

              <span>Inventory Health</span>

              <strong className="status active">

                Excellent

              </strong>

            </div>

          </div>

        </div>

        {/* ================= Description ================= */}

        <div className="description-card">

          <h3>

            <FaBoxes />

            Product Overview

          </h3>

          <p>

            This dashboard provides a centralized view of all products
            available across connected stores. Monitor inventory,
            pricing, stock availability, attention score and product
            performance while efficiently managing your retail
            inventory system.

          </p>

        </div>

      </div>

      {/* ================= CONFIGURATION ================= */}

      <div className="configuration-card">

        <h3>

          <FaWarehouse />

          Inventory Configuration

        </h3>

        <div className="configuration-grid">

          <div className="config-item">

            <span>Total Products</span>

            <strong>{totalProducts}</strong>

          </div>

          <div className="config-item">

            <span>Total Stock</span>

            <strong>{totalStock}</strong>

          </div>

          <div className="config-item">

            <span>Categories</span>

            <strong>{totalCategories}</strong>

          </div>

          <div className="config-item">

            <span>Average Attention</span>

            <strong>{averageAttention}</strong>

          </div>

        </div>

      </div>

      {/* ================= RECENT ACTIVITY ================= */}

      <div className="updates-card">

        <h3>

          <FaChartLine />

          Recent Activity

        </h3>

        <div className="timeline">

          <div className="timeline-item">

            <div className="timeline-dot"></div>

            <div>

              <strong>Inventory Monitoring Active</strong>

              <p>

                Product inventory is being monitored continuously
                across all connected shelves.

              </p>

            </div>

          </div>

          <div className="timeline-item">

            <div className="timeline-dot"></div>

            <div>

              <strong>Attention Analytics Enabled</strong>

              <p>

                AI attention scores are available for product
                performance tracking.

              </p>

            </div>

          </div>

          <div className="timeline-item">

            <div className="timeline-dot"></div>

            <div>

              <strong>Inventory Ready</strong>

              <p>

                Products are synchronized and available for
                management, reporting and analytics.

              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ================= PRODUCT TABLE ================= */}

      <div className="table-container">

        <table className="product-table">

          <thead>

            <tr>

              <th>Image</th>

              <th>Product</th>

              <th>Category</th>

              <th>Brand</th>

              <th>SKU</th>

              <th>Barcode</th>

              <th>Price</th>

              <th>Stock</th>

              <th>Status</th>

              <th>Attention</th>

              <th>Shelf</th>

              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {filteredProducts.length === 0 ? (

              <tr>

                <td colSpan="12" className="empty-table">

                  No products found.

                </td>

              </tr>

            ) : (

              filteredProducts.map((product) => (

                <tr key={product.id}>

                  <td className="product-image">

                    {product.image || "📦"}

                  </td>

                  <td>

                    <div className="product-name">

                      <strong>

                        {product.product_name}

                      </strong>

                    </div>

                  </td>

                  <td>{product.category}</td>

                  <td>{product.brand}</td>

                  <td>{product.sku}</td>

                  <td>{product.barcode}</td>

                  <td>

                    ₹{Number(product.price).toFixed(2)}

                  </td>

                  <td>

                    {product.stock}

                  </td>

                  <td>

                    <span

                      className={getStatusClass(

                        Number(product.stock)

                      )}

                    >

                      {getStockStatus(

                        Number(product.stock)

                      )}

                    </span>

                  </td>

                  <td>

                    {product.attention_score}

                  </td>

                  <td>

                    #{product.shelf_id}

                  </td>

                  <td>

                    <div className="action-buttons">

                      <button

                        className="edit-btn"

                        onClick={() =>

                          handleEdit(product)

                        }

                      >

                        <FaEdit />

                      </button>

                      <button

                        className="delete-btn"

                        onClick={() =>

                          handleDelete(product.id)

                        }

                      >

                        <FaTrash />

                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>
      <AddProductModal

        isOpen={isModalOpen}

        onClose={handleCloseModal}

        onSave={handleSave}

        editProduct={editProduct}

      />

    </div>

  );

}

export default ProductTable;