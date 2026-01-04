import { useEffect, useState } from 'react';
import { useSorterStore } from './store/useSorterStore';
import { TopBar } from './components/TopBar';
import { ImageViewer } from './components/ImageViewer';
import { BottomBar } from './components/BottomBar';
import { SettingsModal } from './components/SettingsModal';

function App(): React.JSX.Element {
  const {
    imageList,
    currentIndex,
    loading,
    error,
    config,
    loadImages,
    setCurrentIndex,
    moveImage,
    skipImage,
    undo,
    loadConfig,
  } = useSorterStore();

  const [showSettings, setShowSettings] = useState(false);

  // Initialize app
  useEffect(() => {
    loadConfig();
    loadImages();
  }, [loadConfig, loadImages]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (loading || imageList.length === 0) return;

      // Handle Ctrl+Z for undo
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        undo();
        return;
      }

      // Handle category shortcuts
      const category = config.categories.find(c => c.shortcut === event.key);
      if (category) {
        event.preventDefault();
        moveImage(category.id);
        return;
      }

      // Handle skip shortcut
      if (event.key === config.skipShortcut) {
        event.preventDefault();
        skipImage();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [loading, imageList.length, config, moveImage, skipImage, undo]);

  const currentFilename = imageList[currentIndex] || '';
  const progress = imageList.length > 0 ? `${currentIndex + 1} / ${imageList.length}` : '0 / 0';

  if (loading && imageList.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">正在加载图片...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-red-600 mb-4">{error}</div>
        <button
          onClick={loadImages}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (imageList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600 mb-4 text-center">
          No images found in source directory.
          <br />
          Please add images to: {config.sourceDir}
        </div>
        <div className="flex gap-4">
          <button
            onClick={loadImages}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopBar
        sourceDir={config.sourceDir}
        progress={progress}
        onSettingsClick={() => setShowSettings(true)}
      />
      <ImageViewer
        filename={currentFilename}
        onJumpToIndex={setCurrentIndex}
        totalImages={imageList.length}
      />
      <BottomBar
        categories={config.categories}
        skipShortcut={config.skipShortcut}
        onCategoryClick={moveImage}
        onSkipClick={skipImage}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

export default App;
