import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

async function uploading() {
  const result = await cloudinary.uploader.upload("./tmp/qr.jpeg");
  console.log(result);
}

uploading()
// try {
// } catch (err) {
//   console.error(err);
// }
