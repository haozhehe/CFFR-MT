export const STATUS_LABELS = {
  open: 'Open', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
};

export function formatDate(value) {
  if (!value) return 'Not recorded';
  // SQLite timestamps use UTC but do not include a timezone suffix.
  const text = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? value.replace(' ', 'T') + 'Z' : value;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function eventMessage(event) {
  if (event.kind === 'submitted') return 'Your fault report was submitted.';
  if (event.kind === 'assigned') return `${event.technician_name || 'A technician'} was assigned to your report.`;
  if (event.kind === 'unassigned') return 'The previous technician assignment was removed.';
  if (event.kind === 'snapshot') return `First recorded status: ${STATUS_LABELS[event.status] || event.status}.`;
  return `Report status changed to ${STATUS_LABELS[event.status] || event.status}.`;
}

export function filterReports(reports, search, status = 'all') {
  const text = search.trim().toLowerCase();
  return reports.filter((report) => {
    const matchesText = `${report.id} ${report.location} ${report.description}`.toLowerCase().includes(text);
    return matchesText && (status === 'all' || report.status === status);
  });
}
