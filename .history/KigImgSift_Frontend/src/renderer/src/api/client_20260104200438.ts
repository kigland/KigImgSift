// API client for communicating with the Go backend
const API_BASE_URL = 'http://localhost:12346/api';

export interface ImageListResponse {
  images: string[] | null;
}

export interface ConfigResponse {
  sourceDir: string;
  categories: Array<{
    id: string;
    name: string;
    path: string;
    shortcut: string;
  }>;
  skipShortcut: string;
}

export interface MoveRequest {
  filename: string;
  categoryId: string;
}

export interface MoveResponse {
  success: boolean;
  message: string;
}

export interface UndoRequest {
  filename: string;
  fromPath: string;
  toPath: string;
}

export interface UndoResponse {
  success: boolean;
  message: string;
}

export class ApiClient {
  static async getImages(): Promise<string[]> {
    console.log('ApiClient.getImages: Starting request to:', `${API_BASE_URL}/files/list`);
    try {
      const response = await fetch(`${API_BASE_URL}/files/list`);
      console.log('ApiClient.getImages: Response status:', response.status, response.statusText);
      console.log('ApiClient.getImages: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ApiClient.getImages: Response not ok. Status:', response.status, 'Body:', errorText);
        throw new Error(`Failed to fetch images: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: ImageListResponse = await response.json();
      console.log('ApiClient.getImages: Success, received images:', data.images);
      return data.images;
    } catch (error) {
      console.error('ApiClient.getImages: Network or parsing error:', error);
      throw error;
    }
  }

  static async getImageBlob(path: string): Promise<Blob> {
    const url = `${API_BASE_URL}/files/image?path=${encodeURIComponent(path)}`;
    console.log('ApiClient.getImageBlob: Starting request to:', url);
    try {
      const response = await fetch(url);
      console.log('ApiClient.getImageBlob: Response status:', response.status, response.statusText);
      console.log('ApiClient.getImageBlob: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ApiClient.getImageBlob: Response not ok. Status:', response.status, 'Body:', errorText);
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const blob = await response.blob();
      console.log('ApiClient.getImageBlob: Success, received blob of size:', blob.size, 'type:', blob.type);
      return blob;
    } catch (error) {
      console.error('ApiClient.getImageBlob: Network or parsing error for path', path, ':', error);
      throw error;
    }
  }

  static async moveImage(filename: string, categoryId: string): Promise<MoveResponse> {
    const url = `${API_BASE_URL}/action/move`;
    const requestBody = JSON.stringify({
      filename,
      categoryId,
    } as MoveRequest);

    console.log('ApiClient.moveImage: Starting POST request to:', url, 'with body:', requestBody);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      console.log('ApiClient.moveImage: Response status:', response.status, response.statusText);
      console.log('ApiClient.moveImage: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ApiClient.moveImage: Response not ok. Status:', response.status, 'Body:', errorText);
        throw new Error(`Failed to move image: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('ApiClient.moveImage: Success, response:', result);
      return result;
    } catch (error) {
      console.error('ApiClient.moveImage: Network or parsing error for filename', filename, ':', error);
      throw error;
    }
  }

  static async undoMove(filename: string, fromPath: string, toPath: string): Promise<UndoResponse> {
    const url = `${API_BASE_URL}/action/undo`;
    const requestBody = JSON.stringify({
      filename,
      fromPath,
      toPath,
    } as UndoRequest);

    console.log('ApiClient.undoMove: Starting POST request to:', url, 'with body:', requestBody);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      console.log('ApiClient.undoMove: Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ApiClient.undoMove: Response not ok. Status:', response.status, 'Body:', errorText);
        throw new Error(`Failed to undo move: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('ApiClient.undoMove: Success, response:', result);
      return result;
    } catch (error) {
      console.error('ApiClient.undoMove: Network or parsing error for filename', filename, ':', error);
      throw error;
    }
  }

  static async getConfig(): Promise<ConfigResponse> {
    const url = `${API_BASE_URL}/config`;
    console.log('ApiClient.getConfig: Starting GET request to:', url);

    try {
      const response = await fetch(url);
      console.log('ApiClient.getConfig: Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ApiClient.getConfig: Response not ok. Status:', response.status, 'Body:', errorText);
        throw new Error(`Failed to get config: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('ApiClient.getConfig: Success, config:', result);
      return result;
    } catch (error) {
      console.error('ApiClient.getConfig: Network or parsing error:', error);
      throw error;
    }
  }

  static async updateConfig(config: ConfigResponse): Promise<void> {
    const url = `${API_BASE_URL}/config`;
    const requestBody = JSON.stringify(config);

    console.log('ApiClient.updateConfig: Starting POST request to:', url, 'with body:', requestBody);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      console.log('ApiClient.updateConfig: Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ApiClient.updateConfig: Response not ok. Status:', response.status, 'Body:', errorText);
        throw new Error(`Failed to update config: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log('ApiClient.updateConfig: Success');
    } catch (error) {
      console.error('ApiClient.updateConfig: Network or parsing error:', error);
      throw error;
    }
  }
}
