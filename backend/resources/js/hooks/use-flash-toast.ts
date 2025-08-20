import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function useFlashToast(
  errors?: Record<string, string>,
  flash?: { success?: string }
) {
  const hasShownSuccess = useRef(false)

  useEffect(() => {
    if (errors) {
      Object.entries(errors).forEach(([key, value]) => {
        toast.error(`${key}: ${value}`, { duration: 3000 })
      })
    }
  }, [errors])

  useEffect(() => {
    if (flash?.success && !hasShownSuccess.current) {
      toast.success(flash.success, { duration: 3000 })
      hasShownSuccess.current = true
    }
  }, [flash?.success])
}
