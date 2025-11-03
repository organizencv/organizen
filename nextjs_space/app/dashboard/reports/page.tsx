
import { Suspense } from 'react';
import ReportsContent from '@/components/reports-content';

export default function ReportsPage() {
  return (
    <Suspense fallback={<div>A carregar...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
