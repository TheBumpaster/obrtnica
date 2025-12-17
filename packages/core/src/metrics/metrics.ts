/**
 * Simple in-memory metrics service
 * Supports counters, gauges, and histograms
 */

export interface MetricLabels {
  [key: string]: string | number;
}

interface CounterMetric {
  type: 'counter';
  value: number;
  labels: MetricLabels;
}

interface GaugeMetric {
  type: 'gauge';
  value: number;
  labels: MetricLabels;
}

interface HistogramMetric {
  type: 'histogram';
  values: number[];
  labels: MetricLabels;
  buckets: number[];
}

type Metric = CounterMetric | GaugeMetric | HistogramMetric;

class MetricsService {
  private metrics: Map<string, Metric> = new Map();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels: MetricLabels = {}, value = 1): void {
    const key = this.getMetricKey(name, labels);
    const existing = this.metrics.get(key);

    if (existing && existing.type === 'counter') {
      existing.value += value;
    } else {
      this.metrics.set(key, {
        type: 'counter',
        value,
        labels,
      });
    }
  }

  /**
   * Set a gauge metric value
   */
  setGauge(name: string, value: number, labels: MetricLabels = {}): void {
    const key = this.getMetricKey(name, labels);
    this.metrics.set(key, {
      type: 'gauge',
      value,
      labels,
    });
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number, labels: MetricLabels = {}, buckets = [0.1, 0.5, 1, 5, 10, 30, 60]): void {
    const key = this.getMetricKey(name, labels);
    const existing = this.metrics.get(key);

    if (existing && existing.type === 'histogram') {
      existing.values.push(value);
      // Keep only last 1000 values to prevent memory issues
      if (existing.values.length > 1000) {
        existing.values = existing.values.slice(-1000);
      }
    } else {
      this.metrics.set(key, {
        type: 'histogram',
        values: [value],
        labels,
        buckets,
      });
    }
  }

  /**
   * Get all metrics in Prometheus-compatible format
   */
  getMetrics(): string {
    const lines: string[] = [];

    for (const [key, metric] of this.metrics.entries()) {
      const labelStr = this.formatLabels(metric.labels);

      if (metric.type === 'counter') {
        lines.push(`# TYPE ${key} counter`);
        lines.push(`${key}${labelStr} ${metric.value}`);
      } else if (metric.type === 'gauge') {
        lines.push(`# TYPE ${key} gauge`);
        lines.push(`${key}${labelStr} ${metric.value}`);
      } else if (metric.type === 'histogram') {
        lines.push(`# TYPE ${key} histogram`);
        // Calculate bucket counts
        const bucketCounts: Record<number, number> = {};
        for (const bucket of metric.buckets) {
          bucketCounts[bucket] = metric.values.filter((v) => v <= bucket).length;
        }
        bucketCounts[Number.POSITIVE_INFINITY] = metric.values.length;

        // Emit bucket metrics
        for (const [bucket, count] of Object.entries(bucketCounts)) {
          const bucketLabel = bucket === 'Infinity' ? '+Inf' : bucket;
          lines.push(`${key}_bucket{le="${bucketLabel}"${labelStr ? ',' + labelStr.slice(1, -1) : ''}} ${count}`);
        }
        lines.push(`${key}_count${labelStr} ${metric.values.length}`);
        lines.push(`${key}_sum${labelStr} ${metric.values.reduce((a, b) => a + b, 0)}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Get metrics as JSON (for API responses)
   */
  getMetricsJson(): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, metric] of this.metrics.entries()) {
      if (metric.type === 'counter') {
        result[key] = {
          type: 'counter',
          value: metric.value,
          labels: metric.labels,
        };
      } else if (metric.type === 'gauge') {
        result[key] = {
          type: 'gauge',
          value: metric.value,
          labels: metric.labels,
        };
      } else if (metric.type === 'histogram') {
        result[key] = {
          type: 'histogram',
          count: metric.values.length,
          sum: metric.values.reduce((a, b) => a + b, 0),
          min: metric.values.length > 0 ? Math.min(...metric.values) : 0,
          max: metric.values.length > 0 ? Math.max(...metric.values) : 0,
          labels: metric.labels,
        };
      }
    }

    return result;
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.metrics.clear();
  }

  private getMetricKey(name: string, labels: MetricLabels): string {
    const labelKeys = Object.keys(labels).sort();
    const labelParts = labelKeys.map((k) => `${k}="${labels[k]}"`).join(',');
    return labelParts ? `${name}{${labelParts}}` : name;
  }

  private formatLabels(labels: MetricLabels): string {
    const labelKeys = Object.keys(labels).sort();
    if (labelKeys.length === 0) return '';
    return `{${labelKeys.map((k) => `${k}="${labels[k]}"`).join(',')}}`;
  }
}

// Singleton instance
export const metrics = new MetricsService();
