import type { ComponentType, SVGProps } from "react";
import Download from "@/components/svg/Download";
import Github from "@/components/svg/Github";
import Linkedin from "@/components/svg/Linkedin";
import { getDictionary } from "@/lib/locale";
import { profileLinks, type ProfileLinkId } from "@/lib/profile-links";

const ICON_SIZE = 36;

const icons: Record<ProfileLinkId, ComponentType<SVGProps<SVGSVGElement>>> = {
    linkedin: Linkedin,
    github: Github,
    cv: Download,
};

/**
 * The LinkedIn, GitHub and CV links. `icons` (Home) shows the icons alone and
 * names each link with `aria-label`; `labelled` (About) shows the icon and its
 * name as text. The URLs live in `lib/profile-links.ts`; the CV name comes from
 * the Dictionary.
 */
export default function ProfileLinks({ variant, lang }: { variant: "icons" | "labelled"; lang: string }) {
    const links = profileLinks.map((link) => {
        const name = "name" in link ? link.name : getDictionary(lang).About.CVDownload;
        const Icon = icons[link.id];
        const icon = <Icon width={ICON_SIZE} height={ICON_SIZE} className="dark:fill-white" aria-hidden="true" />;
        // External links open in a new tab; the CV is a same-site file that downloads.
        const target = link.external ? { target: "_blank", rel: "noopener" } : { download: true };

        if (variant === "icons") {
            return <a key={link.id} href={link.href} aria-label={name} {...target}>{icon}</a>;
        }

        return (
            <div key={link.id} className="w-min">
                <a href={link.href} {...target} className={"flex items-center space-x-2 dark:text-white" + (link.external ? "" : " w-max")}>{icon}<span>{name}</span></a>
            </div>
        );
    });

    return variant === "icons"
        ? <div className="flex space-x-2 justify-center">{links}</div>
        : <div className=" flex flex-col space-y-4">{links}</div>;
}
