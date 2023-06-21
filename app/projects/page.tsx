export default function Projects() {
    return (
        <div className="flex flex-1 dark:text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 w-full mt-20">
                <div className="w-full h-full space-y-10 capitalize">
                    <div className="flex justify-between border-b border-black dark:border-white">
                        <h1>Projects</h1>
                        <span>0</span>
                    </div>
                    <ul className="space-y-2">
                        <li>Item 1</li>
                        <li>Item 2</li>
                    </ul>
                </div>
                <div className="w-full h-full col-span-2"></div>
            </div>
        </div>
    )
}