import { Category } from '../store/useSorterStore';

interface BottomBarProps {
  categories: Category[];
  skipShortcut: string;
  onCategoryClick: (categoryId: string) => void;
  onSkipClick: () => void;
}

export function BottomBar({ categories, skipShortcut, onCategoryClick, onSkipClick }: BottomBarProps) {
  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Keyboard shortcuts display */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="font-medium">快捷键:</span>
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                {category.shortcut}
              </kbd>
              <span>{category.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
              {skipShortcut === ' ' ? 'Space' : skipShortcut}
            </kbd>
            <span>跳过</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
              Ctrl+Z
            </kbd>
            <span>撤销</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.id)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {category.shortcut} - {category.name}
            </button>
          ))}
          <button
            onClick={onSkipClick}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            {skipShortcut === ' ' ? '空格' : skipShortcut} - 跳过
          </button>
        </div>
      </div>
    </div>
  );
}
