import { useState, useEffect, ReactNode } from 'react';
import { Wrench, Clock, CheckCircle, BarChart3, AlertTriangle, ChevronRight, Factory, Bell } from 'lucide-react';
import { getStats, getRecords, getPendingRecords, getPendingAccessoryCounts } from '../store';
import { MachineRecord, UserProfile } from '../types';
import { useTheme } from '../ThemeContext';

interface Props {
  profile: UserProfile;
  onNavigate: (tab: string, filter?: string) => void;
  refreshKey: number;
}

export default function Dashboard({ profile, onNavigate, refreshKey }: Props) {
  const { c } = useTheme();
  const [stats, setStats] = useState({ total: 0, active: 0, closed: 0, pendingBobbin: 0, pendingCase: 0, pendingNeedle: 0, pendingKnife: 0 });
  const [accessoryCounts, setAccessoryCounts] = useState({ bobbin: 0, case: 0, needle: 0, knife: 0, total: 0 });
  const [recent, setRecent] = useState<MachineRecord[]>([]);
  const [pending, setPending] = useState<MachineRecord[]>([]);
  const pendingCount = pending.length;

  useEffect(() => {
    setStats(getStats());
    setRecent(getRecords().slice(0, 5));
    const p = getPendingRecords();
    setPending(p.slice(0, 3));
    setAccessoryCounts(getPendingAccessoryCounts());
  }, [refreshKey]);

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return (
    <div className="min-h-screen" style={{ background: c.pageBg }}>
      {/* Header */}
      <div style={{ background: c.headerBg, padding: '16px 16px 20px' }}>
        <div className="flex items-center gap-3 mb-4">
          <div style={{ background: '#f59e0b', borderRadius: 12, padding: 10, display: 'flex' }}>
            <BarChart3 size={24} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>Dashboard</h1>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Machine Issue Tracker</p>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '8px 14px',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <Factory size={15} color="#f59e0b" />
          <div>
            <p style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600, lineHeight: 1 }}>Bottoms Gallery Pvt. Ltd.</p>
            <p style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>Spider Group</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Stats — 2×2 grid */}
        <div className="grid grid-cols-2 gap-3 p-4">
          <StatCard
            icon={<Wrench size={22} color="#3b82f6" />}
            bg="#eff6ff" darkBg="#0d1a2e"
            count={stats.total} label="Total Issues"
            onClick={() => onNavigate('records', 'all')} c={c}
          />
          <StatCard
            icon={<Clock size={22} color="#f59e0b" />}
            bg="#fffbeb" darkBg="#1a0f00"
            count={stats.active} label="Active"
            onClick={() => onNavigate('records', 'active')} c={c}
          />
          <StatCard
            icon={<CheckCircle size={22} color="#22c55e" />}
            bg="#f0fdf4" darkBg="#001a0a"
            count={stats.closed} label="Closed"
            onClick={() => onNavigate('records', 'closed')} c={c}
          />
          <StatCard
            icon={<AlertTriangle size={22} color="#ef4444" />}
            bg="#fff1f2" darkBg="#1a0505"
            count={pendingCount} label="Pending"
            onClick={() => onNavigate('records', 'pending')} c={c}
            highlight={pendingCount > 0}
          />
        </div>

        {/* Pending Accessories summary */}
        {accessoryCounts.total > 0 && (
          <div className="mx-4 mb-4 rounded-xl p-4" style={{ background: c.cardBg, border: `1px solid ${c.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} color="#f59e0b" />
                <h3 style={{ color: c.textPrimary, fontWeight: 700, fontSize: 15 }}>Pending Accessories</h3>
              </div>
              <button onClick={() => onNavigate('deposit')}
                style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600 }}>Deposit করুন</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {accessoryCounts.bobbin > 0 && (
                <AccessoryPill label="Bobbin" count={accessoryCounts.bobbin} color="#3b82f6" />
              )}
              {accessoryCounts.case > 0 && (
                <AccessoryPill label="Case" count={accessoryCounts.case} color="#8b5cf6" />
              )}
              {accessoryCounts.needle > 0 && (
                <AccessoryPill label="Needle" count={accessoryCounts.needle} color="#ef4444" />
              )}
              {accessoryCounts.knife > 0 && (
                <AccessoryPill label="Knife" count={accessoryCounts.knife} color="#f59e0b" />
              )}
            </div>
          </div>
        )}

        {/* Pending records */}
        {pending.length > 0 && (
          <div className="px-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Bell size={18} color="#f59e0b" />
                <h2 style={{ color: c.textPrimary, fontSize: 17, fontWeight: 700 }}>Pending Returns</h2>
              </div>
              <button onClick={() => onNavigate('records', 'pending')}
                style={{ color: '#f59e0b', fontSize: 14, fontWeight: 600 }}>See All</button>
            </div>
            <div className="flex flex-col gap-3">
              {pending.map(r => (
                <PendingCard key={r.id} record={r} formatDate={formatDate}
                  onClick={() => onNavigate('deposit')} c={c} />
              ))}
            </div>
          </div>
        )}

        {/* Recent records */}
        <div className="px-4">
          <div className="flex justify-between items-center mb-3">
            <h2 style={{ color: c.textPrimary, fontSize: 17, fontWeight: 700 }}>Recent Records</h2>
            <button onClick={() => onNavigate('records', 'all')}
              style={{ color: '#f59e0b', fontSize: 14, fontWeight: 600 }}>View All</button>
          </div>

          {recent.length === 0 ? (
            <div className="rounded-xl p-8 flex flex-col items-center gap-3"
              style={{ background: c.cardBg, border: `1.5px dashed ${c.border}` }}>
              <Wrench size={40} color={c.textMuted} strokeWidth={1.5} />
              <p style={{ color: c.textSecondary, fontSize: 15, fontWeight: 500 }}>এখনো কোনো রেকর্ড নেই</p>
              <p style={{ color: c.textMuted, fontSize: 13 }}>Issue a machine to get started</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recent.map(r => (
                <RecordCard key={r.id} record={r} formatDate={formatDate}
                  onClick={() => onNavigate('records', 'all')} c={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, bg, darkBg, count, label, onClick, c, highlight }: {
  icon: ReactNode; bg: string; darkBg: string; count: number; label: string;
  onClick?: () => void; c: ReturnType<typeof useTheme>['c']; highlight?: boolean;
}) {
  const isDark = c.pageBg === '#0d1117';
  return (
    <button onClick={onClick} className="rounded-xl p-4 flex flex-col gap-2 text-left w-full"
      style={{
        background: c.cardBg,
        boxShadow: highlight ? '0 0 0 1.5px #ef444466' : '0 1px 4px rgba(0,0,0,0.06)',
        border: highlight ? '1.5px solid #ef444433' : '1px solid transparent',
      }}>
      <div style={{
        background: isDark ? darkBg : bg, borderRadius: 10, padding: 8,
        width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <p style={{ color: c.textPrimary, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{count}</p>
      <p style={{ color: c.textMuted, fontSize: 13, fontWeight: 500 }}>{label}</p>
    </button>
  );
}

function AccessoryPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-xl"
      style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
      <span style={{ color, fontSize: 13, fontWeight: 600 }}>{label}</span>
      <span style={{
        background: color, color: '#fff', fontSize: 12, fontWeight: 800,
        padding: '2px 8px', borderRadius: 12,
      }}>{count}</span>
    </div>
  );
}

function PendingCard({ record: r, formatDate, onClick, c }: {
  record: MachineRecord; formatDate: (s: string) => string; onClick: () => void;
  c: ReturnType<typeof useTheme>['c'];
}) {
  const pendingItems: string[] = [];
  if (r.issuedItems.bobbin && !r.returnedItems.bobbin) pendingItems.push('Bobbin');
  if (r.issuedItems.case && !r.returnedItems.case) pendingItems.push('Case');
  if (r.issuedItems.needle > 0 && r.returnedItems.needle < r.issuedItems.needle)
    pendingItems.push(`Needle (${r.returnedItems.needle}/${r.issuedItems.needle})`);
  if (r.issuedItems.knife && !r.returnedItems.knife) pendingItems.push('Knife');

  return (
    <button onClick={onClick} className="rounded-xl p-4 flex items-start gap-3 text-left w-full"
      style={{ background: c.cardBg, border: `1.5px solid #f59e0b44` }}>
      <div style={{ background: '#fff7ed', borderRadius: 10, padding: 8, flexShrink: 0 }}>
        <AlertTriangle size={18} color="#f59e0b" />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ color: c.textPrimary, fontWeight: 700, fontSize: 14 }}>
          Line {r.lineNumber} — {r.machineNumber}
        </p>
        <p style={{ color: c.textSecondary, fontSize: 13 }}>{r.recipient.name}</p>
        <p style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600, marginTop: 3 }}>
          বাকি: {pendingItems.join(', ')}
        </p>
        <p style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{formatDate(r.issuedAt)}</p>
      </div>
      <ChevronRight size={18} color={c.textMuted} />
    </button>
  );
}

