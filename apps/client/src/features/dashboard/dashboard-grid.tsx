import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardGrid() {
  const items = [
    { span: 'col-span-12 lg:col-span-3' },
    { span: 'col-span-12 lg:col-span-3' },
    { span: 'col-span-12 lg:col-span-3' },
    { span: 'col-span-12 lg:col-span-3' },
    { span: 'col-span-12 lg:col-span-6' },
    { span: 'col-span-12 lg:col-span-6' },
    { span: 'col-span-12 lg:col-span-8' },
    { span: 'col-span-12 lg:col-span-4' },
    { span: 'col-span-12 lg:col-span-4' },
    { span: 'col-span-12 lg:col-span-4' },
    { span: 'col-span-12 lg:col-span-4' },
    { span: 'col-span-12 lg:col-span-3' },
    { span: 'col-span-12 lg:col-span-3' },
    { span: 'col-span-12 lg:col-span-3' },
    { span: 'col-span-12 lg:col-span-3' },
  ];

  return (
    <div className="grid grid-cols-12 gap-4">
      {items.map((item, idx) => (
        <Card key={idx} className={item.span}>
          <div className="p-5">
            <Skeleton className="h-28 w-full rounded-md bg-muted/70 lg:h-32" />
          </div>
        </Card>
      ))}
    </div>
  );
}
