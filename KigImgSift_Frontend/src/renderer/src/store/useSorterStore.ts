import { create } from 'zustand'
import { ApiClient, ConfigResponse } from '../api/client'

export interface Category {
  id: string
  name: string
  path: string
  shortcut: string
  countsAsEffective?: boolean // 是否视为有效筛选
}

// Use ConfigResponse from API client for consistency
export type Config = ConfigResponse & {
  counterTarget?: number // 计数器目标值，0 表示无限制
}

export interface HistoryItem {
  filename: string
  fromPath: string
  toPath: string
  timestamp: number
  categoryId: string // 用于判断是否计入有效筛选
  wasCopied: boolean // 是否为复制操作（用于撤回时判断是删除还是移回）
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

interface SorterStore {
  // 状态
  imageList: string[]
  currentIndex: number
  config: Config
  history: HistoryItem[]
  loading: boolean
  error: string | null

  // 计数器状态
  effectiveCount: number
  targetReachedShown: boolean // 是否已显示过目标达成提示

  // 操作
  loadImages: () => Promise<void>
  setCurrentIndex: (index: number) => void
  moveImage: (categoryId: string) => Promise<void>
  skipImage: () => void
  undo: () => Promise<void>
  loadConfig: () => Promise<void>
  saveConfig: (config: Config) => Promise<void>
  reset: () => void

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
  skipShortcut: ' ',
  copyMode: false,
  counterTarget: 0 // 0 表示无限制
}

export const useSorterStore = create<SorterStore>((set, get) => ({
  // 初始状态
  imageList: [],
  currentIndex: 0,
  config: defaultConfig,
  history: [],
  loading: false,
  error: null,

  // 计数器初始状态（从 localStorage 恢复）
  effectiveCount: loadCounterFromStorage(),
  targetReachedShown: false,

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
        wasCopied: config.copyMode // 记录是否为复制模式
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
        effectiveCount: newEffectiveCount
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

  // 跳过图片
  skipImage: () => {
    const { currentIndex, imageList } = get()
    if (currentIndex < imageList.length - 1) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  // 撤回操作
  undo: async () => {
    const { history, config, effectiveCount, currentIndex } = get()
    if (history.length === 0) {
      console.warn('No actions to undo')
      return
    }

    const lastAction = history[history.length - 1]
    try {
      await ApiClient.undoMove(lastAction.filename, lastAction.fromPath, lastAction.toPath, lastAction.wasCopied)

      // 从历史中移除
      const newHistory = history.slice(0, -1)

      // 如果撤销的操作对应的分类视为有效筛选，减少计数器
      const category = config.categories.find((c) => c.id === lastAction.categoryId)
      let newEffectiveCount = effectiveCount
      if (category && category.countsAsEffective !== false) {
        newEffectiveCount = Math.max(0, effectiveCount - 1)
        saveCounterToStorage(newEffectiveCount)
      }

      set({ history: newHistory, effectiveCount: newEffectiveCount })

      // 重新加载图片列表，但保持当前位置或跳转到恢复的图片
      const imageList = await ApiClient.getImages()

      // 找到恢复的图片在新列表中的位置
      const restoredIndex = imageList.indexOf(lastAction.filename)
      // 如果找到了恢复的图片，跳转到它；否则保持当前位置
      const newIndex = restoredIndex >= 0 ? restoredIndex : Math.min(currentIndex, imageList.length - 1)

      set({
        imageList,
        currentIndex: Math.max(0, newIndex),
        loading: false
      })

      console.log(`Undid move of "${lastAction.filename}", jumping to index ${newIndex}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '撤销操作失败'
      set({
        error: errorMessage
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
      error: null
    })
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
