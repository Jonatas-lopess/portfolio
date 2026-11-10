/**
 * The English Dictionary: the hand-edited Source text, and the single
 * definition of the Dictionary's shape. Add a string here and every other
 * Locale's file fails to type-check, and the parity test fails, until it has
 * the same key.
 */
export const en = {
    Meta: {
        Title: "Jonatas Lopes - Portfolio",
        Description: "Full-stack developer in Rio de Janeiro, building web, mobile and desktop software since 2019."
    },
    NavBar: {
        Home: "Home",
        Projects: "Projects",
        About: "About",
        Language: "Language",
        DarkTheme: "Dark theme"
    },
    Home: {
        Subtitle: "Full Stack Developer",
        Intro: "I build web, mobile and desktop software, from the database to the interface.",
        ViewProjects: "View projects"
    },
    About: {
        Title: "About me",
        Text: "Full-stack developer, active since 2019 across professional experience and personal projects, with emphasis on PHP/Laravel and React for web, React Native and Flutter for mobile, and Tauri for desktop. Solid knowledge of SQL/NoSQL databases with hands-on experience using tools like Supabase and MongoDB Atlas. Focused on AI-assisted development, applying design patterns such as DDD, TDD, and SDD.",
        LinksHeading: "Links",
        CVDownload: "Download CV",
        LocationLabel: "Location",
        Location: "Rio de Janeiro, Brazil",
        LanguagesLabel: "Languages",
        Languages: "Portuguese (native), English (intermediate, B1)",
        ExperienceHeading: "Experience",
        Job1Role: "Freelancer",
        Job1Company: "Online Vehicle Inspection Website - AMD Brazil",
        Job1Period: "Dec 2022 - Apr 2023",
        Job1Summary: "Replaced in-person vehicle inspections with a remote 20+ step flow in React/Next.js, with photo and video capture per step. Built a custom video capture tool on getUserMedia/MediaRecorder after third-party libraries failed on Safari iOS.",
        Job2Role: "Freelancer",
        Job2Company: "Institutional Website - Shooting Club 76",
        Job2Period: "Oct 2020 - Jan 2021",
        Job2Summary: "Designed a custom content management system in Laravel so the client can edit carousels, copy, contact info and services through an admin panel. Set up hosting, database, domain, SSL and a contact form with email delivery.",
        Job3Role: "Full-Stack Developer",
        Job3Company: "Zemis Technology",
        Job3Period: "Jun 2020 - Feb 2021",
        Job3Summary: "Took part in requirements gathering and planning for an internal system, integrated it with Unimed's database to look up affiliated physicians, and built a mobile document-scanning tool in React Native.",
        Job4Role: "Junior Developer - Full-Stack Developer",
        Job4Company: "Agência Maior",
        Job4Period: "Oct 2019 - Jun 2020",
        Job4Summary: "Sole developer maintaining the company's legacy PHP websites and applications, and adapting published sites for responsiveness with CSS and Bootstrap on web and React Native on mobile."
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
