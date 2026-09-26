import { api } from "./api";

export interface UploadImageResponse {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
}

/**
 * Uploads an image by sending the base64 data string to the backend server.
 * The backend securely communicates with Cloudinary without exposing credentials to the client.
 *
 * @param imageData Base64 data URL string (e.g. data:image/jpeg;base64,...)
 * @param folder Target storage folder on Cloudinary (default: dormio/uploads)
 */
export async function uploadImageToBackend(
  imageData: string,
  folder: string = "dormio/uploads"
): Promise<UploadImageResponse> {
  const res = await api.post<{ success?: boolean; data?: UploadImageResponse } | UploadImageResponse>(
    "/v1/upload/image",
    {
      image: imageData,
      folder,
    }
  );
  console.log(res)

  if (res && typeof res === "object" && "data" in res && (res as any).data) {
    return (res as any).data as UploadImageResponse;
  }
  return res as UploadImageResponse;
}
