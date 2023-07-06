'use client'

import supabase from "@/app/api/db"
import Image from "next/image"
import { PostgrestError } from '@supabase/supabase-js'
import { ProjectObject } from "@/@types/project_object"
import { useEffect, useState } from "react"


export default function ProjectName({ params }: { params: { projectName: string }}) {
    const [project, setProject] = useState<ProjectObject>();
    const [imageUrl, setImageUrl] = useState<string>("");

    useEffect(() => {
        async function getProject(): Promise<ProjectObject> {
            const { data, error } = (await supabase.from('projects').select('*').eq('name', params.projectName));
            
            if(error) { throw error }
            return data[0];
        }

        getProject()
            .then(data => {
                setProject(data)
                if(!data.image_path) return
                setImageUrl(supabase.storage.from('images').getPublicUrl(data.image_path).data.publicUrl)   
            })
            .catch((error: PostgrestError) => console.error(error.message, error.details));
    }, [ params.projectName ])

    return project ? (
        <div className="grid flex-1 grid-cols-1 md:grid-cols-3 w-full h-full mt-20">
            <div className="dark:text-white">
                <h1 className="text-5xl font-semibold capitalize mb-7">{project.name}</h1>
                <h2 className="text-3xl font-semibold mb-5">Resume</h2>
                <p className="mb-7">{project.description}</p>
                <h2 className="text-3xl font-semibold mb-5">Project Stack</h2>
                <p>{project.stack}</p>
                <div className="flex flex-wrap justify-around">
                    <a href="http://" className="bg-[#4078c0] py-3 px-12 mt-6 rounded">Code</a>
                    <a href="http://" className="bg-[#bd2c00] py-3 px-12 mt-6 rounded">Prototype</a>
                </div>
            </div>
            <div className="w-full max-h-[50rem] col-span-2 relative mx-2 mb-4">
                <Image alt={project.image_path ?? ""} src={imageUrl} fill className='absolute rounded' />
            </div>
        </div>
    ) : (
        <div className="mt-20">
            <h1 className="text-5xl dark:text-white font-semibold">Project not found</h1>
        </div>
    )
}