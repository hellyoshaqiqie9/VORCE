import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");

  if (!groupId) {
    return NextResponse.json({ error: "groupId is required" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection("groups")
      .doc(groupId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .get();

    const messages = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        authorId: data.authorId || "",
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        metadata: {
          platform: data.metadata?.platform || "",
          text: data.metadata?.text || "",
          type: data.metadata?.type || "text",
        },
      };
    });

    return NextResponse.json({ data: messages });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
