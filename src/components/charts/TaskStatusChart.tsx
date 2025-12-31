// src/components/charts/TaskStatusChart.tsx
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import { TaskResponse } from '../../hooks/api/useTasks';
import { STATUS_COLUMNS } from '../../types/project';

interface TaskStatusChartProps {
  tasks: TaskResponse[];
}

export const TaskStatusChart: React.FC<TaskStatusChartProps> = ({ tasks }) => {
  const chartData = useMemo(() => {
    const statusCounts = STATUS_COLUMNS.map((status) => ({
      name: status.name,
      count: tasks.filter((t) => t.status === status.id).length,
      color: status.color,
    }));

    return {
      labels: statusCounts.map((s) => s.name),
      series: statusCounts.map((s) => s.count),
      colors: statusCounts.map((s) => s.color),
    };
  }, [tasks]);

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Inter, sans-serif',
    },
    colors: chartData.colors,
    labels: chartData.labels,
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
            },
            total: {
              show: true,
              label: 'Total Tasks',
              fontSize: '14px',
              fontWeight: 600,
              color: '#6b7280',
              formatter: () => tasks.length.toString(),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val: number) => `${val} tasks`,
      },
    },
  };

  return (
    <div className="w-full flex items-center justify-center">
      <Chart options={options} series={chartData.series} type="donut" height={300} />
    </div>
  );
};
