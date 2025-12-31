// src/components/charts/TaskActivityChart.tsx
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import { TaskResponse } from '../../hooks/api/useTasks';

interface TaskActivityChartProps {
  tasks: TaskResponse[];
}

export const TaskActivityChart: React.FC<TaskActivityChartProps> = ({ tasks }) => {
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const tasksByDay = last7Days.map((date) => {
      const created = tasks.filter((t) => t.createdAt.startsWith(date)).length;
      const completed = tasks.filter(
        (t) => t.status === 'done' && t.completedAt?.startsWith(date)
      ).length;
      return { date, created, completed };
    });

    return {
      categories: tasksByDay.map((d) => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      created: tasksByDay.map((d) => d.created),
      completed: tasksByDay.map((d) => d.completed),
    };
  }, [tasks]);

  const options: ApexOptions = {
    chart: {
      fontFamily: 'Inter, sans-serif',
      type: 'area',
      height: 280,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ['#3b82f6', '#10b981'],
    stroke: {
      curve: 'smooth',
      width: [3, 3],
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
    },
    xaxis: {
      categories: chartData.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
    },
    tooltip: {
      theme: 'light',
      x: { show: true },
    },
  };

  const series = [
    {
      name: 'Created',
      data: chartData.created,
    },
    {
      name: 'Completed',
      data: chartData.completed,
    },
  ];

  return (
    <div className="w-full">
      <Chart options={options} series={series} type="area" height={280} />
    </div>
  );
};
