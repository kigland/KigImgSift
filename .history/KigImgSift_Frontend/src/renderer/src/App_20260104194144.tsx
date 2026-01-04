import { useState, useEffect } from 'react';
import { ApiClient } from './api/client';
import './App.css';

function App(): React.JSX.Element {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Load images on component mount
  useEffect(() => {
    loadImages();
  }, []);

  // Load current image when index changes
  useEffect(() => {
    if (images.length > 0 && currentIndex < images.length) {
      loadCurrentImage();
    }
  }, [currentIndex, images]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (loading || images.length === 0) return;

      switch (event.key) {
        case '1':
          handleMove('frontal');
          break;
        case '2':
          handleMove('side');
          break;
        case ' ':
          handleSkip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, images, loading]);

  const loadImages = async () => {
    console.log('App.loadImages: Starting to load images...');
    try {
      setLoading(true);
      setError('');
      console.log('App.loadImages: Calling ApiClient.getImages()...');
      const imageList = await ApiClient.getImages();
      console.log('App.loadImages: Received image list:', imageList);
      setImages(imageList);
      setCurrentIndex(0);
      console.log('App.loadImages: Successfully set images and currentIndex');
    } catch (err) {
      console.error('App.loadImages: Error occurred:', err);
      console.error('App.loadImages: Error type:', typeof err);
      console.error('App.loadImages: Error message:', err instanceof Error ? err.message : String(err));
      console.error('App.loadImages: Error stack:', err instanceof Error ? err.stack : 'No stack trace');
      setError('Failed to load images. Make sure the backend is running.');
      console.error('Failed to load images:', err);
    } finally {
      setLoading(false);
      console.log('App.loadImages: Finished loading, setting loading to false');
    }
  };

  const loadCurrentImage = async () => {
    if (currentIndex >= images.length) {
      console.log('App.loadCurrentImage: currentIndex >= images.length, skipping');
      return;
    }

    const filename = images[currentIndex];
    console.log('App.loadCurrentImage: Loading image at index', currentIndex, 'filename:', filename);

    try {
      console.log('App.loadCurrentImage: Calling ApiClient.getImageBlob for', filename);
      const blob = await ApiClient.getImageBlob(filename);
      console.log('App.loadCurrentImage: Received blob, creating object URL');
      const url = URL.createObjectURL(blob);
      console.log('App.loadCurrentImage: Created URL:', url.substring(0, 50) + '...');
      setCurrentImageUrl(url);
      console.log('App.loadCurrentImage: Successfully set currentImageUrl');
    } catch (err) {
      console.error('App.loadCurrentImage: Error loading image', filename, ':', err);
      console.error('App.loadCurrentImage: Error type:', typeof err);
      console.error('App.loadCurrentImage: Error message:', err instanceof Error ? err.message : String(err));
      setError(`Failed to load image: ${images[currentIndex]}`);
      console.error('Failed to load image:', err);
    }
  };

  const handleMove = async (targetType: 'frontal' | 'side') => {
    if (currentIndex >= images.length) return;

    try {
      const filename = images[currentIndex];
      await ApiClient.moveImage(filename, targetType);

      // Remove the moved image from the list and move to next
      const newImages = images.filter((_, index) => index !== currentIndex);
      setImages(newImages);

      // If we removed the last image, stay at the current position
      if (currentIndex >= newImages.length) {
        setCurrentIndex(Math.max(0, newImages.length - 1));
      }
    } catch (err) {
      setError(`Failed to move image: ${images[currentIndex]}`);
      console.error('Failed to move image:', err);
    }
  };

  const handleSkip = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentFilename = images[currentIndex] || '';
  const remainingCount = images.length;

  console.log('App render: loading =', loading, ', error =', error, ', images.length =', images.length);

  if (loading && images.length === 0) {
    console.log('App render: Showing loading screen');
    return (
      <div className="app">
        <div className="loading">Loading images...</div>
      </div>
    );
  }

  if (error) {
    console.log('App render: Showing error screen:', error);
    return (
      <div className="app">
        <div className="error">{error}</div>
        <button onClick={loadImages} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    console.log('App render: Showing no images screen');
    return (
      <div className="app">
        <div className="no-images">
          No images found in source_images directory.
          <br />
          <button onClick={loadImages} className="retry-button">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <div className="info">
          当前: {currentFilename} | 剩余: {remainingCount}
        </div>
        <div className="instructions">
          按 '1' 分类为正脸 | 按 '2' 分类为侧脸 | 按 '空格' 跳过
        </div>
      </div>

      <div className="image-container">
        {currentImageUrl && (
          <img
            src={currentImageUrl}
            alt={currentFilename}
            className="main-image"
            onLoad={() => setLoading(false)}
          />
        )}
      </div>

      <div className="controls">
        <button onClick={() => handleMove('frontal')} className="control-button frontal">
          1 - 正脸 (Frontal)
        </button>
        <button onClick={() => handleMove('side')} className="control-button side">
          2 - 侧脸 (Side)
        </button>
        <button onClick={handleSkip} className="control-button skip">
          空格 - 跳过 (Skip)
        </button>
      </div>
    </div>
  );
}

export default App;
