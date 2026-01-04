import { useEffect } from 'react'
import { useSorterStore } from '../store/useSorterStore'

/**
 * 集中管理全局快捷键逻辑
 */
export const useAppShortcuts = () => {
  const { loading, imageList, config, moveImage, skipImage, undo } = useSorterStore()

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent): void => {
      // 1. 如果正在加载或没有图片，或者用户正在输入框内输入(防止快捷键冲突)，则不处理
      if (
        loading ||
        imageList.length === 0 ||
        ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)
      ) {
        return
      }

      // 2. 撤回 (Ctrl + Z)
      if (event.ctrlKey && (event.key === 'z' || event.key === 'Z')) {
        event.preventDefault()
        undo()
        return
      }

      // 3. 分类快捷键
      // 注意：这里要做大小写不敏感处理，或者确保 config.shortcut 存储的是标准 key
      const category = config.categories.find(
        (c) => c.shortcut.toLowerCase() === event.key.toLowerCase()
      )

      if (category) {
        event.preventDefault()
        moveImage(category.id)
        return
      }

      // 4. 跳过快捷键
      if (event.key.toLowerCase() === config.skipShortcut.toLowerCase()) {
        event.preventDefault()
        skipImage()
        return
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [loading, imageList.length, config, moveImage, skipImage, undo])
}
