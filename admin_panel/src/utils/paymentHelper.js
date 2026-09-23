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

  const remaining = contract ? (contract.remainingBalance ?? 0) : 35000;
  const isPaid = (contract && (contract.remainingBalance <= 0 || contract.status === 'COMPLETED')) || device.deviceStatus === 'COMPLETED';
  const isOverdue = device.isRestricted || (contract && (contract.status === 'RESTRICTED' || contract.status === 'OVERDUE'));

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
