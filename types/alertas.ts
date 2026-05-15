export interface Alerta {
  id: string
  cliente_id: string
  tipo: string
  severidad: 'low' | 'medium' | 'high' | 'critical'
  titulo: string
  descripcion: string | null
  fuente: string | null
  estado: 'pending' | 'reviewing' | 'resolved'
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
}
