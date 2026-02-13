import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";

interface ChartData {
  name: string;
  value: number;
}

const COLORS = [
  "hsl(174, 72%, 46%)",
  "hsl(262, 60%, 56%)",
  "hsl(38, 92%, 56%)",
  "hsl(152, 60%, 44%)",
  "hsl(0, 72%, 56%)",
  "hsl(210, 60%, 50%)",
];

const tooltipStyle = {
  backgroundColor: "hsl(220, 18%, 10%)",
  border: "1px solid hsl(220, 14%, 18%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
  fontSize: "12px",
};

export function SalesBarChart({ data, label }: { data: ChartData[]; label: string }) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">{label}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
          <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 52%)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(215, 12%, 52%)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(220, 14%, 14%)" }} />
          <Bar dataKey="value" fill="hsl(174, 72%, 46%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProductPieChart({ data }: { data: ChartData[] }) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Vendas por Produto</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
            nameKey="name"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {d.name}
          </div>
        ))}
      </div>
    </div>
  );
}

interface WeeklyPeriodData {
  name: string;
  Manhã: number;
  Tarde: number;
  Noite: number;
}

export function SalesLineChart({ data, label }: { data: WeeklyPeriodData[]; label: string }) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">{label}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 16%)" />
          <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 52%)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(215, 12%, 52%)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, color: "hsl(215, 12%, 52%)" }} />
          <Line type="monotone" dataKey="Manhã" stroke="hsl(38, 92%, 56%)" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="Tarde" stroke="hsl(174, 72%, 46%)" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="Noite" stroke="hsl(262, 60%, 56%)" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
