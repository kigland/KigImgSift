import { useState, useEffect } from 'react';
import { useSorterStore, Category } from '../store/useSorterStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { config, saveConfig, loadImages } = useSorterStore();
  const [localConfig, setLocalConfig] = useState(config);
  const [recordingShortcut, setRecordingShortcut] = useState<string | null>(null);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  const handleSave = async () => {
    await saveConfig(localConfig);
    await loadImages(); // Reload images in case source dir changed
    onClose();
  };

  const handleAddCategory = () => {
    if (localConfig.categories.length >= 10) return;

    const newCategory: Category = {
      id: `category_${Date.now()}`,
      name: '新分类',
      path: '../output/new_category',
      shortcut: '',
    };

    setLocalConfig({
      ...localConfig,
      categories: [...localConfig.categories, newCategory],
    });
  };

  const handleRemoveCategory = (index: number) => {
    const newCategories = localConfig.categories.filter((_, i) => i !== index);
    setLocalConfig({
      ...localConfig,
      categories: newCategories,
    });
  };

  const handleCategoryChange = (index: number, field: keyof Category, value: string) => {
    const newCategories = [...localConfig.categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setLocalConfig({
      ...localConfig,
      categories: newCategories,
    });
  };

  const handleShortcutRecord = (categoryId: string) => {
    setRecordingShortcut(categoryId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recordingShortcut) return;

    e.preventDefault();
    const key = e.key;

    // Update the shortcut for the recording category
    const newCategories = localConfig.categories.map(cat =>
      cat.id === recordingShortcut ? { ...cat, shortcut: key } : cat
    );

    setLocalConfig({
      ...localConfig,
      categories: newCategories,
    });

    setRecordingShortcut(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">设置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Source Directory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              源文件夹
            </label>
            <input
              type="text"
              value={localConfig.sourceDir}
              onChange={(e) => setLocalConfig({ ...localConfig, sourceDir: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="../source_images"
            />
          </div>

          {/* Skip Shortcut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              跳过快捷键
            </label>
            <input
              type="text"
              value={localConfig.skipShortcut}
              onChange={(e) => setLocalConfig({ ...localConfig, skipShortcut: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder=" "
            />
          </div>

          {/* Copy Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文件操作模式
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="copyMode"
                  checked={!localConfig.copyMode}
                  onChange={() => setLocalConfig({ ...localConfig, copyMode: false })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">移动文件</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="copyMode"
                  checked={localConfig.copyMode}
                  onChange={() => setLocalConfig({ ...localConfig, copyMode: true })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">复制文件</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {localConfig.copyMode
                ? "文件将被复制到分类文件夹（原文件保留）"
                : "文件将被移动到分类文件夹（原文件被删除）"
              }
            </p>
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                分类 ({localConfig.categories.length}/10)
              </label>
              <button
                onClick={handleAddCategory}
                disabled={localConfig.categories.length >= 10}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <span className="text-lg">+</span>
                添加分类
              </button>
            </div>

            <div className="space-y-3">
              {localConfig.categories.map((category, index) => (
                <div key={category.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">名称</label>
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">快捷键</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={category.shortcut}
                          readOnly
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                        />
                        <button
                          onClick={() => handleShortcutRecord(category.id)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            recordingShortcut === category.id
                              ? 'bg-red-600 text-white'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {recordingShortcut === category.id ? '录制中...' : '录制'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Path</label>
                      <input
                        type="text"
                        value={category.path}
                        onChange={(e) => handleCategoryChange(index, 'path', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCategory(index)}
                    className="text-red-600 hover:text-red-800 transition-colors text-xl font-bold"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>

        {/* Invisible input for recording shortcuts */}
        {recordingShortcut && (
          <input
            autoFocus
            onKeyDown={handleKeyDown}
            onBlur={() => setRecordingShortcut(null)}
            className="absolute opacity-0 pointer-events-none"
          />
        )}
      </div>
    </div>
  );
}
