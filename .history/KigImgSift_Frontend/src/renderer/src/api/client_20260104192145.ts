// API client for communicating with the Go backend
const API_BASE_URL = 'http://localhost:12345/api';

export interface ImageListResponse {
  images: string[];
}

export interface MoveRequest {
  filename: string;
  targetType: 'frontal' | 'side';
}

export interface MoveResponse {
  success: boolean;
  message: string;
}

export class ApiClient {
  static async getImages(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/images`);
    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }
    const data: ImageListResponse = await response.json();
    return data.images;
  }

  static async getImageBlob(path: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/image?path=${encodeURIComponent(path)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    return response.blob();
  }

  static async moveImage(filename: string, targetType: 'frontal' | 'side'): Promise<MoveResponse> {
    const response = await fetch(`${API_BASE_URL}/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        targetType,
      } as MoveRequest),
    });

    if (!response.ok) {
      throw new Error('Failed to move image');
    }

    return response.json();
  }
}
