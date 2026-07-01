import Product from "../models/productModel.js";

export const addProducts = async (req, res) => {
  const data = req.body;
  try {
    if (!req.user.rights.addData)
      return res.status(403).json({ msg: "You are not allowed to Add data" });

    const mappedData = {
      name: data.name,
      version: data?.version?.map((v) => ({
        name: v.name,
        code: v.code,
        calibration: v?.calibration?.map((c) => c.value) || [],
      })),
      specification: data.specification,
    };
    if (data.mode === "create") {
      const product = await Product.findOne({ name: data?.name });
      if (product) {
        res.status(400).json({ msg: "Product already exists" });
        return;
      }
      await Product.create(mappedData);
      res.status(200).json({ msg: `Product Added ${data.name}` });
    }
    if (data.mode === "update") {
      const updatedProduct = await Product.findByIdAndUpdate(
        data.id,
        { $set: mappedData },
        { new: true, runValidators: true },
      );
      if (!updatedProduct) {
        return res.status(404).json({ msg: "Product not found" });
      }
      res.status(200).json({ msg: "Product updated successfull" });
    }
  } catch (error) {
    console.log("prodcut created error: ", error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    if (!products)
      return res
        .status(400)
        .json({ msg: "No products available, Please add some" });

    res.status(200).json(products);
  } catch (error) {
    console.log("prodcut created error: ", error);
    res.status(500).json({ msg: "Server error, try again later" });
  }
};
