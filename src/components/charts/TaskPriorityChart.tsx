// src/components/charts/TaskPriorityChart.tsx
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';
import { TaskResponse } from '../../hooks/api/useTasks';
import { PRIORITY_CONFIG } from '../../types/project';

interface TaskPriorityChartProps {
  tasks: TaskResponse[];
}

export const TaskPriorityChart: React.FC<TaskPriorityChartProps> = ({ tasks }) => {
  const chartData = useMemo(() => {
    const priorities = Object.entries(PRIORITY_CONFIG).map(([key, config]) => ({
      name: config.name,
      count: tasks.filter((t) => t.priority === key).length,
      color: config.color,
    }));

    return {
      categories: priorities.map((p) => p.name),
      series: priorities.map((p) => p.count),
      colors: ['#6b7280', '#f59e0b', '#ef4444', '#dc2626'],
    };
  }, [tasks]);

  const options: ApexOptions = {
    chart: {
      fontFamily: 'Inter, sans-serif',
      type: 'bar',
      height: 280,
      toolbar: { show: false },
    },
    colors: chartData.colors,
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        borderRadiusApplication: 'end',
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      offsetX: -6,
      style: {
        fontSize: '12px',
        colors: ['#fff'],
      },
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
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
      xaxis: {
        lines: { show: true },
      },
      yaxis: {
        lines: { show: false },
      },
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val: number) => `${val} tasks`,
      },
    },
  };

  const series = [
    {
      name: 'Tasks',
      data: chartData.series,
    },
  ];

  return (
    <div className="w-full">
      <Chart options={options} series={series} type="bar" height={280} />
    </div>
  );
};
