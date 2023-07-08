'use client'

import { ProjectObject } from '@/@types/project_object';
import { MouseEvent } from 'react'

export default function ListItem({ data }: { data: ProjectObject }) {
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

    return <li className='hover:text-black dark:hover:text-white hover:text-opacity-100 hover:translate-x-3 duration-200 cursor-pointer' onMouseOver={listMouseOverBehavior} onMouseOut={listMouseOutBehavior}>
        <a href={`/projects/${data.name}`}>{data.name}</a>
    </li>
}