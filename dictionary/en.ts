/**
 * The English Dictionary: the hand-edited Source text, and the single
 * definition of the Dictionary's shape. Add a string here and every other
 * Locale's file fails to type-check, and the parity test fails, until it has
 * the same key.
 */
export const en = {
    Meta: {
        Title: "Jonatas Lopes - Portfolio",
        Description: "Discover my career in programming: 6 years of study and more than 1 year of professional experience."
    },
    NavBar: {
        Home: "Home",
        Projects: "Projects",
        About: "About",
        Language: "Language",
        DarkTheme: "Dark theme"
    },
    Home: {
        Subtitle: "Full Stack Developer"
    },
    About: {
        Title: "About me",
        Text: "Full-stack developer, active since 2019 across professional experience and personal projects, with emphasis on PHP/Laravel and React for web, React Native and Flutter for mobile, and Tauri for desktop. Solid knowledge of SQL/NoSQL databases with hands-on experience using tools like Supabase and MongoDB Atlas. Focused on AI-assisted development, applying design patterns such as DDD, TDD, and SDD.",
        LinksHeading: "Links",
        CVDownload: "Download CV"
    },
    Projects: {
        Title: "Projects",
        CountLabel: "Number of projects",
        Breadcrumb: "Portfolio / Selected work",
        Intro: "A selection of projects, from ideas to working software.",
        IndexLabel: "Project index",
        Explore: "Explore the work",
        ViewProject: "View project",
        FooterBreadcrumb: "Portfolio / Projects",
        BackToTop: "Back to top"
    },
    ProjectInfo: {
        Summary: "Project summary",
        Stack: "Project Stack",
        CodeButton: "Code",
        VisitButton: "Visit",
        NotFound: "Project not found.",
        BackToProjects: "Back to projects"
    },
    Project: {
        Label: "Project",
        AllProjects: "All projects",
        ContinueExploring: "Continue exploring",
        Next: "Next",
        CoverLabel: "Project cover"
    }
};

/** The shape of one Locale's Dictionary, derived from English; string leaves are plain `string`. */
export type DictionaryEntry = typeof en;
