import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

/**
 * Donut de sincronización — chunk aparte para no meter recharts en el grafo síncrono del Dashboard.
 */
export default function DashboardSyncPie({ pieData, saludRed }) {
  return (
    <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={46}
            outerRadius={64}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {pieData.map((entry) => (
              <Cell key={entry.key} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        <span className="text-lg font-extrabold text-slate-900 leading-tight">
          {saludRed}%
        </span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
          Salud de Red
        </span>
      </div>
    </div>
  );
}
