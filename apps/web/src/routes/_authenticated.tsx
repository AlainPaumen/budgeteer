import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async () => {
		try {
			const { data, error } = await authClient.getSession();
			console.log("session data:", data, "error:", error);
			if (!data?.user) {
				throw redirect({
					to: "/auth/login",
					search: { redirect: window.location.pathname },
				});
			}
		} catch (e) {
			console.error("getSession failed:", e);
			throw redirect({
				to: "/auth/login",
				search: { redirect: window.location.pathname },
			});
		}
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<SiteHeader />
				<main className="flex-1 p-6">
					<Outlet />
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
