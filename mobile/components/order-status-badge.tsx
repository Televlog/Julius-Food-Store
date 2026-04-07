import { View, Text } from 'react-native';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  pending:          { label: 'Pending',          bg: '#fef3c7', color: '#92400e' },
  confirmed:        { label: 'Confirmed',         bg: '#dbeafe', color: '#1e40af' },
  processing:       { label: 'Processing',        bg: '#dbeafe', color: '#1e40af' },
  shipped:          { label: 'Shipped',           bg: '#ede9fe', color: '#5b21b6' },
  out_for_delivery: { label: 'Out for Delivery',  bg: '#dbeafe', color: '#1e40af' },
  delivered:        { label: 'Delivered',         bg: '#dcfce7', color: '#166534' },
  cancelled:        { label: 'Cancelled',         bg: '#fee2e2', color: '#991b1b' },
  refunded:         { label: 'Refunded',          bg: '#f1f5f9', color: '#475569' },
};

export default function OrderStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f1f5f9', color: '#475569' };
  return (
    <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
      <Text style={{ color: cfg.color, fontSize: 12, fontWeight: '600' }}>{cfg.label}</Text>
    </View>
  );
}
