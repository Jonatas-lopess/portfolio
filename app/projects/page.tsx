'use client'

import Image from 'next/image'
import { MouseEvent, useEffect, useState } from 'react'
import supabase from '../api/db'
import { PostgrestError } from '@supabase/supabase-js'
import { StorageError } from '@supabase/storage-js'
import { ProjectObject } from '@/@types/project_object'
import { ImageObject } from '@/@types/image_object'

export default function Projects() {
    const [projects, setProjects] = useState<ProjectObject[]>([]);
    const [images, setImages] = useState<ImageObject[]>([]);

    useEffect(() => {
        async function getProjects(): Promise<ProjectObject[]> {
            const { data, error } = await supabase.from('projects').select('name, image_path').order('created_at', { ascending: false });
            
            if(error) { throw error }
            return data;
        }

        async function getImages() {
            const { data, error } = await supabase.storage.from('images').list();

            if(error) { throw error }
            return data;
        }

        getProjects()
            .then(data => setProjects(data))
            .catch((error: PostgrestError) => console.error(error.message, error.details));
        
        getImages()
            .then(data => {
                let imageArray: ImageObject[] = []

                data.map(e => imageArray.push({
                    name: e.name, 
                    public_url: supabase.storage.from('images').getPublicUrl(e.name).data.publicUrl
                }))

                setImages(imageArray)
            })
            .catch((error: StorageError) => console.error(error.name, error.message));
    }, [])

    function listMouseOverBehavior(e: MouseEvent<HTMLLIElement>) {
        let textFromHoverElement = e.currentTarget.textContent?.toLowerCase();
        let correlateImageElement = document.querySelector(`#list-images img[alt="${textFromHoverElement}"]`);
        
        correlateImageElement?.classList.remove("opacity-0");
    }

    function listMouseOutBehavior(e: MouseEvent<HTMLLIElement>) {
        let textFromHoverElement = e.currentTarget.textContent?.toLowerCase();
        let correlateImageElement = document.querySelector(`#list-images img[alt="${textFromHoverElement}"]`);
        
        correlateImageElement?.classList.add("opacity-0");
    }
    
    return (
            <div className="grid flex-1 grid-cols-1 md:grid-cols-3 w-full dark:text-white mt-20">
                <div className="w-full space-y-10 capitalize">
                    <div className="flex justify-between border-b border-black dark:border-white text-5xl">
                        <h1 className='font-semibold'>Projects</h1>
                        <span>{projects.length}</span>
                    </div>
                    <ul id="list-itens" className="space-y-3 text-black dark:text-white text-opacity-25 dark:text-opacity-25 text-3xl" >
                        {
                            projects.map((e, i) => <li key={`project_${i}`}  className='hover:text-black dark:hover:text-white hover:text-opacity-100 hover:translate-x-3 duration-200 cursor-pointer' onMouseOver={listMouseOverBehavior} onMouseOut={listMouseOutBehavior}><a href={`/projects/${e.name}`}>{e.name}</a></li>)
                        }
                    </ul>
                </div>
                <div id="list-images" className="w-full max-h-[50rem] col-span-2 relative invisible md:visible mx-2 mb-4">
                    {
                        images.map((e, i) => <Image key={`image_${i}`} alt={e.name!} src={e.public_url!} fill className='absolute object-fill opacity-0 transition-opacity duration-700 rounded' />)
                    }
                </div>
            </div>
    )
}