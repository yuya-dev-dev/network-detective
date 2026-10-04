import sharp from "sharp";
import { mkdir } from "node:fs/promises";
await mkdir("public/art", { recursive: true });
await mkdir("public/icons", { recursive: true });
if (process.argv[2])
  await sharp(process.argv[2])
    .resize(960, 1440, { fit: "cover" })
    .webp({ quality: 78 })
    .toFile("public/art/title-night.webp");
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#090c10"/><rect x="104" y="104" width="304" height="304" rx="10" fill="#141a22" stroke="#344252" stroke-width="4"/><g stroke="#72d9ec" stroke-width="10" fill="none"><path d="M174 188H256V278H338"/><rect x="148" y="162" width="52" height="52" rx="3"/><rect x="230" y="252" width="52" height="52" rx="3"/><rect x="312" y="252" width="52" height="52" rx="3"/></g><path d="M148 356h216" stroke="#edf2f7" stroke-width="4"/></svg>`;
for (const size of [192, 512])
  await sharp(Buffer.from(icon))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
console.log("イラスト・PWAアイコンを生成しました");
