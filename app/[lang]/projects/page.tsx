import Image from 'next/image'
import supabase from '../../api/db'
import { ProjectObject } from '@/@types/project_object'
import { ImageObject } from '@/@types/image_object'
import dictionary from '@/dictionary/content'
import ListItem from '@/components/ListItem'

async function getData(): Promise<{ projects: ProjectObject[] | null, images: ImageObject[] }> {
    const { data: projects, error: projectsError } = await supabase.from('projects').select('name, image_path').order('created_at', { ascending: false });
    if(projectsError) { console.error(projectsError.message, projectsError.details) }

    const { data: imagesList, error: imagesError } = await supabase.storage.from('images').list();
    if(imagesError) { console.error(imagesError.name, imagesError.message) }

    let images: ImageObject[] = []

    imagesList?.map(e => images.push({
        name: e.name, 
        public_url: supabase.storage.from('images').getPublicUrl(e.name).data.publicUrl
    }))

    return { images, projects }
}

export default async function Projects({ params }: { params: { lang: string } }) {
    const { projects, images } = await getData();

    return (
            <div className="grid flex-1 grid-cols-1 md:grid-cols-3 w-full dark:text-white mt-20">
                <div className="w-full space-y-10 capitalize">
                    <div className="flex justify-between border-b border-black dark:border-white text-5xl">
                        <h1 className='font-semibold'>{dictionary[params.lang]?.Projects.Title}</h1>
                        <span>{projects ? projects.length : 0}</span>
                    </div>
                    <ul id="list-itens" className="space-y-3 text-black dark:text-white text-opacity-25 dark:text-opacity-25 text-3xl" >
                        {
                            projects?.map((e, i) => <ListItem key={`project_${i}`} data={e} />)
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