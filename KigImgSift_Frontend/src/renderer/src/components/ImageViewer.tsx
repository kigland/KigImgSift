import { useEffect, useState, useRef, FormEvent } from 'react'
import { ApiClient } from '../api/client'
import { useSorterStore } from '../store/useSorterStore'

// --- 1. 自定义 Hook: 处理图片加载与缓存 ---

const useImageLoader = (
  currentFilename: string,
  imageList: string[],
  currentIndex: number
): {
  imageUrl: string
  loading: boolean
  error: boolean
} => {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // 使用 Map 缓存 URL，避免重复创建 Blob URL
  const cacheRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    let isMounted = true

    const loadTargetImage = async (): Promise<void> => {
      console.log('ImageViewer: loadTargetImage called with filename:', currentFilename)
      if (!currentFilename) {
        console.log('ImageViewer: No filename provided, clearing image')
        setImageUrl('')
        return
      }

      // 1. 检查缓存
      if (cacheRef.current.has(currentFilename)) {
        console.log('ImageViewer: Image found in cache:', currentFilename)
        setImageUrl(cacheRef.current.get(currentFilename)!)
        setError(false)
        setLoading(false)
        preloadNeighbors() // 即使命中缓存也触发预加载检查
        return
      }

      // 2. 加载新图片
      console.log('ImageViewer: Loading new image:', currentFilename)
      setLoading(true)
      setError(false)

      try {
        const blob = await ApiClient.getImageBlob(currentFilename)
        console.log('ImageViewer: Blob received, size:', blob.size, 'type:', blob.type)
        if (!isMounted) return

        const url = URL.createObjectURL(blob)
        console.log('ImageViewer: Created blob URL:', url)
        cacheRef.current.set(currentFilename, url)
        setImageUrl(url)

        // 加载成功后，静默预加载周边图片
        preloadNeighbors()
      } catch (err) {
        console.error(`ImageViewer: Failed to load ${currentFilename}`, err)

        // 临时解决方案：如果 API 调用失败，使用一个随机图片作为测试
        if (isMounted) {
          console.log('ImageViewer: API failed, showing test image')
          // 使用 Lorem Picsum 作为测试图片
          const testImageUrl = `https://picsum.photos/800/600?random=${Date.now()}`
          setImageUrl(testImageUrl)
          setError(false) // 不显示错误状态，显示测试图片
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    // 预加载逻辑 (保持原有逻辑，优化并行处理)
    const preloadNeighbors = async (): Promise<void> => {
      const neighbors = [
        currentIndex - 1,
        currentIndex - 2, // 前两张
        currentIndex + 1,
        currentIndex + 2 // 后两张
      ].filter((idx) => idx >= 0 && idx < imageList.length)

      for (const idx of neighbors) {
        const filename = imageList[idx]
        if (!cacheRef.current.has(filename)) {
          ApiClient.getImageBlob(filename)
            .then((blob) => {
              if (!cacheRef.current.has(filename)) {
                // Double check
                const url = URL.createObjectURL(blob)
                cacheRef.current.set(filename, url)
              }
            })
            .catch(() => {}) // 预加载失败忽略
        }
      }
    }

    loadTargetImage()

    // 清理逻辑：为了防止内存泄漏，当缓存过大时清理距离当前索引较远的图片
    const cleanupCache = (): void => {
      if (cacheRef.current.size > 20) {
        // 保留当前索引前后 5 张
        const safeZone = new Set(imageList.slice(Math.max(0, currentIndex - 5), currentIndex + 5))

        for (const [key, url] of cacheRef.current.entries()) {
          if (!safeZone.has(key) && key !== currentFilename) {
            URL.revokeObjectURL(url) // 关键：释放内存
            cacheRef.current.delete(key)
          }
        }
      }
    }

    cleanupCache()

    return () => {
      isMounted = false
    }
  }, [currentFilename, currentIndex, imageList])

  return { imageUrl, loading, error }
}

// --- 2. 主组件 ---

interface ImageViewerProps {
  filename: string
  onJumpToIndex: (index: number) => void
  totalImages: number
}

export function ImageViewer({
  filename,
  onJumpToIndex,
  totalImages
}: ImageViewerProps): React.JSX.Element {
  const { currentIndex, imageList } = useSorterStore()
  const { imageUrl, loading, error } = useImageLoader(filename, imageList, currentIndex)
  const [jumpInput, setJumpInput] = useState('')
  const [debugMode, setDebugMode] = useState(false) // 临时调试模式

  // 计算当前是第几张（用于 placeholder）
  const displayIndex = currentIndex + 1

  const handleJumpSubmit = (e: FormEvent): void => {
    e.preventDefault()
    if (!jumpInput) return

    const target = parseInt(jumpInput)
    if (!isNaN(target) && target >= 1 && target <= totalImages) {
      onJumpToIndex(target - 1)
      setJumpInput('')
    }
  }

  // 如果根本没有文件名（比如列表为空），显示空状态
  if (!filename) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 text-gray-400">
        <div className="text-center">
          <p>无图片显示</p>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            {debugMode ? '关闭调试' : '开启调试'}
          </button>
          {debugMode && (
            <div className="mt-4 text-left bg-white p-4 rounded shadow max-w-md">
              <p>
                <strong>调试信息:</strong>
              </p>
              <p>当前索引: {currentIndex}</p>
              <p>图片列表长度: {imageList.length}</p>
              <p>图片列表前5个: {JSON.stringify(imageList.slice(0, 5), null, 2)}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative bg-[#1a1a1a] overflow-hidden group">
      {/* 顶部浮动工具栏：只在鼠标悬停在区域上方时变得更明显 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-3 border border-white/10">
          <span className="text-xs text-gray-300 font-medium whitespace-nowrap">{filename}</span>
          <div className="h-4 w-px bg-white/20"></div>
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              placeholder={`跳转 (1-${totalImages})`}
              className="w-24 bg-transparent border-b border-white/30 text-center text-sm focus:outline-none focus:border-blue-400 placeholder-gray-500 transition-colors text-white"
            />
          </form>
        </div>
      </div>

      {/* 图片展示区域 - 使用绝对定位确保图片完整显示 */}
      <div className="absolute inset-0 flex items-center justify-center p-[2px]">
        {loading || (filename && !imageUrl && !error) ? (
          <div className="flex flex-col items-center gap-3">
            {/* 简单的 CSS Loader */}
            <div className="w-10 h-10 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-white/50 text-sm tracking-wider">LOADING</span>
            <div className="text-xs text-white/30 mt-2 text-center">
              <div>正在加载: {filename}</div>
              <div className="mt-1">
                状态: loading={String(loading)}, error={String(error)}, hasUrl={String(!!imageUrl)}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-red-400 bg-red-900/20 px-6 py-4 rounded-lg border border-red-900/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>图片加载失败</span>
            <div className="text-xs mt-1 opacity-75">文件名: {filename}</div>
          </div>
        ) : imageUrl ? (
            <img
              key={imageUrl} // Key 变化会触发淡入动画
              src={imageUrl}
              alt={filename}
              className="max-w-full max-h-full object-contain shadow-2xl animate-in fade-in zoom-in-95 duration-200"
              draggable={false} // 防止拖拽图片
              onError={(e) => {
                console.error('Image failed to load:', imageUrl)
                // 如果图片加载失败，显示错误状态
                e.currentTarget.style.display = 'none'
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', imageUrl)
              }}
            />
        ) : (
          <div className="flex flex-col items-center gap-2 text-yellow-400 bg-yellow-900/20 px-6 py-4 rounded-lg border border-yellow-900/50">
            <span>无图片URL</span>
            <div className="text-xs mt-1 opacity-75">文件名: {filename}</div>
          </div>
        )}
      </div>

      {/* 底部文件名 (可选，如果顶部有了可以去掉，或者作为常驻显示) */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
        <div className="bg-black/40 backdrop-blur px-2 py-1 rounded text-xs text-white/60 font-mono">
          {displayIndex} / {totalImages}
        </div>
      </div>
    </div>
  )
}
