import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyAdmin, AuthError } from "@/lib/verifyAdmin";

export const dynamic = "force-dynamic";
const DAY = 86_400_000;

function periodKey(index: number) { return `period-${index}`; }

async function getViewer(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new AuthError("ไม่พบ token");
  return adminAuth.verifyIdToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const viewer = await getViewer(req);
    const [configSnap, usersSnap, paymentsSnap, viewerSnap] = await Promise.all([
      adminDb.collection("settings").doc("gangDues").get(),
      adminDb.collection("users").get(),
      adminDb.collection("duesPayments").get(),
      adminDb.collection("users").doc(viewer.uid).get(),
    ]);
    const raw = configSnap.data() ?? {};
    const config = { amount: Number(raw.amount) || 0, frequency: raw.frequency === "daily" ? "daily" : "weekly", startAt: Number(raw.startAt) || Date.now(), enabled: raw.enabled === true };
    const interval = config.frequency === "daily" ? DAY : 7 * DAY;
    const currentIndex = config.enabled && config.amount > 0 ? Math.max(0, Math.floor((Date.now() - config.startAt) / interval)) : -1;
    const paid = new Set(paymentsSnap.docs.map((doc) => doc.id));
    const isAdmin = viewerSnap.data()?.role === "admin";
    const statuses = usersSnap.docs.map((doc) => {
      const user = doc.data();
      const joinedAt = Number(user.createdAt) || config.startAt;
      const firstIndex = Math.max(0, Math.ceil((joinedAt - config.startAt) / interval));
      const unpaid = currentIndex < firstIndex ? [] : Array.from({ length: currentIndex - firstIndex + 1 }, (_, offset) => firstIndex + offset).filter((index) => !paid.has(`${doc.id}_${periodKey(index)}`));
      return { uid: doc.id, name: user.icName || user.displayName || user.username || "สมาชิกแก๊ง", avatarUrl: user.avatarUrl || "", outstandingAmount: unpaid.length * config.amount, outstandingPeriods: unpaid.length, oldestDueAt: unpaid.length ? config.startAt + unpaid[0] * interval : undefined, currentPeriodKey: currentIndex >= 0 ? periodKey(currentIndex) : undefined, currentDueAt: currentIndex >= 0 ? config.startAt + currentIndex * interval : undefined, paidCurrentPeriod: currentIndex < 0 || paid.has(`${doc.id}_${periodKey(currentIndex)}`) };
    });
    return NextResponse.json({ config, statuses, isAdmin });
  } catch (error) {
    console.error("Dues read failed", error);
    return NextResponse.json({ error: "โหลดข้อมูลค่างวดไม่สำเร็จ" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await verifyAdmin(req);
    const body = await req.json();
    const amount = Number(body.amount);
    const frequency = body.frequency;
    const startAt = Number(body.startAt);
    const enabled = body.enabled === true;
    if (!Number.isInteger(amount) || amount < 0 || amount > 10_000_000 || !["daily", "weekly"].includes(frequency) || !Number.isFinite(startAt)) return NextResponse.json({ error: "ตั้งค่าค่างวดไม่ถูกต้อง" }, { status: 400 });
    await adminDb.collection("settings").doc("gangDues").set({ amount, frequency, startAt, enabled, updatedAt: Date.now() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "บันทึกค่างวดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payer = await getViewer(req);
    const body = await req.json();
    const memberId = typeof body.memberId === "string" ? body.memberId : "";
    const period = typeof body.periodKey === "string" ? body.periodKey : "";
    const detail = typeof body.detail === "string" ? body.detail.trim().slice(0, 500) : "";
    if (!memberId || !/^period-\d+$/.test(period) || !detail) return NextResponse.json({ error: "กรุณาระบุรายละเอียดการจ่ายและรอบชำระให้ถูกต้อง" }, { status: 400 });
    const [member, payerProfile, configSnap] = await Promise.all([
      adminDb.collection("users").doc(memberId).get(),
      adminDb.collection("users").doc(payer.uid).get(),
      adminDb.collection("settings").doc("gangDues").get(),
    ]);
    if (!member.exists) return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });
    const config = configSnap.data() ?? {};
    const amount = Number(config.amount) || 0;
    const frequency = config.frequency === "daily" ? "daily" : "weekly";
    const periodIndex = Number(period.slice("period-".length));
    const dueAt = (Number(config.startAt) || Date.now()) + periodIndex * (frequency === "daily" ? DAY : 7 * DAY);
    const memberName = member.data()?.icName || member.data()?.displayName || member.data()?.username || "สมาชิกแก๊ง";
    const payerName = payerProfile.data()?.icName || payerProfile.data()?.displayName || payerProfile.data()?.username || "สมาชิกแก๊ง";
    const dueDate = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(dueAt);
    await adminDb.collection("transactions").add({
      kind: "deposit",
      targetType: "dues",
      targetKey: memberId,
      targetLabel: `ค่างวดแก๊งของ ${memberName}`,
      amount,
      note: `${payerName} ขอจ่ายแทน ${memberName} · ${frequency === "daily" ? "รอบรายวัน" : "รอบรายสัปดาห์"} · วันที่ ${dueDate} · รายละเอียด: ${detail}`,
      duesPeriod: period,
      duesDueAt: dueAt,
      duesFrequency: frequency,
      duesDetail: detail,
      status: "pending",
      requestedBy: payer.uid,
      requestedByName: payerName,
      requestedByAvatar: payerProfile.data()?.avatarUrl ?? "",
      createdAt: Date.now(),
    });
    return NextResponse.json({ ok: true, pending: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "บันทึกการชำระไม่สำเร็จ" }, { status: 500 });
  }
}
