import JSZip from "jszip";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class ArchiveManager {

  static r2 = new S3Client({
    region: "auto", 
    endpoint: "https://086cf4cab6f623952bd0831a164dc89b.r2.cloudflarestorage.com",
    credentials: {
      accessKeyId: "04d7b1d006c66373a5f989eacb72e58e",
      secretAccessKey: "0d16a302e2262503ffd774240e2875a86de91b2fc70ffdaf55f5784bac97200d"
    }
  });

  /**
   * Створює ZIP і повертає URL для завантаження
   */
  static async downloadImagesAsZip(images) {
    if (!images?.length) {
      throw new Error("Немає обраних зображень");
    }

    const zip = new JSZip();

    for (const img of images) {
      const key = `original/${img.id}-${img.filename}`;

      // 1. Генеруємо pre-signed URL
      const url = await getSignedUrl(
        this.r2,
        new GetObjectCommand({
          Bucket: "images",
          Key: key
        }),
        { expiresIn: 60 }
      );

      // 2. Завантажуємо файл через fetch
      const response = await fetch(url);
      const blob = await response.blob();

      // 3. Додаємо файл в ZIP
      zip.file(img.filename, blob);
    }

    // 4. Генеруємо ZIP у пам’яті
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // 5. Створюємо локальний URL для завантаження
    return URL.createObjectURL(zipBlob);
  }
}
