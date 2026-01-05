import { create } from 'zustand'
import { ApiClient, ConfigResponse, CopyTarget } from '../api/client'

export interface Category {
  id: string
  name: string
  path: string
  shortcut: string
  countsAsEffective?: boolean // 是否视为有效筛选
}

// 导出 CopyTarget 类型供其他组件使用
export type { CopyTarget }

// Use ConfigResponse from API client for consistency
export type Config = ConfigResponse & {
  counterTarget?: number // 计数器目标值，0 表示无限制
}

export interface HistoryItem {
  filename: string
  fromPath: string
  toPath: string
  timestamp: number
  categoryId: string // 用于判断是否计入有效筛选，复制操作时为空字符串
  wasCopied: boolean // 是否为复制操作（用于撤回时判断是删除还是移回）
  isCopyTarget?: boolean // 是否为复制到复制目标的操作（true）还是分类操作（false）
  operationType: 'move' | 'copy' | 'skip' // 操作类型
  previousIndex?: number // 跳过操作前的索引位置，用于撤回
}

// 计数器持久化 key
const COUNTER_STORAGE_KEY = 'kigimgsift_effective_count'

// 从 localStorage 读取计数器
const loadCounterFromStorage = (): number => {
  try {
    const stored = localStorage.getItem(COUNTER_STORAGE_KEY)
    return stored ? parseInt(stored, 10) : 0
  } catch {
    return 0
  }
}

// 保存计数器到 localStorage
const saveCounterToStorage = (count: number): void => {
  try {
    localStorage.setItem(COUNTER_STORAGE_KEY, String(count))
  } catch {
    console.warn('Failed to save counter to localStorage')
  }
}

// 操作反馈类型
export interface ActionFeedback {
  type: 'category' | 'copy' | 'skip' | 'undo'
  label: string
  id: string // 用于高亮对应按钮
  timestamp: number
}

interface SorterStore {
  // 状态
  imageList: string[]
  currentIndex: number
  config: Config
  history: HistoryItem[]
  loading: boolean
  error: string | null

  // 操作反馈状态
  lastAction: ActionFeedback | null

  // 计数器状态
  effectiveCount: number
  targetReachedShown: boolean // 是否已显示过目标达成提示

  // 操作状态标志
  isUndoing: boolean // 是否正在执行撤回操作，防止重复触发

  // 操作
  loadImages: () => Promise<void>
  setCurrentIndex: (index: number) => void
  moveImage: (categoryId: string) => Promise<void>
  copyToTarget: (targetPath: string) => Promise<void> // 复制到指定路径，不跳转、不移除
  skipImage: () => void
  undo: () => Promise<void>
  loadConfig: () => Promise<void>
  saveConfig: (config: Config) => Promise<void>
  reset: () => void
  clearLastAction: () => void // 清除操作反馈

  // 计数器操作
  clearCounter: () => number // 返回清空前的值，用于撤回
  restoreCounter: (value: number) => void // 撤回清空
  setTargetReachedShown: (shown: boolean) => void
}

const defaultConfig: Config = {
  sourceDir: '../source_images',
  categories: [
    { id: 'frontal', name: '正脸', path: '../output/frontal', shortcut: '1', countsAsEffective: true },
    { id: 'side', name: '侧脸', path: '../output/side', shortcut: '2', countsAsEffective: true }
  ],
  copyTargets: [
    { id: 'copy1', name: '复制1', path: '../output/copy/1', shortcut: 'q' },
    { id: 'copy2', name: '复制2', path: '../output/copy/2', shortcut: 'w' }
  ],
  skipShortcut: ' ',
  undoShortcut: 'ctrl+z',
  copyMode: false,
  counterTarget: 0,
  feedbackDuration: 800 // 默认 800 毫秒
}

