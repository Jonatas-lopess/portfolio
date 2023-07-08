import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const path = "/[lang]/projects"

    if(req.headers.get("revalidate_key") !== process.env.REVALIDATE_KEY) {
        return NextResponse.json({ message: 'Invalid key' }, { status: 401 })
    }

    try {
        revalidatePath(path)
        return NextResponse.json({ revalidated: true })
    } catch (error) {
        return NextResponse.json("Error revalidating", { status: 500 })
    }
}
