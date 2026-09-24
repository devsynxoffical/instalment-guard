export const getDevicePaymentStatus = (device, contracts = []) => {
  if (!device) {
    return {
      status: 'PENDING',
      label: '⏳ PENDING',
      subLabel: 'Installment Pending',
      detail: 'Installment Pending',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
      remaining: 0,
    };
  }

  const contract = contracts.find(
    (c) => c.contractId === device.contractId || c.deviceId === device.deviceId
  );

  const totalPrice = contract ? (contract.totalPrice ?? 0) : (device.totalPrice ?? 0);
  const remaining = contract ? (contract.remainingBalance ?? 0) : (device.remainingBalance ?? 0);
  const isPaid = totalPrice > 0 && ((contract && (contract.remainingBalance <= 0 || contract.status === 'COMPLETED')) || device.deviceStatus === 'COMPLETED');
  const isOverdue = device.isRestricted || (contract && (contract.status === 'RESTRICTED' || contract.status === 'OVERDUE'));

  if (totalPrice <= 0) {
    return {
      status: 'NO_PLAN',
      label: '📝 NO PLAN SET',
      subLabel: 'Click "Edit Plan" to configure',
      detail: 'Installment Plan Not Configured',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-bold',
      remaining: 0,
      contract,
    };
  }

  if (isPaid) {
    return {
      status: 'PAID',
      label: '✅ PAYMENT RECEIVED',
      subLabel: 'Paid in Full',
      detail: 'Payment Received (Paid in Full)',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      remaining: 0,
      contract,
    };
  }

  if (isOverdue) {
    return {
      status: 'OVERDUE',
      label: '⚠️ OVERDUE',
      subLabel: `Rs. ${remaining.toLocaleString()} Due`,
      detail: `Payment Overdue (Rs. ${remaining.toLocaleString()} Due)`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
      remaining,
      contract,
    };
  }

  return {
    status: 'PENDING',
    label: '⏳ PENDING',
    subLabel: `Rs. ${remaining.toLocaleString()} Remaining`,
    detail: `Installment Pending (Rs. ${remaining.toLocaleString()} Remaining)`,
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
    remaining,
    contract,
  };
};
