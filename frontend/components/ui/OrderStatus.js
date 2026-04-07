const STATUS_CONFIG = {
  pending:          { label: 'Pending',          color: 'badge-yellow', step: 0 },
  confirmed:        { label: 'Confirmed',         color: 'badge-blue',   step: 1 },
  processing:       { label: 'Processing',        color: 'badge-blue',   step: 2 },
  shipped:          { label: 'Shipped',           color: 'badge-blue',   step: 3 },
  out_for_delivery: { label: 'Out for Delivery',  color: 'badge-blue',   step: 4 },
  delivered:        { label: 'Delivered',         color: 'badge-green',  step: 5 },
  cancelled:        { label: 'Cancelled',         color: 'badge-red',    step: -1 },
  refunded:         { label: 'Refunded',          color: 'badge-gray',   step: -1 },
};

export function OrderStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'badge-gray' };
  return <span className={config.color}>{config.label}</span>;
}

export function OrderTimeline({ statusHistory }) {
  const steps = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

  const latestStatus = statusHistory?.[statusHistory.length - 1]?.status;
  const currentStep = STATUS_CONFIG[latestStatus]?.step ?? 0;

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {steps.map((step, idx) => {
        const done = currentStep >= idx;
        const current = currentStep === idx;
        return (
          <div key={step} className="flex items-center">
            <div className={`flex flex-col items-center min-w-[80px]`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                done ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-gray-300 text-gray-400'
              } ${current ? 'ring-4 ring-primary-200' : ''}`}>
                {idx + 1}
              </div>
              <span className={`text-xs mt-1 text-center leading-tight ${done ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                {STATUS_CONFIG[step]?.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-0.5 w-8 mx-0.5 flex-shrink-0 transition-colors ${currentStep > idx ? 'bg-primary-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
