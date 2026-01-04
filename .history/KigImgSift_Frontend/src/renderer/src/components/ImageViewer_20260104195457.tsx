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
  const imageList = useSorterStore(state => state.imageList);
  const preloadRefs = useRef<Map<string, string>>(new Map());

  // Preload images around current index
  const preloadImages = async (centerIndex: number) => {
    const preloadIndices = [];
    // Preload previous 2, current, and next 2 images
    for (let i = centerIndex - 2; i <= centerIndex + 2; i++) {
      if (i >= 0 && i < imageList.length && i !== centerIndex) {
        preloadIndices.push(i);
      }
    }

    // Load images in parallel but don't wait
    preloadIndices.forEach(async (index) => {
      const preloadFilename = imageList[index];
      if (preloadFilename && !preloadRefs.current.has(preloadFilename)) {
        try {
          const blob = await ApiClient.getImageBlob(preloadFilename);
          const url = URL.createObjectURL(blob);
          preloadRefs.current.set(preloadFilename, url);
        } catch (error) {
          // Silent fail for preload
          console.warn('Failed to preload image:', preloadFilename, error);
        }
      }
    });
  };

  // Load image when filename changes
  useEffect(() => {
    if (!filename) {
      setImageUrl('');
      return;
    }

    // Check if image is already preloaded
    const preloadedUrl = preloadRefs.current.get(filename);
    if (preloadedUrl) {
      setImageUrl(preloadedUrl);
      setLoading(false);
      return;
    }

    const loadImage = async () => {
      setLoading(true);
      try {
        const blob = await ApiClient.getImageBlob(filename);
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
        preloadRefs.current.set(filename, url);

        // Start preloading other images
        preloadImages(currentIndex);
      } catch (error) {
        console.error('Failed to load image:', error);
        setImageUrl('');
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup function - don't cleanup current image URL as it's being used
    return () => {
      // Only cleanup very old preloaded images to prevent memory leaks
      if (preloadRefs.current.size > 20) {
        const currentKeys = new Set(imageList.slice(Math.max(0, currentIndex - 5), currentIndex + 5));
        for (const [key, url] of preloadRefs.current.entries()) {
          if (!currentKeys.has(key) && url !== imageUrl) {
            URL.revokeObjectURL(url);
            preloadRefs.current.delete(key);
          }
        }
      }
    };
  }, [filename, currentIndex, imageList]);

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
      <div className="image-container">
        <div className="text-gray-500">No images to display</div>
      </div>
    );
  }

  return (
    <div className="image-viewer">
      {/* Jump controls */}
      <div className="jump-controls">
        <form onSubmit={handleJumpSubmit} className="jump-form">
          <label className="jump-label">Jump to:</label>
          <input
            type="number"
            min="1"
            max={totalImages}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            placeholder={`${currentIndex + 1}`}
            className="jump-input"
          />
          <button
            type="submit"
            className="jump-button"
          >
            Go
          </button>
        </form>
      </div>

      {/* Image display */}
      <div className="image-container">
        {loading ? (
          <div className="loading">Loading image...</div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={filename}
            className="main-image"
          />
        ) : (
          <div className="error">Failed to load image: {filename}</div>
        )}
      </div>
    </div>
  );
}
