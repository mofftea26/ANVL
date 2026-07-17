import { useSetVisibilityMutation } from '@/features/passport/hooks/usePassport'
import { Switch } from '@/shared/components/ui/Switch'

/**
 * Per-piece sharing control on the Armory grid card — the house Switch with a
 * live Public/Private label: public pieces show on the shared armory (and the
 * passport engraves the owner's name); private ones stay yours alone. Same
 * RPC as the passport's visibility toggle.
 */
export function PieceShareSwitch({
  token,
  isPublic,
}: {
  token: string
  isPublic: boolean
}) {
  const setVisibility = useSetVisibilityMutation()

  return (
    <Switch
      size="sm"
      checked={isPublic}
      disabled={setVisibility.isPending}
      onChange={(next) => setVisibility.mutate({ token, isPublic: next })}
      label={isPublic ? 'Public' : 'Private'}
    />
  )
}
