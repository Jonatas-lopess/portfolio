'use client'

import cidade from '@/public/cidade.jpg'
import cachorro from '@/public/cachorro.webp'
import Image, { StaticImageData } from 'next/image'
import { MouseEvent } from 'react'

export default function Projects() {
    const projects: {name: string; image: StaticImageData}[] = [
        {name: 'cachorro', image: cachorro},
        {name: 'prédios', image: cidade}
    ]

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
                    <div className="flex justify-between border-b border-black dark:border-white">
                        <h1>Projects</h1>
                        <span>{projects.length}</span>
                    </div>
                    <ul id="list-itens" className="space-y-2 text-black dark:text-white text-opacity-25 dark:text-opacity-25" >
                        {
                            projects.map((e, i) => <li key={`project_${i}`}  className='hover:text-black dark:hover:text-white hover:text-opacity-100 cursor-pointer' onMouseOver={listMouseOverBehavior} onMouseOut={listMouseOutBehavior}>{e.name}</li>)
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