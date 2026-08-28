// server/src/util.ts

/** ตรวจเบอร์โทรไทย 9-10 หลัก ตัวเลขล้วน */
export function validatePhone(phone: string): boolean {
  return /^\d{9,10}$/.test(phone.trim());
}

/** hash สตริงแบบ deterministic คืนค่า non-negative int (ใช้เลือกเกมวันละอัน) */
export function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h >>> 0; // ทำให้เป็น unsigned
}
