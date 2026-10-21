import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, UserRound, Monitor } from 'lucide-react';
import { useResponsableDetalle } from '../hooks/useQueries';
import { labelUbicacionEnum } from '../constants/ubicaciones';
import { StudioLoading, StudioError } from '../components/studio/StudioUi';
import { ModuleHeader } from '../components/layout';

function fmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-AR');
}

export default function ResponsableDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useResponsableDetalle(id);

  if (isLoading) return <StudioLoading message="Cargando equipos asignados…" />;
  if (error || !data) {
    return (
      <div className="space-y-6 pb-12 w-full">
        <ModuleHeader
          title="Responsable no encontrado"
          description={error ? 'No se pudo cargar el detalle.' : 'No existe ese responsable en el índice.'}
          actions={
            <Link
              to="/configuracion?tab=responsables"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a responsables</span>
            </Link>
          }
        />
        <StudioError message={error ? 'No se pudo cargar el detalle.' : 'No existe ese responsable en el índice.'} />
      </div>
    );
  }

  const equipos = data.equipos ?? [];

  return (
    <div className="space-y-6 pb-12 w-full">
      <ModuleHeader
        title={data.nombre ?? data.id}
        badge={`${equipos.length} computadoras asignadas`}
        description="Detalle de asignaciones del responsable en inventario."
        actions={
          <Link
            to="/configuracion?tab=responsables"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#f1f5f9] hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a responsables</span>
          </Link>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <UserRound className="w-5 h-5 text-violet-600" />
          <span className="font-bold text-slate-800">{data.nombre}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3">Hostname</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Estado IT</th>
                <th className="px-4 py-3 hidden sm:table-cell">Asignado el</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                    Sin equipos en el índice para esta persona.
                  </td>
                </tr>
              ) : (
                equipos.map(eq => (
                  <tr key={eq.computadoraUuid} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/computadoras/${encodeURIComponent(eq.computadoraUuid)}`}
                        className="inline-flex items-center gap-2 font-semibold text-slate-900 hover:text-accent"
                      >
                        <Monitor className="w-4 h-4 text-slate-400 shrink-0" />
                        {eq.hostname ?? eq.computadoraUuid}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {eq.ubicacion ? labelUbicacionEnum(eq.ubicacion) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{eq.estadoActual ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">
                      {fmtFecha(eq.asignadoAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
