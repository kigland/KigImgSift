import { useEffect, useState, useRef } from 'react';
import { ApiClient } from '../api/client';
import { useSorterStore } from '../store/useSorterStore';

interface ImageViewerProps {
  filename: string;
  onJumpToIndex: (index: number) => void;
  totalImages: number;
}

export function ImageViewer({ filename, onJumpToIndex, totalImages }: ImageViewerProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const currentIndex = useSorterStore(state => state.currentIndex);
  const preloadRefs = useRef<Map<string, string>>(new Map());

  // Load image when filename changes
  useEffect(() => {
    if (!filename) {
      setImageUrl('');
      return;
    }

    const loadImage = async () => {
      setLoading(true);
      try {
        const blob = await ApiClient.getImageBlob(filename);
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (error) {
        console.error('Failed to load image:', error);
        setImageUrl('');
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup previous URL
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [filename]);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const index = parseInt(jumpInput) - 1; // Convert to 0-based index
    if (index >= 0 && index < totalImages) {
      onJumpToIndex(index);
      setJumpInput('');
    }
  };

  if (!filename) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">No images to display</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* Jump controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <form onSubmit={handleJumpSubmit} className="flex items-center gap-4">
          <label className="text-sm text-gray-600">Jump to:</label>
          <input
            type="number"
            min="1"
            max={totalImages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder={`${currentIndex + 1}`}
            className="px-3 py-1 border border-gray-300 rounded text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Go
          </button>
        </form>
      </div>

      {/* Image display */}
      <div className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <div className="text-gray-600">Loading image...</div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={filename}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        ) : (
          <div className="text-red-600">Failed to load image: {filename}</div>
        )}
      </div>
    </div>
  );
}
