'use client'

import supabase from "@/app/api/db"
import Image from "next/image"
import { PostgrestSingleResponse } from '@supabase/supabase-js'
import { ProjectObject } from "@/@types/project_object"
import dictionary from "@/dictionary/content"

async function getData(name: string) {
    const { data, error }: PostgrestSingleResponse<ProjectObject[]> = await supabase.from('projects').select('*').eq('name', name)
    if(error) { console.error(error.message, error.details) }

    const project = data && data[0]
    const imageUrl = project ? supabase.storage.from('images').getPublicUrl(project.image_path ?? "").data.publicUrl : ""

    return { project, imageUrl }
}

export default async function ProjectName({ params }: { params: { lang: string, projectName: string }}) {
    const { project, imageUrl } = await getData(params.projectName);

    return project ? (
        <div className="grid flex-1 grid-cols-1 md:grid-cols-3 w-full h-full mt-20">
            <div className="dark:text-white">
                <h1 className="text-5xl font-semibold capitalize mb-7">{project.name}</h1>
                <h2 className="text-3xl font-semibold mb-5">{dictionary[params.lang]?.ProjectInfo.Resume}</h2>
                <p className="mb-7">{project.description}</p>
                <h2 className="text-3xl font-semibold mb-5">{dictionary[params.lang]?.ProjectInfo.Stack}</h2>
                <p>{project.stack}</p>
                <div className="flex flex-wrap justify-around">
                    {project.git_url && <a href={project.git_url} className="bg-[#4078c0] py-3 px-12 mt-6 rounded">{dictionary[params.lang]?.ProjectInfo.CodeButton}</a>}
                    {project.demo_url && <a href={project.demo_url} className="bg-[#bd2c00] py-3 px-12 mt-6 rounded">{dictionary[params.lang]?.ProjectInfo.VisitButton}</a>}
                </div>
            </div>
            <div className="w-full max-h-[50rem] col-span-2 relative mx-2 mb-4">
                <Image alt={project.image_path ?? ""} src={imageUrl} fill className='absolute rounded' />
            </div>
        </div>
    ) : (
        <div className="mt-20">
            <h1 className="text-5xl dark:text-white font-semibold">{dictionary[params.lang]?.ProjectInfo.NotFound}</h1>
        </div>
    )
}