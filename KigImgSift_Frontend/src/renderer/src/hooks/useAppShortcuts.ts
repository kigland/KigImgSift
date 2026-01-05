import { useEffect } from 'react'
import { useSorterStore } from '../store/useSorterStore'

/**
 * 从键盘事件构建快捷键字符串（用于匹配）
 */
function buildShortcutFromEvent(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey) parts.push('ctrl')
  if (e.metaKey) parts.push('meta')
  if (e.altKey) parts.push('alt')
  if (e.shiftKey) parts.push('shift')
  parts.push(e.key.toLowerCase())
  return parts.join('+')
}

/**
 * 检查键盘事件是否匹配配置的快捷键
 * 支持组合键（如 ctrl+z）和单键（如 space）
 */
function matchShortcut(event: KeyboardEvent, shortcut: string): boolean {
  if (!shortcut) return false

  const configShortcut = shortcut.toLowerCase()
  const hasModifierInConfig = configShortcut.includes('+')
  const hasModifierPressed = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey

  if (hasModifierInConfig) {
    // 组合键匹配
    const eventShortcut = buildShortcutFromEvent(event)
    return eventShortcut === configShortcut
  } else {
    // 单键匹配：只有没有按下修饰键时才匹配
    if (hasModifierPressed) return false
    return event.key.toLowerCase() === configShortcut.toLowerCase()
  }
}

/**
 * 集中管理全局快捷键逻辑
 */
export const useAppShortcuts = (): void => {
  const { loading, imageList, config, moveImage, copyToTarget, skipImage, undo } = useSorterStore()

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

      // 2. 撤回快捷键（从配置读取，默认 ctrl+z）
      const undoShortcut = config.undoShortcut || 'ctrl+z'
      if (matchShortcut(event, undoShortcut)) {
        event.preventDefault()
        undo()
        return
      }

      // 3. 复制目标快捷键（复制到独立文件夹，不跳转）
      const copyTargets = config.copyTargets || []
      const copyTarget = copyTargets.find((t) => matchShortcut(event, t.shortcut))
      if (copyTarget) {
        event.preventDefault()
        copyToTarget(copyTarget.path)
        return
      }

      // 4. 分类快捷键（正常移动/复制操作）
      const category = config.categories.find((c) => matchShortcut(event, c.shortcut))
      if (category) {
        event.preventDefault()
        moveImage(category.id)
        return
      }

      // 5. 跳过快捷键
      if (matchShortcut(event, config.skipShortcut)) {
        event.preventDefault()
        skipImage()
        return
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [loading, imageList.length, config, moveImage, copyToTarget, skipImage, undo])
}
