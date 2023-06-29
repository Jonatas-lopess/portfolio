'use client'

import data from '@/data/data';
import Image from 'next/image'
import { MouseEvent } from 'react'

export default function Projects() {
    const projects = data;

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
        <div className="flex flex-1 dark:text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 w-full mt-20 space-x-4">
                <div className="w-full h-full space-y-10 capitalize">
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
                <div id="list-images" className="w-full col-span-2 relative invisible md:visible">
                    {
                        projects.map((e, i) => <Image key={`image_${i}`} alt={e.name} src={e.image} className='w-full h-full absolute object-fill opacity-0 transition-opacity duration-700 rounded-tl-lg' />)
                    }
                </div>
            </div>
        </div>
    )
}