import QRCode from "react-qr-code";

export function CouponQR({ value, size = 180 }: { value: string; size?: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <QRCode value={value} size={size} bgColor="#ffffff" fgColor="#0F172A" style={{ width: "100%", height: "auto", maxWidth: size }} />
    </div>
  );
}
