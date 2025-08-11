export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      <div className="ml-4 text-xl text-gray-600">正在加载...</div>
    </div>
  )
} 