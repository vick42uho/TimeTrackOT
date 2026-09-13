import React from 'react';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { SmartAlarmModal } from '@/components/SmartAlarmModal';

interface LeavesDialogsProps {
  deleteHolidayVisible: boolean;
  onCloseDeleteHoliday: () => void;
  deleteLeaveVisible: boolean;
  onCloseDeleteLeave: () => void;
  clearStatusVisible: boolean;
  onCloseClearStatus: () => void;
  deleteActivityVisible: boolean;
  onCloseDeleteActivity: () => void;
  itemToDeleteName?: string;
  activityToDeleteTitle?: string;
  clearStatusDateLabel: string;
  onConfirmDelete: () => void;
  onConfirmClearStatus: () => void;
  onConfirmDeleteActivity: () => void;
  alarmVisible: boolean;
  onCloseAlarm: () => void;
  holidays: any[];
  leaves: any[];
  onAlarmSaved: () => void;
}

export const LeavesDialogs = React.memo(function LeavesDialogs({
  deleteHolidayVisible,
  onCloseDeleteHoliday,
  deleteLeaveVisible,
  onCloseDeleteLeave,
  clearStatusVisible,
  onCloseClearStatus,
  deleteActivityVisible,
  onCloseDeleteActivity,
  itemToDeleteName,
  activityToDeleteTitle,
  clearStatusDateLabel,
  onConfirmDelete,
  onConfirmClearStatus,
  onConfirmDeleteActivity,
  alarmVisible,
  onCloseAlarm,
  holidays,
  leaves,
  onAlarmSaved,
}: LeavesDialogsProps) {
  return (
    <>
      <AlertDialog
        isVisible={deleteHolidayVisible}
        onClose={onCloseDeleteHoliday}
        title="ยืนยันการลบวันหยุด"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบรายการ "${itemToDeleteName}" ออกจากระบบ?`}
        confirmText="ลบรายการ"
        confirmVariant="destructive"
        cancelText="ยกเลิก"
        onConfirm={onConfirmDelete}
      />

      <AlertDialog
        isVisible={deleteLeaveVisible}
        onClose={onCloseDeleteLeave}
        title="ยืนยันการลบประวัติการลา"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการลานี้? โควตาวันลาจะถูกคืนให้อัตโนมัติ"
        confirmText="ลบประวัติ"
        confirmVariant="destructive"
        cancelText="ยกเลิก"
        onConfirm={onConfirmDelete}
      />

      <AlertDialog
        isVisible={clearStatusVisible}
        onClose={onCloseClearStatus}
        title="ยืนยันการยกเลิกสถานะ"
        description={`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกสถานะของวันที่ ${clearStatusDateLabel}?`}
        confirmText="ลบสถานะ"
        confirmVariant="destructive"
        cancelText="ยกเลิก"
        onConfirm={onConfirmClearStatus}
      />

      <AlertDialog
        isVisible={deleteActivityVisible}
        onClose={onCloseDeleteActivity}
        title="ยืนยันการลบกิจกรรม"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบนัดหมาย "${activityToDeleteTitle}" ออกจากระบบ? การแจ้งเตือนจะถูกยกเลิกด้วย`}
        confirmText="ลบกิจกรรม"
        confirmVariant="destructive"
        cancelText="ยกเลิก"
        onConfirm={onConfirmDeleteActivity}
      />

      <SmartAlarmModal
        visible={alarmVisible}
        onClose={onCloseAlarm}
        holidays={holidays}
        leaves={leaves}
        onSaved={onAlarmSaved}
      />
    </>
  );
});
