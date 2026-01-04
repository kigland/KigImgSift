import { create } from 'zustand'
import { ApiClient, ConfigResponse } from '../api/client'

export interface Category {
  id: string
  name: string
  path: string
  shortcut: string
}

// Use ConfigResponse from API client for consistency
export type Config = ConfigResponse

export interface HistoryItem {
  filename: string
  fromPath: string
  toPath: string
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

  // 操作
  loadImages: () => Promise<void>
  setCurrentIndex: (index: number) => void
  moveImage: (categoryId: string) => Promise<void>
  skipImage: () => void
  undo: () => Promise<void>
  loadConfig: () => Promise<void>
  saveConfig: (config: Config) => Promise<void>
  reset: () => void
}

const defaultConfig: Config = {
  sourceDir: '../source_images',
  categories: [
    { id: 'frontal', name: '正脸', path: '../output/frontal', shortcut: '1' },
    { id: 'side', name: '侧脸', path: '../output/side', shortcut: '2' }
  ],
  skipShortcut: ' ',
  copyMode: false
}

export const useSorterStore = create<SorterStore>((set, get) => ({
  // 初始状态
  imageList: [],
  currentIndex: 0,
  config: defaultConfig,
  history: [],
  loading: false,
  error: null,

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
    const { imageList, currentIndex, config, history } = get()
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
        timestamp: Date.now()
      }

      // 移除当前图片，更新列表
      const newImageList = imageList.filter((_, index) => index !== currentIndex)
      const newHistory = [...history, historyItem]
      const newCurrentIndex =
        currentIndex >= newImageList.length ? Math.max(0, newImageList.length - 1) : currentIndex

      set({
        imageList: newImageList,
        currentIndex: newCurrentIndex,
        history: newHistory
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
    const { history } = get()
    if (history.length === 0) {
      console.warn('No actions to undo')
      return
    }

    const lastAction = history[history.length - 1]
    try {
      await ApiClient.undoMove(lastAction.filename, lastAction.fromPath, lastAction.toPath)

      // 从历史中移除，并重新加载图片列表
      const newHistory = history.slice(0, -1)
      set({ history: newHistory })

      // 重新加载图片列表
      await get().loadImages()

      console.log(`Undid move of "${lastAction.filename}"`)
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
  }
}))
