import { getAdminDb } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  const db = getAdminDb();
  try {
    const snapshot = await db.collection("companies").limit(20).get();
    const companyIds = snapshot.docs.map(doc => doc.id);
    return NextResponse.json({ companyIds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
