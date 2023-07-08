import { NextApiRequest, NextApiResponse } from "next";
import { revalidatePath } from "next/cache";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const path = "/[lang]/projects"

    if(req.query.revalidate_key !== process.env.REVALIDATE_KEY) {
        return res.status(401).json({ message: 'Invalid token' })
    }

    try {
        revalidatePath(path)
        return res.json({ revalidatePath: path })
    } catch (error) {
        return res.status(500).send("Error revalidating")
    }
}
