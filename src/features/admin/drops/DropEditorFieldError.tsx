/** Inline validation message under drop editor fields. */
export function DropEditorFieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 text-[11px] text-red-300">
      {message}
    </p>
  )
}