function RecordCard({ record: r, formatDate, onClick, c }: {
  record: MachineRecord; formatDate: (s: string) => string; onClick: () => void;
  c: ReturnType<typeof useTheme>['c'];
}) {
  const isActive = r.status === 'active';
  const needlePending = r.issuedItems.needle > 0 && r.returnedItems.needle < r.issuedItems.needle;
  const hasPending = isActive && (
    (r.issuedItems.bobbin && !r.returnedItems.bobbin) ||
    (r.issuedItems.case && !r.returnedItems.case) ||
    needlePending ||
    (r.issuedItems.knife && !r.returnedItems.knife)
  );

  return (
    <button onClick={onClick} className="rounded-xl p-4 flex items-start gap-3 text-left w-full"
      style={{ background: c.cardBg, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ background: isActive ? c.amberBg : c.successBg, borderRadius: 10, padding: 8, flexShrink: 0 }}>
        <Wrench size={20} color={isActive ? '#f59e0b' : '#22c55e'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ color: c.textPrimary, fontWeight: 700, fontSize: 14 }}>Line {r.lineNumber} - {r.machineNumber}</p>
          {hasPending && (
            <span style={{ background: '#fef3c7', color: '#b45309', fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 20 }}>
              বাকি
            </span>
          )}
        </div>
        <p style={{ color: c.textSecondary, fontSize: 13, marginBottom: 2 }}>{r.machineType}</p>
        <p style={{ color: c.textMuted, fontSize: 12 }}>{r.recipient.name} • {formatDate(r.issuedAt)}</p>
      </div>
      <span style={{
        background: isActive ? '#fef3c7' : c.successBg,
        color: isActive ? '#b45309' : '#16a34a',
        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, flexShrink: 0,
      }}>
        {isActive ? 'Active' : 'Closed'}
      </span>
    </button>
  );
}
