import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import GoogleConnectButton from '@/components/config/GoogleConnectButton'
import MetaConnectButton from '@/components/config/MetaConnectButton'

export default async function ConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { success, error } = await searchParams
  const supabase = await createClient()

  const [{ data: googleToken }, { data: metaToken }] = await Promise.all([
    supabase
      .from('oauth_tokens')
      .select('scope, expires_at, updated_at')
      .eq('plataforma', 'google')
      .eq('token_type', 'global')
      .maybeSingle(),
    supabase
      .from('oauth_tokens')
      .select('expires_at, updated_at')
      .eq('plataforma', 'meta')
      .eq('token_type', 'global')
      .maybeSingle(),
  ])

  const isConnected = !!googleToken
  const isMetaConnected = !!metaToken

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Configuración" />
      <div className="p-8 max-w-2xl space-y-8">

        {/* Feedback banners */}
        {success === 'google' && (
          <div className="bg-[#edfaf2] border border-[#1a7a4a] border-l-4 border-l-[#1a7a4a] px-5 py-3">
            <p className="font-mono text-xs text-[#1a7a4a]">✓ Google conectado correctamente. Ya puedes ver datos reales.</p>
          </div>
        )}
        {success === 'meta' && (
          <div className="bg-[#edfaf2] border border-[#1a7a4a] border-l-4 border-l-[#1a7a4a] px-5 py-3">
            <p className="font-mono text-xs text-[#1a7a4a]">✓ Meta Ads conectado correctamente.</p>
          </div>
        )}
        {error && (
          <div className="bg-[#fff0f2] border border-[#F7415C] border-l-4 border-l-[#F7415C] px-5 py-3">
            <p className="font-mono text-xs text-[#F7415C]">
              {error === 'google_denied' ? 'Cancelaste la conexión con Google.' :
               error === 'meta_denied'  ? 'Cancelaste la conexión con Meta.' :
               error === 'meta_failed'  ? 'Error al conectar con Meta. Inténtalo de nuevo.' :
               'Error al conectar. Inténtalo de nuevo.'}
            </p>
          </div>
        )}

        {/* Section header */}
        <div className="pb-4 border-b-2 border-[#000000]">
          <h2 className="font-display text-2xl font-bold">Conexiones</h2>
        </div>

        {/* Google card */}
        <div className="bg-white border border-[#e8e8e8]">
          <div className="px-6 py-4 border-b border-[#e8e8e8] bg-[#ffffff] flex items-center justify-between">
            <div>
              <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-0.5">Plataforma</p>
              <p className="font-display text-base font-bold">Google</p>
            </div>
            <span className={`font-mono text-[9px] px-2 py-0.5 uppercase tracking-wide ${
              isConnected ? 'bg-[#edfaf2] text-[#1a7a4a]' : 'bg-[#ffffff] text-[#888888] border border-[#e8e8e8]'
            }`}>
              {isConnected ? 'Conectado' : 'Sin conectar'}
            </span>
          </div>

          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-[#555555]">
              Conecta tu cuenta de Google para acceder a <strong>GA4</strong>, <strong>Search Console</strong> y <strong>Google Ads</strong> de todos tus clientes desde una sola autenticación.
            </p>

            {isConnected && googleToken && (
              <div className="bg-[#ffffff] border border-[#e8e8e8] px-4 py-3 space-y-1">
                <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Permisos concedidos</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['GA4', 'Search Console', 'Google Ads'].map(s => (
                    <span key={s} className="font-mono text-[9px] bg-[#edf2fc] text-[#1a4fa0] px-1.5 py-0.5">{s}</span>
                  ))}
                </div>
                {googleToken.updated_at && (
                  <p className="font-mono text-[9px] text-[#888888] mt-1">
                    Último acceso: {new Date(googleToken.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            )}

            <GoogleConnectButton isConnected={isConnected} />
          </div>
        </div>

        {/* Meta card */}
        <div className="bg-white border border-[#e8e8e8]">
          <div className="px-6 py-4 border-b border-[#e8e8e8] bg-[#ffffff] flex items-center justify-between">
            <div>
              <p className="font-mono text-[9px] tracking-[2px] uppercase text-[#888888] mb-0.5">Plataforma</p>
              <p className="font-display text-base font-bold">Meta Ads</p>
            </div>
            <span className={`font-mono text-[9px] px-2 py-0.5 uppercase tracking-wide ${
              isMetaConnected ? 'bg-[#edfaf2] text-[#1a7a4a]' : 'bg-[#ffffff] text-[#888888] border border-[#e8e8e8]'
            }`}>
              {isMetaConnected ? 'Conectado' : 'Sin conectar'}
            </span>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-[#555555]">
              Conecta tu cuenta de Meta para acceder a <strong>Facebook Ads</strong> e <strong>Instagram Ads</strong> de todos tus clientes. El token dura 60 días.
            </p>
            {isMetaConnected && metaToken?.updated_at && (
              <div className="bg-[#ffffff] border border-[#e8e8e8] px-4 py-3 space-y-1">
                <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#888888]">Permisos concedidos</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {['ads_read', 'read_insights', 'business_management'].map(s => (
                    <span key={s} className="font-mono text-[9px] bg-[#edf2fc] text-[#1a4fa0] px-1.5 py-0.5">{s}</span>
                  ))}
                </div>
                <p className="font-mono text-[9px] text-[#888888] mt-1">
                  Conectado el: {new Date(metaToken.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
            <MetaConnectButton isConnected={isMetaConnected} expiresAt={metaToken?.expires_at} />
          </div>
        </div>

      </div>
    </div>
  )
}
