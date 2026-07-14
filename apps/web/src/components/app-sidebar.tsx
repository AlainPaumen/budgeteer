import {
	Building2Icon,
	FrameIcon,
	LifeBuoyIcon,
	MapIcon,
	PieChartIcon,
	SendIcon,
	TerminalIcon,
} from "lucide-react";
import type * as React from "react";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},
	navMain: [
		{
			title: "Suppliers",
			url: "/suppliers",
			icon: <Building2Icon />,
		},
	],
	navSecondary: [
		{
			title: "Support",
			url: "#",
			icon: <LifeBuoyIcon />,
		},
		{
			title: "Feedback",
			url: "#",
			icon: <SendIcon />,
		},
	],
	projects: [
		{
			name: "Design Engineering",
			url: "#",
			icon: <FrameIcon />,
		},
		{
			name: "Sales & Marketing",
			url: "#",
			icon: <PieChartIcon />,
		},
		{
			name: "Travel",
			url: "#",
			icon: <MapIcon />,
		},
	],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { data: session } = authClient.useSession();

	const user = session?.user
		? {
				name: session.user.name || "User",
				email: session.user.email || "",
				avatar: session.user.image || "",
			}
		: data.user;

	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						{/* biome-ignore lint/a11y/useValidAnchor: placeholder link */}
						<SidebarMenuButton size="lg" render={<a href="#" />}>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								<TerminalIcon className="size-4" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">Acme Inc</span>
								<span className="truncate text-xs">Enterprise</span>
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Budget</SidebarGroupLabel>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton render={<a href="/suppliers" />}>
								<Building2Icon />
								<span>Suppliers</span>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
				<NavProjects projects={data.projects} />
				<NavSecondary items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	);
}