export const useSorterStore = create<SorterStore>((set, get) => ({
  // 初始状态
  imageList: [],
  currentIndex: 0,
  config: defaultConfig,
  history: [],
  loading: false,
  error: null,

  // 操作反馈初始状态
  lastAction: null,

  // 计数器初始状态（从 localStorage 恢复）
  effectiveCount: loadCounterFromStorage(),
  targetReachedShown: false,

  // 操作状态标志初始状态
  isUndoing: false,

  // 加载图片列表
  loadImages: async () => {
    set({ loading: true, error: null })
    try {
      const imageList = await ApiClient.getImages()
      set({
        imageList,
        currentIndex: 0,
        loading: false
      })
      console.log(`Loaded ${imageList.length} images`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载图片失败'
      set({
        error: errorMessage,
        loading: false
      })
      console.error(`Failed to load images: ${errorMessage}`)
    }
  },

  // 设置当前索引
  setCurrentIndex: (index: number) => {
    const { imageList } = get()
    if (index >= 0 && index < imageList.length) {
      set({ currentIndex: index })
    }
  },

  // 移动图片到指定分类
  moveImage: async (categoryId: string) => {
    const { imageList, currentIndex, config, history, effectiveCount } = get()
    if (currentIndex >= imageList.length) return

    const filename = imageList[currentIndex]
    const category = config.categories.find((c) => c.id === categoryId)
    if (!category) return

    try {
      await ApiClient.moveImage(filename, categoryId)

      // 记录历史用于撤回
      const historyItem: HistoryItem = {
        filename,
        fromPath: `${config.sourceDir}/${filename}`,
        toPath: `${category.path}/${filename}`,
        timestamp: Date.now(),
        categoryId,
        wasCopied: config.copyMode, // 记录是否为复制模式
        isCopyTarget: false, // 分类操作，不是复制到复制目标
        operationType: 'move' // 移动操作
      }

      // 移除当前图片，更新列表
      const newImageList = imageList.filter((_, index) => index !== currentIndex)
      const newHistory = [...history, historyItem]
      const newCurrentIndex =
        currentIndex >= newImageList.length ? Math.max(0, newImageList.length - 1) : currentIndex

      // 如果该分类视为有效筛选，增加计数器
      let newEffectiveCount = effectiveCount
      if (category.countsAsEffective !== false) { // 默认为 true
        newEffectiveCount = effectiveCount + 1
        saveCounterToStorage(newEffectiveCount)
      }

      set({
        imageList: newImageList,
        currentIndex: newCurrentIndex,
        history: newHistory,
        effectiveCount: newEffectiveCount,
        lastAction: {
          type: 'category',
          label: category.name,
          id: categoryId,
          timestamp: Date.now()
        }
      })

      console.log(`Moved "${filename}" to ${category.name}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '移动图片失败'
      set({
        error: errorMessage
      })
      console.error(`Failed to move image: ${errorMessage}`)
    }
  },

  // 复制图片到指定路径（不跳转、不移除、不计入有效筛选）
  copyToTarget: async (targetPath: string) => {
    const { imageList, currentIndex, config, history } = get()
    if (currentIndex >= imageList.length) return

    const filename = imageList[currentIndex]
    // 查找对应的复制目标名称
    const copyTarget = (config.copyTargets || []).find((t) => t.path === targetPath)

    try {
      const result = await ApiClient.copyImage(filename, targetPath)
      // 记录历史用于撤回
      const historyItem: HistoryItem = {
        filename,
        fromPath: `${config.sourceDir}/${filename}`,
        toPath: result.targetPath, // 使用最终的文件路径（可能被重命名）
        timestamp: Date.now(),
        categoryId: '', // 复制操作不计入有效筛选
        wasCopied: true, // 标记为复制操作
        isCopyTarget: true, // 标记为复制到复制目标的操作
        operationType: 'copy' // 复制操作
      }

      const newHistory = [...history, historyItem]

      // 设置操作反馈
      set({
        history: newHistory,
        lastAction: {
          type: 'copy',
          label: copyTarget?.name || '复制',
          id: copyTarget?.id || targetPath,
          timestamp: Date.now()
        }
      })
      console.log(`Copied "${filename}" to ${result.targetPath}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '复制图片失败'
      set({ error: errorMessage })
      console.error(`Failed to copy image: ${errorMessage}`)
    }
  },

  // 跳过图片
  skipImage: () => {
    const { currentIndex, imageList, history } = get()
    if (currentIndex < imageList.length - 1) {
      const filename = imageList[currentIndex]
      // 记录历史用于撤回
      const historyItem: HistoryItem = {
        filename,
        fromPath: '', // 跳过操作不需要路径
        toPath: '',
        timestamp: Date.now(),
        categoryId: '', // 跳过操作不计入有效筛选
        wasCopied: false,
        isCopyTarget: false,
        operationType: 'skip', // 跳过操作
        previousIndex: currentIndex // 记录跳过前的索引
      }
      
      set({
        currentIndex: currentIndex + 1,
        history: [...history, historyItem],
        lastAction: {
          type: 'skip',
          label: '跳过',
          id: '__skip__',
          timestamp: Date.now()
        }
      })
    }
  },

  // 撤回操作
  undo: async () => {
    const { history, config, effectiveCount, currentIndex, isUndoing } = get()
    
    // 防止重复执行：如果正在执行撤回操作，直接返回
    if (isUndoing) {
      console.warn('Undo operation already in progress, ignoring duplicate request')
      return
    }
    
    if (history.length === 0) {
      console.warn('No actions to undo')
      return
    }

    // 设置正在执行标志
    set({ isUndoing: true })

    const lastHistoryItem = history[history.length - 1]
    
    // 处理跳过操作的撤回
    if (lastHistoryItem.operationType === 'skip') {
      // 跳过操作只需要回退索引，不需要调用 API
      const newHistory = history.slice(0, -1)
      const previousIndex = lastHistoryItem.previousIndex ?? currentIndex
      
      set({
        history: newHistory,
        currentIndex: Math.max(0, previousIndex),
        isUndoing: false,
        lastAction: {
          type: 'undo',
          label: '撤回',
          id: '__undo__',
          timestamp: Date.now()
        }
      })
      
      console.log(`Undid skip, returning to index ${previousIndex}`)
      return
    }
    
    // 处理移动和复制操作的撤回
    try {
      await ApiClient.undoMove(lastHistoryItem.filename, lastHistoryItem.fromPath, lastHistoryItem.toPath, lastHistoryItem.wasCopied)

      // 从历史中移除
      const newHistory = history.slice(0, -1)

      // 如果撤销的操作对应的分类视为有效筛选，减少计数器（复制到复制目标的操作不计入有效筛选）
      let newEffectiveCount = effectiveCount
      if (!lastHistoryItem.isCopyTarget) {
        // 只有分类操作才可能影响计数器
        const category = config.categories.find((c) => c.id === lastHistoryItem.categoryId)
        if (category && category.countsAsEffective !== false) {
          newEffectiveCount = Math.max(0, effectiveCount - 1)
          saveCounterToStorage(newEffectiveCount)
        }
      }

      set({
        history: newHistory,
        effectiveCount: newEffectiveCount,
        isUndoing: false, // 重置标志
        lastAction: {
          type: 'undo',
          label: '撤回',
          id: '__undo__',
          timestamp: Date.now()
        }
      })

      // 只有分类操作（非复制到复制目标）才需要重新加载图片列表
      // 复制到复制目标的操作不改变源文件夹，所以不需要重新加载
      if (!lastHistoryItem.isCopyTarget) {
        try {
          // 重新加载图片列表，但保持当前位置或跳转到恢复的图片
          const imageList = await ApiClient.getImages()

          // 找到恢复的图片在新列表中的位置
          const restoredIndex = imageList.indexOf(lastHistoryItem.filename)
          // 如果找到了恢复的图片，跳转到它；否则保持当前位置
          const newIndex = restoredIndex >= 0 ? restoredIndex : Math.min(currentIndex, imageList.length - 1)

          set({
            imageList,
            currentIndex: Math.max(0, newIndex),
            loading: false,
            isUndoing: false // 确保在重新加载完成后重置标志
          })

          console.log(`Undid move of "${lastHistoryItem.filename}", jumping to index ${newIndex}`)
        } catch (reloadError) {
          // 如果重新加载失败，也要重置标志
          console.error(`Failed to reload images after undo: ${reloadError}`)
          set({ isUndoing: false, loading: false })
        }
      } else {
        console.log(`Undid copy of "${lastHistoryItem.filename}"`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '撤销操作失败'
      set({
        error: errorMessage,
        isUndoing: false // 发生错误时也要重置标志
      })
      console.error(`Failed to undo: ${errorMessage}`)
    }
  },

  // 加载配置
  loadConfig: async () => {
    try {
      const config = await ApiClient.getConfig()
      set({ config })
    } catch (error) {
      // 如果加载配置失败，使用默认配置
      console.warn('加载配置失败，使用默认设置:', error)
      set({ config: defaultConfig })
    }
  },

  // 保存配置
  saveConfig: async (config: Config) => {
    try {
      await ApiClient.updateConfig(config)
      set({ config })
      console.log('Configuration saved successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存配置失败'
      set({
        error: errorMessage
      })
      console.error(`Failed to save config: ${errorMessage}`)
    }
  },

  // 重置状态
  reset: () => {
    set({
      imageList: [],
      currentIndex: 0,
      history: [],
      loading: false,
      error: null,
      lastAction: null,
      isUndoing: false
    })
  },

  // 清除操作反馈
  clearLastAction: () => {
    set({ lastAction: null })
  },

  // 清空计数器，返回清空前的值用于撤回
  clearCounter: () => {
    const { effectiveCount } = get()
    const previousValue = effectiveCount
    saveCounterToStorage(0)
    set({ effectiveCount: 0, targetReachedShown: false })
    return previousValue
  },

  // 恢复计数器（用于撤回清空操作）
  restoreCounter: (value: number) => {
    saveCounterToStorage(value)
    set({ effectiveCount: value })
  },

  // 设置目标达成提示是否已显示
  setTargetReachedShown: (shown: boolean) => {
    set({ targetReachedShown: shown })
  }
}))
