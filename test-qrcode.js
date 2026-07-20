import sharp from "sharp";
import QRCode from "qrcode";
import fs from "fs";

export const qrCodeGeneratorwithclientname = async ({
  link,
  floor,
  location,
}) => {
  let loc = location.substring(0, 25);
  let subLoc = location.substring(25);

  try {
    const width = 340;
    const qrHeight = 360;
    const totalHeight = qrHeight + 95;

    // 1. Generate QR Code as a Buffer (instead of DataURL)
    const qrBuffer = await QRCode.toBuffer(link, {
      width: width,
      margin: 6,
    });

    // 2. Create an SVG overlay for the text
    // SVG handles text placement much like HTML
    const svgText = `
      <svg width="${width}" height="${totalHeight}">
        <style>
          .branding { fill: rgb(32, 125, 192); font-size: 33px; font-family: Arial; font-weight: bold; font-style: italic; }
          .client { font-size: 12px; fill: rgb(0, 0, 0); font-weight: semibold;  }
          .details { fill: white; font-size: 20px; font-family: Arial; }
        </style>
        
        <!-- Top Branding -->
        <text x="50%" y="30" text-anchor="middle" class="branding">Powered By PestXZ</text> 
        <text x="50%" y="60" text-anchor="middle" class="client">M/s. St Telemedia Global Data Centres</text> 
        
        <!-- Bottom Details -->
        <text x="2" y="${qrHeight + 42}" class="details">Floor: ${floor}</text>
        <text x="2" y="${qrHeight + 64}" class="details">Location: ${loc}</text>
        <text x="2" y="${qrHeight + 86}" class="details">${subLoc}</text>
      </svg>
    `;

    // 3. Use Sharp to put it all together
    const buf = await sharp({
      create: {
        width: width,
        height: totalHeight,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }, // Assuming a black background based on your text color choices
      },
    })
      .composite([
        { input: qrBuffer, top: 40, left: 0 }, // Place the QR code
        { input: Buffer.from(svgText), top: 0, left: 0 }, // Place the text overlay
      ])
      .jpeg()
      .toBuffer();

    fs.writeFileSync("./tmp/test-qr.jpeg", buf);
    return buf;
  } catch (error) {
    console.log("QR Error", error);
    return false;
  }
};

// qrCodeGeneratorwithclientname({
//   link: "www.gmail.com",
//   floor: "2nd floor ",
//   location: "lobby outer area",
// });

export const testproductQrCodeGenerator = async ({
  link,
  floor,
  location,
  serialNo,
}) => {
  const loc = location.substring(0, 22);
  const subLoc = location.substring(22);
  try {
    const width = 220; // was 100 — bigger for reliable scanning at print size
    const qrSize = 220;
    const topPadding = 34; // room for branding + serialNo
    const bottomPadding = subLoc ? 65 : 55; // room for 4 lines: floor, location, sub-location, spacing
    const totalHeight = topPadding + qrSize + bottomPadding;

    // 1. QR code buffer
    const qrBuffer = await QRCode.toBuffer(link, {
      width: qrSize,
      margin: 2,
    });

    // 2. Text overlay — branding + serialNo at top, details at bottom
    const svgText = `
      <svg width="${width}" height="${totalHeight}">
        <style>
          .branding { fill: rgb(32, 125, 192); font-size: 16px; font-family: Arial; font-weight: bold; font-style: italic; }
          .serial   { fill: white; font-size: 12px; font-family: Arial; font-weight: bold; }
          .details  { fill: white; font-size: 13px; stroke:"red"; font-family: Arial; }
        </style>

        <!-- Top: branding + serial no -->
        <text x="50%" y="18" text-anchor="middle" class="branding">Powered By PestXZ</text>
        <text x="50%" y="32" text-anchor="middle" class="serial">S/N: ${serialNo ?? "-"}</text>

        <!-- Bottom: floor / location details, each line spaced to fit inside totalHeight -->
        <text x="6" y="${topPadding + qrSize + 20}" class="details">Floor: ${floor}</text>
        <text x="6" y="${topPadding + qrSize + 35}" class="details">Location: ${loc}</text>
        ${subLoc ? `<text x="6" y="${topPadding + qrSize + 45}" class="details">${subLoc}</text>` : ""}
      </svg>
    `;

    // 3. Composite
    const buf = await sharp({
      create: {
        width,
        height: totalHeight,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .composite([
        { input: qrBuffer, top: topPadding, left: (width - qrSize) / 2 },
        { input: Buffer.from(svgText), top: 0, left: 0 },
      ])
      .png()
      .toBuffer();
    fs.writeFileSync("./tmp/test-pdqr.jpeg", buf);

    return buf;
  } catch (error) {
    console.log("QR Error", error);
    return false;
  }
};
