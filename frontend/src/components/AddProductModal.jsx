import { useState, useEffect } from "react";
import "../styles/AddProductModal.css";

function AddProductModal({
  isOpen,
  onClose,
  onSave,
  editProduct,
}) {

  const initialData = {
    product_name: "",
    category: "",
    brand: "",
    sku: "",
    barcode: "",
    price: "",
    stock: "",
    image: "📦",
    attention_score: 0,
    shelf_id: "",
  };

  const [product, setProduct] = useState(initialData);

  useEffect(() => {

    if (editProduct) {

      setProduct({
        product_name: editProduct.product_name || "",
        category: editProduct.category || "",
        brand: editProduct.brand || "",
        sku: editProduct.sku || "",
        barcode: editProduct.barcode || "",
        price: editProduct.price || "",
        stock: editProduct.stock || "",
        image: editProduct.image || "📦",
        attention_score: editProduct.attention_score ?? 0,
        shelf_id: editProduct.shelf_id || "",
      });

    } else {

      setProduct(initialData);

    }

  }, [editProduct, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {

    const { name, value } = e.target;

    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));

  };

  const handleSubmit = () => {

    if (
      !product.product_name.trim() ||
      !product.category.trim() ||
      !product.brand.trim() ||
      !product.sku.trim() ||
      !product.barcode.trim() ||
      product.price === "" ||
      product.stock === "" ||
      product.shelf_id === ""
    ) {

      alert("Please fill all required fields.");

      return;

    }

    onSave({

      product_name: product.product_name.trim(),

      category: product.category.trim(),

      brand: product.brand.trim(),

      sku: product.sku.trim(),

      barcode: product.barcode.trim(),

      price: Number(product.price),

      stock: Number(product.stock),

      image: product.image || "📦",

      attention_score: Number(product.attention_score),

      shelf_id: Number(product.shelf_id),

    });

    onClose();

  };

  return (

    <div className="product-modal-overlay">

      <div className="product-modal">

        <h2>

          {editProduct ? "Edit Product" : "Add Product"}

        </h2>

        <div className="product-form">

          <input
            type="text"
            name="image"
            placeholder="Emoji (📦 🥛 🍞)"
            value={product.image}
            onChange={handleChange}
          />

          <input
            type="text"
            name="product_name"
            placeholder="Product Name"
            value={product.product_name}
            onChange={handleChange}
          />

          <input
            type="text"
            name="category"
            placeholder="Category"
            value={product.category}
            onChange={handleChange}
          />

          <input
            type="text"
            name="brand"
            placeholder="Brand"
            value={product.brand}
            onChange={handleChange}
          />

          <input
            type="text"
            name="sku"
            placeholder="SKU"
            value={product.sku}
            onChange={handleChange}
          />

          <input
            type="text"
            name="barcode"
            placeholder="Barcode"
            value={product.barcode}
            onChange={handleChange}
          />

          <input
            type="number"
            name="price"
            placeholder="Price"
            value={product.price}
            onChange={handleChange}
          />

          <input
            type="number"
            name="stock"
            placeholder="Stock Quantity"
            value={product.stock}
            onChange={handleChange}
          />

          <input
            type="number"
            name="shelf_id"
            placeholder="Shelf ID"
            value={product.shelf_id}
            onChange={handleChange}
          />

          <input
            type="number"
            step="0.1"
            name="attention_score"
            placeholder="Attention Score"
            value={product.attention_score}
            onChange={handleChange}
          />

        </div>

        <div className="product-buttons">

          <button
            className="cancel-btn"
            onClick={onClose}
          >

            Cancel

          </button>

          <button
            className="save-btn"
            onClick={handleSubmit}
          >

            {editProduct ? "Update Product" : "Save Product"}

          </button>

        </div>

      </div>

    </div>

  );

}

export default AddProductModal;