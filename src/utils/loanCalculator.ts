import { InterestType, PaymentFrequency, RepaymentScheduleItem } from '../types';

export function calculateRepaymentSchedule(
  principal: number,
  interestRateMonthly: number,
  termMonths: number,
  startDateStr: string,
  interestType: InterestType,
  frequency: PaymentFrequency = 'monthly'
): RepaymentScheduleItem[] {
  const schedule: RepaymentScheduleItem[] = [];
  const startDate = new Date(startDateStr);

  const numberOfPeriods = frequency === 'monthly' ? termMonths : termMonths * 4;
  const monthlyInterest = (principal * interestRateMonthly) / 100;

  for (let i = 1; i <= numberOfPeriods; i++) {
    const dueDate = new Date(startDate);
    if (frequency === 'monthly') {
      dueDate.setMonth(dueDate.getMonth() + i);
    } else {
      dueDate.setDate(dueDate.getDate() + (i * 7));
    }

    const dueDateFormatted = dueDate.toISOString().split('T')[0];

    let expectedPrincipal = 0;
    let expectedInterest = 0;

    if (interestType === 'interest_only') {
      expectedInterest = monthlyInterest;
      expectedPrincipal = i === numberOfPeriods ? principal : 0;
    } else if (interestType === 'equal_installment') {
      expectedPrincipal = Math.round((principal / numberOfPeriods) * 100) / 100;
      expectedInterest = monthlyInterest;
    } else if (interestType === 'fixed_end') {
      if (i === numberOfPeriods) {
        expectedPrincipal = principal;
        expectedInterest = monthlyInterest * numberOfPeriods;
      } else {
        expectedPrincipal = 0;
        expectedInterest = 0;
      }
    }

    schedule.push({
      periodNumber: i,
      dueDate: dueDateFormatted,
      expectedPrincipal,
      expectedInterest,
      totalDue: expectedPrincipal + expectedInterest,
      paidAmount: 0,
      status: 'pending',
      penaltyFee: 0,
    });
  }

  return schedule;
}

export function checkOverdueDays(dueDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}
