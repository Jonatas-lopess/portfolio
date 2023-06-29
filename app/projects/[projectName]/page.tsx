export default function ProjectName({ params }: { params: { projectName: string }}) {
    return (
        <div className="mt-20">
            <h1 className="text-5xl dark:text-white font-semibold capitalize">{params.projectName}</h1>
        </div>
    )
}