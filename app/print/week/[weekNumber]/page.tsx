import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

interface Props {
  params: { weekNumber: string };
}

export default async function PrintWeekPage({ params }: Props) {
  const weekNumber = Number(params.weekNumber);
  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 52) {
    notFound();
  }

  const week = await prisma.week.findUnique({
    where: { weekNumber },
    include: {
      days: { orderBy: { sortOrder: 'asc' } },
      phase: true,
    },
  });

  if (!week) notFound();

  return (
    <div className="print-page bg-white text-black p-8 max-w-4xl mx-auto font-sans">
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-page { padding: 0; max-width: none; }
        }
        @media screen {
          .print-page { border: 1px solid #e5e7eb; border-radius: 8px; margin: 2rem auto; }
        }
        .checkbox-empty {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid #374151;
          border-radius: 3px;
          margin-right: 8px;
          vertical-align: middle;
        }
      `}</style>

      {/* Header */}
      <header className="border-b-2 border-gray-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Week {week.weekNumber}: {week.title}</h1>
            <p className="text-sm text-gray-600 mt-1">{week.phase.badge} {week.phase.name}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>CTO Map</p>
            <p>52-Week Curriculum</p>
          </div>
        </div>
      </header>

      {/* Goal & SaaS Evolution */}
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700 mb-1">Goal</h2>
        <p className="text-sm">{week.goal}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700 mb-1">SaaS Evolution</h2>
        <p className="text-sm">{week.saasEvolution}</p>
      </section>

      {/* Days */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700 mb-3">Daily Tasks</h2>
        <div className="space-y-4">
          {week.days.map((day) => (
            <div key={day.id} className="border border-gray-300 rounded p-3">
              <h3 className="font-bold text-sm mb-2">{day.dayLabel}</h3>
              <div className="space-y-1.5">
                <div className="flex items-start">
                  <span className="checkbox-empty" />
                  <div>
                    <span className="text-xs font-medium text-gray-500 mr-1">📖 Learn:</span>
                    <span className="text-sm">{day.learnTask}</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="checkbox-empty" />
                  <div>
                    <span className="text-xs font-medium text-gray-500 mr-1">🛠️ Build:</span>
                    <span className="text-sm">{day.buildTask}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Notes area */}
      <section className="mt-6 border-t border-gray-300 pt-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700 mb-2">Notes</h2>
        <div className="border border-gray-200 rounded h-32" />
      </section>

      {/* Print button (hidden in print) */}
      <div className="no-print mt-6 text-center">
        <PrintButton />
      </div>
    </div>
  );
}
