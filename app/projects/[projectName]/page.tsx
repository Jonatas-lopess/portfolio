import data from "@/data/data"
import Image from "next/image";

export default function ProjectName({ params }: { params: { projectName: string }}) {
    const project = data.find(e => {return e.name === params.projectName});

    return project ? (
        <div className="grid grid-cols-1 md:grid-cols-3 w-full mt-20 space-x-4">
            <div className="dark:text-white">
                <h1 className="text-5xl font-semibold capitalize mb-7">{project.name}</h1>
                <h2 className="text-3xl font-semibold mb-5">Resume</h2>
                <p className="mb-7">{project.resume}</p>
                <h2 className="text-3xl font-semibold mb-5">Project Stack</h2>
                <p>{project.stack}</p>
            </div>
            <div className="w-full col-span-2">
                <Image alt={project.name} src={project.image} className='w-full rounded-l-lg' />
            </div>
        </div>
    ) : (
        <div className="mt-20">
            <h1 className="text-5xl dark:text-white font-semibold">Project not found</h1>
        </div>
    )
}